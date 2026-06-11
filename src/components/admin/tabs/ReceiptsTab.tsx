import React, { useState } from 'react';

export function ReceiptsTab({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white">Order Receipts</h2>
      
      {!selectedOrder ? (
         <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <table className="w-full text-left text-sm text-stone-300">
               <thead className="bg-black/40 text-[10px] uppercase font-bold text-stone-500 border-b border-white/10">
                 <tr>
                   <th className="px-6 py-4">Order ID</th>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Customer</th>
                   <th className="px-6 py-4">Total</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/10">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4">{order.customerName || 'Guest'}</td>
                      <td className="px-6 py-4 font-bold text-green-400">${order.customerFinalTotal?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold bg-white/10 text-stone-300">
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <button 
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                         >
                            View Receipt
                         </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-stone-500 font-bold">No orders found.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      ) : (
         <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto">
            <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-white text-xs font-bold mb-6 block">← Back to Receipts</button>
            
            <div className="text-center border-b border-white/10 pb-6 mb-6">
              <h3 className="text-2xl font-black text-white">MiSlice Receipt</h3>
              <p className="text-stone-400 mt-1">Order #{selectedOrder.id.slice(-6).toUpperCase()}</p>
              <p className="text-xs text-stone-500 uppercase mt-2">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
            </div>

            <div className="space-y-4 mb-6">
               <div className="flex justify-between text-xs text-stone-300">
                 <span>Customer Name:</span>
                 <span className="font-bold text-white">{selectedOrder.customerName || 'Guest'}</span>
               </div>
               <div className="flex justify-between text-xs text-stone-300">
                 <span>Delivery Method:</span>
                 <span className="font-bold text-white capitalize">{selectedOrder.deliveryType}</span>
               </div>
               <div className="flex justify-between text-xs text-stone-300">
                 <span>Payment Status:</span>
                 <span className="font-bold text-green-400 uppercase">Paid</span>
               </div>
            </div>

            <div className="border-t border-b border-white/10 py-6 mb-6 space-y-4">
               <h4 className="text-sm font-bold text-stone-500 uppercase">Items</h4>
               {selectedOrder.items?.map((item: any, i: number) => (
                 <div key={i} className="flex justify-between text-sm text-white">
                   <div>
                      <p className="font-bold">{item.quantity}x {item.pizzaName}</p>
                      <ul className="text-xs text-stone-400 mt-1 space-y-0.5 list-disc pl-4">
                        {item.size && <li>Size: {item.size}</li>}
                        {item.crust && <li>Crust: {item.crust}</li>}
                        {item.sauce && <li>Sauce: {item.sauce}</li>}
                        {item.cheese && <li>Cheese: {item.cheese}</li>}
                        {item.toppings?.length > 0 && <li>Toppings: {item.toppings.join(', ')}</li>}
                      </ul>
                   </div>
                   <span className="font-bold">${item.itemTotal?.toFixed(2)}</span>
                 </div>
               ))}
            </div>

            <div className="space-y-3 text-sm">
               <div className="flex justify-between text-stone-300">
                 <span>Item Subtotal</span>
                 <span>${selectedOrder.itemSubtotal?.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-stone-300">
                 <span>Tax</span>
                 <span>${selectedOrder.taxAmount?.toFixed(2)}</span>
               </div>
               {selectedOrder.deliveryType !== 'pickup' && (
                 <div className="flex justify-between text-stone-300">
                   <span>Delivery Fee ({selectedOrder.deliveryProvider})</span>
                   <span>${selectedOrder.deliveryFee?.toFixed(2)}</span>
                 </div>
               )}
               <div className="flex justify-between text-stone-300">
                 <span>Service Fee</span>
                 <span>${selectedOrder.serviceFee?.toFixed(2)}</span>
               </div>
               {selectedOrder.couponDiscount > 0 && (
                 <div className="flex justify-between text-green-400 font-bold">
                   <span>Coupon Applied</span>
                   <span>-${selectedOrder.couponDiscount?.toFixed(2)}</span>
                 </div>
               )}
               <div className="flex justify-between text-lg font-black text-white pt-4 border-t border-white/10 mt-4">
                 <span>Customer Paid Total</span>
                 <span>${selectedOrder.customerFinalTotal?.toFixed(2)}</span>
               </div>
            </div>

            <div className="mt-8 bg-black/40 border border-white/10 p-4 rounded-xl">
               <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Restaurant Settlement</h4>
               <div className="space-y-2 text-xs">
                 <div className="flex justify-between text-stone-300">
                   <span>MiSlice Platform Fee (20% of Food)</span>
                   <span className="text-red-400">-${selectedOrder.platformFeeAmount?.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10 mt-2">
                   <span>Final Restaurant Payout</span>
                   <span className="text-green-400">${selectedOrder.storeSettlement?.toFixed(2)}</span>
                 </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
