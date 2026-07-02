import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Firestore with a persistent local cache. Reads are served instantly from
// IndexedDB and synced in the background; writes apply optimistically and flush
// when the network is available. persistentMultipleTabManager keeps multiple
// browser tabs in sync sharing one cache.
const firestoreSettings = {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
};

// initializeFirestore can only be called once per app. In dev, Vite HMR may
// re-run this module while the previous instance is still alive, so fall back
// to the existing instance instead of throwing.
function makeDb(): Firestore {
  try {
    return databaseId && databaseId !== '(default)'
      ? initializeFirestore(app, firestoreSettings, databaseId)
      : initializeFirestore(app, firestoreSettings);
  } catch {
    return databaseId && databaseId !== '(default)'
      ? getFirestore(app, databaseId)
      : getFirestore(app);
  }
}

export const db = makeDb();
