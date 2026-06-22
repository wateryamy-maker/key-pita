import React, { useState, useMemo } from 'react';
import { 
  Music, 
  User, 
  Search, 
  Check, 
  X, 
  RotateCcw, 
  Volume2, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Smartphone,
  ChevronRight,
  Info,
  Sliders,
  Plus,
  Minus,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ==========================================
// 1. Data Type & Definitions
// ==========================================

interface Song {
  id: string;
  title: string;
  artist: string;
  min: number; // MIDI note number
  max: number; // MIDI note number
  gender: 'male' | 'female' | 'unisex';
  originalKey: string;
  tags: string[];
  description: string;
}

// 日本語および英数字の揺れ（全角・半角、ひらがな・カタカナ、大文字・小文字、NFC/NFD結合文字）を吸収するテキスト正規化関数
function normalizeText(text: string): string {
  if (!text) return "";
  
  // 1. NFC正規化（Macの濁点等による結合文字を合成文字に統一）
  let val = text.normalize("NFC").toLowerCase();
  
  // 2. 全角英数字 -> 半角英数字への変換
  val = val.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  
  // 3. カタカナ -> ひらがな表記の統一（ひらがなに統一することですべてカバー）
  val = val.replace(/[\u30a1-\u30f6]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0x60);
  });
  
  // 4. 全角・半角スペース類をすべてトリミングし、連続スペースを半角1つに結合
  return val.replace(/[\s\u3000]+/g, " ").trim();
}

// J-POP standard favorites (15+ core songs, strictly typed and documented)
// 💡 [NEXT.JS / SUPABASE MIGRATION GUIDE]:
// In a Next.js / Supabase production environment, this local dictionary should be migrated to a 'songs' table.
// You can seed public.songs with this JSON structure.
// Row Fields: id (UUID / Int), title (Text), artist (Text), min (Int), max (Int), gender (Text), original_key (Text), tags (Text Array), description (Text)
const INITIAL_SONG_DATABASE: Song[] = [
  {
    id: '1',
    title: 'マリーゴールド',
    artist: 'あいみょん',
    min: 55, // mid1G
    max: 74, // hiD
    gender: 'female',
    originalKey: 'Gメジャー',
    tags: ['定番曲', '歌いやすい', 'カラオケ大人気'],
    description: '女性の標準的〜やや高音寄りな爽やかなナンバー。一定の息づかいで気持ちよく歌い通せます。',
  },
  {
    id: '2',
    title: 'Lemon',
    artist: '米津玄師',
    min: 48, // mid1C
    max: 71, // mid2B
    gender: 'male',
    originalKey: 'Abマイナー',
    tags: ['ドラマ主題歌', 'エモい度高め', '裏声あり'],
    description: '音域幅が非常に広く、サビ終わりの最高音付近などで安定した高音域のコントロールを要求されます。',
  },
  {
    id: '3',
    title: 'Pretender',
    artist: 'Official髭男dism',
    min: 53, // mid1F
    max: 79, // hiG
    gender: 'male',
    originalKey: 'A♭メジャー',
    tags: ['難易度SSS', 'ハイトーン', '絶叫裏声'],
    description: 'サビは男声としては信じがたいハイトーンの連続。地声と裏声のスムーズな切り替えが不可欠です。',
  },
  {
    id: '4',
    title: '紅蓮華',
    artist: 'LiSA',
    min: 58, // mid2A
    max: 78, // hiF#
    gender: 'female',
    originalKey: 'Bマイナー',
    tags: ['アニソン定番', '疾走ハイトーン', '盛り上がる'],
    description: '力強い発声とブレススピードが求められる大ヒットアニソン。高音サビが非常に伸びやかです。',
  },
  {
    id: '5',
    title: 'ドライフラワー',
    artist: '優里',
    min: 53, // mid1F
    max: 75, // hiD
    gender: 'male',
    originalKey: 'Gメジャー',
    tags: ['ブレス難', '表現力重視', '涙腺崩壊'],
    description: 'サビにかけて力強くエモーショナルに歌い上げる高音パートが多く、低音から高音へのステップが見事。',
  },
  {
    id: '6',
    title: '糸',
    artist: '中島みゆき',
    min: 53, // mid1F
    max: 65, // mid2F
    gender: 'unisex',
    originalKey: 'Bbメジャー',
    tags: ['定番バラード', '表現力重視', '低速テンポ'],
    description: '音域幅が1オクターブ強と狭めなため、性別を問わず極めて歌いやすい国民的スタンダード曲。',
  },
  {
    id: '7',
    title: '丸の内サディスティック',
    artist: '椎名林檎',
    min: 52, // mid1E
    max: 76, // hiE
    gender: 'female',
    originalKey: 'E♭マイナー',
    tags: ['オシャレ', 'リズム難', 'セクシー調'],
    description: '独特のハネるリズムと、最高音hiEに這い上がるスピード感が必要な難易度高めのジャズテイスト。',
  },
  {
    id: '8',
    title: '猫',
    artist: 'DISH//',
    min: 50, // mid1D
    max: 71, // mid2B
    gender: 'male',
    originalKey: 'Fメジャー',
    tags: ['あいみょん提供', 'ストレート', '切ない'],
    description: 'メロディがストレートで感情移入しやすく、中音域が主役の美しいミディアムロック。',
  },
  {
    id: '9',
    title: 'チェリー',
    artist: 'スピッツ',
    min: 52, // mid1E
    max: 71, // mid2B
    gender: 'male',
    originalKey: 'Cメジャー',
    tags: ['初心者おすすめ', '春の歌', '裏声なし'],
    description: '高難易度の声区移動がなく、初心者でも声がしっかりと当たりやすい爽快王道ソング。',
  },
  {
    id: '10',
    title: 'ハナミズキ',
    artist: '一青窈',
    min: 53, // mid1F
    max: 72, // hiC
    gender: 'female',
    originalKey: 'Gメジャー',
    tags: ['結婚式定番', 'ゆったり', '優雅'],
    description: 'ゆったりとしたテンポでロングトーンが多いため、喉をリラックスさせて響かせたい歌い手向け。',
  },
  {
    id: '11',
    title: '小さな恋のうた',
    artist: 'MONGOL800',
    min: 48, // mid1C
    max: 69, // hiA
    gender: 'unisex',
    originalKey: 'Bメジャー',
    tags: ['全力パンク', 'ハイトーンサビ', '盛り上がる'],
    description: '疾走感溢れるバンド・サウンド。サビの最高音が長く続くため、パワーとスタミナが求められます。',
  },
  {
    id: '12',
    title: '怪獣の花唄',
    artist: 'Vaundy',
    min: 50, // mid1D
    max: 76, // hiE
    gender: 'male',
    originalKey: 'D#メジャー',
    tags: ['フェス定番', 'ハイテンション', 'シンガロング'],
    description: 'サビの連続する高音hiEが心地よく疾走するアップテンポなナンバー。腹式呼吸が必須です。',
  },
  {
    id: '13',
    title: '新時代',
    artist: 'Ado',
    min: 57, // mid1F#
    max: 78, // hiF#
    gender: 'female',
    originalKey: 'F#マイナー',
    tags: ['映画主題歌', 'パワフル音源', '難易度高'],
    description: '圧倒的な声量と広い声区移動が活きる、Adoのパワフルでエレクトロニックなダンスポップ。',
  },
  {
    id: '14',
    title: '残酷な天使のテーゼ',
    artist: '高橋洋子',
    min: 55, // mid1G
    max: 74, // hiD
    gender: 'female',
    originalKey: 'Cマイナー',
    tags: ['アニメ金字塔', '絶対に盛り上がる'],
    description: '全世代が知っている最強アニソン。安定した中低音と適度なサビのサステインが必要。',
  },
  {
    id: '15',
    title: '奏 (かなで)',
    artist: 'スキマスイッチ',
    min: 50, // mid1D
    max: 71, // mid2B
    gender: 'male',
    originalKey: 'Aメジャー',
    tags: ['涙腺崩壊バラード', '美メロ', 'ロングセラー'],
    description: 'サビ前の溜めと、最高音mid2Bの美しいロングトーンが見せ場の感動的ラブソング。',
  },
  {
    id: '16',
    title: 'カブトムシ',
    artist: 'aiko',
    min: 50, // mid1D
    max: 75, // hiD#
    gender: 'female',
    originalKey: 'Abメジャー',
    tags: ['冬のラブソング', '切ない高音', '裏声使い'],
    description: '地声からすっとファルセット（裏声）に切り替わる独特のaikoライン。サビの最高音に魅力が凝縮。'
  }
];

