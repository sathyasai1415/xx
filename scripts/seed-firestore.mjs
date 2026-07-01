import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, '../mockPizzaData.json'), 'utf8'));

// ── Init Firebase Admin ────────────────────────────────────────────────────
// Option A: service account key file (recommended)
const serviceAccount = JSON.parse(readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore(); // uses (default) database in xx-1-2e007

// ── Helpers ────────────────────────────────────────────────────────────────
const batch = () => {
  let b = db.batch();
  let count = 0;
  return {
    set(ref, data) { b.set(ref, data); count++; },
    async flush() { if (count > 0) { await b.commit(); b = db.batch(); count = 0; } },
    async done() { await this.flush(); }
  };
};

// ── Seed ───────────────────────────────────────────────────────────────────
async function seed() {
  const b = batch();

  // 1. stores
  console.log(`Seeding ${data.stores.length} stores...`);
  for (const store of data.stores) {
    const { id, ...rest } = store;
    b.set(db.collection('stores').doc(id), rest);
  }
  await b.flush();

  // 2. menu items (subcollection: stores/{storeId}/menu)
  console.log(`Seeding ${data.menu_items.length} menu items...`);
  for (const item of data.menu_items) {
    const { storeId, id, ...rest } = item;
    b.set(db.collection('stores').doc(storeId).collection('menu').doc(`${storeId}-${id}`), { storeId, ...rest });
    // flush every 400 writes (Firestore batch limit is 500)
    if (data.menu_items.indexOf(item) % 400 === 399) await b.flush();
  }
  await b.flush();

  // 3. deals
  console.log(`Seeding ${data.deals.length} deals...`);
  for (const deal of data.deals) {
    const { id, ...rest } = deal;
    b.set(db.collection('deals').doc(id), rest);
  }
  await b.flush();

  // 4. users
  console.log(`Seeding ${data.users.length} users...`);
  for (const user of data.users) {
    const { uid, ...rest } = user;
    b.set(db.collection('users').doc(uid), rest);
  }
  await b.flush();

  // 5. orders
  console.log(`Seeding ${data.orders.length} orders...`);
  for (const order of data.orders) {
    const { id, ...rest } = order;
    b.set(db.collection('orders').doc(id), rest);
  }
  await b.done();

  console.log('✅ All data seeded successfully!');
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
