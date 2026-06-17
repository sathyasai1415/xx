import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, signOutUser, getUserProfile, UserProfile } from '../lib/auth';

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isStoreOwner: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange((u, p) => {
      setUser(u);
      setProfile(p);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) setProfile(await getUserProfile(user.uid));
  }, [user]);

  const logout = useCallback(async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isStoreOwner: profile?.role === 'store_owner',
    refreshProfile,
    logout,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
