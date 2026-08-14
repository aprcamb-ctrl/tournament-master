import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function f() {
    const {data} = await supabase.from('tournament_state').select('*').eq('id',1).single();
    fs.writeFileSync('dump.json', JSON.stringify(data, null, 2));
    console.log('Done');
}
f();
