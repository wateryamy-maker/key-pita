import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { VoicePreset } from '../types';
import { NOTE_BASE_NAMES_JP } from '../data/songs';
import { formatPitch } from '../utils/pitch';

interface VoicePresetConfirmModalProps {
  presetToConfirm: VoicePreset | null;
  onConfirm: (preset: VoicePreset) => void;
  onCancel: () => void;
}

export const VoicePresetConfirmModal: React.FC<VoicePresetConfirmModalProps> = ({
  presetToConfirm,
  onConfirm,
  onCancel,
}) => {
  if (!presetToConfirm) return null;

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
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              音域設定を「{presetToConfirm.name}」に変更しますか？
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              一般的な特定の声域（声の高さ）に設定が切り替わります。
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-850/80 space-y-3.5 text-xs">
          <p className="text-slate-350 leading-relaxed font-medium">
            現在、お好みの「歌える曲」がマイリストに登録されています。
            このボタンを押すと、登録曲から推定されたあなたの音域値（最低音・最高音）が、一般的なプリセット値 <strong>【{presetToConfirm.name}】</strong> へ上書き・変更されます。
          </p>
          
          <div className="border-t border-slate-850 pt-2.5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-450 text-[10px]">適用後の音域目安:</span>
            <span className="text-emerald-450 font-semibold">
              {formatPitch(presetToConfirm.min).raw} ({NOTE_BASE_NAMES_JP[presetToConfirm.min % 12]})
              〜 
              {formatPitch(presetToConfirm.max).raw} ({NOTE_BASE_NAMES_JP[presetToConfirm.max % 12]})
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all hover:text-white cursor-pointer"
          >
            キャンセル
          </button>
          <button
            onClick={() => onConfirm(presetToConfirm)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-emerald-950/20 cursor-pointer"
          >
            上書きを許可
          </button>
        </div>
      </motion.div>
    </div>
  );
};
