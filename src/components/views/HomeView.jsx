// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useState } from 'react';
import { PlusCircle, Users, Clock, Zap, Plus, KeyRound, Circle, CheckCircle2 } from 'lucide-react';
import TEMPLATES from '../../constants/templates';

// =========================================================================
// 2. [TEAM CARD] — 팀 카드 컴포넌트
// =========================================================================
const TeamCard = ({ team, index, onClickTeam, decisions }) => {
  // Phase B: 안건-팀 연결 전이므로 임시로 0 표시
  // Phase C에서 team_id 기반 필터링으로 교체 예정
  const activeCount = 0;
  const doneCount = 0;

  return (
    <div
      onClick={() => onClickTeam(team.id)}
      className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-[11px] font-black text-gray-300 w-5 shrink-0">{index + 1}</span>
          <span className="text-[13px] font-black text-gray-800 truncate">{team.team_name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="flex items-center gap-1">
            <Circle className="w-3 h-3 text-green-400 fill-green-400" />
            <span className="text-[11px] font-bold text-gray-500">{activeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-gray-300" />
            <span className="text-[11px] font-bold text-gray-400">{doneCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. [HOME VIEW] — 홈 화면 메인
// =========================================================================
const HomeView = ({
  setView, showToast, decisions, onSelectId,
  myCreatedTeams, myJoinedTeams, teamsLoading,
  onOpenCreateTeam, onOpenJoinTeam, onClickTeam
}) => {
  const [activeTab, setActiveTab] = useState('created');

  // 최근 진행 중 안건 (최대 3개)
  const recentActive = decisions
    .filter(d => d.status === '진행중' || (!d.status || d.status !== '마감'))
    .slice(0, 3);

  const currentTeams = activeTab === 'created' ? myCreatedTeams : myJoinedTeams;

  // =========================================================================
  // 4. [RENDER]
  // =========================================================================
  return (
    <>
      <header className="px-6 pt-3.5 pb-0.5 bg-white shrink-0">
        <h1 className="text-xl font-black text-gray-900 tracking-tighter">Decision Flow</h1>
      </header>

      <main className="flex-1 px-5 pb-24 overflow-y-auto bg-white flex flex-col">
        {/* 로고 */}
        <div className="flex justify-center mb-3 mt-0.5 h-14 shrink-0">
          <img src="/앱로고.jpg" alt="logo" className="h-full object-contain rounded-xl" onError={e => e.target.style.display='none'} />
        </div>

        {/* AI 템플릿 */}
        <section className="mb-3.5 relative shrink-0">
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

        {/* 새 안건 생성 버튼 */}
        <button
          onClick={() => setView('create')}
          className="w-full mb-4 py-3 rounded-xl text-[13px] font-black text-white bg-gradient-to-r from-[#E8668A] to-[#F4A067] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          새 안건 생성하기
        </button>

        {/* ============================================================= */}
        {/* 팀 탭 — [내가 만든 팀 / 내가 참여한 팀] */}
        {/* ============================================================= */}
        <div className="flex gap-0 mb-3 shrink-0">
          <button
            onClick={() => setActiveTab('created')}
            className={`flex-1 py-2.5 text-[12px] font-black rounded-l-xl border-2 transition-all ${
              activeTab === 'created'
                ? 'bg-[#FFF0F3] border-[#FCD9E1] text-[#C95374]'
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
          >
            내가 만든 팀
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`flex-1 py-2.5 text-[12px] font-black rounded-r-xl border-2 border-l-0 transition-all ${
              activeTab === 'joined'
                ? 'bg-[#EEF3FF] border-[#C5D5F7] text-[#4A6FA5]'
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
          >
            내가 참여한 팀
          </button>
        </div>

        {/* ============================================================= */}
        {/* 팀 목록 영역 */}
        {/* ============================================================= */}
        <div className={`rounded-2xl p-3.5 mb-4 border-2 ${
          activeTab === 'created'
            ? 'bg-[#FFF0F3] border-[#FCD9E1]'
            : 'bg-[#EEF3FF] border-[#C5D5F7]'
        }`}>
          {teamsLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#E8668A]" />
            </div>
          ) : currentTeams.length > 0 ? (
            <div className="space-y-2">
              {currentTeams.map((team, i) => (
                <TeamCard key={team.id} team={team} index={i} onClickTeam={onClickTeam} decisions={decisions} />
              ))}
              {/* 추가 버튼 */}
              <button
                onClick={activeTab === 'created' ? onOpenCreateTeam : onOpenJoinTeam}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-[11px] font-bold text-gray-400 hover:border-gray-300 hover:text-gray-500 flex items-center justify-center gap-1.5 transition-colors"
              >
                {activeTab === 'created' ? (
                  <><Plus className="w-3.5 h-3.5" />새 팀 만들기</>
                ) : (
                  <><KeyRound className="w-3.5 h-3.5" />초대코드 입력</>
                )}
              </button>
            </div>
          ) : (
            /* 빈 상태 넛지 */
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
              <div className="text-2xl mb-2 opacity-50">{activeTab === 'created' ? '🏠' : '🎟️'}</div>
              <p className="text-[11px] font-black text-gray-400 mb-1 leading-relaxed">
                {activeTab === 'created'
                  ? '팀을 만들면 안건을 공유할 수 있어요'
                  : '초대코드를 받으셨나요?'}
              </p>
              <button
                onClick={activeTab === 'created' ? onOpenCreateTeam : onOpenJoinTeam}
                className={`mt-3 rounded-xl py-2 px-4 flex items-center gap-1.5 shadow-md text-[11px] font-black active:scale-[0.98] text-white ${
                  activeTab === 'created'
                    ? 'bg-gradient-to-r from-[#E8668A] to-[#F4A067]'
                    : 'bg-gradient-to-r from-[#5B8DEF] to-[#7C6CF0]'
                }`}
              >
                {activeTab === 'created' ? (
                  <><Plus className="w-3.5 h-3.5" />첫 팀 만들기</>
                ) : (
                  <><KeyRound className="w-3.5 h-3.5" />초대코드 입력</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ============================================================= */}
        {/* 최근 안건 (최대 3개, 진행 중만) */}
        {/* ============================================================= */}
        {recentActive.length > 0 && (
          <div className="shrink-0">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">최근 진행 중인 안건</h3>
            <div className="space-y-2">
              {recentActive.map(item => (
                <div key={item.id} onClick={() => onSelectId(item.id)}
                  className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <Circle className="w-2.5 h-2.5 text-green-400 fill-green-400" />
                      <span className="bg-pink-50 text-[#E8668A] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">{item.status || '진행중'}</span>
                    </div>
                    <div className="flex items-center text-gray-400 gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{item.dDay}</span>
                    </div>
                  </div>
                  <h3 className="text-[13px] font-black text-gray-800 leading-tight mb-1 break-keep">{item.title}</h3>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{item.voters}명이 참여 중</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default HomeView;