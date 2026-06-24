import React, { useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Calendar } from 'lucide-react';

interface Props { orders: any[]; storeData: any; }

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PERIOD_LABELS: Record<Period, string> = { daily: 'Today', weekly: 'This Week', monthly: 'This Month', yearly: 'This Year' };

const CATEGORIES = ['Pizzas', 'Beverages', 'Sides', 'Desserts', 'Dips & Sauces', 'Other'];

function categoryOf(item: any): string {
  const name: string = (item.pizzaName || item.name || '').toLowerCase();
  if (name.includes('coke') || name.includes('pepsi') || name.includes('drink') || name.includes('lemonade') || name.includes('juice') || name.includes('water')) return 'Beverages';
  if (name.includes('wing') || name.includes('bread') || name.includes('fries') || name.includes('salad') || name.includes('side')) return 'Sides';
  if (name.includes('brownie') || name.includes('cookie') || name.includes('cake') || name.includes('dessert')) return 'Desserts';
  if (name.includes('dip') || name.includes('sauce') || name.includes('ranch') || name.includes('bbq')) return 'Dips & Sauces';
  if (name.includes('pizza') || name.includes('pie') || item.pizzaName) return 'Pizzas';
  return 'Other';
}

function filterByPeriod(orders: any[], period: Period) {
  const now = new Date();
  return orders.filter(o => {
    const d = new Date(o.createdAt);
    if (period === 'daily')   return d.toDateString() === now.toDateString();
    if (period === 'weekly')  { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'yearly')  return d.getFullYear() === now.getFullYear();
    return true;
  }).filter(o => o.orderStatus === 'delivered');
}

