import React, { useMemo } from 'react';
import { Volume2 } from 'lucide-react';
import { Song } from '../types';
import { formatPitch, isBlackKey, PIANO_START, PIANO_END } from '../utils/pitch';

interface PianoKeyboardProps {
  userMin: number;
  userMax: number;
  selectedSong: Song | null;
  simulatedKeyShift: number;
  currentlyPlayingMidi: number | null;
  triggerAudioNote: (midiNumber: number) => void;
}

export function PianoKeyboard({
  userMin,
  userMax,
  selectedSong,
  simulatedKeyShift,
  currentlyPlayingMidi,
  triggerAudioNote
}: PianoKeyboardProps) {
  // Keyboard array helper for piano keys
  const pianoKeys = useMemo(() => {
    const keys = [];
    for (let i = PIANO_START; i <= PIANO_END; i++) {
      keys.push({
        midi: i,
        isBlack: isBlackKey(i),
        label: formatPitch(i).raw,
        noteOnly: formatPitch(i).note
      });
    }
    return keys;
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          鍵盤ピッチチェッカー (音出し可能)
        </h2>
        <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded font-mono border border-slate-850">
          lowC (36) - hihiC (84)
        </span>
      </div>
      
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        鍵盤をクリックするとサイン波が流れ、高精度の音程高さを耳で確認できます。背景のグリーン領域は「あなたの歌える範囲」を示しています。
      </p>

      {/* Virtual Keyboard visual board */}
      <div className="relative flex-1 min-h-[160px] max-h-[220px] overflow-x-auto select-none border border-slate-950 rounded-xl bg-slate-950 p-2 scrollbar-thin">
        <div className="absolute top-2 right-2 lg:hidden bg-emerald-950/90 text-emerald-300 border border-emerald-500/20 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-30 pointer-events-none animate-pulse">
          ◀ 左右スクロール可 ▶
        </div>
        <div className="flex h-full w-max min-w-full">
          {pianoKeys.map((key) => {
            const isInUserRange = key.midi >= userMin && key.midi <= userMax;
            const isCurrentSongMin = selectedSong && (selectedSong.min + simulatedKeyShift) === key.midi;
            const isCurrentSongMax = selectedSong && (selectedSong.max + simulatedKeyShift) === key.midi;
            const isPlaying = currentlyPlayingMidi === key.midi;

            return (
              <div
                key={key.midi}
                onClick={() => triggerAudioNote(key.midi)}
                style={{
                  width: key.isBlack ? '18px' : '28px',
                  marginLeft: key.isBlack ? '-9px' : '0',
                  marginRight: key.isBlack ? '-9px' : '0'
                }}
                className={`relative h-full transition-all cursor-pointer flex flex-col justify-end items-center pb-2 select-none shrink-0 ${
                  key.isBlack
                    ? `z-10 rounded-b-md ${
                        isPlaying 
                          ? 'bg-amber-400' 
                          : isCurrentSongMin || isCurrentSongMax 
                            ? 'bg-rose-500' 
                            : isInUserRange 
                              ? 'bg-slate-850 hover:bg-emerald-800/85 border-l border-r border-emerald-900/30' 
                              : 'bg-black hover:bg-slate-900'
                      }`
                    : `border-r border-slate-900 z-0 rounded-b-lg ${
                        isPlaying 
                          ? 'bg-amber-300 text-slate-900' 
                          : isCurrentSongMin || isCurrentSongMax 
                            ? 'bg-rose-400 text-white' 
                            : isInUserRange 
                              ? 'bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400/90 border-b-4 border-b-emerald-500/40' 
                              : 'bg-slate-900 hover:bg-slate-850 text-slate-500'
                      }`
                }`}
              >
                {/* Active playing indicator dot */}
                {isPlaying && (
                  <div className="absolute top-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}

                {/* Key range labels */}
                {!key.isBlack && (
                  <div className="text-[8px] scale-90 font-mono text-center overflow-hidden whitespace-nowrap">
                    {key.label === 'mid1C' && <span className="font-bold text-white text-[9px]">mid1C</span>}
                    {key.label === 'mid2C' && <span className="font-bold text-white text-[9px]">mid2C</span>}
                    {key.label === 'hiC' && <span className="font-bold text-white text-[9px]">hiC</span>}
                    {key.label === 'lowC' && <span className="font-bold text-white text-[9px]">lowC</span>}
                    {!['mid1C', 'mid2C', 'hiC', 'lowC'].includes(key.label) && key.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-900/40 border border-emerald-500/20" />
          <span>歌える範囲</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-rose-500" />
          <span>選択曲の音域境界</span>
        </div>
      </div>
    </div>
  );
}
