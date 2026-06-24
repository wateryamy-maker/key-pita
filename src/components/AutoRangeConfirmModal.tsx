import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { formatPitch } from '../utils/pitch';

export interface AutoRangeDiff {
  currentMin: number;
  currentMax: number;
  newMin: number;
  newMax: number;
  songTitle: string;
  exceedMinBy: number;
  exceedMaxBy: number;
}

interface AutoRangeConfirmModalProps {
  autoRangeDiff: AutoRangeDiff | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AutoRangeConfirmModal: React.FC<AutoRangeConfirmModalProps> = ({
  autoRangeDiff,
  onConfirm,
  onCancel,
}) => {
  if (!autoRangeDiff) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse text-indigo-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              「自動推定値を使う」に切り替えますか？
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              選択した曲「<strong>{autoRangeDiff.songTitle}</strong>」の音域が、現在の設定範囲を超えています。
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-850/80 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed font-medium">
            この曲は「マイ歌える曲」に登録されているため、登録曲を基準とした<strong>「自動推定値を使う」</strong>モードに切り替えることで、音域を最適化できます。
          </p>

          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-bold text-indigo-400 font-sans">音域の予想変化：</div>
            
            {/* Minimum Pitch Change */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium">最低音 (Low)</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-300 font-mono text-[11px] line-through opacity-60">
                    {formatPitch(autoRangeDiff.currentMin).raw} ({formatPitch(autoRangeDiff.currentMin).note})
                  </span>
                  <span className="text-slate-400 text-[10px]">→</span>
                  <span className="text-emerald-400 font-bold font-mono text-[11.5px]">
                    {formatPitch(autoRangeDiff.newMin).raw} ({formatPitch(autoRangeDiff.newMin).note})
                  </span>
                </div>
              </div>
              <div className="text-right">
                {autoRangeDiff.newMin - autoRangeDiff.currentMin < 0 ? (
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    {Math.abs(autoRangeDiff.newMin - autoRangeDiff.currentMin)}半音拡張（広がる）
                  </span>
                ) : autoRangeDiff.newMin - autoRangeDiff.currentMin > 0 ? (
                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                    {autoRangeDiff.newMin - autoRangeDiff.currentMin}半音上昇
                  </span>
                ) : (
                  <span className="text-slate-500 text-[10px]">変更なし</span>
                )}
              </div>
            </div>

            {/* Maximum Pitch Change */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium">最高音 (High)</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-300 font-mono text-[11px] line-through opacity-60">
                    {formatPitch(autoRangeDiff.currentMax).raw} ({formatPitch(autoRangeDiff.currentMax).note})
                  </span>
                  <span className="text-slate-400 text-[10px]">→</span>
                  <span className="text-emerald-400 font-bold font-mono text-[11.5px]">
                    {formatPitch(autoRangeDiff.newMax).raw} ({formatPitch(autoRangeDiff.newMax).note})
                  </span>
                </div>
              </div>
              <div className="text-right">
                {autoRangeDiff.newMax - autoRangeDiff.currentMax > 0 ? (
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    {autoRangeDiff.newMax - autoRangeDiff.currentMax}半音拡張（広がる）
                  </span>
                ) : autoRangeDiff.newMax - autoRangeDiff.currentMax < 0 ? (
                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                    {Math.abs(autoRangeDiff.newMax - autoRangeDiff.currentMax)}半音低下
                  </span>
                ) : (
                  <span className="text-slate-500 text-[10px]">変更なし</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all hover:text-white cursor-pointer"
          >
            手動設定のままにする
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-450 hover:to-purple-450 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-indigo-950/20 cursor-pointer"
          >
            自動推定に切り替える
          </button>
        </div>
      </motion.div>
    </div>
  );
};
