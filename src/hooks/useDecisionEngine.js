// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import { useState, useCallback } from 'react';

// =========================================================================
// 2. [USE DECISION ENGINE] — UI 상태 관리 전용
// 비유: 리모컨 — 어떤 화면을 보여줄지, 알림을 띄울지만 관리
// =========================================================================
function useDecisionEngine() {
  const [view, setView] = useState('home');
  const [toast, setToast] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  // =========================================================================
  // 3. [TOAST]
  // =========================================================================
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // =========================================================================
  // 4. [RETURN]
  // =========================================================================
  return {
    view,
    setView,
    toast,
    showToast,
    selectedId,
    setSelectedId,
    selectedTeamId,
    setSelectedTeamId,
  };
}

export default useDecisionEngine;