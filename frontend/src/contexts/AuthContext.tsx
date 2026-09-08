import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  setCurrentUser: (user: User, token?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('sb_token');
      if (!token) { setUser(null); return; }
      const me = await authService.getMe();
      setUser(me);
      localStorage.setItem('sb_user', JSON.stringify(me));
    } catch {
      setUser(null);
      localStorage.removeItem('sb_token');
      localStorage.removeItem('sb_user');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('sb_user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { /* noop */ }
      }
      await refreshUser();
      setIsLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const authUser = await authService.login({ email, password });
    localStorage.setItem('sb_token', authUser.token);
    localStorage.setItem('sb_user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const setCurrentUser = (newUser: User, token?: string) => {
    const effectiveToken = token || `sb_token_${newUser.role}_${newUser.id}`;
    localStorage.setItem('sb_token', effectiveToken);
    localStorage.setItem('sb_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      role: user?.role ?? null,
      login,
      setCurrentUser,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
