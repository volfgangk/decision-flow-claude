// =========================================================================
// 1. [SPLASH VIEW] — 로고 스플래시 화면
// 역할: 첫 방문 → 클릭해야만 넘어감 / 재방문 → 건너뜀
// =========================================================================
import React from 'react';

const SplashView = ({ onProceed }) => {
  return (
    <div
      onClick={onProceed}
      className="min-h-full bg-white flex flex-col items-center justify-center cursor-pointer select-none relative"
    >
      <p className="text-[13px] font-black text-gray-300 tracking-widest absolute top-6 left-6">
        DECISION FLOW
      </p>

      <div className="animate-[breathe_3s_ease-in-out_infinite]">
        <img
          src="/앱로고.jpg"
          alt="Decision Flow"
          className="w-28 h-28 object-contain rounded-2xl"
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>
      <p className="mt-4 text-[15px] font-black text-[#E8668A] tracking-wide">
        DECISION FLOW
      </p>

      <p className="absolute bottom-12 text-[11px] text-gray-300 animate-pulse">
        화면을 터치하세요
      </p>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashView;