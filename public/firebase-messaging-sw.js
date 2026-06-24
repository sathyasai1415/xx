// Firebase Messaging Service Worker — handles background push notifications.
// This file must be at the root of the site (served from /firebase-messaging-sw.js).

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Config is duplicated here (service workers can't import from the app bundle).
// These are public identifiers — not secrets.
firebase.initializeApp({
  apiKey: self.__FIREBASE_CONFIG__?.apiKey ?? '',
  authDomain: self.__FIREBASE_CONFIG__?.authDomain ?? '',
  projectId: self.__FIREBASE_CONFIG__?.projectId ?? '',
  storageBucket: self.__FIREBASE_CONFIG__?.storageBucket ?? '',
  messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId ?? '',
  appId: self.__FIREBASE_CONFIG__?.appId ?? '',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = 'MiSlice', body = '' } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon: '/pizza-icon.png',
    badge: '/pizza-badge.png',
    data: payload.data,
  });
});
