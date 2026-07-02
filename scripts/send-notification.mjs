// Script to send a real-time notification to a specific customer in Firestore.
// Usage: node scripts/send-notification.mjs "madadi@gmail.com" "Welcome Back!" "Check out our new $3 deal at Rambo's Pizza! 🍕"
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(path.join(__dirname, '..', 'serviceAccountKey.json'), 'utf8'));

const EMAIL = (process.argv[2] || 'madadi@gmail.com').toLowerCase();
const TITLE = process.argv[3] || 'Special Deal Alert! 🍕';
const MESSAGE = process.argv[4] || 'Rambo’s Pizza is offering 4 pizzas for $3 right now!';

initializeApp({ credential: cert(sa) });
const auth = getAuth();
const db = getFirestore();

async function run() {
  const user = await auth.getUserByEmail(EMAIL);
  const uid = user.uid;

  const notifRef = db.collection('notifications').doc();
  await notifRef.set({
    notificationId: notifRef.id,
    userId: uid,
    title: TITLE,
    message: MESSAGE,
    type: 'deal',
    emoji: '🍕',
    read: false,
    createdAt: new Date().toISOString()
  });

  console.log(`✅ Notification successfully sent to ${EMAIL} (${uid})`);
  console.log(`   Title: "${TITLE}"`);
  console.log(`   Message: "${MESSAGE}"`);
  process.exit(0);
}

run().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
