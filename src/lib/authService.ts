
'use client'; // This service interacts with Supabase Auth, which manages session client-side.

import { supabase } from '../lib/supabaseClient'; // Changed import

// NOTE: Supabase Auth primarily uses email/password.
// This function assumes you're using email as the identifier for the admin.
// You might need to adjust this based on how you set up admin users in Supabase.
export const loginAdmin = async (email: string, password: string): Promise<{ success: boolean; error: string | null }> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Login failed:', error.message);
    return { success: false, error: error.message };
  }
  // Store a flag in localStorage to indicate admin login
  if (typeof window !== 'undefined') {
    localStorage.setItem('isAdminLoggedIn', 'true');
  }
  return { success: true, error: null };
};

export const logoutAdmin = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout failed:', error.message);
  }
  // Remove the flag from localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isAdminLoggedIn');
  }
};

export const isAdminLoggedIn = (): boolean => {
  // Check for the flag in localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  }
  return false;
};

// Although less common for simple checks, you can get the full session details asynchronously if needed elsewhere:
export const getAdminSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
  }
