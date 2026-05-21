// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useState } from 'react';

import useDecisionEngine from './hooks/useDecisionEngine';
import useAuth from './hooks/useAuth';
import useTeam from './hooks/useTeam';

import Toast from './components/common/Toast';
import BottomNav from './components/common/BottomNav';
import PopupModal from './components/common/PopupModal';
import CreateTeamModal from './components/common/CreateTeamModal';
import JoinTeamModal from './components/common/JoinTeamModal';

import HomeView from './components/views/HomeView';
import CreateView from './components/views/CreateView';
import VoteView from './components/views/VoteView';
import MinimapView from './components/views/MinimapView';
import VisualMapView from './components/views/VisualMapView';
import MyRoomView from './components/views/MyRoomView';
import NotificationView from './components/views/NotificationView';
import SettingsView from './components/views/SettingsView';
import TeamDetailView from './components/views/TeamDetailView';

// =========================================================================
// 2. [APP COMPONENT]
// =========================================================================
export default function App() {
  const { user, loading: authLoading, userId } = useAuth();
  const engine = useDecisionEngine();
  const team = useTeam(userId);
  const isAdmin = new URLSearchParams(window.location.search).get('token') === 'admin';

  // 🔥 Phase B: 모달 및 팀 상세 상태
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [userName, setUserName] = useState('');

  // =========================================================================
  // 3. [AUTH LOADING]
  // =========================================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex justify-center items-center font-sans">
        <div className="w-full max-w-md bg-white h-[850px] max-h-screen relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8668A]" />
          <p className="mt-4 text-sm text-gray-400">연결 중...</p>
        </div>
      </div>
    );
  }

  if (userId) {
    console.log('🔑 현재 내 ID:', userId);
  }

  // =========================================================================
  // 4. [TEAM DETAIL HANDLER]
  // =========================================================================
  const handleClickTeam = (teamId) => {
    setSelectedTeamId(teamId);
    engine.setView('teamDetail');
  };

  // =========================================================================
  // 5. [RENDER]
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex justify-center items-center font-sans">
      <div className="w-full max-w-md bg-white h-[850px] max-h-screen relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">

        {engine.view === 'home' && (
          <HomeView
            setView={engine.setView}
            showToast={engine.showToast}
            decisions={engine.decisions}
            onSelectId={id => { engine.setSelectedId(id); engine.setView('vote'); }}
            myCreatedTeams={team.myCreatedTeams}
            myJoinedTeams={team.myJoinedTeams}
            teamsLoading={team.loading}
            onOpenCreateTeam={() => setShowCreateTeam(true)}
            onOpenJoinTeam={() => setShowJoinTeam(true)}
            onClickTeam={handleClickTeam}
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
            onKick={engine.handleKickUser}
          />
        )}

        {engine.view === 'minimap' && engine.currentDecision && (
          <MinimapView decision={engine.currentDecision} setView={engine.setView} />
        )}

        {engine.view === 'visualmap' && engine.currentDecision && (
          <VisualMapView decision={engine.currentDecision} setView={engine.setView} />
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

        {engine.view === 'notifications' && (
          <NotificationView setView={engine.setView} />
        )}

        {engine.view === 'settings' && (
          <SettingsView setView={engine.setView} />
        )}

        {engine.view === 'teamDetail' && selectedTeamId && (
          <TeamDetailView
            teamId={selectedTeamId}
            setView={engine.setView}
            getTeamDetail={team.getTeamDetail}
            userId={userId}
            onDeleteTeam={team.deleteTeam}
            onLeaveTeam={team.leaveTeam}
            showToast={engine.showToast}
          />
        )}

        {engine.toast && <Toast message={engine.toast} />}
        <BottomNav view={engine.view} setView={engine.setView} />

        {/* ============================================================= */}
        {/* 모달 */}
        {/* ============================================================= */}
        {showCreateTeam && (
          <CreateTeamModal
            onClose={() => setShowCreateTeam(false)}
            onCreate={team.createTeam}
            showToast={engine.showToast}
            existingName={userName}
          />
        )}

        {showJoinTeam && (
          <JoinTeamModal
            onClose={() => setShowJoinTeam(false)}
            onJoin={team.joinTeam}
            showToast={engine.showToast}
          />
        )}
      </div>
    </div>
  );
}