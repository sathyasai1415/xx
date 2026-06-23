import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Pizza, Tag, Store, LogOut, Plus, Trash2, Edit2, Check, X,
  DollarSign, ShoppingBag, Power, Loader2, Clock, MapPin, Phone, Save,
  BarChart3, Wallet, TrendingUp, Timer, Menu,
} from 'lucide-react';
import {
  StoreDoc, MenuItemDoc, DealDoc,
  getStore, updateStore, getStoreMenu, upsertMenuItem, updateMenuItemPrice,
  setMenuItemAvailability, deleteMenuItem, getStoreDeals, upsertDeal, deleteDeal,
  watchStoreRichOrders, setOrderStatus, updateOrderFields,
} from '../lib/db';
import { AdminOnboarding } from './admin/AdminOnboarding';

interface Props {
  storeId: string;
  storeName: string;
  onLogout: () => void;
}

type Tab = 'overview' | 'orders' | 'menu' | 'deals' | 'insights' | 'earnings' | 'profile';

const CATEGORIES = ['Pizza', 'Specials', 'Sides', 'Toppings', 'Drinks', 'Desserts'];
const ORDER_STAGES = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PLATFORM_FEE_RATE = 0.15; // marketplace commission used for earnings math
const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'menu', label: 'Menu & Prices', icon: Pizza },
  { id: 'deals', label: 'Deals', icon: Tag },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'profile', label: 'Store Profile', icon: Store },
];

export function StoreOwnerDashboard({ storeId, storeName, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [store, setStore] = useState<StoreDoc | null>(null);
  const [menu, setMenu] = useState<MenuItemDoc[]>([]);
  const [deals, setDeals] = useState<DealDoc[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const flash = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); }, []);

  const reloadStore = useCallback(async () => {
    try {
      const s = await getStore(storeId);
      setStore(s);
    } catch (e) {
      console.error(e);
    }
  }, [storeId]);

  const reloadMenu = useCallback(async () => setMenu(await getStoreMenu(storeId)), [storeId]);
  const reloadDeals = useCallback(async () => setDeals(await getStoreDeals(storeId)), [storeId]);

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    (async () => {
      try {
        const [s, m, d] = await Promise.all([getStore(storeId), getStoreMenu(storeId), getStoreDeals(storeId)]);
        if (!active) return;
        setStore(s);
        setMenu(m);
        setDeals(d);
      } catch (e) { console.error(e); }
      finally { if (active) setLoading(false); }
    })();
    const unsub = watchStoreRichOrders(storeId, (o) => setOrders(o));
    return () => { active = false; unsub(); };
  }, [storeId]);

  const toggleAccepting = async () => {
    const next = !(store?.accepting_orders ?? true);
    setStore(s => s ? { ...s, accepting_orders: next } : s);
    await updateStore(storeId, { accepting_orders: next });
    flash(next ? 'Now accepting orders' : 'Orders paused');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#080808]">
        <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
      </div>
    );
  }

  const storeIsApproved = store?.application_status === 'approved' || store?.is_approved === true;

  if (store && !storeIsApproved) {
    return (
      <div className="min-h-screen w-full bg-[#080808] text-stone-100 px-6 py-10">
        <AdminOnboarding storeData={store} onComplete={reloadStore} onLogout={onLogout} />
      </div>
    );
  }

  const goTab = (t: Tab) => { setTab(t); setSidebarOpen(false); };

  return (
    <div className="min-h-screen w-full bg-[#080808] text-stone-100 lg:flex">

      {/* ── Mobile top bar ───────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-50 bg-[#0b0b0b] border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} aria-label="Open menu"
          className="p-2 rounded-xl hover:bg-white/8 transition-colors">
          <Menu className="w-5 h-5 text-stone-300" />
        </button>
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shrink-0">
          <Store className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate">{store?.store_name || storeName}</p>
        </div>
        <button onClick={toggleAccepting}
          className={`text-[9px] font-black px-2.5 py-1 rounded-full border shrink-0 ${
            (store?.accepting_orders ?? true) ? 'bg-green-500/15 text-green-400 border-green-500/25' : 'bg-stone-500/15 text-stone-500 border-white/10'
          }`}>
          {(store?.accepting_orders ?? true) ? '● OPEN' : '● PAUSED'}
        </button>
      </div>

      {/* ── Mobile sidebar backdrop ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-60 shrink-0
        bg-[#0b0b0b] border-r border-white/8 flex flex-col
        transition-transform duration-300
        lg:static lg:translate-x-0 lg:h-screen lg:sticky lg:top-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white truncate">{store?.store_name || storeName}</p>
            <p className="text-[9px] text-stone-600 font-bold uppercase tracking-widest">Store Dashboard</p>
          </div>
          {/* Mobile close */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/8 transition-colors">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => goTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === id ? 'bg-gradient-to-r from-red-600/90 to-orange-600/70 text-white' : 'text-stone-400 hover:bg-white/6 hover:text-white'
              }`}>
              <Icon className="w-4 h-4 shrink-0" /> {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/8">
          <button onClick={toggleAccepting}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black mb-2 transition-colors ${
              (store?.accepting_orders ?? true) ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-stone-500/15 text-stone-400 border border-white/10'
            }`}>
            <Power className="w-3.5 h-3.5" /> {(store?.accepting_orders ?? true) ? 'Accepting Orders' : 'Orders Paused'}
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {tab === 'overview' && <Overview store={store} menu={menu} deals={deals} orders={orders} onGoOrders={() => goTab('orders')} />}
          {tab === 'orders' && <Orders orders={orders} flash={flash} />}
          {tab === 'menu' && <MenuManager storeId={storeId} menu={menu} reload={reloadMenu} flash={flash} setMenu={setMenu} />}
          {tab === 'deals' && <DealsManager storeId={storeId} deals={deals} reload={reloadDeals} flash={flash} />}
          {tab === 'insights' && <Insights orders={orders} />}
          {tab === 'earnings' && <Earnings orders={orders} />}
          {tab === 'profile' && store && <Profile storeId={storeId} store={store} setStore={setStore} flash={flash} />}
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

