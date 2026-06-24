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

// Group songs by ID prefix (e.g. prefix before underscore, or 'numeric')
const groups: Record<string, SongRow[]> = {};
songs.forEach(song => {
  const parts = song.id.split('_');
  const prefix = parts.length > 1 ? parts[0] : 'numeric';
  groups[prefix] = groups[prefix] || [];
  groups[prefix].push(song);
});

console.log('--- ID PREFIX GROUPS ---');
Object.entries(groups).forEach(([prefix, list]) => {
  console.log(`- Prefix: "${prefix}" | Count: ${list.length} songs`);
});

// For each prefix group, let's find songs where the title doesn't look like standard songs,
// or let's inspect the high range of each prefix.
console.log('\n--- SAMPLE OF POPULAR PREFIXES ---');
Object.entries(groups).forEach(([prefix, list]) => {
  if (prefix !== 'numeric' && list.length > 0) {
    console.log(`\nPrefix "${prefix}" (Total: ${list.length}):`);
    // Print the first 3 and the last 5 songs in this prefix to check for outliers/fakes
    const sample = [...list.slice(0, 2), ...list.slice(-5)];
    sample.forEach(s => {
      console.log(`  ID: ${s.id} | Title: "${s.title}" | Artist: "${s.artist}" | Desc: "${s.description}"`);
    });
  }
});
