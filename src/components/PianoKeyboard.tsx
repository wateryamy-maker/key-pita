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
  onSetUserMin?: (midiNumber: number) => void;
  onSetUserMax?: (midiNumber: number) => void;
  setRangeMode?: (mode: 'auto' | 'manual') => void;
}

export function PianoKeyboard({
  userMin,
  userMax,
  selectedSong,
  simulatedKeyShift,
  currentlyPlayingMidi,
  triggerAudioNote,
  onSetUserMin,
  onSetUserMax,
  setRangeMode
}: PianoKeyboardProps) {
  // Local state to keep track of the last clicked note for the setting panel
  const [lastClickedMidi, setLastClickedMidi] = React.useState<number | null>(null);

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

  const handleKeyClick = (midi: number) => {
    triggerAudioNote(midi);
    setLastClickedMidi(midi);
  };

  return (
    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 shadow-inner w-full flex flex-col">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/60">
        <h2 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          鍵盤ピッチチェッカー (音域の設定・音出し)
        </h2>
        <span className="text-[9px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded font-mono border border-slate-850">
          lowC (36) - hihiC (84)
        </span>
      </div>
      
      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
        鍵盤をクリックしてピアノの音を鳴らしながら、あなたの出せる最低音・最高音をその場で直感的に設定できます。背景のグリーン領域は「あなたの歌える範囲」です。
      </p>

      {/* Virtual Keyboard visual board */}
      <div className="relative h-[150px] overflow-x-auto select-none border border-slate-950 rounded-xl bg-slate-950 p-2 scrollbar-thin">
        <div className="absolute top-2 right-2 lg:hidden bg-emerald-950/90 text-emerald-300 border border-emerald-500/20 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-30 pointer-events-none animate-pulse">
          ◀ 左右スクロール可 ▶
        </div>
        <div className="flex h-full w-max min-w-full pb-1">
          {pianoKeys.map((key) => {
            const isInUserRange = key.midi >= userMin && key.midi <= userMax;
            const isCurrentSongMin = selectedSong && (selectedSong.min + simulatedKeyShift) === key.midi;
            const isCurrentSongMax = selectedSong && (selectedSong.max + simulatedKeyShift) === key.midi;
            const isPlaying = currentlyPlayingMidi === key.midi;
            const isBoundaryMin = key.midi === userMin;
            const isBoundaryMax = key.midi === userMax;

            return (
              <div
                key={key.midi}
                onClick={() => handleKeyClick(key.midi)}
                style={{
                  width: key.isBlack ? '18px' : '28px',
                  marginLeft: key.isBlack ? '-9px' : '0',
                  marginRight: key.isBlack ? '-9px' : '0'
                }}
                className={`relative transition-all cursor-pointer flex flex-col justify-end items-center pb-1.5 select-none shrink-0 ${
                  key.isBlack
                    ? `z-10 h-[64%] rounded-b-[4px] shadow-[0_3px_5px_rgba(0,0,0,0.4),inset_0_-1px_1px_rgba(255,255,255,0.15)] ${
                        isBoundaryMin
                          ? 'bg-gradient-to-b from-emerald-500 to-emerald-800 border border-emerald-400'
                          : isBoundaryMax
                            ? 'bg-gradient-to-b from-rose-500 to-rose-800 border border-rose-400'
                            : isPlaying
                              ? 'bg-gradient-to-b from-amber-400 to-amber-600'
                              : isCurrentSongMin || isCurrentSongMax
                                ? 'bg-gradient-to-b from-rose-500 to-rose-700'
                                : isInUserRange
                                  ? 'bg-gradient-to-b from-slate-800 via-emerald-950 to-emerald-900 border-b-2 border-b-emerald-500/50'
                                  : 'bg-gradient-to-b from-slate-800 via-slate-900 to-black hover:from-slate-700 hover:to-slate-950'
                      }`
                    : `z-0 h-full rounded-b-md border-r border-b border-l border-slate-300/80 shadow-[inset_0_-5px_5px_-3px_rgba(0,0,0,0.06),0_2px_3px_rgba(0,0,0,0.08)] ${
                        isBoundaryMin
                          ? 'bg-emerald-50/95 border-emerald-400 border-b-4 border-b-emerald-500 text-emerald-950 font-bold shadow-[inset_0_-8px_8px_-4px_rgba(16,185,129,0.15)]'
                          : isBoundaryMax
                            ? 'bg-rose-50/95 border-rose-400 border-b-4 border-b-rose-500 text-rose-950 font-bold shadow-[inset_0_-8px_8px_-4px_rgba(244,63,94,0.15)]'
                            : isPlaying
                              ? 'bg-amber-100 border-amber-300 text-amber-950 shadow-[inset_0_-4px_4px_rgba(245,158,11,0.1)]'
                              : isCurrentSongMin || isCurrentSongMax
                                ? 'bg-rose-100 border-rose-300 text-rose-950'
                                : isInUserRange
                                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-500'
                      }`
                } ${isBoundaryMin ? 'ring-2 ring-emerald-500/40 ring-offset-1 ring-offset-slate-950' : ''} ${isBoundaryMax ? 'ring-2 ring-rose-500/40 ring-offset-1 ring-offset-slate-950' : ''}`}
              >
                {/* Active boundary badges on keys */}
                {isBoundaryMin && (
                  <div className={`absolute ${key.isBlack ? 'top-1' : 'top-1.5'} px-1 py-0.5 rounded bg-emerald-500 text-slate-950 text-[7px] font-black leading-none uppercase select-none pointer-events-none z-20 shadow-[0_1px_2px_rgba(0,0,0,0.15)]`}>
                    Low
                  </div>
                )}
                {isBoundaryMax && (
                  <div className={`absolute ${key.isBlack ? 'top-1' : 'top-1.5'} px-1 py-0.5 rounded bg-rose-500 text-white text-[7px] font-black leading-none uppercase select-none pointer-events-none z-20 shadow-[0_1px_2px_rgba(0,0,0,0.15)]`}>
                    High
                  </div>
                )}

                {/* Active playing indicator dot */}
                {isPlaying && !isBoundaryMin && !isBoundaryMax && (
                  <div className={`absolute ${key.isBlack ? 'bottom-2' : 'bottom-6'} w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse z-20`} />
                )}

                {/* Key range labels */}
                {!key.isBlack && (
                  <div className="text-[8px] scale-90 font-mono text-center overflow-hidden whitespace-nowrap mt-auto">
                    {key.label === 'mid1C' && <span className="font-bold text-slate-800 text-[9px]">mid1C</span>}
                    {key.label === 'mid2C' && <span className="font-bold text-slate-800 text-[9px]">mid2C</span>}
                    {key.label === 'hiC' && <span className="font-bold text-slate-800 text-[9px]">hiC</span>}
                    {key.label === 'lowC' && <span className="font-bold text-slate-800 text-[9px]">lowC</span>}
                    {!['mid1C', 'mid2C', 'hiC', 'lowC'].includes(key.label) && key.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-900/40 border border-emerald-500/20" />
            <span>あなたの歌える範囲</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-500" />
            <span>選択曲の音域境界</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-500">
          ※ピン留めされた鍵盤が「設定中の音域」
        </span>
      </div>

      {/* 🔮 Two-Way Interactive Note Setting Panel */}
      {lastClickedMidi !== null && (
        <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white font-mono">{formatPitch(lastClickedMidi).full}</span>
                <span className="text-[10px] text-slate-500 font-mono">({lastClickedMidi} MIDI)</span>
              </div>
              <p className="text-[9.5px] text-slate-450">この音をあなたの設定音域に反映しますか？</p>
            </div>
          </div>
          
          <div className="flex gap-1.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                if (onSetUserMin) {
                  onSetUserMin(lastClickedMidi);
                  setRangeMode?.('manual');
                }
              }}
              disabled={lastClickedMidi >= userMax}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-[10.5px] font-bold rounded-lg border border-emerald-500/25 hover:border-transparent transition-all cursor-pointer active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
              title="この音を最低音（Low）に設定"
            >
              最低音 (Low) に設定
            </button>
            <button
              onClick={() => {
                if (onSetUserMax) {
                  onSetUserMax(lastClickedMidi);
                  setRangeMode?.('manual');
                }
              }}
              disabled={lastClickedMidi <= userMin}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-[10.5px] font-bold rounded-lg border border-rose-500/25 hover:border-transparent transition-all cursor-pointer active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
              title="この音を最高音（High）に設定"
            >
              最高音 (High) に設定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
