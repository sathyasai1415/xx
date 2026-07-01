import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Tag,
  Zap, DollarSign, Store as StoreIcon, ShieldCheck, Clock,
  CheckCircle2, ArrowRight, BarChart2, MessageSquare,
  Megaphone, Calendar, Timer, Users, FileText, Globe,
  Search, RefreshCw, Truck, ChevronDown, X, Filter,
  TrendingUp, AlertCircle,
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { logAudit } from '../../utils/audit';

import { TabOverview }           from './tabs/TabOverview';
import { MenuPricesTab }         from './tabs/MenuPricesTab';
import { DealsManagerTab }       from './tabs/DealsManagerTab';
import { AIInsightsTab }         from './tabs/AIInsightsTab';
import { EarningsTab }           from './tabs/EarningsTab';
import { StoreProfileTab }       from './tabs/StoreProfileTab';
import { VerificationStatusTab } from './tabs/VerificationStatusTab';
import { ReceiptsTab }           from './tabs/ReceiptsTab';
import { AnalyticsTab }          from './tabs/AnalyticsTab';
import { FeedbackTab }           from './tabs/FeedbackTab';
import { HolidayHoursTab }       from './tabs/HolidayHoursTab';
import { PrepTimesTab }          from './tabs/PrepTimesTab';
import { MarketingTab }          from './tabs/MarketingTab';
import { UsersTab }              from './tabs/UsersTab';
import { ReportsTab }            from './tabs/ReportsTab';
import { OnlineOrderingTab }     from './tabs/OnlineOrderingTab';

type Tab =
  | 'overview' | 'orders' | 'menu' | 'deals' | 'insights' | 'ai-setup'
  | 'earnings' | 'profile' | 'verification' | 'analytics' | 'feedback'
  | 'holiday-hours' | 'prep-times' | 'marketing' | 'users' | 'reports'
  | 'online-ordering';

interface NavItem { id: Tab; label: string; icon: React.ElementType }

const LIVE_NAV: NavItem[] = [
  { id: 'overview',        label: 'Home',             icon: LayoutDashboard },
  { id: 'analytics',       label: 'Insights',         icon: BarChart2       },
  { id: 'reports',         label: 'Reports',          icon: FileText        },
  { id: 'orders',          label: 'Orders',           icon: ShoppingBag     },
  { id: 'menu',            label: 'Menu & Prices',    icon: UtensilsCrossed },
  { id: 'deals',           label: 'Deals',            icon: Tag             },
  { id: 'marketing',       label: 'Marketing',        icon: Megaphone       },
  { id: 'feedback',        label: 'Ratings & Reviews',icon: MessageSquare   },
  { id: 'insights',        label: 'AI Insights',      icon: Zap             },
  { id: 'earnings',        label: 'Financials',       icon: DollarSign      },
  { id: 'online-ordering', label: 'Online Ordering',  icon: Globe           },
  { id: 'holiday-hours',   label: 'Store Hours',      icon: Calendar        },
  { id: 'prep-times',      label: 'Prep Times',       icon: Timer           },
  { id: 'users',           label: 'Team',             icon: Users           },
  { id: 'profile',         label: 'Store Profile',    icon: StoreIcon       },
];

const PENDING_NAV: NavItem[] = [
  { id: 'overview',     label: 'Home',               icon: LayoutDashboard },
  { id: 'menu',         label: 'Menu & Prices',      icon: UtensilsCrossed },
  { id: 'deals',        label: 'Deals',              icon: Tag             },
  { id: 'ai-setup',     label: 'AI Setup',           icon: Zap             },
  { id: 'profile',      label: 'Store Profile',      icon: StoreIcon       },
  { id: 'verification', label: 'Verification Status',icon: ShieldCheck     },
];

