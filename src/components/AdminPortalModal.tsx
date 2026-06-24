import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, X, Lock, Search, Trash2, Plus, Sparkles, Info, Check, Edit, Sliders } from 'lucide-react';
import { Song } from '../types';
import { NOTE_BASE_NAMES_JP } from '../data/songs';
import { formatPitch } from '../utils/pitch';

export interface AdminFormState {
  title: string;
  artist: string;
  min: number;
  max: number;
  gender: 'male' | 'female' | 'unisex';
  originalKey: string;
  genre: string;
  tags: string;
  description: string;
}

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: string;
  isAdminAuthenticated: boolean;
  adminPasscodeInput: string;
  onPasscodeChange: (value: string) => void;
  onLogin: (e: React.FormEvent) => void;
  adminActiveTab: 'list' | 'form';
  onActiveTabChange: (tab: 'list' | 'form') => void;
  adminSearchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onCleanupDuplicates: () => void;
  isCleaning: boolean;
  onOpenAddForm: () => void;
  databaseStats: any;
  isAdvisorOpen: boolean;
  onToggleAdvisor: () => void;
  songs: Song[];
  onOpenEditForm: (song: Song) => void;
  onDeleteSong: (id: string, title: string) => void;
  onSaveForm: (e: React.FormEvent) => void;
  editingSongId: string | null;
  adminForm: AdminFormState;
  onFormChange: (update: Partial<AdminFormState> | ((prev: AdminFormState) => AdminFormState)) => void;
  onLogout: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  isAdminAuthenticated,
  adminPasscodeInput,
  onPasscodeChange,
  onLogin,
  adminActiveTab,
  onActiveTabChange,
  adminSearchQuery,
  onSearchQueryChange,
  onCleanupDuplicates,
  isCleaning,
  onOpenAddForm,
  databaseStats,
  isAdvisorOpen,
  onToggleAdvisor,
  songs,
  onOpenEditForm,
  onDeleteSong,
  onSaveForm,
  editingSongId,
  adminForm,
  onFormChange,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
            <form onSubmit={onLogin} className="w-full max-w-xs space-y-3">
              <input
                type="password"
                placeholder="合言葉を入力"
                value={adminPasscodeInput}
                onChange={(e) => onPasscodeChange(e.target.value)}
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
                      onChange={(e) => onSearchQueryChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {dbStatus === 'connected' && (
                      <button
                        onClick={onCleanupDuplicates}
                        disabled={isCleaning}
                        className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50 active:scale-95"
                        title="同じ曲名・アーティスト名のデータ（重複）を自動検知し、古いレコード（IDが最も小さいもの）を残して余分なデータを安全に一括削除します。"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isCleaning ? 'クリーンアップ中...' : '重複を自動クリーンアップ'}</span>
                      </button>
                    )}
                    <button
                      onClick={onOpenAddForm}
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
                    <div className="flex items-center justify-between cursor-pointer select-none" onClick={onToggleAdvisor}>
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
                              {databaseStats.recommendations.map((rec: string, i: number) => (
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
                                  onClick={() => onOpenEditForm(song)}
                                  className="p-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>編集</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteSong(song.id, song.title)}
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
                    onClick={onLogout}
                    className="text-slate-500 hover:text-rose-400 transition-all font-semibold cursor-pointer"
                  >
                    🔐 セッションをロック
                  </button>
                </div>
              </div>
            ) : (
              /* ADD / EDIT FORM */
              <form onSubmit={onSaveForm} className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
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
                    onClick={() => onActiveTabChange('list')}
                    className="text-slate-400 hover:text-white font-semibold flex items-center gap-1"
                  >
                    ← リストに戻る
                  </button>
                </div>

                {/* Main Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-slate-455 font-semibold block">曲名 <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="例: 怪獣の花唄"
                      value={adminForm.title}
                      onChange={(e) => onFormChange({ title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Artist */}
                  <div className="space-y-1">
                    <label className="text-slate-455 font-semibold block">アーティスト名 <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="例: Vaundy"
                      value={adminForm.artist}
                      onChange={(e) => onFormChange({ artist: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-655 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-slate-455 font-semibold block">想定歌唱適性（目安性別）</label>
                    <select
                      value={adminForm.gender}
                      onChange={(e) => onFormChange({ gender: e.target.value as any })}
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
                      onChange={(e) => onFormChange({ originalKey: e.target.value })}
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
                      onChange={(e) => onFormChange({ genre: e.target.value })}
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
                      onChange={(e) => onFormChange({ tags: e.target.value })}
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
                        onChange={(e) => onFormChange({ min: Number(e.target.value) })}
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
                        onChange={(e) => onFormChange({ max: Number(e.target.value) })}
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
                    onChange={(e) => onFormChange({ description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-655 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Operation Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => onActiveTabChange('list')}
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
  );
};
