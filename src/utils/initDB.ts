import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const collections = [
  'stores', 'store_users', 'menu_categories', 'menu_items',
  'pizza_sizes', 'crusts', 'sauces', 'cheeses', 'toppings',
  'drinks', 'sides', 'desserts', 'combos', 'orders', 'order_items',
  'receipts', 'payments', 'payouts', 'deals', 'coupons',
  'refunds', 'audit_logs', 'support_tickets', 'price_verifications'
];

export async function initializeCollections() {
  console.log("Initializing all 24 required collections...");
  for (const col of collections) {
    try {
      await setDoc(doc(db, col, '_init_doc'), { init: true });
    } catch (e) {
      console.warn(`Failed to initialize ${col}`, e);
    }
  }
}
