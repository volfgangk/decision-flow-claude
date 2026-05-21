// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Copy, Users, Crown, QrCode, Trash2, LogOut } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// =========================================================================
// 2. [TEAM DETAIL VIEW] — 팀 상세 화면
// =========================================================================
const TeamDetailView = ({ teamId, setView, getTeamDetail, userId, onDeleteTeam, onLeaveTeam, showToast }) => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  // =========================================================================
  // 3. [LOAD TEAM DATA]
  // =========================================================================
  useEffect(() => {
    const load = async () => {
      const data = await getTeamDetail(teamId);
      setTeam(data);
      setLoading(false);
    };
    load();
  }, [teamId, getTeamDetail]);

  // =========================================================================
  // 4. [HANDLERS]
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

  // =========================================================================
  // 5. [RENDER]
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
        <div className="py-5 space-y-5">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
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

            <div className="bg-white rounded-xl p-4 text-center mb-3">
              <p className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">초대코드</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black tracking-[0.25em] text-gray-900">{team.invite_code}</span>
                <button onClick={handleCopyCode} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100">
                  <Copy className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-black text-white bg-gradient-to-r from-[#E8668A] to-[#F4A067] active:scale-[0.98]"
              >
                초대 링크 복사
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                QR
              </button>
            </div>

            {showQR && (
              <div className="flex justify-center mt-4 p-3 bg-white rounded-xl border border-gray-100">
                <QRCodeSVG
                  value={`${window.location.origin}/join/${team.invite_code}`}
                  size={140}
                  level="M"
                  fgColor="#1a1a1a"
                />
              </div>
            )}
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-5 text-center">
            <p className="text-[12px] font-bold text-blue-400">📌 이 팀의 안건은 곧 연결됩니다</p>
            <p className="text-[10px] text-blue-300 mt-1">Phase C 업데이트에서 안건 공유 기능이 추가될 예정이에요</p>
          </div>

          <div className="pt-2">
            {isAdmin ? (
              <button
                onClick={handleDelete}
                className="w-full py-3 rounded-xl text-[13px] font-bold text-red-400 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                팀 삭제하기
              </button>
            ) : (
              <button
                onClick={handleLeave}
                className="w-full py-3 rounded-xl text-[13px] font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                팀 탈퇴하기
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default TeamDetailView;