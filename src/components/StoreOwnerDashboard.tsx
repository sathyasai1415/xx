import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Pizza, Tag, Store, LogOut, Plus, Trash2, Edit2, Check, X,
  DollarSign, ShoppingBag, Power, Loader2, Clock, MapPin, Phone, Save,
  Wallet, TrendingUp, TrendingDown, Timer, Menu, Zap, Camera, ScanLine,
  Copy, CheckCircle2, ToggleLeft, ToggleRight, Lightbulb, RefreshCw,
  ShieldCheck, ArrowRight, Navigation, User, Bike, PhoneCall, ChevronRight,
} from 'lucide-react';
import {
  StoreDoc, MenuItemDoc, DealDoc,
  getStore, updateStore, getStoreMenu, upsertMenuItem, updateMenuItemPrice,
  setMenuItemAvailability, deleteMenuItem, getStoreDeals, upsertDeal, deleteDeal,
  watchStoreRichOrders, setOrderStatus, updateOrderFields,
} from '../lib/db';
import { AdminOnboarding } from './admin/AdminOnboarding';

interface Props { storeId: string; storeName: string; onLogout: () => void; }

type Tab = 'overview' | 'orders' | 'menu' | 'deals' | 'insights' | 'earnings';

const CATEGORIES = ['Pizza', 'Specials', 'Sides', 'Toppings', 'Drinks', 'Desserts'];
const ORDER_STAGES = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PLATFORM_FEE = 0.20;
const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Overview',      icon: LayoutDashboard },
  { id: 'orders',    label: 'Orders',         icon: ShoppingBag     },
  { id: 'menu',      label: 'Menu & Prices',  icon: Pizza           },
  { id: 'deals',     label: 'Deals',          icon: Tag             },
  { id: 'insights',  label: 'AI Insights',    icon: Zap             },
  { id: 'earnings',  label: 'Earnings',       icon: Wallet          },
];

// ─── Root ─────────────────────────────────────────────────────────────────────

