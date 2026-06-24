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

console.log('Total songs:', songs.length);

// Let's filter songs with description length <= 15 and group them by artist
const filtered = songs.filter(s => s.description && s.description.trim().length <= 15);

console.log(`Found ${filtered.length} songs with description <= 15 characters.`);

const artistGroups: Record<string, SongRow[]> = {};
filtered.forEach(s => {
  artistGroups[s.artist] = artistGroups[s.artist] || [];
  artistGroups[s.artist].push(s);
});

console.log('\nArtists with short description songs:');
Object.entries(artistGroups)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 30)
  .forEach(([artist, list]) => {
    console.log(`- ${artist}: ${list.length} songs`);
  });

console.log('\nShowing 50 sample short description songs:');
filtered.slice(0, 50).forEach(s => {
  console.log(`ID: ${s.id} | Title: "${s.title}" | Artist: "${s.artist}" | Desc: "${s.description}"`);
});
