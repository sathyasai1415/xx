import { getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

function getMessagingInstance() {
  if (!messagingInstance) {
    messagingInstance = getMessaging(getApp());
  }
  return messagingInstance;
}

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
    const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessagingInstance();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: sw });
    if (!token) return;
    await setDoc(
      doc(db, 'users', uid),
      { fcmToken: token, notificationsEnabled: true, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    console.warn('FCM token registration failed:', err);
  }
}

/**
 * Turn notifications OFF: clears the saved token so broadcasts/order pushes skip
 * this user, and best-effort deletes the browser token. Browser permission
 * itself can only be revoked by the user in site settings, but with no token
 * stored the app will not send to them.
 */
export async function disableFcmToken(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await setDoc(
      doc(db, 'users', uid),
      { fcmToken: '', notificationsEnabled: false, updatedAt: serverTimestamp() },
      { merge: true },
    );
    try {
      const messaging = getMessagingInstance();
      await deleteToken(messaging);
    } catch {
      /* token may already be gone — non-fatal */
    }
  } catch (err) {
    console.warn('Disabling FCM failed:', err);
  }
}

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
