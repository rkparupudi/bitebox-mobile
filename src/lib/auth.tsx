import { useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';
import { registerForPush, unregisterPush } from './push';
import { disconnectSocket } from './realtime';
import type { User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (b: Parameters<typeof api.register>[0]) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const clearSession = useCallback(async () => {
    disconnectSocket();
    await setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const logout = useCallback(async () => {
    await unregisterPush(); // while we still have a token to authorise the call
    await clearSession();
  }, [clearSession]);

  // Restore the session from secure storage on launch.
  useEffect(() => {
    (async () => {
      try {
        if (await getToken()) {
          const me = await api.me();
          setUser(me);
          registerForPush();
        }
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession());
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const value = useMemo<AuthState>(() => {
    const start = async (res: { accessToken: string; user: User }) => {
      await setToken(res.accessToken);
      queryClient.clear();
      setUser(res.user);
      registerForPush(); // don't block sign-in on the permission prompt
      return res.user;
    };
    return {
      user,
      loading,
      logout,
      login: async (email, password) => start(await api.login(email.trim().toLowerCase(), password)),
      register: async (b) => start(await api.register(b)),
    };
  }, [user, loading, logout, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
