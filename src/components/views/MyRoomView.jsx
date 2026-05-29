// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, FileText, Users, CheckCircle2,
  Clock, Trash2, LogOut, RefreshCw, CornerDownRight
} from 'lucide-react';
import TreeEngine from '../../utils/treeEngine';

// =========================================================================
// 2. [AGENDA TILE] — 안건 타일 (리스트용)
// =========================================================================
const AgendaTile = ({ agenda, onClick, onDelete, canDelete, isCompleted }) => {
  const optionCount = agenda.options?.length || 0;

  // 마감 기한 표시
  const deadlineDisplay = isCompleted
    ? (agenda.deadline?.toDate
        ? agenda.deadline.toDate().toISOString().slice(0, 10)
        : '마감됨')
    : (agenda.dDay || 'D-Day');

  return (
    <div onClick={onClick}
      className={`border rounded-xl p-3 transition-all cursor-pointer active:scale-[0.99] relative ${
        isCompleted
          ? 'bg-gray-50 border-gray-200 opacity-70'
          : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
      }`}
    >
      {/* 삭제 버튼 */}
      {canDelete && (
        <button
          onClick={e => {
            e.stopPropagation();
            if (window.confirm('정말 삭제할까요? 이 안건의 모든 투표 기록도 함께 삭제됩니다.')) {
              onDelete(agenda.id);
            }
          }}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 상단 뱃지 */}
      <div className="flex items-center gap-1.5 mb-1.5 pr-6">
        <span className="text-[13px]">📋</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
          isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-[#FFF0F3] text-[#E8668A]'
        }`}>
          {deadlineDisplay}
        </span>
        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
          <Users className="w-3 h-3" /> {agenda.voters || 0}
        </span>
        <span className="text-[10px] font-bold text-gray-400">
          {optionCount}개
        </span>
      </div>

      {/* 제목 */}
      <h3 className={`text-[13px] font-black leading-tight break-keep ${
        isCompleted ? 'text-gray-400' : 'text-gray-800'
      }`}>
        {agenda.title}
      </h3>
    </div>
  );
};

// =========================================================================
// 3. [MOST VOTED OPTION] — 최다 투표 선택지 표시
// =========================================================================
const MostVotedOption = ({ agendas }) => {
  // 진행 중인 안건 중 투표가 있는 것에서 최다 선택지 찾기
  const bestOption = useMemo(() => {
    let best = null;
    let bestVotes = 0;
    let bestAgendaTitle = '';

    agendas.forEach(a => {
      if (a.status === '마감' || !a.options) return;
      const leaves = a.options.filter(
        o => !a.options.some(sub => sub.id.startsWith(o.id + '-'))
      );
      leaves.forEach(leaf => {
        if ((leaf.voteCount || 0) > bestVotes) {
          bestVotes = leaf.voteCount;
          best = leaf;
          bestAgendaTitle = a.title;
        }
      });
    });

    if (!best || bestVotes === 0) return null;

    // depth 경로 구성
    const parts = best.id.split('-');
    const path = [];
    let current = '';
    parts.forEach(part => {
      current = current ? `${current}-${part}` : part;
      const found = agendas.flatMap(a => a.options).find(o => o.id === current);
      if (found) path.push(found);
    });

    return { path, agendaTitle: bestAgendaTitle, votes: bestVotes };
  }, [agendas]);

  if (!bestOption) return null;

  return (
    <div className="mt-3 bg-[#F8FAFF] border border-[#D2DFEE] rounded-xl p-3">
      <p className="text-[9px] font-black text-[#4A648A] uppercase tracking-wider mb-2">최다 투표 선택지</p>
      <p className="text-[10px] font-bold text-gray-400 mb-1.5 truncate">{bestOption.agendaTitle}</p>
      <div className="space-y-1">
        {bestOption.path.map((node, i) => (
          <div key={node.id} className="flex items-center gap-1.5" style={{ paddingLeft: `${i * 12}px` }}>
            {i > 0 && <CornerDownRight className="w-3 h-3 text-gray-300 shrink-0" />}
            <span className={`text-[11px] font-bold ${
              i === bestOption.path.length - 1 ? 'text-[#E8668A]' : 'text-gray-500'
            }`}>
              {node.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================================
// 4. [TEAM TILE] — 팀 타일
// =========================================================================
const TeamTile = ({ team, isOwner, onClick, onDelete, onLeave, showToast }) => (
  <div onClick={onClick}
    className={`border rounded-xl p-3 transition-all cursor-pointer active:scale-[0.99] relative ${
      isOwner ? 'bg-white border-[#FCD9E1]' : 'bg-white border-[#C6E6C6]'
    }`}
  >
    {/* 삭제/나가기 버튼 */}
    <button
      onClick={e => {
        e.stopPropagation();
        if (isOwner) {
          if (window.confirm(`"${team.team_name}" 팀을 삭제하시겠습니까?`)) onDelete(team.id);
        } else {
          if (window.confirm(`"${team.team_name}" 팀에서 탈퇴하시겠습니까?`)) onLeave(team.id);
        }
      }}
      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-300 hover:text-red-400 transition-colors"
    >
      {isOwner ? <Trash2 className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
    </button>

    {/* 뱃지 */}
    <div className="flex items-center gap-1.5 mb-1.5 pr-6">
      <span className="text-[13px]">📋</span>
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
        isOwner ? 'bg-[#FFF0F3] text-[#C95374]' : 'bg-[#EEF3FF] text-[#4A6FA5]'
      }`}>
        {isOwner ? '내 팀' : '참여 팀'}
      </span>
      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
        <Users className="w-3 h-3" /> {team.member_ids?.length || 1}명
      </span>
    </div>

    {/* 팀명 */}
    <h3 className="text-[13px] font-black text-gray-800 truncate">{team.team_name}</h3>
  </div>
);

// =========================================================================
// 5. [MY ROOM VIEW] — 마이룸 화면 (PDF 슬라이드 10~13)
// =========================================================================
const MyRoomView = ({
  setView, decisions, votedIds, onSelectId, onDelete,
  showToast, userName, isPremium, onUpdateName,
  userId, myCreatedTeams, myJoinedTeams,
  onClickTeam, onDeleteTeam, onLeaveTeam,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['내가 만든 안건', '내가 참여한 안건', '완료된 안건', 'Team'];

  // =========================================================================
  // 6. [DATA CLASSIFICATION]
  // =========================================================================
  const myCreatedAgendas = useMemo(() =>
    decisions.filter(d => d.status !== '마감' && (d.isMock || d.creator_id === userId))
      .sort((a, b) => {
        const aTime = a.deadline?.toDate ? a.deadline.toDate().getTime() : Infinity;
        const bTime = b.deadline?.toDate ? b.deadline.toDate().getTime() : Infinity;
        return aTime - bTime;
      }),
    [decisions, userId]
  );

  const myJoinedAgendas = useMemo(() =>
    decisions.filter(d => d.status !== '마감' && !d.isMock && d.creator_id !== userId)
      .sort((a, b) => {
        const aTime = a.deadline?.toDate ? a.deadline.toDate().getTime() : Infinity;
        const bTime = b.deadline?.toDate ? b.deadline.toDate().getTime() : Infinity;
        return aTime - bTime;
      }),
    [decisions, userId]
  );

  const completedAgendas = useMemo(() =>
    decisions.filter(d => d.status === '마감')
      .sort((a, b) => {
        const aTime = a.deadline?.toDate ? a.deadline.toDate().getTime() : 0;
        const bTime = b.deadline?.toDate ? b.deadline.toDate().getTime() : 0;
        return bTime - aTime;
      }),
    [decisions]
  );

  // 서머리 숫자
  const summaryData = [
    { icon: FileText, label: '만든 안건', count: myCreatedAgendas.length, tab: 0 },
    { icon: Users, label: '참여한 안건', count: myJoinedAgendas.length, tab: 1 },
    { icon: CheckCircle2, label: '완료된 안건', count: completedAgendas.length, tab: 2 },
    { icon: Users, label: 'Team', count: (myCreatedTeams?.length || 0) + (myJoinedTeams?.length || 0), tab: 3 },
  ];

  // 이름 변경 가능 여부
  const canChangeName = decisions.every(d => d.status === '마감' || d.isMock);

  // =========================================================================
  // 7. [RENDER]
  // =========================================================================
  return (
    <>
      {/* 헤더 */}
      <header className="px-4 pt-3 pb-2 bg-white shrink-0 flex items-center gap-3 border-b border-gray-50">
        <button onClick={() => setView('home')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-[16px] font-black text-gray-900">마이룸</h1>
      </header>

      <main className="flex-1 px-5 pb-24 overflow-y-auto bg-white">
        <div className="py-4 space-y-4">

          {/* ============================================================= */}
          {/* 이름 & 페르소나 구역 */}
          {/* ============================================================= */}
          <div className="flex items-start gap-3">
            {/* 이름 (왼쪽 60%) */}
            <div className="w-[60%]">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">내 프로필</p>
              <p className="text-[22px] font-black text-gray-900 tracking-tight break-keep">{userName || '이름 없음'}</p>
              {canChangeName ? (
                <button onClick={() => {
                  const newName = window.prompt('새 이름을 입력해주세요', userName);
                  if (newName && newName.trim() && newName !== userName) {
                    onUpdateName(newName.trim());
                    showToast('이름이 변경되었습니다');
                  }
                }}
                  className="mt-1 text-[10px] font-bold text-[#4A648A] flex items-center gap-1 hover:underline">
                  ✏️ 변경
                </button>
              ) : (
                <p className="mt-1 text-[10px] font-bold text-gray-300 flex items-center gap-1">
                  ⓘ 진행 중인 안건이 모두 완료된 후 변경할 수 있어요
                </p>
              )}
            </div>

            {/* 페르소나 (오른쪽 40%) — 자리 확보 */}
            <div className="w-[40%] bg-[#FFF8F0] border border-[#FFE8D6] rounded-xl p-2.5 text-center">
              <p className="text-[9px] font-black text-[#F4A067] uppercase tracking-wider mb-1">페르소나</p>
              <p className="text-2xl mb-0.5">🎭</p>
              <p className="text-[9px] font-bold text-gray-400">곧 만나요!</p>
            </div>
          </div>

          {/* 점선 구분 */}
          <div className="border-t-2 border-dashed border-gray-200" />

          {/* ============================================================= */}
          {/* 안건 서머리 구역 — 클릭 시 탭 이동 */}
          {/* ============================================================= */}
          <div className="grid grid-cols-4 gap-2">
            {summaryData.map((item, i) => (
              <button key={i} onClick={() => setActiveTab(item.tab)}
                className={`flex flex-col items-center py-3 rounded-xl transition-all ${
                  activeTab === item.tab
                    ? 'bg-[#FFF0F3] border border-[#FCD9E1]'
                    : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                }`}
              >
                <item.icon className={`w-4 h-4 mb-1 ${
                  activeTab === item.tab ? 'text-[#E8668A]' : 'text-gray-400'
                }`} />
                <span className={`text-[18px] font-black ${
                  activeTab === item.tab ? 'text-[#E8668A]' : 'text-gray-700'
                }`}>
                  {item.count}
                </span>
                <span className="text-[8px] font-bold text-gray-400 mt-0.5">{item.label}</span>
              </button>
            ))}
          </div>

          {/* ============================================================= */}
          {/* 탭 버튼 */}
          {/* ============================================================= */}
          <div className="flex gap-1 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabs.map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black whitespace-nowrap transition-all ${
                  activeTab === i
                    ? i === 3
                      ? 'bg-[#F0F7F0] text-[#4A8C5C] border border-[#C6E6C6]'
                      : 'bg-[#FFF0F3] text-[#E8668A] border border-[#FCD9E1]'
                    : 'bg-transparent text-gray-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ============================================================= */}
          {/* 탭 0: 내가 만든 안건 */}
          {/* ============================================================= */}
          {activeTab === 0 && (
            <div className="space-y-2">
              {myCreatedAgendas.length > 0 ? (
                <>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">마감 임박 순</p>
                  {myCreatedAgendas.map(a => (
                    <AgendaTile key={a.id} agenda={a} onClick={() => onSelectId(a.id)}
                      onDelete={onDelete} canDelete={true} isCompleted={false} />
                  ))}
                  <MostVotedOption agendas={myCreatedAgendas} />
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2 opacity-40">📋</p>
                  <p className="text-[11px] font-bold text-gray-400">아직 만든 안건이 없어요</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* 탭 1: 내가 참여한 안건 */}
          {/* ============================================================= */}
          {activeTab === 1 && (
            <div className="space-y-2">
              {myJoinedAgendas.length > 0 ? (
                <>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">마감 임박 순</p>
                  {myJoinedAgendas.map(a => (
                    <AgendaTile key={a.id} agenda={a} onClick={() => onSelectId(a.id)}
                      onDelete={onDelete} canDelete={false} isCompleted={false} />
                  ))}
                  <MostVotedOption agendas={myJoinedAgendas} />
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2 opacity-40">📋</p>
                  <p className="text-[11px] font-bold text-gray-400">참여한 안건이 없어요</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* 탭 2: 완료된 안건 */}
          {/* ============================================================= */}
          {activeTab === 2 && (
            <div className="space-y-2">
              {completedAgendas.length > 0 ? (
                completedAgendas.map(a => {
                  const isMyAgenda = a.isMock || a.creator_id === userId;
                  return (
                    <AgendaTile key={a.id} agenda={a} onClick={() => onSelectId(a.id)}
                      onDelete={onDelete} canDelete={isMyAgenda} isCompleted={true} />
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2 opacity-40">✅</p>
                  <p className="text-[11px] font-bold text-gray-400">완료된 안건이 없어요</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* 탭 3: Team */}
          {/* ============================================================= */}
          {activeTab === 3 && (
            <div className="space-y-3">
              {/* 내 팀 */}
              {myCreatedTeams && myCreatedTeams.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#C95374] uppercase tracking-wider mb-2">내 팀</p>
                  <div className="space-y-2">
                    {myCreatedTeams.map(t => (
                      <TeamTile key={t.id} team={t} isOwner={true}
                        onClick={() => onClickTeam(t.id)}
                        onDelete={async (id) => {
                          const result = await onDeleteTeam(id);
                          if (result?.success) showToast('팀이 삭제되었습니다');
                          else showToast('팀 삭제에 실패했습니다');
                        }}
                        onLeave={() => {}}
                        showToast={showToast} />
                    ))}
                  </div>
                </div>
              )}

              {/* 참여 팀 */}
              {myJoinedTeams && myJoinedTeams.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#4A6FA5] uppercase tracking-wider mb-2">참여 팀</p>
                  <div className="space-y-2">
                    {myJoinedTeams.map(t => (
                      <TeamTile key={t.id} team={t} isOwner={false}
                        onClick={() => onClickTeam(t.id)}
                        onDelete={() => {}}
                        onLeave={async (id) => {
                          const result = await onLeaveTeam(id);
                          if (result?.success) showToast('팀에서 탈퇴했습니다');
                          else showToast('팀 탈퇴에 실패했습니다');
                        }}
                        showToast={showToast} />
                    ))}
                  </div>
                </div>
              )}

              {/* 빈 상태 */}
              {(!myCreatedTeams || myCreatedTeams.length === 0) && (!myJoinedTeams || myJoinedTeams.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2 opacity-40">🏠</p>
                  <p className="text-[11px] font-bold text-gray-400">소속된 팀이 없어요</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
};

export default MyRoomView;