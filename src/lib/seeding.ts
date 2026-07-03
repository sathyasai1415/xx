import { collection, doc, getDocs, writeBatch, serverTimestamp, setDoc, query, limit } from 'firebase/firestore';
import { db } from './firebase';
import mockData from '../../mockPizzaData.json';

export async function checkAndSeedDatabase() {
  if (window.location.hostname !== 'localhost' || !import.meta.env.DEV) return;

  try {
    // Check if 'stores' collection is empty
    const storesRef = collection(db, 'stores');
    const q = query(storesRef, limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      console.log('Database empty on localhost. Seeding mock data...');

      // 1. Seed stores
      for (const store of mockData.stores) {
        const { id, ...rest } = store;
        await setDoc(doc(db, 'stores', id), {
          ...rest,
          createdAt: serverTimestamp()
        }, { merge: true });
      }

      // 2. Seed menu items
      for (const item of mockData.menu_items) {
        const { storeId, id, ...rest } = item;
        await setDoc(doc(db, 'stores', storeId, 'menu', `${storeId}-${id}`), {
          ...rest,
          storeId
        }, { merge: true });
      }

      // 3. Seed deals
      for (const deal of mockData.deals) {
        const { id, ...rest } = deal;
        await setDoc(doc(db, 'deals', id), rest, { merge: true });
      }

      // 4. Seed users
      for (const user of mockData.users) {
        const { uid, ...rest } = user;
        await setDoc(doc(db, 'users', uid), rest, { merge: true });
      }

      // 5. Seed orders
      for (const order of mockData.orders) {
        const { id, ...rest } = order;
        await setDoc(doc(db, 'orders', id), rest, { merge: true });
      }

      console.log('✅ Localhost database seeded successfully!');
    }
  } catch (error) {
    console.error('Failed to seed database in development:', error);
  }
}
