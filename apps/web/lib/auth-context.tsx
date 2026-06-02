'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { configureApi } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  language: string;
  clientId?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Ref so configureApi's getter always reads the latest token without re-registering
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = accessToken;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (!res.ok) {
        setUser(null);
        setAccessToken(null);
        tokenRef.current = null;
        return;
      }
      const { accessToken: token, user: u } = await res.json();
      setAccessToken(token);
      tokenRef.current = token;
      setUser(u);
    } catch {
      setUser(null);
      setAccessToken(null);
      tokenRef.current = null;
    }
  }, []);

  // Wire api.ts to always pick up the current token
  useEffect(() => {
    configureApi(
      () => tokenRef.current,
      refresh,
    );
  }, [refresh]);

  // Restore session on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Login failed');
    }
    const { accessToken: token, user: u } = await res.json();
    setAccessToken(token);
    tokenRef.current = token;
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/refresh', { method: 'DELETE' });
    setUser(null);
    setAccessToken(null);
    tokenRef.current = null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
