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

const fakeKeywords = [
  '未公開', '未発表', 'テスト', 'サンプル', 'ダミー', 'hoge', 'fuga', 'test', 'demo', 'dummy',
  'メドレー', 'ファースト・テイク', 'first take', 'トラック', 'track'
];

console.log('--- SCANNING FOR KEYWORDS ---');
const found: SongRow[] = [];
songs.forEach(song => {
  const title = (song.title || '').toLowerCase();
  const artist = (song.artist || '').toLowerCase();
  const desc = (song.description || '').toLowerCase();
  
  const matchesKeyword = fakeKeywords.some(kw => title.includes(kw) || desc.includes(kw) || song.id.includes(kw));
  if (matchesKeyword) {
    found.push(song);
  }
});

console.log(`Found ${found.length} songs matching fake keywords:`);
found.forEach(s => {
  console.log(`- ID: ${s.id} | Title: "${s.title}" | Artist: "${s.artist}" | Desc: "${s.description}"`);
});