// Presets representing Standard Pitch Ranges in JP Karaoke standard
interface VoicePreset {
  name: string;
  min: number;
  max: number;
  desc: string;
}

const VOICE_PRESETS: VoicePreset[] = [
  { name: '一般男性 (平均的)', min: 48, max: 67, desc: 'mid1C (低) 〜 mid2G (高)' },
  { name: '高音男性 (ハイトーン向け)', min: 50, max: 71, desc: 'mid1D (低) 〜 mid2B (高)' },
  { name: '一般女性 (平均的)', min: 55, max: 74, desc: 'mid1G (低) 〜 hiD (高)' },
  { name: '低音女性 (低めが得意)', min: 52, max: 69, desc: 'mid1E (低) 〜 hiA (高)' }
];

// NOTE INDEX mapping for JP standard labels
const NOTE_BASE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_BASE_NAMES_JP = ["ド", "ド#", "レ", "レ#", "ミ", "ファ", "ファ#", "ソ", "ソ#", "ラ", "ラ#", "シ"];

// Converter from MIDI number to Karaoke Terminology
// e.g. 60 -> "mid2C (C4 / ド)"
function formatPitch(midiNumber: number): { raw: string; prefix: string; note: string; full: string } {
  const noteIndex = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  const baseName = NOTE_BASE_NAMES[noteIndex];
  const jpDoc = NOTE_BASE_NAMES_JP[noteIndex];
  
  let prefix = "";
  if (octave <= 1) {
    prefix = "lowlow";
  } else if (octave === 2) {
    prefix = "low";
  } else if (octave === 3) {
    prefix = "mid1";
  } else if (octave === 4) {
    prefix = "mid2";
  } else if (octave === 5) {
    prefix = "hi";
  } else {
    prefix = "hihi";
  }

  return {
    raw: `${prefix}${baseName}`,
    prefix,
    note: `${baseName}(${jpDoc})`,
    full: `${prefix}${baseName} [${jpDoc}] (C${octave})`
  };
}

