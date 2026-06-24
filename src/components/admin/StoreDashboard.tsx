import React, { useState } from 'react';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Tag,
  Zap, DollarSign, Store as StoreIcon, ShieldCheck, Clock,
  CheckCircle2, ArrowRight, Receipt,
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { logAudit } from '../../utils/audit';

// Tabs
import { TabOverview }           from './tabs/TabOverview';
import { MenuPricesTab }         from './tabs/MenuPricesTab';
import { DealsManagerTab }       from './tabs/DealsManagerTab';
import { AIInsightsTab }         from './tabs/AIInsightsTab';
import { EarningsTab }           from './tabs/EarningsTab';
import { StoreProfileTab }       from './tabs/StoreProfileTab';
import { VerificationStatusTab } from './tabs/VerificationStatusTab';
import { ReceiptsTab }           from './tabs/ReceiptsTab';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'orders' | 'menu' | 'deals' | 'insights' | 'ai-setup'
         | 'earnings' | 'profile' | 'verification';

// ─── Nav configs ──────────────────────────────────────────────────────────────

const LIVE_NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Overview',      icon: LayoutDashboard },
  { id: 'orders',    label: 'Orders',         icon: ShoppingBag     },
  { id: 'menu',      label: 'Menu & Prices',  icon: UtensilsCrossed },
  { id: 'deals',     label: 'Deals',          icon: Tag             },
  { id: 'insights',  label: 'AI Insights',    icon: Zap             },
  { id: 'earnings',  label: 'Earnings',       icon: DollarSign      },
  { id: 'profile',   label: 'Store Profile',  icon: StoreIcon       },
];

const PENDING_NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',     label: 'Overview',           icon: LayoutDashboard },
  { id: 'menu',         label: 'Menu & Prices',       icon: UtensilsCrossed },
  { id: 'deals',        label: 'Deals',               icon: Tag             },
  { id: 'ai-setup',     label: 'AI Setup Assistant',  icon: Zap             },
  { id: 'profile',      label: 'Store Profile',       icon: StoreIcon       },
  { id: 'verification', label: 'Verification Status', icon: ShieldCheck     },
];

// ─── Status colors ────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  delivered:        'text-green-400',
  out_for_delivery: 'text-blue-400',
  preparing:        'text-yellow-400',
  confirmed:        'text-orange-400',
  placed:           'text-stone-400',
  pending:          'text-stone-400',
  cancelled:        'text-red-400',
};

// ─── Orders Panel ─────────────────────────────────────────────────────────────

function OrdersPanel({ orders, onUpdateStatus }: {
  orders: any[];
  onUpdateStatus: (id: string, old: string, next: string) => void;
}) {
  const [view, setView] = useState<'active' | 'past' | 'receipts'>('active');

  const active = orders.filter(o =>
    ['pending','placed','confirmed','preparing','ready_for_pickup','out_for_delivery'].includes(o.orderStatus)
  );
  const past = orders.filter(o => ['delivered','cancelled'].includes(o.orderStatus));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Orders</h2>
        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          {(['active','past','receipts'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-black rounded-lg capitalize transition-all ${view === v ? 'bg-red-600 text-white' : 'text-stone-500 hover:text-white'}`}>
              {v}
              {v === 'active' && active.length > 0 && (
                <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center bg-white/20 rounded-full text-[9px] font-black">{active.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {view === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { title: 'New Orders',  statuses: ['pending','placed','confirmed'],        color: 'text-blue-400',   border: 'border-blue-500/20',   bg: 'bg-blue-500/5'   },
            { title: 'In Progress', statuses: ['preparing'],                           color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5' },
            { title: 'Out / Ready', statuses: ['ready_for_pickup','out_for_delivery'], color: 'text-green-400',  border: 'border-green-500/20',  bg: 'bg-green-500/5'  },
          ].map(col => {
            const colOrders = orders.filter(o => col.statuses.includes(o.orderStatus));
            return (
              <div key={col.title} className={`border ${col.border} ${col.bg} rounded-2xl flex flex-col overflow-hidden`} style={{ minHeight: 300 }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <h3 className={`text-sm font-black ${col.color}`}>{col.title}</h3>
                  <span className="text-xs font-black text-stone-500">{colOrders.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {colOrders.map(o => (
                    <div key={o.id} className={`bg-white/5 border ${col.border} rounded-xl p-3`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-black text-white">#{(o.id||'').slice(-5).toUpperCase()}</span>
                        <span className="text-xs font-black text-green-400">${(o.customerFinalTotal||0).toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 space-y-0.5 mb-2">
                        {(o.items||[]).slice(0,3).map((it: any, i: number) => (
                          <div key={i}>{it.quantity||1}× {it.pizzaName||it.name}</div>
                        ))}
                        {(o.items||[]).length > 3 && <div className="text-stone-600">+{(o.items||[]).length-3} more</div>}
                      </div>
                      <p className="text-[9px] text-stone-600 mb-2">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                      </p>
                      <select value={o.orderStatus}
                        onChange={e => onUpdateStatus(o.id, o.orderStatus, e.target.value)}
                        className="w-full bg-black/60 border border-white/15 text-[10px] font-bold text-stone-300 rounded-lg p-1.5 focus:outline-none focus:border-red-500">
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready_for_pickup">Ready for Pickup</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  ))}
                  {colOrders.length === 0 && (
                    <p className="text-[11px] text-stone-700 text-center mt-8">No orders here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'past' && (
        <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_100px_90px] text-[9px] font-black uppercase tracking-widest text-stone-600 px-5 py-3 border-b border-white/8">
            <span>Order</span><span className="text-center">Items</span><span className="text-center">Total</span><span className="text-center">Status</span>
          </div>
          <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
            {past.length === 0 ? (
              <p className="text-sm text-stone-600 text-center py-10">No past orders yet.</p>
            ) : past.map(o => (
              <div key={o.id} className="grid grid-cols-[1fr_80px_100px_90px] items-center px-5 py-3 hover:bg-white/3 transition-colors">
                <div>
                  <p className="text-xs font-black text-white">#{(o.id||'').slice(-6).toUpperCase()}</p>
                  <p className="text-[9px] text-stone-600">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-xs font-bold text-stone-400 text-center">{(o.items||[]).length}</p>
                <p className="text-sm font-black text-white text-center">${(o.customerFinalTotal||0).toFixed(2)}</p>
                <p className={`text-[9px] font-black uppercase text-center ${STATUS_COLOR[o.orderStatus]||'text-stone-500'}`}>
                  {(o.orderStatus||'').replace(/_/g,' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'receipts' && <ReceiptsTab orders={orders} />}
    </div>
  );
}

// ─── Pending Overview ─────────────────────────────────────────────────────────

function PendingOverview({ storeData, onNavigate }: { storeData: any; onNavigate: (tab: Tab) => void }) {
  const steps: { label: string; done: boolean; tab: Tab }[] = [
    { label: 'Account Created',          done: true,                         tab: 'profile' },
    { label: 'Restaurant Information',   done: !!storeData?.store_name,      tab: 'profile' },
    { label: 'Menu Uploaded',            done: !!storeData?.menu_uploaded,   tab: 'menu'    },
    { label: 'Contract Signed',          done: !!storeData?.contract_signed, tab: 'verification' },
    { label: 'Bank Account Connected',   done: !!storeData?.bank_connected,  tab: 'profile' },
  ];
  const done  = steps.filter(s => s.done).length;
  const pct   = Math.round((done / steps.length) * 100);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white">Setup Checklist</h2>
        <p className="text-xs text-stone-500 mt-0.5">Complete your store setup while your application is reviewed</p>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <div className="flex justify-between mb-2">
          <p className="text-xs font-black text-white">Setup Progress</p>
          <p className="text-xs font-black text-red-400">{pct}%</p>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-5">
          <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-3">
          {steps.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${s.done ? 'bg-green-500/20 border-green-500' : 'border-white/20'}`}>
                {s.done && <CheckCircle2 className="w-3 h-3 text-green-400" />}
              </div>
              <p className={`text-sm font-bold flex-1 ${s.done ? 'text-white' : 'text-stone-500'}`}>{s.label}</p>
              {!s.done && (
                <button onClick={() => onNavigate(s.tab)} className="text-[10px] font-black text-red-400 hover:text-red-300 flex items-center gap-1">
                  Complete <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: '🍕', label: 'Upload Menu',     tab: 'menu'         as Tab, desc: 'Add items & prices' },
          { emoji: '🏷️', label: 'Create Deals',    tab: 'deals'        as Tab, desc: 'Set up promotions'  },
          { emoji: '🏪', label: 'Store Profile',   tab: 'profile'      as Tab, desc: 'Logo, hours & more' },
          { emoji: '📋', label: 'Check Status',    tab: 'verification' as Tab, desc: 'Review progress'    },
        ].map(q => (
          <button key={q.label} onClick={() => onNavigate(q.tab)}
            className="bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/20 rounded-2xl p-4 text-left transition-all group">
            <span className="text-2xl mb-2 block">{q.emoji}</span>
            <p className="text-sm font-black text-white group-hover:text-red-300 transition-colors">{q.label}</p>
            <p className="text-[10px] text-stone-500 mt-0.5">{q.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function StoreDashboard({ storeData, deals, orders }: { storeData: any; deals: any[]; orders: any[] }) {
  const status: string = storeData?.status || 'pending';
  const isLive = status === 'approved' || status === 'active';

  const [tab, setTab] = useState<Tab>('overview');

  const liveCount = orders.filter(o =>
    ['pending','placed','confirmed','preparing'].includes(o.orderStatus)
  ).length;

  const handleUpdateOrderStatus = async (orderId: string, oldStatus: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { orderStatus: newStatus });
      await logAudit('ORDER_STATUS_UPDATED','orders',oldStatus,newStatus,
        auth.currentUser?.uid||'store',
        storeData?.store_name||auth.currentUser?.email||'Store Owner','storeOwner');
    } catch { /* offline */ }
  };

  const NAV = isLive ? LIVE_NAV : PENDING_NAV;

  return (
    <div className="max-w-7xl mx-auto w-full pt-6 pb-20">

      {/* Verification banner */}
      {!isLive && (
        <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl px-5 py-4 flex items-center gap-4 mb-6">
          <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">Your restaurant is currently under review</p>
            <p className="text-xs text-stone-400 mt-0.5">
              You can continue setting up your store. The restaurant is not visible to customers yet. Estimated approval: 24–48 hours.
            </p>
          </div>
          <button onClick={() => setTab('verification')}
            className="shrink-0 text-xs font-black text-yellow-400 hover:text-white flex items-center gap-1 transition-colors">
            View Status <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex gap-6">

        {/* ── Sidebar (desktop) ── */}
        <div className="w-52 flex-shrink-0 hidden md:flex flex-col gap-3">
          {/* Store identity card */}
          <div className="bg-black/60 border border-white/10 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center border border-red-500/30 shrink-0">
                <StoreIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">{storeData?.email || storeData?.store_name || 'My Store'}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-600">Store Dashboard</p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="bg-black/40 border border-white/10 rounded-2xl p-2 space-y-0.5">
            {NAV.map(n => {
              const Icon = n.icon;
              const badge = n.id === 'orders' && liveCount > 0 ? liveCount : 0;
              return (
                <button key={n.id} onClick={() => setTab(n.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    tab === n.id ? 'bg-red-600 text-white' : 'text-stone-400 hover:bg-white/6 hover:text-white'
                  }`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left text-[13px]">{n.label}</span>
                  {badge > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Live/pending status */}
          <div className={`border rounded-xl px-4 py-2.5 flex items-center gap-2 ${
            isLive ? 'bg-green-500/10 border-green-500/25' : 'bg-yellow-500/10 border-yellow-500/25'
          }`}>
            <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${isLive ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <p className={`text-xs font-black ${isLive ? 'text-green-400' : 'text-yellow-400'}`}>
              {isLive ? 'Accepting Orders' : 'Under Review'}
            </p>
          </div>
        </div>

        {/* ── Mobile scrolling nav ── */}
        <div className="md:hidden w-full absolute left-0 px-4">
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
            {NAV.map(n => {
              const Icon = n.icon;
              return (
                <button key={n.id} onClick={() => setTab(n.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                    tab === n.id ? 'bg-red-600 text-white' : 'bg-white/5 border border-white/10 text-stone-400'
                  }`}>
                  <Icon className="w-3.5 h-3.5" /> {n.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">
          {/* Pending-only tabs */}
          {!isLive && tab === 'overview'     && <PendingOverview storeData={storeData} onNavigate={setTab} />}
          {!isLive && tab === 'ai-setup'     && <AIInsightsTab orders={[]} storeData={storeData} isPending />}
          {!isLive && tab === 'verification' && <VerificationStatusTab storeData={storeData} />}

          {/* Shared tabs */}
          {tab === 'menu'    && <MenuPricesTab storeData={storeData} />}
          {tab === 'deals'   && <DealsManagerTab storeData={storeData} initialDeals={deals} />}
          {tab === 'profile' && <StoreProfileTab storeData={storeData} />}

          {/* Live-only tabs */}
          {isLive && tab === 'overview'  && <TabOverview storeData={storeData} orders={orders} onNavigate={setTab as any} />}
          {isLive && tab === 'orders'    && <OrdersPanel orders={orders} onUpdateStatus={handleUpdateOrderStatus} />}
          {isLive && tab === 'insights'  && <AIInsightsTab orders={orders} storeData={storeData} />}
          {isLive && tab === 'earnings'  && <EarningsTab orders={orders} storeData={storeData} />}
        </div>
      </div>
    </div>
  );
}
