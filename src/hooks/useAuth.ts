'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminLoggedIn as checkIsAdminLoggedIn, logoutAdmin as performLogout } from '@/lib/authService';

export function useAuth(redirectTo = '/admin/login') {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loggedIn = checkIsAdminLoggedIn();
    setIsLoggedIn(loggedIn);
    setLoading(false);
    if (!loggedIn && redirectTo) {
      // Only redirect if not on the login page itself to prevent redirect loops
      if (window.location.pathname !== redirectTo) {
         router.replace(redirectTo);
      }
    }
  }, [router, redirectTo]);

  const logout = useCallback(() => {
    performLogout();
    setIsLoggedIn(false);
    router.push('/admin/login');
  }, [router]);

  return { isLoggedIn, loading, logout };
}

export function usePublicAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsLoggedIn(checkIsAdminLoggedIn());
    setLoading(false);
  }, []);
  
  const logout = useCallback(() => {
    performLogout();
    setIsLoggedIn(false);
    // Potentially redirect or inform the user they've logged out
  }, []);


  return { isLoggedIn, loading, logout };
}
