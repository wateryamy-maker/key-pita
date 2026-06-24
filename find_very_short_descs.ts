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

const candidates = songs.filter(s => s.description && s.description.trim().length <= 4);

console.log(`Found ${candidates.length} songs with description length <= 4:`);
candidates.forEach(s => {
  console.log(`ID: ${s.id} | Title: "${s.title}" | Artist: "${s.artist}" | Desc: "${s.description}"`);
});
