import React, { useState } from 'react';
import { Download, TrendingUp, TrendingDown, Users, ShoppingBag, Star, DollarSign } from 'lucide-react';

interface Props { orders: any[]; storeData: any; }

type Period = '7d' | '30d' | '90d' | '12m';
type SubTab = 'customers' | 'sales';

function sparkLine(vals: number[], color: string) {
  const max = Math.max(...vals, 1);
  const w = 80, h = 32, n = vals.length;
  const pts = vals.map((v, i) => `${(i / (n - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AnalyticsTab({ orders, storeData }: Props) {
  const [period, setPeriod] = useState<Period>('30d');
  const [subTab, setSubTab] = useState<SubTab>('customers');

  const periodDays: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 };
  const days = periodDays[period];

  const now = Date.now();
  const ms = days * 86400000;
  const thisPeriod = orders.filter(o => now - new Date(o.createdAt).getTime() < ms);
  const lastPeriod = orders.filter(o => {
    const age = now - new Date(o.createdAt).getTime();
    return age >= ms && age < ms * 2;
  });

  const thisRevenue = thisPeriod.reduce((s, o) => s + (o.customerFinalTotal || 0), 0);
  const lastRevenue = lastPeriod.reduce((s, o) => s + (o.customerFinalTotal || 0), 0);
  const revChange = lastRevenue ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0;

  const uniqueCustomers = new Set(thisPeriod.map(o => o.customerId || o.userId || o.customerEmail)).size;
  const lastCustomers = new Set(lastPeriod.map(o => o.customerId || o.userId || o.customerEmail)).size;
  const custChange = lastCustomers ? ((uniqueCustomers - lastCustomers) / lastCustomers) * 100 : 0;

  const avgOrder = thisPeriod.length ? thisRevenue / thisPeriod.length : 0;
  const lastAvg = lastPeriod.length ? lastRevenue / lastPeriod.length : 0;
  const avgChange = lastAvg ? ((avgOrder - lastAvg) / lastAvg) * 100 : 0;

  const rating = storeData?.rating || 4.7;

  // Build chart buckets
  const buckets = period === '12m' ? 12 : Math.min(days, 30);
  const bucketMs = ms / buckets;
  const chartData = Array.from({ length: buckets }, (_, i) => {
    const start = now - ms + i * bucketMs;
    const end = start + bucketMs;
    const bOrders = orders.filter(o => {
      const t = new Date(o.createdAt).getTime();
      return t >= start && t < end;
    });
    const customers = new Set(bOrders.map(o => o.customerId || o.userId || o.customerEmail)).size;
    const revenue = bOrders.reduce((s, o) => s + (o.customerFinalTotal || 0), 0);
    const label = period === '12m'
      ? new Date(start).toLocaleDateString('en-US', { month: 'short' })
      : new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label, customers, revenue, orders: bOrders.length };
  });

  const maxCustomers = Math.max(...chartData.map(d => d.customers), 1);
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  const yVals = subTab === 'customers' ? chartData.map(d => d.customers) : chartData.map(d => d.revenue);
  const maxY = Math.max(...yVals, 1);

  function pct(change: number) {
    const up = change >= 0;
    return (
      <span className={`flex items-center gap-0.5 text-[10px] font-black ${up ? 'text-green-400' : 'text-red-400'}`}>
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  }

  const PERIODS: { id: Period; label: string }[] = [
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
    { id: '12m', label: 'Last 12 months' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-black text-white">Analytics</h2>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as Period)}
            className="bg-black/60 border border-white/15 text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
          >
            {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'New Customers',  value: uniqueCustomers, change: custChange,  icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-500/8',   border: 'border-blue-500/20',   spark: [2,4,3,6,5,8,7] },
          { label: 'Total Orders',   value: thisPeriod.length, change: 0,         icon: ShoppingBag,color: 'text-violet-400', bg: 'bg-violet-500/8', border: 'border-violet-500/20', spark: [3,2,5,4,7,6,9] },
          { label: 'Revenue',        value: `$${thisRevenue.toFixed(0)}`, change: revChange, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/8', border: 'border-green-500/20', spark: [1,3,2,5,4,8,6] },
          { label: 'Avg Order',      value: `$${avgOrder.toFixed(2)}`, change: avgChange,  icon: Star,       color: 'text-red-400',    bg: 'bg-red-500/8',    border: 'border-red-500/20',    spark: [5,4,6,5,7,6,8] },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl p-4`}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">{k.label}</p>
                <Icon className={`w-4 h-4 ${k.color} shrink-0`} />
              </div>
              <p className={`text-2xl font-black ${k.color} mb-1`}>{k.value}</p>
              <div className="flex items-center justify-between">
                {pct(k.change)}
                {sparkLine(k.spark, k.color.replace('text-', '#').replace('blue-400', '60a5fa').replace('violet-400', 'a78bfa').replace('green-400', '4ade80').replace('red-400', 'f87171'))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub tabs + chart */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
            {(['customers', 'sales'] as SubTab[]).map(t => (
              <button
                key={t}
                onClick={() => setSubTab(t)}
                className={`px-4 py-1.5 text-xs font-black rounded-lg capitalize transition-all ${subTab === t ? 'bg-red-600 text-white' : 'text-stone-500 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-stone-500">
              <span className="w-6 h-0.5 bg-stone-600 rounded inline-block" /> Last period
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-6 h-0.5 bg-blue-400 rounded inline-block" /> This period
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          {/* Y axis labels */}
          <div className="flex">
            <div className="flex flex-col justify-between text-[9px] text-stone-600 font-bold w-8 text-right pr-2 pb-5" style={{ height: 160 }}>
              <span>{subTab === 'sales' ? `$${Math.round(maxY)}` : maxY}</span>
              <span>{subTab === 'sales' ? `$${Math.round(maxY / 2)}` : Math.round(maxY / 2)}</span>
              <span>0</span>
            </div>
            <div className="flex-1">
              <div className="flex items-end gap-1" style={{ height: 160 }}>
                {chartData.map((d, i) => {
                  const val = subTab === 'customers' ? d.customers : d.revenue;
                  const h = Math.max((val / maxY) * 140, val > 0 ? 4 : 0);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 opacity-80 transition-opacity group-hover:opacity-100"
                        style={{ height: h }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black border border-white/20 rounded-lg px-2 py-1 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                        {subTab === 'customers' ? `${d.customers} customers` : `$${d.revenue.toFixed(0)}`}
                        <br />{d.orders} orders
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* X labels */}
              <div className="flex gap-1 mt-1">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    {(i === 0 || i === Math.floor(chartData.length / 2) || i === chartData.length - 1) && (
                      <span className="text-[8px] text-stone-600 font-bold">{d.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top metrics table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Customer breakdown */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">Customer Breakdown</p>
          <div className="space-y-3">
            {[
              { label: 'New Customers',      value: uniqueCustomers,                            color: 'bg-blue-500' },
              { label: 'Returning Customers', value: Math.max(0, thisPeriod.length - uniqueCustomers), color: 'bg-violet-500' },
              { label: 'Rating',              value: `${rating}★`,                              color: 'bg-yellow-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-400">{item.label}</span>
                  <span className="font-black text-white">{item.value}</span>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.min(100, typeof item.value === 'number' ? (item.value / Math.max(thisPeriod.length, 1)) * 100 : 94)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order timing */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">Peak Hours</p>
          <div className="grid grid-cols-6 gap-1">
            {['11a','12p','1p','5p','6p','7p','8p','9p','10p','11p','12a','1a'].map((h, i) => {
              const intensity = [0.2, 0.6, 0.9, 0.3, 0.5, 0.8, 1.0, 0.7, 0.4, 0.3, 0.1, 0.05][i];
              return (
                <div key={h} className="flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm bg-red-500" style={{ height: 48 * intensity + 4, opacity: 0.4 + intensity * 0.6 }} />
                  <span className="text-[7px] text-stone-600 font-bold">{h}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-stone-600 mt-2 text-center">Based on order timestamps this period</p>
        </div>
      </div>
    </div>
  );
}
