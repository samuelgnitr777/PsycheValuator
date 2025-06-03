'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isAdminLoggedIn as checkIsAdminLoggedIn, logoutAdmin as performLogout } from '@/lib/authService';

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoggedIn(checkIsAdminLoggedIn());
    setIsLoading(false);
  }, []);
  
  const logout = () => {
    performLogout();
    setIsLoggedIn(false);
    // router.push('/admin/login'); // Handled by useAuth or specific components
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
