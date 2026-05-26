// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Copy, Users, Crown, QrCode, Trash2,
  LogOut, Plus, Circle, CheckCircle2, Clock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// =========================================================================
// 2. [AGENDA CARD] — 안건 카드 컴포넌트
// =========================================================================
const AgendaCard = ({ agenda, onClick }) => {
  const isCompleted = agenda.status === '마감';

  return (
    <div
      onClick={onClick}
      className={`border rounded-xl p-3.5 transition-all cursor-pointer active:scale-[0.99] ${
        isCompleted
          ? 'bg-gray-50 border-gray-200 opacity-60'
          : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-1.5">
          {isCompleted ? (
            <CheckCircle2 className="w-3 h-3 text-gray-300" />
          ) : (
            <Circle className="w-3 h-3 text-green-400 fill-green-400" />
          )}
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
            isCompleted
              ? 'bg-gray-100 text-gray-400'
              : 'bg-pink-50 text-[#E8668A]'
          }`}>
            {agenda.status || '진행중'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Clock className="w-3 h-3" />
          <span className="text-[10px] font-bold">
            {agenda.deadline?.toDate
              ? (() => {
                  const diff = agenda.deadline.toDate() - new Date();
                  if (diff <= 0) return '마감';
                  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  return `D-${days}`;
                })()
              : agenda.dDay || 'D-Day'}
          </span>
        </div>
      </div>
      <h3 className={`text-[13px] font-black leading-tight mb-1 break-keep ${
        isCompleted ? 'text-gray-400' : 'text-gray-800'
      }`}>
        {agenda.title}
      </h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-gray-400">
          <Users className="w-3 h-3" />
          <span className="text-[10px] font-medium">{agenda.voters || 0}명 참여</span>
        </div>
        <span className="text-[10px] text-[#8CB82D] font-black">
          {agenda.options?.length || 0}개 선택지
        </span>
      </div>
    </div>
  );
};

// =========================================================================
// 3. [TEAM DETAIL VIEW] — 팀 상세 화면 (안건 목록 포함)
// =========================================================================
const TeamDetailView = ({
  teamId, setView, getTeamDetail, userId,
  onDeleteTeam, onLeaveTeam, showToast,
  subscribeToTeamAgendas, onSelectAgenda, onCreateAgenda
}) => {
  const [team, setTeam] = useState(null);
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  // =========================================================================
  // 4. [LOAD DATA]
  // =========================================================================
  useEffect(() => {
    const loadTeam = async () => {
      const data = await getTeamDetail(teamId);
      setTeam(data);
      setLoading(false);
    };
    loadTeam();
  }, [teamId, getTeamDetail]);

  // 안건 실시간 구독
  useEffect(() => {
    if (!teamId) return;
    const unsubscribe = subscribeToTeamAgendas(teamId, (updatedAgendas) => {
      setAgendas(updatedAgendas);
    });
    return () => unsubscribe();
  }, [teamId, subscribeToTeamAgendas]);

  // =========================================================================
  // 5. [HANDLERS]
  // =========================================================================
  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${team.invite_code}`;
    try {
      navigator.clipboard.writeText(link);
      showToast('초대 링크가 복사되었습니다! ✨');
    } catch {
      showToast('초대코드: ' + team.invite_code);
    }
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(team.invite_code);
      showToast('초대코드가 복사되었습니다!');
    } catch {
      showToast('초대코드: ' + team.invite_code);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${team.team_name}" 팀을 삭제하시겠습니까?\n모든 팀원이 팀에서 제거됩니다.`)) return;
    const result = await onDeleteTeam(teamId);
    if (result?.success) {
      showToast('팀이 삭제되었습니다');
      setView('home');
    } else {
      showToast('팀 삭제에 실패했습니다');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm(`"${team.team_name}" 팀에서 탈퇴하시겠습니까?`)) return;
    const result = await onLeaveTeam(teamId);
    if (result?.success) {
      showToast('팀에서 탈퇴했습니다');
      setView('home');
    } else {
      showToast('탈퇴에 실패했습니다');
    }
  };

  const isAdmin = team?.admin_id === userId;

  // 안건 분류
  const activeAgendas = agendas.filter(a => a.status !== '마감');
  const closedAgendas = agendas.filter(a => a.status === '마감');

  // =========================================================================
  // 6. [RENDER]
  // =========================================================================
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E8668A]" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 text-sm mb-3">팀을 찾을 수 없습니다</p>
        <button onClick={() => setView('home')} className="text-[#E8668A] font-bold text-sm">홈으로 돌아가기</button>
      </div>
    );
  }

  return (
    <>
      <header className="px-4 pt-3 pb-2 bg-white shrink-0 flex items-center gap-3 border-b border-gray-50">
        <button onClick={() => setView('home')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-[16px] font-black text-gray-900 flex-1 truncate">{team.team_name}</h1>
        {isAdmin && <Crown className="w-4 h-4 text-yellow-500" />}
      </header>

      <main className="flex-1 px-5 pb-24 overflow-y-auto bg-white">
        <div className="py-4 space-y-4">

          {/* ========== 팀 정보 ========== */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E8668A]" />
                <span className="text-[13px] font-black text-gray-700">
                  {team.member_ids?.length || 1} / {team.max_members}명
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-full">
                {isAdmin ? '👑 팀장' : '팀원'}
              </span>
            </div>

            <div className="bg-white rounded-xl p-3 text-center mb-3">
              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">초대코드</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-black tracking-[0.2em] text-gray-900">{team.invite_code}</span>
                <button onClick={handleCopyCode} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100">
                  <Copy className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleCopyLink}
                className="flex-1 py-2 rounded-xl text-[11px] font-black text-white bg-gradient-to-r from-[#E8668A] to-[#F4A067] active:scale-[0.98]">
                초대 링크 복사
              </button>
              <button onClick={() => setShowQR(!showQR)}
                className="px-3 py-2 rounded-xl text-[11px] font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" />QR
              </button>
            </div>

            {showQR && (
              <div className="flex justify-center mt-3 p-3 bg-white rounded-xl border border-gray-100">
                <QRCodeSVG value={`${window.location.origin}/join/${team.invite_code}`} size={120} level="M" fgColor="#1a1a1a" />
              </div>
            )}
          </div>

          {/* ========== 새 안건 만들기 ========== */}
          <button
            onClick={() => onCreateAgenda(teamId)}
            className="w-full py-3 rounded-xl text-[13px] font-black text-white bg-gradient-to-r from-[#E8668A] to-[#F4A067] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            이 팀에 새 안건 만들기
          </button>

          {/* ========== 진행 중 안건 ========== */}
          {activeAgendas.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Circle className="w-3 h-3 text-green-400 fill-green-400" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">진행 중 ({activeAgendas.length})</h3>
              </div>
              <div className="space-y-2">
                {activeAgendas.map(a => (
                  <AgendaCard key={a.id} agenda={a} onClick={() => onSelectAgenda(a.id)} />
                ))}
              </div>
            </div>
          )}

          {/* ========== 완료 안건 ========== */}
          {closedAgendas.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3 h-3 text-gray-300" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">완료 ({closedAgendas.length})</h3>
              </div>
              <div className="space-y-2">
                {closedAgendas.map(a => (
                  <AgendaCard key={a.id} agenda={a} onClick={() => onSelectAgenda(a.id)} />
                ))}
              </div>
            </div>
          )}

          {/* ========== 빈 상태 ========== */}
          {agendas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-3xl mb-3 opacity-40">📋</div>
              <p className="text-[12px] font-bold text-gray-400 mb-1">이 팀에 아직 안건이 없어요</p>
              <p className="text-[10px] text-gray-300">위 버튼을 눌러 첫 안건을 만들어보세요!</p>
            </div>
          )}

          {/* ========== 팀 관리 ========== */}
          <div className="pt-2">
            {isAdmin ? (
              <button onClick={handleDelete}
                className="w-full py-3 rounded-xl text-[13px] font-bold text-red-400 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2 transition-colors">
                <Trash2 className="w-4 h-4" />팀 삭제하기
              </button>
            ) : (
              <button onClick={handleLeave}
                className="w-full py-3 rounded-xl text-[13px] font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors">
                <LogOut className="w-4 h-4" />팀 탈퇴하기
              </button>
            )}
          </div>

        </div>
      </main>
    </>
  );
};

export default TeamDetailView;