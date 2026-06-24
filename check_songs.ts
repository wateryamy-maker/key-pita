import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URI || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function exportAll() {
  try {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching records ${page * pageSize} to ${(page + 1) * pageSize - 1}...`);
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('id', { ascending: true });

      if (error) {
        throw error;
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

    fs.writeFileSync('./all_songs.json', JSON.stringify(allData, null, 2));
    console.log(`Successfully exported all ${allData.length} songs to all_songs.json`);
  } catch (err: any) {
    console.error('Error exporting:', err);
  }
}

exportAll();