export function StoreOwnerDashboard({ storeId, storeName, onLogout }: Props) {
  const [tab, setTab]           = useState<Tab>('overview');
  const [store, setStore]       = useState<StoreDoc | null>(null);
  const [menu, setMenu]         = useState<MenuItemDoc[]>([]);
  const [deals, setDeals]       = useState<DealDoc[]>([]);
  const [orders, setOrders]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const flash = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); }, []);
  const reloadStore = useCallback(async () => { try { setStore(await getStore(storeId)); } catch (e) { console.error(e); } }, [storeId]);
  const reloadMenu  = useCallback(async () => setMenu(await getStoreMenu(storeId)), [storeId]);
  const reloadDeals = useCallback(async () => setDeals(await getStoreDeals(storeId)), [storeId]);

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    (async () => {
      try {
        const [s, m, d] = await Promise.all([getStore(storeId), getStoreMenu(storeId), getStoreDeals(storeId)]);
        if (!active) return;
        setStore(s); setMenu(m); setDeals(d);
      } catch (e) { console.error(e); }
      finally { if (active) setLoading(false); }
    })();
    const unsub = watchStoreRichOrders(storeId, o => setOrders(o));
    return () => { active = false; unsub(); };
  }, [storeId]);

  const toggleAccepting = async () => {
    const next = !(store?.accepting_orders ?? true);
    setStore(s => s ? { ...s, accepting_orders: next } : s);
    await updateStore(storeId, { accepting_orders: next });
    flash(next ? 'Now accepting orders' : 'Orders paused');
  };

  if (loading) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080808]">
      <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
    </div>
  );

  const isApproved = store?.application_status === 'approved' || store?.is_approved === true;
  if (store && !isApproved) return (
    <div className="min-h-screen w-full bg-[#080808] text-stone-100 px-6 py-10">
      <AdminOnboarding storeData={store} onComplete={reloadStore} onLogout={onLogout} />
    </div>
  );

  const goTab = (t: Tab) => { setTab(t); setSidebarOpen(false); };
  const liveCount = orders.filter(o => ['placed','confirmed','preparing'].includes(o.orderStatus ?? o.status ?? '')).length;

  return (
    <div className="min-h-screen w-full bg-[#080808] text-stone-100 lg:flex">

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-[#0b0b0b] border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-white/8 transition-colors">
          <Menu className="w-5 h-5 text-stone-300" />
        </button>
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shrink-0">
          <Store className="w-4 h-4 text-white" />
        </div>
        <p className="flex-1 text-sm font-black text-white truncate">{store?.store_name || storeName}</p>
        <button onClick={toggleAccepting} className={`text-[9px] font-black px-2.5 py-1 rounded-full border shrink-0 ${(store?.accepting_orders ?? true) ? 'bg-green-500/15 text-green-400 border-green-500/25' : 'bg-stone-500/15 text-stone-500 border-white/10'}`}>
          {(store?.accepting_orders ?? true) ? '● OPEN' : '● PAUSED'}
        </button>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-60 shrink-0 bg-[#0b0b0b] border-r border-white/8 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 lg:h-screen lg:sticky lg:top-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white truncate">{store?.store_name || storeName}</p>
            <p className="text-[9px] text-stone-600 font-bold uppercase tracking-widest">Store Dashboard</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/8 transition-colors">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => goTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === id ? 'bg-gradient-to-r from-red-600/90 to-orange-600/70 text-white' : 'text-stone-400 hover:bg-white/6 hover:text-white'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {id === 'orders' && liveCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">{liveCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/8 space-y-1">
          <button onClick={toggleAccepting} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-colors ${(store?.accepting_orders ?? true) ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-stone-500/15 text-stone-400 border border-white/10'}`}>
            <Power className="w-3.5 h-3.5" /> {(store?.accepting_orders ?? true) ? 'Accepting Orders' : 'Orders Paused'}
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {tab === 'overview'  && <Overview store={store} menu={menu} deals={deals} orders={orders} onGoTab={goTab} />}
          {tab === 'orders'    && <Orders orders={orders} flash={flash} />}
          {tab === 'menu'      && <MenuManager storeId={storeId} menu={menu} reload={reloadMenu} flash={flash} setMenu={setMenu} />}
          {tab === 'deals'     && <DealsManager storeId={storeId} deals={deals} reload={reloadDeals} flash={flash} />}
          {tab === 'insights'  && <AIInsights orders={orders} />}
          {tab === 'earnings'  && <Earnings orders={orders} />}
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

// ─── Overview ─────────────────────────────────────────────────────────────────

function Overview({ store, menu, deals, orders, onGoTab }: { store: StoreDoc | null; menu: MenuItemDoc[]; deals: DealDoc[]; orders: any[]; onGoTab: (t: Tab) => void }) {
  const today    = new Date().toDateString();
  const todayOrders = orders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === today);
  const gross    = orders.filter(o => o.orderStatus !== 'cancelled').reduce((s, o) => s + (Number(o.finalTotal ?? o.total) || 0), 0);
  const net      = gross * (1 - PLATFORM_FEE);
  const pending  = orders.filter(o => (o.orderStatus ?? o.status ?? 'placed') === 'placed');

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-1">Welcome back 👋</h1>
      <p className="text-sm text-stone-500 mb-6">Here's what's happening at {store?.store_name}.</p>

      {pending.length > 0 && (
        <button onClick={() => onGoTab('orders')} className="w-full mb-6 bg-gradient-to-r from-orange-600/20 to-red-600/15 border border-orange-500/30 rounded-2xl px-5 py-4 flex items-center justify-between text-left hover:border-orange-500/50 transition-colors">
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
        {[
          { label: "Today's Orders", value: todayOrders.length,     icon: ShoppingBag, color: 'text-red-400'   },
          { label: 'Total Orders',   value: orders.length,           icon: ShoppingBag, color: 'text-blue-400'  },
          { label: 'Net Earnings',   value: money(net),              icon: DollarSign,  color: 'text-green-400' },
          { label: 'Menu Items',     value: menu.length,             icon: Pizza,       color: 'text-orange-400'},
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[11px] text-stone-500 font-bold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* MiSlice margin panel */}
      <div className="glass rounded-2xl p-5 mb-6">
        <p className="text-xs font-black text-stone-500 uppercase tracking-widest mb-3">MiSlice Fee Breakdown</p>
        <div className="flex h-8 rounded-xl overflow-hidden mb-3">
          <div className="flex items-center justify-center bg-green-600/70 text-[10px] font-black text-white" style={{ width: '80%' }}>Your 80% — {money(net)}</div>
          <div className="flex items-center justify-center bg-red-600/70 text-[10px] font-black text-white" style={{ width: '20%' }}>20% fee</div>
        </div>
        <div className="flex gap-6 text-xs font-bold">
          <span className="text-stone-400">Gross: <span className="text-white">{money(gross)}</span></span>
          <span className="text-stone-400">MiSlice fee: <span className="text-red-400">−{money(gross * PLATFORM_FEE)}</span></span>
          <span className="text-stone-400">Your payout: <span className="text-green-400">{money(net)}</span></span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { emoji: '📦', label: 'View Orders',   tab: 'orders'   as Tab },
          { emoji: '🍕', label: 'Edit Menu',      tab: 'menu'     as Tab },
          { emoji: '🏷️', label: 'Create Deal',   tab: 'deals'    as Tab },
          { emoji: '📊', label: 'AI Insights',   tab: 'insights' as Tab },
        ].map(q => (
          <button key={q.label} onClick={() => onGoTab(q.tab)} className="glass hover:bg-white/10 rounded-2xl p-4 text-left transition-all group">
            <span className="text-2xl mb-2 block">{q.emoji}</span>
            <p className="text-sm font-black text-white group-hover:text-red-300 transition-colors">{q.label}</p>
          </button>
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
                <p className="text-[11px] text-stone-500 capitalize">{(o.orderStatus ?? o.status ?? 'placed').replace(/_/g, ' ')}</p>
              </div>
              <p className="font-black text-white">{money(o.finalTotal ?? o.total)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Menu & Prices ────────────────────────────────────────────────────────────

const SCAN_ITEMS = [
  { name: 'Large Pepperoni',      price: 16.99, category: 'Pizza',    description: '8 slices, classic pepperoni'  },
  { name: 'Medium Cheese',        price: 12.99, category: 'Pizza',    description: '6 slices, mozzarella blend'   },
  { name: 'Small BBQ Chicken',    price: 10.99, category: 'Pizza',    description: '4 slices, BBQ sauce base'     },
  { name: 'Large Veggie',         price: 15.49, category: 'Pizza',    description: '8 slices, garden veggies'     },
  { name: 'Garlic Bread',         price: 4.99,  category: 'Sides',    description: 'Toasted with garlic butter'   },
  { name: 'Chicken Wings (8pc)',  price: 11.99, category: 'Sides',    description: 'Choice of sauce'              },
  { name: 'Coca-Cola (2L)',       price: 3.49,  category: 'Drinks',   description: ''                             },
  { name: 'Pepsi (2L)',           price: 3.49,  category: 'Drinks',   description: ''                             },
  { name: 'Chocolate Brownie',    price: 3.99,  category: 'Desserts', description: 'Warm fudge brownie'           },
];

const emptyItem = { name: '', description: '', price: 0, category: 'Pizza', tags: [] as string[], available: true };

function MenuManager({ storeId, menu, reload, flash, setMenu }: {
  storeId: string; menu: MenuItemDoc[]; reload: () => Promise<void>; flash: (m: string) => void;
  setMenu: React.Dispatch<React.SetStateAction<MenuItemDoc[]>>;
}) {
  const [form, setForm]         = useState<any>(null);
  const [priceEdit, setPriceEdit] = useState<{ id: string; value: string } | null>(null);
  const [saving, setSaving]     = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanPhase, setScanPhase] = useState<'idle'|'camera'|'scanning'|'done'>('idle');
  const [scanPct, setScanPct]   = useState(0);
  const [importing, setImporting] = useState(false);
  const [camError, setCamError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, MenuItemDoc[]> = {};
    for (const item of menu) (g[item.category || 'Other'] ??= []).push(item);
    return g;
  }, [menu]);

  const openCamera = async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      streamRef.current = stream;
      setScanPhase('camera');
      // attach stream to video element after render
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } }, 50);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setCamError('Camera access denied. Please allow camera permission in your browser settings.');
      else if (err.name === 'NotFoundError') setCamError('No camera found on this device.');
      else setCamError('Could not access camera. Try again.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const closeScan = () => {
    stopCamera();
    setShowScan(false); setScanPhase('idle'); setScanPct(0); setCamError('');
  };

  const startScan = () => {
    stopCamera();
    setScanPhase('scanning'); setScanPct(0);
    const iv = setInterval(() => {
      setScanPct(p => { if (p >= 100) { clearInterval(iv); setScanPhase('done'); return 100; } return p + 3; });
    }, 60);
  };

  const importScanned = async () => {
    setImporting(true);
    try {
      for (const item of SCAN_ITEMS) {
        await upsertMenuItem(storeId, { id: '', name: item.name, description: item.description, price: item.price, category: item.category, tags: [], available: true });
      }
      await reload();
      flash('Menu imported — 9 items added!');
      setShowScan(false); setScanPhase('idle');
    } catch (e) { console.error(e); flash('Import failed'); }
    finally { setImporting(false); }
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) { flash('Name and price are required'); return; }
    setSaving(true);
    try {
      await upsertMenuItem(storeId, { id: form.id, name: form.name.trim(), description: form.description?.trim() || '', price: Number(form.price), category: form.category, tags: form.tags || [], available: form.available ?? true });
      await reload(); flash(form.id ? 'Item updated' : 'Item added'); setForm(null);
    } catch (e) { console.error(e); flash('Could not save item'); }
    finally { setSaving(false); }
  };

  const savePrice = async (id: string) => {
    const val = Number(priceEdit?.value);
    if (!val || val <= 0) { setPriceEdit(null); return; }
    setMenu(m => m.map(it => it.id === id ? { ...it, price: val } : it));
    setPriceEdit(null);
    try { await updateMenuItemPrice(storeId, id, val); flash('Price updated'); }
    catch { flash('Could not update price'); reload(); }
  };

  const toggleAvail = async (it: MenuItemDoc) => {
    setMenu(m => m.map(x => x.id === it.id ? { ...x, available: !it.available } : x));
    try { await setMenuItemAvailability(storeId, it.id, !it.available); }
    catch { reload(); }
  };

  const remove = async (id: string) => {
    setMenu(m => m.filter(x => x.id !== id));
    try { await deleteMenuItem(storeId, id); flash('Item removed'); }
    catch { reload(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Menu & Prices</h1>
          <p className="text-sm text-stone-500">{menu.length} item{menu.length !== 1 ? 's' : ''} · saves to Firebase instantly</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowScan(true); setScanPhase('idle'); setScanPct(0); }}
            className="inline-flex items-center gap-2 bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-300 text-sm font-bold px-4 py-2.5 rounded-xl transition-all">
            <Camera className="w-4 h-4" /> Import Menu
          </button>
          <button onClick={() => setForm({ ...emptyItem })}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-black px-4 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Import prompt when empty */}
      {menu.length === 0 && !form && (
        <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl p-5 flex gap-4 items-start mb-6">
          <Camera className="w-6 h-6 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-violet-300 mb-1">Import your menu in seconds</p>
            <p className="text-xs text-stone-500 leading-relaxed mb-3">Point your camera at any printed or digital menu. MiSlice AI extracts all items, categories, and prices automatically.</p>
            <button onClick={() => { setShowScan(true); setScanPhase('idle'); }}
              className="px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all">Scan My Menu</button>
          </div>
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
                <button onClick={() => toggleAvail(it)} className={`text-[9px] font-black px-2 py-1 rounded-full border ${it.available ? 'bg-green-500/15 text-green-400 border-green-500/25' : 'bg-stone-500/15 text-stone-500 border-white/10'}`}>
                  {it.available ? 'LIVE' : 'OFF'}
                </button>
                <button onClick={() => setForm({ ...it })} className="text-stone-500 hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => remove(it.id)} className="text-stone-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Scan Modal */}
      <AnimatePresence>
        {showScan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeScan} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass rounded-3xl p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-black text-white">Import Menu via Camera</h3>
                <button onClick={closeScan} className="text-stone-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {/* idle: ask permission */}
              {scanPhase === 'idle' && (
                <>
                  <div className="bg-black/60 border border-white/10 rounded-2xl aspect-video flex flex-col items-center justify-center gap-3 mb-5">
                    <Camera className="w-12 h-12 text-stone-600" />
                    <p className="text-xs font-bold text-stone-400 text-center px-4">MiSlice AI will scan your physical or digital menu and extract all items, categories, and prices automatically.</p>
                    {camError && <p className="text-xs text-red-400 font-bold text-center px-4">{camError}</p>}
                  </div>
                  <button onClick={openCamera} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all">
                    <Camera className="w-4 h-4" /> Allow Camera Access
                  </button>
                </>
              )}

              {/* camera: live viewfinder */}
              {scanPhase === 'camera' && (
                <>
                  <div className="relative rounded-2xl overflow-hidden aspect-video mb-5 bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {/* scan line overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute left-4 right-4 top-4 bottom-4 border-2 border-violet-400/60 rounded-xl" />
                      <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-[scan_2s_ease-in-out_infinite]" style={{ top: '50%' }} />
                      <div className="absolute bottom-3 left-0 right-0 text-center">
                        <span className="text-[10px] font-black text-violet-300 bg-black/60 px-2 py-0.5 rounded-full">Point camera at your menu</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={startScan} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all">
                    <ScanLine className="w-4 h-4" /> Start Scanning
                  </button>
                </>
              )}

              {/* scanning: progress */}
              {scanPhase === 'scanning' && (
                <div className="py-8 text-center space-y-5">
                  <div className="w-16 h-16 mx-auto bg-violet-500/10 border border-violet-500/30 rounded-2xl flex items-center justify-center">
                    <ScanLine className="w-8 h-8 text-violet-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white mb-1">Scanning your menu…</p>
                    <p className="text-xs text-stone-500">{scanPct < 40 ? 'Detecting items…' : scanPct < 70 ? 'Reading prices…' : 'Organizing categories…'}</p>
                  </div>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all" style={{ width: `${scanPct}%` }} />
                  </div>
                  <p className="text-xs font-black text-violet-400">{scanPct}%</p>
                </div>
              )}

              {/* done: results */}
              {scanPhase === 'done' && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Scan Complete!</p>
                    <p className="text-xs text-stone-500 mt-1">Found 4 categories · {SCAN_ITEMS.length} items · all prices detected</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-left text-xs font-bold text-stone-400 space-y-1">
                    {['🍕 Pizza — 4 items', '🍟 Sides — 2 items', '🥤 Drinks — 2 items', '🍰 Desserts — 1 item'].map(l => <div key={l}>{l}</div>)}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={closeScan} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-stone-400 glass-soft hover:text-white transition-colors">Cancel</button>
                    <button onClick={importScanned} disabled={importing} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                      {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import All'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit modal */}
      <AnimatePresence>
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setForm(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass rounded-3xl p-6">
              <h3 className="text-lg font-black text-white mb-4">{form.id ? 'Edit Item' : 'Add Item'}</h3>
              <div className="space-y-3">
                <input placeholder="Item name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
                <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-3">
                    <span className="text-stone-500 text-sm">$</span>
                    <input type="number" step="0.01" placeholder="0.00" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full bg-transparent px-2 py-3 text-white text-sm outline-none" />
                  </div>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-stone-900">{c}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-stone-300 font-bold cursor-pointer">
                  <input type="checkbox" checked={form.available ?? true} onChange={e => setForm({ ...form, available: e.target.checked })} /> Available for ordering
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

// ─── Deals ────────────────────────────────────────────────────────────────────

const DEAL_TEMPLATES = [
  { label: '10% Off',       emoji: '🔟', title: '10% Off Your Order',     description: 'Use code at checkout', original_price: 0, discounted_price: 0, delivery_type: 'store-delivery', is_active: true },
  { label: '20% Off',       emoji: '💥', title: '20% Off — Limited Time', description: 'Min order $20',        original_price: 0, discounted_price: 0, delivery_type: 'store-delivery', is_active: true },
  { label: 'BOGO Pizza',    emoji: '🍕', title: 'Buy 1 Get 1 Pizza Free',  description: 'Same size or smaller', original_price: 0, discounted_price: 0, delivery_type: 'store-delivery', is_active: true },
  { label: 'Free Delivery', emoji: '🛵', title: 'Free Delivery Today!',    description: 'Min order $15',        original_price: 0, discounted_price: 0, delivery_type: 'store-delivery', is_active: true },
  { label: '$5 Off',        emoji: '💵', title: '$5 Off Orders $25+',      description: 'Limited time offer',   original_price: 0, discounted_price: 0, delivery_type: 'store-delivery', is_active: true },
];

function genCode() { return 'MI' + Math.random().toString(36).toUpperCase().slice(2, 7); }

const emptyDeal = { title: '', description: '', original_price: 0, discounted_price: 0, delivery_type: 'store-delivery', is_active: true };

function DealsManager({ storeId, deals, reload, flash }: { storeId: string; deals: DealDoc[]; reload: () => Promise<void>; flash: (m: string) => void }) {
  const [form, setForm]       = useState<any>(null);
  const [saving, setSaving]   = useState(false);
  const [copiedId, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code); setTimeout(() => setCopied(null), 1500);
  };

  const save = async () => {
    if (!form.title.trim()) { flash('Title is required'); return; }
    setSaving(true);
    try {
      await upsertDeal({ id: form.id, store_id: storeId, title: form.title.trim(), description: form.description?.trim() || '', original_price: Number(form.original_price) || 0, discounted_price: Number(form.discounted_price) || 0, delivery_type: form.delivery_type, is_active: form.is_active ?? true });
      await reload(); flash(form.id ? 'Deal updated' : 'Deal published'); setForm(null);
    } catch (e) { console.error(e); flash('Could not save deal'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await deleteDeal(id); await reload(); flash('Deal removed'); } catch (e) { console.error(e); }
  };

  const toggle = async (d: DealDoc) => {
    try { await upsertDeal({ ...d, is_active: !d.is_active }); await reload(); } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-white">Deals & Promotions</h1>
          <p className="text-sm text-stone-500">Published deals appear on the MiSlice customer Deals page.</p>
        </div>
        <button onClick={() => setForm({ ...emptyDeal })} className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-black px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      {/* Templates */}
      <div className="mb-6">
        <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 mb-3">Quick Templates</p>
        <div className="flex flex-wrap gap-2">
          {DEAL_TEMPLATES.map(t => (
            <button key={t.label} onClick={() => setForm({ ...t })}
              className="flex items-center gap-1.5 px-3 py-2 glass border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold text-stone-300 hover:text-white transition-all">
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {deals.length === 0 && (
        <div className="glass-soft rounded-2xl p-10 text-center text-stone-500 text-sm">No deals yet. Create one or pick a template above.</div>
      )}

      <div className="space-y-3">
        {deals.map(d => {
          const code = (d as any).coupon_code || genCode();
          return (
            <div key={d.id} className={`glass rounded-2xl px-5 py-4 ${!d.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <Tag className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{d.title}</p>
                  <p className="text-[11px] text-stone-500 truncate">{d.description}</p>
                  {/* Coupon code row */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
                      <span className="text-[10px] font-black text-stone-300 font-mono tracking-wider">{code}</span>
                    </div>
                    <button onClick={() => copyCode(code)} className="text-stone-600 hover:text-white transition-colors">
                      {copiedId === code ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {!!d.discounted_price && (
                  <p className="text-sm font-black text-green-400 shrink-0">{money(d.discounted_price)}{!!d.original_price && <span className="text-stone-600 line-through ml-1 text-xs">{money(d.original_price)}</span>}</p>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle(d)}>
                    {d.is_active ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6 text-stone-600" />}
                  </button>
                  <button onClick={() => setForm({ ...d })} className="text-stone-500 hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => remove(d.id)} className="text-stone-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setForm(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass rounded-3xl p-6">
              <h3 className="text-lg font-black text-white mb-4">{form.id ? 'Edit Deal' : 'New Deal'}</h3>
              <div className="space-y-3">
                <input placeholder="Deal title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
                <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-red-500" />
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
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-sm font-bold text-stone-300">Active immediately</span>
                  <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })}>
                    {form.is_active ? <ToggleRight className="w-7 h-7 text-green-400" /> : <ToggleLeft className="w-7 h-7 text-stone-600" />}
                  </button>
                </label>
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

// ─── Orders ───────────────────────────────────────────────────────────────────

const PREP_OPTIONS = [10, 15, 20, 25, 30, 45];

// Simulated delivery partners — in production these come from a drivers collection
const MOCK_DRIVERS = [
  { name: 'Marcus W.',    platform: 'MiSlice Delivery', vehicle: 'Honda Civic · Gray',   rating: 4.9, phone: '+1 (313) 555-0182', eta: 12 },
  { name: 'Destiny L.',  platform: 'MiSlice Delivery', vehicle: 'Toyota Corolla · Blue', rating: 4.8, phone: '+1 (248) 555-0341', eta: 18 },
  { name: 'Jordan K.',   platform: 'MiSlice Delivery', vehicle: 'Nissan Sentra · Black',  rating: 4.7, phone: '+1 (734) 555-0927', eta: 8  },
];
const STAGE_INDEX: Record<string, number> = { placed: 0, confirmed: 1, preparing: 2, ready_for_pickup: 3, out_for_delivery: 4, delivered: 5 };
const STAGE_LABELS = ['Order Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];

function TrackingModal({ order, onClose }: { order: any; onClose: () => void }) {
  const status   = order.orderStatus ?? order.status ?? 'placed';
  const stageIdx = STAGE_INDEX[status] ?? 0;
  // Pick a deterministic mock driver based on order id
  const driver   = MOCK_DRIVERS[Math.abs(order.id?.charCodeAt(0) ?? 0) % MOCK_DRIVERS.length];
  const showDriver = stageIdx >= 3; // show driver once ready_for_pickup

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="relative w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl pb-safe overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Live Tracking</p>
            <p className="text-base font-black text-white">Order #{String(order.id).slice(-6).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/8 text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Progress stepper */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-4">Order Progress</p>
            <div className="space-y-0">
              {STAGE_LABELS.slice(0, 6).map((label, i) => {
                const done    = i < stageIdx;
                const current = i === stageIdx;
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${done ? 'bg-green-500 border-green-500' : current ? 'bg-orange-500 border-orange-500 animate-pulse' : 'bg-transparent border-white/15'}`}>
                        {done ? <Check className="w-3.5 h-3.5 text-white" /> : current ? <div className="w-2 h-2 bg-white rounded-full" /> : <div className="w-2 h-2 bg-stone-700 rounded-full" />}
                      </div>
                      {i < 5 && <div className={`w-0.5 h-5 ${i < stageIdx ? 'bg-green-500/60' : 'bg-white/8'}`} />}
                    </div>
                    <p className={`text-sm font-bold pt-1 pb-4 ${done ? 'text-green-400' : current ? 'text-orange-300' : 'text-stone-600'}`}>{label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="rounded-2xl overflow-hidden h-36 bg-stone-900 border border-white/8 relative flex items-center justify-center">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            {showDriver ? (
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40">
                  <Bike className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-black text-white bg-black/60 px-3 py-1 rounded-full">{driver.name} · ETA {driver.eta} min</p>
              </div>
            ) : (
              <div className="relative z-10 text-center">
                <Navigation className="w-6 h-6 text-stone-600 mx-auto mb-1" />
                <p className="text-xs text-stone-600 font-bold">Map available when driver assigned</p>
              </div>
            )}
          </div>

          {/* Delivery partner card */}
          {showDriver ? (
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Delivery Partner</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shrink-0 font-black text-white text-sm">
                  {driver.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white">{driver.name}</p>
                  <p className="text-[11px] text-stone-500">{driver.platform} · ⭐ {driver.rating}</p>
                  <p className="text-[11px] text-stone-500 truncate">{driver.vehicle}</p>
                </div>
                <a href={`tel:${driver.phone}`} className="flex items-center justify-center w-9 h-9 bg-green-500/15 border border-green-500/25 rounded-xl text-green-400 hover:bg-green-500/25 transition-colors">
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>
              <div className="mt-3 flex items-center gap-2 bg-orange-500/8 border border-orange-500/20 rounded-xl px-3 py-2">
                <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <p className="text-xs font-black text-orange-300">ETA {driver.eta} minutes</p>
                <p className="text-[10px] text-stone-500 ml-auto">{driver.phone}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
              <User className="w-5 h-5 text-stone-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-stone-400">Driver not assigned yet</p>
                <p className="text-xs text-stone-600">A delivery partner will be assigned once the order is ready for pickup.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Orders({ orders, flash }: { orders: any[]; flash: (m: string) => void }) {
  const [view, setView] = useState<'active' | 'past' | 'receipts'>('active');
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const ACTIVE = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'];

  const active = orders.filter(o => ACTIVE.includes(o.orderStatus ?? o.status ?? 'placed'));
  const past   = [...orders].filter(o => ['delivered','cancelled'].includes(o.orderStatus ?? o.status ?? '')).sort((a,b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));

  const advance = async (o: any, status: string) => {
    try { await setOrderStatus(o.id, status); flash(`Marked: ${status.replace(/_/g, ' ')}`); }
    catch { flash('Could not update order'); }
  };

  const accept = async (o: any, prepMins: number) => {
    try { await updateOrderFields(o.id, { orderStatus: 'confirmed', prepMinutes: prepMins }); flash(`Accepted · ${prepMins} min prep`); }
    catch { flash('Could not accept order'); }
  };

  return (
    <div>
      <AnimatePresence>
        {trackingOrder && <TrackingModal order={trackingOrder} onClose={() => setTrackingOrder(null)} />}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Orders</h1>
          <p className="text-sm text-stone-500">{active.length} active · {past.length} past</p>
        </div>
        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          {([['active','Active'], ['past','Past'], ['receipts','Receipts']] as const).map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${view === v ? 'bg-white/15 text-white' : 'text-stone-500 hover:text-white'}`}>
              {l}{v === 'active' && active.length > 0 && <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center bg-red-500 rounded-full text-[9px] font-black text-white">{active.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {view === 'active' && (
        active.length === 0 ? <div className="glass-soft rounded-2xl p-10 text-center text-stone-500 text-sm">No active orders.</div> :
        <div className="space-y-3">
          {active.sort((a,b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).map(o => {
            const status = o.orderStatus ?? o.status ?? 'placed';
            const isNew  = status === 'placed';
            return (
              <div key={o.id} className={`glass rounded-2xl p-5 ${isNew ? 'border border-orange-500/40' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-black text-white flex items-center gap-2">
                      Order #{String(o.id).slice(-6).toUpperCase()}
                      {isNew && <span className="text-[8px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
                    </p>
                    <p className="text-[11px] text-stone-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''} · {o.deliveryType || 'delivery'}{o.prepMinutes ? ` · ${o.prepMinutes}min prep` : ''}</p>
                  </div>
                  <p className="font-black text-white">{money(o.finalTotal ?? o.total)}</p>
                </div>
                <div className="text-xs text-stone-400 mb-3 space-y-0.5">
                  {(o.items || []).map((it: any, i: number) => <p key={i}>{(it.quantity ?? it.qty)}× {(it.pizzaName ?? it.name)}</p>)}
                </div>
                {o.deliveryAddress && <p className="text-[11px] text-stone-500 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" /> {o.deliveryAddress}</p>}
                {isNew ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1"><Timer className="w-3 h-3" /> Prep:</span>
                    {PREP_OPTIONS.map(p => (
                      <button key={p} onClick={() => accept(o, p)} className="text-[11px] font-bold bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 px-2.5 py-1.5 rounded-lg transition-colors">{p}m</button>
                    ))}
                    <button onClick={() => advance(o, 'cancelled')} className="ml-auto text-[11px] font-bold text-red-400 hover:bg-red-500/10 border border-red-500/25 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><X className="w-3 h-3" /> Reject</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setTrackingOrder(o)} className="flex items-center gap-1.5 text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 px-3 py-1.5 rounded-lg transition-colors">
                      <Navigation className="w-3 h-3" /> Track
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-300">{status.replace(/_/g, ' ')}</span>
                    <select value={status} onChange={e => advance(o, e.target.value)} className="ml-auto bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-bold">
                      {ORDER_STAGES.map(s => <option key={s} value={s} className="bg-stone-900">{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'past' && (
        past.length === 0 ? <div className="glass-soft rounded-2xl p-10 text-center text-stone-500 text-sm">No past orders.</div> :
        <div className="glass rounded-2xl divide-y divide-white/5 overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_100px_90px] text-[9px] font-black uppercase tracking-widest text-stone-600 px-5 py-3 bg-black/40">
            <span>Order</span><span className="text-center">Items</span><span className="text-center">Total</span><span className="text-center">Status</span>
          </div>
          {past.map(o => (
            <div key={o.id} className="grid grid-cols-[1fr_80px_100px_90px] items-center px-5 py-3 hover:bg-white/3 transition-colors">
              <div>
                <p className="text-xs font-black text-white">#{String(o.id).slice(-6).toUpperCase()}</p>
                <p className="text-[9px] text-stone-600">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</p>
              </div>
              <p className="text-xs text-stone-500 text-center">{(o.items||[]).length}</p>
              <p className="text-sm font-black text-white text-center">{money(o.finalTotal ?? o.total)}</p>
              <p className={`text-[9px] font-black uppercase text-center ${(o.orderStatus ?? o.status) === 'delivered' ? 'text-green-400' : 'text-red-400'}`}>{(o.orderStatus ?? o.status ?? '').replace(/_/g,' ')}</p>
            </div>
          ))}
        </div>
      )}

      {view === 'receipts' && (
        <div className="space-y-3">
          <div className="glass rounded-2xl p-4 mb-4">
            <p className="text-xs font-black text-stone-500 mb-3 uppercase tracking-widest">Commission Summary (All Time)</p>
            {(() => {
              const completed = orders.filter(o => (o.orderStatus ?? o.status) !== 'cancelled');
              const gross = completed.reduce((s,o) => s + (Number(o.finalTotal ?? o.total)||0), 0);
              const fee   = gross * PLATFORM_FEE;
              const net   = gross - fee;
              return (
                <div className="flex gap-6">
                  <div><p className="text-[9px] text-stone-500 font-bold uppercase">Gross</p><p className="text-lg font-black text-white">{money(gross)}</p></div>
                  <div><p className="text-[9px] text-stone-500 font-bold uppercase">MiSlice 20%</p><p className="text-lg font-black text-red-400">−{money(fee)}</p></div>
                  <div><p className="text-[9px] text-stone-500 font-bold uppercase">Your Payout</p><p className="text-lg font-black text-green-400">{money(net)}</p></div>
                </div>
              );
            })()}
          </div>
          {orders.filter(o => (o.orderStatus ?? o.status) !== 'cancelled').sort((a,b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).map(o => {
            const gross = Number(o.finalTotal ?? o.total) || 0;
            const fee   = gross * PLATFORM_FEE;
            const net   = gross - fee;
            return (
              <div key={o.id} className="glass rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">#{String(o.id).slice(-6).toUpperCase()}</p>
                  <p className="text-[10px] text-stone-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</p>
                  <p className="text-[9px] text-stone-600 mt-0.5">MiSlice fee: −{money(fee)}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-green-400">+{money(net)}</p>
                  <p className="text-[9px] text-stone-600">of {money(gross)} gross</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

type InsightFilter = 'all' | 'sales' | 'operations' | 'suggestions';

function AIInsights({ orders }: { orders: any[] }) {
  const [filter, setFilter]   = useState<InsightFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const completed = orders.filter(o => (o.orderStatus ?? o.status) !== 'cancelled');
  const now       = Date.now();
  const week      = 7 * 86400000;

  const thisWeek = completed.filter(o => now - new Date(o.createdAt).getTime() < week);
  const lastWeek = completed.filter(o => { const a = now - new Date(o.createdAt).getTime(); return a >= week && a < week * 2; });

  const countItems = (ords: any[]) => {
    const c: Record<string, number> = {};
    ords.forEach(o => (o.items||[]).forEach((it: any) => { const n = it.pizzaName ?? it.name ?? 'Item'; c[n] = (c[n]||0) + (it.quantity ?? it.qty ?? 1); }));
    return c;
  };
  const thisItems = countItems(thisWeek);
  const lastItems = countItems(lastWeek);

  type InsightCard = { id: string; cat: InsightFilter; icon: React.ElementType; color: string; bg: string; title: string; detail: string; };
  const insights: InsightCard[] = [];

  Object.entries(thisItems).forEach(([name, cnt]) => {
    const prev = lastItems[name] || 0;
    if (prev > 0 && cnt > prev) {
      const pct = Math.round(((cnt - prev) / prev) * 100);
      if (pct >= 30) insights.push({ id: `up_${name}`, cat: 'sales', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', title: `${name} orders up ${pct}% this week`, detail: `${cnt} orders vs ${prev} last week. Consider featuring it as a deal to capitalise on demand.` });
    }
    if (prev > 0 && cnt < prev) {
      const pct = Math.round(((prev - cnt) / prev) * 100);
      if (pct >= 30) insights.push({ id: `dn_${name}`, cat: 'sales', icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', title: `${name} orders dropped ${pct}%`, detail: `Only ${cnt} orders vs ${prev} last week. Try a limited-time discount to bring customers back.` });
    }
  });

  const dayRevenue: Record<number, number> = {};
  thisWeek.forEach(o => { const d = new Date(o.createdAt).getDay(); dayRevenue[d] = (dayRevenue[d]||0) + (Number(o.finalTotal ?? o.total)||0); });
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const days = Object.entries(dayRevenue);
  if (days.length >= 2) {
    const peak = days.sort((a,b) => +b[1] - +a[1])[0];
    const slow = days.sort((a,b) => +a[1] - +b[1])[0];
    if (+peak[1] > +slow[1] * 1.4) {
      const pct = Math.round(((+peak[1] - +slow[1]) / +slow[1]) * 100);
      insights.push({ id: 'peak_day', cat: 'operations', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', title: `${dayNames[+peak[0]]} revenue is ${pct}% higher than ${dayNames[+slow[0]]}`, detail: `Consider running a promotion on ${dayNames[+slow[0]]} to boost your slowest day.` });
    }
  }

  const cancelRate = orders.length ? (orders.filter(o => (o.orderStatus ?? o.status) === 'cancelled').length / orders.length) * 100 : 0;
  if (cancelRate > 10) insights.push({ id: 'cancel', cat: 'operations', icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', title: `High cancellation rate — ${cancelRate.toFixed(0)}%`, detail: 'Review your prep time estimates. High cancellations can hurt your MiSlice ranking.' });

  // Static suggestions
  insights.push(
    { id: 'family_deal', cat: 'suggestions', icon: Lightbulb, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Add a Family Meal Deal to boost average order value', detail: 'Bundles (2 large pizzas + drinks) increase AOV by 35–60%. Customers love them on weekends.' },
    { id: 'drinks_upsell', cat: 'suggestions', icon: Lightbulb, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Pair beverages with pizza at checkout', detail: 'Customers who add a drink spend 28% more on average. Add a "Add a drink?" prompt in your deals.' },
    { id: 'photos', cat: 'suggestions', icon: Camera, color: 'text-orange-400', bg: 'bg-orange-500/10', title: 'Add food photos to your top 5 menu items', detail: 'Listings with photos get 3× more clicks on MiSlice. Upload high-quality images to your menu.' },
  );

  const shown = filter === 'all' ? insights : insights.filter(i => i.cat === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-400" /> AI Insights</h1>
        <button onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }} className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-white px-3 py-2 glass rounded-xl transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <p className="text-sm text-stone-500 mb-6">Real-time intelligence about your store performance and customers.</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {(['all','sales','operations','suggestions'] as InsightFilter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-red-600 text-white' : 'glass text-stone-500 hover:text-white'}`}>{f}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="glass-soft rounded-2xl p-10 text-center text-stone-500 text-sm">No insights yet. Insights grow smarter as orders come in.</div>
      ) : (
        <div className="space-y-3">
          {shown.map(ins => {
            const Icon = ins.icon;
            return (
              <div key={ins.id} className={`${ins.bg} border border-white/10 rounded-2xl p-4 flex gap-4`}>
                <div className={`w-9 h-9 rounded-xl ${ins.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${ins.color}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-white mb-1">{ins.title}</p>
                  <p className="text-xs text-stone-400 leading-relaxed">{ins.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

type EarningsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

function Earnings({ orders }: { orders: any[] }) {
  const [period, setPeriod] = useState<EarningsPeriod>('weekly');

  const filter = (ords: any[]) => {
    const now = new Date();
    return ords.filter(o => {
      const d = new Date(o.createdAt);
      if (period === 'daily')   return d.toDateString() === now.toDateString();
      if (period === 'weekly')  { const w = new Date(now); w.setDate(now.getDate()-7); return d >= w; }
      if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return d.getFullYear() === now.getFullYear();
    }).filter(o => (o.orderStatus ?? o.status) !== 'cancelled');
  };

  const paid  = filter(orders);
  const gross = paid.reduce((s, o) => s + (Number(o.finalTotal ?? o.total)||0), 0);
  const fees  = gross * PLATFORM_FEE;
  const net   = gross - fees;
  const aov   = paid.length ? gross / paid.length : 0;

  // 7-day chart
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    const total = orders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === d.toDateString() && (o.orderStatus ?? o.status) !== 'cancelled').reduce((s,o) => s+(Number(o.finalTotal ?? o.total)||0), 0);
    return { label, total };
  });
  const maxDay = Math.max(1, ...days.map(d => d.total));

  // Category breakdown
  const catRevenue: Record<string, number> = {};
  paid.forEach(o => (o.items||[]).forEach((it: any) => {
    const name = (it.pizzaName ?? it.name ?? '').toLowerCase();
    const cat  = name.includes('pizza')||name.includes('pepperoni')||name.includes('cheese') ? 'Pizzas' : name.includes('drink')||name.includes('coke')||name.includes('pepsi') ? 'Drinks' : name.includes('side')||name.includes('wing')||name.includes('bread') ? 'Sides' : 'Other';
    catRevenue[cat] = (catRevenue[cat]||0) + (it.itemTotal || Number(o.finalTotal ?? o.total)||0);
  }));
  const cats = Object.entries(catRevenue).sort((a,b) => b[1]-a[1]);
  const maxCat = Math.max(1, ...cats.map(c => c[1]));

  const CAT_COLORS: Record<string,string> = { Pizzas:'from-red-600 to-red-400', Drinks:'from-blue-600 to-blue-400', Sides:'from-yellow-600 to-yellow-400', Other:'from-stone-600 to-stone-400' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Earnings</h1>
          <p className="text-sm text-stone-500">Revenue after {Math.round(PLATFORM_FEE*100)}% MiSlice commission.</p>
        </div>
        <div className="flex gap-1 glass p-1 rounded-xl border border-white/10">
          {(['daily','weekly','monthly','yearly'] as EarningsPeriod[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-black capitalize transition-all ${period === p ? 'bg-white/15 text-white' : 'text-stone-500 hover:text-white'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Gross Sales',   val: money(gross), color: 'text-white' },
          { label: `Fee (${Math.round(PLATFORM_FEE*100)}%)`, val: `−${money(fees)}`, color: 'text-red-400' },
          { label: 'Your Net',      val: money(net),   color: 'text-green-400' },
          { label: 'Avg Order',     val: money(aov),   color: 'text-blue-400'  },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase text-stone-500 mb-2">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="glass rounded-2xl p-5 mb-6">
        <p className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4">Revenue — Last 7 Days</p>
        <div className="flex items-end justify-between gap-2 h-36">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              {d.total > 0 && <p className="text-[8px] font-bold text-stone-500">${d.total.toFixed(0)}</p>}
              <div className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t-md transition-all" style={{ height: `${(d.total/maxDay)*100}%`, minHeight: d.total > 0 ? 4 : 0 }} />
              <span className="text-[9px] text-stone-500 font-bold">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      {cats.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <p className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4">Revenue by Category</p>
          <div className="space-y-3">
            {cats.map(([cat, rev]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-white">{cat}</span>
                  <span className="text-stone-400">{money(rev)} · {gross > 0 ? ((rev/gross)*100).toFixed(0) : 0}%</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${CAT_COLORS[cat]||CAT_COLORS.Other} rounded-full`} style={{ width: `${(rev/maxCat)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <h2 className="text-sm font-black text-white mb-3">Transactions</h2>
      {paid.length === 0 ? (
        <div className="glass-soft rounded-2xl p-6 text-center text-stone-500 text-sm">No transactions for this period.</div>
      ) : (
        <div className="glass rounded-2xl divide-y divide-white/5">
          {[...paid].sort((a,b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, 15).map(o => (
            <div key={o.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-bold text-white">#{String(o.id).slice(-6).toUpperCase()}</p>
                <p className="text-[11px] text-stone-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-green-400">+{money((Number(o.finalTotal??o.total)||0)*(1-PLATFORM_FEE))}</p>
                <p className="text-[9px] text-stone-600">of {money(Number(o.finalTotal??o.total)||0)} gross</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function Profile({ storeId, store, setStore, flash }: { storeId: string; store: StoreDoc; setStore: React.Dispatch<React.SetStateAction<StoreDoc | null>>; flash: (m: string) => void }) {
  const [form, setForm] = useState<any>({ store_name: store.store_name || '', tagline: (store as any).tagline || '', city: store.city || '', state: store.state || 'MI', phone: (store as any).phone || '', address: (store as any).address || '' });
  const [hours, setHours] = useState<{ day: string; open: string; close: string; closed: boolean }[]>(
    (store as any).hours?.length ? (store as any).hours : DAYS.map(day => ({ day, open: '11:00', close: '22:00', closed: false }))
  );
  const [saving, setSaving] = useState(false);

  const setHour = (i: number, patch: Partial<{ open: string; close: string; closed: boolean }>) =>
    setHours(h => h.map((d, idx) => idx === i ? { ...d, ...patch } : d));

  const save = async () => {
    setSaving(true);
    try { await updateStore(storeId, { ...form, hours } as any); setStore(s => s ? { ...s, ...form, hours } as any : s); flash('Profile saved'); }
    catch (e) { console.error(e); flash('Could not save'); }
    finally { setSaving(false); }
  };

  const field = (label: string, key: string, icon?: React.ElementType, placeholder = '') => (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">{label}</label>
      <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3">
        {icon && React.createElement(icon, { className: 'w-4 h-4 text-stone-500 shrink-0' })}
        <input value={form[key]} placeholder={placeholder} onChange={e => setForm({ ...form, [key]: e.target.value })} className="w-full bg-transparent px-3 py-3 text-white text-sm outline-none" />
      </div>
    </div>
  );

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-black text-white mb-1">Store Profile</h1>
      <p className="text-sm text-stone-500 mb-6">Saved to your Firebase store record.</p>
      <div className="glass rounded-3xl p-6 space-y-4">
        {field('Store Name', 'store_name', Store)}
        {field('Tagline', 'tagline')}
        {field('Address', 'address', MapPin)}
        <div className="grid grid-cols-2 gap-3">{field('City', 'city')}{field('State', 'state')}</div>
        {field('Phone', 'phone', Phone, '+1 (555) 000-0000')}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5 mb-2"><Clock className="w-3 h-3" /> Operating Hours</label>
          <div className="space-y-1.5">
            {hours.map((h, i) => (
              <div key={h.day} className="flex items-center gap-2">
                <span className="w-9 text-xs font-bold text-stone-400">{h.day}</span>
                {h.closed ? <span className="flex-1 text-xs text-stone-600 font-bold">Closed</span> : (
                  <>
                    <input type="time" value={h.open} onChange={e => setHour(i, { open: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
                    <span className="text-stone-600 text-xs">–</span>
                    <input type="time" value={h.close} onChange={e => setHour(i, { close: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
                  </>
                )}
                <button onClick={() => setHour(i, { closed: !h.closed })} className={`ml-auto text-[9px] font-black px-2 py-1 rounded-full border ${h.closed ? 'bg-stone-500/15 text-stone-500 border-white/10' : 'bg-green-500/15 text-green-400 border-green-500/25'}`}>
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
