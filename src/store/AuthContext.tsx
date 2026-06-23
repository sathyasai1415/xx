import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: 'customer' | 'store_owner' | 'admin';
  phone?: string;
  storeId?: string;
  storeName?: string;
}

const LOCAL_KEY = 'miSliceAuth';

function load(): UserProfile | null {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); }
  catch { return null; }
}
function save(p: UserProfile | null) {
  if (p) localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
  else localStorage.removeItem(LOCAL_KEY);
}

interface AuthCtxValue {
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isStoreOwner: boolean;
  isAdmin: boolean;
  loginLocal: (profile: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  // kept for compat with any component that calls it
  refreshProfile: () => Promise<void>;
  user: null;
}

const AuthCtx = createContext<AuthCtxValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProfile(load());
    setLoading(false);
  }, []);

  const loginLocal = useCallback(async (p: UserProfile) => {
    setProfile(p);
    save(p);
  }, []);

  const logout = useCallback(async () => {
    setProfile(null);
    save(null);
  }, []);

  const refreshProfile = useCallback(async () => {}, []);

  return (
    <AuthCtx.Provider value={{
      profile,
      loading,
      isAuthenticated: !!profile,
      isStoreOwner: profile?.role === 'store_owner',
      isAdmin: profile?.role === 'admin',
      loginLocal,
      logout,
      refreshProfile,
      user: null,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
