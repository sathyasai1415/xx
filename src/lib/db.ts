// Firestore data service — the backend data layer for stores, menus, deals and
// orders. Keeps all collection access in one place so components stay thin.

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, onSnapshot, QueryConstraint, orderBy, limit,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Types ──────────────────────────────────────────────────────────────────--

export interface StoreDoc {
  id: string;
  store_name: string;
  city?: string;
  state?: string;
  logo_url?: string;
  brand_color?: string;
  rating_avg?: number;
  rating_count?: number;
  accepting_orders?: boolean;
  is_approved?: boolean;
  is_setup_complete?: boolean;
  application_status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  submittedAt?: unknown;
  reviewedAt?: unknown;
  rejection_reason?: string;
  review_notes?: string;
  address?: string;
  phone?: string;
  description?: string;
  delivery_fee?: number;
  delivery_radius?: number;
  minimum_order?: number;
  average_eta?: number;
  latitude?: number;
  longitude?: number;
  /** Firebase Auth UID of the store owner — used in Firestore security rules. */
  ownerUid?: string;
  /** @deprecated use ownerUid */
  ownerId?: string;
}

export interface MenuItemDoc {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  photo?: string;
  tags?: string[];
  available: boolean;
}

export interface DealDoc {
  id: string;
  store_id: string;
  title: string;
  description?: string;
  original_price?: number;
  discounted_price?: number;
  image_url?: string;
  delivery_type?: string;
  is_active: boolean;
}

export interface OrderDoc {
  id?: string;
  userId: string;
  /** Firebase Auth UID of the customer — mirrors userId but explicit for rules. */
  customerId?: string;
  storeId: string;
  storeName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  tip?: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  deliveryType: string;
  deliveryProvider?: string;
  deliveryAddress?: string;
  /** Random token printed as QR code on the order bag; verified on driver pickup. */
  qrToken?: string;
  qrScannedAt?: unknown;
  createdAt?: unknown;
}

const mapId = <T,>(d: any): T => ({ id: d.id, ...d.data() }) as T;

// ── Stores ─────────────────────────────────────────────────────────────────--

export async function getStores(): Promise<StoreDoc[]> {
  const snap = await getDocs(collection(db, 'stores'));
  return snap.docs.map(d => mapId<StoreDoc>(d));
}

/** Live listener — fires immediately and on every change. Returns unsubscribe fn. */
export function watchApprovedStores(
  onUpdate: (stores: StoreDoc[]) => void,
): () => void {
  const q = query(
    collection(db, 'stores'),
    where('is_approved', '==', true),
  );
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => mapId<StoreDoc>(d)));
  });
}

export async function getStore(storeId: string): Promise<StoreDoc | null> {
  const snap = await getDoc(doc(db, 'stores', storeId));
  return snap.exists() ? mapId<StoreDoc>(snap) : null;
}

export async function updateStore(storeId: string, patch: Partial<StoreDoc>): Promise<void> {
  await updateDoc(doc(db, 'stores', storeId), { ...patch, updatedAt: serverTimestamp() });
}

