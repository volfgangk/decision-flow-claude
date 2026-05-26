// ================================================
// 📌 VoteView.jsx — 투표 진행 화면
// 이 파일이 하는 일: 선택지 트리 표시 및 투표
// 수정할 일: 투표 화면 디자인/기능 변경 시
// ================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft, Copy, Users, X,
  Check, CornerDownRight, BarChart2, Network
} from 'lucide-react';
import { DESIGN_TOKENS } from '../../constants/colors';
import TreeEngine from '../../utils/treeEngine';
import GuestModal from '../common/GuestModal';

const VoteView = ({ decision, setView, onVoteSubmit, hasVoted, showToast, isAdmin, onKick }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [showGuest, setShowGuest]   = useState(!isAdmin && !hasVoted);
  const [userName, setUserName]   = useState(isAdmin ? '방장' : '');
  const [userPersona, setUserPersona] = useState(null);

  const winningPaths = useMemo(
    () => TreeEngine.computeWinningPaths(decision.options, decision.voters),
    [decision.options, decision.voters]
  );
  const rootOptions = useMemo(
    () => decision.options.filter(o => !o.id.includes('-')),
    [decision.options]
  );
  const showStats = hasVoted;

  const getPercentage = useCallback(
    (count) => !decision.voters ? '0%' : ((count / decision.voters) * 100).toFixed(1) + '%',
    [decision.voters]
  );

  return (
    <>
      {showGuest && (
        <GuestModal
        onJoin={(name, persona) => {
          setUserName(name);
          setUserPersona(persona);
          setShowGuest(false);
        }}
        onClose={() => setView('home')}
      />
      )}
      <header className="px-4 py-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
        <button onClick={() => setView('home')} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft />
        </button>
        <h1 className="font-black text-base text-gray-900 truncate max-w-[240px] text-center">
          {decision.title}
        </h1>
        <button
  onClick={() => {
    try {
      const json = JSON.stringify(decision);
      const encoded = encodeURIComponent(json);
      const url = `${window.location.origin}?d=${encoded}`;
      navigator.clipboard.writeText(url)
        .then(() => showToast('투표 링크가 복사되었습니다! ✨'))
        .catch(() => {
          const el = document.createElement('textarea');
          el.value = url;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          showToast('투표 링크가 복사되었습니다! ✨');
        });
    } catch {
      showToast('링크 복사에 실패했습니다.');
    }
  }}
  className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
>
  <Copy className="w-5 h-5" />
</button>
      </header>

      <main className={`flex-1 px-5 pt-4 overflow-y-auto bg-gray-50 ${isAdmin ? 'pb-56' : 'pb-40'}`}>
        {/* 상태 배지 */}
        <div className="mb-4 flex items-center gap-2 flex-wrap shrink-0">
          <div className="inline-flex items-center gap-1.5 bg-[#FAFFEB] border border-[#B6FF33]/60 px-2.5 py-1 rounded-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8CB82D] animate-pulse" />
            <span className="text-[10px] font-black text-[#6B8E23] uppercase tracking-wider">{decision.status}</span>
          </div>
          <div className={`inline-flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md shadow-sm ${isAdmin ? 'border-blue-100' : hasVoted ? 'border-pink-100' : 'border-gray-200'}`}>
            <span className={`text-[10px] font-black ${isAdmin ? 'text-blue-500' : hasVoted ? 'text-[#E8668A]' : 'text-gray-400'}`}>
              {isAdmin ? '👑 방장 모드' : hasVoted ? '✅ 내 투표 완료' : '📝 미참여'}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 bg-red-50 border border-red-100 px-2.5 py-1 rounded-md shadow-sm ml-auto">
            <span className="text-[10px] font-black text-[#FF6B6B] tracking-tight">
              {TreeEngine.getRemainingTime(decision.deadline, decision.dDay)}
            </span>
          </div>
        </div>

        {/* 선택지 트리 */}
        <div className="space-y-3">
          {rootOptions.map(root => {
            const l1Children = TreeEngine.getChildren(decision.options, root.id, 2);
            const isLeaf     = TreeEngine.isLeafNode(decision.options, root.id);
            const isSelected = selectedId === root.id;
            const isWinner   = showStats && winningPaths.has(root.id);

            return (
              <div key={root.id} className="flex flex-col gap-1.5 bg-gray-200/40 border border-gray-200/60 rounded-[32px] p-3 transition-all">
                {isLeaf ? (
                  <button
                    disabled={hasVoted}
                    onClick={() => setSelectedId(root.id)}
                    className={`w-full p-4 rounded-2xl text-left transition-all border-2 flex justify-between items-center ${
                      isSelected ? 'bg-white border-[#B6FF33] shadow-[0_10px_20px_-5px_rgba(182,255,51,0.3)]'
                      : isWinner ? `${DESIGN_TOKENS.statsBg} ${DESIGN_TOKENS.statsBorder} shadow-sm`
                      : 'bg-white border-gray-100 shadow-sm'
                    } ${''}`}
                  >
                    <div className="flex gap-2 flex-1 mr-2 overflow-hidden items-center">
                      <span className="text-[15px] font-black text-[#E8668A] shrink-0">{root.id}.</span>
                      <span className="text-[15px] font-black text-gray-800 break-words">{root.text}</span>
                    </div>
                    {showStats ? (
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {isWinner && <span className="text-[10px] font-black text-[#FF6B6B] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md animate-pulse">🔥 대세</span>}
                        <span className="text-xs font-black text-[#8CB82D] bg-[#FAFFEB] border border-[#B6FF33]/30 px-2.5 py-1.5 rounded-lg shadow-sm">
                          {root.voteCount}표 ({getPercentage(root.voteCount)})
                        </span>
                      </div>
                    ) : isSelected && (
                      <div className="w-5 h-5 bg-[#B6FF33] rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-[#2C4000]" />
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="w-full px-4 py-2 flex items-center gap-2">
                    <span className="text-[14px] font-black text-gray-400 shrink-0">{root.id}.</span>
                    <span className="text-[14px] font-black text-gray-500">{root.text}</span>
                  </div>
                )}

                {l1Children.map(l1 => {
                  const l2Children = TreeEngine.getChildren(decision.options, l1.id, 3);
                  const isL1Leaf   = TreeEngine.isLeafNode(decision.options, l1.id);
                  const isL1Sel    = selectedId === l1.id;
                  const isL1Win    = showStats && winningPaths.has(l1.id);

                  return (
                    <div key={l1.id} className="space-y-1.5">
                      {isL1Leaf ? (
                        <button
                          disabled={hasVoted}
                          onClick={() => setSelectedId(l1.id)}
                          className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border-2 ${
                            isL1Sel ? 'bg-white border-[#B6FF33] shadow-[0_10px_20px_-5px_rgba(182,255,51,0.3)]'
                            : isL1Win ? `${DESIGN_TOKENS.statsBg} ${DESIGN_TOKENS.statsBorder} shadow-sm`
                            : 'bg-white border-gray-100 shadow-sm'
                          } ${''}`}
                        >
                          <div className="flex items-center gap-3 flex-1 mr-2 overflow-hidden">
                            <CornerDownRight className="w-4 h-4 text-gray-300 shrink-0" />
                            <span className="text-[14px] font-black text-[#F4A067] shrink-0">{l1.id}.</span>
                            <span className="text-[14px] font-bold text-gray-800 break-words">{l1.text}</span>
                          </div>
                          {showStats ? (
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              {isL1Win && <span className="text-[10px] font-black text-[#FF6B6B] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md animate-pulse">🔥 대세</span>}
                              <span className="text-xs font-black text-[#8CB82D] bg-[#FAFFEB] border border-[#B6FF33]/30 px-2.5 py-1.5 rounded-lg shadow-sm">
                                {l1.voteCount}표 ({getPercentage(l1.voteCount)})
                              </span>
                            </div>
                          ) : isL1Sel && (
                            <div className="w-5 h-5 bg-[#B6FF33] rounded-full flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 text-[#2C4000]" />
                            </div>
                          )}
                        </button>
                      ) : (
                        <div className="w-full px-4 py-1.5 flex items-center gap-3">
                          <CornerDownRight className="w-4 h-4 text-gray-300 shrink-0" />
                          <span className="text-[13px] font-black text-gray-400">{l1.id}.</span>
                          <span className="text-[13px] font-black text-gray-500">{l1.text}</span>
                        </div>
                      )}

                      {l2Children.map(l2 => {
                        const isL2Sel = selectedId === l2.id;
                        const isL2Win = showStats && winningPaths.has(l2.id);
                        return (
                          <button
                            key={l2.id}
                            disabled={hasVoted}
                            onClick={() => setSelectedId(l2.id)}
                            className={`p-3 rounded-xl text-left transition-all flex items-center justify-between border-2 ${
                              isL2Sel ? 'bg-white border-[#B6FF33] shadow-[0_10px_20px_-5px_rgba(182,255,51,0.3)]'
                              : isL2Win ? `${DESIGN_TOKENS.statsBg} ${DESIGN_TOKENS.statsBorder} shadow-sm`
                              : 'bg-white border-gray-100 shadow-sm'
                            } ${''}`}
                            style={{ width: 'calc(100% - 24px)', marginLeft: '24px' }}
                          >
                            <div className="flex items-center gap-3 flex-1 mr-2 overflow-hidden">
                              <CornerDownRight className="w-3.5 h-3.5 text-gray-200 shrink-0" />
                              <span className="text-[12px] font-black text-[#8CB82D] shrink-0">{l2.id}.</span>
                              <span className="text-[12px] font-bold text-gray-700 break-words">{l2.text}</span>
                            </div>
                            {showStats ? (
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                {isL2Win && <span className="text-[10px] font-black text-[#FF6B6B] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md animate-pulse">🔥 대세</span>}
                                <span className="text-xs font-black text-[#8CB82D] bg-[#FAFFEB] border border-[#B6FF33]/30 px-2.5 py-1.5 rounded-lg shadow-sm">
                                  {l2.voteCount}표 ({getPercentage(l2.voteCount)})
                                </span>
                              </div>
                            ) : isL2Sel && (
                              <div className="w-4 h-4 bg-[#B6FF33] rounded-full flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-[#2C4000]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>


      </main>

      <div className={`absolute bottom-[76px] left-0 w-full px-6 pb-6 bg-gradient-to-t from-white via-white/90 to-transparent z-10 ${isAdmin ? 'pt-6' : 'pt-10'}`}>
      {(isAdmin && hasVoted) ? (
  <div className="space-y-2">
    {decision.earlyCloseRate && decision.voters > 0 && (
      <div className={`rounded-2xl p-3 text-center border ${
        decision.voters >= Math.ceil(decision.earlyCloseRate / 10)
          ? 'bg-[#FAFFEB] border-[#B6FF33]/60'
          : 'bg-gray-50 border-gray-200'
      }`}>
        {decision.voters >= Math.ceil(decision.earlyCloseRate / 10) ? (
          <>
            <p className="text-[12px] font-black text-[#8CB82D]">
              🎯 목표 투표율 {decision.earlyCloseRate}% 달성!
            </p>
            <p className="text-[11px] text-gray-500 font-bold mt-0.5">
              지금 마감하시겠습니까?
            </p>
          </>
        ) : (
          <p className="text-[11px] font-black text-gray-400">
            조기 마감 기준: {decision.earlyCloseRate}% | 현재: {decision.voters}명 참여
          </p>
        )}
      </div>
    )}
    <button
      onClick={() => setView('minimap')}
      className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl py-4 font-black shadow-xl active:scale-95 transition-all text-lg"
    >
      투표 강제 조기 마감하기
    </button>
  </div>
        ) : hasVoted ? (
          <div className="flex gap-2">
            <button onClick={() => setView('minimap')} className="flex-1 bg-white border-2 border-[#D2DFEE] text-[#4A648A] rounded-2xl py-4 font-black shadow-sm active:scale-95 transition-all text-[13px] flex items-center justify-center gap-1.5">
              <BarChart2 className="w-4 h-4" /> 리스트 뷰
            </button>
            <button onClick={() => setView('visualmap')} className="flex-1 bg-[#FFF0F3] border-2 border-[#FCD9E1] text-[#E8668A] rounded-2xl py-4 font-black shadow-sm active:scale-95 transition-all text-[13px] flex items-center justify-center gap-1.5">
  <Network className="w-4 h-4" /> 비주얼 트리
            </button>
          </div>
        ) : (
          <button
            disabled={!selectedId}
            onClick={() => selectedId && onVoteSubmit(decision.id, selectedId, userName, userPersona)}
            className={`w-full rounded-2xl py-5 font-black shadow-xl transition-all text-lg ${
              !selectedId ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-[#E8668A] to-[#F4A067] text-white active:scale-95'
            }`}
          >
            투표 완료하기
          </button>
        )}
      </div>
    </>
  );
};

export default VoteView;