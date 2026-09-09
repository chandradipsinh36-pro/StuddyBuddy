import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import type { User } from '../types/admin';

interface AdminAuthContextValue {
  adminUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateAdminUser: (updates: Partial<User>) => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sb_admin_user');
      const token  = localStorage.getItem('sb_admin_token');
      if (stored && token) {
        const parsed: User = JSON.parse(stored);
        if (parsed.role === 'admin') {
          setAdminUser(parsed);
        } else {
          localStorage.removeItem('sb_admin_user');
          localStorage.removeItem('sb_admin_token');
        }
      }
    } catch {
      localStorage.removeItem('sb_admin_user');
      localStorage.removeItem('sb_admin_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * POST /api/auth/login
   * Verifies credentials against the real backend.
   * Rejects if the returned user role is not 'admin'.
   */
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      const { token, user } = data.data as { token: string; user: Record<string, unknown> };

      if (user.role !== 'admin') {
        throw new Error('Access denied. Admin accounts only.');
      }

      const adminUser: User = {
        id:          user.id as number,
        name:        user.name as string,
        email:       user.email as string,
        role:        'admin',
        status:      user.status as User['status'],
        profile_pic: user.profilePic as string | undefined,
        is_verified: user.isVerified as boolean,
        created_at:  user.createdAt as string,
      };

      localStorage.setItem('sb_admin_token', token);
      localStorage.setItem('sb_admin_user', JSON.stringify(adminUser));
      setAdminUser(adminUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sb_admin_token');
    localStorage.removeItem('sb_admin_user');
    setAdminUser(null);
  };

  const updateAdminUser = (updates: Partial<User>) => {
    setAdminUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('sb_admin_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser && adminUser.role === 'admin',
        isLoading,
        login,
        logout,
        updateAdminUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return ctx;
}