export async function submitStoreApplication(storeId: string, patch: Partial<StoreDoc>): Promise<void> {
  await setDoc(doc(db, 'stores', storeId), {
    ...patch,
    application_status: 'submitted',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * DB-backed search. Firestore has no full-text search, so we fetch the store
 * set and filter client-side by name/city — fine at marketplace scale, and a
 * clean seam to swap for Algolia/Typesense later.
 */
export async function searchStores(term: string): Promise<StoreDoc[]> {
  const stores = await getStores();
  const t = term.trim().toLowerCase();
  if (!t) return stores;
  return stores.filter(s =>
    s.store_name?.toLowerCase().includes(t) ||
    s.city?.toLowerCase().includes(t));
}

// ── Menu Items (top-level collection: menu_items) ─────────────────────────────

export async function logPriceHistory(storeId: string, menuItemId: string, price: number): Promise<void> {
  const docId = `${menuItemId}-${new Date().toISOString().replace(/:/g, '-')}`;
  await setDoc(doc(db, 'price_history', docId), {
    menuItemId,
    storeId,
    price,
    capturedAt: new Date().toISOString(),
    source: 'store_owner'
  });
}

export async function getStoreMenu(storeId: string): Promise<MenuItemDoc[]> {
  const snap = await getDocs(query(collection(db, 'menu_items'), where('storeId', '==', storeId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as MenuItemDoc);
}

export async function upsertMenuItem(storeId: string, item: Omit<MenuItemDoc, 'storeId'>): Promise<string> {
  const data = { ...item, storeId, updatedAt: serverTimestamp() };
  if (item.id) {
    await setDoc(doc(db, 'menu_items', item.id), data, { merge: true });
    await logPriceHistory(storeId, item.id, item.price);
    return item.id;
  }
  const ref = await addDoc(collection(db, 'menu_items'), { ...data, createdAt: serverTimestamp() });
  await logPriceHistory(storeId, ref.id, item.price);
  return ref.id;
}

export async function updateMenuItemPrice(storeId: string, itemId: string, price: number): Promise<void> {
  await updateDoc(doc(db, 'menu_items', itemId), { price, updatedAt: serverTimestamp() });
  await logPriceHistory(storeId, itemId, price);
}

export async function setMenuItemAvailability(storeId: string, itemId: string, available: boolean): Promise<void> {
  await updateDoc(doc(db, 'menu_items', itemId), { available, updatedAt: serverTimestamp() });
}

export async function deleteMenuItem(storeId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'menu_items', itemId));
}

// ── Deals ──────────────────────────────────────────────────────────────────--

export async function getActiveDeals(): Promise<DealDoc[]> {
  const snap = await getDocs(query(collection(db, 'deals'), where('is_active', '==', true)));
  return snap.docs.map(d => mapId<DealDoc>(d));
}

export async function getStoreDeals(storeId: string): Promise<DealDoc[]> {
  const snap = await getDocs(query(collection(db, 'deals'), where('store_id', '==', storeId)));
  return snap.docs.map(d => mapId<DealDoc>(d));
}

export async function upsertDeal(deal: Omit<DealDoc, 'id'> & { id?: string }): Promise<string> {
  if (deal.id) {
    await setDoc(doc(db, 'deals', deal.id), { ...deal, updatedAt: serverTimestamp() }, { merge: true });
    return deal.id;
  }
  const ref = await addDoc(collection(db, 'deals'), { ...deal, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteDeal(dealId: string): Promise<void> {
  await deleteDoc(doc(db, 'deals', dealId));
}

// ── Orders ─────────────────────────────────────────────────────────────────--

function generateQrToken(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

export async function createOrder(order: OrderDoc): Promise<string> {
  const enriched = {
    ...order,
    customerId: order.customerId ?? order.userId,
    qrToken: generateQrToken(),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'orders'), enriched);
  return ref.id;
}

// Sort client-side by createdAt to avoid requiring a composite Firestore index.
const byCreatedDesc = <T extends { createdAt?: string }>(a: T, b: T) =>
  String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));

export async function getUserOrders(userId: string): Promise<OrderDoc[]> {
  const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId)));
  return snap.docs.map(d => mapId<OrderDoc>(d)).sort(byCreatedDesc as any);
}

export async function getStoreOrders(storeId: string): Promise<OrderDoc[]> {
  const snap = await getDocs(query(collection(db, 'orders'), where('storeId', '==', storeId)));
  return snap.docs.map(d => mapId<OrderDoc>(d)).sort(byCreatedDesc as any);
}

export async function updateOrderStatus(orderId: string, status: OrderDoc['status']): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
}

// Customer orders use the rich `orderStatus` field ('placed' | 'preparing' | …).
export async function setOrderStatus(orderId: string, orderStatus: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { orderStatus, updatedAt: serverTimestamp() });
}

