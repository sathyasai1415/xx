import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(path.join(__dirname, '..', 'serviceAccountKey.json'), 'utf8'));

initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function run() {
  const uid = '9LU5dnnGIZMQRneU2pePb8iyWKm1'; // madadisathyasai's uid
  const snap = await db.collection('notifications').where('userId', '==', uid).get();
  console.log(`Found ${snap.size} notifications for ${uid}:`);
  snap.forEach(d => {
    console.log(d.id, d.data());
  });
  process.exit(0);
}
run().catch(err => { console.error(err); process.exit(1); });
