// =========================================================================
// 1. [IMPORTS] — 외부 도구 가져오기
// =========================================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';

import { DESIGN_TOKENS } from './constants/colors';
import TreeEngine from './utils/treeEngine';
import useDecisionEngine from './hooks/useDecisionEngine';
import useAuth from './hooks/useAuth';               // ← 🔥 Phase A 추가
import Toast from './components/common/Toast';
import BottomNav from './components/common/BottomNav';
import PopupModal from './components/common/PopupModal';
import HomeView from './components/views/HomeView';
import CreateView from './components/views/CreateView';
import VoteView from './components/views/VoteView';

// ── MINIMAP VIEW ───────────────────────────────────────────────────────────
import MinimapView from './components/views/MinimapView';

// ── VISUAL MAP VIEW ────────────────────────────────────────────────────────
import VisualMapView from './components/views/VisualMapView';
import MyRoomView from './components/views/MyRoomView';
import NotificationView from './components/views/NotificationView';
import SettingsView from './components/views/SettingsView';

// =========================================================================
// 2. [APP COMPONENT] — 메인 라우터
// =========================================================================
export default function App() {
  // 🔥 Phase A: 익명 인증 (팔찌 자동 발급)
  const { user, loading, userId } = useAuth();

  const engine  = useDecisionEngine();
  const isAdmin = new URLSearchParams(window.location.search).get('token') === 'admin';

  // 🔥 Phase A: 인증 완료 전 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex justify-center items-center font-sans">
        <div className="w-full max-w-md bg-white h-[850px] max-h-screen relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8668A]" />
          <p className="mt-4 text-sm text-gray-400">연결 중...</p>
        </div>
      </div>
    );
  }

  // 🔥 Phase A: 연결 확인 로그 (개발 중에만 사용, 나중에 삭제 가능)
  if (userId) {
    console.log('🔑 현재 내 ID:', userId);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex justify-center items-center font-sans">
      <div className="w-full max-w-md bg-white h-[850px] max-h-screen relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
        {engine.view === 'home' && (
          <HomeView
            setView={engine.setView}
            showToast={engine.showToast}
            decisions={engine.decisions}
            onSelectId={id => { engine.setSelectedId(id); engine.setView('vote'); }}
          />
        )}
        {engine.view === 'create' && (
          <CreateView setView={engine.setView} onPublish={engine.handlePublish} />
        )}
        {engine.view === 'vote' && engine.currentDecision && (
          <VoteView
            decision={engine.currentDecision}
            setView={engine.setView}
            onVoteSubmit={engine.handleVoteSubmit}
            hasVoted={engine.hasVoted}
            showToast={engine.showToast}
            isAdmin={isAdmin}
            onKickUser={engine.handleKickUser}
          />
        )}
        {engine.view === 'minimap' && engine.currentDecision && (
          <MinimapView
            decision={engine.currentDecision}
            setView={engine.setView}
          />
        )}
        {engine.view === 'visualmap' && engine.currentDecision && (
          <VisualMapView
            decision={engine.currentDecision}
            setView={engine.setView}
          />
        )}
        {engine.view === 'myroom' && (
          <MyRoomView
            setView={engine.setView}
            decisions={engine.decisions}
            votedIds={engine.votedIds || []}
            onSelectId={id => { engine.setSelectedId(id); engine.setView('vote'); }}
            onDelete={engine.handleDeleteDecision}
          />
        )}
        {engine.view === 'notification' && (
          <NotificationView setView={engine.setView} />
        )}
        {engine.view === 'settings' && (
          <SettingsView setView={engine.setView} />
        )}

        {engine.toast && <Toast message={engine.toast} />}

        <BottomNav current={engine.view} setView={engine.setView} />
      </div>
    </div>
  );
}