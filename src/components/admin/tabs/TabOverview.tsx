import React from 'react';
import {
  DollarSign, TrendingUp, ShoppingBag, Star,
  AlertTriangle, ArrowRight, CheckCircle2, Clock,
} from 'lucide-react';

interface Props { storeData: any; orders: any[]; onNavigate?: (tab: any) => void; }

export function TabOverview({ storeData, orders, onNavigate }: Props) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.customerFinalTotal || 0), 0);
  const totalRevenue = orders.reduce((s, o) => s + (o.customerFinalTotal || 0), 0);
  const miSliceFees  = totalRevenue * 0.20;
  const netPayout    = totalRevenue - miSliceFees;
  const pendingCount = orders.filter(o => ['pending','placed','confirmed','preparing'].includes(o.orderStatus)).length;
  const delivered    = orders.filter(o => o.orderStatus === 'delivered');
  const avgOrderVal  = delivered.length ? (delivered.reduce((s,o) => s+(o.customerFinalTotal||0),0) / delivered.length) : 0;

  // 7-day revenue
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const rev = orders
      .filter(o => new Date(o.createdAt).toDateString() === d.toDateString())
      .reduce((s, o) => s + (o.customerFinalTotal || 0), 0);
    return { label, rev };
  });
  const maxRev = Math.max(...days.map(d => d.rev), 1);

  const latestOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const STATUS_COLOR: Record<string, string> = {
    delivered:        'text-green-400',
    out_for_delivery: 'text-blue-400',
    preparing:        'text-yellow-400',
    confirmed:        'text-orange-400',
    placed:           'text-stone-400',
    pending:          'text-stone-400',
    cancelled:        'text-red-400',
  };

  return (
    <div className="space-y-6">

      {/* Alert banner */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-black text-white">{pendingCount} order{pendingCount > 1 ? 's' : ''} need your attention</p>
              <p className="text-xs text-yellow-300/70">New or in-progress orders waiting for action</p>
            </div>
          </div>
          <button onClick={() => onNavigate?.('orders')} className="flex items-center gap-1 text-xs font-bold text-yellow-300 hover:text-white transition-colors shrink-0">
            View Orders <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue",  value: `$${todayRevenue.toFixed(2)}`,    sub: `${todayOrders.length} orders today`,  icon: DollarSign,  color: 'text-green-400',  bg: 'bg-green-500/8',   border: 'border-green-500/20' },
          { label: 'Net Earnings',      value: `$${netPayout.toFixed(2)}`,       sub: 'After 20% MiSlice fee',               icon: TrendingUp,  color: 'text-blue-400',   bg: 'bg-blue-500/8',    border: 'border-blue-500/20'  },
          { label: 'Total Orders',      value: orders.length.toString(),          sub: `${delivered.length} delivered`,       icon: ShoppingBag, color: 'text-violet-400', bg: 'bg-violet-500/8',  border: 'border-violet-500/20'},
          { label: 'Avg Order Value',   value: `$${avgOrderVal.toFixed(2)}`,     sub: 'Per delivered order',                 icon: Star,        color: 'text-red-400',    bg: 'bg-red-500/8',     border: 'border-red-500/20'   },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl p-4 relative overflow-hidden`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">{k.label}</p>
                <Icon className={`w-4 h-4 ${k.color} shrink-0`} />
              </div>
              <p className={`text-2xl font-black ${k.color} mb-1`}>{k.value}</p>
              <p className="text-[10px] text-stone-500">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart + MiSlice margin */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* 7-day bar chart */}
        <div className="lg:col-span-3 bg-black/40 border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">7-Day Revenue</p>
          <div className="flex items-end gap-2 h-28">
            {days.map(d => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[8px] font-bold text-stone-500">{d.rev > 0 ? `$${d.rev.toFixed(0)}` : ''}</p>
                <div className="w-full rounded-t-lg bg-red-500/20 relative overflow-hidden" style={{ height: `${Math.max((d.rev / maxRev) * 80, 4)}px` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-red-600 to-red-400 opacity-80" />
                </div>
                <p className="text-[9px] font-bold text-stone-500">{d.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MiSlice margin breakdown */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">MiSlice Margin</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-400">Gross Sales</span>
                <span className="font-black text-white">${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-white/30 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-400">MiSlice Fee (20%)</span>
                <span className="font-black text-red-400">−${miSliceFees.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-red-500/60 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-400">Your Payout (80%)</span>
                <span className="font-black text-green-400">${netPayout.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-green-500/60 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
          <button onClick={() => onNavigate?.('payouts')} className="mt-4 w-full text-xs font-bold text-stone-400 hover:text-white flex items-center justify-center gap-1 transition-colors">
            View full payout breakdown <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Update Prices', icon: '🔄', tab: 'price',    desc: 'Scan & sync menu prices' },
          { label: 'Create Deal',   icon: '🏷️', tab: 'deals',    desc: 'Launch a promotion'      },
          { label: 'View Receipts', icon: '🧾', tab: 'receipts', desc: 'All order details'        },
          { label: 'Insights',      icon: '📊', tab: 'insights', desc: 'Growth & analytics'       },
        ].map(q => (
          <button
            key={q.label}
            onClick={() => onNavigate?.(q.tab as any)}
            className="bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/20 rounded-2xl p-4 text-left transition-all group"
          >
            <span className="text-2xl mb-2 block">{q.icon}</span>
            <p className="text-sm font-black text-white group-hover:text-red-300 transition-colors">{q.label}</p>
            <p className="text-[10px] text-stone-500 mt-0.5">{q.desc}</p>
          </button>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black uppercase tracking-widest text-stone-500">Recent Orders</p>
          <button onClick={() => onNavigate?.('orders')} className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {latestOrders.map(order => (
            <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">#{order.id?.slice(-6).toUpperCase()}</p>
                  <p className="text-[9px] text-stone-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">${(order.customerFinalTotal || 0).toFixed(2)}</p>
                <p className={`text-[9px] font-bold uppercase ${STATUS_COLOR[order.orderStatus] || 'text-stone-500'}`}>
                  {order.orderStatus?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          ))}
          {latestOrders.length === 0 && (
            <p className="text-sm text-stone-600 text-center py-4">No orders yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}
