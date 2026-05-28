// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Zap, Coffee, Calendar, Users } from 'lucide-react';

import useDecisionEngine from './hooks/useDecisionEngine';
import useAuth from './hooks/useAuth';
import useTeam from './hooks/useTeam';
import useAgenda from './hooks/useAgenda';

import Toast from './components/common/Toast';
import BottomNav from './components/common/BottomNav';
import CreateTeamModal from './components/common/CreateTeamModal';
import JoinTeamModal from './components/common/JoinTeamModal';
import PublishModal from './components/common/PublishModal';

import SplashView from './components/views/SplashView';
import HomeView from './components/views/HomeView';
import CreateView from './components/views/CreateView';
import VoteView from './components/views/VoteView';
import MinimapView from './components/views/MinimapView';
import VisualMapView from './components/views/VisualMapView';
import MyRoomView from './components/views/MyRoomView';
import NotificationView from './components/views/NotificationView';
import SettingsView from './components/views/SettingsView';
import TeamDetailView from './components/views/TeamDetailView';
import TEMPLATES from './constants/templates';

// =========================================================================
// 2. [LANDING VIEW] — 슬라이드 2 (최초 사용자용 심플 화면)
// 팀/안건이 없는 사용자에게만 보이는 화면
// =========================================================================
const LandingView = ({ onCreateAgenda, showToast }) => {
  return (
    <>
      <header className="px-6 pt-4 pb-1 bg-white shrink-0">
        <h1 className="text-[13px] font-black text-gray-300 tracking-widest">DECISION FLOW</h1>
      </header>

      <main className="flex-1 px-5 pb-24 overflow-y-auto bg-white flex flex-col justify-center">
        {/* 새 안건 만들기 버튼 — 화면 중앙에 크게 */}
        <div className="mb-10">
          <button
            onClick={onCreateAgenda}
            className="w-full py-5 rounded-2xl text-[16px] font-black text-white bg-gradient-to-r from-[#E8668A] to-[#F4A067] active:scale-[0.98] shadow-xl flex items-center justify-center gap-2.5"
          >
            <PlusCircle className="w-5 h-5" />
            새 안건 만들기
          </button>
        </div>

        {/* AI 템플릿 */}
        <section className="relative">
          <div className="absolute inset-0 border-2 border-[#a8ff35] rounded-2xl animate-pulse shadow-[0_0_12px_rgba(168,255,53,0.4)]"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-3.5 border border-white">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-[#8CB82D] fill-[#8CB82D]" />
              <h2 className="text-[10px] font-black text-[#8CB82D] uppercase tracking-widest">AI Auto Templates</h2>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((tpl) => (
                <button key={tpl.id} onClick={() => showToast('준비중입니다.')}
                  className="bg-gradient-to-r from-gray-50 to-gray-100/80 border border-gray-100 rounded-lg px-2.5 py-2 text-left hover:shadow-sm transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{tpl.icon}</span>
                    <span className="text-[10px] font-bold text-gray-600 leading-tight break-keep">{tpl.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

// =========================================================================
// 3. [APP COMPONENT]
// =========================================================================
export default function App() {
  const { user, loading: authLoading, userId } = useAuth();
  const engine = useDecisionEngine();
  const team = useTeam(userId);
  const agenda = useAgenda(userId, team.userName);
  const isAdmin = new URLSearchParams(window.location.search).get('token') === 'admin';

  // =========================================================================
  // 4. [STATE]
  // =========================================================================
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const seen = localStorage.getItem('df_claude_splash_seen');
      return !seen;
    } catch { return true; }
  });

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pendingAgendaData, setPendingAgendaData] = useState(null);
  const [currentDecision, setCurrentDecision] = useState(null);
  const [currentHasVoted, setCurrentHasVoted] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);

  // =========================================================================
  // 5. [FETCH AGENDAS]
  // =========================================================================
  useEffect(() => {
    const allTeamIds = [
      ...team.myCreatedTeams.map(t => t.id),
      ...team.myJoinedTeams.map(t => t.id),
    ];
    if (allTeamIds.length > 0) {
      agenda.fetchMyAgendas(allTeamIds);
    }
  }, [team.myCreatedTeams, team.myJoinedTeams, agenda.fetchMyAgendas]);

  // =========================================================================
  // 6. [SPLASH]
  // =========================================================================
  const handleSplashProceed = useCallback(() => {
    try {
      localStorage.setItem('df_claude_splash_seen', 'true');
    } catch {}
    setShowSplash(false);
  }, []);

  // =========================================================================
  // 7. [AUTH LOADING]
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
  // 8. [SPLASH SCREEN]
  // =========================================================================
  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex justify-center items-center font-sans">
        <div className="w-full max-w-md bg-white h-[850px] max-h-screen relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
          <SplashView onProceed={handleSplashProceed} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 9. [LANDING vs HOME 분기]
  // 팀/안건이 없는 최초 사용자 → LandingView (슬라이드 2)
  // 팀/안건이 있는 사용자 → HomeView (슬라이드 5~8)
  // =========================================================================
  const hasTeamsOrAgendas =
    team.myCreatedTeams.length > 0 ||
    team.myJoinedTeams.length > 0 ||
    agenda.firebaseAgendas.length > 0;

  const isLandingUser = !hasTeamsOrAgendas && engine.view === 'home';

  // =========================================================================
  // 10. [SELECT AGENDA]
  // =========================================================================
  const handleSelectAgenda = async (agendaId) => {
    engine.setSelectedId(agendaId);

    const mockDecision = agenda.mockDecisions.find(d => d.id === agendaId);
    if (mockDecision) {
      setCurrentDecision(mockDecision);
      setCurrentHasVoted(false);
      engine.setView('vote');
      return;
    }

    setDecisionLoading(true);
    const decision = await agenda.getAgendaWithLogs(agendaId);
    const hasVoted = await agenda.checkHasVoted(agendaId);
    setCurrentDecision(decision);
    setCurrentHasVoted(hasVoted);
    setDecisionLoading(false);
    engine.setView('vote');
  };

  // =========================================================================
  // 11. [PUBLISH FLOW] — "의견모으기 시작" → PublishModal
  // =========================================================================
  const handlePublish = (data) => {
    setPendingAgendaData(data);
    setShowPublishModal(true);
  };

  const handlePublishSubmit = async ({ userName, isNewTeam, teamName, maxMembers, selectedTeamId }) => {
    let targetTeamId = selectedTeamId;

    if (isNewTeam) {
      const teamResult = await team.createTeam(teamName, maxMembers || 5, userName);
      if (teamResult?.error) {
        if (teamResult.error === 'LIMIT_REACHED') {
          engine.showToast('무료 버전은 팀 2개까지 만들 수 있어요');
        } else {
          engine.showToast('팀 생성에 실패했습니다');
        }
        return;
      }
      targetTeamId = teamResult.teamId;
    } else {
      if (userName && userName !== team.userName) {
        await team.updateUserName(userName);
      }
    }

    const agendaResult = await agenda.createAgenda(pendingAgendaData, targetTeamId);
    if (agendaResult?.success) {
      engine.showToast('안건이 발행되었습니다! 🎉');
      setShowPublishModal(false);
      setPendingAgendaData(null);
      engine.setView('home');
      const allTeamIds = [
        ...team.myCreatedTeams.map(t => t.id),
        ...team.myJoinedTeams.map(t => t.id),
        targetTeamId,
      ];
      agenda.fetchMyAgendas([...new Set(allTeamIds)]);
    } else {
      engine.showToast('안건 생성에 실패했습니다');
    }
  };

  // =========================================================================
  // 12. [VOTE SUBMIT]
  // =========================================================================
  const handleVoteSubmit = async (decisionId, optionId, voterName, persona) => {
    if (currentDecision?.isMock) {
      agenda.mockVoteSubmit(decisionId, optionId, voterName, persona);
      setCurrentDecision(prev => ({
        ...prev,
        voters: prev.voters + 1,
        options: prev.options.map(o =>
          o.id === optionId ? { ...o, voteCount: (o.voteCount || 0) + 1 } : o
        ),
        voteLogs: [...(prev.voteLogs || []),
          { logId: Date.now(), userName: voterName, optionId, persona }],
      }));
      setCurrentHasVoted(true);
      engine.showToast('투표가 완료되었습니다! ✨');
      return;
    }

    const result = await agenda.submitVote(decisionId, optionId, voterName, persona);
    if (result?.success) {
      const updated = await agenda.getAgendaWithLogs(decisionId);
      setCurrentDecision(updated);
      setCurrentHasVoted(true);
      engine.showToast('투표가 완료되었습니다! ✨');
    } else if (result?.error === 'ALREADY_VOTED') {
      engine.showToast('이미 투표한 안건입니다');
    } else {
      engine.showToast('투표에 실패했습니다');
    }
  };

  // =========================================================================
  // 13. [KICK USER]
  // =========================================================================
  const handleKick = async (decisionId, logId, optionId) => {
    if (currentDecision?.isMock) {
      agenda.mockKickUser(decisionId, logId, optionId);
      setCurrentDecision(prev => ({
        ...prev,
        voters: Math.max(0, prev.voters - 1),
        options: prev.options.map(o =>
          o.id === optionId ? { ...o, voteCount: Math.max(0, (o.voteCount || 0) - 1) } : o
        ),
        voteLogs: (prev.voteLogs || []).filter(l => l.logId !== logId),
      }));
      engine.showToast('해당 표가 무효화 되었습니다.');
      return;
    }

    const result = await agenda.kickVote(decisionId, logId, optionId);
    if (result?.success) {
      const updated = await agenda.getAgendaWithLogs(decisionId);
      setCurrentDecision(updated);
      engine.showToast('해당 표가 무효화 되었습니다.');
    } else {
      engine.showToast('무효화에 실패했습니다');
    }
  };

  // =========================================================================
  // 14. [DELETE AGENDA]
  // =========================================================================
  const handleDeleteDecision = async (decisionId) => {
    const mockDecision = agenda.mockDecisions.find(d => d.id === decisionId);
    if (mockDecision) {
      agenda.mockDeleteDecision(decisionId);
      engine.showToast('안건이 삭제되었습니다.');
      return;
    }

    const result = await agenda.deleteAgenda(decisionId);
    if (result?.success) {
      engine.showToast('안건이 삭제되었습니다.');
      const allTeamIds = [
        ...team.myCreatedTeams.map(t => t.id),
        ...team.myJoinedTeams.map(t => t.id),
      ];
      agenda.fetchMyAgendas(allTeamIds);
    } else {
      engine.showToast('삭제에 실패했습니다');
    }
  };

  // =========================================================================
  // 15. [TEAM + CREATE AGENDA HANDLERS]
  // =========================================================================
  const handleClickTeam = (teamId) => {
    engine.setSelectedTeamId(teamId);
    engine.setView('teamDetail');
  };

  const handleTeamCreateAgenda = (teamId) => {
    engine.setView('create');
  };

  const handleLandingCreateAgenda = () => {
    engine.setView('create');
  };

  const isAgendaAdmin = currentDecision?.isMock || currentDecision?.creator_id === userId || isAdmin;

  // =========================================================================
  // 16. [RENDER]
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex justify-center items-center font-sans">
      <div className="w-full max-w-md bg-white h-[850px] max-h-screen relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">

        {/* 슬라이드 2: 최초 사용자 (팀/안건 없음) */}
        {isLandingUser && (
          <LandingView
            onCreateAgenda={handleLandingCreateAgenda}
            showToast={engine.showToast}
          />
        )}

        {/* 홈 화면 (팀/안건 있는 사용자) */}
        {engine.view === 'home' && !isLandingUser && (
          <HomeView
            setView={engine.setView}
            showToast={engine.showToast}
            decisions={agenda.allDecisions}
            onSelectId={handleSelectAgenda}
            myCreatedTeams={team.myCreatedTeams}
            myJoinedTeams={team.myJoinedTeams}
            teamsLoading={team.loading}
            onOpenCreateTeam={() => setShowCreateTeam(true)}
            onOpenJoinTeam={() => setShowJoinTeam(true)}
            onClickTeam={handleClickTeam}
            firebaseAgendas={agenda.firebaseAgendas}
            userId={userId}
          />
        )}

        {engine.view === 'create' && (
          <CreateView setView={engine.setView} onPublish={handlePublish} />
        )}

        {engine.view === 'vote' && currentDecision && !decisionLoading && (
          <VoteView
          decision={currentDecision}
          setView={engine.setView}
          onVoteSubmit={handleVoteSubmit}
          hasVoted={currentHasVoted}
          showToast={engine.showToast}
          isAdmin={isAgendaAdmin}
          onKick={handleKick}
          teamMemberCount={
            currentDecision?.isMock
              ? (currentDecision?.max_members || 2)
              : ([...team.myCreatedTeams, ...team.myJoinedTeams]
                  .find(t => t.id === currentDecision?.team_id)?.max_members || 0)
          }
        />
        )}

        {engine.view === 'vote' && decisionLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E8668A]" />
          </div>
        )}

        {engine.view === 'minimap' && currentDecision && (
          <MinimapView decision={currentDecision} setView={engine.setView} />
        )}

        {engine.view === 'visualmap' && currentDecision && (
          <VisualMapView decision={currentDecision} setView={engine.setView} />
        )}

        {engine.view === 'myroom' && (
          <MyRoomView
            setView={engine.setView}
            decisions={agenda.allDecisions}
            votedIds={agenda.mockVotedIds}
            onSelectId={handleSelectAgenda}
            onDelete={handleDeleteDecision}
            showToast={engine.showToast}
            userName={team.userName}
            isPremium={team.isPremium}
            onUpdateName={team.updateUserName}
          />
        )}

        {engine.view === 'notifications' && (
          <NotificationView setView={engine.setView} />
        )}

        {engine.view === 'settings' && (
          <SettingsView setView={engine.setView} />
        )}

        {engine.view === 'teamDetail' && engine.selectedTeamId && (
          <TeamDetailView
            teamId={engine.selectedTeamId}
            setView={engine.setView}
            getTeamDetail={team.getTeamDetail}
            userId={userId}
            onDeleteTeam={team.deleteTeam}
            onLeaveTeam={team.leaveTeam}
            showToast={engine.showToast}
            subscribeToTeamAgendas={agenda.subscribeToTeamAgendas}
            onSelectAgenda={handleSelectAgenda}
            onCreateAgenda={handleTeamCreateAgenda}
          />
        )}

        {engine.toast && <Toast message={engine.toast} />}

        {/* GNB — 랜딩(슬라이드2)에서는 숨김 */}
        {!isLandingUser && (
          <BottomNav view={engine.view} setView={engine.setView} />
        )}

        {/* ============================================================= */}
        {/* 모달 — PublishModal */}
        {/* ============================================================= */}
        {showPublishModal && (
          <PublishModal
            onClose={() => { setShowPublishModal(false); setPendingAgendaData(null); }}
            onSubmit={handlePublishSubmit}
            existingName={team.userName}
            myCreatedTeams={team.myCreatedTeams}
            myJoinedTeams={team.myJoinedTeams}
            showToast={engine.showToast}
          />
        )}

        {/* 모달 — 팀 생성 / 팀 참여 */}
        {showCreateTeam && (
          <CreateTeamModal
            onClose={() => setShowCreateTeam(false)}
            onCreate={team.createTeam}
            showToast={engine.showToast}
            existingName={team.userName}
          />
        )}

        {showJoinTeam && (
          <JoinTeamModal
            onClose={() => setShowJoinTeam(false)}
            onJoin={team.joinTeam}
            showToast={engine.showToast}
            existingName={team.userName}
          />
        )}

      </div>
    </div>
  );
}