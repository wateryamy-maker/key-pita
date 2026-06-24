import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Song } from '../types';
import { INITIAL_SONG_DATABASE } from '../data/songs';
import { formatPitch } from '../utils/pitch';

// Setup Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URI || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
        
        let allData: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error: fetchErr } = await supabase
            .from('songs')
            .select('*')
            .order('id', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (fetchErr) {
            throw fetchErr;
          }

          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        if (allData.length > 0) {
          const mappedSongs: Song[] = allData.map((row: any) => ({
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

  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  const cleanupDuplicateSongs = async () => {
    if (!supabase) {
      onToast("⚠️ Supabaseとの接続がありません。");
      return;
    }
    try {
      setIsCleaning(true);
      onToast("🔍 重複している楽曲をスキャン中...");

      // Supabaseのデフォルト1000件制限を回避するため、全データをページネーション（range）で取得する
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: pageData, error: fetchErr } = await supabase
          .from('songs')
          .select('id, title, artist')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (fetchErr) throw fetchErr;

        if (pageData && pageData.length > 0) {
          allData = [...allData, ...pageData];
          if (pageData.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      if (allData.length === 0) {
        onToast("ℹ️ 楽曲データがありません。");
        return;
      }

      console.log(`[DEBUG_CLEANUP] Total items fetched from DB (all pages): ${allData.length}`);
      onToast(`🔍 DBから全${allData.length}件の楽曲を取得しました。重複スキャン中...`);

      // 高度な文字列正規化処理（半角/全角、大文字/小文字、全角半角スペースおよび不可視文字の完全除去、ひらがな・カタカナの統一、括弧やその中身の除去）
      const normalizeString = (text: string, isTitle: boolean = false): string => {
        if (!text) return '';
        let res = text.toString().normalize('NFKC'); // 全角英数を半角に、半角カタカナを全角カタカナに

        if (isTitle) {
          // 半角・全角の丸括弧・角括弧・波括弧・隅付き括弧・鍵括弧とその中身を完全に除去（例: (Original), (English Ver), 【MV】 などを除去）
          res = res
            .replace(/\([^)]*\)/g, '')
            .replace(/（[^）]*）/g, '')
            .replace(/\[[^\]]*\]/g, '')
            .replace(/［[^］]*］/g, '')
            .replace(/\{[^}]*\}/g, '')
            .replace(/｛[^｝]*｝/g, '')
            .replace(/【[^】]*】/g, '')
            .replace(/「[^」]*」/g, '')
            .replace(/『[^』]*』/g, '');
        }

        res = res
          .replace(/[\s　\u200B-\u200D\uFEFF]+/g, '') // すべての半角・全角スペースや不可視の制御文字を完全に除去
          .toLowerCase(); // 大文字・小文字を統一

        // ひらがなをすべてカタカナに変換して表記の揺れを統一
        res = res.replace(/[\u3041-\u3096]/g, m => String.fromCharCode(m.charCodeAt(0) + 0x60));
        return res;
      };

      const groups: { [key: string]: any[] } = {};
      allData.forEach(song => {
        const titleNorm = normalizeString(song.title, true); // 曲名は括弧除去を有効にする
        const artistNorm = normalizeString(song.artist, false);
        const key = `${titleNorm}|||${artistNorm}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(song);
      });

      console.log("[DEBUG_CLEANUP] Groups keys:", Object.keys(groups));

      const idsToDelete: any[] = [];
      let duplicateCount = 0;
      const detectedDuplicatesInfo: string[] = [];

      Object.entries(groups).forEach(([key, list]) => {
        if (list.length > 1) {
          detectedDuplicatesInfo.push(`「${list[0].title} / ${list[0].artist}」(${list.length}件)`);
          const sorted = [...list].sort((a, b) => {
            const idA = parseInt(a.id, 10);
            const idB = parseInt(b.id, 10);
            const isNumA = !isNaN(idA);
            const isNumB = !isNaN(idB);
            
            if (isNumA && isNumB) {
              return idA - idB;
            }
            if (isNumA && !isNumB) return -1; // 数値ID（手動登録/古いデータ）を優先して残す
            if (!isNumA && isNumB) return 1;
            return String(a.id).localeCompare(String(b.id));
          });

          const toDelete = sorted.slice(1);
          toDelete.forEach(song => {
            idsToDelete.push(song.id); // 原型のIDをそのまま格納（数値または文字列のミスマッチを防止）
          });
          duplicateCount += toDelete.length;
        }
      });

      console.log("[DEBUG_CLEANUP] Duplicates detected:", detectedDuplicatesInfo);
      console.log("[DEBUG_CLEANUP] IDs to delete:", idsToDelete);

      if (idsToDelete.length === 0) {
        // デバッグを助けるために、上位5つのグループを表示
        const sampleGroups = Object.entries(groups)
          .slice(0, 5)
          .map(([k, list]) => `${k} (${list.length}件)`)
          .join(', ');
        onToast(`✨ 重複は見つかりませんでした！(全${allData.length}件, サンプルグループ: ${sampleGroups || 'なし'})`);
        return;
      }

      onToast(`🗑️ ${duplicateCount}件の重複レコードをクリーンアップ中...`);

      let deletedCount = 0;
      const failedIds: string[] = [];

      // 10件ずつのチャンクにして一括削除を実行し、失敗した場合は1件ずつ個別にフォールバック削除する
      const chunkSize = 10;
      for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        const chunk = idsToDelete.slice(i, i + chunkSize);
        try {
          const { error: deleteErr, count } = await supabase
            .from('songs')
            .delete({ count: 'exact' })
            .in('id', chunk);

          if (deleteErr) {
            console.warn(`Chunk delete failed, falling back to individual deletion for chunk:`, chunk, deleteErr);
            for (const id of chunk) {
              const { error: singleErr } = await supabase
                .from('songs')
                .delete()
                .eq('id', id);
              if (singleErr) {
                console.error(`Failed to delete individual ID ${id}:`, singleErr);
                failedIds.push(id.toString());
              } else {
                deletedCount++;
              }
            }
          } else {
            deletedCount += (count !== null ? count : chunk.length);
          }
        } catch (chunkErr) {
          console.error("Chunk delete operation failed, trying individual fallback:", chunkErr);
          for (const id of chunk) {
            try {
              const { error: singleErr } = await supabase
                .from('songs')
                .delete()
                .eq('id', id);
              if (singleErr) {
                failedIds.push(id.toString());
              } else {
                deletedCount++;
              }
            } catch (err) {
              failedIds.push(id.toString());
            }
          }
        }
      }

      if (deletedCount === 0 && idsToDelete.length > 0) {
        onToast(`⚠️ 重複を ${idsToDelete.length}件検知しましたが、1件も削除できませんでした。Supabaseの行レベルセキュリティ(RLS)ポリシー等で削除権限があるかご確認ください。`);
        return;
      }

      const { data: updatedData, error: refetchErr } = await supabase
        .from('songs')
        .select('*')
        .order('id', { ascending: true });

      if (refetchErr) throw refetchErr;

      if (updatedData) {
        const mappedSongs: Song[] = updatedData.map((row: any) => ({
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
      }

      if (failedIds.length > 0) {
        onToast(`✨ クリーンアップ完了: 重複データ ${deletedCount}件を削除しました。（失敗: ${failedIds.length}件）`);
      } else {
        onToast(`✨ クリーンアップ成功！重複データ ${deletedCount}件をすべて削除しました。`);
      }
    } catch (err: any) {
      console.error("Cleanup duplicates failed:", err);
      onToast(`❌ クリーンアップに失敗しました: ${err.message || '接続エラー'}`);
    } finally {
      setIsCleaning(false);
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
    isCleaning,
    cleanupDuplicateSongs,
  };
}
