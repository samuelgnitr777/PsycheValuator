'use client'; // This service interacts with localStorage, so it's client-side.

const AUTH_KEY = 'psychevaluator_admin_auth';

export const loginAdmin = (password: string): boolean => {
  // In a real app, this would be a secure check against a backend
  if (password === 'admin123') { // Hardcoded password for demo
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUTH_KEY, 'true');
        return true;
      } catch (error) {
        console.error("Failed to access localStorage:", error);
        return false; // Indicate failure if localStorage is not accessible
      }
    }
    return false; // Should not happen if window is defined, but as a fallback
  }
  return false;
};

export const logoutAdmin = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    }
  }
};

export const isAdminLoggedIn = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(AUTH_KEY) === 'true';
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      return false;
    }
  }
  return false; // Server-side or if window is not defined
};
