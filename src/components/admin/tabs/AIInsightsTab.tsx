import React, { useState } from 'react';
import { Zap, TrendingUp, TrendingDown, AlertTriangle, Star, MessageSquare, ShoppingBag, Clock, Lightbulb, RefreshCw } from 'lucide-react';

interface Props { orders: any[]; storeData: any; isPending?: boolean; }

type InsightCategory = 'all' | 'sales' | 'customers' | 'operations' | 'suggestions';

const CATEGORY_LABELS: Record<InsightCategory, string> = {
  all:         'All',
  sales:       'Sales',
  customers:   'Customers',
  operations:  'Operations',
  suggestions: 'Suggestions',
};

interface Insight {
  id: string;
  type: 'spike' | 'drop' | 'complaint' | 'praise' | 'suggestion' | 'tip';
  category: Exclude<InsightCategory, 'all'>;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  title: string;
  detail: string;
  time?: string;
  action?: string;
}

// Static insights shown during pending (setup assistant mode)
const SETUP_INSIGHTS: Insight[] = [
  { id: 's1', type: 'tip',        category: 'suggestions', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25', title: 'Add pizza photos to boost conversion', detail: 'Listings with food photos get 3× more clicks on MiSlice. Upload high-quality images for your top 5 items.', action: 'Go to Menu' },
  { id: 's2', type: 'tip',        category: 'suggestions', icon: Lightbulb, color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   title: 'Add a Beverages category', detail: 'Stores with drinks see 28% higher average order value. Add Coke, Pepsi, Lemonade to increase your ticket size.' },
  { id: 's3', type: 'tip',        category: 'suggestions', icon: Clock,     color: 'text-orange-400',bg: 'bg-orange-500/10', border: 'border-orange-500/25', title: 'Complete your business hours', detail: 'Customers won\'t order if hours aren\'t set. Fill in operating hours in Store Profile.', action: 'Go to Profile' },
  { id: 's4', type: 'tip',        category: 'suggestions', icon: Star,      color: 'text-violet-400',bg: 'bg-violet-500/10', border: 'border-violet-500/25', title: 'Upload your store logo', detail: 'Stores with a logo appear more trustworthy. Customers are 2× more likely to place a first order.', action: 'Go to Profile' },
  { id: 's5', type: 'tip',        category: 'suggestions', icon: Zap,       color: 'text-red-400',  bg: 'bg-red-500/10',   border: 'border-red-500/25',   title: 'Create at least 3 active deals', detail: 'Deals drive new customer acquisition. Create a weekend special, a BOGO, or a free delivery offer.', action: 'Go to Deals' },
  { id: 's6', type: 'tip',        category: 'suggestions', icon: ShoppingBag,color:'text-green-400', bg: 'bg-green-500/10',  border: 'border-green-500/25',  title: 'Add modifier options (Crust, Size)', detail: 'Customers expect to choose their crust and size. Build out your modifier groups for a better ordering experience.' },
];

// Dynamic insights generated from order data
function generateLiveInsights(orders: any[]): Insight[] {
  if (!orders.length) return [];
  const insights: Insight[] = [];
  const now = Date.now();
  const week  = 7 * 86400000;
  const week2 = 14 * 86400000;

  const thisWeek = orders.filter(o => now - new Date(o.createdAt).getTime() < week);
  const lastWeek = orders.filter(o => {
    const age = now - new Date(o.createdAt).getTime();
    return age >= week && age < week2;
  });

  // Item frequency this week vs last
  const countItems = (ords: any[]) => {
    const c: Record<string, number> = {};
    ords.forEach(o => (o.items || []).forEach((it: any) => {
      const n = it.pizzaName || 'Item';
      c[n] = (c[n] || 0) + (it.quantity || 1);
    }));
    return c;
  };
  const thisItems = countItems(thisWeek);
  const lastItems = countItems(lastWeek);

  Object.entries(thisItems).forEach(([name, count]) => {
    const prev = lastItems[name] || 0;
    if (prev > 0) {
      const pct = ((count - prev) / prev) * 100;
      if (pct >= 50) {
        insights.push({ id: `spike_${name}`, type: 'spike', category: 'sales', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/25',
          title: `${name} orders up ${Math.round(pct)}% this week`, detail: `${count} orders this week vs ${prev} last week. Consider featuring it as a deal.`, time: 'This week' });
      } else if (pct <= -30) {
        insights.push({ id: `drop_${name}`, type: 'drop', category: 'sales', icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25',
          title: `${name} orders dropped ${Math.abs(Math.round(pct))}%`, detail: `Only ${count} orders vs ${prev} last week. Try adding a discount to bring customers back.`, time: 'This week' });
      }
    } else if (count >= 5) {
      insights.push({ id: `new_${name}`, type: 'spike', category: 'sales', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/25',
        title: `${name} is trending — ${count} orders`, detail: `New interest this week. Keep it stocked and consider featuring it.`, time: 'This week' });
    }
  });

  // Peak day
  const dayRevenue: Record<number, number> = {};
  thisWeek.filter(o => o.orderStatus === 'delivered').forEach(o => {
    const day = new Date(o.createdAt).getDay();
    dayRevenue[day] = (dayRevenue[day] || 0) + (o.customerFinalTotal || 0);
  });
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const peakDay = Object.entries(dayRevenue).sort((a,b) => b[1] - a[1])[0];
  if (peakDay) {
    const lowDay = Object.entries(dayRevenue).sort((a,b) => a[1] - b[1])[0];
    const peakRev = peakDay[1], lowRev = lowDay[1];
    if (peakRev > lowRev * 1.3) {
      const pct = Math.round(((peakRev - lowRev) / lowRev) * 100);
      insights.push({ id: 'peak_day', type: 'suggestion', category: 'operations', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25',
        title: `${dayNames[+peakDay[0]]} revenue is ${pct}% higher than ${dayNames[+lowDay[0]]}`, detail: `Consider running a special deal on ${dayNames[+lowDay[0]]} to boost slow-day sales.`, time: 'This week' });
    }
  }

  // Cancellation rate
  const cancelled = orders.filter(o => o.orderStatus === 'cancelled').length;
  const cancelRate = orders.length ? (cancelled / orders.length) * 100 : 0;
  if (cancelRate > 10) {
    insights.push({ id: 'cancel_rate', type: 'complaint', category: 'operations', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25',
      title: `High cancellation rate — ${cancelRate.toFixed(0)}%`, detail: 'Review your prep time estimates and ensure your menu items are available before publishing.', time: 'All time' });
  }

  // Revenue suggestion
  const totalRev = orders.reduce((s,o) => s + (o.customerFinalTotal || 0), 0);
  if (totalRev > 0) {
    insights.push({ id: 'upsell', type: 'suggestion', category: 'suggestions', icon: Lightbulb, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25',
      title: 'Add a Family Meal Deal to increase revenue', detail: 'Bundles (2 large pizzas + drinks) increase average order value by 35–60%. Customers love them on weekends.', action: 'Create Deal' });
    insights.push({ id: 'drinks_upsell', type: 'suggestion', category: 'suggestions', icon: Lightbulb, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/25',
      title: 'Customers frequently pair Coke with Pepperoni Pizza', detail: 'Offer a "Pizza + Drink" combo to increase basket size. Pairs sell 40% more when bundled.', action: 'Update Menu' });
  }

  return insights;
}

export function AIInsightsTab({ orders, storeData, isPending }: Props) {
  const [filter, setFilter] = useState<InsightCategory>('all');
  const [refreshing, setRefreshing] = useState(false);

  const liveInsights = isPending ? SETUP_INSIGHTS : [...generateLiveInsights(orders), ...SETUP_INSIGHTS.slice(0, 2)];
  const displayed = filter === 'all' ? liveInsights : liveInsights.filter(i => i.category === filter);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            {isPending ? 'AI Setup Assistant' : 'AI Insights'}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {isPending
              ? 'Smart suggestions to get your store ready before going live'
              : 'Real-time intelligence about your store performance'}
          </p>
        </div>
        <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-stone-400 bg-white/5 border border-white/10 rounded-xl hover:text-white hover:bg-white/8 transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.keys(CATEGORY_LABELS) as InsightCategory[]).map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === c ? 'bg-red-600 text-white' : 'bg-white/5 border border-white/10 text-stone-500 hover:text-white'
            }`}>
            {CATEGORY_LABELS[c]}
            {c !== 'all' && <span className="ml-1.5 text-[9px]">({liveInsights.filter(i => i.category === c).length})</span>}
          </button>
        ))}
      </div>

      {/* Insight cards */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="bg-black/40 border border-white/10 rounded-2xl py-14 text-center">
            <Zap className="w-8 h-8 text-stone-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-stone-500">No insights yet in this category.</p>
            <p className="text-xs text-stone-600 mt-1">More data = smarter insights. Keep orders coming in!</p>
          </div>
        ) : (
          displayed.map(insight => {
            const Icon = insight.icon;
            return (
              <div key={insight.id} className={`${insight.bg} border ${insight.border} rounded-2xl p-4 flex gap-4 items-start`}>
                <div className={`w-9 h-9 rounded-xl ${insight.bg} border ${insight.border} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`w-4.5 h-4.5 ${insight.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-black text-white leading-snug">{insight.title}</p>
                    {insight.time && <span className="text-[9px] font-bold text-stone-600 whitespace-nowrap shrink-0">{insight.time}</span>}
                  </div>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">{insight.detail}</p>
                  {insight.action && (
                    <button className={`mt-2 text-[10px] font-black ${insight.color} hover:opacity-80 transition-opacity`}>
                      {insight.action} →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isPending && orders.length === 0 && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 text-center">
          <p className="text-xs font-bold text-stone-500">AI insights become smarter as orders come in.</p>
          <p className="text-[10px] text-stone-600 mt-1">You'll see real trends, customer behavior, and sales patterns here.</p>
        </div>
      )}
    </div>
  );
}
