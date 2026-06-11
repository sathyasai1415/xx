import React from 'react';
import { AlertTriangle, DollarSign, TrendingUp, Users } from 'lucide-react';

export function TabOverview({ storeData, orders }: { storeData: any, orders: any[] }) {
  const latestOrders = [...orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  
  return (
    <div className="space-y-6">
      {/* Daily Price Verification Widget */}
      <div className="bg-gradient-to-r from-red-600/20 to-orange-500/10 border border-red-500/30 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50 text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Daily Price Verification</h3>
            <p className="text-sm font-medium text-red-300">⚠ Prices not updated in 7 days.</p>
          </div>
        </div>
        <div className="flex gap-2 z-10 text-sm font-bold">
          <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors border border-white/20">Update Prices</button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors shadow-[0_0_15px_rgba(255,30,30,0.4)]">Verify Prices Now</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Revenue Today', value: '$' + orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((s, o) => s + (o.customerFinalTotal || 0), 0).toFixed(2), trend: '+12%', icon: DollarSign },
          { label: 'Orders Today', value: orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length.toString(), trend: '+5%', icon: TrendingUp },
          { label: 'Total Sales', value: '$' + orders.reduce((s, o) => s + (o.customerFinalTotal || 0), 0).toFixed(2), trend: '+18%', icon: Users }
        ].map(stat => (
          <div key={stat.label} className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
              <stat.icon className="w-24 h-24 text-white" />
            </div>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 relative z-10">{stat.label}</p>
            <p className="text-4xl font-black text-white mb-2 relative z-10 tracking-tight">{stat.value}</p>
            <p className="text-xs font-bold text-green-400 flex items-center gap-1 relative z-10"><TrendingUp className="w-3 h-3" /> {stat.trend} from yesterday</p>
          </div>
        ))}
      </div>

      {/* Recent Orders Snippet */}
      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-black text-white">Recent Orders</h3>
         </div>
         
         <div className="space-y-3">
           {latestOrders.map(order => (
             <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center transition-colors hover:bg-white/10">
                <div>
                  <p className="text-sm font-bold text-white">Order #{order.id?.slice(-6).toUpperCase()}</p>
                  <p className="text-[10px] uppercase font-bold text-stone-500 mt-0.5">{new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <div className="font-black text-white text-lg">${order.customerFinalTotal?.toFixed(2) || '0.00'}</div>
                  <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest">{order.orderStatus}</div>
                </div>
             </div>
           ))}
           {latestOrders.length === 0 && <p className="text-sm text-stone-500">No recent orders.</p>}
         </div>
      </div>
    </div>
  );
}
