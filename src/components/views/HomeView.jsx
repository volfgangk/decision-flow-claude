// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useState, useRef, useCallback } from 'react';
import { PlusCircle, Zap, Users, Clock, Circle, Copy, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import TEMPLATES from '../../constants/templates';

// =========================================================================
// 2. [DOT INDICATOR] — 수평 스크롤 위치 표시
// =========================================================================
// =========================================================================
// [DRAG SCROLL HOOK] — 데스크탑 마우스 드래그 지원
// =========================================================================
const useDragScroll = () => {
  const ref = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e) => {
    isDown.current = true;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
    ref.current.style.cursor = 'grabbing';
  };
  const onMouseUp = () => {
    isDown.current = false;
    if (ref.current) ref.current.style.cursor = 'grab';
  };
  const onMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  return { ref, onMouseDown, onMouseUp, onMouseLeave: onMouseUp, onMouseMove };
};
const DotIndicator = ({ count, current }) => {
  if (count <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-1.5 py-2">
      {Array.from({ length: Math.min(count, 7) }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i === current ? 'w-2.5 h-2.5 bg-[#4A648A]' : 'w-1.5 h-1.5 bg-gray-300'
        }`} />
      ))}
    </div>
  );
};

// =========================================================================
// 3. [TAB BUTTONS] — 탭 전환
// =========================================================================
const TabButtons = ({ tabs, activeTab, onTabChange, color = 'pink' }) => (
  <div className="flex gap-1 mb-2">
    {tabs.map((tab, i) => (
      <button key={i} onClick={() => onTabChange(i)}
        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
          activeTab === i
            ? color === 'pink'
              ? 'bg-[#FFF0F3] text-[#E8668A] border border-[#FCD9E1]'
              : 'bg-[#F0F7F0] text-[#4A8C5C] border border-[#C6E6C6]'
            : 'bg-transparent text-gray-400'
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
);

// =========================================================================
// 4. [AGENDA CARD] — 안건 카드 (수평 스와이프용)
// =========================================================================
const AgendaCard = ({ agenda, onClick, teamMaxMembers }) => (
  <div onClick={onClick}
    className="min-w-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
    style={{ scrollSnapAlign: 'center' }}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <Circle className="w-2.5 h-2.5 text-green-400 fill-green-400" />
        <span className="text-[9px] font-black text-[#E8668A] bg-[#FFF0F3] px-1.5 py-0.5 rounded uppercase">진행중</span>
      </div>
      <div className="flex items-center gap-1 text-gray-400">
        <Clock className="w-3 h-3" />
        <span className="text-[10px] font-bold">{agenda.dDay || 'D-Day'}</span>
      </div>
    </div>
    <h3 className="text-[14px] font-black text-gray-800 leading-tight mb-2 break-keep line-clamp-2">
      {agenda.title}
    </h3>
    <div className="flex items-center gap-1 text-gray-400">
      <Users className="w-3 h-3" />
      <span className="text-[11px] font-bold">
        {agenda.voters || 0} / {teamMaxMembers || '?'}명
      </span>
    </div>
  </div>
);

// =========================================================================
// 5. [TEAM CARD] — 팀 카드 (수평 스와이프용)
// =========================================================================
const TeamCard = ({ team, onClick, onCopyCode, onShowQR, showToast }) => (
  <div onClick={onClick}
    className="min-w-full bg-white border-2 border-[#C6E6C6] rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
    style={{ scrollSnapAlign: 'center' }}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-black text-gray-800 truncate">{team.team_name}</h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] font-bold text-gray-500 tracking-wider">
            {team.invite_code}
          </span>
          <button onClick={e => { e.stopPropagation(); onCopyCode(team.invite_code); }}
            className="p-1 hover:bg-gray-100 rounded-full">
            <Copy className="w-3 h-3 text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-gray-400">
          <Users className="w-3 h-3" />
          <span className="text-[10px] font-bold">총 {team.member_ids?.length || 1}명</span>
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); onShowQR(team); }}
        className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 hover:bg-gray-100 shrink-0 ml-3">
        <QRCodeSVG value={`${window.location.origin}/join/${team.invite_code}`} size={40} level="L" fgColor="#1a1a1a" />
      </button>
    </div>
  </div>
);

// =========================================================================
// 6. [HOME VIEW] — 홈 화면 (PDF 슬라이드 5~8 기준)
// =========================================================================
const HomeView = ({
  setView, showToast, decisions, onSelectId,
  myCreatedTeams, myJoinedTeams, teamsLoading,
  onOpenCreateTeam, onOpenJoinTeam, onClickTeam,
  firebaseAgendas, userId,
}) => {
  const [agendaTab, setAgendaTab] = useState(0);
  const [teamTab, setTeamTab] = useState(0);
  const [agendaScrollIdx, setAgendaScrollIdx] = useState(0);
  const [teamScrollIdx, setTeamScrollIdx] = useState(0);
  const [qrModal, setQrModal] = useState(null);
  const agendaDrag = useDragScroll();
  const teamDrag = useDragScroll();

  // =========================================================================
  // 7. [AGENDA FILTERING] — 진행 중인 안건만, 탭별 분류
  // =========================================================================
  const activeDecisions = decisions.filter(d => d.status !== '마감');

  const myCreatedAgendas = activeDecisions.filter(d =>
    d.isMock || d.creator_id === userId
  );
  const myJoinedAgendas = activeDecisions.filter(d =>
    !d.isMock && d.creator_id !== userId
  );

  const currentAgendas = agendaTab === 0 ? myCreatedAgendas : myJoinedAgendas;

  // 팀별 max_members 조회 헬퍼
  const allTeams = [...myCreatedTeams, ...myJoinedTeams];
  const getTeamMaxMembers = useCallback((agenda) => {
    if (agenda.isMock) return agenda.max_members || 2;
    const t = allTeams.find(tm => tm.id === agenda.team_id);
    return t?.max_members || '?';
  }, [allTeams]);

  // =========================================================================
  // 8. [TEAM FILTERING]
  // =========================================================================
  const currentTeams = teamTab === 0 ? myCreatedTeams : myJoinedTeams;

  // =========================================================================
  // 9. [SCROLL HANDLERS]
  // =========================================================================
  const handleAgendaScroll = useCallback(() => {
    if (!agendaDrag.ref.current) return;
    const el = agendaDrag.ref.current;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setAgendaScrollIdx(Math.max(0, Math.min(idx, currentAgendas.length - 1)));
  }, [currentAgendas.length]);

  const handleTeamScroll = useCallback(() => {
    if (!teamDrag.ref.current) return;
    const el = teamDrag.ref.current;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setTeamScrollIdx(Math.max(0, Math.min(idx, currentTeams.length - 1)));
  }, [currentTeams.length]);

  // =========================================================================
  // 10. [COPY INVITE CODE]
  // =========================================================================
  const handleCopyCode = useCallback((code) => {
    try {
      navigator.clipboard.writeText(code);
      showToast('초대코드가 복사되었습니다!');
    } catch {
      showToast('초대코드: ' + code);
    }
  }, [showToast]);

  // =========================================================================
  // 11. [RENDER]
  // =========================================================================
  return (
    <>
      {/* 헤더 */}
      <header className="px-5 pt-3 pb-1 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-[16px] font-black text-gray-900 tracking-tight">Decision Flow</h1>
        </div>
        <div className="flex justify-center py-1">
          <img src="/앱로고.jpg" alt="" className="w-10 h-10 object-contain rounded-lg opacity-60"
            onError={e => { e.target.style.display = 'none'; }} />
        </div>
      </header>

      <main className="flex-1 px-5 pb-24 overflow-y-auto bg-white space-y-5">

        {/* ============================================================= */}
        {/* 안건 구역 */}
        {/* ============================================================= */}
        <section>
          <TabButtons
            tabs={['내가 만든 안건', '내가 참여한 안건']}
            activeTab={agendaTab}
            onTabChange={(i) => { setAgendaTab(i); setAgendaScrollIdx(0); }}
            color="pink"
          />

          {currentAgendas.length > 0 ? (
            <>
              <p className="text-[10px] font-bold text-[#E8668A] mb-2">최근 진행 중인 안건</p>
              <div ref={agendaDrag.ref} onScroll={handleAgendaScroll}
                onMouseDown={agendaDrag.onMouseDown} onMouseUp={agendaDrag.onMouseUp}
                onMouseLeave={agendaDrag.onMouseLeave} onMouseMove={agendaDrag.onMouseMove}
                className="flex gap-3 overflow-x-auto pb-1"
                style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.agenda-scroll::-webkit-scrollbar{display:none}`}</style>
                {currentAgendas.map(a => (
                  <div key={a.id} className="min-w-[calc(100%-8px)] shrink-0">
                    <AgendaCard
                      agenda={a}
                      onClick={() => onSelectId(a.id)}
                      teamMaxMembers={getTeamMaxMembers(a)}
                    />
                  </div>
                ))}
              </div>
              <DotIndicator count={currentAgendas.length} current={agendaScrollIdx} />
            </>
          ) : (
            <div className="bg-[#FFF0F3] rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2 opacity-40">📋</p>
              <p className="text-[11px] font-bold text-gray-400">
                {agendaTab === 0 ? '아직 만든 안건이 없어요' : '참여한 안건이 없어요'}
              </p>
            </div>
          )}
        </section>

        {/* ============================================================= */}
        {/* 팀 구역 */}
        {/* ============================================================= */}
        <section>
          <TabButtons
            tabs={['내가 만든 팀', '내가 참여한 팀']}
            activeTab={teamTab}
            onTabChange={(i) => { setTeamTab(i); setTeamScrollIdx(0); }}
            color="green"
          />

          {currentTeams.length > 0 ? (
            <>
              <div ref={teamDrag.ref} onScroll={handleTeamScroll}
                onMouseDown={teamDrag.onMouseDown} onMouseUp={teamDrag.onMouseUp}
                onMouseLeave={teamDrag.onMouseLeave} onMouseMove={teamDrag.onMouseMove}
                className="flex gap-3 overflow-x-auto pb-1"
                style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {currentTeams.map(t => (
                  <div key={t.id} className="min-w-[calc(100%-8px)] shrink-0">
                    <TeamCard
                      team={t}
                      onClick={() => onClickTeam(t.id)}
                      onCopyCode={handleCopyCode}
                      onShowQR={setQrModal}
                      showToast={showToast}
                    />
                  </div>
                ))}
              </div>
              <DotIndicator count={currentTeams.length} current={teamScrollIdx} />
            </>
          ) : (
            <div className="bg-[#F0F7F0] rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2 opacity-40">🏠</p>
              <p className="text-[11px] font-bold text-gray-400">
                {teamTab === 0 ? '팀을 만들면 안건을 공유할 수 있어요' : '참여한 팀이 없어요'}
              </p>
            </div>
          )}

          {/* 새 팀 만들기 (내가 만든 팀 탭에서만) */}
          {teamTab === 0 && (
            <button onClick={onOpenCreateTeam}
              className="w-full mt-2 py-2.5 border-2 border-dashed border-[#C6E6C6] rounded-xl text-[11px] font-black text-[#8CB82D] hover:bg-[#F0F7F0] transition-all">
              + 새 팀 만들기
            </button>
          )}
        </section>

        {/* ============================================================= */}
        {/* 새 안건 만들기 버튼 (절대변경불가) */}
        {/* ============================================================= */}
        <button onClick={() => setView('create')}
          className="w-full py-4 rounded-2xl text-[15px] font-black text-white bg-gradient-to-r from-[#E8668A] to-[#F4A067] active:scale-[0.98] shadow-xl flex items-center justify-center gap-2">
          <PlusCircle className="w-5 h-5" />
          새 안건 만들기
        </button>

        {/* ============================================================= */}
        {/* AI 템플릿 (절대변경불가) */}
        {/* ============================================================= */}
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

      {/* ============================================================= */}
      {/* QR 확대 모달 */}
      {/* ============================================================= */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setQrModal(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
            <h3 className="text-[14px] font-black text-gray-900 mb-1">{qrModal.team_name}</h3>
            <p className="text-[11px] text-gray-400 font-bold mb-4">초대코드: {qrModal.invite_code}</p>
            <QRCodeSVG
              value={`${window.location.origin}/join/${qrModal.invite_code}`}
              size={200} level="M" fgColor="#1a1a1a"
            />
            <button onClick={() => { handleCopyCode(qrModal.invite_code); setQrModal(null); }}
              className="mt-4 w-full py-2.5 rounded-xl text-[12px] font-black text-white bg-gradient-to-r from-[#E8668A] to-[#F4A067] active:scale-[0.98]">
              초대코드 복사
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HomeView;