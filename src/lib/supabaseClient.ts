
import { createClient, SupabaseClient as SupabaseClientGeneric } from '@supabase/supabase-js';
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

// Client for public (anonymous) access, subject to RLS for 'anon' role
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {});

// Type alias for convenience
export type SupabaseClient = SupabaseClientGeneric<Database>;

// Function to create a Supabase client with the service_role key
// This client bypasses RLS and should only be used in secure server-side environments for admin operations.
export const createSupabaseServiceRoleClient = (): SupabaseClient => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey || supabaseServiceRoleKey.trim() === '') {
    throw new Error(
      "FATAL ERROR: SUPABASE_SERVICE_ROLE_KEY is not defined or is empty in your .env.local file. " +
      "This key is required for admin database operations. Please obtain it from your Supabase project settings (API -> Project API Keys -> service_role secret) " +
      "and add it to .env.local. Restart the server after adding it."
    );
  }
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // Important: When using service_role key, set autoRefreshToken and persistSession to false
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
