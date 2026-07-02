'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { auth, hasValidConfig } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import api from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isPremium: boolean;
  isAdmin: boolean;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone?: string;
  profession?: string;
  gender?: string;
  password: string;
  confirmPassword: string;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserFromToken = useCallback(async () => {
    const token = api.getToken();
    if (!token) { return null; }
    try {
      const res = await api.getProfile();
      if (res.success && res.data) {
        return {
          id: res.data.id,
          email: res.data.email,
          fullName: res.data.fullName,
          role: res.data.role,
          isPremium: (res.data.role as string) === 'premium' || (res.data.role as string) === 'admin',
          isAdmin: (res.data.role as string) === 'admin',
        } as AuthUser;
      }
    } catch {}
    return null;
  }, []);

  useEffect(() => {
    if (hasValidConfig && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          const token = await fbUser.getIdToken();
          api.setToken(token);
          const u = await loadUserFromToken();
          if (u) setUser(u);
          else {
            setUser({
              id: fbUser.uid,
              email: fbUser.email || '',
              fullName: fbUser.displayName || 'User',
              role: 'user',
              isPremium: false,
              isAdmin: false,
            });
          }
        } else {
          api.setToken(null);
          const storedToken = localStorage.getItem('colgnss_token');
          if (storedToken) {
            api.setToken(storedToken);
            const u = await loadUserFromToken();
            if (u) { setUser(u); setLoading(false); return; }
          }
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      const storedToken = localStorage.getItem('colgnss_token');
      if (storedToken) {
        api.setToken(storedToken);
        loadUserFromToken().then(u => {
          if (u) setUser(u);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }
  }, [loadUserFromToken]);

  const login = useCallback(async (email: string, password: string) => {
    if (hasValidConfig && auth) {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      api.setToken(token);
    } else {
      const res = await api.login(email, password);
      if (res.success) {
        api.setToken(res.data.token);
      } else {
        throw new Error(res.message || 'Login failed');
      }
    }
    const u = await loadUserFromToken();
    if (u) setUser(u);
  }, [loadUserFromToken]);

  const register = useCallback(async (data: RegisterData) => {
    if (hasValidConfig && auth) {
      const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
      try { await api.register(data); } catch {}
      const token = await result.user.getIdToken();
      api.setToken(token);
    } else {
      const res = await api.register(data);
      if (res.success) {
        api.setToken(res.data.token);
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    }
    const u = await loadUserFromToken();
    if (u) setUser(u);
  }, [loadUserFromToken]);

  const logout = useCallback(async () => {
    if (hasValidConfig && auth) {
      try { await signOut(auth); } catch {}
    }
    api.setToken(null);
    setUser(null);
    setFirebaseUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
