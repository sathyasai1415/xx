importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// These are public identifiers — not secrets.
firebase.initializeApp({
  apiKey: 'AIzaSyBmXLVjI0DbsaZK6FMYUtKF3g1XCZ8K3Rw',
  authDomain: 'xx-1-2e007.firebaseapp.com',
  projectId: 'xx-1-2e007',
  storageBucket: 'xx-1-2e007.firebasestorage.app',
  messagingSenderId: '115055699187',
  appId: '1:115055699187:web:d57c07d4f8fd5194214386',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = 'MiSlice', body = '' } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon: '/images/pizza-icon.png',
    badge: '/images/pizza-icon.png',
    data: payload.data,
  });
});
