
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
    console.warn(
      "********************************************************************************************************\n" +
      "WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined or is empty in your environment.\n" +
      "Falling back to using the anonymous Supabase client for service role operations.\n" +
      "This is NOT SECURE and may lead to operations failing due to RLS policies.\n" +
      "Please ensure SUPABASE_SERVICE_ROLE_KEY is correctly set in your .env.local file and restart the server.\n" +
      "See: Supabase project settings (API -> Project API Keys -> service_role secret).\n" +
      "********************************************************************************************************"
    );
    // Fallback to anon client if service role key is missing.
    // This is a workaround to prevent a hard crash but has security/functionality implications.
    return supabase;
  }
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // Important: When using service_role key, set autoRefreshToken and persistSession to false
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

