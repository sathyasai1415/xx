import React from 'react';
import { db } from '../../../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';

export function PayoutsTab({ storeData, orders }: { storeData: any, orders: any[] }) {
  const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered');
  const totalSales = deliveredOrders.reduce((sum, o) => sum + (o.customerFinalTotal || 0), 0);
  const totalMiSliceFees = deliveredOrders.reduce((sum, o) => sum + (o.platformFeeAmount || 0), 0);
  const totalPayout = deliveredOrders.reduce((sum, o) => sum + (o.storeSettlement || 0), 0);
  const taxCollected = deliveredOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white mb-6">Payments & Payouts</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Gross Sales', val: '$' + totalSales.toFixed(2), text: 'text-white' },
          { label: 'Tax Collected', val: '$' + taxCollected.toFixed(2), text: 'text-stone-300' },
          { label: 'MiSlice Fees (20%)', val: '-$' + totalMiSliceFees.toFixed(2), text: 'text-red-400' },
          { label: 'Net Payout', val: '$' + totalPayout.toFixed(2), text: 'text-green-400' }
        ].map(st => (
          <div key={st.label} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{st.label}</p>
            <p className={`text-2xl font-black mt-2 ${st.text}`}>{st.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-x-auto">
         <table className="w-full text-left text-sm text-stone-300 whitespace-nowrap">
            <thead className="bg-black/40 text-[10px] uppercase font-bold text-stone-500 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer Paid</th>
                <th className="px-4 py-3">Tax</th>
                <th className="px-4 py-3">MiSlice Fee</th>
                <th className="px-4 py-3">Store Settlement</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Paid Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
               {deliveredOrders.map(order => (
                 <tr key={order.id} className="hover:bg-white/5 transition-colors">
                   <td className="px-4 py-4 text-white font-bold">#{order.id.slice(-6).toUpperCase()}</td>
                   <td className="px-4 py-4">${order.customerFinalTotal?.toFixed(2)}</td>
                   <td className="px-4 py-4">${order.taxAmount?.toFixed(2)}</td>
                   <td className="px-4 py-4 text-red-400">-${order.platformFeeAmount?.toFixed(2)}</td>
                   <td className="px-4 py-4 font-bold text-green-400">${order.storeSettlement?.toFixed(2)}</td>
                   <td className="px-4 py-4">
                     <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${order.payoutStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                       {order.payoutStatus || 'pending'}
                     </span>
                   </td>
                   <td className="px-4 py-4 text-xs font-mono">{order.payoutDate ? new Date(order.payoutDate).toLocaleDateString() : '-'}</td>
                 </tr>
               ))}
               {deliveredOrders.length === 0 && (
                 <tr><td colSpan={7} className="px-4 py-8 text-center text-stone-500 font-bold">No completed orders yet.</td></tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
