// Firestore data service — the backend data layer for stores, menus, deals and
// orders. Keeps all collection access in one place so components stay thin.

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, onSnapshot, QueryConstraint,
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
  latitude?: number;
  longitude?: number;
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
  createdAt?: unknown;
}

const mapId = <T,>(d: any): T => ({ id: d.id, ...d.data() }) as T;

// ── Stores ─────────────────────────────────────────────────────────────────--

export async function getStores(): Promise<StoreDoc[]> {
  const snap = await getDocs(collection(db, 'stores'));
  return snap.docs.map(d => mapId<StoreDoc>(d));
}

export async function getStore(storeId: string): Promise<StoreDoc | null> {
  const snap = await getDoc(doc(db, 'stores', storeId));
  return snap.exists() ? mapId<StoreDoc>(snap) : null;
}

export async function updateStore(storeId: string, patch: Partial<StoreDoc>): Promise<void> {
  await updateDoc(doc(db, 'stores', storeId), { ...patch, updatedAt: serverTimestamp() });
}

export async function submitStoreApplication(storeId: string, patch: Partial<StoreDoc>): Promise<void> {
  await updateDoc(doc(db, 'stores', storeId), {
    ...patch,
    application_status: 'submitted',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
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

// ── Menu (subcollection: stores/{storeId}/menu) ───────────────────────────────

export async function getStoreMenu(storeId: string): Promise<MenuItemDoc[]> {
  const snap = await getDocs(collection(db, 'stores', storeId, 'menu'));
  return snap.docs.map(d => ({ id: d.id, storeId, ...d.data() }) as MenuItemDoc);
}

export async function upsertMenuItem(storeId: string, item: Omit<MenuItemDoc, 'storeId'>): Promise<string> {
  if (item.id) {
    await setDoc(doc(db, 'stores', storeId, 'menu', item.id), { ...item, updatedAt: serverTimestamp() }, { merge: true });
    return item.id;
  }
  const ref = await addDoc(collection(db, 'stores', storeId, 'menu'), { ...item, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateMenuItemPrice(storeId: string, itemId: string, price: number): Promise<void> {
  await updateDoc(doc(db, 'stores', storeId, 'menu', itemId), { price, updatedAt: serverTimestamp() });
}

export async function setMenuItemAvailability(storeId: string, itemId: string, available: boolean): Promise<void> {
  await updateDoc(doc(db, 'stores', storeId, 'menu', itemId), { available, updatedAt: serverTimestamp() });
}

export async function deleteMenuItem(storeId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'stores', storeId, 'menu', itemId));
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

export async function createOrder(order: OrderDoc): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), { ...order, createdAt: serverTimestamp() });
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
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return {};
  const data = snap.data() as any;
  return { cart: data.cart ?? [], savedPizzas: data.savedPizzas ?? [] };
}

export async function saveUserCart(uid: string, cart: any[]): Promise<void> {
  await setDoc(doc(db, 'users', uid), { cart, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveUserSavedPizzas(uid: string, savedPizzas: any[]): Promise<void> {
  await setDoc(doc(db, 'users', uid), { savedPizzas, updatedAt: serverTimestamp() }, { merge: true });
}

// ── Rich customer order persistence (the app's full Order shape) ──────────────
// Stored in the `orders` collection so customers see history and store owners
// can read orders for their store (enforced by security rules).

export async function saveCustomerOrder(order: any): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), order);
  return ref.id;
}

export async function getCustomerOrders(uid: string): Promise<any[]> {
  const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(byCreatedDesc as any);
}
