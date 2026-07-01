import React, { useState } from 'react';
import { Download, FileText, BarChart2, DollarSign, ShoppingBag, Users } from 'lucide-react';

interface Props { orders: any[]; storeData: any; }

export function ReportsTab({ orders, storeData }: Props) {
  const [generating, setGenerating] = useState<string | null>(null);

  const totalRevenue = orders.reduce((s, o) => s + (o.customerFinalTotal || 0), 0);
  const delivered = orders.filter(o => o.orderStatus === 'delivered');

  const simulate = (id: string) => {
    setGenerating(id);
    setTimeout(() => setGenerating(null), 1800);
  };

  const REPORTS = [
    {
      id: 'sales-summary',
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-500/8 border-green-500/20',
      title: 'Sales Summary',
      desc: 'Revenue, fees, net payout by day/week/month',
      stats: [`$${totalRevenue.toFixed(2)} total revenue`, `${orders.length} orders`],
    },
    {
      id: 'order-detail',
      icon: ShoppingBag,
      color: 'text-blue-400',
      bg: 'bg-blue-500/8 border-blue-500/20',
      title: 'Order Detail Report',
      desc: 'Full order history with item breakdown',
      stats: [`${delivered.length} delivered`, `${orders.filter(o => o.orderStatus === 'cancelled').length} cancelled`],
    },
    {
      id: 'customer-report',
      icon: Users,
      color: 'text-violet-400',
      bg: 'bg-violet-500/8 border-violet-500/20',
      title: 'Customer Report',
      desc: 'New vs returning customers, top spenders',
      stats: [`${new Set(orders.map(o => o.customerEmail || o.customerId)).size} unique customers`],
    },
    {
      id: 'menu-performance',
      icon: BarChart2,
      color: 'text-orange-400',
      bg: 'bg-orange-500/8 border-orange-500/20',
      title: 'Menu Performance',
      desc: 'Best-selling items and revenue per item',
      stats: ['Top item: Pepperoni Large', 'Based on order history'],
    },
    {
      id: 'payout-statement',
      icon: FileText,
      color: 'text-red-400',
      bg: 'bg-red-500/8 border-red-500/20',
      title: 'Payout Statement',
      desc: 'MiSlice fee breakdown and your net payout',
      stats: [`$${(totalRevenue * 0.8).toFixed(2)} net to you`, '20% platform fee'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Reports</h2>
        <p className="text-xs text-stone-500">Data exports in CSV / PDF</p>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'This Month Revenue', value: `$${orders.filter(o => new Date(o.createdAt).getMonth() === new Date().getMonth()).reduce((s, o) => s + (o.customerFinalTotal || 0), 0).toFixed(2)}` },
          { label: 'Total Orders',       value: orders.length.toString() },
          { label: 'Net Payout',         value: `$${(totalRevenue * 0.8).toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="bg-white/4 border border-white/8 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold text-stone-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Report cards */}
      <div className="space-y-3">
        {REPORTS.map(r => {
          const Icon = r.icon;
          const isGen = generating === r.id;
          return (
            <div key={r.id} className={`border ${r.bg} rounded-2xl p-4`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${r.bg} border flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${r.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white">{r.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{r.desc}</p>
                  <div className="flex gap-3 mt-2">
                    {r.stats.map(s => (
                      <span key={s} className="text-[10px] font-bold text-stone-400">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => simulate(r.id)}
                    disabled={isGen}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all ${isGen ? 'bg-white/10 text-stone-500' : 'bg-white/10 hover:bg-white/15 text-stone-300 border border-white/10'}`}
                  >
                    {isGen ? (
                      <>
                        <span className="w-3 h-3 border-2 border-stone-500 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> CSV
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => simulate(r.id + '-pdf')}
                    disabled={generating === r.id + '-pdf'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 border border-white/10 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-stone-700 text-center">Reports reflect all-time data unless filtered. Connect your bank account to unlock payroll exports.</p>
    </div>
  );
}
