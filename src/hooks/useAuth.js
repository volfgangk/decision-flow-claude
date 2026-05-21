// =========================================================================
// 1. [IMPORTS] — 필요한 도구 가져오기
// =========================================================================
import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// =========================================================================
// 2. [ENSURE USER DOC] — 사용자 문서 존재 보장 함수
// 비유: 놀이공원 입장 시 "처음 오셨네요?" → 회원 카드 자동 발급
//       "다시 오셨네요?" → 기존 카드 확인
// =========================================================================
async function ensureUserDoc(uid) {
  try {
    const userRef  = doc(db, 'Users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // 처음 방문 → 새 문서 생성
      await setDoc(userRef, {
        user_id:         uid,
        name:            null,
        joined_team_ids: [],
        is_premium:      false,
        created_at:      serverTimestamp(),
      });
      console.log('🆕 새 사용자 등록 완료:', uid);
    } else {
      console.log('✅ 기존 사용자 확인:', uid);
    }
  } catch (error) {
    console.error('❌ 사용자 문서 처리 실패:', error);
  }
}

// =========================================================================
// 3. [USE AUTH HOOK] — 익명 인증 자동 관리 훅
// 비유: 놀이공원 입구의 자동 팔찌 발급기
//       → 들어오면 자동 발급, 나갔다 다시 오면 같은 팔찌 인식
// =========================================================================
function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 감시 시작 (입구에서 팔찌 확인하는 직원)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 팔찌가 있음 → 통과
        setUser(firebaseUser);
        await ensureUserDoc(firebaseUser.uid);
        setLoading(false);
      } else {
        // 팔찌가 없음 → 자동 발급
        try {
          await signInAnonymously(auth);
          // ↑ 발급 완료 후 onAuthStateChanged가 다시 호출됨
        } catch (error) {
          console.error('❌ 익명 인증 실패:', error);
          setLoading(false);
        }
      }
    });

    // 컴포넌트 해제 시 감시 중단
    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    userId: user?.uid || null,
  };
}

export default useAuth;