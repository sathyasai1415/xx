import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: 'customer' | 'store_owner' | 'admin';
  phone?: string;
  storeId?: string;
  storeName?: string;
}

interface AuthCtxValue {
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isStoreOwner: boolean;
  isAdmin: boolean;
  loginOrRegister: (
    email: string,
    password: string,
    role: 'customer' | 'store_owner',
    fullName: string,
    storeName?: string,
  ) => Promise<void>;
  /** @deprecated use loginOrRegister */
  loginLocal: (profile: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  user: null;
}

const AuthCtx = createContext<AuthCtxValue | null>(null);

async function readProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const p = await readProfile(firebaseUser.uid);
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginOrRegister = useCallback(async (
    email: string,
    password: string,
    role: 'customer' | 'store_owner',
    fullName: string,
    storeName?: string,
  ) => {
    let firebaseUser;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      firebaseUser = cred.user;
      // Update display name if missing
      if (!firebaseUser.displayName) {
        await fbUpdateProfile(firebaseUser, { displayName: fullName });
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        // New user — register
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = cred.user;
        await fbUpdateProfile(firebaseUser, { displayName: fullName });
      } else {
        throw err;
      }
    }

    const uid = firebaseUser.uid;
    const slug = (role === 'store_owner' && storeName ? storeName : fullName)
      .trim().toLowerCase().replace(/\s+/g, '-');
    const storeId = role === 'store_owner' ? slug : undefined;

    const profileDoc: UserProfile = {
      uid,
      email,
      fullName,
      role,
      ...(storeId && { storeId, storeName }),
    };

    // Write user profile doc (merge so existing fields survive)
    await setDoc(doc(db, 'users', uid), { ...profileDoc, updatedAt: serverTimestamp() }, { merge: true });

    // Create store document for new store owners
    if (role === 'store_owner' && storeId) {
      const storeRef = doc(db, 'stores', storeId);
      const storeSnap = await getDoc(storeRef);
      if (!storeSnap.exists()) {
        await setDoc(storeRef, {
          ownerUid: uid,
          ownerId: uid,
          store_name: storeName || fullName,
          application_status: 'draft',
          is_approved: false,
          accepting_orders: false,
          createdAt: serverTimestamp(),
        });
      } else if (!storeSnap.data().ownerUid) {
        // Backfill ownerUid if missing
        await setDoc(storeRef, { ownerUid: uid }, { merge: true });
      }
    }

    setProfile(profileDoc);
  }, []);

  // Legacy shim — some components may still call loginLocal directly
  const loginLocal = useCallback(async (p: UserProfile) => {
    setProfile(p);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    const p = await readProfile(user.uid);
    setProfile(p);
  }, []);

  return (
    <AuthCtx.Provider value={{
      profile,
      loading,
      isAuthenticated: !!profile,
      isStoreOwner: profile?.role === 'store_owner',
      isAdmin: profile?.role === 'admin',
      loginOrRegister,
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
