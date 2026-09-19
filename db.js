import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-anon-key'
);

async function testConnection() {
  if (!supabaseUrl || !supabaseKey) {
    console.log('Supabase environment variables will be automatically added by Hostinger upon deployment.');
    return;
  }
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.log('Supabase query result:', error.message);
  } else {
    console.log('Successfully connected to Supabase:', data);
  }
}

testConnection();

export { supabase };
export default supabase;
