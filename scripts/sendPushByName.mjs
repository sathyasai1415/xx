// Find a user by name (or email) and send a push to their registered device.
// Usage: node scripts/sendPushByName.mjs "jane"
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, '..', 'serviceAccountKey.json'), 'utf8'));

const NEEDLE = (process.argv[2] || 'jane').toLowerCase();
const TITLE = '🍕 MiSlice';
const BODY  = 'Hey Jane! 😍 Fresh hot pizza deals are dropping near you — tap to see them!';

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const snap = await db.collection('users').get();
  const matches = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u =>
      (u.fullName || '').toLowerCase().includes(NEEDLE) ||
      (u.email || '').toLowerCase().includes(NEEDLE));

  if (matches.length === 0) {
    console.log('❌ No user matching "' + NEEDLE + '".');
    console.log('   Users in DB:', snap.docs.map(d => `${d.data().fullName || '?'} <${d.data().email || '?'}>`).join(', '));
    process.exit(1);
  }

  for (const u of matches) {
    console.log(`\n👤 ${u.fullName || '?'} <${u.email || '?'}>  (role: ${u.role || '?'})`);
    if (!u.fcmToken) {
      console.log('   ⚠️  No fcmToken — this account has not allowed notifications in a browser.');
      continue;
    }
    console.log('   token:', u.fcmToken.slice(0, 24) + '…');
    try {
      const id = await getMessaging().send({
        token: u.fcmToken,
        notification: { title: TITLE, body: BODY },
        webpush: { fcmOptions: { link: 'https://mislice.online' } },
      });
      console.log('   ✅ Sent! Message ID:', id);
    } catch (e) {
      console.log('   ❌ Send failed:', e.code || e.message);
      if (String(e.code).includes('registration-token-not-registered')) {
        console.log('      Token is stale — re-open MiSlice and allow notifications again.');
      }
    }
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
