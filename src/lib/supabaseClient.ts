
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.trim() === '') {
  throw new Error(
    "FATAL ERROR: NEXT_PUBLIC_SUPABASE_URL is not defined or is empty. " +
    "Please ensure it is set correctly in your .env.local file (e.g., NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co), " +
    "that the file is in the project root, and that the Next.js development server has been fully restarted."
  );
}
if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  throw new Error(
    "FATAL ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined or is empty. " +
    "Please ensure it is set correctly in your .env.local file (this should be your public 'anon' key from Supabase project settings), " +
    "that the file is in the project root, and that the Next.js development server has been fully restarted."
  );
}

// Initialize Supabase client with an empty options object as a good practice.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {});
