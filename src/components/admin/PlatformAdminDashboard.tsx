import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Store as StoreIcon, ShieldCheck, DollarSign, ListOrdered, Ticket, Activity, RefreshCw } from 'lucide-react';
import { logAudit } from '../../utils/audit';
import { initializeCollections } from '../../utils/initDB';

export function PlatformAdminDashboard() {
  const [tab, setTab] = useState<'overview' | 'restaurants' | 'orders' | 'payouts' | 'coupons'>('overview');
  const [stores, setStores] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  
  useEffect(() => {
    // Load all stores
    const unsubStores = onSnapshot(query(collection(db, 'stores')), (snap) => {
      setStores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load all orders
    const unsubOrders = onSnapshot(query(collection(db, 'orders')), (snap) => {
       const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
       docs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
       setOrders(docs);
    });

    return () => {
      unsubStores();
      unsubOrders();
    };
  }, []);

  const pendingStores = stores.filter(store => store.application_status && store.application_status !== 'approved');

  return (
    <div className="max-w-7xl mx-auto w-full pt-8 pb-20 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
           <div className="bg-red-600/10 backdrop-blur-2xl border border-red-500/20 p-6 rounded-3xl mb-4 text-center relative overflow-hidden">
             <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-2 relative z-10" />
             <h2 className="text-xl font-black text-white relative z-10">Platform Admin</h2>
             <p className="text-xs font-bold text-red-400 mt-1 relative z-10">{auth.currentUser?.email}</p>
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
           </div>
           
           {[
             { id: 'overview', label: 'Overview', icon: Activity },
             { id: 'restaurants', label: 'Restaurants', icon: StoreIcon },
             { id: 'orders', label: 'All Orders', icon: ListOrdered },
             { id: 'payouts', label: 'Payouts', icon: DollarSign },
             { id: 'coupons', label: 'Platform Coupons', icon: Ticket }
           ].map(t => (
             <button 
               key={t.id} 
               onClick={() => setTab(t.id as any)}
               className={`w-full flex items-center gap-3 text-left px-6 py-4 rounded-2xl font-bold text-sm transition-all ${tab === t.id ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(255,30,30,0.3)]' : 'bg-white/5 text-stone-400 border border-white/10 hover:bg-white/10 hover:text-white'}`}
             >
               <t.icon className="w-4 h-4" />
               {t.label}
             </button>
           ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black text-white">MiSlice Platform Overview</h2>
                 <button 
                   onClick={async () => {
                     setIsInitializing(true);
                     await initializeCollections();
                     setIsInitializing(false);
                     alert("24 Collections Initialized!");
                   }}
                   disabled={isInitializing}
                   className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-sm"
                 >
                   {isInitializing ? 'Initializing...' : 'Force Init All 24 Collections'}
                 </button>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                 {[
                   { label: 'Total Sales', val: '$' + orders.reduce((sum, o) => sum + (o.customerFinalTotal || 0), 0).toFixed(2), col: 'text-green-400' },
                   { label: 'MiSlice Fees', val: '$' + orders.reduce((sum, o) => sum + (o.platformFeeAmount || 0), 0).toFixed(2), col: 'text-blue-400' },
                   { label: 'Total Orders', val: orders.length, col: 'text-white' },
                   { label: 'Active Stores', val: stores.filter(s => s.is_setup_complete).length, col: 'text-red-400' }
                 ].map(st => (
                   <div key={st.label} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                      <p className="text-xs font-bold text-stone-500 uppercase">{st.label}</p>
                      <p className={`text-2xl font-black mt-2 ${st.col}`}>{st.val}</p>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {tab === 'restaurants' && (
             <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white">Manage Restaurants</h2>
                    <p className="text-sm text-stone-500">Review store applications and manage approved restaurants.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-300">
                    <span className="font-bold text-white">Pending Applications</span>
                    <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full">{pendingStores.length}</span>
                  </div>
                </div>

                {pendingStores.length > 0 && (
                  <div className="grid gap-4">
                    {pendingStores.map(store => (
                      <div key={store.id} className="rounded-3xl border border-red-500/20 bg-black/40 p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm uppercase tracking-widest text-red-400 font-bold mb-2">{store.application_status?.replace(/_/g, ' ') || 'Pending'}</p>
                            <h3 className="text-xl font-black text-white mb-2">{store.store_name || 'Unnamed Store'}</h3>
                            <p className="text-sm text-stone-400 mb-1">{store.address || 'No address provided'}</p>
                            <p className="text-sm text-stone-400">Phone: {store.phone || 'N/A'}</p>
                          </div>
                          <div className="text-sm text-stone-400 space-y-1">
                            <p><span className="font-bold text-white">City:</span> {store.city || 'Detroit'}</p>
                            <p><span className="font-bold text-white">State:</span> {store.state || 'MI'}</p>
                            <p><span className="font-bold text-white">Delivery fee:</span> ${store.delivery_fee?.toFixed?.(2) ?? store.delivery_fee ?? 'TBD'}</p>
                            <p><span className="font-bold text-white">Min order:</span> ${store.minimum_order ?? 'TBD'}</p>
                          </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={async () => {
                              await updateDoc(doc(db, 'stores', store.id), {
                                is_approved: true,
                                application_status: 'approved',
                                reviewedAt: new Date().toISOString(),
                                review_notes: 'Approved by platform admin',
                              });
                            }}
                            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              const reason = window.prompt('Reason for rejection?', 'Missing menu details');
                              if (!reason) return;
                              await updateDoc(doc(db, 'stores', store.id), {
                                is_approved: false,
                                application_status: 'rejected',
                                reviewedAt: new Date().toISOString(),
                                rejection_reason: reason,
                                review_notes: reason,
                              });
                            }}
                            className="text-xs font-bold bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg text-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                  <table className="w-full text-left text-sm text-stone-300">
                    <thead className="bg-black/40 text-xs uppercase font-bold text-stone-500 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">Store Name</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Set Up</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {stores.map(store => (
                        <tr key={store.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">{store.store_name || "Unknown"}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${store.application_status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : store.application_status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                              {store.application_status?.replace(/_/g, ' ') || (store.is_approved ? 'approved' : 'pending')}
                            </span>
                          </td>
                          <td className="px-6 py-4">{store.is_setup_complete ? 'Yes' : 'No'}</td>
                          <td className="px-6 py-4">
                            {store.application_status !== 'approved' ? (
                              <div className="flex flex-wrap gap-2">
                                <button 
                                  onClick={async () => {
                                    await updateDoc(doc(db, 'stores', store.id), {
                                      is_approved: true,
                                      application_status: 'approved',
                                      reviewedAt: new Date().toISOString(),
                                      review_notes: 'Approved by platform admin',
                                    });
                                  }}
                                  className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={async () => {
                                    const reason = window.prompt('Reason for rejection?', 'Missing menu details');
                                    if (!reason) return;
                                    await updateDoc(doc(db, 'stores', store.id), {
                                      is_approved: false,
                                      application_status: 'rejected',
                                      reviewedAt: new Date().toISOString(),
                                      rejection_reason: reason,
                                      review_notes: reason,
                                    });
                                  }}
                                  className="text-xs font-bold bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-red-200"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={async () => {
                                  await updateDoc(doc(db, 'stores', store.id), {
                                    application_status: 'suspended',
                                    reviewedAt: new Date().toISOString(),
                                    review_notes: 'Suspended by platform admin',
                                  });
                                }}
                                className="text-xs font-bold bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-red-200"
                              >
                                Suspend
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}
          
          {tab === 'payouts' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white">Pending Payouts to Restaurants</h2>
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-x-auto">
                 <table className="w-full text-left text-sm text-stone-300 whitespace-nowrap">
                    <thead className="bg-black/40 text-[10px] uppercase font-bold text-stone-500 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Store</th>
                        <th className="px-4 py-3">Store Net Payout</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                       {orders.filter(o => o.payoutStatus !== 'paid' && o.orderStatus === 'delivered').map(order => (
                         <tr key={order.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-4 py-3 text-white font-bold">#{order.id.slice(-6).toUpperCase()}</td>
                           <td className="px-4 py-3">{stores.find(s => s.id === order.storeId)?.store_name || order.storeId}</td>
                           <td className="px-4 py-3 font-bold text-green-400">${order.storeSettlement?.toFixed(2)}</td>
                           <td className="px-4 py-3 text-red-400 uppercase text-[10px] font-bold">{order.payoutStatus || 'pending'}</td>
                           <td className="px-4 py-3">
                             <button 
                               onClick={async () => {
                                 await updateDoc(doc(db, 'orders', order.id), { 
                                     payoutStatus: 'paid', 
                                     paidByAdminId: auth.currentUser?.uid,
                                     paidByAdminName: 'Sathya', 
                                     adminPaymentNote: 'Paid via Platform Dashboard',
                                     payoutDate: new Date().toISOString(),
                                     payoutTransactionId: `TXN-${Date.now()}` 
                                 });
                                 await logAudit('PAYOUT_MARKED_PAID', 'orders', 'pending', 'paid', auth.currentUser?.uid || 'admin', 'Sathya', 'isPlatformAdmin');
                               }}
                               className="bg-green-600/20 text-green-400 border border-green-500/50 hover:bg-green-600/40 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                             >
                               Mark Paid
                             </button>
                           </td>
                         </tr>
                       ))}
                       {orders.filter(o => o.payoutStatus !== 'paid' && o.orderStatus === 'delivered').length === 0 && (
                         <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-500 font-bold">No pending payouts.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
