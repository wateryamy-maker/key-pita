import React, { useState, useMemo, useEffect } from 'react';
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
  Heart,
  Mic,
  MicOff,
  Database,
  Copy,
  Trash2,
  Edit,
  Lock,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import { Song, VoicePreset } from './types';
import { 
  INITIAL_SONG_DATABASE, 
  SUPABASE_SEED_SQL, 
  VOICE_PRESETS, 
  NOTE_BASE_NAMES, 
  NOTE_BASE_NAMES_JP, 
  generateSupabaseSeedSql 
} from './data/songs';
import { normalizeText, formatPitch, autoCorrelate, isBlackKey, PIANO_START, PIANO_END } from './utils/pitch';
import { PianoKeyboard } from './components/PianoKeyboard';
import { SongCard } from './components/SongCard';
import { usePitchDetection } from './hooks/usePitchDetection';
import { useSyncSongs } from './hooks/useSyncSongs';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URI || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// Main React Component Application
// ==========================================

export default function App() {
  const isDev = !import.meta.env.PROD && typeof window !== 'undefined' && !window.location.hostname.includes('ais-pre-');

  // --- States ---
  const [userMin, setUserMin] = useState<number>(48); // default Average Male low (mid1C)
  const [userMax, setUserMax] = useState<number>(67); // default Average Male high (mid2G)
  const [rangeMode, setRangeMode] = useState<'auto' | 'manual'>('auto'); // 'auto': automatic estimation from favorites, 'manual': sliders & mic override
  const [selectedGenre, setSelectedGenre] = useState<string>('all'); // category filtering
  const [simulatedKeyShift, setSimulatedKeyShift] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'unisex'>('all');
  const [rangeFilter, setRangeFilter] = useState<'all' | 'perfect' | 'adjustable' | 'favorite'>('all'); // AND filtering by song comfort capabilities
  const [selectedSongId, setSelectedSongId] = useState<string | null>('1');
  const [currentlyPlayingMidi, setCurrentlyPlayingMidi] = useState<number | null>(null);
  const [activeTab, setActiveTab ] = useState<'songs' | 'settings' | 'mylist'>('songs');
  const [easySearchQuery, setEasySearchQuery] = useState<string>('');
  const [highlightDiagnosis, setHighlightDiagnosis] = useState<boolean>(false);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(true);

  // --- UI Toast Notifications State ---
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);
  const toastTimerRef = React.useRef<any>(null);
  
  // --- Voice Preset Confirmation State ---
  const [presetToConfirm, setPresetToConfirm] = useState<VoicePreset | null>(null);

  // --- Auto Range Switch Confirmation State ---
  const [confirmSwitchAutoRange, setConfirmSwitchAutoRange] = useState<boolean>(false);
  const [autoRangeDiff, setAutoRangeDiff] = useState<{
    currentMin: number;
    currentMax: number;
    newMin: number;
    newMax: number;
    songTitle: string;
    exceedMinBy: number;
    exceedMaxBy: number;
  } | null>(null);

  // --- Admin Portal State ---
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState<string>('');
  const [adminActiveTab, setAdminActiveTab] = useState<'list' | 'form'>('list');
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState<{
    title: string;
    artist: string;
    min: number;
    max: number;
    gender: 'male' | 'female' | 'unisex';
    originalKey: string;
    genre: string;
    tags: string;
    description: string;
  }>({
    title: '',
    artist: '',
    min: 48,
    max: 71,
    gender: 'male',
    originalKey: 'Cメジャー',
    genre: 'J-POP',
    tags: '',
    description: '',
  });

  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');

  const showToastNotification = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 1800); // 一瞬（1.8秒）表示して自動消去
  };

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // --- Smooth Navigation & Diagnosis Connection ---
  // When user clicks the primary CTA to start diagnosis
  const handleStartDiagnosis = () => {
    setActiveTab('settings');
    setHighlightDiagnosis(true);
    setTimeout(() => {
      const el = document.getElementById('easy-vocal-diagnosis-panel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    // Fade highlight out after a short duration
    setTimeout(() => {
      setHighlightDiagnosis(false);
    }, 2800);
  };

  // Called immediately when user completes a main range diagnosis (A/B or mic)
  const handleDiagnosisComplete = (message: string) => {
    // 1. Mobile tab toggle
    setActiveTab('songs');
    
    // 2. Notification Toast
    showToastNotification(message);

    // 3. Scroll user smoothly down to the match results header
    setTimeout(() => {
      const el = document.getElementById('songs-list-header');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  };

  // --- Songs Database & Synchronization (Supabase integrated) ---
  const {
    songs,
    isLoading,
    dbStatus,
    dbError,
    mySingableSongs,
    setMySingableSongs,
    toggleSingableSong,
    isExporting,
    exportLocalSongsToSupabase,
    addSong,
    updateSong,
    deleteSong,
    isCleaning,
    cleanupDuplicateSongs
  } = useSyncSongs({
    rangeMode,
    setUserMin,
    setUserMax,
    onDiagnosisComplete: (msg) => handleDiagnosisComplete(msg),
    onToast: (msg) => showToastNotification(msg),
  });

  // --- データベース充実度診断 & 改善アドバイス (Enrichment Advisor) の計算 ---
  const databaseStats = useMemo(() => {
    const total = songs.length;
    if (total === 0) return null;

    // 男女比
    const maleCount = songs.filter(s => s.gender === 'male').length;
    const femaleCount = songs.filter(s => s.gender === 'female').length;
    const unisexCount = songs.filter(s => s.gender === 'unisex').length;

    const maleRatio = (maleCount / total) * 100;
    const femaleRatio = (femaleCount / total) * 100;
    const unisexRatio = (unisexCount / total) * 100;

    // アーティスト数
    const artists = Array.from(new Set(songs.map(s => s.artist)));
    const totalArtists = artists.length;

    // 音域診断（極低音、超高音などのカバー曲数）
    const lowBaseCount = songs.filter(s => s.min <= 45).length; // mid1A以下（かなり低い男声曲など）
    const ultraHighCount = songs.filter(s => s.max >= 80).length; // hiG#以上（超高音）

    // おすすめの最新アーティストの存在チェック
    const hasTuki = songs.some(s => s.artist.toLowerCase().includes('tuki'));
    const hasKento = songs.some(s => s.artist.includes('こっちのけんと'));
    const hasOmoinotake = songs.some(s => s.artist.toLowerCase().includes('omoinotake'));
    const hasFruitsZipper = songs.some(s => s.artist.toLowerCase().includes('fruits zipper'));

    // アドバイスメッセージの生成
    const recommendations: string[] = [];
    let healthScore = 75; // 初期ベース

    if (hasTuki && hasKento && hasOmoinotake) {
      healthScore += 18;
    } else {
      recommendations.push("💡 最新トレンドアーティスト（tuki.、こっちのけんと等）の曲を追加すると、若年層のカラオケ選曲率が向上します。");
    }

    if (maleRatio < 40 || maleRatio > 60) {
      recommendations.push(`💡 男女の楽曲比率がやや偏っています。現在の男性曲割合は ${maleRatio.toFixed(0)}%、女性曲割合は ${femaleRatio.toFixed(0)}% です。バランスよく登録することをお勧めします。`);
      healthScore -= 5;
    } else {
      healthScore += 5;
    }

    if (lowBaseCount < 5) {
      recommendations.push("💡 超低音曲（最低音 mid1A以下）が不足しています。B'z や 寺尾聰、あるいは King Gnu 等の低音魅力曲を追加すると、低音ボイスのユーザー満足度が上がります。");
      healthScore -= 5;
    } else {
      healthScore += 3;
    }

    if (ultraHighCount < 10) {
      recommendations.push("💡 hiG#以上の超ハイトーン楽曲をさらに増やすと、ハイトーンボイス自慢 of ユーザーに喜ばれます（Mrs. GREEN APPLE や Official髭男dism、Adoなどの曲が有効です）。");
      healthScore -= 5;
    } else {
      healthScore += 2;
    }

    // ジャンルの多様性
    const genres = Array.from(new Set(songs.map(s => s.genre)));
    if (genres.length < 5) {
      recommendations.push(`💡 登録されているジャンルが少ないです（現在 ${genres.length}種）。アニソン、ボカロ、演歌/歌謡曲、HIP-HOP などのジャンルを広げることで、シニア層やZ世代など全世代をカバーできます。`);
      healthScore -= 10;
    } else {
      healthScore += 5;
    }

    const finalScore = Math.min(100, Math.max(30, healthScore));

    return {
      total,
      totalArtists,
      maleRatio,
      femaleRatio,
      unisexRatio,
      lowBaseCount,
      ultraHighCount,
      hasTuki,
      hasKento,
      hasOmoinotake,
      hasFruitsZipper,
      recommendations,
      score: finalScore
    };
  }, [songs]);

  // --- Auto Range Switch Handlers ---
  const applyAutoRangeMode = () => {
    setRangeMode('auto');
    const registeredSongs = songs.filter(s => mySingableSongs.includes(s.id));
    if (registeredSongs.length > 0) {
      const mins = registeredSongs.map(s => s.min);
      const maxs = registeredSongs.map(s => s.max);
      const newMin = Math.min(...mins);
      const newMax = Math.max(...maxs);
      setUserMin(newMin);
      setUserMax(newMax);
      showToastNotification("🎤 マイリスト登録曲からの自動推定音域に切り替えました！");
    } else {
      showToastNotification("⚠️ マイリストに歌える曲が登録されていません。一般男性平均に戻します。");
      setUserMin(48);
      setUserMax(67);
    }
  };

  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId);
    
    // 手動設定（manual）の状態で、マイリストに登録されている「歌える曲」を選択した場合
    if (rangeMode === 'manual' && mySingableSongs.includes(songId)) {
      const song = songs.find(s => s.id === songId);
      if (song) {
        // キーシフトを考慮した音域
        const songMinWithShift = song.min + simulatedKeyShift;
        const songMaxWithShift = song.max + simulatedKeyShift;
        
        const exceedMinBy = userMin - songMinWithShift; // > 0 なら現在の最低音より低い
        const exceedMaxBy = songMaxWithShift - userMax; // > 0 なら現在の最高音より高い
        
        if (exceedMinBy > 0 || exceedMaxBy > 0) {
          // 自動推定に切り替えた場合の新しい音域を計算
          const registeredSongs = songs.filter(s => mySingableSongs.includes(s.id));
          let newMin = userMin;
          let newMax = userMax;
          if (registeredSongs.length > 0) {
            newMin = Math.min(...registeredSongs.map(s => s.min));
            newMax = Math.max(...registeredSongs.map(s => s.max));
          }
          
          setAutoRangeDiff({
            currentMin: userMin,
            currentMax: userMax,
            newMin,
            newMax,
            songTitle: song.title,
            exceedMinBy: Math.max(0, exceedMinBy),
            exceedMaxBy: Math.max(0, exceedMaxBy)
          });
          setConfirmSwitchAutoRange(true);
        }
      }
    }
  };

  // --- Admin Portal Handlers ---
  const handleOpenAdminPortal = () => {
    setIsAdminOpen(true);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscodeInput === 'admin') {
      setIsAdminAuthenticated(true);
      setAdminActiveTab('list');
      setAdminPasscodeInput('');
    } else {
      showToastNotification("❌ 合言葉が違います。");
    }
  };

  const handleOpenAddForm = () => {
    setEditingSongId(null);
    setAdminForm({
      title: '',
      artist: '',
      min: 48,
      max: 71,
      gender: 'male',
      originalKey: 'Cメジャー',
      genre: 'J-POP',
      tags: '',
      description: ''
    });
    setAdminActiveTab('form');
  };

  const handleOpenEditForm = (song: Song) => {
    setEditingSongId(song.id);
    setAdminForm({
      title: song.title,
      artist: song.artist,
      min: song.min,
      max: song.max,
      gender: song.gender as 'male' | 'female' | 'unisex',
      originalKey: song.originalKey,
      genre: song.genre,
      tags: song.tags.join(', '),
      description: song.description
    });
    setAdminActiveTab('form');
  };

  const handleSaveAdminForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.title.trim() || !adminForm.artist.trim()) {
      showToastNotification("⚠️ 曲名とアーティスト名は必須項目です。");
      return;
    }

    const tagsArray = adminForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const dataPayload = {
      title: adminForm.title.trim(),
      artist: adminForm.artist.trim(),
      min: Number(adminForm.min),
      max: Number(adminForm.max),
      gender: adminForm.gender,
      originalKey: adminForm.originalKey.trim(),
      genre: adminForm.genre.trim(),
      tags: tagsArray,
      description: adminForm.description.trim()
    };

    let success = false;
    if (editingSongId) {
      success = await updateSong(editingSongId, dataPayload);
    } else {
      success = await addSong(dataPayload);
    }

    if (success) {
      setAdminActiveTab('list');
      setEditingSongId(null);
    }
  };

  const handleDeleteAdminSong = async (id: string, title: string) => {
    if (window.confirm(`本当に「${title}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
      await deleteSong(id);
    }
  };

  const easyFilteredSongs = useMemo(() => {
    if (!easySearchQuery.trim()) return [];
    const query = easySearchQuery.toLowerCase();
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );
  }, [easySearchQuery, songs]);

  // --- Microphone Real-time Pitch Detection (Mobile Compatible) ---
  const {
    isMeasuring,
    detectedHz,
    detectedMidi,
    measuredMin,
    measuredMax,
    startVocalMeasurement,
    stopVocalMeasurement,
    resetMeasurement
  } = usePitchDetection({
    onToast: (msg) => showToastNotification(msg)
  });

  const applyMeasuredRange = () => {
    if (measuredMin !== null && measuredMax !== null) {
      setRangeMode('manual');
      setUserMin(measuredMin);
      setUserMax(measuredMax);
      handleDiagnosisComplete(`🎤 測定結果 (${formatPitch(measuredMin).raw} 〜 ${formatPitch(measuredMax).raw}) を反映し、マッチ曲を表示しました！`);
    } else {
      showToastNotification("データが不足しています。数秒間発声してみてください。");
    }
  };



  // Audio synthethizer lazily using Web Audio API on tone clicked (Piano-like synthesized sound)
  const triggerAudioNote = (midiNumber: number) => {
    try {
      setCurrentlyPlayingMidi(midiNumber);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const duration = 0.8;
      
      const freq = Math.pow(2, (midiNumber - 69) / 12) * 440;
      
      const playPart = (f: number, wave: OscillatorType, maxGain: number, decay: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = wave;
        osc.frequency.setValueAtTime(f, now);
        
        // Attack-Decay envelope to simulate piano strike
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(maxGain, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + decay);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + decay);
      };

      // Fundamental frequency (triangle wave for wood/key resonance)
      playPart(freq, 'triangle', 0.18, duration);
      
      // Harmonics (sine waves with faster decay to simulate physical strings overtones)
      if (freq * 2 < 20000) {
        playPart(freq * 2, 'sine', 0.08, duration * 0.5);
      }
      if (freq * 3 < 20000) {
        playPart(freq * 3, 'sine', 0.04, duration * 0.3);
      }
      
      setTimeout(() => {
        setCurrentlyPlayingMidi(prev => prev === midiNumber ? null : prev);
      }, duration * 1000);
    } catch (error) {
      console.warn("AudioContext initialization blocked or unsupported:", error);
    }
  };

  // Safe range adjusters helper
  const handleMinChange = (val: number) => {
    setRangeMode('manual');
    if (val >= userMax) {
      setUserMin(userMax - 1);
    } else {
      setUserMin(val);
    }
  };

  const handleMaxChange = (val: number) => {
    setRangeMode('manual');
    if (val <= userMin) {
      setUserMax(userMin + 1);
    } else {
      setUserMax(val);
    }
  };

  // Load Preset Ranges
  const selectPreset = (preset: VoicePreset) => {
    // 自分の歌いたい曲（マイリスト）に曲が登録されている場合は、設定上書きの確認を出す
    if (mySingableSongs.length > 0) {
      setPresetToConfirm(preset);
    } else {
      // 登録がない場合はそのまま瞬時に適用
      applyPreset(preset);
    }
  };

  const applyPreset = (preset: VoicePreset) => {
    setRangeMode('manual');
    setUserMin(preset.min);
    setUserMax(preset.max);
    showToastNotification(`📢 音域を「${preset.name}」に対応した範囲に設定しました。`);
    setPresetToConfirm(null);
  };

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

      // 2. Discover Optimal Key Shift if possible (Scanning from -3 to +3 semitones based on Requirement ③)
      let canSingWithAdjustments = false;
      let optimalShift: number | null = null;
      let possibleKeyRange: number[] = [];

      for (let shift = -3; shift <= 3; shift++) {
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

      // Define three matching tiers (Requirement ③)
      let tier: 'perfect' | 'adjustable' | 'difficult' = 'difficult';
      if (origFitsPerfect) {
        tier = 'perfect'; // そのまま歌える
      } else if (canSingWithAdjustments) {
        tier = 'adjustable'; // キー調整で歌える
      }

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
        tier,
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
      setRangeMode('auto');
      setUserMin(estimatedRange.min);
      setUserMax(estimatedRange.max);
      handleDiagnosisComplete(`🎤 選択曲からの推測音域 (${formatPitch(estimatedRange.min).raw} 〜 ${formatPitch(estimatedRange.max).raw}) を設定に反映し、マッチ曲を表示しました！`);
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

      // 1.5. ジャンルによるフィルター
      const matchesGenre = selectedGenre === 'all' || song.genre === selectedGenre;
      if (!matchesGenre) return false;

      // 2. 音域・フィット状態によるフィルター（AND条件で即座に絞り込み）
      if (rangeFilter === 'perfect') {
        // 現在のシミュレーションキーまたは原曲キーのいずれかでぴったり収まるか
        if (!song.origFitsPerfect && !song.simFitsPerfect) return false;
      } else if (rangeFilter === 'adjustable') {
        if (!song.canSingWithAdjustments) return false;
      } else if (rangeFilter === 'favorite') {
        if (!mySingableSongs.includes(song.id)) return false;
      }
      
      // 検索ワードが空ならここまでのフィルターのみクリアしていればマッチ
      if (!queryNormalized) return true;
      
      // 3. スペース区切り複数キーワードによるAND検索
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
  }, [analyzedSongs, searchQuery, genderFilter, selectedGenre, rangeFilter, mySingableSongs]);

  // Display songs: if mylist tab is active, filter processedSongs to only show registered songs
  const displaySongs = useMemo(() => {
    if (activeTab === 'mylist') {
      return processedSongs.filter(song => mySingableSongs.includes(song.id));
    }
    return processedSongs;
  }, [activeTab, processedSongs, mySingableSongs]);

  // Counters: Calculated based on search, gender and genre, independent of rangeFilter to keep counts accurate!
  const countStats = useMemo(() => {
    const queryNormalized = normalizeText(searchQuery);
    const searchFilteredSongs = analyzedSongs.filter(song => {
      const matchesGender = genderFilter === 'all' || song.gender === genderFilter;
      if (!matchesGender) return false;

      const matchesGenre = selectedGenre === 'all' || song.genre === selectedGenre;
      if (!matchesGenre) return false;

      if (!queryNormalized) return true;
      const keywords = queryNormalized.split(" ").filter(Boolean);
      const titleNorm = normalizeText(song.title);
      const artistNorm = normalizeText(song.artist);
      const tagsNorm = song.tags.map(tag => normalizeText(tag));
      return keywords.every(kw => {
        return titleNorm.includes(kw) || 
               artistNorm.includes(kw) || 
               tagsNorm.some(tag => tag.includes(kw));
      });
    });

    const perfectCount = searchFilteredSongs.filter(s => s.origFitsPerfect || s.simFitsPerfect).length;
    const adjustCount = searchFilteredSongs.filter(s => !(s.origFitsPerfect || s.simFitsPerfect) && s.canSingWithAdjustments).length;
    const impossibleCount = searchFilteredSongs.filter(s => !s.canSingWithAdjustments).length;
    return { perfect: perfectCount, adjustable: adjustCount, impossible: impossibleCount };
  }, [analyzedSongs, searchQuery, genderFilter, selectedGenre]);

  return (
    <div id="karaoke-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-900">
      
      {/* ================= HEADER ================= */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">カラオケ音域検索</h1>
              </div>
              <p className="text-xs text-slate-400 font-medium">リアルタイムマイク判定やプレイリストから、あなたの音域にぴったりの楽曲と適正キーを瞬時に診断</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
            {VOICE_PRESETS.map((preset, index) => (
              <button
                key={index}
                onClick={() => selectPreset(preset)}
                className="text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-500/40 bg-slate-900 hover:bg-slate-850 hover:text-white transition-all text-slate-300 shrink-0 flex items-center gap-1.5"
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
            <span>カラオケ音域診断「キーぴた」</span>
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
            歌えるお気に入り曲をいくつか選ぶだけで、あなたの音域（声域）を自動判定！<br className="hidden sm:inline" />
            無理なく歌える曲を自動マッチングし、キー変更もリアルタイムでシミュレーション。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full sm:w-auto flex flex-col items-center gap-2.5"
          >
            <button
              onClick={handleStartDiagnosis}
              className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2.5 px-8 py-3.5 md:py-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-550 hover:from-emerald-450 hover:to-indigo-500 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]"
            >
              <span>歌える曲から音域をかんたん診断する</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <span className="text-[11px] text-emerald-400/80 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Lemonやマリーゴールドなど、知っている曲を選んで1秒設定！
            </span>
          </motion.div>
        </div>
      </section>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-4 md:py-6 flex flex-col gap-5 md:gap-6">
        
        {/* Navigation Tabs (Available on both desktop and mobile for intuitive navigation) */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-2xl relative z-10 w-full">
          <button
            onClick={() => setActiveTab('songs')}
            className={`flex-1 py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'songs'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md transform scale-[1.01]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>楽曲診断リスト</span>
            <span className={`text-[9px] sm:text-xs px-1.5 py-0.5 rounded-full font-mono font-semibold ${
              activeTab === 'songs' ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-950/45 text-slate-400'
            }`}>
              {countStats.perfect + countStats.adjustable}曲
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md transform scale-[1.01]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>音域 & キー設定</span>
          </button>

          <button
            onClick={() => setActiveTab('mylist')}
            className={`flex-1 py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'mylist'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md transform scale-[1.01]'
                : 'text-slate-400 hover:text-slate-200 hover:text-pink-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'mylist' ? 'fill-white text-white' : 'text-slate-400 group-hover:text-pink-400'}`} />
            <span>マイリスト</span>
            <span className={`text-[9px] sm:text-xs px-1.5 py-0.5 rounded-full font-mono font-semibold ${
              activeTab === 'mylist' ? 'bg-white/20 text-white' : 'bg-slate-950/45 text-slate-405 font-bold'
            }`}>
              {mySingableSongs.length}曲
            </span>
          </button>
        </div>

        {/* 🎧 現在のあなたの設定音域ボード (分かりやすいよう最上部に常時表示) */}
        <div id="vocal-range-persistent-header" className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl py-2 px-3 sm:py-2.5 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg transition-all relative overflow-hidden animate-fade-in z-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-indigo-505/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-emerald-440">
              <Sparkles className="w-4 h-4 animate-pulse text-emerald-450" />
              <span className="text-[11px] font-black text-slate-350 uppercase tracking-widest">
                現在の設定音域
              </span>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-4 w-px bg-slate-800" />

            {/* Pitch Range Display */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Lower Pitch Button */}
              <button
                onClick={() => triggerAudioNote(userMin)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-left transition-all cursor-pointer select-none active:scale-95 ${
                  currentlyPlayingMidi === userMin
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/40 hover:bg-slate-950/80 border-slate-800 text-slate-100 hover:border-slate-700'
                }`}
                title="最低音を再生する"
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-base font-black font-mono tracking-tight text-white">
                    {formatPitch(userMin).raw}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    ({formatPitch(userMin).note})
                  </span>
                </div>
                <Volume2 className={`w-3.5 h-3.5 ${currentlyPlayingMidi === userMin ? 'text-emerald-400 animate-bounce' : 'text-slate-500'}`} />
              </button>

              <span className="text-slate-600 text-xs font-semibold select-none">〜</span>

              {/* Upper Pitch Button */}
              <button
                onClick={() => triggerAudioNote(userMax)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-left transition-all cursor-pointer select-none active:scale-95 ${
                  currentlyPlayingMidi === userMax
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/40 hover:bg-slate-950/80 border-slate-800 text-slate-100 hover:border-slate-700'
                }`}
                title="最高音を再生する"
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-base font-black font-mono tracking-tight text-emerald-400">
                    {formatPitch(userMax).raw}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    ({formatPitch(userMax).note})
                  </span>
                </div>
                <Volume2 className={`w-3.5 h-3.5 ${currentlyPlayingMidi === userMax ? 'text-emerald-400 animate-bounce' : 'text-slate-500'}`} />
              </button>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-4 w-px bg-slate-800" />

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] bg-slate-950 text-emerald-400/95 border border-emerald-500/15 px-2 py-0.5 rounded font-mono font-bold">
                幅 {userMax - userMin} 半音 ({((userMax - userMin) / 12).toFixed(1)}オクターブ)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {activeTab !== 'settings' ? (
              <button
                onClick={() => setActiveTab('settings')}
                className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow active:scale-95 text-slate-300"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-450" />
                <span>音域の変更・測定</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 font-bold border border-slate-850 bg-slate-950/20 px-2.5 py-1.5 rounded-lg">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>左側の設定から調整中</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Columns Grid wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

          {/* LEFT COLUMN: Range Configuration, Active Simulator, Pitch Keyboard */}
          <section id="settings-section" className={`lg:col-span-5 flex-col gap-6 ${activeTab === 'settings' ? 'flex' : 'hidden lg:flex'}`}>
          
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

          {/* 📊 DATABASE COMPLETENESS ADVISOR FOR GENERAL USERS */}
          {databaseStats && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden bg-radial from-slate-950/20 via-slate-900 to-slate-900">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  データベース網羅率＆改善アドバイス
                </h3>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  診断スコア: {databaseStats.score}点 / 極めて優秀
                </span>
              </div>
              
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3.5">
                当サイトは、カラオケで最も歌われる大人気曲を中心に<strong>{databaseStats.total}曲</strong>（<strong>{databaseStats.totalArtists}組</strong>のアーティスト）の音域データを完全分析・登録しています。
              </p>

              <div className="space-y-3 text-[10.5px]">
                {/* 男女・ジャンル指標 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">男性曲割合:</span>
                    <span className="text-sky-400 font-mono font-bold">{databaseStats.maleRatio.toFixed(0)}%</span>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">女性曲割合:</span>
                    <span className="text-rose-400 font-mono font-bold">{databaseStats.femaleRatio.toFixed(0)}%</span>
                  </div>
                </div>

                {/* アドバイス & 充実度解説 */}
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-850 space-y-1.5 text-slate-300 leading-relaxed">
                  <div className="font-bold text-slate-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-450" />
                    <span>データ充実化アドバイザーによる評価</span>
                  </div>
                  <div>
                    {databaseStats.score >= 90 ? (
                      <span>✨ <strong>最高ランク評価</strong>: <strong>tuki.（晩餐歌）</strong> や <strong>こっちのけんと（はいよろこんで）</strong>、<strong>FRUITS ZIPPER</strong> などの最新トレンド曲がすべて登録されています！音域診断の精度は極めて高い状態です。</span>
                    ) : (
                      <span>現在も定期的にカラオケ人気曲を自動追加中です。お探しの曲がない場合は管理者にお知らせください。</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 🌟 EASY SETUP FROM SONGS YOU CAN SING */}
          <div 
            id="easy-vocal-diagnosis-panel" 
            className={`bg-slate-900 border rounded-2xl p-5 shadow-2xl relative overflow-hidden bg-radial from-indigo-950/15 via-slate-900 to-slate-900 transition-all duration-500 ${
              highlightDiagnosis 
                ? 'border-emerald-400 ring-4 ring-emerald-550/40 scale-[1.02] shadow-emerald-500/20' 
                : 'border-indigo-500/30 ring-2 ring-indigo-500/20'
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                【方法A】歌える曲リストから音域を自動判定
              </h2>
              <span className="text-[10px] font-bold text-indigo-350 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                1秒かんたん判定
              </span>
            </div>
            
            <p className="text-[11px] text-slate-300 mb-4 leading-relaxed">
              あなたが原曲キー（キー変更なし）で「普段歌える曲、歌いやすい曲」を選択してください。<br />
              曲のオクターブ・最高曲キーデータから、あなたの歌える音域（最低音〜最高音）を自動で推定し、すぐ下のスライダー設定値へリアルタイム反映します。
            </p>

            {/* 🔍 曲名・歌手名で検索できるフォーム */}
            <div className="mb-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="曲名、または歌手名を入力して歌える曲を検索して追加..."
                value={easySearchQuery}
                onChange={(e) => setEasySearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
              />
              {easySearchQuery && (
                <button
                  onClick={() => setEasySearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* 検索結果（クエリがある場合）、または定番曲（クエリが空の場合） */}
            {easySearchQuery.trim() !== '' ? (
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                  <span>楽曲検索結果 ({easyFilteredSongs.length}件)</span>
                  <button 
                    onClick={() => setEasySearchQuery('')} 
                    className="text-slate-500 hover:text-slate-300 text-[10px] underline"
                  >
                    検索をクリア
                  </button>
                </div>
                {easyFilteredSongs.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {easyFilteredSongs.map((s) => {
                      const isSelected = mySingableSongs.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSingableSong(s.id)}
                          className={`text-[11px] p-2 rounded-xl border text-left transition-all active:scale-[0.97] cursor-pointer flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-550/25 border-indigo-500 text-white font-bold shadow-md shadow-indigo-550/10'
                              : 'bg-slate-950/80 border-slate-850 text-slate-450 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] truncate font-medium">{s.title}</span>
                            <span className="text-[9px] text-slate-500 truncate mt-0.5">{s.artist}</span>
                          </div>
                          {isSelected ? (
                            <Heart className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400 shrink-0" />
                          ) : (
                            <Plus className="w-3 h-3 text-slate-650 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-[11px] text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-850">
                    該当する楽曲が見つかりませんでした。別のキーワードでお試しください。
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* 男声向け定番曲 */}
                <div>
                  <div className="text-[10.5px] font-bold text-sky-400 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-450" />
                    定番曲からワンタップで追加
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: '2', title: 'Lemon', artist: '米津玄師' },
                      { id: '5', title: 'ドライフラワー', artist: '優里' },
                      { id: '9', title: 'チェリー', artist: 'スピッツ' },
                      { id: '11', title: '小さな恋のうた', artist: 'MONGOL800' },
                      { id: '15', title: '奏 (かなで)', artist: 'スキマスイッチ' }
                    ].map((s) => {
                      const isSelected = mySingableSongs.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSingableSong(s.id)}
                          className={`text-[11px] p-2.5 rounded-xl border text-left transition-all active:scale-[0.97] cursor-pointer flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-sky-500/10 border-sky-500 text-sky-250 font-bold shadow-md shadow-sky-500/5'
                              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-250 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className={`text-[11.5px] truncate font-medium ${isSelected ? 'text-white font-bold' : 'text-slate-300'}`}>{s.title}</span>
                            <span className="text-[9px] text-slate-500 truncate mt-0.5">{s.artist}</span>
                          </div>
                          {isSelected ? (
                            <Heart className="w-3.5 h-3.5 text-sky-400 fill-sky-400 shrink-0" />
                          ) : (
                            <Plus className="w-3 h-3 text-slate-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 女声向け定番曲 */}
                <div>
                  <div className="text-[10.5px] font-bold text-pink-400 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-450" />
                    女声・ハイトーン定番曲から追加
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: '1', title: 'マリーゴールド', artist: 'あいみょん' },
                      { id: '10', title: 'ハナミズキ', artist: '一青窈' },
                      { id: '6', title: '糸', artist: '中島みゆき' },
                      { id: '16', title: 'カブトムシ', artist: 'aiko' },
                      { id: '14', title: '残酷な天使のテーゼ', artist: '高橋洋子' }
                    ].map((s) => {
                      const isSelected = mySingableSongs.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSingableSong(s.id)}
                          className={`text-[11px] p-2.5 rounded-xl border text-left transition-all active:scale-[0.97] cursor-pointer flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-pink-500/10 border-pink-500 text-pink-250 font-bold shadow-md shadow-pink-500/5'
                              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-250 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className={`text-[11.5px] truncate font-medium ${isSelected ? 'text-white font-bold' : 'text-slate-300'}`}>{s.title}</span>
                            <span className="text-[9px] text-slate-500 truncate mt-0.5">{s.artist}</span>
                          </div>
                          {isSelected ? (
                            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 shrink-0" />
                          ) : (
                            <Plus className="w-3 h-3 text-slate-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 🏷️ 現在選択済みの歌える曲一覧（推定基準曲） */}
            {mySingableSongs.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-slate-800/80 bg-slate-950/30 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  選択中の歌える曲 ({mySingableSongs.length}曲) から音域を自動推定中:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                  {songs.filter(s => mySingableSongs.includes(s.id)).map((song) => (
                    <div
                      key={song.id}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-950/40 hover:bg-indigo-900/40 text-slate-250 text-[10.5px] rounded-lg border border-indigo-500/10 shadow-sm"
                    >
                      <span className="max-w-[120px] truncate font-medium text-white">{song.title}</span>
                      <button
                        onClick={() => toggleSingableSong(song.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-all cursor-pointer"
                        title="解除する"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanatory helper block */}
            <div className="mt-4 pt-3 border-t border-slate-800/85 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
              <span>※複数選択すると、そのすべてをカバー可能な音域に自動拡張されます。</span>
              {mySingableSongs.length > 0 && (
                <button
                  onClick={() => {
                    setMySingableSongs([]);
                    localStorage.setItem('my_singable_songs', JSON.stringify([]));
                    setUserMin(48);
                    setUserMax(67);
                    showToastNotification("選択された楽曲をクリアし、標準音域へリセットしました");
                  }}
                  className="px-2 py-0.5 bg-slate-950 hover:bg-slate-850 hover:text-rose-450 text-slate-400 rounded border border-slate-850 hover:border-rose-500/10 transition-all cursor-pointer font-bold"
                >
                  すべての選択をクリア
                </button>
              )}
            </div>
          </div>
          
          {/* 1. VOCAL RANGE SLIDERS CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-emerald-400" />
              【方法B】スライダー・鍵盤・マイクで細かく設定
            </h2>

            {/* 🔄 モード切り替えコントロール（お洒落なインラインタブ） */}
            <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 mb-5">
              <span className="text-[11px] text-slate-300 font-bold pl-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${rangeMode === 'auto' ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                現在の音域設定モード:
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    applyAutoRangeMode();
                  }}
                  className={`px-3 py-1 text-[10px] sm:text-[10.5px] rounded-lg font-bold transition-all cursor-pointer ${
                    rangeMode === 'auto'
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  自動推定値を使う ({mySingableSongs.length}曲)
                </button>
                <button
                  onClick={() => {
                    setRangeMode('manual');
                    showToastNotification("🔧 手動調整モードに切り替えました。スライダー等で細かく調整できます！");
                  }}
                  className={`px-3 py-1 text-[10px] sm:text-[10.5px] rounded-lg font-bold transition-all cursor-pointer ${
                    rangeMode === 'manual'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  手動で設定する
                </button>
              </div>
            </div>

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
            <div className="space-y-5 pb-5 border-b border-slate-800">
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="text-slate-300 font-medium">最低音スライダー (Vocal Low)</span>
                  <span className="font-mono text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                    {formatPitch(userMin).raw} ({userMin} MIDI)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newVal = Math.max(24, userMin - 1);
                      handleMinChange(newVal);
                      triggerAudioNote(newVal);
                    }}
                    disabled={userMin <= 24}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl text-slate-400 hover:text-emerald-400 disabled:opacity-40 disabled:hover:border-slate-800 active:scale-95 transition-all text-sm font-bold min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0 cursor-pointer"
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
                    onMouseUp={() => triggerAudioNote(userMin)}
                    onTouchEnd={() => triggerAudioNote(userMin)}
                    className="flex-1 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-slate-800"
                  />
                  <button
                    onClick={() => {
                      const newVal = Math.min(userMax - 1, userMin + 1);
                      handleMinChange(newVal);
                      triggerAudioNote(newVal);
                    }}
                    disabled={userMin >= userMax - 1}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl text-slate-400 hover:text-emerald-400 disabled:opacity-40 disabled:hover:border-slate-800 active:scale-95 transition-all text-sm font-bold min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0 cursor-pointer"
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
                    onClick={() => {
                      const newVal = Math.max(userMin + 1, userMax - 1);
                      handleMaxChange(newVal);
                      triggerAudioNote(newVal);
                    }}
                    disabled={userMax <= userMin + 1}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-xl text-slate-400 hover:text-rose-400 disabled:opacity-40 disabled:hover:border-slate-800 active:scale-95 transition-all text-sm font-bold min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0 cursor-pointer"
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
                    onMouseUp={() => triggerAudioNote(userMax)}
                    onTouchEnd={() => triggerAudioNote(userMax)}
                    className="flex-1 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500 border border-slate-800"
                  />
                  <button
                    onClick={() => {
                      const newVal = Math.min(95, userMax + 1);
                      handleMaxChange(newVal);
                      triggerAudioNote(newVal);
                    }}
                    disabled={userMax >= 95}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-xl text-slate-400 hover:text-rose-400 disabled:opacity-40 disabled:hover:border-slate-800 active:scale-95 transition-all text-sm font-bold min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0 cursor-pointer"
                    title="最高音を1つ上げる"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. VIRTUAL PIANO KEYBOARD INTEGRATED */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <PianoKeyboard
                userMin={userMin}
                userMax={userMax}
                selectedSong={selectedSong}
                simulatedKeyShift={simulatedKeyShift}
                currentlyPlayingMidi={currentlyPlayingMidi}
                triggerAudioNote={triggerAudioNote}
                onSetUserMin={setUserMin}
                onSetUserMax={setUserMax}
                setRangeMode={setRangeMode}
              />
            </div>

            {/* 🎙️ Real-time Mic Vocal Range Auto-Measurement Section */}
            <div className="mt-5 pt-4 border-t border-slate-800 bg-slate-950/20 p-4 rounded-2xl border border-slate-800/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                  音声ハイトーン・ピッチ自動判定マイク
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20">
                  Real-time F0
                </span>
              </div>

              {/* Guide/explanation block */}
              <p className="text-[10px] text-slate-400 leading-relaxed">
                マイクに向かって声（「あー」「歌の一部」「ハミング」など）を出すことで、あなたの発声ピッチを読み取り、最低・最高音をその場で記録します。
              </p>

              <div className="flex flex-wrap gap-2">
                {!isMeasuring ? (
                  <button
                    onClick={startVocalMeasurement}
                    className="flex-1 min-w-[120px] py-2 px-3.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>自動測定を開始する</span>
                  </button>
                ) : (
                  <button
                    onClick={stopVocalMeasurement}
                    className="flex-1 min-w-[120px] py-2 px-3.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md animate-pulse cursor-pointer"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>測定を終了する</span>
                  </button>
                )}

                {(measuredMin !== null || measuredMax !== null) && (
                  <button
                    onClick={applyMeasuredRange}
                    className="py-2 px-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>結果を設定に反映</span>
                  </button>
                )}
              </div>

              {/* Measuring Info Panel */}
              {isMeasuring && (
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-850 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">現在検知中のピッチ:</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {detectedHz > 0 ? `${detectedHz} Hz` : '声を測定中...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">音名:</span>
                    <span className="text-xs font-semibold text-white font-mono">
                      {detectedMidi !== null ? formatPitch(detectedMidi).full : '---'}
                    </span>
                  </div>
                  {/* Realtime visual volume block */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute left-0 top-0 h-full bg-indigo-400 transition-all duration-75"
                      style={{ width: detectedHz > 0 ? '100%' : '5%' }}
                    />
                  </div>
                </div>
              )}

              {/* Accumulated result indicator */}
              {(measuredMin !== null || measuredMax !== null) && (
                <div className="bg-indigo-950/20 p-3 rounded-xl border border-indigo-500/10 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex flex-col">
                    <span className="text-slate-400">測定された最低音:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                      {measuredMin !== null ? formatPitch(measuredMin).raw : '未検出'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-sans mt-0.5">
                      {measuredMin !== null ? formatPitch(measuredMin).note : ''}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400">測定された最高音:</span>
                    <span className="text-xs font-mono font-bold text-rose-400 mt-0.5">
                      {measuredMax !== null ? formatPitch(measuredMax).raw : '未検出'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-sans mt-0.5">
                      {measuredMax !== null ? formatPitch(measuredMax).note : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Troubleshooting Tips */}
              <div className="text-[9px] text-slate-500 leading-normal bg-slate-950/25 p-2 rounded">
                ⚠️ スマホやブラウザの権限でマイクが起動しない、またはiFrame埋め込みエラーが発生する際は、**画面右上の「新しいタブで開く（別タブ展開）」**からお試しください。
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
                        left: `${((userMin - PIANO_START) / (PIANO_END - PIANO_START)) * 100}%`,
                        width: `${((userMax - userMin) / (PIANO_END - PIANO_START)) * 100}%`
                      }}
                      className="absolute top-0 bottom-0 bg-emerald-500/10 border-l border-r border-emerald-500/30"
                    />
                    
                    {/* Estimated vocal range (pink line) */}
                    <div 
                      style={{
                        left: `${((estimatedRange.min - PIANO_START) / (PIANO_END - PIANO_START)) * 100}%`,
                        width: `${((estimatedRange.max - estimatedRange.min) / (PIANO_END - PIANO_START)) * 100}%`
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

        </section>

        {/* RIGHT COLUMN: Song database filters & song card grid (7 Columns) */}
        <section className={`lg:col-span-7 flex flex-col gap-6 ${(activeTab === 'songs' || activeTab === 'mylist') ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* 1. FILTER CONTROLS BAR & STATS */}
          <div id="songs-list-header" className="relative z-30 bg-slate-950/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4 transition-all animate-fade-in">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2">
                {activeTab === 'mylist' ? (
                  <>
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span>歌える曲のマイリスト ({mySingableSongs.length}曲)</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-emerald-400" />
                    <span>登録楽曲データベースから検索</span>
                  </>
                )}
              </span>
            </h2>

            {/* Inputs & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              
              {/* 検索入力 */}
              <div className="lg:col-span-12 xl:col-span-5 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="曲名、歌手名、タグでAND検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl h-11 pl-11 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* 性別指定 */}
              <div className="lg:col-span-6 xl:col-span-3 flex rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1 h-11">
                {(['all', 'male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`flex-1 py-1 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate ${
                      genderFilter === g
                        ? 'bg-slate-850 text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {g === 'all' ? '性別すべて' : g === 'male' ? '男声' : '女声'}
                  </button>
                ))}
              </div>

              {/* ジャンル指定 */}
              <div className="lg:col-span-6 xl:col-span-4 flex rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1 h-11">
                {(['all', 'J-POP', 'アニソン', 'ロック', 'バラード'] as const).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer truncate ${
                      selectedGenre === genre
                        ? 'bg-indigo-950 text-indigo-400 shadow-sm border border-indigo-500/20'
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {genre === 'all' ? '全ジャンル' : genre}
                  </button>
                ))}
              </div>

            </div>

            {/* 🎯 音域からマッチング条件で絞り込むANDフィルタ (UXリファクタリング要件2) */}
            <div className="space-y-1.5 pt-3 border-t border-slate-850/60 pointer-events-auto">
              <span className="text-[10px] font-bold text-slate-500 block select-none uppercase tracking-widest animate-fade-in">
                音域の相性（適正ティア）で絞り込む:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'all', label: '全登録曲を表示', count: songs.length, borderClass: 'border-slate-800 hover:border-slate-700 text-slate-400' },
                  { id: 'perfect', label: 'そのまま歌える', count: countStats.perfect, borderClass: 'border-emerald-950 hover:bg-emerald-555/5 hover:border-emerald-500/30 text-emerald-300' },
                  { id: 'adjustable', label: 'キー変更で可能', count: countStats.adjustable, borderClass: 'border-indigo-950 hover:bg-indigo-555/5 hover:border-indigo-500/30 text-indigo-300' },
                  { id: 'favorite', label: 'マイ歌える曲', count: mySingableSongs.length, borderClass: 'border-pink-950 hover:bg-pink-555/5 hover:border-pink-500/30 text-pink-300' }
                ].map((opt) => {
                  const isActive = rangeFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setRangeFilter(opt.id as any)}
                      className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none truncate min-h-[54px] ${
                        isActive
                          ? 'bg-slate-900 border-emerald-400 text-white shadow-xl ring-2 ring-emerald-500/10'
                          : `bg-slate-950/70 opacity-85 hover:opacity-100 ${opt.borderClass}`
                      }`}
                    >
                      <span className="text-[10px] tracking-tight">{opt.label}</span>
                      {opt.id !== 'all' && (
                        <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-md border ${
                          isActive ? 'bg-indigo-500 border-indigo-400/20 text-white' : 'bg-slate-900 border-slate-850 text-slate-400'
                        }`}>
                          {opt.count}
                        </span>
                      )}
                    </button>
                  );
                })}
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
              ) : displaySongs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-8 py-12 text-center text-slate-400 flex flex-col items-center justify-center shadow-lg animate-fade-in"
                >
                  {activeTab === 'mylist' && mySingableSongs.length === 0 ? (
                    <>
                      <Heart className="w-12 h-12 text-pink-500 animate-pulse fill-pink-500/25 mb-4" />
                      <p className="text-sm font-bold text-slate-200">マイリストは現在空です</p>
                      <p className="text-xs text-slate-450 mt-2.5 max-w-sm leading-relaxed">
                        「楽曲診断リスト」タブから、普段よく歌う曲や好きな曲のカードにある 
                        <strong className="text-pink-400 font-bold mx-1">「歌える！登録（ハート）」</strong> 
                        ボタンを押して追加してみましょう！<br /><br />
                        あなたの選んだ曲の音域データを分析し、あなたにおすすめの歌える曲を瞬時に割り出し、あなたにピッタリの最適なカラオケキーを提案します。
                      </p>
                      <button
                        onClick={() => setActiveTab('songs')}
                        className="mt-6 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md shadow-emerald-950/15"
                      >
                        <Music className="w-3.5 h-3.5" />
                        <span>楽曲診断リストから曲を登録する</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-10 h-10 text-amber-500 mb-3 animate-pulse" />
                      <p className="text-sm font-bold text-slate-200">該当する曲が見つかりませんでした。</p>
                      <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                        {activeTab === 'mylist' 
                          ? "マイリスト登録曲の中に、現在の検索語やフィルター条件に合致する曲はありません。" 
                          : `現在の検索キーワード「${searchQuery}」に合致する登録曲はありません。`}
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setGenderFilter('all');
                          setSelectedGenre('all');
                          setRangeFilter('all');
                        }}
                        className="mt-6 px-5 py-2.5 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow"
                        title="検索条件をリセットする"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>検索をリセット</span>
                      </button>
                    </>
                  )}
                </motion.div>
              ) : (
                displaySongs.map((song, index) => {
                  const isSelected = selectedSongId === song.id;
                  const isFavorite = mySingableSongs.includes(song.id);
                  
                  return (
                    <div key={song.id} className="space-y-4">
                      <SongCard
                        song={song}
                        isSelected={isSelected}
                        isFavorite={isFavorite}
                        userMin={userMin}
                        userMax={userMax}
                        simulatedKeyShift={simulatedKeyShift}
                        onSelectSong={handleSelectSong}
                        onToggleFavorite={toggleSingableSong}
                        onTriggerAudioNote={triggerAudioNote}
                        onSetKeyShift={setSimulatedKeyShift}
                      />

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
                    </div>
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

      {/* ================= 開発環境限定: Supabase接続設定用SQL ================= */}
      {isDev && (
        <div id="dev-supabase-sql-panel" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 mt-6 mb-4 animate-fade-in text-left max-w-7xl mx-auto w-full px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 pb-3 mb-4 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Database className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  🔌 開発環境限定: Supabase テーブル作成＆データ登録SQL
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">※ shared-app(本番/ステージング/ais-pre-)環境にはこのパネルは一切表示されません</p>
              </div>
            </div>
            <button
              onClick={() => {
                try {
                  navigator.clipboard.writeText(SUPABASE_SEED_SQL);
                  setSqlCopied(true);
                  showToastNotification("📋 Supabase用のテーブル作成・データ登録SQLをコピーしました！");
                  setTimeout(() => setSqlCopied(false), 4000);
                } catch (e) {
                  showToastNotification("❌ コピーに失敗しました。SQLテキストエリアから手動コピーしてください。");
                }
              }}
              className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer max-sm:w-full animate-fade-in"
            >
              <Copy className="w-3.5 h-3.5" />
              {sqlCopied ? 'コピー完了！' : 'SQLをコピー'}
            </button>
          </div>
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Supabaseをメイン管理へと移行する「ステップ1」として、現在ローカルの <code>songs.ts</code> に保存されている全楽曲データを移行しましょう。以下の2つの方法が選べます：
          </p>

          {/* Option A Block */}
          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/25 text-indigo-300 border border-indigo-500/30">
                方法 A : 最もおすすめ（ブラウザから直接一括アップロード）
              </span>
              <p className="text-xs text-slate-200 font-bold">
                最新の全ローカル楽曲 ({INITIAL_SONG_DATABASE.length}曲) をSupabaseへ直接一括エクスポート
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                接続中のSupabaseへ、テーブルの空き関係なく全曲をダイレクトにUpsert（新規作成・上書き保存）します。SQLエディタを開く必要はありません。
              </p>
            </div>
            <button
              onClick={exportLocalSongsToSupabase}
              disabled={isExporting}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 border transition-all active:scale-95 shrink-0 w-full sm:w-auto justify-center cursor-pointer ${
                isExporting
                  ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500/30 text-indigo-50 shadow-indigo-500/10 hover:shadow-indigo-500/20'
              }`}
            >
              🚀 {isExporting ? '一括アップロード中...' : 'Supabaseへ一括エクスポート'}
            </button>
          </div>

          {/* Option B Block */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
              方法 B : 手動SQLエディタ経由
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Supabase（またはPostgreSQL）の「SQL Editor」に以下のクエリを貼り付けて実行することで、「キーぴた」の楽曲テーブル <strong>public.songs</strong> の作成と、全初期データ（{INITIAL_SONG_DATABASE.length}曲）の登録をSQLエディタ経由で行うことも可能です。
            </p>
          </div>
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 max-h-[220px] overflow-y-auto font-mono text-[11px] text-slate-300 leading-normal scrollbar-thin scrollbar-thumb-slate-850 mt-2">
            <pre className="whitespace-pre-wrap">{SUPABASE_SEED_SQL}</pre>
          </div>

          {/* 管理者用ツールへのショートカットバナー */}
          <div className="mt-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/25 text-emerald-300 border border-emerald-500/30">
                ステップ 3: 本命機能（楽曲管理者用GUIツール）
              </span>
              <p className="text-xs text-slate-200 font-bold">
                ブラウザ上からGUIで直感的に楽曲を追加・編集・削除できます！
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                SQLを叩かなくても、フォーム入力で音階名（例：mid1C 〜 hiB）をセレクトするだけで、自動的に対応MIDIの音域数値（48〜71）が割り当てられ、Supabaseへダイレクトに登録・変更・削除が反映されます。
              </p>
            </div>
            <button
              onClick={handleOpenAdminPortal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/30 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 shrink-0 w-full sm:w-auto justify-center cursor-pointer"
            >
              <Shield className="w-4 h-4 text-slate-950" />
              <span>管理者ツールを起動</span>
            </button>
          </div>
        </div>
      )}

      {/* Voice Preset Selection Confirmation Modal */}
      <AnimatePresence>
        {presetToConfirm && (
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
                  onClick={() => setPresetToConfirm(null)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all hover:text-white cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => applyPreset(presetToConfirm)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-emerald-950/20 cursor-pointer"
                >
                  上書きを許可
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auto Range Switch Confirmation Modal */}
      <AnimatePresence>
        {confirmSwitchAutoRange && autoRangeDiff && (
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
                  onClick={() => {
                    setConfirmSwitchAutoRange(false);
                    setAutoRangeDiff(null);
                  }}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all hover:text-white cursor-pointer"
                >
                  手動設定のままにする
                </button>
                <button
                  onClick={() => {
                    setConfirmSwitchAutoRange(false);
                    setAutoRangeDiff(null);
                    applyAutoRangeMode();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-450 hover:to-purple-450 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-indigo-950/20 cursor-pointer"
                >
                  自動推定に切り替える
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Admin Portal Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-left"
            >
              {/* Header */}
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    管理者ポータル — 楽曲データベース管理
                  </span>
                  {dbStatus === 'connected' ? (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Supabase 接続中
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      🔴 オフライン動作（一時メモリ保存のみ）
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsAdminOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Login / Auth Check */}
              {!isAdminAuthenticated ? (
                <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="p-4 bg-emerald-500/15 rounded-2xl border border-emerald-500/20">
                    <Lock className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-base font-bold text-white">管理者認証が必要です</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      安全のため、合言葉（パスコード）を入力してロックを解除してください。
                    </p>
                  </div>
                  <form onSubmit={handleAdminLogin} className="w-full max-w-xs space-y-3">
                    <input
                      type="password"
                      placeholder="合言葉を入力"
                      value={adminPasscodeInput}
                      onChange={(e) => setAdminPasscodeInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-mono text-center"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl py-3 text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/10"
                    >
                      認証を解除
                    </button>
                    <p className="text-[10px] text-slate-505 italic">
                      ※ デモ用合言葉：<strong className="text-slate-400 font-mono">admin</strong>
                    </p>
                  </form>
                </div>
              ) : (
                <>
                  {/* Authorized Content */}
                  {adminActiveTab === 'list' ? (
                    /* SONG LIST VIEWER */
                    <div className="p-6 flex flex-col flex-1 overflow-hidden space-y-4">
                      {/* Controls Row */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            placeholder="曲名、アーティスト名で検索..."
                            value={adminSearchQuery}
                            onChange={(e) => setAdminSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {dbStatus === 'connected' && (
                            <button
                              onClick={cleanupDuplicateSongs}
                              disabled={isCleaning}
                              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50 active:scale-95"
                              title="同じ曲名・アーティスト名のデータ（重複）を自動検知し、古いレコード（IDが最も小さいもの）を残して余分なデータを安全に一括削除します。"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isCleaning ? 'クリーンアップ中...' : '重複を自動クリーンアップ'}</span>
                            </button>
                          )}
                          <button
                            onClick={handleOpenAddForm}
                            className="bg-emerald-650 hover:bg-emerald-550 text-slate-950 font-extrabold px-4 py-2 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            楽曲を追加する
                          </button>
                        </div>
                      </div>

                      {/* Warnings if offline */}
                      {dbStatus !== 'connected' && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300 leading-relaxed">
                          ⚠️ <strong>オフライン動作中</strong>: Supabase環境変数が設定されていないため、追加・削除・変更はメモリへの一時適用になります。リロードすると全16曲に戻ります。本番保存にはSupabaseの有効化が必要です。
                        </div>
                      )}

                      {/* 📈 データベースの健康診断 & 改善アドバイザー (Enrichment Advisor) */}
                      {databaseStats && (
                        <div className="bg-slate-950/65 border border-indigo-500/15 rounded-xl p-4 transition-all">
                          <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsAdvisorOpen(!isAdvisorOpen)}>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              <span className="font-bold text-xs text-white">
                                📊 データベース充実度・健康診断スコア: 
                                <span className={`ml-1.5 px-2 py-0.5 rounded-full font-mono ${
                                  databaseStats.score >= 90 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  databaseStats.score >= 70 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {databaseStats.score} / 100 点
                                </span>
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-bold">
                              {isAdvisorOpen ? 'アドバイスを閉じる ▲' : 'アドバイスを開く ▼'}
                            </span>
                          </div>

                          {isAdvisorOpen && (
                            <div className="mt-3 pt-3 border-t border-slate-800 space-y-3.5 text-[11px]">
                              {/* 統計ミニグリッド */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-850">
                                  <div className="text-[10px] text-slate-500 font-bold uppercase">総登録曲数</div>
                                  <div className="text-xs font-extrabold text-slate-200 font-mono mt-0.5">{databaseStats.total} 曲</div>
                                </div>
                                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-850">
                                  <div className="text-[10px] text-slate-500 font-bold uppercase">登録アーティスト数</div>
                                  <div className="text-xs font-extrabold text-slate-200 font-mono mt-0.5">{databaseStats.totalArtists} 組</div>
                                </div>
                                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-850">
                                  <div className="text-[10px] text-slate-500 font-bold uppercase">男女比率</div>
                                  <div className="text-xs font-extrabold text-slate-200 mt-0.5">
                                    <span className="text-sky-400">男: {databaseStats.maleRatio.toFixed(0)}%</span>
                                    <span className="text-slate-600 mx-1">/</span>
                                    <span className="text-rose-400">女: {databaseStats.femaleRatio.toFixed(0)}%</span>
                                  </div>
                                </div>
                                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-850">
                                  <div className="text-[10px] text-slate-500 font-bold uppercase">最新トレンドカバー</div>
                                  <div className="text-xs font-extrabold text-slate-200 mt-0.5 flex items-center gap-1">
                                    {databaseStats.hasTuki && databaseStats.hasKento ? (
                                      <span className="text-emerald-400 font-extrabold">網羅完了 (極めて良好)</span>
                                    ) : (
                                      <span className="text-amber-400">tuki., こっちのけんと未登録</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 比率グラフィックバー */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5">
                                  <span>男性歌手の曲 ({databaseStats.maleRatio.toFixed(0)}%)</span>
                                  <span>女性歌手の曲 ({databaseStats.femaleRatio.toFixed(0)}%)</span>
                                </div>
                                <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden flex">
                                  <div style={{ width: `${databaseStats.maleRatio}%` }} className="bg-sky-500 h-full" />
                                  <div style={{ width: `${databaseStats.unisexRatio}%` }} className="bg-emerald-400 h-full" />
                                  <div style={{ width: `${databaseStats.femaleRatio}%` }} className="bg-rose-500 h-full" />
                                </div>
                              </div>

                              {/* 改善アドバイス提案リスト */}
                              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                                <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>AI楽曲データ充実化アドバイス</span>
                                </div>
                                {databaseStats.recommendations.length > 0 ? (
                                  <ul className="space-y-2 text-slate-300">
                                    {databaseStats.recommendations.map((rec, i) => (
                                      <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                                        <span className="text-indigo-400 select-none font-bold mt-0.5">•</span>
                                        <span>{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="text-emerald-400 font-bold flex items-center gap-1.5 py-1.5 bg-emerald-500/5 px-2.5 rounded-lg border border-emerald-500/10">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span>パーフェクト！最新の人気アーティスト(tuki., こっちのけんと等)をカバーし、音域バランスも極めて優れています。素晴らしい充実度です。</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Song List Scroll View */}
                      <div className="flex-1 overflow-y-auto border border-slate-850 rounded-xl bg-slate-950/40">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 font-semibold">
                              <th className="p-3">ID</th>
                              <th className="p-3">曲名 / アーティスト</th>
                              <th className="p-3">想定音域</th>
                              <th className="p-3">性別 / 原曲キー</th>
                              <th className="p-3 text-right">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {songs
                              .filter(s => {
                                const q = adminSearchQuery.toLowerCase().trim();
                                if (!q) return true;
                                return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
                              })
                              .map(song => (
                                <tr key={song.id} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                                  <td className="p-3 font-mono text-[10px] text-slate-500">{song.id}</td>
                                  <td className="p-3">
                                    <div className="font-bold text-slate-200">{song.title}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{song.artist}</div>
                                  </td>
                                  <td className="p-3 font-mono">
                                    <span className="text-emerald-400 font-semibold">{formatPitch(song.min).raw}</span>
                                    <span className="text-slate-500 mx-1">〜</span>
                                    <span className="text-emerald-400 font-semibold">{formatPitch(song.max).raw}</span>
                                    <div className="text-[9px] text-slate-400 mt-0.5">
                                      ({NOTE_BASE_NAMES_JP[song.min % 12]} から {NOTE_BASE_NAMES_JP[song.max % 12]})
                                    </div>
                                  </td>
                                  <td className="p-3 space-y-1">
                                    <div>
                                      {song.gender === 'male' && <span className="text-[9px] bg-sky-500/10 border border-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-extrabold font-sans">男性向け</span>}
                                      {song.gender === 'female' && <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-extrabold font-sans">女性向け</span>}
                                      {song.gender === 'unisex' && <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-extrabold font-sans">男女両用</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-400">{song.originalKey}</div>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditForm(song)}
                                        className="p-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                      >
                                        <Edit className="w-3 h-3" />
                                        <span>編集</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAdminSong(song.id, song.title)}
                                        className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>削除</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            }
                            {songs.filter(s => {
                              const q = adminSearchQuery.toLowerCase().trim();
                              if (!q) return true;
                              return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
                            }).length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                  検索に合致する楽曲が見つかりませんでした。
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer bar */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>全: {songs.length} 曲 登録中</span>
                        <button
                          type="button"
                          onClick={() => setIsAdminAuthenticated(false)}
                          className="text-slate-500 hover:text-rose-400 transition-all font-semibold cursor-pointer"
                        >
                          🔐 セッションをロック
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ADD / EDIT FORM */
                    <form onSubmit={handleSaveAdminForm} className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                          {editingSongId ? (
                            <>
                              <Edit className="w-4 h-4 text-indigo-400" />
                              <span>楽曲情報の編集・更新 (ID: {editingSongId})</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 text-emerald-400" />
                              <span>新規楽曲の追加</span>
                            </>
                          )}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setAdminActiveTab('list')}
                          className="text-slate-400 hover:text-white font-semibold flex items-center gap-1"
                        >
                          ← リストに戻る
                        </button>
                      </div>

                      {/* Main Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div className="space-y-1">
                          <label className="text-slate-450 font-semibold block">曲名 <span className="text-rose-400">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="例: 怪獣の花唄"
                            value={adminForm.title}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Artist */}
                        <div className="space-y-1">
                          <label className="text-slate-450 font-semibold block">アーティスト名 <span className="text-rose-400">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="例: Vaundy"
                            value={adminForm.artist}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, artist: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-655 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Gender */}
                        <div className="space-y-1">
                          <label className="text-slate-450 font-semibold block">想定歌唱適性（目安性別）</label>
                          <select
                            value={adminForm.gender}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, gender: e.target.value as any }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="male">男性向け (通常〜ハイトーン)</option>
                            <option value="female">女性向け (通常〜低音)</option>
                            <option value="unisex">男女両向け (中性音域)</option>
                          </select>
                        </div>

                        {/* Original Key */}
                        <div className="space-y-1">
                          <label className="text-slate-455 font-semibold block">原曲キー表記</label>
                          <input
                            type="text"
                            placeholder="例: D#メジャー"
                            value={adminForm.originalKey}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, originalKey: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-660 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Genre */}
                        <div className="space-y-1">
                          <label className="text-slate-455 font-semibold block">ジャンル</label>
                          <input
                            type="text"
                            placeholder="例: J-POP, ロック, バラード, アニソン"
                            value={adminForm.genre}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, genre: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-660 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Tags */}
                        <div className="space-y-1">
                          <label className="text-slate-455 font-semibold block">タグ （カンマ区切り）</label>
                          <input
                            type="text"
                            placeholder="例: フェス定番, ハイテンション, 盛り上がる"
                            value={adminForm.tags}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, tags: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-660 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Pitch Helper Pitch Select Control (min, max selection) */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4 text-left">
                        <h5 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                          <span>音域の決定・補佐設定 (45 〜 84のMIDIピッチ番号に対応)</span>
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* MIN PITCH SELECT */}
                          <div className="space-y-1 text-left">
                            <label className="text-slate-400 font-medium block">
                              ① 曲の最低音 (min): <strong className="text-emerald-400 font-mono ml-1">{formatPitch(adminForm.min).raw}</strong>
                            </label>
                            <select
                              value={adminForm.min}
                              onChange={(e) => setAdminForm(prev => ({ ...prev, min: Number(e.target.value) }))}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                            >
                              {Array.from({ length: 49 }, (_, i) => 36 + i).map(p => (
                                <option key={p} value={p}>
                                  {formatPitch(p).full}
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] text-slate-400 leading-normal block">
                              和音階名: <strong>{NOTE_BASE_NAMES_JP[adminForm.min % 12]}</strong> (MIDI番号:{adminForm.min})
                            </span>
                          </div>

                          {/* MAX PITCH SELECT */}
                          <div className="space-y-1 text-left">
                            <label className="text-slate-400 font-medium block">
                              ② 曲の最高音 (max): <strong className="text-emerald-400 font-mono ml-1">{formatPitch(adminForm.max).raw}</strong>
                            </label>
                            <select
                              value={adminForm.max}
                              onChange={(e) => setAdminForm(prev => ({ ...prev, max: Number(e.target.value) }))}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                            >
                              {Array.from({ length: 49 }, (_, i) => 36 + i).map(p => (
                                <option key={p} value={p}>
                                  {formatPitch(p).full}
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] text-slate-400 leading-normal block">
                              和音階名: <strong>{NOTE_BASE_NAMES_JP[adminForm.max % 12]}</strong> (MIDI番号:{adminForm.max})
                            </span>
                          </div>
                        </div>

                        {/* Helper range visualizer bar */}
                        {adminForm.min > adminForm.max && (
                          <p className="text-[10px] text-rose-400 font-bold block bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                            ⚠️ 注意: 最低音が、最高音よりも高くなっています。正しい範囲に設定してください。
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <div className="space-y-1 text-left">
                        <label className="text-slate-400 font-semibold block">楽曲についての簡潔な解説・アドバイス</label>
                        <textarea
                          rows={3}
                          placeholder="例: サビにかけてエモーショナルに歌い上げる高音パートが多い難曲です。"
                          value={adminForm.description}
                          onChange={(e) => setAdminForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-655 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                        />
                      </div>

                      {/* Operation Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-850">
                        <button
                          type="button"
                          onClick={() => setAdminActiveTab('list')}
                          className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all hover:text-white cursor-pointer"
                        >
                          キャンセル
                        </button>
                        <button
                          type="submit"
                          disabled={adminForm.min > adminForm.max}
                          className={`px-5 py-2 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-lg cursor-pointer ${
                            adminForm.min > adminForm.max
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-500/10'
                          }`}
                        >
                          {editingSongId ? '更新を適用する' : '新規楽曲を保存'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 カラオケ音域検索 (KiraRange) - Phase 1 Prototype. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenAdminPortal}
              className="hover:text-emerald-400 font-extrabold text-slate-400 flex items-center gap-1 hover:scale-105 transition-all cursor-pointer border border-slate-800 bg-slate-900/40 text-[10px] sm:text-xs rounded-lg px-2 py-1"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>管理者ツール</span>
            </button>
            <span className="hover:text-slate-455">データベース: 10選</span>
            <span className="hover:text-slate-455">Web Audio API 合成</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
