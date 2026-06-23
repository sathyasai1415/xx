import React, { useState } from 'react';
import { Store as StoreIcon, AlertTriangle, CheckCircle2, DollarSign, TrendingUp, Users, Pizza, Plus, MoreHorizontal } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { StoreProfileTab } from './tabs/StoreProfileTab';
import { PayoutsTab } from './tabs/PayoutsTab';
import { ReceiptsTab } from './tabs/ReceiptsTab';
import { TabOverview } from './tabs/TabOverview';
import { PriceManagerTab } from './tabs/PriceManagerTab';
import { logAudit } from '../../utils/audit';

export function StoreDashboard({ storeData, deals, orders }: { storeData: any, deals: any[], orders: any[] }) {
  const [tab, setTab] = useState<'overview' | 'profile' | 'menu' | 'price' | 'orders' | 'receipts' | 'payouts' | 'deals' | 'analytics'>('overview');

  const pendingOrders = orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'placed' || o.orderStatus === 'confirmed');
  const preparingOrders = orders.filter(o => o.orderStatus === 'preparing');
  const readyOrders = orders.filter(o => o.orderStatus === 'ready_for_pickup');
  const outOrders = orders.filter(o => o.orderStatus === 'out_for_delivery');
  
  const handleUpdateOrderStatus = async (orderId: string, oldStatus: string, newStatus: string) => {
    await updateDoc(doc(db, 'orders', orderId), { orderStatus: newStatus });
    await logAudit(
       'ORDER_STATUS_UPDATED',
       'orders',
       oldStatus,
       newStatus,
       auth.currentUser?.uid || 'store',
       storeData?.store_name || auth.currentUser?.email || 'Store Owner',
       'storeOwner'
    );
  };

  return (
    <div className="max-w-7xl mx-auto w-full pt-8 pb-20">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
           <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl mb-4 text-center">
             <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
               <StoreIcon className="w-8 h-8" />
             </div>
             <h2 className="text-xl font-black text-white">{storeData?.store_name}</h2>
             <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-1">Merchant ID: {storeData?.unique_store_id}</p>
           </div>
           
           {[
             { id: 'overview', label: 'Overview' },
             { id: 'profile', label: 'Store Profile' },
             { id: 'menu', label: 'Menu Builder' },
             { id: 'price', label: 'Price Manager' },
             { id: 'orders', label: 'Live Orders' },
             { id: 'receipts', label: 'Receipts' },
             { id: 'payouts', label: 'Payments & Payouts' },
             { id: 'deals', label: 'Deals & Coupons' },
             { id: 'analytics', label: 'Analytics' }
           ].map(t => (
             <button 
               key={t.id} 
               onClick={() => setTab(t.id as any)}
               className={`w-full text-left px-6 py-4 rounded-2xl font-bold text-sm transition-all ${tab === t.id ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(255,30,30,0.3)]' : 'bg-white/5 text-stone-400 border border-white/10 hover:bg-white/10 hover:text-white'}`}
             >
               {t.label}
             </button>
           ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          
          {tab === 'overview' && <TabOverview storeData={storeData} orders={orders} />}

          {tab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white mb-6">Live Orders</h2>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                 {[
                   { title: 'New', count: pendingOrders.length, items: pendingOrders, color: 'text-blue-400', border: 'border-blue-500/30' },
                   { title: 'Preparing', count: preparingOrders.length, items: preparingOrders, color: 'text-red-400', border: 'border-red-500/30' },
                   { title: 'Ready / Out', count: readyOrders.length + outOrders.length, items: [...readyOrders, ...outOrders], color: 'text-green-400', border: 'border-green-500/30' },
                   { title: 'Completed', count: 0, items: [], color: 'text-stone-400', border: 'border-white/10' }
                 ].map(col => (
                   <div key={col.title} className="bg-black/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden h-[600px]">
                     <div className={`p-4 border-b border-white/10 bg-white/5 flex justify-between items-center`}>
                       <h3 className={`font-black ${col.color}`}>{col.title}</h3>
                       <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-bold text-white">{col.count}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar cursor-pointer">
                        {col.items.map(order => (
                          <div key={order.id} className={`bg-white/5 border ${col.border} rounded-xl p-4 hover:bg-white/10 transition-colors`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold text-white">#{order.id?.slice(-4).toUpperCase()}</span>
                              <span className="text-xs font-black text-green-400">${order.finalTotal?.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-stone-300 space-y-1 mb-3">
                              {order.items?.map((item: any, i: number) => (
                                <div key={i}>{item.quantity}x {item.pizzaName}</div>
                              ))}
                            </div>
                            <select 
                              value={order.orderStatus} 
                              onChange={(e) => handleUpdateOrderStatus(order.id, order.orderStatus, e.target.value)}
                              className="w-full bg-black border border-white/20 text-xs font-bold text-stone-300 rounded-lg p-2 focus:outline-none focus:border-red-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready_for_pickup">Ready for Pickup</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </div>
                        ))}
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {tab === 'menu' && (
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">Menu Builder</h2>
                <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
              <p className="text-stone-400 mb-6 text-sm">Manage your category-based pricing here.</p>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {['Pizzas', 'Sizes', 'Crusts', 'Meat Tops', 'Veggie Tops', 'Drinks', 'Sides', 'Desserts'].map((cat, i) => (
                    <div key={cat} className={`p-4 rounded-xl border font-bold text-center cursor-pointer transition-colors ${i === 0 ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-white/5 border-white/10 text-stone-400 hover:bg-white/10 hover:text-white'}`}>
                      {cat}
                    </div>
                  ))}
              </div>
              
              <div className="space-y-4">
                 {['Classic Cheese', 'Pepperoni', 'Veggie', 'BBQ Chicken', 'Meat Lovers'].map((pizza, i) => (
                   <div key={pizza} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-stone-900 rounded-lg flex items-center justify-center">
                           <Pizza className="w-6 h-6 text-stone-500" />
                         </div>
                         <div>
                            <p className="text-white font-bold">{pizza}</p>
                            <p className="text-xs text-stone-500">Base Price: ${i === 0 ? '12.99' : '15.99'}</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-xs font-bold text-stone-400 hover:text-white px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg">Edit</button>
                        <button className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-lg">Disable</button>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {tab === 'deals' && (
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">Deals & Offers</h2>
                <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create Deal
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                 {['20% Off', 'Buy One Get One', 'Free Delivery'].map((type) => (
                   <div key={type} className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center hover:border-red-500/50 cursor-pointer transition-all">
                      <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plus className="w-6 h-6" />
                      </div>
                      <p className="text-white font-bold">{type}</p>
                   </div>
                 ))}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-4">Active Coupons</h3>
              <div className="space-y-4">
                 {deals.length === 0 ? (
                   <p className="text-sm text-stone-500">No active deals found.</p>
                 ) : (
                   deals.map(deal => (
                     <div key={deal.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                        <div>
                           <p className="text-white font-bold">{deal.title}</p>
                           <p className="text-xs font-bold text-green-400 mt-1">${deal.discounted_price?.toFixed(2)} <span className="text-stone-500 line-through">${deal.original_price?.toFixed(2)}</span></p>
                        </div>
                        <button className="text-xs font-bold text-stone-400 hover:text-white px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg">Disable</button>
                     </div>
                   ))
                 )}
              </div>
            </div>
          )}

          {tab === 'profile' && <StoreProfileTab storeData={storeData} />}
          {tab === 'price' && <PriceManagerTab storeData={storeData} />}
          {tab === 'receipts' && <ReceiptsTab orders={orders} />}
          {tab === 'payouts' && <PayoutsTab storeData={storeData} orders={orders} />}

          {tab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white mb-6">Analytics</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl">
                   <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Top Selling Pizzas</h3>
                   <div className="space-y-4">
                     {[{ n: 'Pepperoni', v: '34%' }, { n: 'Meat Lovers', v: '22%' }, { n: 'Classic Cheese', v: '18%' }].map(item => (
                       <div key={item.n}>
                         <div className="flex justify-between text-sm font-bold text-white mb-1">
                           <span>{item.n}</span>
                           <span>{item.v}</span>
                         </div>
                         <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                           <div className="bg-red-500 h-full rounded-full" style={{ width: item.v }}></div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl">
                   <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Delivery vs Pickup</h3>
                   <div className="flex items-center justify-center h-32 relative">
                      {/* Simple CSS Donut Chart */}
                      <div className="w-24 h-24 rounded-full border-[12px] border-red-500 border-r-blue-500/50 mix-blend-screen relative">
                         <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white">65%</div>
                      </div>
                   </div>
                   <div className="flex justify-center gap-6 mt-4 text-xs font-bold">
                     <span className="flex items-center gap-2 text-white"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Delivery</span>
                     <span className="flex items-center gap-2 text-white"><div className="w-3 h-3 bg-blue-500/50 rounded-sm"></div> Pickup</span>
                   </div>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
