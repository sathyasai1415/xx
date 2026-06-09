import React from 'react';
import { CartItem, PizzaConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ShoppingBag, Plus, Minus, CreditCard, ShoppingCart, Edit2 } from 'lucide-react';

import { getNonFunctionalProps, SHOW_NON_FUNCTIONAL_MARKERS } from '../utils/debug';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
  onEditItem?: (item: CartItem) => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, onContinueShopping, onEditItem }: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.price_per_item * item.quantity), 0);
  const deliveryFee = items.reduce((sum, item) => sum + (item.delivery_type === 'pickup' ? 0 : 4.99), 0); // Simplified mock
  const serviceFee = items.length > 0 ? 3.50 : 0;
  const tax = subtotal * 0.0825;
  const total = subtotal + deliveryFee + serviceFee + tax;

  if (items.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-16 text-center">
         <ShoppingCart className="w-16 h-16 text-stone-200 mx-auto mb-4" />
         <h2 className="text-2xl font-black text-stone-900 mb-2">Your cart is empty</h2>
         <p className="text-stone-500 mb-6">Looks like you haven't added any pizzas or deals yet.</p>
         <button onClick={onContinueShopping} className="bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-red-700 transition-colors">
           Start Ordering
         </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <h2 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3 mb-8">
        <ShoppingBag className="w-8 h-8 text-red-500" />
        Shopping Cart
      </h2>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           {items.map(item => (
             <motion.div key={item.id} layout className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200 flex flex-col sm:flex-row gap-4">
               <div className="flex-1">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">{item.store_name}</p>
                     <h3 className="font-bold text-lg text-stone-900">{item.item_name}</h3>
                   </div>
                   <p className="font-black text-stone-900 text-lg">${(item.price_per_item * item.quantity).toFixed(2)}</p>
                 </div>
                 
                 {item.config && (
                   <p className="text-xs font-bold text-stone-500 mt-1">
                     {item.config.size} • {item.config.crust}
                   </p>
                 )}
                 {item.config?.meats && (
                   <div className="flex flex-wrap gap-1 mt-2">
                     {[...item.config.meats, ...item.config.veggies].map(t => (
                       <span key={t} className="text-[9px] font-bold uppercase tracking-widest bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">{t}</span>
                     ))}
                   </div>
                 )}

                 <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex flex-col gap-1">
                   <div className="text-xs font-bold text-stone-900 flex justify-between">
                     <span>Fulfillment:</span>
                     <span className="capitalize">{item.delivery_type.replace('-', ' ')}</span>
                   </div>
                   {item.delivery_type !== 'store-delivery' && item.delivery_type !== 'pickup' && (
                     <div className="text-[10px] text-stone-500 font-medium">
                       This store does not offer direct delivery. Third-party delivery may be available through DoorDash, Uber Eats, or Grubhub.
                     </div>
                   )}
                 </div>
               </div>
                               <div className="flex sm:flex-col items-center justify-between border-t sm:border-t-0 sm:border-l border-stone-100 pt-4 sm:pt-0 sm:pl-4">
                 <div className="flex items-center gap-3 bg-stone-100 rounded-xl p-1">
                   <button onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-1 rounded-lg hover:bg-white text-stone-600 shadow-sm transition-colors"><Minus className="w-4 h-4" /></button>
                   <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                   <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-lg hover:bg-white text-stone-600 shadow-sm transition-colors"><Plus className="w-4 h-4" /></button>
                 </div>
                 
                 <div className="flex gap-2">
                   {item.config && onEditItem && (
                     <button onClick={() => onEditItem(item)} className="text-stone-400 hover:text-stone-600 p-2 transition-colors" title="Edit Item">
                       <Edit2 className="w-5 h-5" />
                     </button>
                   )}
                   <button onClick={() => onRemoveItem(item.id)} className="text-stone-400 hover:text-red-500 p-2 transition-colors" title="Remove Item">
                     <Trash2 className="w-5 h-5" />
                   </button>
                 </div>
               </div>
             </motion.div>
           ))}
        </div>

        <div>
          <div className="bg-stone-900 rounded-3xl p-6 text-white sticky top-6 shadow-xl shadow-stone-300">
            <h3 className="text-xl font-black mb-6">Payment Summary</h3>
            <div className="space-y-3 text-sm font-medium text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-800 pt-3">
                <span>Estimated Delivery Fee</span>
                <span className="text-white">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-800 pt-3">
                <span>Service Fee</span>
                <span className="text-white">${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-800 pt-3">
                <span>Estimated Tax</span>
                <span className="text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-800 pt-4 mt-2">
                <span className="text-lg font-black text-white">Final Total</span>
                <span className="text-lg font-black text-green-400">${total.toFixed(2)}</span>
              </div>
            </div>
            
            <p className="text-[10px] text-stone-500 mt-4 leading-tight italic">
              Final delivery fees and taxes may vary by platform.
            </p>

            <button 
              onClick={onCheckout} 
              className={`w-full font-bold py-3.5 rounded-xl mt-6 transition-colors shadow-lg flex items-center justify-center gap-2 ${SHOW_NON_FUNCTIONAL_MARKERS ? '' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              {...getNonFunctionalProps('Checkout Payment')}
            >
              <CreditCard className="w-5 h-5" /> Continue to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
