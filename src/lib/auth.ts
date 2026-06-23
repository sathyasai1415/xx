// Firebase Authentication service — email/password signup & login for the two
// roles (customer, store_owner). The user's role and profile live in Firestore
// at users/{uid}; a store_owner additionally gets a stores/{uid} document.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { updateStore } from './db';

export type UserRole = 'customer' | 'store_owner' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  storeId?: string;        // store_owner only
  storeName?: string;      // store_owner only
  isVegetarian?: boolean;
  preferredCrust?: string;
  createdAt?: unknown;
}

const friendly = (code: string): string => {
  switch (code) {
    case 'auth/email-already-in-use': return 'That email is already registered. Try signing in.';
    case 'auth/invalid-email': return 'That email address looks invalid.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/operation-not-allowed': return 'Email/password sign-in is not enabled for this project.';
    default: return 'Something went wrong. Please try again.';
  }
};

export class AuthError extends Error {
  constructor(message: string) { super(message); this.name = 'AuthError'; }
}

// ── Profile helpers ───────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ── Customer ──────────────────────────────────────────────────────────────────

export async function signUpCustomer(params: {
  email: string; password: string; fullName: string; phone?: string;
}): Promise<UserProfile> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
    await updateProfile(cred.user, { displayName: params.fullName });

    const profile: UserProfile = {
      uid: cred.user.uid,
      email: params.email.trim().toLowerCase(),
      fullName: params.fullName.trim(),
      role: 'customer',
      phone: params.phone ?? '',
    };
    await setDoc(doc(db, 'users', cred.user.uid), { ...profile, createdAt: serverTimestamp() });
    sendEmailVerification(cred.user).catch(() => {/* non-blocking */});
    return profile;
  } catch (e: any) {
    throw new AuthError(friendly(e?.code ?? ''));
  }
}

// ── Store owner ─────────────────────────────────────────────────────────────--

export async function signUpStoreOwner(params: {
  email: string; password: string; fullName: string; storeName: string; phone?: string;
}, options?: { isApproved?: boolean; applicationStatus?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended' }): Promise<UserProfile> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
    await updateProfile(cred.user, { displayName: params.fullName });
    const uid = cred.user.uid;
    const approved = options?.isApproved === true;
    const status = options?.applicationStatus ?? (approved ? 'approved' : 'draft');

    const profile: UserProfile = {
      uid,
      email: params.email.trim().toLowerCase(),
      fullName: params.fullName.trim(),
      role: 'store_owner',
      phone: params.phone ?? '',
      storeId: uid,                 // store doc id == owner uid (matches rules)
      storeName: params.storeName.trim(),
    };
    await setDoc(doc(db, 'users', uid), { ...profile, createdAt: serverTimestamp() });

    // Provision the store document the owner will manage.
    await setDoc(doc(db, 'stores', uid), {
      ownerId: uid,
      store_name: params.storeName.trim(),
      city: 'Detroit',
      state: 'MI',
      accepting_orders: true,
      is_approved: approved,
      is_setup_complete: false,
      application_status: status,
      rating_avg: 0,
      rating_count: 0,
      createdAt: serverTimestamp(),
    });
    sendEmailVerification(cred.user).catch(() => {});
    return profile;
  } catch (e: any) {
    throw new AuthError(friendly(e?.code ?? ''));
  }
}

// ── Sign in / out ───────────────────────────────────────────────────────────--

export async function signIn(email: string, password: string): Promise<UserProfile> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const profile = await getUserProfile(cred.user.uid);
    if (!profile) {
      // Auth account exists but no profile doc — recover with a minimal customer profile.
      const fallback: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email ?? email,
        fullName: cred.user.displayName ?? 'Customer',
        role: 'customer',
      };
      await setDoc(doc(db, 'users', cred.user.uid), { ...fallback, createdAt: serverTimestamp() });
      return fallback;
    }
    return profile;
  } catch (e: any) {
    if (e instanceof AuthError) throw e;
    throw new AuthError(friendly(e?.code ?? ''));
  }
}

export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    let profile = await getUserProfile(cred.user.uid);
    if (!profile) {
      profile = {
        uid: cred.user.uid,
        email: cred.user.email ?? '',
        fullName: cred.user.displayName ?? 'Customer',
        role: 'customer',
        phone: cred.user.phoneNumber ?? '',
      };
      await setDoc(doc(db, 'users', cred.user.uid), { ...profile, createdAt: serverTimestamp() });
    }
    return profile;
  } catch (e: any) {
    if (e?.code === 'auth/popup-closed-by-user') throw new AuthError('Sign-in cancelled.');
    throw new AuthError(friendly(e?.code ?? ''));
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (e: any) {
    throw new AuthError(friendly(e?.code ?? ''));
  }
}

// Subscribe to auth state; resolves the Firestore profile for the signed-in user.
export function onAuthChange(cb: (user: FirebaseUser | null, profile: UserProfile | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) { cb(null, null); return; }
    const profile = await getUserProfile(user.uid);
    cb(user, profile);
  });
}
