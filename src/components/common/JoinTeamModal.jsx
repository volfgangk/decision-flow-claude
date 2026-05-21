// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useState } from 'react';
import { X, LogIn, User } from 'lucide-react';
import { validateInput } from '../../utils/profanityFilter';

// =========================================================================
// 2. [JOIN TEAM MODAL] — 팀 참여 모달 (이름 입력 + 필터)
// =========================================================================
const JoinTeamModal = ({ onClose, onJoin, showToast, existingName }) => {
  const [code, setCode] = useState('');
  const [userName, setUserName] = useState(existingName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // =========================================================================
  // 3. [HANDLE SUBMIT]
  // =========================================================================
  const handleSubmit = async () => {
    // 이름 검증
    const nameCheck = validateInput(userName, 20, '이름');
    if (!nameCheck.valid) {
      showToast(nameCheck.message);
      return;
    }

    if (code.trim().length < 6) {
      showToast('초대코드 6자리를 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    const result = await onJoin(code, userName);

    if (result?.success) {
      showToast(`"${result.teamName}" 팀에 참여했습니다! 🎉`);
      onClose();
    } else if (result?.error === 'TEAM_NOT_FOUND') {
      showToast('존재하지 않는 초대코드입니다');
    } else if (result?.error === 'ALREADY_JOINED') {
      showToast('이미 참여한 팀입니다');
    } else if (result?.error === 'TEAM_FULL') {
      showToast('팀 인원이 가득 찼습니다');
    } else if (result?.error === 'JOIN_LIMIT_REACHED') {
      showToast('무료 버전은 3개 팀까지 참여할 수 있어요');
    } else {
      showToast('참여에 실패했습니다. 다시 시도해주세요');
    }
    setIsSubmitting(false);
  };

  const isFormValid = code.trim().length >= 6 && userName.trim().length > 0;

  // =========================================================================
  // 4. [RENDER]
  // =========================================================================
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-[15px] font-black text-gray-900">팀 참여하기</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">내 이름</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value.slice(0, 20))}
                placeholder="실명으로 입력해주세요"
                maxLength={20}
                className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">초대코드 (6자리)</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-center text-2xl font-black tracking-[0.3em] focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/20 transition-all"
              autoFocus
            />
            <p className="text-[10px] text-gray-300 text-center mt-1.5">{code.length}/6자리</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-3 rounded-xl text-[14px] font-black text-white flex items-center justify-center gap-2 transition-all ${
              isFormValid && !isSubmitting
                ? 'bg-gradient-to-r from-[#5B8DEF] to-[#7C6CF0] active:scale-[0.98] shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? '참여 중...' : '팀 참여하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinTeamModal;