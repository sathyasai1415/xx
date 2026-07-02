import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import {
  Store as StoreIcon, ShieldCheck, DollarSign, ListOrdered, Ticket, Activity,
  Zap, TrendingUp, TrendingDown, ShoppingBag, Users, CheckCircle2, XCircle,
  Clock, Lightbulb, RefreshCw, AlertTriangle, X, Check, ToggleRight, ToggleLeft,
  Menu, ChevronRight, LogOut,
} from 'lucide-react';
import { logAudit } from '../../utils/audit';
import { initializeCollections } from '../../utils/initDB';
import { useAuth } from '../../store/AuthContext';

type Tab = 'overview' | 'ai' | 'restaurants' | 'orders' | 'payouts' | 'coupons';

const money = (n: number) => `$${(Number(n)||0).toFixed(2)}`;

// ─── Platform Admin Dashboard ──────────────────────────────────────────────────

export function PlatformAdminDashboard() {
  const { logout } = useAuth();
  const [tab, setTab]           = useState<Tab>('overview');
  const [stores, setStores]     = useState<any[]>([]);
  const [orders, setOrders]     = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [toast, setToast]       = useState('');

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    const unsubStores = onSnapshot(query(collection(db, 'stores')), snap =>
      setStores(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubOrders = onSnapshot(query(collection(db, 'orders')), snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
      setOrders(docs);
    });
    return () => { unsubStores(); unsubOrders(); };
  }, []);

  const approved  = useMemo(() => stores.filter(s => s.application_status === 'approved' || s.is_approved), [stores]);
  const pending   = useMemo(() => stores.filter(s => s.application_status && s.application_status !== 'approved' && s.application_status !== 'rejected' && s.application_status !== 'suspended'), [stores]);
  const completed = useMemo(() => orders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'completed'), [orders]);
  const cancelled = useMemo(() => orders.filter(o => o.orderStatus === 'cancelled'), [orders]);

  const grossRevenue = useMemo(() => orders.filter(o => o.orderStatus !== 'cancelled').reduce((s, o) => s + (Number(o.customerFinalTotal ?? o.finalTotal ?? o.total) || 0), 0), [orders]);
  const platformFees = useMemo(() => grossRevenue * 0.20, [grossRevenue]);

  const approveStore = async (storeId: string, note = 'Approved by platform admin') => {
    await updateDoc(doc(db, 'stores', storeId), { is_approved: true, application_status: 'approved', reviewedAt: new Date().toISOString(), review_notes: note });
    flash('Store approved');
  };

  const rejectStore = async (storeId: string, reason: string) => {
    await updateDoc(doc(db, 'stores', storeId), { is_approved: false, application_status: 'rejected', reviewedAt: new Date().toISOString(), rejection_reason: reason, review_notes: reason });
    flash('Store rejected');
  };

  const suspendStore = async (storeId: string) => {
    await updateDoc(doc(db, 'stores', storeId), { application_status: 'suspended', reviewedAt: new Date().toISOString(), review_notes: 'Suspended by platform admin' });
    flash('Store suspended');
  };

  const markPayoutPaid = async (orderId: string) => {
    await updateDoc(doc(db, 'orders', orderId), { payoutStatus: 'paid', paidByAdminId: auth.currentUser?.uid, payoutDate: new Date().toISOString(), payoutTransactionId: `TXN-${Date.now()}` });
    await logAudit('PAYOUT_MARKED_PAID', 'orders', 'pending', 'paid', auth.currentUser?.uid || 'admin', 'Admin', 'isPlatformAdmin');
    flash('Payout marked as paid');
  };

  const goTab = (t: Tab) => { setTab(t); setSidebarOpen(false); };

  const NAV: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview',     label: 'Overview',     icon: Activity    },
    { id: 'ai',          label: 'AI Insights',   icon: Zap         },
    { id: 'restaurants', label: 'Restaurants',   icon: StoreIcon,  badge: pending.length },
    { id: 'orders',      label: 'All Orders',    icon: ListOrdered },
    { id: 'payouts',     label: 'Payouts',       icon: DollarSign  },
    { id: 'coupons',     label: 'Coupons',       icon: Ticket      },
  ];

  return (
    <div className="min-h-screen w-full bg-[#080808] text-stone-100 lg:flex">

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-[#0b0b0b] border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-white/8 transition-colors">
          <Menu className="w-5 h-5 text-stone-300" />
        </button>
        <ShieldCheck className="w-5 h-5 text-red-500" />
        <p className="text-sm font-black text-white">MiSlice Admin</p>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-60 shrink-0 bg-[#0b0b0b] border-r border-white/8 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 lg:h-screen lg:sticky lg:top-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-white">MiSlice Admin</p>
              <p className="text-[9px] text-stone-600 font-bold uppercase tracking-widest">Platform Control</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-white/8">
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => goTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === id ? 'bg-gradient-to-r from-red-700/90 to-red-600/60 text-white' : 'text-stone-400 hover:bg-white/6 hover:text-white'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge != null && badge > 0 && <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/8 space-y-2">
          <p className="text-[9px] font-bold text-stone-700 text-center px-2 truncate">{auth.currentUser?.email}</p>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition-all"
            style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {tab === 'overview'     && <OverviewTab stores={stores} orders={orders} approved={approved} pending={pending} grossRevenue={grossRevenue} platformFees={platformFees} isInitializing={isInitializing} setIsInitializing={setIsInitializing} flash={flash} />}
          {tab === 'ai'          && <AIInsightsTab stores={stores} orders={orders} approved={approved} completed={completed} cancelled={cancelled} />}
          {tab === 'restaurants' && <RestaurantsTab stores={stores} pending={pending} approveStore={approveStore} rejectStore={rejectStore} suspendStore={suspendStore} />}
          {tab === 'orders'      && <OrdersTab orders={orders} stores={stores} />}
          {tab === 'payouts'     && <PayoutsTab orders={orders} stores={stores} markPayoutPaid={markPayoutPaid} />}
          {tab === 'coupons'     && <CouponsTab />}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab({ stores, orders, approved, pending, grossRevenue, platformFees, isInitializing, setIsInitializing, flash }: any) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    const total = orders.filter((o: any) => o.createdAt && new Date(o.createdAt).toDateString() === d.toDateString() && o.orderStatus !== 'cancelled').reduce((s: number, o: any) => s + (Number(o.customerFinalTotal ?? o.finalTotal ?? o.total) || 0), 0);
    return { label, total };
  });
  const maxDay = Math.max(1, ...days.map(d => d.total));

  const storeRevenue: Record<string, number> = {};
  orders.filter((o: any) => o.orderStatus !== 'cancelled').forEach((o: any) => {
    const sid = o.storeId || o.store_id || '';
    storeRevenue[sid] = (storeRevenue[sid] || 0) + (Number(o.customerFinalTotal ?? o.finalTotal ?? o.total) || 0);
  });
  const topStores = Object.entries(storeRevenue).map(([id, rev]) => ({ id, rev, name: stores.find((s: any) => s.id === id)?.store_name || 'Unknown' })).sort((a, b) => b.rev - a.rev).slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Platform Overview</h1>
          <p className="text-sm text-stone-500">Real-time snapshot of the MiSlice platform.</p>
        </div>
        <button onClick={async () => { setIsInitializing(true); await initializeCollections(); setIsInitializing(false); flash('24 collections initialized!'); }}
          disabled={isInitializing} className="text-xs font-bold text-stone-500 hover:text-white border border-white/10 rounded-xl px-3 py-2 transition-colors hover:bg-white/5">
          {isInitializing ? 'Initializing…' : 'Init DB'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Gross Revenue',    val: money(grossRevenue),   color: 'text-white',      icon: DollarSign  },
          { label: 'Platform Revenue', val: money(platformFees),   color: 'text-red-400',    icon: TrendingUp  },
          { label: 'Total Orders',     val: orders.length,         color: 'text-blue-400',   icon: ShoppingBag },
          { label: 'Active Stores',    val: approved.length,       color: 'text-green-400',  icon: StoreIcon   },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-5">
            <k.icon className={`w-4 h-4 ${k.color} mb-3`} />
            <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
            <p className="text-[10px] text-stone-500 font-bold mt-0.5 uppercase">{k.label}</p>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="bg-orange-500/8 border border-orange-500/25 rounded-2xl px-5 py-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <p className="text-sm font-bold text-white">{pending.length} restaurant application{pending.length !== 1 ? 's' : ''} awaiting review</p>
          </div>
          <ChevronRight className="w-4 h-4 text-orange-400" />
        </div>
      )}

      {/* Revenue chart */}
      <div className="glass rounded-2xl p-5 mb-6">
        <p className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4">Platform Revenue — Last 7 Days</p>
        <div className="flex items-end justify-between gap-2 h-36">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              {d.total > 0 && <p className="text-[8px] font-bold text-stone-500">${d.total.toFixed(0)}</p>}
              <div className="w-full bg-gradient-to-t from-red-700 to-red-500 rounded-t-md" style={{ height: `${(d.total/maxDay)*100}%`, minHeight: d.total > 0 ? 4 : 0 }} />
              <span className="text-[9px] text-stone-500 font-bold">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top stores */}
      {topStores.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4">Top Stores by Revenue</p>
          <div className="space-y-3">
            {topStores.map(({ id, rev, name }, i) => (
              <div key={id} className="flex items-center gap-3">
                <span className="w-5 text-[10px] font-black text-stone-600">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{name}</p>
                  <div className="h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(rev/topStores[0].rev)*100}%` }} />
                  </div>
                </div>
                <p className="text-sm font-black text-white shrink-0">{money(rev)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Insights (Admin) ──────────────────────────────────────────────────────

function AIInsightsTab({ stores, orders, approved, completed, cancelled }: any) {
  const [refreshing, setRefreshing] = useState(false);

  const pendingStores = stores.filter((s: any) => s.application_status && s.application_status !== 'approved' && s.application_status !== 'rejected' && s.application_status !== 'suspended');
  const cancelRate = orders.length ? (cancelled.length / orders.length) * 100 : 0;
  const avgOrderValue = completed.length ? completed.reduce((s: number, o: any) => s + (Number(o.customerFinalTotal ?? o.finalTotal ?? o.total)||0), 0) / completed.length : 0;

  const now = Date.now();
  const WEEK = 7 * 86400000;
  const thisWeek = completed.filter((o: any) => now - new Date(o.createdAt).getTime() < WEEK);
  const lastWeek = completed.filter((o: any) => { const a = now - new Date(o.createdAt).getTime(); return a >= WEEK && a < WEEK*2; });
  const weekRevenue     = thisWeek.reduce((s: number, o: any) => s + (Number(o.customerFinalTotal ?? o.finalTotal ?? o.total)||0), 0);
  const lastWeekRevenue = lastWeek.reduce((s: number, o: any) => s + (Number(o.customerFinalTotal ?? o.finalTotal ?? o.total)||0), 0);
  const weekGrowth = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

  const storeOrderCounts: Record<string, number> = {};
  completed.forEach((o: any) => { const s = o.storeId || ''; storeOrderCounts[s] = (storeOrderCounts[s]||0) + 1; });
  const topStore = Object.entries(storeOrderCounts).sort((a,b) => b[1]-a[1])[0];
  const topStoreName = topStore ? stores.find((s: any) => s.id === topStore[0])?.store_name || 'Unknown' : null;

  type Insight = { id: string; color: string; bg: string; icon: React.ElementType; title: string; detail: string; };
  const insights: Insight[] = [];

  if (weekGrowth > 15) insights.push({ id: 'week_up', color: 'text-green-400', bg: 'bg-green-500/10', icon: TrendingUp, title: `Platform revenue up ${weekGrowth.toFixed(0)}% week-over-week`, detail: `${money(weekRevenue)} this week vs ${money(lastWeekRevenue)} last week. Strong growth signal — consider running a platform-wide promo to sustain momentum.` });
  if (weekGrowth < -15) insights.push({ id: 'week_dn', color: 'text-red-400', bg: 'bg-red-500/10', icon: TrendingDown, title: `Platform revenue dropped ${Math.abs(weekGrowth).toFixed(0)}% this week`, detail: `${money(weekRevenue)} this week vs ${money(lastWeekRevenue)} last week. Consider activating a platform-wide coupon to recover volume.` });
  if (cancelRate > 12) insights.push({ id: 'cancel', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: AlertTriangle, title: `High platform cancellation rate: ${cancelRate.toFixed(0)}%`, detail: `${cancelled.length} of ${orders.length} orders cancelled. Identify which stores have the highest cancel rates and reach out.` });
  if (pendingStores.length > 0) insights.push({ id: 'pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock, title: `${pendingStores.length} restaurant${pendingStores.length !== 1 ? 's' : ''} waiting for approval`, detail: 'New restaurants are waiting for approval. Review their applications to get them live and generating commission.' });
  if (topStoreName) insights.push({ id: 'top_store', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: StoreIcon, title: `${topStoreName} is your #1 revenue driver`, detail: `${topStore?.[1] || 0} completed orders. This is your anchor store — ensure they have priority support and are featured on the home screen.` });
  if (avgOrderValue > 0) insights.push({ id: 'aov', color: 'text-violet-400', bg: 'bg-violet-500/10', icon: DollarSign, title: `Platform average order value: ${money(avgOrderValue)}`, detail: avgOrderValue < 20 ? 'Low AOV. Consider setting a higher minimum order per store, or promoting bundle deals.' : 'Healthy AOV. Consider promoting premium items to push it higher.' });
  insights.push(
    { id: 'expand', color: 'text-pink-400', bg: 'bg-pink-500/10', icon: Lightbulb, title: 'Recruit restaurants in Ann Arbor & Lansing', detail: 'Platform demand signals suggest high customer interest in these Michigan cities. Onboarding 2–3 restaurants per city would capture this demand.' },
    { id: 'loyalty', color: 'text-teal-400', bg: 'bg-teal-500/10', icon: Users, title: 'Launch a customer loyalty program', detail: 'Platforms with loyalty points see 23% higher order frequency. A simple "earn 1 point per $1" system would significantly increase LTV.' },
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-400" /> Platform AI</h1>
        <button onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 900); }}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-white px-3 py-2 glass rounded-xl transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <p className="text-sm text-stone-500 mb-6">AI-generated insights about the MiSlice marketplace.</p>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Week Revenue',  val: money(weekRevenue),              color: weekGrowth > 0 ? 'text-green-400' : 'text-white'  },
          { label: 'WoW Growth',    val: `${weekGrowth >= 0 ? '+' : ''}${weekGrowth.toFixed(0)}%`, color: weekGrowth > 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Cancel Rate',   val: `${cancelRate.toFixed(0)}%`,     color: cancelRate > 12 ? 'text-orange-400' : 'text-white' },
          { label: 'Avg Order',     val: money(avgOrderValue),            color: 'text-blue-400'                                   },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-4">
            <p className="text-[9px] text-stone-500 font-black uppercase tracking-widest mb-1.5">{k.label}</p>
            <p className={`text-xl font-black ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {insights.map(ins => {
          const Icon = ins.icon;
          return (
            <div key={ins.id} className={`${ins.bg} border border-white/8 rounded-2xl p-4 flex gap-4`}>
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
    </div>
  );
}

// ─── Restaurants ──────────────────────────────────────────────────────────────

// ─── Reject Modal ─────────────────────────────────────────────────────────────

const REJECT_REASONS = [
  'Incomplete store information',
  'No menu items added',
  'Invalid Michigan address',
  'Phone number unverifiable',
  'Duplicate store listing',
  'Violates platform policies',
];

function RejectModal({ store, onConfirm, onClose }: { store: any; onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');

  const finalReason = reason === '__custom__' ? custom.trim() : reason;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#111', border: '1px solid rgba(220,38,38,0.3)' }}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-black text-white">Reject Application</h3>
            <p className="text-xs text-stone-400 mt-0.5">{store.store_name || 'Unnamed Store'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-white transition" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Select a reason</p>
          {REJECT_REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)}
              className={`w-full text-left text-xs font-medium px-4 py-2.5 rounded-xl transition-all ${reason === r ? 'text-white border border-red-500/50' : 'text-stone-400 border border-white/8 hover:border-white/20 hover:text-white'}`}
              style={reason === r ? { background: 'rgba(220,38,38,0.15)' } : { background: 'rgba(255,255,255,0.04)' }}>
              {r}
            </button>
          ))}
          <button onClick={() => setReason('__custom__')}
            className={`w-full text-left text-xs font-medium px-4 py-2.5 rounded-xl transition-all ${reason === '__custom__' ? 'text-white border border-red-500/50' : 'text-stone-400 border border-white/8 hover:border-white/20 hover:text-white'}`}
            style={reason === '__custom__' ? { background: 'rgba(220,38,38,0.15)' } : { background: 'rgba(255,255,255,0.04)' }}>
            Write a custom reason…
          </button>
          {reason === '__custom__' && (
            <textarea
              value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="Explain why this application is rejected…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-stone-400 transition hover:text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button
            onClick={() => { if (finalReason) { onConfirm(finalReason); onClose(); } }}
            disabled={!finalReason}
            className="flex-1 py-2.5 rounded-xl text-sm font-black text-white transition disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
            Reject Store
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Store Detail Drawer ───────────────────────────────────────────────────────

function StoreDetailDrawer({ store, onApprove, onReject, onSuspend, onClose }: {
  store: any;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onSuspend: () => void;
  onClose: () => void;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const status = store.application_status || (store.is_approved ? 'approved' : 'draft');

  const Field = ({ label, value }: { label: string; value?: string | number }) => (
    <div>
      <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-white font-medium">{value || <span className="text-stone-600">Not provided</span>}</p>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-md flex flex-col overflow-hidden"
        style={{ background: '#0f0f0f', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/8">
          <div>
            <h2 className="text-lg font-black text-white">{store.store_name || 'Unnamed Store'}</h2>
            <p className="text-xs text-stone-500 mt-0.5">{store.city || 'Detroit'}, {store.state || 'MI'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${
              status === 'approved' ? 'bg-green-500/15 text-green-400 border border-green-500/25' :
              status === 'rejected' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
              status === 'suspended' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
              'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'
            }`}>{status.replace(/_/g, ' ').toUpperCase()}</span>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-white" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Contact */}
          <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Contact Information</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Owner Name" value={store.first_name ? `${store.first_name} ${store.last_name || ''}`.trim() : store.ownerName} />
              <Field label="Phone" value={store.phone} />
              <Field label="Email" value={store.email} />
              <Field label="SMS Opt-In" value={store.smsOptIn ? 'Yes' : 'No'} />
            </div>
          </div>

          {/* Store Details */}
          <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Store Details</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Store Name" value={store.store_name} />
              <Field label="Business Type" value={store.business_type} />
              <Field label="Cuisine Type" value={store.cuisine_type} />
              <Field label="Locations" value={store.locations} />
            </div>
            <Field label="Address" value={store.address ? `${store.address}, ${store.city}, ${store.state} ${store.zip || ''}`.trim() : undefined} />
            {store.social_link && <Field label="Social / Website" value={store.social_link} />}
          </div>

          {/* Delivery Settings */}
          <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Delivery Settings</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Delivery Fee" value={store.delivery_fee != null ? `$${Number(store.delivery_fee).toFixed(2)}` : undefined} />
              <Field label="Delivery Radius" value={store.delivery_radius != null ? `${store.delivery_radius} miles` : undefined} />
              <Field label="Minimum Order" value={store.minimum_order != null ? `$${Number(store.minimum_order).toFixed(2)}` : undefined} />
              <Field label="Avg. ETA" value={store.average_eta != null ? `${store.average_eta} min` : undefined} />
            </div>
          </div>

          {/* Setup status */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3">Setup Status</p>
            <div className="space-y-2">
              {[
                { label: 'Store info filled', done: !!store.store_name && !!store.address },
                { label: 'Contact info submitted', done: !!store.phone },
                { label: 'Delivery settings configured', done: store.delivery_fee != null },
                { label: 'Application submitted', done: ['submitted','under_review','approved'].includes(store.application_status) },
                { label: 'Admin approved', done: store.is_approved === true },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2.5 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-500/20 text-green-400' : 'bg-white/6 text-stone-600'}`}>
                    {done ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  </div>
                  <span className={done ? 'text-stone-300' : 'text-stone-600'}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rejection reason if rejected */}
          {store.rejection_reason && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">Rejection Reason</p>
              <p className="text-sm text-red-300">{store.rejection_reason}</p>
            </div>
          )}

          {/* Review notes */}
          {store.review_notes && store.review_notes !== store.rejection_reason && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Admin Notes</p>
              <p className="text-sm text-stone-400">{store.review_notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-[10px] text-stone-700 space-y-1">
            {store.createdAt && <p>Applied: {new Date(store.createdAt?.seconds ? store.createdAt.seconds * 1000 : store.createdAt).toLocaleString()}</p>}
            {store.reviewedAt && <p>Reviewed: {new Date(store.reviewedAt).toLocaleString()}</p>}
            <p>Store ID: {store.id}</p>
          </div>
        </div>

        {/* Action bar */}
        <div className="p-4 border-t border-white/8 space-y-2">
          {status !== 'approved' && (
            <button onClick={() => { onApprove(); onClose(); }}
              className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              <CheckCircle2 className="w-4 h-4" /> Approve & Publish Store
            </button>
          )}
          {status === 'approved' && (
            <button onClick={() => { onSuspend(); onClose(); }}
              className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition"
              style={{ background: 'linear-gradient(135deg,#ea580c,#c2410c)' }}>
              <AlertTriangle className="w-4 h-4" /> Suspend Store
            </button>
          )}
          {status !== 'approved' && (
            <button onClick={() => setShowRejectModal(true)}
              className="w-full py-3 rounded-xl font-black text-sm text-red-400 flex items-center justify-center gap-2 transition"
              style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)' }}>
              <XCircle className="w-4 h-4" /> Reject Application
            </button>
          )}
        </div>
      </div>

      {showRejectModal && (
        <RejectModal
          store={store}
          onConfirm={reason => onReject(reason)}
          onClose={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
}

// ─── Restaurants Tab ──────────────────────────────────────────────────────────

function RestaurantsTab({ stores, pending, approveStore, rejectStore, suspendStore }: any) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('pending');
  const [selected, setSelected] = useState<any | null>(null);

  const shown = filter === 'all' ? stores : stores.filter((s: any) => {
    const status = s.application_status || (s.is_approved ? 'approved' : 'pending');
    return status === filter;
  });

  const statusColor = (status: string) => {
    if (status === 'approved')  return 'bg-green-500/15 text-green-400 border-green-500/25';
    if (status === 'rejected')  return 'bg-red-500/15 text-red-400 border-red-500/25';
    if (status === 'suspended') return 'bg-orange-500/15 text-orange-400 border-orange-500/25';
    return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25';
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-white">Restaurants</h1>
            <p className="text-sm text-stone-500">{stores.length} total · {pending.length} awaiting review</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['pending', 'approved', 'rejected', 'suspended', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all flex items-center gap-1.5 ${filter === f ? 'bg-red-600 text-white' : 'text-stone-500 hover:text-white'}`}
              style={filter !== f ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
              {f}
              {f === 'pending' && pending.length > 0 && (
                <span className="bg-orange-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{pending.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Store list */}
        <div className="space-y-3">
          {shown.length === 0 && (
            <div className="py-16 text-center text-stone-500 text-sm rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {filter === 'pending' ? 'No pending applications — you\'re all caught up! 🎉' : `No ${filter} stores.`}
            </div>
          )}

          {shown.map((s: any) => {
            const status = s.application_status || (s.is_approved ? 'approved' : 'draft');
            const setupDone = !!s.store_name && !!s.address && !!s.phone;

            return (
              <button key={s.id} onClick={() => setSelected(s)} className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                style={{ background: status === 'pending' || status === 'submitted' || status === 'under_review' ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.04)', border: `1px solid ${status === 'pending' || status === 'submitted' || status === 'under_review' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl font-black text-white"
                    style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.3)' }}>
                    {(s.store_name || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-white">{s.store_name || 'Unnamed Store'}</p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${statusColor(status)}`}>
                        {status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {!setupDone && <span className="text-[8px] font-black px-2 py-0.5 rounded-full border border-stone-700 text-stone-500">INCOMPLETE</span>}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                      {s.address ? `${s.address}, ` : ''}{s.city || 'Detroit'}, {s.state || 'MI'}
                      {s.phone && ` · ${s.phone}`}
                    </p>
                  </div>

                  {/* Quick approve for pending */}
                  {(status === 'submitted' || status === 'under_review' || status === 'pending' || status === 'draft') && (
                    <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => approveStore(s.id)}
                        className="text-[10px] font-black text-green-400 px-3 py-1.5 rounded-xl transition hover:scale-105"
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
                        ✓ Approve
                      </button>
                    </div>
                  )}

                  {/* Suspend for approved */}
                  {status === 'approved' && (
                    <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => suspendStore(s.id)}
                        className="text-[10px] font-black text-orange-400 px-3 py-1.5 rounded-xl transition hover:scale-105"
                        style={{ background: 'rgba(234,88,12,0.1)', border: '1px solid rgba(234,88,12,0.2)' }}>
                        Suspend
                      </button>
                    </div>
                  )}

                  <ChevronRight className="w-4 h-4 text-stone-600 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <StoreDetailDrawer
          store={selected}
          onApprove={() => { approveStore(selected.id); setSelected(null); }}
          onReject={(reason) => { rejectStore(selected.id, reason); setSelected(null); }}
          onSuspend={() => { suspendStore(selected.id); setSelected(null); }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

// ─── All Orders ───────────────────────────────────────────────────────────────

function OrdersTab({ orders, stores }: any) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const shown = orders.filter((o: any) => {
    const s = o.orderStatus ?? o.status ?? '';
    if (statusFilter !== 'all' && s !== statusFilter) return false;
    if (search) { const q = search.toLowerCase(); return String(o.id).toLowerCase().includes(q) || (stores.find((st: any) => st.id === o.storeId)?.store_name || '').toLowerCase().includes(q); }
    return true;
  }).slice(0, 50);

  const STATUSES = ['all','placed','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled'];

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-1">All Orders</h1>
      <p className="text-sm text-stone-500 mb-5">{orders.length} total platform orders</p>
      <div className="flex gap-3 mb-4 flex-col sm:flex-row">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order ID or store…" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-red-500" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white">
          {STATUSES.map(s => <option key={s} value={s} className="bg-stone-900">{s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div className="glass rounded-2xl divide-y divide-white/5 overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_80px_110px_90px] text-[9px] font-black uppercase tracking-widest text-stone-600 px-5 py-3 bg-black/40">
          <span>ID</span><span>Store</span><span className="text-center">Total</span><span className="text-center">Status</span><span className="text-center">Date</span>
        </div>
        {shown.length === 0 && <div className="px-5 py-8 text-center text-stone-500 text-sm">No orders match this filter.</div>}
        {shown.map((o: any) => {
          const status = o.orderStatus ?? o.status ?? 'placed';
          return (
            <div key={o.id} className="grid grid-cols-[80px_1fr_80px_110px_90px] items-center px-5 py-3 hover:bg-white/3 text-sm">
              <p className="font-black text-white text-xs">#{String(o.id).slice(-6).toUpperCase()}</p>
              <p className="text-stone-300 truncate">{stores.find((s: any) => s.id === (o.storeId || o.store_id))?.store_name || '—'}</p>
              <p className="font-black text-white text-center">{money(o.customerFinalTotal ?? o.finalTotal ?? o.total)}</p>
              <p className={`text-[9px] font-black uppercase text-center ${status === 'delivered' ? 'text-green-400' : status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'}`}>{status.replace(/_/g, ' ')}</p>
              <p className="text-[10px] text-stone-600 text-center">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

function PayoutsTab({ orders, stores, markPayoutPaid }: any) {
  const pending  = orders.filter((o: any) => o.payoutStatus !== 'paid' && (o.orderStatus === 'delivered' || o.orderStatus === 'completed'));
  const paid     = orders.filter((o: any) => o.payoutStatus === 'paid');
  const pendingNet = pending.reduce((s: number, o: any) => s + (Number(o.storeSettlement ?? (Number(o.customerFinalTotal ?? o.finalTotal ?? o.total) * 0.8)) || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-1">Payouts</h1>
      <p className="text-sm text-stone-500 mb-5">Store settlements after 20% MiSlice commission</p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending',     val: pending.length,    color: 'text-orange-400' },
          { label: 'Pending Net', val: money(pendingNet), color: 'text-white'      },
          { label: 'Paid',        val: paid.length,       color: 'text-green-400'  },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-4">
            <p className="text-[9px] text-stone-500 font-black uppercase mb-1">{k.label}</p>
            <p className={`text-xl font-black ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl divide-y divide-white/5 overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_100px_90px_80px] text-[9px] font-black uppercase tracking-widest text-stone-600 px-5 py-3 bg-black/40">
          <span>ID</span><span>Store</span><span className="text-center">Net Payout</span><span className="text-center">Status</span><span className="text-center">Action</span>
        </div>
        {pending.map((o: any) => {
          const net = Number(o.storeSettlement ?? (Number(o.customerFinalTotal ?? o.finalTotal ?? o.total) * 0.8)) || 0;
          return (
            <div key={o.id} className="grid grid-cols-[80px_1fr_100px_90px_80px] items-center px-5 py-3 hover:bg-white/3 transition-colors">
              <p className="text-xs font-black text-white">#{String(o.id).slice(-6).toUpperCase()}</p>
              <p className="text-sm text-stone-300 truncate">{stores.find((s: any) => s.id === o.storeId)?.store_name || o.storeId}</p>
              <p className="text-sm font-black text-green-400 text-center">{money(net)}</p>
              <p className="text-[9px] font-black text-orange-400 uppercase text-center">{o.payoutStatus || 'pending'}</p>
              <div className="text-center">
                <button onClick={() => markPayoutPaid(o.id)} className="text-[9px] font-black text-white bg-green-600/30 border border-green-500/30 hover:bg-green-600/50 px-2 py-1 rounded-lg transition-colors">Pay</button>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && <div className="px-5 py-8 text-center text-stone-500 text-sm">No pending payouts.</div>}
      </div>
    </div>
  );
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

const PLATFORM_COUPONS = [
  { code: 'MISLICE10',     discount: '10% off',   desc: 'Welcome discount for new users',          active: true  },
  { code: 'FREESHIP',      discount: 'Free del.', desc: 'No delivery fee on orders over $20',      active: true  },
  { code: 'MICHIGANPIZZA', discount: '$5 off',    desc: '$5 off any order over $25',               active: false },
  { code: 'LUNCH20',       discount: '20% off',   desc: '20% off weekday orders 11am–2pm',         active: true  },
];

function CouponsTab() {
  const [coupons, setCoupons] = useState(PLATFORM_COUPONS);
  const toggle = (code: string) => setCoupons(c => c.map(x => x.code === code ? { ...x, active: !x.active } : x));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-white">Platform Coupons</h1>
          <p className="text-sm text-stone-500">Global coupons that apply across all stores.</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-black bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2.5 rounded-xl">
          <Ticket className="w-4 h-4" /> New Coupon
        </button>
      </div>
      <div className="space-y-3">
        {coupons.map(c => (
          <div key={c.code} className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-black text-white font-mono tracking-wider">{c.code}</p>
                <span className="text-[9px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full">{c.discount}</span>
              </div>
              <p className="text-xs text-stone-500">{c.desc}</p>
            </div>
            <button onClick={() => toggle(c.code)}>
              {c.active ? <ToggleRight className="w-7 h-7 text-green-400" /> : <ToggleLeft className="w-7 h-7 text-stone-600" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