// Convert MIDI number to keyboard colors
function isBlackKey(midiNumber: number): boolean {
  const index = midiNumber % 12;
  return [1, 3, 6, 8, 10].includes(index);
}

// ==========================================
// Main React Component Application
// ==========================================

export default function App() {
  // --- States ---
  const [userMin, setUserMin] = useState<number>(48); // default Average Male low (mid1C)
  const [userMax, setUserMax] = useState<number>(67); // default Average Male high (mid2G)
  const [simulatedKeyShift, setSimulatedKeyShift] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'unisex'>('all');
  const [selectedSongId, setSelectedSongId] = useState<string | null>('1');
  const [currentlyPlayingMidi, setCurrentlyPlayingMidi] = useState<number | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'songs' | 'settings'>('songs');

  // --- My Singable Songs (My List & Local Storage) ---
  const [mySingableSongs, setMySingableSongs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('my_singable_songs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --- UI Toast Notifications State ---
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);

  const showToastNotification = (message: string) => {
    setToast({ message, visible: true });
    const timer = setTimeout(() => {
      setToast(null);
    }, 1800); // 一瞬（1.8秒）表示して自動消去
  };

  const toggleSingableSong = (songId: string) => {
    let nextList: string[];
    let message = "";
    if (mySingableSongs.includes(songId)) {
      nextList = mySingableSongs.filter(id => id !== songId);
      message = "マイリスト（localStorage）から解除しました";
    } else {
      nextList = [...mySingableSongs, songId];
      message = "ブラウザ（localStorage）に保存しました！";
    }
    setMySingableSongs(nextList);
    try {
      localStorage.setItem('my_singable_songs', JSON.stringify(nextList));
    } catch (e) {
      console.warn("localStorage sync blocked:", e);
    }
    showToastNotification(message);
  };

  // --- Asynchronous Load State (Supabase / Next.js ready) ---
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  React.useEffect(() => {
    // 💡 [NEXT.JS / SUPABASE MIGRATION GUIDE]:
    // On a full production setup with Next.js/Supabase, replace this simulation block with:
    // async function fetchSongs() {
    //   try {
    //     const { data, error } = await supabase.from('songs').select('*').order('title');
    //     if (error) throw error;
    //     setSongs(data || []);
    //   } catch (err) {
    //     console.error("Error loading songs from Supabase:", err);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // }
    // fetchSongs();

    const loadTimer = setTimeout(() => {
      setSongs(INITIAL_SONG_DATABASE);
      setIsLoading(false);
    }, 850); // 850ms immersive loading simulation

    return () => clearTimeout(loadTimer);
  }, []);

  // For visual piano rendering range (covers standard vocal ranges from lowlowF[29] to hihiG[79] + padding)
  const pianoStart = 36; // lowC
  const pianoEnd = 84;   // hihiC

  // Audio synthethizer lazily using Web Audio API on tone clicked
  const triggerAudioNote = (midiNumber: number) => {
    try {
      setCurrentlyPlayingMidi(midiNumber);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      const freq = Math.pow(2, (midiNumber - 69) / 12) * 440;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      osc.type = 'sine'; // pure, clear tuning sine wave
      gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
      
      setTimeout(() => {
        setCurrentlyPlayingMidi(prev => prev === midiNumber ? null : prev);
      }, 600);
    } catch (error) {
      console.warn("AudioContext initialization blocked or unsupported:", error);
    }
  };

  // Safe range adjusters helper
  const handleMinChange = (val: number) => {
    if (val >= userMax) {
      setUserMin(userMax - 1);
    } else {
      setUserMin(val);
    }
  };

  const handleMaxChange = (val: number) => {
    if (val <= userMin) {
      setUserMax(userMin + 1);
    } else {
      setUserMax(val);
    }
  };

  // Load Preset Ranges
  const selectPreset = (preset: VoicePreset) => {
    setUserMin(preset.min);
    setUserMax(preset.max);
  };

  // Keyboard array helper for piano keys
  const pianoKeys = useMemo(() => {
    const keys = [];
    for (let i = pianoStart; i <= pianoEnd; i++) {
      keys.push({
        midi: i,
        isBlack: isBlackKey(i),
        label: formatPitch(i).raw,
        noteOnly: formatPitch(i).note
      });
    }
    return keys;
  }, [pianoStart, pianoEnd]);

  // Selected Song Metadata
  const selectedSong = useMemo(() => {
    return songs.find(s => s.id === selectedSongId) || null;
  }, [selectedSongId, songs]);

  // Main Calculation Engine for Karaoke Songs
  const analyzedSongs = useMemo(() => {
    return songs.map(song => {
      // 1. Calculate matching for simulated key shift
      const simMin = song.min + simulatedKeyShift;
      const simMax = song.max + simulatedKeyShift;
      const originalWidth = song.max - song.min;
      
      // Pitch limits within user capabilities
      const simHitsLow = simMin >= userMin;
      const simHitsHigh = simMax <= userMax;
      const simFitsPerfect = simHitsLow && simHitsHigh;

      const tooHighSemanticCount = simMax > userMax ? simMax - userMax : 0;
      const tooLowSemanticCount = simMin < userMin ? userMin - simMin : 0;

      // 2. Discover Optimal Key Shift if possible (Scanning from -7 to +7)
      let canSingWithAdjustments = false;
      let optimalShift: number | null = null;
      let possibleKeyRange: number[] = [];

      for (let shift = -7; shift <= 7; shift++) {
        const shiftedMin = song.min + shift;
        const shiftedMax = song.max + shift;
        if (shiftedMin >= userMin && shiftedMax <= userMax) {
          canSingWithAdjustments = true;
          possibleKeyRange.push(shift);
          if (optimalShift === null || Math.abs(shift) < Math.abs(optimalShift)) {
            optimalShift = shift; // key shift closest to original key 0 is best
          }
        }
      }

      // 3. User comfort rating text
      // Check original key compatibility
      const origFitsPerfect = song.min >= userMin && song.max <= userMax;

      return {
        ...song,
        simMin,
        simMax,
        simFitsPerfect,
        simHitsLow,
        simHitsHigh,
        tooHighSemanticCount,
        tooLowSemanticCount,
        origFitsPerfect,
        canSingWithAdjustments,
        optimalShift,
        possibleKeyRange,
        originalWidth,
        userSpan: userMax - userMin
      };
    });
  }, [songs, userMin, userMax, simulatedKeyShift]);

  // --- My List Estimated Range Calculation & Setter ---
  const estimatedRange = useMemo(() => {
    if (mySingableSongs.length === 0) return null;
    const registeredSongs = songs.filter(s => mySingableSongs.includes(s.id));
    if (registeredSongs.length === 0) return null;

    const mins = registeredSongs.map(s => s.min);
    const maxs = registeredSongs.map(s => s.max);

    return {
      min: Math.min(...mins),
      max: Math.max(...maxs)
    };
  }, [mySingableSongs, songs]);

  const applyEstimatedRange = () => {
    if (estimatedRange) {
      setUserMin(estimatedRange.min);
      setUserMax(estimatedRange.max);
      showToastNotification(`推測音域 (${formatPitch(estimatedRange.min).raw} 〜 ${formatPitch(estimatedRange.max).raw}) を設定に反映しました！`);
    }
  };

  // Filtered & Searched calculation results
  const processedSongs = useMemo(() => {
    // 検索クエリをクリーンアップし、全角・半角・ひらがな・カタカナ・大文字・小文字・NFCの揺れを吸収する
    const queryNormalized = normalizeText(searchQuery);
    
    return analyzedSongs.filter(song => {
      // 1. 性別によるフィルター
      const matchesGender = genderFilter === 'all' || song.gender === genderFilter;
      if (!matchesGender) return false;
      
      // 検索ワードが空なら性別フィルターのみクリアしていればマッチ
      if (!queryNormalized) return true;
      
      // 2. スペース区切り複数キーワードによるAND検索
      const keywords = queryNormalized.split(" ").filter(Boolean);
      
      const titleNorm = normalizeText(song.title);
      const artistNorm = normalizeText(song.artist);
      const tagsNorm = song.tags.map(tag => normalizeText(tag));
      
      // 各キーワードすべてがタイトル、アーティスト、またはタグのいずれかに含まれているかを確認
      return keywords.every(kw => {
        return titleNorm.includes(kw) || 
               artistNorm.includes(kw) || 
               tagsNorm.some(tag => tag.includes(kw));
      });
    });
  }, [analyzedSongs, searchQuery, genderFilter]);

  // Counters
  const countStats = useMemo(() => {
    const perfectCount = processedSongs.filter(s => s.simFitsPerfect).length;
    const adjustCount = processedSongs.filter(s => !s.simFitsPerfect && s.canSingWithAdjustments).length;
    const impossibleCount = processedSongs.filter(s => !s.canSingWithAdjustments).length;
    return { perfect: perfectCount, adjustable: adjustCount, impossible: impossibleCount };
  }, [processedSongs]);

  return (
    <div id="karaoke-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-900">
      
      {/* ================= HEADER ================= */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">カラオケ音域検索</h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 font-semibold">
                  Phase 1 Prototype
                </span>
              </div>
              <p className="text-xs text-slate-400">あなたの歌える音域をスライダーで設定し、歌える曲を瞬時に診断</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {VOICE_PRESETS.map((preset, index) => (
              <button
                key={index}
                onClick={() => selectPreset(preset)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-500/40 bg-slate-900 hover:bg-slate-850 hover:text-white transition-all text-slate-300 shrink-0 flex items-center gap-1.5"
                title={`${preset.desc}`}
              >
                <User className="w-3 h-3 text-emerald-400" />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ================= HERO AREA ================= */}
      <section className="bg-gradient-to-b from-slate-900/60 to-slate-950 border-b border-slate-800/80 py-10 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.07),transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center relative z-10 flex flex-col items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-450 rounded-full border border-emerald-500/20 text-xs font-semibold mb-4 backdrop-blur-xs select-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>スマホ対応・カラオケ音域診断「キーぴた」</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 md:mb-5 max-w-3xl leading-tight text-balance"
          >
            自分に<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-350 to-teal-350">「ぴたっ」</span>と合う曲、見つけよう。
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xs sm:text-sm md:text-base text-slate-300 max-w-xl mb-6 md:mb-8 leading-relaxed text-balance"
          >
            音域を診断して、無理なく歌える曲を自動マッチング。キー調整も瞬時にシミュレーションできます。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full sm:w-auto"
          >
            <button
              onClick={() => {
                setActiveMobileTab('settings');
                // Scroll smoothly to target setting section
                setTimeout(() => {
                  const targetEl = document.getElementById('settings-section');
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-8 py-3.5 md:py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]"
            >
              <span>今すぐ音域を診断する</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-4 md:py-6 flex flex-col gap-5 md:gap-6">
        
        {/* Mobile Navigation Tabs (Only visible on screens narrower than lg) */}
        <div className="flex lg:hidden bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-2xl relative z-10">
          <button
            onClick={() => setActiveMobileTab('songs')}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeMobileTab === 'songs'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md transform scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4 shrink-0" />
            <span>楽曲診断リスト</span>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-slate-950/20 text-slate-900 rounded-full font-mono font-semibold">
              {countStats.perfect + countStats.adjustable}曲
            </span>
          </button>
          
          <button
            onClick={() => setActiveMobileTab('settings')}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeMobileTab === 'settings'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md transform scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>音域 & キー設定</span>
          </button>
        </div>

        {/* Main Columns Grid wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

          {/* LEFT COLUMN: Range Configuration, Active Simulator, Pitch Keyboard */}
          <section id="settings-section" className={`lg:col-span-5 flex-col gap-6 ${activeMobileTab === 'settings' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* 0. DIAGNOSIS ONBOARDING GUIDE (3-STEPS) */}
          <div className="bg-slate-900 border border-emerald-500/10 rounded-2xl p-5 shadow-xl relative overflow-hidden bg-radial from-emerald-950/15 via-slate-900 to-slate-900">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-3.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              音域診断の3ステップ・ガイド
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {/* STEP 1 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-550/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">歌いやすい曲を選ぶ or 鍵盤でチェック</h4>
                  <p className="text-[10px] sm:text-[11.5px] text-slate-400 mt-1 leading-relaxed">
                    プリセットを選ぶか、下のピッチチェッカー鍵盤で歌いやすい最高・最低音を発声して確認
                  </p>
                </div>
              </div>
              
              <div className="h-px bg-slate-800/60" />

              {/* STEP 2 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-555/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">スライダーを自動・手動算出で調整</h4>
                  <p className="text-[10px] sm:text-[11.5px] text-slate-400 mt-1 leading-relaxed">
                    算出された音域にフィットするように、カラオケ機器の「キー変更（±1〜7）」をリアルタイムでシミュレート可能
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-800/60" />

              {/* STEP 3 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-linear-to-r from-emerald-400 to-teal-400 text-slate-950 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 font-mono">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                    歌える曲リストを自動マッチング！
                  </h4>
                  <p className="text-[10px] sm:text-[11.5px] text-slate-400 mt-1 leading-relaxed">
                    「楽曲診断リスト」タブにて、今のキー設定に一致する適正曲と、原曲から変更すべきキー数をご提案します
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 1. VOCAL RANGE SLIDERS CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-emerald-400" />
              あなたの歌える音域を設定
            </h2>

            {/* Range Output Visual block */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium">最低音 (Vocal Low)</span>
                <span className="text-md font-mono font-bold text-emerald-400 mt-1">
                  {formatPitch(userMin).raw}
                </span>
                <span className="text-[11px] text-slate-500 font-sans mt-0.5">
                  {formatPitch(userMin).note} (C{Math.floor(userMin / 12) - 1})
                </span>
              </div>
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium">最高音 (Vocal High)</span>
                <span className="text-md font-mono font-bold text-rose-400 mt-1">
                  {formatPitch(userMax).raw}
                </span>
                <span className="text-[11px] text-slate-500 font-sans mt-0.5">
                  {formatPitch(userMax).note} (C{Math.floor(userMax / 12) - 1})
                </span>
              </div>
            </div>

            {/* Range Input Controls */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="text-slate-300 font-medium">最低音スライダー (Vocal Low)</span>
                  <span className="font-mono text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                    {formatPitch(userMin).raw} ({userMin} MIDI)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMinChange(userMin - 1)}
                    disabled={userMin <= 24}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl text-slate-400 hover:text-emerald-400 disabled:opacity-40 disabled:hover:border-slate-800 active:scale-95 transition-all text-sm font-bold min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
                    title="最低音を1つ下げる"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="24"
                    max="70"
                    value={userMin}
                    onChange={(e) => handleMinChange(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-slate-800"
                  />
                  <button
                    onClick={() => handleMinChange(userMin + 1)}
                    disabled={userMin >= userMax - 1}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl text-slate-400 hover:text-emerald-400 disabled:opacity-40 disabled:hover:border-slate-800 active:scale-95 transition-all text-sm font-bold min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
                    title="最低音を1つ上げる"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="text-slate-300 font-medium">最高音スライダー (Vocal High)</span>
                  <span className="font-mono text-rose-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                    {formatPitch(userMax).raw} ({userMax} MIDI)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMaxChange(userMax - 1)}
                    disabled={userMax <= userMin + 1}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-xl text-slate-400 hover:text-rose-400 disabled:opacity-40 disabled:hover:border-slate-800 active:scale-95 transition-all text-sm font-bold min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
                    title="最高音を1つ下げる"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="55"
                    max="95"
                    value={userMax}
                    onChange={(e) => handleMaxChange(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500 border border-slate-800"
                  />
                  <button
                    onClick={() => handleMaxChange(userMax + 1)}
                    disabled={userMax >= 95}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-xl text-slate-400 hover:text-rose-400 disabled:opacity-40 disabled:hover:border-slate-800 active:scale-95 transition-all text-sm font-bold min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
                    title="最高音を1つ上げる"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Vocal Span Context Indicator */}
            <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
              <span>音域の広さ (Span):</span>
              <span className="font-mono text-slate-200 font-semibold bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                {userMax - userMin} 半音 ({((userMax - userMin) / 12).toFixed(1)} オクターブ)
              </span>
            </div>

            {/* My List & Estimated vocal range from registered songs */}
            <div className="mt-4 pt-4 border-t border-slate-850/60 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 animate-pulse" />
                  あなたの現在のマイリスト
                </span>
                <span className="font-mono text-slate-200 font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2.5 py-0.5 rounded-full">
                  {mySingableSongs.length} 曲
                </span>
              </div>

              {estimatedRange ? (
                <div className="bg-slate-950/75 p-3 rounded-xl border border-slate-850 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>登録曲からの推測音域:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formatPitch(estimatedRange.min).raw} 〜 {formatPitch(estimatedRange.max).raw}
                    </span>
                  </div>
                  
                  {/* Visual Range bar */}
                  <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden select-none">
                    {/* User CURRENT setting vocal range (translucent backing) */}
                    <div 
                      style={{
                        left: `${((userMin - pianoStart) / (pianoEnd - pianoStart)) * 100}%`,
                        width: `${((userMax - userMin) / (pianoEnd - pianoStart)) * 100}%`
                      }}
                      className="absolute top-0 bottom-0 bg-emerald-500/10 border-l border-r border-emerald-500/30"
                    />
                    
                    {/* Estimated vocal range (pink line) */}
                    <div 
                      style={{
                        left: `${((estimatedRange.min - pianoStart) / (pianoEnd - pianoStart)) * 100}%`,
                        width: `${((estimatedRange.max - estimatedRange.min) / (pianoEnd - pianoStart)) * 100}%`
                      }}
                      className="absolute top-0.5 bottom-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-450 shadow-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-900">
                    <span className="text-[10px] text-slate-500 font-sans leading-tight">
                      現在の設定値 ({userMax - userMin}半音) に自動反映できます
                    </span>
                    <button
                      onClick={applyEstimatedRange}
                      className="px-2.5 py-1 text-[10px] font-bold bg-slate-900 text-emerald-400 border border-slate-800 hover:border-emerald-500/40 rounded-lg hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
                    >
                      設定に適用する
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/60 text-center text-slate-500 text-[10px] leading-relaxed">
                  各曲カードの「<span className="text-pink-400 font-bold">歌える！登録</span>」ボタン（ハート）を押すと、登録された楽曲の音域データから、あなたの真の声域（ボーカルレンジ）を自動でシミュレーション・推測表示します。
                </div>
              )}
            </div>
          </div>

          {/* 2. KARAOKE KEY SIMULATOR CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              カラオケキー変更シミュレータ (リアルタイム)
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              デンモクで「キー # / ♭」を操作した時の曲の音域変化を再現し、歌いやすさを再計算します。
            </p>

            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-850 mb-4">
              <span className="text-xs text-slate-300 font-medium">現在のシミュレーションキー</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono font-bold px-3 py-1 rounded-lg ${
                  simulatedKeyShift === 0 
                  ? 'bg-slate-800 text-slate-300' 
                  : simulatedKeyShift > 0 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {simulatedKeyShift === 0 ? '原曲キー (0)' : simulatedKeyShift > 0 ? `キー +${simulatedKeyShift}` : `キー ${simulatedKeyShift}`}
                </span>
                
                {simulatedKeyShift !== 0 && (
                  <button 
                    onClick={() => setSimulatedKeyShift(0)}
                    className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="原曲キーに戻す"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Key Buttons */}
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
                <button
                  key={k}
                  onClick={() => setSimulatedKeyShift(k)}
                  className={`py-2 rounded-lg font-mono text-xs transition-all ${
                    simulatedKeyShift === k
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-850'
                  }`}
                >
                  {k > 0 ? `+${k}` : k}
                </button>
              ))}
            </div>

            {/* Extended Key Range Slider */}
            <div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5 hidden sm:flex">
                <span>微調整 (-7 〜 +7)</span>
                <span className="font-mono text-slate-350">{simulatedKeyShift > 0 ? `+${simulatedKeyShift}` : simulatedKeyShift}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSimulatedKeyShift(prev => Math.max(-7, prev - 1))}
                  disabled={simulatedKeyShift <= -7}
                  className="p-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-lg text-slate-400 hover:text-indigo-400 disabled:opacity-40 disabled:hover:border-slate-800 active:scale-95 transition-all text-xs font-semibold shrink-0 min-w-[36px] min-h-[32px] flex items-center justify-center font-mono"
                  title="キーを1段階下げる"
                >
                  -1
                </button>
                <input
                  type="range"
                  min="-7"
                  max="7"
                  value={simulatedKeyShift}
                  onChange={(e) => setSimulatedKeyShift(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-800"
                />
                <button
                  onClick={() => setSimulatedKeyShift(prev => Math.min(7, prev + 1))}
                  disabled={simulatedKeyShift >= 7}
                  className="p-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-lg text-slate-400 hover:text-indigo-400 disabled:opacity-40 disabled:hover:border-slate-800 active:scale-95 transition-all text-xs font-semibold shrink-0 min-w-[36px] min-h-[32px] flex items-center justify-center font-mono"
                  title="キーを1段階上げる"
                >
                  +1
                </button>
              </div>
            </div>
          </div>

          {/* 3. PHYSICAL NOTE PREVIEW PIANO */}
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
                      style={{ width: key.isBlack ? '18px' : '28px', marginLeft: key.isBlack ? '-9px' : '0', marginRight: key.isBlack ? '-9px' : '0' }}
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

        </section>

        {/* RIGHT COLUMN: Song database filters & song card grid (7 Columns) */}
        <section className={`lg:col-span-7 flex flex-col gap-6 ${activeMobileTab === 'songs' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* 1. FILTER CONTROLS BAR & STATS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                登録楽曲データベースから検索
              </span>
              <span className="text-xs text-slate-400 font-mono">
                計 {INITIAL_SONG_DATABASE.length} 曲 登録済み
              </span>
            </h2>

            {/* Inputs & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              
              <div className="md:col-span-7 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="曲名やアーティストで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl h-12 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>

              <div className="md:col-span-5 flex rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1 h-12">
                {(['all', 'male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                      genderFilter === g
                        ? 'bg-slate-800 text-emerald-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g === 'all' ? 'すべて' : g === 'male' ? '男声歌' : '女声歌'}
                  </button>
                ))}
              </div>

            </div>

            {/* Simulated Live Pitch Statistics */}
            <div className="mt-4 pt-4 border-t border-slate-850 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl py-2 px-1">
                <div className="text-md font-mono font-bold text-emerald-400">{countStats.perfect}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">そのまま歌える</div>
              </div>
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl py-2 px-1">
                <div className="text-md font-mono font-bold text-indigo-400">{countStats.adjustable}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">キー変更で歌える</div>
              </div>
              <div className="bg-slate-950 border border-slate-850 rounded-xl py-2 px-1">
                <div className="text-md font-mono font-bold text-slate-500">{countStats.impossible}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">音域外・調整不可</div>
              </div>
            </div>
          </div>

          {/* 2. SONG LISTING & RANGE MATCH CARDS */}
          <div className="flex-1 space-y-4 min-h-[480px] max-h-[580px] overflow-y-auto scrollbar-thin pr-1">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div 
                      key={`skeleton-${n}`} 
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse flex flex-col gap-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-slate-800 rounded w-2/5" />
                          <div className="h-3 bg-slate-850 rounded w-1/4" />
                        </div>
                        <div className="h-6 bg-slate-800 rounded-xl w-24" />
                      </div>
                      <div className="h-px bg-slate-800 my-1" />
                      <div className="h-3 bg-slate-850 rounded w-3/4" />
                    </div>
                  ))}
                  <div className="text-center py-4 text-xs text-slate-500 font-mono animate-pulse flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>データを読み込んでいます... (Next.js/Supabase 擬似非同期ロード中)</span>
                  </div>
                </div>
              ) : processedSongs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-8 py-12 text-center text-slate-400 flex flex-col items-center justify-center"
                >
                  <AlertTriangle className="w-10 h-10 text-amber-500 mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-slate-200">該当する曲が見つかりませんでした。</p>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                    現在の検索キー「<span className="text-slate-300 font-mono font-semibold">{searchQuery}</span>」に合致する登録曲はありません。表記ゆれやアーティスト名をご確認ください。
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setGenderFilter('all');
                    }}
                    className="mt-6 px-5 py-2.5 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl text-emerald-450 hover:text-emerald-350 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow"
                    title="検索条件をリセットする"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>検索をリセット</span>
                  </button>
                </motion.div>
              ) : (
                processedSongs.map((song, index) => {
                  const isSelected = selectedSongId === song.id;
                  const isFavorite = mySingableSongs.includes(song.id);
                  
                  // Pick status badges
                  let statusBadgeStyle = "";
                  let statusText = "";
                  let suggestionText = "";

                  if (song.simFitsPerfect) {
                    statusBadgeStyle = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                    statusText = "適正レンジ";
                    suggestionText = "あなたの音域にきれいに収まっています！その調子で歌えます！";
                  } else if (song.canSingWithAdjustments) {
                    statusBadgeStyle = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
                    statusText = `キー変更推奨 (おすすめ: ${song.optimalShift! > 0 ? `+${song.optimalShift}` : song.optimalShift})`;
                    suggestionText = `キーを${song.optimalShift! > 0 ? `+${song.optimalShift}` : song.optimalShift}に設定すると歌えるようになります。`;
                  } else {
                    statusBadgeStyle = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                    statusText = "歌唱困難 (音域超過)";
                    
                    if (song.originalWidth > (userMax - userMin)) {
                      suggestionText = `曲の広さ (${song.originalWidth}半音) があなたの最大音域幅 (${userMax - userMin}半音) を超過しているため歌うのは困難です。`;
                    } else if (song.simMin < userMin) {
                      suggestionText = `低音側が${formatPitch(userMin).raw}より低いため厳しいです。曲キーを上げてください。`;
                    } else {
                      suggestionText = `高音側が${formatPitch(userMax).raw}より高いため厳しいです。曲キーを下げてください。`;
                    }
                  }

                  return (
                    <React.Fragment key={song.id}>
                      <motion.div
                      layoutId={`song-card-${song.id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedSongId(song.id)}
                      className={`g-card text-left rounded-2xl p-4.5 border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected 
                          ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/5' 
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
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
                        
                        {/* Title, Artist, Gender indicator */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-md font-bold text-white group-hover:text-emerald-400 leading-snug">
                                {song.title}
                              </h3>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                                song.gender === 'female' 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                  : song.gender === 'male' 
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}>
                                {song.gender === 'female' ? '女性曲' : song.gender === 'male' ? '男性曲' : '男女兼用'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">{song.artist}</p>
                          </div>

                          {/* Quick Action Buttons & Compatibility badge */}
                          <div className="flex items-center gap-2 shrink-0 justify-end mt-1 sm:mt-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSingableSong(song.id);
                              }}
                              className={`py-1 px-3 rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1.5 text-[11px] font-bold h-8 cursor-pointer shadow-sm ${
                                isFavorite 
                                  ? 'bg-pink-500/20 text-pink-400 border-pink-500/40 hover:bg-pink-500/35' 
                                  : 'bg-slate-950 hover:bg-slate-800 text-slate-450 border-slate-800/80 hover:border-slate-700 hover:text-slate-200'
                              }`}
                              title={isFavorite ? "マイリスト（歌える曲）から解除" : "歌える曲としてマイリストに登録"}
                            >
                              <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorite ? 'fill-pink-500 text-pink-400' : 'text-slate-400'}`} />
                              <span>{isFavorite ? '歌える！' : '歌える！登録'}</span>
                            </button>

                            <div className={`text-xs px-2.5 py-1 rounded-xl text-center font-semibold h-8 flex items-center shrink-0 ${statusBadgeStyle}`}>
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
                                left: `${((userMin - pianoStart) / (pianoEnd - pianoStart)) * 100}%`,
                                width: `${((userMax - userMin) / (pianoEnd - pianoStart)) * 100}%`
                              }}
                              className="absolute top-0 bottom-0 bg-emerald-500/10 border-l border-r border-emerald-500/30"
                            />

                            {/* Shifted song bounds line block (Visual indicator) */}
                            <div 
                              style={{
                                left: `${((song.simMin - pianoStart) / (pianoEnd - pianoStart)) * 100}%`,
                                width: `${((song.simMax - song.simMin) / (pianoEnd - pianoStart)) * 100}%`
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
                                  triggerAudioNote(song.simMin);
                                }}
                                className="px-2.5 py-1 text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 flex items-center gap-1 hover:text-emerald-400 transition-colors"
                              >
                                <Volume2 className="w-3 h-3 text-emerald-400/80" />
                                最低音を聞く
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerAudioNote(song.simMax);
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
                                        setSimulatedKeyShift(offset);
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

                    {index === 2 && (
                      <div key="ad-banner-placement" className="bg-gradient-to-br from-slate-900/40 via-indigo-950/25 to-slate-900 border border-indigo-500/15 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden group hover:border-indigo-500/30 transition-all mt-4 mb-4 select-none">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] rounded-full blur-2xl pointer-events-none" />
                        <div className="flex items-start gap-3.5">
                          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0 mt-0.5">
                            <Sparkles className="w-5 h-5 animate-pulse text-indigo-300" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">PR 広告</span>
                              <span className="text-white text-xs font-bold font-sans">憧れのハイトーンが出せる秘密</span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5 leading-relaxed">
                              「高い声が通らない」「サビで息が続かない」を完全解決！プロ講師による30分無料オンライン歌診断レッスン。あなたに「ぴたっ」な発声法がわかります。
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 w-full sm:w-auto">
                          <button 
                            onClick={() => { showToastNotification("体験レッスンのデモお申し込みをフックしました！"); }}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-950 bg-indigo-400 hover:bg-indigo-300 px-5 py-3 rounded-xl transition-all shadow-md shrink-0 active:scale-95 cursor-pointer"
                          >
                            <span>無料体験を予約</span>
                            <ChevronRight className="w-3.5 h-3.5 font-bold" />
                          </button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })
              )}
            </AnimatePresence>
          </div>
 
          {/* APP GUIDE FOOTER INFO */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4.5 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-200 font-semibold block mb-0.5">💡 プロトタイプ歌唱キーの考え方</span>
              1半音のズレはカラオケのキー「1個分（原曲キーから±1）」に完璧に対応しています。
              スライダーで設定したあなたの歌える最低・最高音の範囲内に、曲の音域（キー調整後）がすべて収まれば「適正キー」と認定されます。
            </div>
          </div>
 
        </section>
 
      </div>
 
    </main>

      {/* Toast Alert Notification */}
      <AnimatePresence>
        {toast && toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-55 flex items-center gap-2.5 bg-slate-950 border border-emerald-500/20 text-white font-semibold px-4 px-3.5 rounded-xl shadow-2xl backdrop-blur-md select-none w-[90%] max-w-sm"
          >
            <div className="p-1 bg-emerald-500/15 text-emerald-400 rounded-lg shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-[11px] leading-normal flex-1">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 カラオケ音域検索 (KiraRange) - Phase 1 Prototype. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-450">データベース: 10選</span>
            <span className="hover:text-slate-450">Web Audio API 合成</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
