// Seeding script for production-ready, decoupled Firestore schema.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, '..', 'serviceAccountKey.json'), 'utf8'));

const ADMIN_EMAIL = 'sathyasai1415@gmail.com';
const ADMIN_PASSWORD = '123456';
const ADMIN_NAME = 'Sathya';

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore(); // uses the default database

// Helper to batch writes
const batch = () => {
  let b = db.batch();
  let count = 0;
  return {
    set(ref, data) {
      b.set(ref, data, { merge: true });
      count++;
    },
    async flush() {
      if (count > 0) {
        await b.commit();
        b = db.batch();
        count = 0;
      }
    },
    async done() {
      await this.flush();
    }
  };
};

const dateStr = (daysAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

async function main() {
  console.log('🚀 Starting production database seeding...');

  // 1. Create or reset admin in Firebase Auth
  let adminUser;
  try {
    adminUser = await auth.getUserByEmail(ADMIN_EMAIL);
    await auth.updateUser(adminUser.uid, { password: ADMIN_PASSWORD, displayName: ADMIN_NAME });
    console.log('✅ Admin user updated in Firebase Auth:', adminUser.uid);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      adminUser = await auth.createUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, displayName: ADMIN_NAME });
      console.log('✅ Admin user created in Firebase Auth:', adminUser.uid);
    } else {
      throw e;
    }
  }

  const b = batch();

  // 2. Seed Roles collection
  console.log('Seeding roles...');
  const roles = [
    { roleId: 'admin', permissions: ['manage_users', 'manage_stores', 'manage_deals', 'view_orders', 'view_audit_logs'] },
    { roleId: 'super_admin', permissions: ['all'] },
    { roleId: 'store_owner', permissions: ['manage_store_menu', 'manage_store_deals', 'view_store_orders'] },
    { roleId: 'customer', permissions: ['create_orders', 'manage_favorites'] },
    { roleId: 'delivery_partner', permissions: ['view_assigned_deliveries', 'update_delivery_status'] },
  ];
  for (const r of roles) {
    b.set(db.collection('roles').doc(r.roleId), r);
  }
  await b.flush();

  // 3. Seed Users collection
  console.log('Seeding users...');
  // Include the admin, mock store owners, and mock customers
  const users = [
    {
      uid: adminUser.uid,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: '+1 555-0100',
      photoURL: '',
      role: 'admin',
      createdAt: dateStr(10),
      lastLogin: dateStr(0),
      isActive: true
    },
    // Store owners
    {
      uid: 'store_owner_1',
      name: 'Mario Owner',
      email: 'mario@store.com',
      phone: '+1 555-0200',
      photoURL: '',
      role: 'store_owner',
      createdAt: dateStr(20),
      lastLogin: dateStr(0),
      isActive: true
    },
    {
      uid: 'store_owner_2',
      name: 'Zumbo Owner',
      email: 'zumbo@store.com',
      phone: '+1 555-0300',
      photoURL: '',
      role: 'store_owner',
      createdAt: dateStr(20),
      lastLogin: dateStr(0),
      isActive: true
    },
    {
      uid: 'store_owner_3',
      name: 'Rambo Owner',
      email: 'rambo@store.com',
      phone: '+1 555-0400',
      photoURL: '',
      role: 'store_owner',
      createdAt: dateStr(20),
      lastLogin: dateStr(0),
      isActive: true
    },
    // Active customers
    {
      uid: 'uk0c7x07UrOCBXfikZ8syURFVQu2',
      name: 'Sathya Sai',
      email: 'sathyasai1415@gmail.com',
      phone: '+1 555-0001',
      photoURL: '',
      role: 'customer',
      createdAt: dateStr(30),
      lastLogin: dateStr(0),
      isActive: true
    },
    {
      uid: 'hpA0uxL0RcOzYbEPfwu4wg3Lqhs1',
      name: 'Jane Doe',
      email: 'jane@email.com',
      phone: '+1 555-0002',
      photoURL: '',
      role: 'customer',
      createdAt: dateStr(30),
      lastLogin: dateStr(1),
      isActive: true
    }
  ];
  for (const u of users) {
    b.set(db.collection('users').doc(u.uid), u);
  }
  await b.flush();

  // 4. Seed Categories collection
  console.log('Seeding categories...');
  const categories = [
    { categoryId: 'CAT_PIZZA', name: 'Pizza', icon: '🍕', active: true },
    { categoryId: 'CAT_SPECIALS', name: 'Specials', icon: '🏷️', active: true },
    { categoryId: 'CAT_SIDES', name: 'Sides', icon: '🍟', active: true },
    { categoryId: 'CAT_DRINKS', name: 'Drinks', icon: '🥤', active: true },
    { categoryId: 'CAT_DESSERTS', name: 'Desserts', icon: '🍰', active: true },
  ];
  for (const c of categories) {
    b.set(db.collection('categories').doc(c.categoryId), c);
  }
  await b.flush();

  // 5. Seed Stores collection
  console.log('Seeding stores...');
  const stores = [
    {
      storeId: 'marios-pizza',
      name: "Mario's Pizza",
      brand: "Mario's",
      address: '36700 Farmington Rd',
      city: 'Farmington',
      state: 'Michigan',
      zip: '48335',
      phone: '+1 (555) 123-4567',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
      rating: 4.8,
      reviewCount: 120,
      deliveryFee: 4.99,
      minimumOrder: 15.00,
      deliveryTime: '30-45',
      open: true,
      ownerUid: 'store_owner_1',
      createdAt: dateStr(20)
    },
    {
      storeId: 'zumbos-pizza',
      name: "Zumbo's Pizza",
      brand: "Zumbo's",
      address: '502 E Liberty St',
      city: 'Ann Arbor',
      state: 'Michigan',
      zip: '48104',
      phone: '+1 (555) 789-0123',
      image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=60',
      rating: 4.6,
      reviewCount: 85,
      deliveryFee: 3.99,
      minimumOrder: 12.00,
      deliveryTime: '25-40',
      open: true,
      ownerUid: 'store_owner_2',
      createdAt: dateStr(20)
    },
    {
      storeId: 'rambos-pizza',
      name: "Rambo's Pizza",
      brand: "Rambo's",
      address: '100 Broadway St',
      city: 'Detroit',
      state: 'Michigan',
      zip: '48226',
      phone: '+1 (555) 456-7890',
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
      rating: 4.7,
      reviewCount: 42,
      deliveryFee: 5.00,
      minimumOrder: 10.00,
      deliveryTime: '20-35',
      open: true,
      ownerUid: 'store_owner_3',
      createdAt: dateStr(20)
    }
  ];
  for (const s of stores) {
    b.set(db.collection('stores').doc(s.storeId), s);
  }
  await b.flush();

  // 6. Seed Store Locations
  console.log('Seeding store locations...');
  const locations = [
    { storeId: 'marios-pizza', latitude: 42.4842, longitude: -83.3758, deliveryRadius: 8.0, geohash: 'dps4f' },
    { storeId: 'zumbos-pizza', latitude: 42.2798, longitude: -83.7420, deliveryRadius: 6.0, geohash: 'dps1a' },
    { storeId: 'rambos-pizza', latitude: 42.3314, longitude: -83.0458, deliveryRadius: 5.0, geohash: 'dps1d' },
  ];
  for (const loc of locations) {
    b.set(db.collection('store_locations').doc(loc.storeId), loc);
  }
  await b.flush();

  // 7. Seed Menu Items collection (top-level!)
  console.log('Seeding menu items...');
  const menuItems = [
    // Mario's menu items
    {
      itemId: 'marios-pepperoni',
      storeId: 'marios-pizza',
      category: 'Pizza',
      name: 'Pepperoni Pizza',
      description: 'Classic hand-tossed with pepperoni and extra mozzarella',
      size: 'Large',
      price: 16.99,
      currency: 'USD',
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60',
      available: true,
      calories: 320,
      tags: ['Popular'],
      updatedAt: dateStr(1)
    },
    {
      itemId: 'marios-cheese',
      storeId: 'marios-pizza',
      category: 'Pizza',
      name: 'Cheese Pizza',
      description: 'Simple and delicious mozzarella blend',
      size: 'Large',
      price: 13.99,
      currency: 'USD',
      image: '',
      available: true,
      calories: 280,
      tags: [],
      updatedAt: dateStr(1)
    },
    {
      itemId: 'marios-wings',
      storeId: 'marios-pizza',
      category: 'Sides',
      name: 'Garlic Parmesan Wings (8pc)',
      description: 'Oven-baked chicken wings tossed in garlic parmesan sauce',
      size: 'Regular',
      price: 11.99,
      currency: 'USD',
      image: '',
      available: true,
      calories: 450,
      tags: ['Popular'],
      updatedAt: dateStr(1)
    },

    // Zumbo's menu items
    {
      itemId: 'zumbo-chicken-parm',
      storeId: 'zumbos-pizza',
      category: 'Pizza',
      name: 'Chicken Parmesan Pizza',
      description: 'Specialty pizza with chicken cutlet, marinara sauce, fresh basil, and shaved parmesan',
      size: 'Large',
      price: 18.99,
      currency: 'USD',
      image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=60',
      available: true,
      calories: 380,
      tags: ['Specialty', 'Popular'],
      updatedAt: dateStr(1)
    },
    {
      itemId: 'zumbo-margherita',
      storeId: 'zumbos-pizza',
      category: 'Pizza',
      name: 'Classic Margherita',
      description: 'Tomato sauce, fresh mozzarella, fresh basil, extra virgin olive oil',
      size: 'Large',
      price: 15.99,
      currency: 'USD',
      image: '',
      available: true,
      calories: 260,
      tags: ['Vegetarian'],
      updatedAt: dateStr(1)
    },

    // Rambo's menu items
    {
      itemId: 'rambo-meat-lovers',
      storeId: 'rambos-pizza',
      category: 'Pizza',
      name: 'Meat Lovers Pizza',
      description: 'Loaded with pepperoni, sausage, ham, bacon, and ground beef',
      size: 'Large',
      price: 19.99,
      currency: 'USD',
      image: '',
      available: true,
      calories: 420,
      tags: ['Popular', 'Spicy'],
      updatedAt: dateStr(1)
    },
    {
      itemId: 'rambo-veggie',
      storeId: 'rambos-pizza',
      category: 'Pizza',
      name: 'Veggie Supreme',
      description: 'Bell peppers, red onion, mushrooms, black olives, spinach',
      size: 'Large',
      price: 16.99,
      currency: 'USD',
      image: '',
      available: true,
      calories: 240,
      tags: ['Vegetarian'],
      updatedAt: dateStr(1)
    }
  ];
  for (const item of menuItems) {
    b.set(db.collection('menu_items').doc(item.itemId), item);
  }
  await b.flush();

  // 8. Seed Price History collection
  console.log('Seeding price history logs...');
  const histories = [
    { menuItemId: 'marios-pepperoni', storeId: 'marios-pizza', price: 17.99, capturedAt: dateStr(15), source: 'store_owner' },
    { menuItemId: 'marios-pepperoni', storeId: 'marios-pizza', price: 16.99, capturedAt: dateStr(1), source: 'store_owner' },
    { menuItemId: 'zumbo-chicken-parm', storeId: 'zumbos-pizza', price: 19.99, capturedAt: dateStr(15), source: 'store_owner' },
    { menuItemId: 'zumbo-chicken-parm', storeId: 'zumbos-pizza', price: 18.99, capturedAt: dateStr(1), source: 'store_owner' },
  ];
  for (const h of histories) {
    const docId = `${h.menuItemId}-${h.capturedAt.replace(/:/g, '-')}`;
    b.set(db.collection('price_history').doc(docId), h);
  }
  await b.flush();

  // 9. Seed Deals collection
  console.log('Seeding deals...');
  const deals = [
    {
      dealId: 'deal-rambo-001',
      storeId: 'rambos-pizza',
      title: '4 Pizzas for $3',
      description: 'Try the electric best deal from Rambo’s Pizza. Select 4 base pizzas for only $3.',
      discountType: 'BOGO',
      discountValue: 3.00,
      startDate: dateStr(2),
      endDate: dateStr(-10),
      active: true
    },
    {
      dealId: 'deal-mario-001',
      storeId: 'marios-pizza',
      title: 'Free Garlic Bread',
      description: 'Free Garlic Bread with any Large Specialty Pizza purchase.',
      discountType: 'FREE_ITEM',
      discountValue: 4.99,
      startDate: dateStr(1),
      endDate: dateStr(-30),
      active: true
    }
  ];
  for (const d of deals) {
    b.set(db.collection('deals').doc(d.dealId), d);
  }
  await b.flush();

  // 10. Seed User Preferences
  console.log('Seeding user preferences...');
  const preferences = [
    { userId: 'uk0c7x07UrOCBXfikZ8syURFVQu2', dietary: [], preferredSize: 'Large', notificationSettings: { email: true, push: true } },
    { userId: 'hpA0uxL0RcOzYbEPfwu4wg3Lqhs1', dietary: ['Vegetarian'], preferredSize: 'Medium', notificationSettings: { email: true, push: false } },
  ];
  for (const pref of preferences) {
    b.set(db.collection('user_preferences').doc(pref.userId), pref);
  }
  await b.flush();

  // 11. Seed Favorites (decoupled from user doc!)
  console.log('Seeding user favorites...');
  const favorites = [
    { userId: 'uk0c7x07UrOCBXfikZ8syURFVQu2', menuItemId: 'marios-pepperoni', storeId: 'marios-pizza', createdAt: dateStr(5) },
    { userId: 'uk0c7x07UrOCBXfikZ8syURFVQu2', menuItemId: 'zumbo-chicken-parm', storeId: 'zumbos-pizza', createdAt: dateStr(2) }
  ];
  for (const fav of favorites) {
    const docId = `${fav.userId}-${fav.menuItemId}`;
    b.set(db.collection('favorites').doc(docId), fav);
  }
  await b.flush();

  // 12. Seed Reviews
  console.log('Seeding reviews...');
  const reviews = [
    { reviewId: 'rev-001', userId: 'uk0c7x07UrOCBXfikZ8syURFVQu2', storeId: 'marios-pizza', menuItemId: 'marios-pepperoni', rating: 5, review: 'Absolute perfection! Crust was crispy, sauce was fantastic.', createdAt: dateStr(5) },
    { reviewId: 'rev-002', userId: 'hpA0uxL0RcOzYbEPfwu4wg3Lqhs1', storeId: 'zumbos-pizza', menuItemId: 'zumbo-chicken-parm', rating: 4, review: 'Really tasty chicken parm pizza. Shaved parm on top was delicious.', createdAt: dateStr(3) }
  ];
  for (const rev of reviews) {
    b.set(db.collection('reviews').doc(rev.reviewId), rev);
  }
  await b.flush();

  // 13. Seed Orders
  console.log('Seeding past orders...');
  const orders = [
    {
      orderId: 'ORD1001',
      userId: 'uk0c7x07UrOCBXfikZ8syURFVQu2',
      customerId: 'uk0c7x07UrOCBXfikZ8syURFVQu2',
      storeId: 'zumbos-pizza',
      storeName: "Zumbo's Pizza",
      items: [
        { name: 'Chicken Parmesan Pizza', qty: 1, quantity: 1, price: 18.99 }
      ],
      subtotal: 18.99,
      deliveryFee: 3.99,
      tax: 1.14,
      total: 24.12,
      finalTotal: 24.12,
      status: 'DELIVERED',
      orderStatus: 'delivered',
      paymentStatus: 'Paid',
      paymentMethod: 'Credit Card',
      createdAt: dateStr(15) // June 15
    },
    {
      orderId: 'ORD1002',
      userId: 'uk0c7x07UrOCBXfikZ8syURFVQu2',
      customerId: 'uk0c7x07UrOCBXfikZ8syURFVQu2',
      storeId: 'zumbos-pizza',
      storeName: "Zumbo's Pizza",
      items: [
        { name: 'Chicken Parmesan Pizza', qty: 1, quantity: 1, price: 18.99 }
      ],
      subtotal: 18.99,
      deliveryFee: 3.99,
      tax: 1.14,
      total: 24.12,
      finalTotal: 24.12,
      status: 'DELIVERED',
      orderStatus: 'delivered',
      paymentStatus: 'Paid',
      paymentMethod: 'Google Pay',
      createdAt: dateStr(8) // June 22
    },
    {
      orderId: 'ORD1003',
      userId: 'uk0c7x07UrOCBXfikZ8syURFVQu2',
      customerId: 'uk0c7x07UrOCBXfikZ8syURFVQu2',
      storeId: 'zumbos-pizza',
      storeName: "Zumbo's Pizza",
      items: [
        { name: 'Chicken Parmesan Pizza', qty: 1, quantity: 1, price: 18.99 }
      ],
      subtotal: 18.99,
      deliveryFee: 3.99,
      tax: 1.14,
      total: 24.12,
      finalTotal: 24.12,
      status: 'DELIVERED',
      orderStatus: 'delivered',
      paymentStatus: 'Paid',
      paymentMethod: 'Apple Pay',
      createdAt: dateStr(1) // June 29
    }
  ];
  for (const ord of orders) {
    b.set(db.collection('orders').doc(ord.orderId), ord);
  }
  await b.flush();

  // 14. Seed Notifications
  console.log('Seeding notifications...');
  const notifications = [
    { notificationId: 'not-001', userId: 'uk0c7x07UrOCBXfikZ8syURFVQu2', title: 'Welcome to MiSlice!', message: 'Explore local pizzas and find the best deals in Michigan.', read: false, createdAt: dateStr(10) },
    { notificationId: 'not-002', userId: 'uk0c7x07UrOCBXfikZ8syURFVQu2', title: 'Order Delivered 🎉', message: 'Your order #ORD1003 has been delivered.', read: true, createdAt: dateStr(1) }
  ];
  for (const n of notifications) {
    b.set(db.collection('notifications').doc(n.notificationId), n);
  }
  await b.flush();

  // 15. Seed Audit Logs
  console.log('Seeding administrative audit logs...');
  const logs = [
    { logId: 'log-001', userId: adminUser.uid, action: 'Promoted user to Admin', collection: 'users', documentId: adminUser.uid, oldValue: 'customer', newValue: 'admin', timestamp: dateStr(10) },
    { logId: 'log-002', userId: adminUser.uid, action: 'Created deals template', collection: 'deals', documentId: 'deal-rambo-001', oldValue: null, newValue: 'Buy 4 for $3', timestamp: dateStr(2) }
  ];
  for (const l of logs) {
    b.set(db.collection('audit_logs').doc(l.logId), l);
  }
  await b.flush();

  // 16. Seed Reports
  console.log('Seeding reports...');
  const reports = [
    { reportId: 'rep-001', userId: 'hpA0uxL0RcOzYbEPfwu4wg3Lqhs1', storeId: 'marios-pizza', menuItemId: 'marios-pepperoni', issue: 'incorrect_price', description: 'Menu price is showing $16.99 but it was listed as $15.99 on the website.', createdAt: dateStr(3), status: 'pending' }
  ];
  for (const r of reports) {
    b.set(db.collection('reports').doc(r.reportId), r);
  }

  await b.done();
  console.log('🎉 Seeding complete! Database is set up.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