function Overview({ store, menu, deals, orders, onGoOrders }: { store: StoreDoc | null; menu: MenuItemDoc[]; deals: DealDoc[]; orders: any[]; onGoOrders: () => void }) {
  const today = new Date().toDateString();
  const todays = orders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === today);
  const revenue = orders.reduce((s, o) => s + (Number(o.finalTotal ?? o.total) || 0), 0);
  const pending = orders.filter(o => (o.orderStatus ?? o.status ?? 'placed') === 'placed');
  const stats = [
    { label: 'Orders Today', value: todays.length, icon: ShoppingBag, color: 'text-red-400' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-400' },
    { label: 'Revenue', value: money(revenue), icon: DollarSign, color: 'text-green-400' },
    { label: 'Menu Items', value: menu.length, icon: Pizza, color: 'text-red-400' },
  ];
  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-1">Welcome back 👋</h1>
      <p className="text-sm text-stone-500 mb-6">Here's what's happening at {store?.store_name}.</p>

      {pending.length > 0 && (
        <button onClick={onGoOrders}
          className="w-full mb-6 bg-gradient-to-r from-orange-600/20 to-red-600/15 border border-orange-500/30 rounded-2xl px-5 py-4 flex items-center justify-between text-left hover:border-orange-500/50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
            </span>
            <p className="text-sm font-black text-white">{pending.length} new order{pending.length !== 1 ? 's' : ''} need action</p>
          </div>
          <span className="text-xs font-bold text-red-300">Review →</span>
        </button>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[11px] text-stone-500 font-bold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <h2 className="text-sm font-black text-white mb-3">Recent Orders</h2>
      {orders.length === 0 ? (
        <div className="glass-soft rounded-2xl p-8 text-center text-stone-500 text-sm">No orders yet.</div>
      ) : (
        <div className="space-y-2">
          {orders.slice(0, 5).map(o => (
            <div key={o.id} className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{(o.items?.[0]?.pizzaName ?? o.items?.[0]?.name) || 'Order'}{o.items?.length > 1 ? ` +${o.items.length - 1}` : ''}</p>
                <p className="text-[11px] text-stone-500">{(o.orderStatus ?? o.status ?? 'placed').replace(/_/g, ' ')}</p>
              </div>
              <p className="font-black text-white">{money(o.finalTotal ?? o.total)}</p>
            </div>
          ))}
        </div>
      )}
      {!store?.is_approved && (
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 text-xs font-bold rounded-2xl px-4 py-3">
          Your store is pending approval. Customers will see it once approved.
        </div>
      )}
    </div>
  );
}

// ── Menu & Prices ─────────────────────────────────────────────────────────────

const emptyItem = { name: '', description: '', price: 0, category: 'Pizza', tags: [] as string[], available: true };

function MenuManager({ storeId, menu, reload, flash, setMenu }: {
  storeId: string; menu: MenuItemDoc[]; reload: () => Promise<void>; flash: (m: string) => void;
  setMenu: React.Dispatch<React.SetStateAction<MenuItemDoc[]>>;
}) {
  const [form, setForm] = useState<any>(null); // null = closed; object = add/edit
  const [priceEdit, setPriceEdit] = useState<{ id: string; value: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const g: Record<string, MenuItemDoc[]> = {};
    for (const item of menu) (g[item.category || 'Other'] ??= []).push(item);
    return g;
  }, [menu]);

  const save = async () => {
    if (!form.name.trim() || !form.price) { flash('Name and price are required'); return; }
    setSaving(true);
    try {
      await upsertMenuItem(storeId, {
        id: form.id, name: form.name.trim(), description: form.description?.trim() || '',
        price: Number(form.price), category: form.category, tags: form.tags || [], available: form.available ?? true,
      });
      await reload();
      flash(form.id ? 'Item updated' : 'Item added');
      setForm(null);
    } catch (e) { console.error(e); flash('Could not save item'); }
    finally { setSaving(false); }
  };

  const savePrice = async (id: string) => {
    const val = Number(priceEdit?.value);
    if (!val || val <= 0) { setPriceEdit(null); return; }
    setMenu(m => m.map(it => it.id === id ? { ...it, price: val } : it)); // optimistic
    setPriceEdit(null);
    try { await updateMenuItemPrice(storeId, id, val); flash('Price updated'); }
    catch (e) { console.error(e); flash('Could not update price'); reload(); }
  };

  const toggleAvail = async (it: MenuItemDoc) => {
    setMenu(m => m.map(x => x.id === it.id ? { ...x, available: !it.available } : x));
    try { await setMenuItemAvailability(storeId, it.id, !it.available); }
    catch (e) { console.error(e); reload(); }
  };

  const remove = async (id: string) => {
    setMenu(m => m.filter(x => x.id !== id));
    try { await deleteMenuItem(storeId, id); flash('Item removed'); }
    catch (e) { console.error(e); reload(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Menu & Prices</h1>
          <p className="text-sm text-stone-500">{menu.length} item{menu.length !== 1 ? 's' : ''} · changes save to Firebase instantly</p>
        </div>
        <button onClick={() => setForm({ ...emptyItem })}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-black px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {menu.length === 0 && !form && (
        <div className="glass-soft rounded-2xl p-10 text-center">
          <Pizza className="w-8 h-8 text-stone-600 mx-auto mb-3" />
          <p className="text-stone-400 font-bold text-sm mb-1">Your menu is empty.</p>
          <p className="text-stone-600 text-xs">Add your first item — it saves straight to your Firebase database.</p>
        </div>
      )}

      {CATEGORIES.filter(c => grouped[c]?.length).map(cat => (
        <div key={cat} className="mb-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-stone-600 mb-2">{cat}</p>
          <div className="space-y-2">
            {grouped[cat].map(it => (
              <div key={it.id} className={`glass rounded-2xl px-4 py-3 flex items-center gap-4 ${!it.available ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{it.name}</p>
                  {it.description && <p className="text-[11px] text-stone-500 truncate">{it.description}</p>}
                </div>

                {priceEdit?.id === it.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-stone-500 text-sm">$</span>
                    <input autoFocus type="number" step="0.01" value={priceEdit.value}
                      onChange={e => setPriceEdit({ id: it.id, value: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && savePrice(it.id)}
                      className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white" />
                    <button onClick={() => savePrice(it.id)} className="text-green-400 p-1"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setPriceEdit(null)} className="text-stone-500 p-1"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => setPriceEdit({ id: it.id, value: String(it.price) })}
                    className="text-sm font-black text-white hover:text-orange-300 transition-colors flex items-center gap-1 group">
                    {money(it.price)} <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </button>
                )}

                <button onClick={() => toggleAvail(it)}
                  className={`text-[9px] font-black px-2 py-1 rounded-full border ${it.available ? 'bg-green-500/15 text-green-400 border-green-500/25' : 'bg-stone-500/15 text-stone-500 border-white/10'}`}>
                  {it.available ? 'LIVE' : 'OFF'}
                </button>
                <button onClick={() => setForm({ ...it })} className="text-stone-500 hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => remove(it.id)} className="text-stone-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add/Edit modal */}
      <AnimatePresence>
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setForm(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass rounded-3xl p-6">
              <h3 className="text-lg font-black text-white mb-4">{form.id ? 'Edit Item' : 'Add Item'}</h3>
              <div className="space-y-3">
                <input placeholder="Item name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
                <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-3">
                    <span className="text-stone-500 text-sm">$</span>
                    <input type="number" step="0.01" placeholder="0.00" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full bg-transparent px-2 py-3 text-white text-sm outline-none" />
                  </div>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-stone-900">{c}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-stone-300 font-bold">
                  <input type="checkbox" checked={form.available ?? true} onChange={e => setForm({ ...form, available: e.target.checked })} />
                  Available for ordering
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setForm(null)} className="flex-1 py-3 rounded-xl text-sm font-bold glass-soft text-stone-300">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Deals ─────────────────────────────────────────────────────────────────────

const emptyDeal = { title: '', description: '', original_price: 0, discounted_price: 0, delivery_type: 'store-delivery', is_active: true };

function DealsManager({ storeId, deals, reload, flash }: {
  storeId: string; deals: DealDoc[]; reload: () => Promise<void>; flash: (m: string) => void;
}) {
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) { flash('Title is required'); return; }
    setSaving(true);
    try {
      await upsertDeal({
        id: form.id, store_id: storeId, title: form.title.trim(), description: form.description?.trim() || '',
        original_price: Number(form.original_price) || 0, discounted_price: Number(form.discounted_price) || 0,
        delivery_type: form.delivery_type, is_active: form.is_active ?? true,
      });
      await reload();
      flash(form.id ? 'Deal updated' : 'Deal published');
      setForm(null);
    } catch (e) { console.error(e); flash('Could not save deal'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await deleteDeal(id); await reload(); flash('Deal removed'); }
    catch (e) { console.error(e); }
  };

  const toggle = async (d: DealDoc) => {
    try { await upsertDeal({ ...d, is_active: !d.is_active }); await reload(); }
    catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Deals</h1>
          <p className="text-sm text-stone-500">Published deals appear on the customer Deals page.</p>
        </div>
        <button onClick={() => setForm({ ...emptyDeal })} className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-black px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      {deals.length === 0 && (
        <div className="glass-soft rounded-2xl p-10 text-center text-stone-500 text-sm">No deals yet. Create one to attract customers.</div>
      )}

      <div className="space-y-2">
        {deals.map(d => (
          <div key={d.id} className={`glass rounded-2xl px-5 py-4 flex items-center gap-4 ${!d.is_active ? 'opacity-60' : ''}`}>
            <Tag className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{d.title}</p>
              <p className="text-[11px] text-stone-500 truncate">{d.description}</p>
            </div>
            {!!d.discounted_price && (
              <p className="text-sm font-black text-green-400">{money(d.discounted_price)}{!!d.original_price && <span className="text-stone-600 line-through ml-1 text-xs">{money(d.original_price)}</span>}</p>
            )}
            <button onClick={() => toggle(d)} className={`text-[9px] font-black px-2 py-1 rounded-full border ${d.is_active ? 'bg-green-500/15 text-green-400 border-green-500/25' : 'bg-stone-500/15 text-stone-500 border-white/10'}`}>
              {d.is_active ? 'ACTIVE' : 'OFF'}
            </button>
            <button onClick={() => setForm({ ...d })} className="text-stone-500 hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => remove(d.id)} className="text-stone-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setForm(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass rounded-3xl p-6">
              <h3 className="text-lg font-black text-white mb-4">{form.id ? 'Edit Deal' : 'New Deal'}</h3>
              <div className="space-y-3">
                <input placeholder="Deal title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
                <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm resize-none" />
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-3">
                    <span className="text-stone-500 text-xs">Was $</span>
                    <input type="number" step="0.01" value={form.original_price || ''} onChange={e => setForm({ ...form, original_price: e.target.value })} className="w-full bg-transparent px-2 py-3 text-white text-sm outline-none" />
                  </div>
                  <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-3">
                    <span className="text-stone-500 text-xs">Now $</span>
                    <input type="number" step="0.01" value={form.discounted_price || ''} onChange={e => setForm({ ...form, discounted_price: e.target.value })} className="w-full bg-transparent px-2 py-3 text-white text-sm outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setForm(null)} className="flex-1 py-3 rounded-xl text-sm font-bold glass-soft text-stone-300">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Orders (live) ─────────────────────────────────────────────────────────────

const PREP_OPTIONS = [10, 15, 20, 25, 30, 45];

function Orders({ orders, flash }: { orders: any[]; flash: (m: string) => void }) {
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const ACTIVE = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'];

  const sorted = [...orders]
    .filter(o => filter === 'all' || ACTIVE.includes(o.orderStatus ?? o.status ?? 'placed'))
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));

  const advance = async (o: any, status: string) => {
    try { await setOrderStatus(o.id, status); flash(`Order marked ${status.replace(/_/g, ' ')}`); }
    catch (e) { console.error(e); flash('Could not update order'); }
  };

  const accept = async (o: any, prepMins: number) => {
    try { await updateOrderFields(o.id, { orderStatus: 'confirmed', prepMinutes: prepMins }); flash(`Accepted · ${prepMins} min prep`); }
    catch (e) { console.error(e); flash('Could not accept order'); }
  };

  const reject = async (o: any) => {
    try { await setOrderStatus(o.id, 'cancelled'); flash('Order rejected'); }
    catch (e) { console.error(e); flash('Could not reject order'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Live Orders</h1>
          <p className="text-sm text-stone-500">Real-time from Firebase as customers order.</p>
        </div>
        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          {(['active', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${filter === f ? 'bg-white/15 text-white' : 'text-stone-500 hover:text-white'}`}>
              {f === 'active' ? 'Active' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-soft rounded-2xl p-10 text-center text-stone-500 text-sm">No {filter === 'active' ? 'active ' : ''}orders.</div>
      ) : (
        <div className="space-y-3">
          {sorted.map(o => {
            const status = o.orderStatus ?? o.status ?? 'placed';
            const isNew = status === 'placed';
            return (
              <div key={o.id} className={`glass rounded-2xl p-5 ${isNew ? 'border-orange-500/40' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-black text-white flex items-center gap-2">
                      Order #{String(o.id).slice(-6).toUpperCase()}
                      {isNew && <span className="text-[8px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
                    </p>
                    <p className="text-[11px] text-stone-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''} · {o.deliveryType || 'delivery'}{o.prepMinutes ? ` · ${o.prepMinutes} min prep` : ''}</p>
                  </div>
                  <p className="font-black text-white">{money(o.finalTotal ?? o.total)}</p>
                </div>
                <div className="text-xs text-stone-400 mb-3 space-y-0.5">
                  {(o.items || []).map((it: any, i: number) => (
                    <p key={i}>{(it.quantity ?? it.qty)}× {(it.pizzaName ?? it.name)}</p>
                  ))}
                </div>
                {o.deliveryAddress && <p className="text-[11px] text-stone-500 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" /> {o.deliveryAddress}</p>}

                {isNew ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1"><Timer className="w-3 h-3" /> Prep:</span>
                    {PREP_OPTIONS.map(p => (
                      <button key={p} onClick={() => accept(o, p)}
                        className="text-[11px] font-bold bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 px-2.5 py-1.5 rounded-lg transition-colors">
                        {p}m
                      </button>
                    ))}
                    <button onClick={() => reject(o)} className="ml-auto text-[11px] font-bold text-red-400 hover:bg-red-500/10 border border-red-500/25 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <X className="w-3 h-3" /> Reject
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-300">{status.replace(/_/g, ' ')}</span>
                    <select value={status} onChange={e => advance(o, e.target.value)}
                      className="ml-auto bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-bold">
                      {ORDER_STAGES.map(s => <option key={s} value={s} className="bg-stone-900">{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Insights ──────────────────────────────────────────────────────────────────

function Insights({ orders }: { orders: any[] }) {
  const completed = orders.filter(o => (o.orderStatus ?? o.status) !== 'cancelled');
  const revenue = completed.reduce((s, o) => s + (Number(o.finalTotal ?? o.total) || 0), 0);
  const aov = completed.length ? revenue / completed.length : 0;

  // Top selling items
  const itemCounts: Record<string, number> = {};
  for (const o of completed) for (const it of (o.items || [])) {
    const name = it.pizzaName ?? it.name ?? 'Item';
    itemCounts[name] = (itemCounts[name] || 0) + (it.quantity ?? it.qty ?? 1);
  }
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Last 7 days revenue
  const days: { label: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const total = completed.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === key)
      .reduce((s, o) => s + (Number(o.finalTotal ?? o.total) || 0), 0);
    days.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), total });
  }
  const maxDay = Math.max(1, ...days.map(d => d.total));

  const statusCounts: Record<string, number> = {};
  for (const o of orders) { const s = o.orderStatus ?? o.status ?? 'placed'; statusCounts[s] = (statusCounts[s] || 0) + 1; }

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-1">Insights</h1>
      <p className="text-sm text-stone-500 mb-6">Live analytics from your Firebase orders.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Stat icon={DollarSign} color="text-green-400" label="Total Revenue" value={money(revenue)} />
        <Stat icon={ShoppingBag} color="text-blue-400" label="Completed Orders" value={completed.length} />
        <Stat icon={TrendingUp} color="text-orange-400" label="Avg Order Value" value={money(aov)} />
      </div>

      <h2 className="text-sm font-black text-white mb-3">Revenue — last 7 days</h2>
      <div className="glass rounded-2xl p-5 mb-8">
        <div className="flex items-end justify-between gap-2 h-36">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t-md transition-all" style={{ height: `${(d.total / maxDay) * 100}%`, minHeight: d.total > 0 ? 4 : 0 }} />
              <span className="text-[9px] text-stone-500 font-bold">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-sm font-black text-white mb-3">Top Sellers</h2>
      {topItems.length === 0 ? (
        <div className="glass-soft rounded-2xl p-6 text-center text-stone-500 text-sm">No sales yet.</div>
      ) : (
        <div className="glass rounded-2xl divide-y divide-white/5">
          {topItems.map(([name, qty], i) => (
            <div key={name} className="flex items-center gap-3 px-5 py-3">
              <span className="text-xs font-black text-stone-600 w-4">{i + 1}</span>
              <span className="text-sm font-bold text-white flex-1 truncate">{name}</span>
              <span className="text-xs font-black text-orange-300">{qty} sold</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, color, label, value }: { icon: React.ElementType; color: string; label: string; value: any }) {
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[11px] text-stone-500 font-bold mt-0.5">{label}</p>
    </div>
  );
}

// ── Earnings ──────────────────────────────────────────────────────────────────

function Earnings({ orders }: { orders: any[] }) {
  const paid = orders.filter(o => (o.orderStatus ?? o.status) !== 'cancelled');
  const gross = paid.reduce((s, o) => s + (Number(o.finalTotal ?? o.total) || 0), 0);
  const fees = gross * PLATFORM_FEE_RATE;
  const net = gross - fees;

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-1">Earnings</h1>
      <p className="text-sm text-stone-500 mb-6">Payout summary derived from completed orders.</p>

      <div className="glass rounded-3xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest text-stone-500 mb-1">Net Payout</p>
        <p className="text-4xl font-black text-white mb-4">{money(net)}</p>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/8">
          <div><p className="text-[10px] text-stone-500 font-bold uppercase">Gross Sales</p><p className="text-lg font-black text-white">{money(gross)}</p></div>
          <div><p className="text-[10px] text-stone-500 font-bold uppercase">Platform Fee ({Math.round(PLATFORM_FEE_RATE * 100)}%)</p><p className="text-lg font-black text-red-400">−{money(fees)}</p></div>
        </div>
      </div>

      <h2 className="text-sm font-black text-white mb-3">Transactions</h2>
      {paid.length === 0 ? (
        <div className="glass-soft rounded-2xl p-6 text-center text-stone-500 text-sm">No transactions yet.</div>
      ) : (
        <div className="glass rounded-2xl divide-y divide-white/5">
          {[...paid].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, 12).map(o => (
            <div key={o.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-bold text-white">#{String(o.id).slice(-6).toUpperCase()}</p>
                <p className="text-[11px] text-stone-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</p>
              </div>
              <span className="text-sm font-black text-green-400">+{money((Number(o.finalTotal ?? o.total) || 0) * (1 - PLATFORM_FEE_RATE))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────

function Profile({ storeId, store, setStore, flash }: {
  storeId: string; store: StoreDoc; setStore: React.Dispatch<React.SetStateAction<StoreDoc | null>>; flash: (m: string) => void;
}) {
  const [form, setForm] = useState<any>({
    store_name: store.store_name || '', tagline: (store as any).tagline || '',
    city: store.city || '', state: store.state || 'MI', phone: (store as any).phone || '', address: (store as any).address || '',
  });
  const [hours, setHours] = useState<{ day: string; open: string; close: string; closed: boolean }[]>(
    (store as any).hours?.length ? (store as any).hours : DAYS.map(day => ({ day, open: '11:00', close: '22:00', closed: false }))
  );
  const [saving, setSaving] = useState(false);

  const setHour = (i: number, patch: Partial<{ open: string; close: string; closed: boolean }>) =>
    setHours(h => h.map((d, idx) => idx === i ? { ...d, ...patch } : d));

  const save = async () => {
    setSaving(true);
    try {
      await updateStore(storeId, { ...form, hours } as any);
      setStore(s => s ? { ...s, ...form, hours } as any : s);
      flash('Profile saved');
    } catch (e) { console.error(e); flash('Could not save profile'); }
    finally { setSaving(false); }
  };

  const field = (label: string, key: string, icon?: React.ElementType, placeholder = '') => (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">{label}</label>
      <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3">
        {icon && React.createElement(icon, { className: 'w-4 h-4 text-stone-500 shrink-0' })}
        <input value={form[key]} placeholder={placeholder} onChange={e => setForm({ ...form, [key]: e.target.value })}
          className="w-full bg-transparent px-3 py-3 text-white text-sm outline-none" />
      </div>
    </div>
  );

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-black text-white mb-1">Store Profile</h1>
      <p className="text-sm text-stone-500 mb-6">This information is saved to your Firebase store record.</p>
      <div className="glass rounded-3xl p-6 space-y-4">
        {field('Store Name', 'store_name', Store)}
        {field('Tagline', 'tagline')}
        {field('Address', 'address', MapPin)}
        <div className="grid grid-cols-2 gap-3">
          {field('City', 'city')}
          {field('State', 'state')}
        </div>
        {field('Phone', 'phone', Phone, '+1 (555) 000-0000')}

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5 mb-2"><Clock className="w-3 h-3" /> Operating Hours</label>
          <div className="space-y-1.5">
            {hours.map((h, i) => (
              <div key={h.day} className="flex items-center gap-2">
                <span className="w-9 text-xs font-bold text-stone-400">{h.day}</span>
                {h.closed ? (
                  <span className="flex-1 text-xs text-stone-600 font-bold">Closed</span>
                ) : (
                  <>
                    <input type="time" value={h.open} onChange={e => setHour(i, { open: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
                    <span className="text-stone-600 text-xs">–</span>
                    <input type="time" value={h.close} onChange={e => setHour(i, { close: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
                  </>
                )}
                <button onClick={() => setHour(i, { closed: !h.closed })}
                  className={`ml-auto text-[9px] font-black px-2 py-1 rounded-full border ${h.closed ? 'bg-stone-500/15 text-stone-500 border-white/10' : 'bg-green-500/15 text-green-400 border-green-500/25'}`}>
                  {h.closed ? 'CLOSED' : 'OPEN'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving} className="w-full py-3.5 rounded-xl text-sm font-black bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Profile</>}
        </button>
      </div>
    </div>
  );
}
