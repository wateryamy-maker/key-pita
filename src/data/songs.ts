import { Song, VoicePreset } from '../types';

export const INITIAL_SONG_DATABASE: Song[] = [
  {
    id: '1',
    title: 'マリーゴールド',
    artist: 'あいみょん',
    min: 55, // mid1G
    max: 74, // hiD
    gender: 'female',
    originalKey: 'Gメジャー',
    genre: 'J-POP',
    tags: ['定番曲', '歌いやすい', 'カラオケ大人気'],
    description: '女性の標準的〜やや高音寄りな爽やかなナンバー。一定の息づかいで気持ちよく歌い通せます。',
  },
  {
    id: '2',
    title: 'Lemon',
    artist: '米津星師',
    min: 48, // mid1C
    max: 71, // mid2B
    gender: 'male',
    originalKey: 'Abマイナー',
    genre: 'J-POP',
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
    genre: 'J-POP',
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
    genre: 'アニソン',
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
    genre: 'J-POP',
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
    genre: 'バラード',
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
    genre: 'ロック',
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
    genre: 'J-POP',
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
    genre: 'J-POP',
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
    genre: 'バラード',
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
    genre: 'ロック',
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
    genre: 'ロック',
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
    genre: 'アニソン',
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
    genre: 'アニソン',
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
    genre: 'バラード',
    tags: ['涙腺崩壊バラード', '美メロ', 'ロングセラー'],
    description: 'サビ前の溜めと、最高音mid2Bの美しいロングトーンが見見場の感動的ラブソング。',
  },
  {
    id: '16',
    title: 'カブトムシ',
    artist: 'aiko',
    min: 50, // mid1D
    max: 75, // hiD#
    gender: 'female',
    originalKey: 'Abメジャー',
    genre: 'バラード',
    tags: ['冬のラブソング', '切ない高音', '裏声使い'],
    description: '地声からすっとファルセット（裏声）に切り替わる独特のaikoライン。サビの最高音に魅力が凝縮。'
  }
];

export function generateSupabaseSeedSql(songs: Song[]): string {
  const tablePart = `-- ① public.songs テーブルの作成
CREATE TABLE IF NOT EXISTS public.songs (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  min INTEGER NOT NULL,
  max INTEGER NOT NULL,
  gender VARCHAR(20) NOT NULL,
  original_key VARCHAR(50) NOT NULL,
  genre VARCHAR(50) NOT NULL,
  tags TEXT[] NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS（行セキュリティ）を無効化し、クライアント（anon）からの直接一括エクスポート・書き込みを可能にします
ALTER TABLE public.songs DISABLE ROW LEVEL SECURITY;

-- ② 初期データの登録 (${songs.length}曲)
INSERT INTO public.songs (id, title, artist, min, max, gender, original_key, genre, tags, description)
VALUES`;

  const valuesPart = songs.map(song => {
    const escape = (str: string) => str.replace(/'/g, "''");
    const tagsSql = `ARRAY[${song.tags.map(t => `'${escape(t)}'`).join(', ')}]`;
    
    return `\n('${escape(song.id)}', '${escape(song.title)}', '${escape(song.artist)}', ${song.min}, ${song.max}, '${escape(song.gender)}', '${escape(song.originalKey)}', '${escape(song.genre)}', ${tagsSql}, '${escape(song.description)}')`;
  }).join(',');

  const conflictPart = `\nON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  artist = EXCLUDED.artist,
  min = EXCLUDED.min,
  max = EXCLUDED.max,
  gender = EXCLUDED.gender,
  original_key = EXCLUDED.original_key,
  genre = EXCLUDED.genre,
  tags = EXCLUDED.tags,
  description = EXCLUDED.description;`;

  return `${tablePart}${valuesPart}${conflictPart}`;
}

export const SUPABASE_SEED_SQL = generateSupabaseSeedSql(INITIAL_SONG_DATABASE);

export const VOICE_PRESETS: VoicePreset[] = [
  { name: '一般男性 (平均的)', min: 48, max: 67, desc: 'mid1C (低) 〜 mid2G (高)' },
  { name: '高音男性 (ハイトーン向け)', min: 50, max: 71, desc: 'mid1D (低) 〜 mid2B (高)' },
  { name: '一般女性 (平均的)', min: 55, max: 74, desc: 'mid1G (低) 〜 hiD (高)' },
  { name: '低音女性 (低めが得意)', min: 52, max: 69, desc: 'mid1E (低) 〜 hiA (高)' }
];

export const NOTE_BASE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const NOTE_BASE_NAMES_JP = ["ド", "ド#", "レ", "レ#", "ミ", "ファ", "ファ#", "ソ", "ソ#", "ラ", "ラ#", "シ"];
