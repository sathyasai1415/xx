import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronRight, Refrigerator, CheckCircle, Package, ArrowRight, Store, RotateCcw, ReceiptText } from 'lucide-react';
import { Order, OrderItem, PizzaConfig } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs, updateDoc, doc } from 'firebase/firestore';
import { StoreLogo } from './StoreLogo';
import { STORES } from '../lib/storeData';
import { getPizzaImage } from '../utils/images';

interface OrdersManagerProps {
  userId: string;
  onReorder: (order: Order) => void;
  onNavigate: (v: string) => void;
}

export function OrdersManager({ userId, onReorder, onNavigate }: OrdersManagerProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Order[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(fetched);
    }, (error) => {
      console.error('Error fetching orders:', error);
    });
    return () => unsubscribe();
  }, [userId]);

  const activeStatuses = ['placed', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'];
  const pastStatuses = ['delivered', 'cancelled', 'refunded'];
  
  const activeOrders = orders.filter(o => activeStatuses.includes(o.orderStatus));
  const pastOrders = orders.filter(o => pastStatuses.includes(o.orderStatus) || !activeStatuses.includes(o.orderStatus));

  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <h2 className="text-3xl font-black text-stone-900 mb-8 tracking-tight">My Orders</h2>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'active' ? 'bg-stone-900 text-white shadow-md' : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-200'}`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('past')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'past' ? 'bg-stone-900 text-white shadow-md' : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-200'}`}
        >
          Past Orders ({pastOrders.length})
        </button>
      </div>

      {displayOrders.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2rem] shadow-sm border border-stone-100 flex flex-col items-center">
          <ShoppingBag className="w-12 h-12 text-stone-200 mb-4" />
          <p className="text-stone-500 font-bold mb-4 text-lg">No {activeTab} orders found.</p>
          <button onClick={() => onNavigate('pizza-builder')} className="bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-red-700 transition-colors">Start Order</button>
        </div>
      ) : (
        <div className="space-y-6">
          {displayOrders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onReorder={() => onReorder(order)} 
              onViewReceipt={() => setSelectedReceipt(order)}
              onCancel={async () => {
                if (confirm('Are you sure you want to cancel this order?')) {
                  await updateDoc(doc(db, 'orders', order.id!), { orderStatus: 'cancelled' });
                }
              }}
            />
          ))}
        </div>
      )}

      {selectedReceipt && (
        <ReceiptModal order={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  );
}

function getStoreDetails(storeId: string) {
  const store = STORES.find(s => s.id === storeId);
  return store ? { logoUrl: store.logoUrl, brandColor: store.brandColor } : {};
}

function OrderCard({ order, onReorder, onViewReceipt, onCancel }: { key?: string; order: Order, onReorder: () => void, onViewReceipt: () => void, onCancel: () => void }) {
  const isPast = ['delivered', 'cancelled', 'refunded'].includes(order.orderStatus);
  const canCancel = ['placed', 'pending', 'confirmed'].includes(order.orderStatus);
  const contactSupport = ['preparing', 'ready_for_pickup', 'out_for_delivery'].includes(order.orderStatus);
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-200">
      <div className="flex justify-between items-start mb-6 pb-6 border-b border-stone-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center p-2">
             <StoreLogo 
               storeName={order.storeName}
               logoUrl={getStoreDetails(order.storeId).logoUrl}
               brandColor={getStoreDetails(order.storeId).brandColor || 'blue'}
               className="w-10 h-10"
             />
          </div>
          <div>
            <h3 className="text-xl font-black text-stone-900">{order.storeName}</h3>
            <div className="text-xs font-bold text-stone-400 mt-1 flex items-center gap-2">
              <span className="uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Order #{order.id.slice(-6).toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2 ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {order.orderStatus.replace(/_/g, ' ')}
          </span>
          <p className="text-lg font-black text-stone-900">${order.finalTotal.toFixed(2)}</p>
        </div>
      </div>
      
      {!isPast && (
        <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Order Status</p>
          <div className="flex items-center justify-between text-xs font-black text-stone-500">
             <span className={order.orderStatus !== 'placed' && order.orderStatus !== 'pending' ? 'text-green-600' : ''}>Placed</span>
             <ChevronRight className="w-4 h-4 text-stone-300" />
             <span className={['preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'].includes(order.orderStatus) ? 'text-green-600' : ''}>Preparing</span>
             <ChevronRight className="w-4 h-4 text-stone-300" />
             <span className={['out_for_delivery', 'ready_for_pickup', 'delivered'].includes(order.orderStatus) ? 'text-green-600' : ''}>
               {order.deliveryType === 'pickup' ? 'Ready' : 'Out For Delivery'}
             </span>
             <ChevronRight className="w-4 h-4 text-stone-300" />
             <span className={order.orderStatus === 'delivered' ? 'text-green-600' : ''}>{order.deliveryType === 'pickup' ? 'Completed' : 'Delivered'}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {order.items.map(item => (
          <div key={item.id} className="flex gap-4">
            <div className="w-20 h-20 rounded-2xl bg-stone-100 overflow-hidden shrink-0 shadow-sm border border-stone-200">
              <img src={item.pizzaImage || '/images/pizzas/cheese.jpg'} alt={item.pizzaName} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-stone-900 text-sm">
                {item.quantity}x {item.pizzaName}
              </p>
              <p className="text-xs font-bold text-stone-500 mt-1">{item.size} • {item.crust} • {item.sauce}</p>
              {item.cheese.length > 0 && <p className="text-[10px] text-stone-400 mt-0.5">Cheese: {item.cheese.join(', ')}</p>}
              {item.toppings.length > 0 && <p className="text-[10px] text-stone-400 mt-0.5">Toppings: {item.toppings.join(', ')}</p>}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-stone-500 bg-stone-50 p-4 rounded-xl border border-stone-100">
        <div><span className="font-bold text-stone-700">Delivery By:</span> <span className="capitalize">{order.selectedDeliveryProvider}</span></div>
        <div><span className="font-bold text-stone-700">Estimated Delivery:</span> <span className="text-green-600 font-bold">{order.estimatedDeliveryTime}</span></div>
        <div><span className="font-bold text-stone-700">Delivery Fee:</span> ${order.deliveryFee.toFixed(2)}</div>
        {order.providerServiceFee > 0 && <div><span className="font-bold text-stone-700">Service Fee:</span> ${order.providerServiceFee.toFixed(2)}</div>}
        <div><span className="font-bold text-stone-700">Tax:</span> ${order.tax.toFixed(2)}</div>
        {order.couponCode && <div><span className="font-bold text-stone-700">Coupon Used:</span> {order.couponCode}</div>}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onViewReceipt} className="flex-[1] min-w-[140px] bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
          <ReceiptText className="w-4 h-4" /> View Receipt
        </button>
        <button onClick={onReorder} className="flex-[1] min-w-[140px] bg-stone-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> Reorder
        </button>
        {canCancel && (
          <button onClick={onCancel} className="flex-[1] min-w-[140px] bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            Cancel Order
          </button>
        )}
        {contactSupport && (
           <button onClick={() => alert("Please contact support at 1-800-MISLICE to modify an order in progress.")} className="flex-[1] min-w-[140px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
             Contact Support
           </button>
        )}
      </div>
    </div>
  );
}

function ReceiptModal({ order, onClose }: { order: Order, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-stone-900 tracking-tight">Receipt</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full hover:bg-stone-200 text-stone-500 font-bold">×</button>
        </div>
        
        <div className="space-y-4 text-sm font-medium text-stone-600">
          <div className="flex justify-between border-b border-stone-100 pb-4">
             <span className="font-black text-stone-400 uppercase tracking-widest text-xs">Receipt Number</span>
             <span className="font-mono text-xs">{order.id}</span>
          </div>
          <div className="flex justify-between">
             <span className="font-black text-stone-400 uppercase tracking-widest text-xs">Order Date</span>
             <span className="text-xs">{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          
          <div className="py-4 space-y-4">
            {order.items.map(item => (
               <div key={item.id}>
                 <div className="flex justify-between font-bold text-stone-900 mb-2">
                   <span>{item.quantity}x {item.pizzaName}</span>
                   <span>${item.itemTotal.toFixed(2)}</span>
                 </div>
                 <div className="text-xs text-stone-500 space-y-1 pl-4">
                   <div className="flex justify-between">
                     <span>Base Pizza ({item.size})</span>
                     <span>${item.basePrice.toFixed(2)}</span>
                   </div>
                   {item.toppingsTotal > 0 && (
                     <div className="flex justify-between">
                       <span>Added Toppings</span>
                       <span>${item.toppingsTotal.toFixed(2)}</span>
                     </div>
                   )}
                 </div>
               </div>
            ))}
          </div>

          <div className="border-t border-stone-200 border-dashed pt-4 space-y-2">
             <div className="flex justify-between">
               <span>Subtotal</span>
               <span>${order.subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
               <span>Tax</span>
               <span>${order.tax.toFixed(2)}</span>
             </div>
             {order.platformServiceFee > 0 && (
               <div className="flex justify-between">
                 <span>Platform Fee</span>
                 <span>${order.platformServiceFee.toFixed(2)}</span>
               </div>
             )}
             <div className="flex justify-between">
               <span>{order.selectedDeliveryProvider} Fee</span>
               <span>${order.deliveryFee.toFixed(2)}</span>
             </div>
             {order.providerServiceFee > 0 && (
               <div className="flex justify-between">
                 <span>Delivery Service Fee</span>
                 <span>${order.providerServiceFee.toFixed(2)}</span>
               </div>
             )}
             {order.couponDiscount > 0 && (
               <div className="flex justify-between text-green-600 font-bold">
                 <span>Discount ({order.couponCode})</span>
                 <span>-${order.couponDiscount.toFixed(2)}</span>
               </div>
             )}
          </div>
          
          <div className="border-t border-stone-900 pt-4 mt-4 flex justify-between items-center text-lg font-black text-stone-900">
            <span>Total Paid</span>
            <span>${order.finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