type OrderStatus = 'delivered' | 'picked_up' | 'cancelled' | 'abandoned' | 'returned' | 'preparing' | 'out_for_delivery' | 'placed' | 'pending' | 'confirmed' | 'ready_for_pickup';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  delivered:        { label: 'Delivered',     color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30'  },
  picked_up:        { label: 'Picked Up',     color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30'  },
  out_for_delivery: { label: 'On the Way',    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30'    },
  preparing:        { label: 'Preparing',     color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30'},
  confirmed:        { label: 'Confirmed',     color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30'},
  ready_for_pickup: { label: 'Ready',         color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/30'   },
  placed:           { label: 'Placed',        color: 'text-stone-300',  bg: 'bg-white/5 border-white/15'           },
  pending:          { label: 'Pending',       color: 'text-stone-300',  bg: 'bg-white/5 border-white/15'           },
  cancelled:        { label: 'Cancelled',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30'      },
  abandoned:        { label: 'Abandoned',     color: 'text-red-300',    bg: 'bg-red-500/8 border-red-400/20'       },
  returned:         { label: 'Returned',      color: 'text-orange-300', bg: 'bg-orange-500/8 border-orange-400/20' },
};

function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, color: 'text-stone-400', bg: 'bg-white/5 border-white/10' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border ${m.bg} ${m.color}`}>
      {m.label}
    </span>
  );
}

const ACTIVE_STATUSES = new Set(['pending','placed','confirmed','preparing','ready_for_pickup','out_for_delivery']);
const HISTORY_STATUSES = new Set(['delivered','picked_up','cancelled','abandoned','returned']);
const ALL_FILTER_STATUSES = ['delivered','picked_up','cancelled','abandoned','returned'] as const;

function OrdersPanel({ orders, onUpdateStatus }: {
  orders: any[];
  onUpdateStatus: (id: string, old: string, next: string) => void;
}) {
  const [subTab, setSubTab] = useState<'active' | 'scheduled' | 'history'>('active');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [channelFilter, setChannelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refresh = () => setLastUpdated(new Date());

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.has(o.orderStatus));
  const historyOrders = orders.filter(o => HISTORY_STATUSES.has(o.orderStatus));

  const filtered = useMemo(() => {
    let list = subTab === 'active' ? activeOrders : subTab === 'history' ? historyOrders : [];
    if (statusFilter.size > 0) list = list.filter(o => statusFilter.has(o.orderStatus));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.id || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.storeName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [subTab, orders, statusFilter, search]);

  const secAgo = Math.round((Date.now() - lastUpdated.getTime()) / 1000);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Orders</h2>
          <p className="text-xs text-stone-500 mt-0.5">Track all your orders from every channel in real-time.</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all shadow-[0_4px_12px_rgba(220,38,38,0.35)]"
        >
          <Truck className="w-3.5 h-3.5" />
          Request a Delivery
        </button>
      </div>

      {/* ── Promo banner ── */}
      <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3">
        <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Boost afternoon sales by up to 33% with a Happy Hour discount</p>
          <p className="text-xs text-stone-400 mt-0.5">Offer a discount 2–5pm and get featured in a special collection on the MiSlice homepage.</p>
        </div>
        <button className="shrink-0 text-xs font-black text-amber-400 hover:text-white border border-amber-500/40 hover:border-amber-400 px-3 py-1.5 rounded-lg transition-all">
          Get Started
        </button>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="flex items-center justify-between border-b border-white/10 pb-0">
        <div className="flex gap-0">
          {([
            { id: 'active'    as const, label: 'Active',    count: activeOrders.length    },
            { id: 'scheduled' as const, label: 'Scheduled', count: 0                      },
            { id: 'history'   as const, label: 'History',   count: historyOrders.length   },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => { setSubTab(t.id); setStatusFilter(new Set()); setSearch(''); }}
              className={`relative px-4 py-3 text-sm font-bold transition-all ${
                subTab === t.id
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-stone-500 hover:text-stone-300 border-b-2 border-transparent'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-2 text-[10px] font-black bg-white/10 text-stone-400 px-1.5 py-0.5 rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-stone-600 pb-1">
          <RefreshCw className="w-3 h-3" />
          Last updated {secAgo}s ago
          <button onClick={refresh} className="ml-1 text-red-400 hover:text-red-300 transition-colors font-bold">Refresh</button>
        </div>
      </div>

      {/* ── Filters row ── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Channel */}
        <div className="relative">
          <select
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
            className="appearance-none bg-white/6 border border-white/12 text-stone-300 text-xs font-bold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="mislice">MiSlice</option>
            <option value="doordash">DoorDash</option>
            <option value="ubereats">Uber Eats</option>
            <option value="grubhub">GrubHub</option>
          </select>
          <ChevronDown className="w-3 h-3 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status filter */}
        {subTab === 'history' && (
          <div className="relative">
            <button
              onClick={() => setShowStatusDrop(d => !d)}
              className={`flex items-center gap-2 bg-white/6 border text-xs font-bold rounded-xl px-3 py-2 transition-all ${
                statusFilter.size > 0 ? 'border-red-500/60 text-red-300' : 'border-white/12 text-stone-300 hover:border-white/25'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Status {statusFilter.size > 0 && `(${statusFilter.size})`}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showStatusDrop && (
              <div className="absolute top-full mt-1 left-0 z-50 bg-[#1a1625] border border-white/15 rounded-2xl p-3 shadow-2xl w-44 space-y-1">
                {ALL_FILTER_STATUSES.map(s => {
                  const checked = statusFilter.has(s);
                  const m = STATUS_META[s];
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        const next = new Set(statusFilter);
                        checked ? next.delete(s) : next.add(s);
                        setStatusFilter(next);
                      }}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked ? 'bg-red-600 border-red-600' : 'border-white/25'
                      }`}>
                        {checked && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={`text-xs font-bold ${m?.color || 'text-stone-300'}`}>{m?.label || s}</span>
                    </button>
                  );
                })}
                {statusFilter.size > 0 && (
                  <button
                    onClick={() => setStatusFilter(new Set())}
                    className="w-full mt-2 pt-2 border-t border-white/8 text-[10px] font-black text-red-400 hover:text-red-300 text-center transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowStatusDrop(false)}
                  className="w-full flex justify-center mt-1"
                >
                  <span className="text-[10px] font-black text-stone-500 hover:text-white transition-colors">Apply ✓</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/6 border border-white/12 rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-xs focus-within:border-red-500/50 transition-colors">
          <Search className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders…"
            className="bg-transparent text-xs text-white placeholder-stone-600 outline-none flex-1"
          />
          {search && (
            <button onClick={() => setSearch('')}><X className="w-3 h-3 text-stone-500 hover:text-white" /></button>
          )}
        </div>
      </div>

      {/* ── Active orders — 3-column Kanban ── */}
      {subTab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { title: 'New Orders',  statuses: ['pending','placed','confirmed'],        accent: 'text-blue-400',   border: 'border-blue-500/20',   bg: 'bg-blue-500/5'   },
            { title: 'Preparing',   statuses: ['preparing'],                           accent: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5' },
            { title: 'Out / Ready', statuses: ['ready_for_pickup','out_for_delivery'], accent: 'text-green-400',  border: 'border-green-500/20',  bg: 'bg-green-500/5'  },
          ].map(col => {
            const colOrders = orders.filter(o => col.statuses.includes(o.orderStatus));
            return (
              <div key={col.title} className={`border ${col.border} ${col.bg} rounded-2xl flex flex-col`} style={{ minHeight: 280 }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <h3 className={`text-sm font-black ${col.accent}`}>{col.title}</h3>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${col.bg} ${col.accent} border ${col.border}`}>{colOrders.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {colOrders.map(o => (
                    <div key={o.id} className={`bg-black/30 border ${col.border} rounded-xl p-3`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-black text-white">#{(o.id||'').slice(-6).toUpperCase()}</span>
                          <p className="text-[9px] text-stone-600 mt-0.5">
                            {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className="text-sm font-black text-green-400">${(o.customerFinalTotal||0).toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 space-y-0.5 mb-2.5">
                        {(o.items||[]).slice(0,3).map((it: any, i: number) => (
                          <div key={i}>{it.quantity||1}× {it.pizzaName||it.name}</div>
                        ))}
                        {(o.items||[]).length > 3 && <div className="text-stone-600">+{(o.items||[]).length-3} more</div>}
                      </div>
                      {o.customerName && (
                        <p className="text-[9px] text-stone-500 mb-2">👤 {o.customerName}</p>
                      )}
                      <select
                        value={o.orderStatus}
                        onChange={e => onUpdateStatus(o.id, o.orderStatus, e.target.value)}
                        className="w-full bg-black/50 border border-white/15 text-[10px] font-bold text-stone-300 rounded-lg p-1.5 focus:outline-none focus:border-red-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready_for_pickup">Ready for Pickup</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  ))}
                  {colOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-white/4 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-stone-700" />
                      </div>
                      <p className="text-[11px] text-stone-700 text-center">No orders here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Scheduled (placeholder) ── */}
      {subTab === 'scheduled' && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
          <Calendar className="w-10 h-10 mx-auto text-stone-700 mb-3" />
          <p className="text-sm font-bold text-stone-500">No scheduled orders</p>
          <p className="text-xs text-stone-700 mt-1">Scheduled orders will appear here</p>
        </div>
      )}

      {/* ── History — table ── */}
      {subTab === 'history' && (
        <div className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1.2fr_120px_90px_120px_110px_100px_90px] text-[9px] font-black uppercase tracking-widest text-stone-600 px-5 py-3 border-b border-white/8 bg-white/2">
            <span>Order ID</span>
            <span>Status</span>
            <span>Time</span>
            <span>Customer</span>
            <span>Dasher / Method</span>
            <span>Channel</span>
            <span className="text-right">Subtotal</span>
          </div>
          <div className="divide-y divide-white/5 max-h-[520px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-14 gap-3">
                <AlertCircle className="w-8 h-8 text-stone-700" />
                <p className="text-sm text-stone-600">No orders match your filters</p>
                <button
                  onClick={() => { setStatusFilter(new Set()); setSearch(''); }}
                  className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : filtered.map(o => (
              <div key={o.id} className="grid grid-cols-[1.2fr_120px_90px_120px_110px_100px_90px] items-center px-5 py-3 hover:bg-white/3 transition-colors">
                <div>
                  <p className="text-xs font-black text-white">#{(o.id||'').slice(-8).toUpperCase()}</p>
                  <p className="text-[9px] text-stone-600">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div><StatusPill status={o.orderStatus} /></div>
                <p className="text-[10px] text-stone-400">
                  {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-stone-300 truncate">{o.customerName || '—'}</p>
                <p className="text-[10px] text-stone-500">{o.deliveryType === 'pickup' ? 'Self Pickup' : 'Delivery Driver'}</p>
                <p className="text-[10px] text-stone-500 capitalize">{o.channel || 'MiSlice'}</p>
                <p className="text-sm font-black text-white text-right">${(o.customerFinalTotal||0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PendingOverview({ storeData, onNavigate }: { storeData: any; onNavigate: (tab: Tab) => void }) {
  const steps: { label: string; done: boolean; tab: Tab }[] = [
    { label: 'Account Created',          done: true,                         tab: 'profile'      },
    { label: 'Restaurant Information',   done: !!storeData?.store_name,      tab: 'profile'      },
    { label: 'Menu Uploaded',            done: !!storeData?.menu_uploaded,   tab: 'menu'         },
    { label: 'Contract Signed',          done: !!storeData?.contract_signed, tab: 'verification' },
    { label: 'Bank Account Connected',   done: !!storeData?.bank_connected,  tab: 'profile'      },
  ];
  const done = steps.filter(s => s.done).length;
  const pct  = Math.round((done / steps.length) * 100);

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
                <button onClick={() => onNavigate(s.tab)} className="text-[10px] font-black text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                  Complete <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: '🍕', label: 'Upload Menu',   tab: 'menu'         as Tab, desc: 'Add items & prices' },
          { emoji: '🏷️', label: 'Create Deals',  tab: 'deals'        as Tab, desc: 'Set up promotions'  },
          { emoji: '🏪', label: 'Store Profile', tab: 'profile'      as Tab, desc: 'Logo, hours & more' },
          { emoji: '📋', label: 'Check Status',  tab: 'verification' as Tab, desc: 'Review progress'    },
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

      <div className="flex gap-0">

        {/* ── Sidebar ── */}
        <div className="w-56 flex-shrink-0 hidden md:flex flex-col border-r border-white/8 pr-4 mr-6 min-h-[calc(100vh-160px)]">

          {/* Store identity */}
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className="w-9 h-9 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center border border-red-500/25 shrink-0">
              <StoreIcon className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">{storeData?.store_name || 'My Store'}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-600">Merchant</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto max-h-[calc(100vh-260px)]">
            {NAV.map(n => {
              const Icon = n.icon;
              const badge = n.id === 'orders' && liveCount > 0 ? liveCount : 0;
              const active = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    active
                      ? 'bg-red-600 text-white shadow-[0_2px_12px_rgba(220,38,38,0.3)]'
                      : 'text-stone-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
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

          {/* Status chip */}
          <div className={`mt-4 border rounded-xl px-3 py-2.5 flex items-center gap-2 ${
            isLive ? 'bg-green-500/8 border-green-500/20' : 'bg-yellow-500/8 border-yellow-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${isLive ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <p className={`text-xs font-black ${isLive ? 'text-green-400' : 'text-yellow-400'}`}>
              {isLive ? 'Accepting Orders' : 'Under Review'}
            </p>
          </div>
        </div>

        {/* ── Mobile horizontal nav ── */}
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
          {/* Pending-only */}
          {!isLive && tab === 'overview'     && <PendingOverview storeData={storeData} onNavigate={setTab} />}
          {!isLive && tab === 'ai-setup'     && <AIInsightsTab orders={[]} storeData={storeData} isPending />}
          {!isLive && tab === 'verification' && <VerificationStatusTab storeData={storeData} />}

          {/* Shared */}
          {tab === 'menu'            && <MenuPricesTab storeData={storeData} />}
          {tab === 'deals'           && <DealsManagerTab storeData={storeData} initialDeals={deals} />}
          {tab === 'profile'         && <StoreProfileTab storeData={storeData} />}
          {tab === 'holiday-hours'   && <HolidayHoursTab />}
          {tab === 'prep-times'      && <PrepTimesTab />}
          {tab === 'users'           && <UsersTab />}
          {tab === 'online-ordering' && <OnlineOrderingTab />}
          {tab === 'marketing'       && <MarketingTab />}

          {/* Live-only */}
          {isLive && tab === 'overview'  && <TabOverview storeData={storeData} orders={orders} onNavigate={setTab as any} />}
          {isLive && tab === 'analytics' && <AnalyticsTab orders={orders} storeData={storeData} />}
          {isLive && tab === 'orders'    && <OrdersPanel orders={orders} onUpdateStatus={handleUpdateOrderStatus} />}
          {isLive && tab === 'insights'  && <AIInsightsTab orders={orders} storeData={storeData} />}
          {isLive && tab === 'earnings'  && <EarningsTab orders={orders} storeData={storeData} />}
          {isLive && tab === 'feedback'  && <FeedbackTab orders={orders} storeData={storeData} />}
          {isLive && tab === 'reports'   && <ReportsTab orders={orders} storeData={storeData} />}
        </div>
      </div>
    </div>
  );
}
