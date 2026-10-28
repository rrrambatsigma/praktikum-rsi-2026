/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import axios from 'axios';
import { authApi } from '../lib/api.ts';
import type { LoginInput, RegisterInput, User } from '../types/api.ts';

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    const handleUnauthorized = () => {
      if (active) setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    authApi
      .me()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (
          !axios.isAxiosError(error) ||
          (error.response?.status !== 401 && error.response?.status !== 403)
        ) {
          console.error('Gagal memeriksa sesi:', error);
        }
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const currentUser = await authApi.login(input);
    setUser(currentUser);
    return currentUser;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    return authApi.register(input);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((nextUser: User) => {
    setUser(nextUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isReady, login, register, logout, updateUser }),
    [isReady, login, logout, register, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }

  return context;
}
