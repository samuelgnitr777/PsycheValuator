
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // Akan kita buat nanti, atau bisa langsung digunakan

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("FATAL ERROR: NEXT_PUBLIC_SUPABASE_URL is not defined. Check .env.local file, its location (project root), and ensure the Next.js server is restarted.");
}
if (!supabaseAnonKey) {
  throw new Error("FATAL ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Check .env.local file, its location (project root), and ensure the Next.js server is restarted.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {});
