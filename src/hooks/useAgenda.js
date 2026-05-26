// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, where, orderBy, onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import INITIAL_MOCK_DATA from '../constants/mockData';

// =========================================================================
// 2. [HELPER] — dDay 계산 함수
// =========================================================================
function computeDDay(deadline) {
  if (!deadline) return 'D-Day';
  const target = deadline.toDate ? deadline.toDate() : new Date(deadline);
  const diff = target - new Date();
  if (diff <= 0) return '마감';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `D-${days}`;
}

// =========================================================================
// 3. [HELPER] — Firebase 안건을 기존 형태로 변환
// 비유: 외국어 편지를 한글로 번역하는 것
//       Firebase 형태 → VoteView/MinimapView가 이해하는 형태
// =========================================================================
function normalizeAgenda(docData, docId) {
  const isExpired = docData.deadline?.toDate
    ? docData.deadline.toDate() <= new Date()
    : false;

  return {
    id: docId,
    title: docData.title,
    status: isExpired && docData.status !== '마감' ? '마감' : docData.status,
    dDay: computeDDay(docData.deadline),
    voters: docData.voters || 0,
    options: docData.options || [],
    voteLogs: [],
    earlyCloseRate: docData.early_close_rate || 70,
    deadline: docData.deadline,
    team_id: docData.team_id,
    creator_id: docData.creator_id,
    creator_name: docData.creator_name,
    isMock: false,
  };
}

