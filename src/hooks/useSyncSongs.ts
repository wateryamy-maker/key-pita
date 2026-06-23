import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Song } from '../types';
import { INITIAL_SONG_DATABASE } from '../data/songs';
import { formatPitch } from '../utils/pitch';

// Setup Supabase
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.VITE_SUPABASE_URI || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : '') || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : '') || '';

const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface UseSyncSongsOptions {
  rangeMode: 'auto' | 'manual';
  setUserMin: (v: number) => void;
  setUserMax: (v: number) => void;
  onDiagnosisComplete: (message: string) => void;
  onToast: (message: string) => void;
}

export function useSyncSongs(options: UseSyncSongsOptions) {
  const { rangeMode, setUserMin, setUserMax, onDiagnosisComplete, onToast } = options;
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'local' | 'loading' | 'connected' | 'error'>('local');
  const [dbError, setDbError] = useState<string | null>(null);

  // My Singable Songs List
  const [mySingableSongs, setMySingableSongs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('my_singable_songs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const onToastRef = useRef(onToast);
  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  // Fetch Songs on Mount
  useEffect(() => {
    async function fetchSongs() {
      if (!supabase) {
        setDbStatus('local');
        const loadTimer = setTimeout(() => {
          setSongs(INITIAL_SONG_DATABASE);
          setIsLoading(false);
        }, 650);
        return;
      }

      try {
        setDbStatus('loading');
        const { data, error: fetchErr } = await supabase
          .from('songs')
          .select('*')
          .order('id', { ascending: true });

        if (fetchErr) {
          throw fetchErr;
        }

        if (data && data.length > 0) {
          const mappedSongs: Song[] = data.map((row: any) => ({
            id: row.id.toString(),
            title: row.title,
            artist: row.artist,
            min: Number(row.min),
            max: Number(row.max),
            gender: row.gender,
            originalKey: row.original_key || row.originalKey || '',
            genre: row.genre || 'J-POP',
            tags: Array.isArray(row.tags) ? row.tags : [],
            description: row.description || '',
          }));
          setSongs(mappedSongs);
          setDbStatus('connected');
        } else {
          setSongs(INITIAL_SONG_DATABASE);
          setDbStatus('connected');
          onToastRef.current("ℹ️ Supabase上のデータが空のため、ローカル演奏用初期データをロードしました。");
        }
      } catch (err: any) {
        console.error("Supabase fetch failed:", err);
        setDbStatus('error');
        setDbError(err.message || '接続エラー');
        setSongs(INITIAL_SONG_DATABASE);
        onToastRef.current("⚠️ Supabase接続エラー。ローカルデータで動作します。");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSongs();
  }, []);

  // Toggle Song from My List
  const toggleSingableSong = (songId: string) => {
    let nextList: string[];
    let message = "";
    if (mySingableSongs.includes(songId)) {
      nextList = mySingableSongs.filter(id => id !== songId);
      message = "マイリストから解除しました";
    } else {
      nextList = [...mySingableSongs, songId];
      message = "歌える曲としてマイリストに登録しました！";
    }
    setMySingableSongs(nextList);
    try {
      localStorage.setItem('my_singable_songs', JSON.stringify(nextList));
    } catch (e) {
      console.warn("localStorage sync blocked:", e);
    }

    // Auto-calculates from all registered songs in mySingableSongs
    const registeredSongs = songs.filter(s => nextList.includes(s.id));
    if (registeredSongs.length > 0) {
      const mins = registeredSongs.map(s => s.min);
      const maxs = registeredSongs.map(s => s.max);
      const newMin = Math.min(...mins);
      const newMax = Math.max(...maxs);

      if (rangeMode === 'auto') {
        setUserMin(newMin);
        setUserMax(newMax);
        onDiagnosisComplete(`🎤 登録曲から推定音域 (${formatPitch(newMin).raw} 〜 ${formatPitch(newMax).raw}) を自動設定しました！`);
      } else {
        onToast(`${message}（手動設定モードのため、推定音域は上書きされません）`);
      }
    } else {
      onToast(message);
    }
  };

  const [isExporting, setIsExporting] = useState<boolean>(false);

  const exportLocalSongsToSupabase = async () => {
    if (!supabase) {
      onToast("⚠️ Supabaseの接続情報（環境変数）が設定されていません。");
      return;
    }

    try {
      setIsExporting(true);
      onToast("🚀 ローカルの全楽曲データをSupabaseに一括アップロードしています...");

      const payload = INITIAL_SONG_DATABASE.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        min: song.min,
        max: song.max,
        gender: song.gender,
        original_key: song.originalKey,
        genre: song.genre,
        tags: song.tags,
        description: song.description
      }));

      // Upsert songs into Supabase table
      const { error: upsertErr } = await supabase
        .from('songs')
        .upsert(payload, { onConflict: 'id' });

      if (upsertErr) {
        throw upsertErr;
      }

      // Re-fetch to update state
      const { data, error: fetchErr } = await supabase
        .from('songs')
        .select('*')
        .order('id', { ascending: true });

      if (fetchErr) {
        throw fetchErr;
      }

      if (data && data.length > 0) {
        const mappedSongs: Song[] = data.map((row: any) => ({
          id: row.id.toString(),
          title: row.title,
          artist: row.artist,
          min: Number(row.min),
          max: Number(row.max),
          gender: row.gender,
          originalKey: row.original_key || row.originalKey || '',
          genre: row.genre || 'J-POP',
          tags: Array.isArray(row.tags) ? row.tags : [],
          description: row.description || '',
        }));
        setSongs(mappedSongs);
        setDbStatus('connected');
      }

      onToast(`✨ ${payload.length}曲の一括エクスポート同期が成功しました！`);
    } catch (err: any) {
      console.error("Supabase export failed:", err);
      onToast(`❌ エクスポートに失敗しました: ${err.message || '接続エラー'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const deleteSong = async (songId: string): Promise<boolean> => {
    if (!supabase) {
      onToast("⚠️ Supabaseとの接続がありません。");
      return false;
    }
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) throw error;

      setSongs(prev => prev.filter(s => s.id !== songId));
      onToast("🗑️ 楽曲を削除しました。");
      return true;
    } catch (err: any) {
      console.error("Delete song failed:", err);
      onToast(`❌ 削除に失敗しました: ${err.message || '接続エラー'}`);
      return false;
    }
  };

  const addSong = async (newSong: Omit<Song, 'id'>): Promise<boolean> => {
    if (!supabase) {
      onToast("⚠️ Supabaseとの接続がありません。");
      return false;
    }
    try {
      const numericIds = songs.map(s => parseInt(s.id, 10)).filter(id => !isNaN(id));
      const nextId = numericIds.length > 0 ? (Math.max(...numericIds) + 1).toString() : Date.now().toString();

      const payload = {
        id: nextId,
        title: newSong.title,
        artist: newSong.artist,
        min: newSong.min,
        max: newSong.max,
        gender: newSong.gender,
        original_key: newSong.originalKey,
        genre: newSong.genre,
        tags: newSong.tags,
        description: newSong.description
      };

      const { error } = await supabase
        .from('songs')
        .insert([payload]);

      if (error) throw error;

      const fullNewSong: Song = {
        id: nextId,
        ...newSong
      };

      setSongs(prev => [...prev, fullNewSong]);
      onToast("✨ 楽曲を追加しました！");
      return true;
    } catch (err: any) {
      console.error("Add song failed:", err);
      onToast(`❌ 追加に失敗しました: ${err.message || '接続エラー'}`);
      return false;
    }
  };

  const updateSong = async (songId: string, updatedSongData: Partial<Song>): Promise<boolean> => {
    if (!supabase) {
      onToast("⚠️ Supabaseとの接続がありません。");
      return false;
    }
    try {
      const payload: any = {};
      if (updatedSongData.title !== undefined) payload.title = updatedSongData.title;
      if (updatedSongData.artist !== undefined) payload.artist = updatedSongData.artist;
      if (updatedSongData.min !== undefined) payload.min = updatedSongData.min;
      if (updatedSongData.max !== undefined) payload.max = updatedSongData.max;
      if (updatedSongData.gender !== undefined) payload.gender = updatedSongData.gender;
      if (updatedSongData.originalKey !== undefined) payload.original_key = updatedSongData.originalKey;
      if (updatedSongData.genre !== undefined) payload.genre = updatedSongData.genre;
      if (updatedSongData.tags !== undefined) payload.tags = updatedSongData.tags;
      if (updatedSongData.description !== undefined) payload.description = updatedSongData.description;

      const { error } = await supabase
        .from('songs')
        .update(payload)
        .eq('id', songId);

      if (error) throw error;

      setSongs(prev => prev.map(s => s.id === songId ? { ...s, ...updatedSongData } : s));
      onToast("✏️ 楽曲情報を更新しました！");
      return true;
    } catch (err: any) {
      console.error("Update song failed:", err);
      onToast(`❌ 更新に失敗しました: ${err.message || '接続エラー'}`);
      return false;
    }
  };

  return {
    songs,
    setSongs, // Expose setter just in case
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
  };
}
