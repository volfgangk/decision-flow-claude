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
// =========================================================================
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// =========================================================================
// 3. [USE TEAM HOOK] — 팀 CRUD + 이름 관리 훅
// =========================================================================
function useTeam(userId) {
  const [myCreatedTeams, setMyCreatedTeams] = useState([]);
  const [myJoinedTeams, setMyJoinedTeams] = useState([]);
  const [userName, setUserName] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // 4. [FETCH USER PROFILE] — 사용자 이름 불러오기
  // =========================================================================
  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const userSnap = await getDoc(doc(db, 'Users', userId));
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserName(data.name || '');
        setIsPremium(data.is_premium || false);
      }
    } catch (error) {
      console.error('❌ 사용자 프로필 불러오기 실패:', error);
    }
  }, [userId]);

  // =========================================================================
  // 5. [FETCH TEAMS] — 내 팀 목록 불러오기
  // =========================================================================
  const fetchMyTeams = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const createdQuery = query(
        collection(db, 'Teams'),
        where('admin_id', '==', userId)
      );
      const createdSnap = await getDocs(createdQuery);
      const created = createdSnap.docs.map(d => ({ id: d.id, ...d.data() }));

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
    fetchUserProfile();
    fetchMyTeams();
  }, [fetchUserProfile, fetchMyTeams]);

  // =========================================================================
  // 6. [CREATE TEAM] — 팀 생성
  // =========================================================================
  const createTeam = useCallback(async (teamName, maxMembers, inputUserName) => {
    if (!userId) return null;

    const maxCreate = isPremium ? 999 : 2;
    if (myCreatedTeams.length >= maxCreate) {
      return { error: 'LIMIT_REACHED' };
    }

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

      await updateDoc(doc(db, 'Users', userId), {
        joined_team_ids: arrayUnion(teamRef.id),
        name: inputUserName.trim(),
      });

      setUserName(inputUserName.trim());
      await fetchMyTeams();
      return { success: true, teamId: teamRef.id, inviteCode };
    } catch (error) {
      console.error('❌ 팀 생성 실패:', error);
      return { error: 'CREATE_FAILED' };
    }
  }, [userId, isPremium, myCreatedTeams.length, fetchMyTeams]);

  // =========================================================================
  // 7. [JOIN TEAM] — 팀 참여 (초대코드 + 이름)
  // =========================================================================
  const joinTeam = useCallback(async (inviteCode, inputUserName) => {
    if (!userId) return { error: 'NOT_AUTHENTICATED' };

    const maxJoin = isPremium ? 999 : 3;
    if (myJoinedTeams.length >= maxJoin) {
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

      if (teamData.member_ids.includes(userId)) {
        return { error: 'ALREADY_JOINED' };
      }

      if (teamData.member_ids.length >= teamData.max_members) {
        return { error: 'TEAM_FULL' };
      }

      await updateDoc(doc(db, 'Teams', teamDoc.id), {
        member_ids: arrayUnion(userId),
      });

      await updateDoc(doc(db, 'Users', userId), {
        joined_team_ids: arrayUnion(teamDoc.id),
        name: inputUserName.trim(),
      });

      setUserName(inputUserName.trim());
      await fetchMyTeams();
      return { success: true, teamName: teamData.team_name };
    } catch (error) {
      console.error('❌ 팀 참여 실패:', error);
      return { error: 'JOIN_FAILED' };
    }
  }, [userId, isPremium, myJoinedTeams.length, fetchMyTeams]);

  // =========================================================================
  // 8. [LEAVE TEAM] — 팀 탈퇴
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
  // 9. [DELETE TEAM] — 팀 삭제 (팀장만)
  // =========================================================================
  const deleteTeam = useCallback(async (teamId) => {
    if (!userId) return;
    try {
      const teamRef = doc(db, 'Teams', teamId);
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) return { error: 'NOT_FOUND' };

      const teamData = teamSnap.data();
      if (teamData.admin_id !== userId) return { error: 'NOT_ADMIN' };

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
  // 10. [GET TEAM DETAIL] — 팀 상세 정보
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
  // 11. [UPDATE USER NAME] — 이름 변경 (마이룸)
  // =========================================================================
  const updateUserName = useCallback(async (newName) => {
    if (!userId) return { error: 'NOT_AUTHENTICATED' };
    try {
      await updateDoc(doc(db, 'Users', userId), {
        name: newName.trim(),
      });
      setUserName(newName.trim());
      return { success: true };
    } catch (error) {
      console.error('❌ 이름 변경 실패:', error);
      return { error: 'UPDATE_FAILED' };
    }
  }, [userId]);

  // =========================================================================
  // 12. [RETURN]
  // =========================================================================
  return {
    myCreatedTeams,
    myJoinedTeams,
    userName,
    isPremium,
    loading,
    createTeam,
    joinTeam,
    leaveTeam,
    deleteTeam,
    getTeamDetail,
    updateUserName,
    refreshTeams: fetchMyTeams,
  };
}

export default useTeam;