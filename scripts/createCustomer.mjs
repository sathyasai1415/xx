// Create (or reset) a customer account. Usage:
//   node scripts/createCustomer.mjs "Madadi" "Madadi@gmail.com" "123456"
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(path.join(__dirname, '..', 'serviceAccountKey.json'), 'utf8'));

const NAME = process.argv[2] || 'Madadi';
const EMAIL = (process.argv[3] || 'Madadi@gmail.com').toLowerCase();
const PASSWORD = process.argv[4] || '123456';

initializeApp({ credential: cert(sa) });
const auth = getAuth();
const db = getFirestore();

async function run() {
  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
    await auth.updateUser(user.uid, { password: PASSWORD, displayName: NAME });
    console.log('Updated existing auth user:', user.uid);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      user = await auth.createUser({ email: EMAIL, password: PASSWORD, displayName: NAME });
      console.log('Created new auth user:', user.uid);
    } else { throw e; }
  }

  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: EMAIL,
    fullName: NAME,
    role: 'customer',
    phone: '',
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('✅ Customer profile written to users/' + user.uid);
  console.log('   Login:', EMAIL, '/', PASSWORD);
  process.exit(0);
}
run().catch(err => { console.error('❌', err); process.exit(1); });
