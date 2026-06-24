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

const artistsToCheck = ['Mrs. GREEN APPLE', 'back number'];

artistsToCheck.forEach(artist => {
  console.log(`\n--- SONGS BY ${artist} ---`);
  const artistSongs = songs.filter(s => s.artist === artist);
  artistSongs.forEach(s => {
    console.log(`ID: ${s.id} | Title: "${s.title}" | Desc: "${s.description}"`);
  });
});
