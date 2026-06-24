import React from 'react';
import { motion } from 'motion/react';
import { Heart, Volume2, Info, Sparkles } from 'lucide-react';
import { AnalyzedSong } from '../types';
import { formatPitch, PIANO_START, PIANO_END } from '../utils/pitch';

interface SongCardProps {
  song: AnalyzedSong;
  isSelected: boolean;
  isFavorite: boolean;
  userMin: number;
  userMax: number;
  simulatedKeyShift: number;
  onSelectSong: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTriggerAudioNote: (midiNumber: number) => void;
  onSetKeyShift: (shift: number) => void;
}

export const SongCard = React.memo(function SongCard({
  song,
  isSelected,
  isFavorite,
  userMin,
  userMax,
  simulatedKeyShift,
  onSelectSong,
  onToggleFavorite,
  onTriggerAudioNote,
  onSetKeyShift
}: SongCardProps) {
  // Pick status badges based on 3-tier system (Requirement ③)
  let statusBadgeStyle = "";
  let statusText = "";
  let suggestionText = "";

  if (song.tier === 'perfect') {
    statusBadgeStyle = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 shadow-sm shadow-emerald-500/10 animate-fade-in";
    statusText = "そのまま歌える";
    suggestionText = "原曲キー（キー調整なし）であなたの歌唱音域に完璧に収まっています！そのままで心地よく歌えます。";
  } else if (song.tier === 'adjustable') {
    statusBadgeStyle = "bg-indigo-500/15 text-indigo-400 border border-indigo-500/35 shadow-sm shadow-indigo-500/10 animate-fade-in";
    const formattedShift = song.optimalShift! > 0 ? `+${song.optimalShift}` : song.optimalShift;
    statusText = `キー変更で歌える (おすすめ: ${formattedShift})`;
    suggestionText = `キーを ${formattedShift} に設定することで、お持ちの音域のまま歌うことが可能です。`;
  } else {
    statusBadgeStyle = "bg-rose-500/10 text-rose-455 border border-rose-500/25";
    statusText = "難易度高め";
    
    if (song.originalWidth > (userMax - userMin)) {
      suggestionText = `曲の必要音域幅 (${song.originalWidth}半音) が、あなたの音域幅 (${userMax - userMin}半音) を超えているため攻略困難です。`;
    } else if (song.min < userMin) {
      suggestionText = `曲の最低音 (${formatPitch(song.min).raw} [${formatPitch(song.min).note}]) があなたの最低音 (${formatPitch(userMin).raw}) を下回っています。キーを上げてお試しください。`;
    } else {
      suggestionText = `曲の最高音 (${formatPitch(song.max).raw} [${formatPitch(song.max).note}]) があなたの最高音 (${formatPitch(userMax).raw}) を上回っています。キーを下げてお試しください。`;
    }
  }

  return (
    <motion.div
      layoutId={`song-card-${song.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onSelectSong(song.id)}
      className={`text-left rounded-2xl p-4.5 border transition-all cursor-pointer relative overflow-hidden ${
        isSelected 
          ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/5' 
          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-805 hover:border-slate-700'
      }`}
    >
      {/* Gender highlight sidebar */}
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
        song.gender === 'female' 
          ? 'bg-rose-400' 
          : song.gender === 'male' 
            ? 'bg-blue-400' 
            : 'bg-indigo-400'
      }`} />

      <div className="pl-2.5">
        
        {/* Title, Artist, Gender/Genre badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-md font-bold text-white group-hover:text-emerald-400 leading-snug">
                {song.title}
              </h3>
              {/* Gender badge */}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                song.gender === 'female' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                  : song.gender === 'male' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : 'bg-indigo-505/10 text-indigo-400 border border-indigo-505/20'
              }`}>
                {song.gender === 'female' ? '女性曲' : song.gender === 'male' ? '男性曲' : '男女共通'}
              </span>
              {/* Genre badge */}
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-slate-950 text-slate-300 border border-slate-800">
                {song.genre}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{song.artist}</p>
          </div>

          {/* Quick Action Buttons & 3-Tier Compatibility badge */}
          <div className="flex items-center gap-2 shrink-0 justify-end mt-1 sm:mt-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(song.id);
              }}
              className={`py-1 px-3 rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1.5 text-[11px] font-bold h-8 cursor-pointer shadow-sm ${
                isFavorite 
                  ? 'bg-pink-500/10 text-pink-400 border-pink-550/30 hover:bg-pink-500/20' 
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
              title={isFavorite ? "マイリスト（歌える曲）から解除" : "歌える曲としてマイリストに登録"}
            >
              <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorite ? 'fill-pink-500 text-pink-400' : 'text-slate-500'}`} />
              <span>{isFavorite ? '歌える！' : '歌える！登録'}</span>
            </button>

            <div className={`text-xs px-2.5 py-1 rounded-xl text-center font-bold h-8 flex items-center shrink-0 ${statusBadgeStyle}`}>
              {statusText}
            </div>
          </div>
        </div>

        {/* Relative Range visual bar compared dynamically with vocal range */}
        <div className="mt-4 bg-slate-950/80 p-3 rounded-xl border border-slate-850">
          
          {/* Tone labels info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1.5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              最低: {formatPitch(song.simMin).raw}
            </span>
            <span className="font-sans text-slate-500 text-[10px]">
              オリジナル: {formatPitch(song.min).raw} 〜 {formatPitch(song.max).raw}
            </span>
            <span className="flex items-center gap-1">
              最高: {formatPitch(song.simMax).raw}
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            </span>
          </div>

          {/* Complex Range Bar comparison rendering */}
          <div className="relative h-2.5 bg-slate-900 rounded-full overflow-hidden mt-1 select-none">
            {/* User vocal range backing block (green highlight) */}
            <div 
              style={{
                left: `${((userMin - PIANO_START) / (PIANO_END - PIANO_START)) * 100}%`,
                width: `${((userMax - userMin) / (PIANO_END - PIANO_START)) * 100}%`
              }}
              className="absolute top-0 bottom-0 bg-emerald-500/10 border-l border-r border-emerald-500/30"
            />

            {/* Shifted song bounds line block (Visual indicator) */}
            <div 
              style={{
                left: `${((song.simMin - PIANO_START) / (PIANO_END - PIANO_START)) * 100}%`,
                width: `${((song.simMax - song.simMin) / (PIANO_END - PIANO_START)) * 100}%`
              }}
              className={`absolute top-0.5 bottom-0.5 rounded-full transition-all ${
                song.simFitsPerfect 
                  ? 'bg-emerald-500/80 shadow-sm shadow-emerald-500/30' 
                  : song.canSingWithAdjustments 
                    ? 'bg-indigo-500/80' 
                    : 'bg-rose-500/80'
              }`}
            />
          </div>

          {/* Sound feedback buttons for boundaries */}
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-900 pt-2.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerAudioNote(song.simMin);
                }}
                className="px-2.5 py-1 text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 flex items-center gap-1 hover:text-emerald-400 transition-colors"
              >
                <Volume2 className="w-3 h-3 text-emerald-400/80" />
                最低音を聞く
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerAudioNote(song.simMax);
                }}
                className="px-2.5 py-1 text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 flex items-center gap-1 hover:text-rose-400 transition-colors shrink-0"
              >
                <Volume2 className="w-3 h-3 text-rose-400/80" />
                最高音を聞く
              </button>
            </div>

            {/* Tags list (Hidden on tiny mobile sizes) */}
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              {song.tags.slice(0, 2).map((tag, idx) => (
                <span key={idx} className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 scale-95 uppercase font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Expandable song metadata & guide */}
        {isSelected && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2.5"
          >
            <p className="flex items-start gap-1.5 text-slate-400">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>{song.description}</span>
            </p>

            {/* Intelligent Key advice panel */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 animate-pulse" />
                音域シミュレータ分析
              </span>
              <div className="text-slate-350 leading-relaxed font-sans text-[11px]">
                {suggestionText}
              </div>

              {/* Keys match database list */}
              {song.possibleKeyRange.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-500 mr-1.5">歌えるキー設定候補:</span>
                  {song.possibleKeyRange.map((offset) => (
                    <button
                      key={offset}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetKeyShift(offset);
                      }}
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        simulatedKeyShift === offset
                          ? 'bg-emerald-400 text-slate-950 border border-emerald-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-850'
                      }`}
                    >
                      {offset === 0 ? '原曲' : offset > 0 ? `+${offset}` : `${offset}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
});
