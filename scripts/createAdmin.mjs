// One-off: create (or reset) the platform admin account.
// Creates the Firebase Auth user and the users/{uid} Firestore doc with role 'admin'.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, '..', 'serviceAccountKey.json'), 'utf8'));

const EMAIL = 'sathyasai1415@gmail.com';
const PASSWORD = '123456';
const FULL_NAME = 'Sathya';

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore(); // (default) database — matches the web client

async function run() {
  // 1. Create or update the auth user
  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
    await auth.updateUser(user.uid, { password: PASSWORD, displayName: FULL_NAME });
    console.log('Updated existing auth user:', user.uid);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      user = await auth.createUser({ email: EMAIL, password: PASSWORD, displayName: FULL_NAME });
      console.log('Created new auth user:', user.uid);
    } else {
      throw e;
    }
  }

  // 2. Write the Firestore profile with role 'admin'
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: EMAIL,
    fullName: FULL_NAME,
    role: 'admin',
    phone: '',
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('✅ Admin profile written to users/' + user.uid);
  console.log('   Login with:', EMAIL, '/', PASSWORD);
  process.exit(0);
}

run().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