// =========================================================================
// 4. [USE AGENDA HOOK] — 안건 CRUD + 실시간 동기화
// =========================================================================
function useAgenda(userId, userName) {
  // =========================================================================
  // 5. [STATE]
  // =========================================================================
  const [firebaseAgendas, setFirebaseAgendas] = useState([]);
  const [fbLoading, setFbLoading] = useState(true);

  const [mockDecisions, setMockDecisions] = useState(() => {
    try {
      const saved = localStorage.getItem('df_claude_mock_v2');
      return saved ? JSON.parse(saved) : INITIAL_MOCK_DATA;
    } catch { return INITIAL_MOCK_DATA; }
  });

  const [mockVotedIds, setMockVotedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('df_claude_mock_voted_v2');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('df_claude_mock_v2', JSON.stringify(mockDecisions));
      localStorage.setItem('df_claude_mock_voted_v2', JSON.stringify(mockVotedIds));
    } catch (e) {
      console.warn('localStorage 저장 실패:', e);
    }
  }, [mockDecisions, mockVotedIds]);

  // =========================================================================
  // 6. [SUBSCRIBE TEAM AGENDAS] — 팀별 안건 실시간 구독
  // =========================================================================
  const subscribeToTeamAgendas = useCallback((teamId, onUpdate) => {
    if (!teamId) return () => {};

    const q = query(
      collection(db, 'Agendas'),
      where('team_id', '==', teamId),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agendas = snapshot.docs.map(d => normalizeAgenda(d.data(), d.id));
      onUpdate(agendas);
    }, (error) => {
      console.error('❌ 안건 실시간 조회 실패:', error);
    });

    return unsubscribe;
  }, []);

  // =========================================================================
  // 7. [FETCH MY AGENDAS] — 홈 화면용 1회 조회
  // =========================================================================
  const fetchMyAgendas = useCallback(async (teamIds) => {
    if (!userId || !teamIds || teamIds.length === 0) {
      setFirebaseAgendas([]);
      setFbLoading(false);
      return;
    }

    setFbLoading(true);
    try {
      const batchIds = teamIds.slice(0, 30);
      const q = query(
        collection(db, 'Agendas'),
        where('team_id', 'in', batchIds),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      const agendas = snapshot.docs.map(d => normalizeAgenda(d.data(), d.id));
      setFirebaseAgendas(agendas);
    } catch (error) {
      console.error('❌ 안건 목록 조회 실패:', error);
    }
    setFbLoading(false);
  }, [userId]);

  // =========================================================================
  // 8. [CREATE AGENDA] — 안건 생성
  // =========================================================================
  const createAgenda = useCallback(async (data, teamId) => {
    if (!userId || !teamId) return { error: 'MISSING_PARAMS' };

    try {
      const agendaRef = doc(collection(db, 'Agendas'));
      const agendaData = {
        agenda_id: agendaRef.id,
        team_id: teamId,
        creator_id: userId,
        creator_name: userName || '익명',
        title: data.title,
        status: '진행중',
        voters: 0,
        options: data.options.map(o => ({ ...o, voteCount: 0 })),
        deadline: data.deadline || null,
        early_close_rate: data.earlyCloseRate || 70,
        created_at: serverTimestamp(),
      };

      await setDoc(agendaRef, agendaData);
      return { success: true, agendaId: agendaRef.id };
    } catch (error) {
      console.error('❌ 안건 생성 실패:', error);
      return { error: 'CREATE_FAILED' };
    }
  }, [userId, userName]);

  // =========================================================================
  // 9. [VOTE] — 투표 (1인 1표 서버 검증)
  // =========================================================================
  const submitVote = useCallback(async (agendaId, optionId, voterName, persona) => {
    if (!userId || !agendaId) return { error: 'MISSING_PARAMS' };

    try {
      const existingQuery = query(
        collection(db, 'Votes'),
        where('agenda_id', '==', agendaId),
        where('voter_id', '==', userId)
      );
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        return { error: 'ALREADY_VOTED' };
      }

      const voteRef = doc(collection(db, 'Votes'));
      await setDoc(voteRef, {
        vote_id: voteRef.id,
        agenda_id: agendaId,
        voter_id: userId,
        voter_name: voterName || userName || '익명',
        option_id: optionId,
        persona: persona || null,
        voted_at: serverTimestamp(),
      });

      const agendaRef = doc(db, 'Agendas', agendaId);
      const agendaSnap = await getDoc(agendaRef);
      if (agendaSnap.exists()) {
        const agendaData = agendaSnap.data();
        const updatedOptions = agendaData.options.map(o =>
          o.id === optionId ? { ...o, voteCount: (o.voteCount || 0) + 1 } : o
        );

        const votesQuery = query(
          collection(db, 'Votes'),
          where('agenda_id', '==', agendaId)
        );
        const votesSnap = await getDocs(votesQuery);

        await updateDoc(agendaRef, {
          options: updatedOptions,
          voters: votesSnap.size,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ 투표 실패:', error);
      return { error: 'VOTE_FAILED' };
    }
  }, [userId, userName]);

  // =========================================================================
  // 10. [KICK VOTE] — 투표 무효화 (방장)
  // =========================================================================
  const kickVote = useCallback(async (agendaId, voteId, optionId) => {
    if (!userId) return { error: 'NOT_AUTHENTICATED' };

    try {
      await deleteDoc(doc(db, 'Votes', voteId));

      const agendaRef = doc(db, 'Agendas', agendaId);
      const agendaSnap = await getDoc(agendaRef);
      if (agendaSnap.exists()) {
        const agendaData = agendaSnap.data();
        const updatedOptions = agendaData.options.map(o =>
          o.id === optionId ? { ...o, voteCount: Math.max(0, (o.voteCount || 0) - 1) } : o
        );

        const votesQuery = query(
          collection(db, 'Votes'),
          where('agenda_id', '==', agendaId)
        );
        const votesSnap = await getDocs(votesQuery);

        await updateDoc(agendaRef, {
          options: updatedOptions,
          voters: votesSnap.size,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ 투표 무효화 실패:', error);
      return { error: 'KICK_FAILED' };
    }
  }, [userId]);

  // =========================================================================
  // 11. [CLOSE AGENDA] — 안건 마감 (수동)
  // =========================================================================
  const closeAgenda = useCallback(async (agendaId) => {
    if (!userId) return { error: 'NOT_AUTHENTICATED' };
    try {
      await updateDoc(doc(db, 'Agendas', agendaId), { status: '마감' });
      return { success: true };
    } catch (error) {
      console.error('❌ 안건 마감 실패:', error);
      return { error: 'CLOSE_FAILED' };
    }
  }, [userId]);

  // =========================================================================
  // 12. [DELETE AGENDA] — 안건 삭제 (생성자만)
  // =========================================================================
  const deleteAgenda = useCallback(async (agendaId) => {
    if (!userId) return { error: 'NOT_AUTHENTICATED' };
    try {
      const votesQuery = query(
        collection(db, 'Votes'),
        where('agenda_id', '==', agendaId)
      );
      const votesSnap = await getDocs(votesQuery);
      for (const voteDoc of votesSnap.docs) {
        await deleteDoc(voteDoc.ref);
      }
      await deleteDoc(doc(db, 'Agendas', agendaId));
      return { success: true };
    } catch (error) {
      console.error('❌ 안건 삭제 실패:', error);
      return { error: 'DELETE_FAILED' };
    }
  }, [userId]);

  // =========================================================================
  // 13. [GET VOTE LOGS] — 투표 기록 조회 (VoteView 방장 화면용)
  // =========================================================================
  const getVoteLogs = useCallback(async (agendaId) => {
    try {
      const q = query(
        collection(db, 'Votes'),
        where('agenda_id', '==', agendaId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        logId: d.id,
        userName: d.data().voter_name,
        optionId: d.data().option_id,
        persona: d.data().persona,
        voterId: d.data().voter_id,
      }));
    } catch (error) {
      console.error('❌ 투표 기록 조회 실패:', error);
      return [];
    }
  }, []);

  // =========================================================================
  // 14. [GET AGENDA WITH LOGS] — 안건 + voteLogs 합성 (VoteView 전달용)
  // 비유: 시험지(안건)와 답안지(투표기록)를 합쳐서 전달
  // =========================================================================
  const getAgendaWithLogs = useCallback(async (agendaId) => {
    try {
      const agendaSnap = await getDoc(doc(db, 'Agendas', agendaId));
      if (!agendaSnap.exists()) return null;

      const agenda = normalizeAgenda(agendaSnap.data(), agendaSnap.id);
      const logs = await getVoteLogs(agendaId);
      return { ...agenda, voteLogs: logs };
    } catch (error) {
      console.error('❌ 안건+투표 조회 실패:', error);
      return null;
    }
  }, [getVoteLogs]);

  // =========================================================================
  // 15. [CHECK HAS VOTED] — 투표 여부 확인
  // =========================================================================
  const checkHasVoted = useCallback(async (agendaId) => {
    if (!userId || !agendaId) return false;
    try {
      const q = query(
        collection(db, 'Votes'),
        where('agenda_id', '==', agendaId),
        where('voter_id', '==', userId)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch {
      return false;
    }
  }, [userId]);

  // =========================================================================
  // 16. [MOCK HANDLERS] — 목데이터 전용 (로컬, 1인 다표)
  // =========================================================================
  const mockVoteSubmit = useCallback((decisionId, optionId, vName, persona) => {
    setMockDecisions(prev => prev.map(d => {
      if (d.id !== decisionId) return d;
      return {
        ...d,
        voters: d.voters + 1,
        options: d.options.map(o =>
          o.id === optionId ? { ...o, voteCount: (o.voteCount || 0) + 1 } : o
        ),
        voteLogs: [...(d.voteLogs || []),
          { logId: Date.now(), userName: vName, optionId, persona }],
      };
    }));
  }, []);

  const mockKickUser = useCallback((decisionId, logId, optionId) => {
    setMockDecisions(prev => prev.map(d => {
      if (d.id !== decisionId) return d;
      return {
        ...d,
        voters: Math.max(0, d.voters - 1),
        options: d.options.map(o =>
          o.id === optionId
            ? { ...o, voteCount: Math.max(0, (o.voteCount || 0) - 1) }
            : o
        ),
        voteLogs: (d.voteLogs || []).filter(l => l.logId !== logId),
      };
    }));
  }, []);

  const mockDeleteDecision = useCallback((decisionId) => {
    setMockDecisions(prev => prev.filter(d => d.id !== decisionId));
  }, []);

  // =========================================================================
  // 17. [COMBINED DATA]
  // =========================================================================
  const allDecisions = useMemo(() => {
    return [...mockDecisions, ...firebaseAgendas];
  }, [mockDecisions, firebaseAgendas]);

  // =========================================================================
  // 18. [RETURN]
  // =========================================================================
  return {
    allDecisions,
    firebaseAgendas,
    mockDecisions,
    mockVotedIds,
    fbLoading,

    fetchMyAgendas,
    subscribeToTeamAgendas,
    createAgenda,
    submitVote,
    kickVote,
    closeAgenda,
    deleteAgenda,
    getVoteLogs,
    getAgendaWithLogs,
    checkHasVoted,

    mockVoteSubmit,
    mockKickUser,
    mockDeleteDecision,
  };
}

export default useAgenda;