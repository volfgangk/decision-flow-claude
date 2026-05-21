// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, arrayUnion, arrayRemove,
  query, where, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// =========================================================================
// 2. [INVITE CODE GENERATOR] — 6자리 초대코드 생성
// 비유: 복권 번호 자동 생성기 — 영문 대문자 + 숫자 조합
// =========================================================================
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외 (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// =========================================================================
// 3. [USE TEAM HOOK] — 팀 CRUD 관리 훅
// 비유: 동아리 관리 사무실
//   → 개설, 가입, 목록 조회, 탈퇴, 삭제 전부 여기서 처리
// =========================================================================
function useTeam(userId) {
  const [myCreatedTeams, setMyCreatedTeams] = useState([]);
  const [myJoinedTeams, setMyJoinedTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // 4. [FETCH TEAMS] — 내 팀 목록 불러오기
  // =========================================================================
  const fetchMyTeams = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 내가 만든 팀
      const createdQuery = query(
        collection(db, 'Teams'),
        where('admin_id', '==', userId)
      );
      const createdSnap = await getDocs(createdQuery);
      const created = createdSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 내가 참여한 팀 (내가 만든 팀 제외)
      const joinedQuery = query(
        collection(db, 'Teams'),
        where('member_ids', 'array-contains', userId)
      );
      const joinedSnap = await getDocs(joinedQuery);
      const allJoined = joinedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const joined = allJoined.filter(t => t.admin_id !== userId);

      setMyCreatedTeams(created);
      setMyJoinedTeams(joined);
    } catch (error) {
      console.error('❌ 팀 목록 불러오기 실패:', error);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  // =========================================================================
  // 5. [CREATE TEAM] — 팀 생성
  // =========================================================================
  const createTeam = useCallback(async (teamName, maxMembers, userName) => {
    if (!userId) return null;

    // 무료 유저 팀 생성 제한 (2개)
    if (myCreatedTeams.length >= 2) {
      return { error: 'LIMIT_REACHED' };
    }

    // 초대코드 중복 방지 (최대 5회 시도)
    let inviteCode = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      inviteCode = generateInviteCode();
      const codeQuery = query(
        collection(db, 'Teams'),
        where('invite_code', '==', inviteCode)
      );
      const codeSnap = await getDocs(codeQuery);
      if (codeSnap.empty) break;
      if (attempt === 4) return { error: 'CODE_GENERATION_FAILED' };
    }

    try {
      const teamRef = doc(collection(db, 'Teams'));
      const teamData = {
        team_id: teamRef.id,
        team_name: teamName.trim(),
        invite_code: inviteCode,
        admin_id: userId,
        member_ids: [userId],
        max_members: maxMembers,
        created_at: serverTimestamp(),
      };

      await setDoc(teamRef, teamData);

      // 내 Users 문서에 팀 추가
      const userRef = doc(db, 'Users', userId);
      await updateDoc(userRef, {
        joined_team_ids: arrayUnion(teamRef.id),
        name: userName.trim(),
      });

      await fetchMyTeams();
      return { success: true, teamId: teamRef.id, inviteCode };
    } catch (error) {
      console.error('❌ 팀 생성 실패:', error);
      return { error: 'CREATE_FAILED' };
    }
  }, [userId, myCreatedTeams.length, fetchMyTeams]);

  // =========================================================================
  // 6. [JOIN TEAM] — 팀 참여 (초대코드)
  // =========================================================================
  const joinTeam = useCallback(async (inviteCode) => {
    if (!userId) return { error: 'NOT_AUTHENTICATED' };

    // 무료 유저 참여 제한 (3개 = 생성 + 참여 합산이 아니라 참여만)
    if (myJoinedTeams.length >= 3) {
      return { error: 'JOIN_LIMIT_REACHED' };
    }

    try {
      const codeQuery = query(
        collection(db, 'Teams'),
        where('invite_code', '==', inviteCode.toUpperCase().trim())
      );
      const codeSnap = await getDocs(codeQuery);

      if (codeSnap.empty) {
        return { error: 'TEAM_NOT_FOUND' };
      }

      const teamDoc = codeSnap.docs[0];
      const teamData = teamDoc.data();

      // 이미 참여한 팀인지 확인
      if (teamData.member_ids.includes(userId)) {
        return { error: 'ALREADY_JOINED' };
      }

      // 인원 초과 확인
      if (teamData.member_ids.length >= teamData.max_members) {
        return { error: 'TEAM_FULL' };
      }

      // 팀에 나를 추가
      await updateDoc(doc(db, 'Teams', teamDoc.id), {
        member_ids: arrayUnion(userId),
      });

      // 내 Users 문서에 팀 추가
      await updateDoc(doc(db, 'Users', userId), {
        joined_team_ids: arrayUnion(teamDoc.id),
      });

      await fetchMyTeams();
      return { success: true, teamName: teamData.team_name };
    } catch (error) {
      console.error('❌ 팀 참여 실패:', error);
      return { error: 'JOIN_FAILED' };
    }
  }, [userId, myJoinedTeams.length, fetchMyTeams]);

  // =========================================================================
  // 7. [LEAVE TEAM] — 팀 탈퇴
  // =========================================================================
  const leaveTeam = useCallback(async (teamId) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'Teams', teamId), {
        member_ids: arrayRemove(userId),
      });
      await updateDoc(doc(db, 'Users', userId), {
        joined_team_ids: arrayRemove(teamId),
      });
      await fetchMyTeams();
      return { success: true };
    } catch (error) {
      console.error('❌ 팀 탈퇴 실패:', error);
      return { error: 'LEAVE_FAILED' };
    }
  }, [userId, fetchMyTeams]);

  // =========================================================================
  // 8. [DELETE TEAM] — 팀 삭제 (팀장만 가능)
  // =========================================================================
  const deleteTeam = useCallback(async (teamId) => {
    if (!userId) return;
    try {
      const teamRef = doc(db, 'Teams', teamId);
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) return { error: 'NOT_FOUND' };

      const teamData = teamSnap.data();
      if (teamData.admin_id !== userId) return { error: 'NOT_ADMIN' };

      // 모든 팀원의 Users 문서에서 팀 제거
      for (const memberId of teamData.member_ids) {
        try {
          await updateDoc(doc(db, 'Users', memberId), {
            joined_team_ids: arrayRemove(teamId),
          });
        } catch (e) {
          console.warn('팀원 문서 업데이트 실패:', memberId);
        }
      }

      await deleteDoc(teamRef);
      await fetchMyTeams();
      return { success: true };
    } catch (error) {
      console.error('❌ 팀 삭제 실패:', error);
      return { error: 'DELETE_FAILED' };
    }
  }, [userId, fetchMyTeams]);

  // =========================================================================
  // 9. [GET TEAM DETAIL] — 팀 상세 정보
  // =========================================================================
  const getTeamDetail = useCallback(async (teamId) => {
    try {
      const teamSnap = await getDoc(doc(db, 'Teams', teamId));
      if (!teamSnap.exists()) return null;
      return { id: teamSnap.id, ...teamSnap.data() };
    } catch (error) {
      console.error('❌ 팀 상세 조회 실패:', error);
      return null;
    }
  }, []);

  // =========================================================================
  // 10. [RETURN] — 외부에 내보내기
  // =========================================================================
  return {
    myCreatedTeams,
    myJoinedTeams,
    loading,
    createTeam,
    joinTeam,
    leaveTeam,
    deleteTeam,
    getTeamDetail,
    refreshTeams: fetchMyTeams,
  };
}

export default useTeam;