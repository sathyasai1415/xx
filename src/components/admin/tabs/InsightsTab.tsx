import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Clock, Users, Star, Zap } from 'lucide-react';

interface Props { orders: any[]; storeData: any; }

type Period = '7d' | '30d' | 'all';

export function InsightsTab({ orders, storeData }: Props) {
  const [period, setPeriod] = useState<Period>('30d');

  const now = Date.now();
  const MS = { '7d': 7 * 86400000, '30d': 30 * 86400000, all: Infinity };

  const filtered = orders.filter(o => {
    const age = now - new Date(o.createdAt).getTime();
    return age <= MS[period];
  });

  const delivered = filtered.filter(o => o.orderStatus === 'delivered');
  const totalRevenue  = delivered.reduce((s, o) => s + (o.customerFinalTotal || 0), 0);
  const miSliceFee    = totalRevenue * 0.20;
  const netPayout     = totalRevenue - miSliceFee;
  const avgOrder      = delivered.length ? totalRevenue / delivered.length : 0;
  const cancelledCount = filtered.filter(o => o.orderStatus === 'cancelled').length;
  const cancelRate    = filtered.length ? (cancelledCount / filtered.length) * 100 : 0;

  // Build daily buckets for chart
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 60;
  const buckets = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (Math.min(days, 30) - 1 - i));
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString() && o.orderStatus === 'delivered');
    return { label, rev: dayOrders.reduce((s, o) => s + (o.customerFinalTotal || 0), 0), count: dayOrders.length };
  });
  const maxRev = Math.max(...buckets.map(b => b.rev), 1);

  // Peak hours
  const hourBuckets = Array.from({ length: 24 }, (_, h) => ({
    h,
    count: filtered.filter(o => new Date(o.createdAt).getHours() === h).length,
  }));
  const maxHour = Math.max(...hourBuckets.map(b => b.count), 1);
  const peakHour = hourBuckets.reduce((best, b) => b.count > best.count ? b : best, hourBuckets[0]);

  // Top items
  const itemCounts: Record<string, { count: number; rev: number }> = {};
  filtered.forEach(o => {
    (o.items || []).forEach((item: any) => {
      const n = item.pizzaName || 'Unknown';
      if (!itemCounts[n]) itemCounts[n] = { count: 0, rev: 0 };
      itemCounts[n].count += item.quantity || 1;
      itemCounts[n].rev   += item.itemTotal || 0;
    });
  });
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  const maxItemCount = Math.max(...topItems.map(([, v]) => v.count), 1);

  // Delivery vs pickup
  const deliveryCount = filtered.filter(o => o.deliveryType === 'store-delivery' || o.deliveryType === 'third-party').length;
  const pickupCount   = filtered.filter(o => o.deliveryType === 'pickup').length;
  const totalFulfill  = deliveryCount + pickupCount || 1;

  const fmt12 = (h: number) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Insights & Growth</h2>
          <p className="text-xs text-stone-500 mt-0.5">Business performance and MiSlice margin breakdown</p>
        </div>
        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          {(['7d','30d','all'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${period === p ? 'bg-red-600 text-white' : 'text-stone-500 hover:text-white'}`}>
              {p === 'all' ? 'All Time' : p === '7d' ? 'Last 7d' : 'Last 30d'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Revenue',   value: `$${totalRevenue.toFixed(2)}`, sub: `${delivered.length} completed orders`,  icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/8', border: 'border-green-500/20' },
          { label: 'Net Payout',       value: `$${netPayout.toFixed(2)}`,   sub: 'After 20% MiSlice fee',               icon: TrendingUp, color: 'text-blue-400',  bg: 'bg-blue-500/8',  border: 'border-blue-500/20' },
          { label: 'Avg Order Value',  value: `$${avgOrder.toFixed(2)}`,    sub: 'Per completed order',                 icon: Star,       color: 'text-yellow-400',bg: 'bg-yellow-500/8',border: 'border-yellow-500/20' },
          { label: 'Cancel Rate',      value: `${cancelRate.toFixed(1)}%`,  sub: `${cancelledCount} cancelled`,          icon: ShoppingBag,color: cancelRate > 10 ? 'text-red-400' : 'text-stone-400', bg: 'bg-white/4', border: 'border-white/10' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl p-4`}>
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

      {/* MiSlice margin visual */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">MiSlice Fee Breakdown</p>
        <div className="flex items-center gap-0 h-10 rounded-xl overflow-hidden mb-3">
          <div className="flex items-center justify-center h-full bg-green-600/80 text-[10px] font-black text-white transition-all" style={{ width: '80%' }}>
            Your 80% — ${netPayout.toFixed(2)}
          </div>
          <div className="flex items-center justify-center h-full bg-red-600/80 text-[10px] font-black text-white transition-all" style={{ width: '20%' }}>
            Fee 20%
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Gross Sales',   value: `$${totalRevenue.toFixed(2)}`, color: 'text-white' },
            { label: 'MiSlice (20%)', value: `−$${miSliceFee.toFixed(2)}`, color: 'text-red-400' },
            { label: 'Your Payout',   value: `$${netPayout.toFixed(2)}`,   color: 'text-green-400' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className="text-[9px] font-bold text-stone-500 uppercase mb-1">{item.label}</p>
              <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">
          Revenue Trend — {period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : 'All Time'}
        </p>
        <div className="flex items-end gap-1 h-32 overflow-x-auto">
          {buckets.map((b, i) => (
            <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-red-500/20 relative overflow-hidden group cursor-default"
                style={{ height: `${Math.max((b.rev / maxRev) * 112, 3)}px` }}
                title={`${b.label}: $${b.rev.toFixed(2)} (${b.count} orders)`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-red-600 to-red-400 opacity-80" />
              </div>
              {buckets.length <= 14 && (
                <p className="text-[7px] font-bold text-stone-600 rotate-0 text-center">{b.label.split(' ')[1]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top items */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">Top Selling Items</p>
          {topItems.length === 0 ? (
            <p className="text-sm text-stone-600 text-center py-4">No order data yet.</p>
          ) : (
            <div className="space-y-3">
              {topItems.map(([name, { count, rev }]) => (
                <div key={name}>
                  <div className="flex justify-between text-xs font-bold text-white mb-1">
                    <span className="truncate mr-2">{name}</span>
                    <span className="shrink-0 text-stone-400">{count}× · ${rev.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all"
                      style={{ width: `${(count / maxItemCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peak hours */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-stone-500">Peak Order Hours</p>
            {peakHour.count > 0 && (
              <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Peak: {fmt12(peakHour.h)}
              </span>
            )}
          </div>
          <div className="flex items-end gap-0.5 h-20">
            {hourBuckets.map(({ h, count }) => (
              <div key={h} className="flex-1 flex flex-col items-center gap-0.5" title={`${fmt12(h)}: ${count} orders`}>
                <div
                  className={`w-full rounded-t-sm transition-all ${count === peakHour.count && count > 0 ? 'bg-yellow-400' : 'bg-red-500/40'}`}
                  style={{ height: `${Math.max((count / maxHour) * 72, 2)}px` }}
                />
                {h % 6 === 0 && <p className="text-[6px] font-bold text-stone-600">{fmt12(h)}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery vs Pickup */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">Fulfillment Mix</p>
          <div className="flex items-center gap-0 h-8 rounded-xl overflow-hidden mb-4">
            {deliveryCount > 0 && (
              <div className="flex items-center justify-center h-full bg-red-600/80 text-[10px] font-black text-white"
                style={{ width: `${(deliveryCount / totalFulfill) * 100}%` }}>
                Delivery {((deliveryCount / totalFulfill) * 100).toFixed(0)}%
              </div>
            )}
            {pickupCount > 0 && (
              <div className="flex items-center justify-center h-full bg-blue-600/80 text-[10px] font-black text-white"
                style={{ width: `${(pickupCount / totalFulfill) * 100}%` }}>
                Pickup {((pickupCount / totalFulfill) * 100).toFixed(0)}%
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-300">
              <span className="w-3 h-3 rounded bg-red-600/80" /> Delivery: {deliveryCount}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-stone-300">
              <span className="w-3 h-3 rounded bg-blue-600/80" /> Pickup: {pickupCount}
            </div>
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">Order Status Breakdown</p>
          {[
            { status: 'delivered',        label: 'Delivered',       color: 'bg-green-500' },
            { status: 'cancelled',         label: 'Cancelled',       color: 'bg-red-500' },
            { status: 'out_for_delivery',  label: 'Out for Delivery',color: 'bg-blue-500' },
            { status: 'preparing',         label: 'Preparing',       color: 'bg-yellow-500' },
          ].map(s => {
            const count = filtered.filter(o => o.orderStatus === s.status).length;
            const pct   = filtered.length ? (count / filtered.length) * 100 : 0;
            return (
              <div key={s.status} className="mb-3">
                <div className="flex justify-between text-xs font-bold text-stone-300 mb-1">
                  <span>{s.label}</span>
                  <span>{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
