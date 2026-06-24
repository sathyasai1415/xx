/**
 * Seed script — run once to:
 *   1. Promote a Firebase Auth user to admin role
 *   2. Create initial platform coupons
 *   3. Backfill ownerUid on existing store docs
 *
 * Usage:
 *   node scripts/seed-admin.mjs <admin-email>
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account
 * JSON key with Firestore + Firebase Auth admin access.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/seed-admin.mjs <admin-email>');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ?? '{}')) });

const auth = getAuth();
const db = getFirestore();
db.settings({ databaseId: 'pizza' });

async function main() {
  // 1. Promote user to admin
  const user = await auth.getUserByEmail(email);
  await db.collection('users').doc(user.uid).set(
    { role: 'admin', email, updatedAt: new Date() },
    { merge: true }
  );
  console.log(`✅ ${email} (${user.uid}) promoted to admin`);

  // 2. Seed platform coupons (idempotent)
  const coupons = [
    { code: 'MILAUNCH', description: '10% off your first order', discountType: 'percentage', discountValue: 10, active: true },
    { code: 'MIFREESHIP', description: 'Free delivery on orders $20+', discountType: 'free_delivery', discountValue: 0, active: true },
    { code: 'MIMICH5', description: '$5 off orders over $30', discountType: 'fixed', discountValue: 5, active: true },
  ];
  for (const coupon of coupons) {
    await db.collection('coupons').doc(coupon.code).set(coupon, { merge: true });
    console.log(`✅ Coupon ${coupon.code} seeded`);
  }

  // 3. Backfill ownerUid on stores that have ownerId but not ownerUid
  const storesSnap = await db.collection('stores').get();
  for (const storeDoc of storesSnap.docs) {
    const data = storeDoc.data();
    if (data.ownerId && !data.ownerUid) {
      await storeDoc.ref.update({ ownerUid: data.ownerId });
      console.log(`✅ Backfilled ownerUid on store ${storeDoc.id}`);
    }
  }

  console.log('\n🎉 Seeding complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
