// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useMemo } from 'react';
import {
  ChevronLeft, FileText, Users, CheckCircle2,
  TrendingUp, X, Bell
} from 'lucide-react';

// =========================================================================
// 2. [NOTIFICATION VIEW] — 알림 화면 (PDF 슬라이드 14)
// =========================================================================
const NotificationView = ({
  setView, decisions, myCreatedTeams, myJoinedTeams, showToast
}) => {

  // =========================================================================
  // 3. [SUMMARY DATA] — 서머리 4개 계산
  // =========================================================================
  const summaryData = useMemo(() => {
    const activeAgendas = decisions.filter(d => d.status !== '마감' && !d.isMock);
    const completedAgendas = decisions.filter(d => d.status === '마감' && !d.isMock);
    const totalReal = activeAgendas.length + completedAgendas.length;
    const progressRate = totalReal > 0
      ? Math.round((completedAgendas.length / totalReal) * 100)
      : 0;

    return [
      {
        icon: FileText,
        label: '새 투표\n시작 알림',
        value: activeAgendas.length,
        color: 'text-[#E8668A]',
        bg: 'bg-[#FFF0F3]',
      },
      {
        icon: Users,
        label: '새 팀원\n참여 알림',
        value: 0,
        color: 'text-[#4A648A]',
        bg: 'bg-[#EEF3FF]',
      },
      {
        icon: CheckCircle2,
        label: '안건\n마감 알림',
        value: completedAgendas.length,
        color: 'text-[#4A8C5C]',
        bg: 'bg-[#F0F7F0]',
      },
      {
        icon: TrendingUp,
        label: '안건의\n진행률',
        value: `${progressRate}%`,
        color: 'text-[#F4A067]',
        bg: 'bg-[#FFF8F0]',
      },
    ];
  }, [decisions]);

  // =========================================================================
  // 4. [RENDER]
  // =========================================================================
  return (
    <>
      {/* 헤더 */}
      <header className="px-4 pt-3 pb-2 bg-white shrink-0 flex items-center gap-3 border-b border-gray-50">
        <button onClick={() => setView('home')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-[16px] font-black text-gray-900">알림</h1>
      </header>

      <main className="flex-1 px-5 pb-24 overflow-y-auto bg-white">
        <div className="py-4 space-y-4">

          {/* ============================================================= */}
          {/* 알림 서머리 구역 */}
          {/* ============================================================= */}
          <div className="grid grid-cols-4 gap-2">
            {summaryData.map((item, i) => (
              <div key={i}
                className={`flex flex-col items-center py-3 rounded-xl ${item.bg} border border-transparent`}
              >
                <item.icon className={`w-4 h-4 mb-1.5 ${item.color}`} />
                <span className={`text-[18px] font-black ${item.color}`}>
                  {item.value}
                </span>
                <span className="text-[8px] font-bold text-gray-400 mt-1 text-center whitespace-pre-line leading-tight">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* ============================================================= */}
          {/* 알림 리스트 구역 */}
          {/* ============================================================= */}
          <div className="relative">
            {/* 전체 삭제 버튼 */}
            <button
              onClick={() => showToast('알림 기능이 곧 업데이트됩니다')}
              className="absolute top-0 right-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-300 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="bg-[#F0F7F0] border border-[#C6E6C6] rounded-2xl p-6 min-h-[300px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Bell className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-[13px] font-black text-gray-400 mb-1">알림이 없습니다</p>
              <p className="text-[11px] font-bold text-gray-300 text-center leading-relaxed">
                투표 시작, 팀원 참여, 안건 마감 시<br/>이곳에 알림이 표시됩니다.
              </p>
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default NotificationView;