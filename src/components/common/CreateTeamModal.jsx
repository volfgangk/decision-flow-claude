// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import React, { useState } from 'react';
import { X, Minus, Plus, Copy, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// =========================================================================
// 2. [CREATE TEAM MODAL] — 팀 생성 모달
// =========================================================================
const CreateTeamModal = ({ onClose, onCreate, showToast, existingName }) => {
  const [step, setStep] = useState('form'); // 'form' | 'result'
  const [userName, setUserName] = useState(existingName || '');
  const [teamName, setTeamName] = useState('');
  const [maxMembers, setMaxMembers] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);

  const MIN_MEMBERS = 2;
  const MAX_MEMBERS = 10; // 무료 기준

  // =========================================================================
  // 3. [HANDLERS]
  // =========================================================================
  const handleSubmit = async () => {
    if (!userName.trim() || !teamName.trim()) return;
    setIsSubmitting(true);

    const result = await onCreate(teamName, maxMembers, userName);

    if (result?.success) {
      setResultData(result);
      setStep('result');
    } else if (result?.error === 'LIMIT_REACHED') {
      showToast('무료 버전은 팀 2개까지 만들 수 있어요');
    } else {
      showToast('팀 생성에 실패했습니다. 다시 시도해주세요');
    }
    setIsSubmitting(false);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${resultData.inviteCode}`;
    try {
      navigator.clipboard.writeText(link);
      showToast('초대 링크가 복사되었습니다! ✨');
    } catch {
      const el = document.createElement('textarea');
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('초대 링크가 복사되었습니다! ✨');
    }
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(resultData.inviteCode);
      showToast('초대코드가 복사되었습니다!');
    } catch {
      showToast('초대코드: ' + resultData.inviteCode);
    }
  };

  const isFormValid = userName.trim().length > 0 && teamName.trim().length > 0;

  // =========================================================================
  // 4. [RENDER — FORM STEP]
  // =========================================================================
  if (step === 'form') {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-[15px] font-black text-gray-900">새 팀 만들기</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">내 이름 (실명)</label>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="홍길동"
                maxLength={10}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#E8668A] focus:ring-2 focus:ring-[#E8668A]/20 transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">팀 이름 (20자 이내)</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value.slice(0, 20))}
                placeholder="마케팅팀 워크숍"
                maxLength={20}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#E8668A] focus:ring-2 focus:ring-[#E8668A]/20 transition-all"
              />
              <span className="text-[10px] text-gray-400 mt-1 block text-right">{teamName.length}/20</span>
            </div>

            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">팀원 수</label>
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
              <p className="text-[10px] text-gray-400 text-center mt-1">무료: 최대 10명 / 프리미엄: 최대 50명</p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-3 rounded-xl text-[14px] font-black text-white transition-all ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-[#E8668A] to-[#F4A067] active:scale-[0.98] shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? '생성 중...' : '팀 만들기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. [RENDER — RESULT STEP] — 초대코드 + QR 표시
  // =========================================================================
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <h2 className="text-[16px] font-black text-gray-900 mb-1">팀이 만들어졌어요!</h2>
          <p className="text-[12px] text-gray-400 mb-5">아래 초대코드를 팀원에게 공유하세요</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">초대코드</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black tracking-[0.3em] text-gray-900">{resultData?.inviteCode}</span>
              <button onClick={handleCopyCode} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-100">
                <Copy className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <QRCodeSVG
                value={`${window.location.origin}/join/${resultData?.inviteCode}`}
                size={120}
                level="M"
                fgColor="#1a1a1a"
              />
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full py-3 rounded-xl text-[13px] font-black text-white bg-gradient-to-r from-[#E8668A] to-[#F4A067] active:scale-[0.98] shadow-lg mb-2"
          >
            초대 링크 복사하기
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-[13px] font-bold text-gray-400 hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;