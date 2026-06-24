import fs from 'fs';

interface SongRow {
  id: string;
  title: string;
  artist: string;
  min: number;
  max: number;
  gender: string;
  original_key: string;
  genre: string;
  tags: string[];
  description: string;
}

const songs: SongRow[] = JSON.parse(fs.readFileSync('./all_songs.json', 'utf8'));

console.log(`Loaded ${songs.length} songs for heuristic analysis.`);

const suspiciousList: SongRow[] = [];

// Heuristics:
// 1. Description is extremely short (1 or 2 characters) AND title is simple (like "風", "空", "愛", "夢", "新月" etc.).
// 2. Title contains placeholder words like "未公開", "未発表", "テスト", "サンプル", "ダミー", "メドレー", "ファースト・テイク", "test", "dummy", "demo".
// 3. Songs where ID indicates high range and descriptions are extremely basic or empty.
// 4. Kenshi Yonezu songs: "IRIS OUT.", "Yellow Flag", "GOSSIP", "LOST CORNER", "Moonlight Serpent", "恋の病", "ネオンサイン", "KARMA CITY", "シンデレラ", "発明", "Black Sheep", "La La La". We already verified these are 100% fake.
// 5. Ado songs: "ザ・ファースト・テイク", "メドレー", "未公開曲1", "未公開曲2", "価値がない", "花火", "心臓", "おどロボ".
// 6. Mrs. GREEN APPLE or other artists with generic single-character titles and short descriptions at the end of their ranges.

const yonezuFakes = [
  'iris out.', 'yellow flag', 'gossip', 'lost corner', 'moonlight serpent', '恋の病', 'ネオンサイン', 'karma city', 'シンデレラ', '発明', 'black sheep', 'la la la', 'eta'
];

const adoFakes = [
  'ザ・ファースト・テイク', 'メドレー', '未公開曲1', '未公開曲2', '価値がない', '花火', 'おどロボ'
];

songs.forEach(s => {
  const titleLower = (s.title || '').toLowerCase();
  const descLower = (s.description || '').toLowerCase();
  const artistLower = (s.artist || '').toLowerCase();

  // Explicit Yonezu fakes
  if (s.artist === '米津玄師' && yonezuFakes.some(f => titleLower.includes(f))) {
    suspiciousList.push(s);
    return;
  }

  // Explicit Ado fakes
  if (s.artist === 'Ado' && adoFakes.some(f => titleLower.includes(f))) {
    suspiciousList.push(s);
    return;
  }

  // Placeholder keyword heuristic
  const hasPlaceholderKeyword = ['未公開', '未発表', 'テスト', 'ダミー', 'dummy', 'hoge', 'fuga'].some(kw => titleLower.includes(kw));
  if (hasPlaceholderKeyword) {
    suspiciousList.push(s);
    return;
  }

  // End of range filler heuristic:
  // If the description is extremely short (1-2 chars) and title is generic single or double character (except known real short songs like "嘘月", "都落ち", "紅", "風" by certain artists).
  if (s.description && s.description.trim().length <= 2) {
    const isRealExclusion = (
      (s.artist === 'X JAPAN' && ['紅', '生', '熱', '美学', '讃歌', '真髄'].includes(s.title)) ||
      (s.artist === 'ヨルシカ' && ['嘘月', '都落ち', '深海', '季節', '男', '空', '夜', '花束', '複製', '日常', '視覚', '花'].includes(s.title)) ||
      (s.artist === 'スピッツ' && ['月', '星', '過去', '距離', '風景', '季節', '日常', '果実', '光'].includes(s.title)) ||
      (s.artist === 'サザンオールスターズ' && ['海', '波', '風', '夏'].includes(s.title))
    );

    if (!isRealExclusion) {
      suspiciousList.push(s);
      return;
    }
  }

  // Specifically check for those "akasaki_" style fillers: single character title + short description of length <= 4
  const isGenericFillerTitle = ['夢', '恋', '空', '花', '夜', '道', '愛', '風', '海', '波', '歌', '太陽', '世界', '英雄', '帰還'].includes(s.title);
  if (isGenericFillerTitle && s.description && s.description.trim().length <= 4) {
    // Exclude legitimate songs
    const isRealExclusion = (
      (s.artist === 'スピッツ' && ['星', '月', '桃', '風', '海', '空'].includes(s.title)) ||
      (s.artist === 'ヨルシカ' && ['空', '夜', '花', '波'].includes(s.title))
    );
    if (!isRealExclusion) {
      suspiciousList.push(s);
      return;
    }
  }
});

console.log(`\nFound ${suspiciousList.length} suspicious songs via offline heuristics:`);
suspiciousList.forEach(s => {
  console.log(`- ID: ${s.id} | Title: "${s.title}" | Artist: "${s.artist}" | Desc: "${s.description}"`);
});

fs.writeFileSync('./heuristic_fakes.json', JSON.stringify(suspiciousList, null, 2));