// Patch arbitrary fields on an order (e.g. prep time, accepted flag).
export async function updateOrderFields(orderId: string, patch: Record<string, any>): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { ...patch, updatedAt: serverTimestamp() });
}

// Raw live subscription to a store's orders (rich customer Order shape).
export function watchStoreRichOrders(storeId: string, cb: (orders: any[]) => void) {
  return onSnapshot(query(collection(db, 'orders'), where('storeId', '==', storeId)), (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/** Live subscription to a store's incoming orders (for the owner dashboard). */
export function watchStoreOrders(storeId: string, cb: (orders: OrderDoc[]) => void) {
  const constraints: QueryConstraint[] = [where('storeId', '==', storeId)];
  return onSnapshot(query(collection(db, 'orders'), ...constraints), (snap) => {
    cb(snap.docs.map(d => mapId<OrderDoc>(d)));
  });
}

// ── Per-user persistence: cart + saved pizzas (stored on users/{uid}) ─────────
// These keep the existing app data shapes; we just persist them server-side so
// they follow the signed-in account across devices instead of localStorage.

export interface UserData {
  cart?: any[];
  savedPizzas?: any[];
}

export async function getUserData(uid: string): Promise<UserData> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.exists() ? userSnap.data() as any : {};
  
  // Fetch user favorites from the decoupled 'favorites' collection
  const favsSnap = await getDocs(query(collection(db, 'favorites'), where('userId', '==', uid)));
  const savedPizzas = favsSnap.docs.map(d => {
    const data = d.data();
    if (data.config) {
      return { id: d.id, name: data.name || 'Saved Pizza', config: data.config };
    }
    return { id: d.id, menuItemId: data.menuItemId, storeId: data.storeId, createdAt: data.createdAt };
  });

  return { cart: userData.cart ?? [], savedPizzas };
}

export async function saveUserCart(uid: string, cart: any[]): Promise<void> {
  await setDoc(doc(db, 'users', uid), { cart, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveUserSavedPizzas(uid: string, savedPizzas: any[]): Promise<void> {
  // 1. Delete all existing favorites for this user
  const snap = await getDocs(query(collection(db, 'favorites'), where('userId', '==', uid)));
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }

  // 2. Write new favorites
  for (const fav of savedPizzas) {
    const docId = fav.id || `${uid}-${fav.menuItemId || Math.random().toString(36).slice(2, 9)}`;
    await setDoc(doc(db, 'favorites', docId), {
      userId: uid,
      menuItemId: fav.menuItemId || null,
      storeId: fav.storeId || null,
      config: fav.config || null,
      name: fav.name || null,
      createdAt: fav.createdAt || serverTimestamp(),
    }, { merge: true });
  }
}

// ── Rich customer order persistence (the app's full Order shape) ──────────────
// Stored in the `orders` collection so customers see history and store owners
// can read orders for their store (enforced by security rules).

export async function saveCustomerOrder(order: any): Promise<string> {
  const enriched = {
    ...order,
    customerId: order.customerId ?? order.userId,
    qrToken: order.qrToken ?? generateQrToken(),
  };
  const ref = await addDoc(collection(db, 'orders'), enriched);
  return ref.id;
}

export async function getCustomerOrders(uid: string): Promise<any[]> {
  // Indexed server-side sort + limit: fast and scalable. Served instantly from
  // the local cache on repeat visits, synced in the background.
  const snap = await getDocs(query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(50),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Live subscription to a customer's own orders. Fires immediately from the
 * local cache, then pushes real-time updates as order status changes — so the
 * order list and tracking screen update without a manual refetch.
 * Returns an unsubscribe function.
 */
export function watchCustomerOrders(uid: string, cb: (orders: any[]) => void): () => void {
  return onSnapshot(query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(50),
  ), (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('watchCustomerOrders failed', err);
  });
}