function buildBuckets(orders: any[], period: Period): { label: string; rev: number }[] {
  if (period === 'daily') {
    return Array.from({ length: 24 }, (_, h) => ({
      label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`,
      rev: orders.filter(o => new Date(o.createdAt).getHours() === h).reduce((s, o) => s + (o.customerFinalTotal || 0), 0),
    }));
  }
  if (period === 'weekly') {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { label: days[d.getDay()], rev: orders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString()).reduce((s,o)=>s+(o.customerFinalTotal||0),0) };
    });
  }
  if (period === 'monthly') {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => ({
      label: String(i+1),
      rev: orders.filter(o => new Date(o.createdAt).getDate() === i+1).reduce((s,o)=>s+(o.customerFinalTotal||0),0),
    }));
  }
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return Array.from({ length: 12 }, (_, i) => ({
    label: months[i],
    rev: orders.filter(o => new Date(o.createdAt).getMonth() === i).reduce((s,o)=>s+(o.customerFinalTotal||0),0),
  }));
}

export function EarningsTab({ orders, storeData }: Props) {
  const [period, setPeriod] = useState<Period>('weekly');

  const filtered  = filterByPeriod(orders, period);
  const gross     = filtered.reduce((s,o) => s + (o.customerFinalTotal||0), 0);
  const fee       = gross * 0.20;
  const net       = gross - fee;
  const orderCount = filtered.length;
  const avg       = orderCount ? gross / orderCount : 0;

  const buckets = buildBuckets(filtered, period);
  const maxRev  = Math.max(...buckets.map(b => b.rev), 1);

  // Category breakdown
  const catRevenue: Record<string, number> = {};
  filtered.forEach(o => (o.items||[]).forEach((it: any) => {
    const cat = categoryOf(it);
    catRevenue[cat] = (catRevenue[cat] || 0) + (it.itemTotal || 0);
  }));
  const catList = CATEGORIES.map(c => ({ cat: c, rev: catRevenue[c] || 0 })).filter(c => c.rev > 0).sort((a,b)=>b.rev-a.rev);
  const maxCatRev = Math.max(...catList.map(c=>c.rev), 1);

  const CAT_COLORS: Record<string, string> = {
    'Pizzas':         'from-red-600 to-red-400',
    'Beverages':      'from-blue-600 to-blue-400',
    'Sides':          'from-yellow-600 to-yellow-400',
    'Desserts':       'from-pink-600 to-pink-400',
    'Dips & Sauces':  'from-orange-600 to-orange-400',
    'Other':          'from-stone-600 to-stone-400',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Earnings</h2>
          <p className="text-xs text-stone-500 mt-0.5">Revenue breakdown after MiSlice 20% commission</p>
        </div>
        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${period === p ? 'bg-red-600 text-white' : 'text-stone-500 hover:text-white'}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Gross Revenue', value: `$${gross.toFixed(2)}`,     icon: DollarSign,  color: 'text-white',        bg: 'bg-white/5',       border: 'border-white/10' },
          { label: 'MiSlice Fee',   value: `−$${fee.toFixed(2)}`,      icon: TrendingUp,  color: 'text-red-400',      bg: 'bg-red-500/8',     border: 'border-red-500/20' },
          { label: 'Your Earnings', value: `$${net.toFixed(2)}`,       icon: DollarSign,  color: 'text-green-400',    bg: 'bg-green-500/8',   border: 'border-green-500/20' },
          { label: 'Orders',        value: orderCount.toString(),       icon: ShoppingBag, color: 'text-blue-400',     bg: 'bg-blue-500/8',    border: 'border-blue-500/20' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl p-4`}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">{k.label}</p>
                <Icon className={`w-4 h-4 ${k.color} shrink-0`} />
              </div>
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">Revenue — {PERIOD_LABELS[period]}</p>
        <div className="flex items-end gap-0.5 h-32 overflow-x-auto">
          {buckets.map((b, i) => (
            <div key={i} className="flex-1 min-w-[14px] flex flex-col items-center gap-1" title={`${b.label}: $${b.rev.toFixed(2)}`}>
              <div className="w-full rounded-t-sm bg-red-500/15 relative overflow-hidden" style={{ height: `${Math.max((b.rev / maxRev) * 112, 2)}px` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-red-600 to-red-400 opacity-80" />
              </div>
              {(period === 'weekly' || (period === 'daily' && i % 4 === 0) || (period === 'monthly' && (i+1) % 5 === 0) || period === 'yearly') && (
                <p className="text-[7px] font-bold text-stone-600">{b.label}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">Earnings by Category</p>
        {catList.length === 0 ? (
          <p className="text-sm text-stone-600 text-center py-6">No categorized sales yet for this period.</p>
        ) : (
          <div className="space-y-4">
            {catList.map(({ cat, rev }) => {
              const pct = (rev / gross) * 100;
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-white">{cat}</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-white">${rev.toFixed(2)}</span>
                      <span className="text-[10px] text-stone-500 ml-2">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${CAT_COLORS[cat] || CAT_COLORS.Other} rounded-full transition-all`}
                      style={{ width: `${(rev / maxCatRev) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payout summary */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">Payout Summary</p>
        <div className="space-y-3">
          {[
            { label: 'Gross Sales',          value: `$${gross.toFixed(2)}`,  color: 'text-white' },
            { label: 'MiSlice Platform (20%)',value: `−$${fee.toFixed(2)}`,  color: 'text-red-400' },
            { label: 'Your Net Earnings',     value: `$${net.toFixed(2)}`,   color: 'text-green-400', bold: true },
          ].map(row => (
            <div key={row.label} className={`flex justify-between items-center py-2 ${row.bold ? 'border-t border-white/10 pt-3 mt-1' : ''}`}>
              <span className={`text-sm ${row.bold ? 'font-black text-white' : 'font-bold text-stone-400'}`}>{row.label}</span>
              <span className={`text-sm font-black ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-stone-600 mt-4 leading-relaxed">
          Payouts are processed weekly every Thursday. Funds arrive in your connected bank account within 2–3 business days.
        </p>
      </div>
    </div>
  );
}
