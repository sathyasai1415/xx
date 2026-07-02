import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(path.join(__dirname,'..','serviceAccountKey.json'),'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const snap = await db.collection('users').get();
console.log('Total user docs:', snap.size);
snap.docs.forEach(d => {
  const u = d.data();
  console.log(`- docID=${d.id.slice(0,12)}… | ${u.fullName||'?'} <${u.email||'?'}> | role=${u.role||'?'} | token=${u.fcmToken ? u.fcmToken.slice(0,18)+'…' : 'NONE'}`);
});
process.exit(0);
