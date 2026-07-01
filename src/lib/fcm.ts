import { getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
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
    await setDoc(doc(db, 'users', uid), { fcmToken: token, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('FCM token registration failed:', err);
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
