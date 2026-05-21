// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useMemo, useState } from 'react';
import { ChevronLeft, Trophy, FileText, Users, CheckCircle2, Clock, X, Edit3, Save, AlertCircle } from 'lucide-react';
import { validateInput } from '../../utils/profanityFilter';

// =========================================================================
// 2. [MY ROOM VIEW] — 마이룸 화면
// =========================================================================
const MyRoomView = ({ setView, decisions, votedIds, onSelectId, onDelete, showToast, userName, isPremium, onUpdateName }) => {
  const MOCK_IDS = [10001, 10002, 20001];

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userName || '');
  const [isSaving, setIsSaving] = useState(false);

  // =========================================================================
  // 3. [STATS] — 통계 계산
  // =========================================================================
  const stats = useMemo(() => {
    const myDecisions = decisions.filter(d => d.id !== 20001);
    const participated = decisions.filter(d => votedIds.includes(d.id));
    const closed = myDecisions.filter(d =>
      d.status === '마감' || (d.deadline && new Date(d.deadline) <= new Date())
    );
    const resolved = closed.filter(d => d.voters >= 2);
    const resolutionRate = closed.length > 0
      ? Math.round((resolved.length / closed.length) * 100)
      : 0;

    return {
      totalCreated: myDecisions.length,
      totalParticipated: participated.length,
      totalClosed: closed.length,
      resolutionRate,
    };
  }, [decisions, votedIds]);

  // =========================================================================
  // 4. [NAME CHANGE LOGIC] — 이름 변경 가능 여부 판단
  // =========================================================================
  const nameChangeCheck = useMemo(() => {
    if (isPremium) {
      return { canChange: true, reason: null };
    }

    const myDecisions = decisions.filter(d => d.id !== 20001 && !MOCK_IDS.includes(d.id));
    const votedDecisions = decisions.filter(d => votedIds.includes(d.id));

    const hasActiveCreated = myDecisions.some(d =>
      d.status !== '마감' && !(d.deadline && new Date(d.deadline) <= new Date())
    );

    const hasActiveVoted = votedDecisions.some(d =>
      d.status !== '마감' && !(d.deadline && new Date(d.deadline) <= new Date())
    );

    if (hasActiveCreated || hasActiveVoted) {
      return {
        canChange: false,
        reason: '진행 중인 안건이 모두 완료된 후 변경할 수 있어요',
      };
    }

    return { canChange: true, reason: null };
  }, [decisions, votedIds, isPremium]);

  // =========================================================================
  // 5. [HANDLE NAME SAVE]
  // =========================================================================
  const handleNameSave = async () => {
    const check = validateInput(newName, 20, '이름');
    if (!check.valid) {
      showToast(check.message);
      return;
    }

    if (newName.trim() === userName) {
      setIsEditingName(false);
      return;
    }

    setIsSaving(true);
    const result = await onUpdateName(newName);
    if (result?.success) {
      showToast('이름이 변경되었습니다 ✅');
      setIsEditingName(false);
    } else {
      showToast('이름 변경에 실패했습니다');
    }
    setIsSaving(false);
  };

  // =========================================================================
  // 6. [DATA] — 목록 데이터
  // =========================================================================
  const myDecisions = decisions.filter(d => d.id !== 20001);
  const participatedDecisions = decisions.filter(d => votedIds.includes(d.id));

  // =========================================================================
  // 7. [RENDER]
  // =========================================================================
  return (
    <>
      <header className="px-4 pt-3 pb-2 bg-white shrink-0 flex items-center gap-3 border-b border-gray-50">
        <button onClick={() => setView('home')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-[16px] font-black text-gray-900">마이룸</h1>
      </header>

      <main className="flex-1 px-5 pb-24 overflow-y-auto bg-white">
        {/* ============================================================= */}
        {/* 프로필 + 이름 관리 */}
        {/* ============================================================= */}
        <div className="mt-4 mb-5 bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">내 프로필</span>
            {isPremium && (
              <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">⭐ PREMIUM</span>
            )}
          </div>

          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value.slice(0, 20))}
                placeholder="실명으로 입력해주세요"
                maxLength={20}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-[14px] font-bold focus:outline-none focus:border-[#E8668A] focus:ring-2 focus:ring-[#E8668A]/20"
                autoFocus
              />
              <button
                onClick={handleNameSave}
                disabled={isSaving}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E8668A] text-white shrink-0"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setIsEditingName(false); setNewName(userName || ''); }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[16px] font-black text-gray-900">
                  {userName || '이름을 설정해주세요'}
                </p>
                {!userName && (
                  <p className="text-[10px] text-gray-400 mt-0.5">팀을 만들거나 참여하면 이름이 설정됩니다</p>
                )}
              </div>
              {userName && (
                <button
                  onClick={() => {
                    if (!nameChangeCheck.canChange) {
                      showToast(nameChangeCheck.reason);
                      return;
                    }
                    setNewName(userName);
                    setIsEditingName(true);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    nameChangeCheck.canChange
                      ? 'text-[#E8668A] bg-white hover:bg-pink-50'
                      : 'text-gray-300 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  변경
                </button>
              )}
            </div>
          )}

          {!isEditingName && userName && !nameChangeCheck.canChange && (
            <div className="flex items-center gap-1.5 mt-2 text-gray-400">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <p className="text-[10px]">{nameChangeCheck.reason}</p>
            </div>
          )}
        </div>

        {/* ============================================================= */}
        {/* 통계 카드 */}
        {/* ============================================================= */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <FileText className="w-4 h-4 text-[#E8668A] mx-auto mb-1" />
            <p className="text-lg font-black text-gray-900">{stats.totalCreated}</p>
            <p className="text-[10px] font-bold text-gray-400">만든 안건</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-[#5B8DEF] mx-auto mb-1" />
            <p className="text-lg font-black text-gray-900">{stats.totalParticipated}</p>
            <p className="text-[10px] font-bold text-gray-400">참여한 안건</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-black text-gray-900">{stats.totalClosed}</p>
            <p className="text-[10px] font-bold text-gray-400">완료된 안건</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-black text-gray-900">{stats.resolutionRate}%</p>
            <p className="text-[10px] font-bold text-gray-400">해결률</p>
          </div>
        </div>

        {/* ============================================================= */}
        {/* 내가 만든 안건 목록 */}
        {/* ============================================================= */}
        {myDecisions.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">내가 만든 안건</h3>
            <div className="space-y-2">
              {myDecisions.map(item => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="bg-pink-50 text-[#E8668A] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      {item.status || '진행중'}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{item.dDay}</span>
                      </div>
                      {!MOCK_IDS.includes(item.id) && (
                        <button
                          onClick={() => {
                            if (window.confirm(`"${item.title.substring(0,20)}..." 삭제하시겠습니까?`)) {
                              onDelete(item.id);
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-400 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div onClick={() => onSelectId(item.id)} className="cursor-pointer active:scale-[0.99]">
                    <p className="text-[13px] font-black text-gray-800 mb-1 break-keep leading-tight">{item.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users className="w-3 h-3" />
                        <span className="text-[10px] font-medium">{item.voters}명 참여</span>
                      </div>
                      <span className="text-[10px] text-[#8CB82D] font-black">
                        {item.options?.length || 0}개 선택지
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* 내가 참여한 안건 목록 */}
        {/* ============================================================= */}
        {participatedDecisions.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">내가 참여한 안건</h3>
            <div className="space-y-2">
              {participatedDecisions.map(item => (
                <div key={item.id} onClick={() => onSelectId(item.id)}
                  className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm cursor-pointer active:scale-[0.99]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="bg-blue-50 text-[#5B8DEF] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      {item.status || '진행중'}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{item.dDay}</span>
                    </div>
                  </div>
                  <p className="text-[13px] font-black text-gray-800 mb-1 break-keep leading-tight">{item.title}</p>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{item.voters}명 참여</span>
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

export default MyRoomView;