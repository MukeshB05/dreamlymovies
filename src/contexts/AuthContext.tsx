'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { TMDBUser, getAvatarUrl } from '@/lib/auth';
import { site_name } from '../../config.js';

interface AuthContextType {
  user: TMDBUser | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (sessionId: string, user: TMDBUser) => void;
  logout: () => Promise<void>;
  getAvatar: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = `${site_name}_auth`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TMDBUser | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const { sessionId: storedSessionId, user: storedUser } = JSON.parse(stored);
        setSessionId(storedSessionId);
        setUser(storedUser);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newSessionId: string, newUser: TMDBUser) => {
    setSessionId(newSessionId);
    setUser(newUser);
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ sessionId: newSessionId, user: newUser })
    );
  }, []);

  const logout = useCallback(async () => {
    if (sessionId) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setSessionId(null);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [sessionId]);

  const getAvatar = useCallback(() => {
    if (user) {
      return getAvatarUrl(user);
    }
    return '/logo.png';
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionId,
        isAuthenticated: !!sessionId && !!user,
        isLoading,
        login,
        logout,
        getAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
