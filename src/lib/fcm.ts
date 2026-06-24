import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

function getMessagingInstance() {
  if (!messagingInstance) {
    const { getApp } = require('firebase/app');
    messagingInstance = getMessaging(getApp());
  }
  return messagingInstance;
}

/**
 * Request notification permission and save the FCM token to Firestore.
 * Safe to call multiple times — no-ops if permission is already granted/denied.
 */
export async function registerFcmToken(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  let permission = Notification.permission;
  if (permission === 'denied') return;

  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return;

  try {
    const messaging = getMessagingInstance();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;

    await setDoc(doc(db, 'users', uid), { fcmToken: token, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    // FCM not critical — log and continue
    console.warn('FCM token registration failed:', err);
  }
}

/**
 * Listen for foreground messages and show a browser notification.
 */
export function listenForMessages(onNotification: (title: string, body: string) => void): () => void {
  try {
    const messaging = getMessagingInstance();
    return onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? 'MiSlice';
      const body = payload.notification?.body ?? '';
      onNotification(title, body);
    });
  } catch {
    return () => {};
  }
}
