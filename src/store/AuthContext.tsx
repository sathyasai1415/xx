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
  /** Sign-in only (no auto-register). Verifies the account is a platform admin. */
  loginAsAdmin: (email: string, password: string) => Promise<void>;
  /** @deprecated use loginOrRegister */
  loginLocal: (profile: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  user: null;
}

const AuthCtx = createContext<AuthCtxValue | null>(null);

// Normalize a raw role string from Firestore into one of our canonical roles.
// Handles manual edits like "Admin", "ADMIN", "Store Owner", etc.
function normalizeRole(raw: unknown): UserProfile['role'] {
  const r = String(raw ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (r === 'admin') return 'admin';
  if (r === 'store_owner' || r === 'storeowner' || r === 'owner') return 'store_owner';
  return 'customer';
}

async function readProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as UserProfile;
  return { ...data, role: normalizeRole(data.role) };
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
    let isNewUser = false;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      firebaseUser = cred.user;
      // Update display name if missing
      if (!firebaseUser.displayName) {
        await fbUpdateProfile(firebaseUser, { displayName: fullName });
      }
    } catch (err: any) {
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-email'
      ) {
        // New user — try to register. If the password is wrong for an existing
        // account, createUserWithEmailAndPassword will throw auth/email-already-in-use.
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          firebaseUser = cred.user;
          isNewUser = true;
          await fbUpdateProfile(firebaseUser, { displayName: fullName });
        } catch (regErr: any) {
          if (regErr.code === 'auth/email-already-in-use') {
            // Email exists but password was wrong — re-throw the original sign-in error
            throw err;
          }
          throw regErr;
        }
      } else {
        throw err;
      }
    }

    const uid = firebaseUser.uid;

    // If the account already has a profile, HONOR it — never downgrade an
    // existing admin/store_owner back to the role picked on the login form.
    if (!isNewUser) {
      const existing = await readProfile(uid);
      if (existing) {
        setProfile(existing);
        return;
      }
    }

    // Brand-new account — create profile with the requested role.
    // storeId always equals the owner's uid — consistent with security rules.
    const storeId = role === 'store_owner' ? uid : undefined;

    const profileDoc: UserProfile = {
      uid,
      email,
      fullName,
      role,
      ...(storeId && { storeId, storeName }),
    };

    await setDoc(doc(db, 'users', uid), { ...profileDoc, createdAt: serverTimestamp() }, { merge: true });

    // Create store document for new store owners (keyed by uid)
    if (role === 'store_owner') {
      const storeRef = doc(db, 'stores', uid);
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
      }
    }

    setProfile(profileDoc);
  }, []);

  // ── Admin sign-in (no auto-register) ────────────────────────────────────────
  const loginAsAdmin = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const p = await readProfile(cred.user.uid);
    if (!p || p.role !== 'admin') {
      await signOut(auth);
      const e: any = new Error('This account is not an administrator.');
      e.code = 'auth/not-admin';
      throw e;
    }
    setProfile(p);
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
      loginAsAdmin,
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
