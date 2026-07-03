import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { checkAndSeedDatabase } from '../lib/seeding';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: 'customer' | 'store_owner' | 'store_employee' | 'admin';
  storeRole?: 'admin' | 'manager' | 'cashier' | 'kitchen_staff' | 'employee';
  phone?: string;
  storeId?: string;
  storeName?: string;
}

interface AuthCtxValue {
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isStoreOwner: boolean; // Includes store owners and store employees (directing them to the merchant dashboard)
  isAdmin: boolean;
  simulatedRole: string | null;
  switchSimulatedRole: (role: string | null) => void;
  loginOrRegister: (
    email: string,
    password: string,
    role: 'customer' | 'store_owner' | 'store_employee',
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
  if (r === 'store_employee' || r === 'employee' || r === 'staff' || r === 'manager' || r === 'cashier' || r === 'kitchen_staff') return 'store_employee';
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
  const [simulatedRole, setSimulatedRole] = useState<string | null>(() => {
    if (window.location.hostname === 'localhost' && import.meta.env.DEV) {
      return localStorage.getItem('mis_simulated_role') || null;
    }
    return null;
  });

  const switchSimulatedRole = useCallback((role: string | null) => {
    if (window.location.hostname !== 'localhost' || !import.meta.env.DEV) return;
    setSimulatedRole(role);
    if (role) {
      localStorage.setItem('mis_simulated_role', role);
    } else {
      localStorage.removeItem('mis_simulated_role');
    }
  }, []);

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' && import.meta.env.DEV;
    if (isLocalhost) {
      checkAndSeedDatabase();
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const p = await readProfile(firebaseUser.uid);
          setProfile(p);
        } catch {
          setProfile(null);
        }
        setLoading(false);
      } else if (isLocalhost) {
        // Attempt automatic demo sign in
        try {
          const cred = await signInWithEmailAndPassword(auth, 'sathyasai1415@gmail.com', '123456');
          const p = await readProfile(cred.user.uid);
          setProfile(p);
        } catch (err: any) {
          // If user doesn't exist, create it!
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
            try {
              const cred = await createUserWithEmailAndPassword(auth, 'sathyasai1415@gmail.com', '123456');
              await fbUpdateProfile(cred.user, { displayName: 'Sathyasai1415' });
              const profileDoc: UserProfile = {
                uid: cred.user.uid,
                email: 'sathyasai1415@gmail.com',
                fullName: 'Sathyasai1415',
                role: 'customer',
              };
              await setDoc(doc(db, 'users', cred.user.uid), { ...profileDoc, createdAt: serverTimestamp() }, { merge: true });
              setProfile(profileDoc);
            } catch (createErr) {
              console.error('Failed to auto-create demo user:', createErr);
            }
          }
        }
        setLoading(false);
      } else {
        setProfile(null);
        setLoading(false);
      }
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
    let finalRole: UserProfile['role'] = role;
    let storeId = role === 'store_owner' ? uid : undefined;
    let storeRole: UserProfile['storeRole'] = undefined;

    if (email === 'admin@zumbo.com') {
      finalRole = 'store_owner';
      storeId = '1234567';
      storeRole = 'admin';
    } else if (email === 'manager@zumbo.com') {
      finalRole = 'store_employee';
      storeId = '1234567';
      storeRole = 'manager';
    } else if (email === 'kitchen@zumbo.com') {
      finalRole = 'store_employee';
      storeId = '1234567';
      storeRole = 'kitchen_staff';
    } else if (email === 'cashier@zumbo.com') {
      finalRole = 'store_employee';
      storeId = '1234567';
      storeRole = 'cashier';
    }

    const profileDoc: UserProfile = {
      uid,
      email,
      fullName,
      role: finalRole,
      ...(storeRole && { storeRole }),
      ...(storeId && { storeId, storeName: storeName || 'Zumbo Pizza' }),
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

  const computedIsAdmin = useMemo(() => {
    if (window.location.hostname === 'localhost' && import.meta.env.DEV && simulatedRole) {
      return simulatedRole === 'platform_admin';
    }
    return profile?.role === 'admin';
  }, [profile, simulatedRole]);

  const computedIsStoreOwner = useMemo(() => {
    if (window.location.hostname === 'localhost' && import.meta.env.DEV && simulatedRole) {
      return ['store_admin', 'store_employee', 'merchant'].includes(simulatedRole);
    }
    return profile?.role === 'store_owner' || profile?.role === 'store_employee';
  }, [profile, simulatedRole]);

  return (
    <AuthCtx.Provider value={{
      profile,
      loading,
      isAuthenticated: !!profile,
      isStoreOwner: computedIsStoreOwner,
      isAdmin: computedIsAdmin,
      simulatedRole,
      switchSimulatedRole,
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
