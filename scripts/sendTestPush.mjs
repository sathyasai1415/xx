// Send a real FCM push to a user's registered device (by email).
// Usage: node scripts/sendTestPush.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, '..', 'serviceAccountKey.json'), 'utf8'));

const TARGET_EMAIL = 'sathyasai1415@gmail.com';
const TITLE = '🍕 MiSlice';
const BODY  = 'Hey Sathya! This is a live test push from MiSlice — your notifications are working! 🎉';

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore(); // (default) database — matches the web client

async function run() {
  const user = await auth.getUserByEmail(TARGET_EMAIL);
  const snap = await db.collection('users').doc(user.uid).get();
  const token = snap.data()?.fcmToken;

  if (!token) {
    console.log('❌ No fcmToken saved for', TARGET_EMAIL);
    console.log('   → Open MiSlice in the browser, sign in, and allow notifications first.');
    process.exit(1);
  }

  console.log('Sending to token:', token.slice(0, 24) + '…');

  try {
    const id = await getMessaging().send({
      token,
      notification: { title: TITLE, body: BODY },
      webpush: {
        notification: { icon: '/icon-192.png' },
        fcmOptions: { link: 'https://mislice.online' },
      },
    });
    console.log('✅ Sent! Message ID:', id);
    console.log('   Check the device/browser where you allowed notifications.');
  } catch (e) {
    console.log('❌ Send failed:', e.code || e.message);
    if (String(e.code).includes('registration-token-not-registered')) {
      console.log('   The token is stale — re-open MiSlice and allow notifications again.');
    }
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
