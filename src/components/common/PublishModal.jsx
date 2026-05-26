// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useState } from 'react';
import { X, Minus, Plus, Users, ChevronDown } from 'lucide-react';
import { validateInput } from '../../utils/profanityFilter';

// =========================================================================
// 2. [PUBLISH MODAL] — 안건 발행 준비 모달
// 역할: "의견모으기 시작" 후 이름+팀+인원을 입력받아 안건을 저장
// 케이스 1: 팀 없음 → 이름 + 새 팀명 + 인원 수
// 케이스 2: 팀 1개 이상 → 이름(자동채움) + 팀 선택 드롭다운 + (새 팀이면 인원 수)
// =========================================================================
const PublishModal = ({
  onClose,
  onSubmit,
  existingName,
  myCreatedTeams,
  myJoinedTeams,
  showToast,
}) => {
  const allTeams = [...(myCreatedTeams || []), ...(myJoinedTeams || [])];
  const hasTeams = allTeams.length > 0;

  const [userName, setUserName] = useState(existingName || '');
  const [teamName, setTeamName] = useState('');
  const [maxMembers, setMaxMembers] = useState(5);
  const [selectedTeamId, setSelectedTeamId] = useState(
    hasTeams ? allTeams[0]?.id : null
  );
  const [isNewTeam, setIsNewTeam] = useState(!hasTeams);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MIN_MEMBERS = 2;
  const MAX_MEMBERS = 10;

  // =========================================================================
  // 3. [SELECTED TEAM DISPLAY NAME]
  // =========================================================================
  const getSelectedTeamName = () => {
    if (isNewTeam) return teamName || '새 팀 이름 입력';
    const found = allTeams.find(t => t.id === selectedTeamId);
    return found?.team_name || '팀 선택';
  };

  // =========================================================================
  // 4. [HANDLE SUBMIT]
  // =========================================================================
  const handleSubmit = async () => {
    const nameCheck = validateInput(userName, 20, '이름');
    if (!nameCheck.valid) {
      showToast(nameCheck.message);
      return;
    }

    if (isNewTeam) {
      const teamCheck = validateInput(teamName, 20, '팀 이름');
      if (!teamCheck.valid) {
        showToast(teamCheck.message);
        return;
      }
    }

    if (!isNewTeam && !selectedTeamId) {
      showToast('팀을 선택해주세요');
      return;
    }

    setIsSubmitting(true);

    await onSubmit({
      userName: userName.trim(),
      isNewTeam,
      teamName: isNewTeam ? teamName.trim() : null,
      maxMembers: isNewTeam ? maxMembers : null,
      selectedTeamId: isNewTeam ? null : selectedTeamId,
    });

    setIsSubmitting(false);
  };

  const isFormValid = userName.trim().length > 0 &&
    (isNewTeam ? teamName.trim().length > 0 : selectedTeamId);

  // =========================================================================
  // 5. [RENDER]
  // =========================================================================
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">

        {/* 헤더 */}
        <div className="p-5 pb-3 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
          <div className="text-2xl mb-1">🎉</div>
          <h2 className="text-[15px] font-black text-gray-900">성공적으로 작성되었습니다!</h2>
          <p className="text-[11px] text-gray-400 mt-1">투표를 안전하게 보관하고 팀원들과 공유할 준비를 마쳐주세요.</p>
        </div>

        <div className="px-5 pb-5 space-y-4">

          {/* 이름 입력 */}
          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">내 이름 (실명)</label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value.slice(0, 20))}
              placeholder="실명으로 입력해주세요"
              maxLength={20}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#E8668A] focus:ring-2 focus:ring-[#E8668A]/20 transition-all"
            />
          </div>

          {/* 팀 선택 / 입력 */}
          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">
              이 투표를 진행할 그룹/팀명
            </label>

            {hasTeams ? (
              <>
                {/* 드롭다운 트리거 */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium text-left flex items-center justify-between focus:outline-none focus:border-[#E8668A] focus:ring-2 focus:ring-[#E8668A]/20 transition-all"
                  >
                    <span className={isNewTeam && !teamName ? 'text-gray-400' : 'text-gray-800'}>
                      {isNewTeam ? (teamName || '새 팀 만들기') : getSelectedTeamName()}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#4A648A] transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* 드롭다운 목록 */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-[200px] overflow-y-auto">
                      {/* 기존 팀 목록 */}
                      {allTeams.map(t => {
                        const isCreated = (myCreatedTeams || []).some(ct => ct.id === t.id);
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedTeamId(t.id);
                              setIsNewTeam(false);
                              setShowDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 border-b border-gray-50 last:border-0"
                          >
                            <span className="text-[13px] font-bold text-gray-700">{t.team_name}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              isCreated
                                ? 'bg-[#FFF0F3] text-[#C95374]'
                                : 'bg-[#EEF3FF] text-[#4A6FA5]'
                            }`}>
                              {isCreated ? '내가 만든 팀' : '참여한 팀'}
                            </span>
                          </button>
                        );
                      })}
                      {/* 새 팀 만들기 옵션 */}
                      <button
                        onClick={() => {
                          setIsNewTeam(true);
                          setSelectedTeamId(null);
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 text-[13px] font-black text-[#E8668A]"
                      >
                        + 새 팀 만들기
                      </button>
                    </div>
                  )}
                </div>

                {/* 새 팀 선택 시 팀명 입력 */}
                {isNewTeam && (
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value.slice(0, 20))}
                    placeholder="새 팀 이름을 입력해주세요"
                    maxLength={20}
                    className="w-full mt-2 px-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#E8668A] focus:ring-2 focus:ring-[#E8668A]/20 transition-all"
                  />
                )}
              </>
            ) : (
              /* 팀 없음: 직접 입력 */
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value.slice(0, 20))}
                placeholder="팀 이름을 입력해주세요"
                maxLength={20}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#E8668A] focus:ring-2 focus:ring-[#E8668A]/20 transition-all"
              />
            )}
          </div>

          {/* 인원 수 (새 팀일 때만) */}
          {isNewTeam && (
            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">
                이 투표를 진행할 그룹/팀 인원수
              </label>
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => setMaxMembers(prev => Math.max(MIN_MEMBERS, prev - 1))}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-[#E8668A] hover:text-[#E8668A] transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#E8668A]" />
                  <span className="text-2xl font-black text-gray-900 w-10 text-center">{maxMembers}</span>
                  <span className="text-[12px] font-bold text-gray-400">명</span>
                </div>
                <button
                  onClick={() => setMaxMembers(prev => Math.min(MAX_MEMBERS, prev + 1))}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-[#E8668A] hover:text-[#E8668A] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="px-5 pb-5">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-3.5 rounded-xl text-[14px] font-black text-white transition-all ${
              isFormValid && !isSubmitting
                ? 'bg-gradient-to-r from-[#E8668A] to-[#F4A067] active:scale-[0.98] shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? '저장 중...' : '안건 저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;