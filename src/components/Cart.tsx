import React from 'react';
import { CartItem, PizzaConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ShoppingBag, Plus, Minus, CreditCard, ShoppingCart, Edit2 } from 'lucide-react';
import { StoreLogo } from './StoreLogo';
import { STORES } from '../lib/storeData';
import { getPizzaImage } from '../utils/images';

import { getNonFunctionalProps, SHOW_NON_FUNCTIONAL_MARKERS } from '../utils/debug';

function getStoreDetails(storeId: string, storeName: string) {
  const store = STORES.find(s => s.id === storeId || s.name === storeName);
  return store ? { logoUrl: store.logoUrl, brandColor: store.brandColor } : {};
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
  onEditItem?: (item: CartItem) => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, onContinueShopping, onEditItem }: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.subtotal : (item.price_per_item * item.quantity)), 0);
  const deliveryFee = items.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.deliveryFee * item.quantity : 0), 0);
  const providerServiceFee = items.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.serviceFee * item.quantity : 0), 0);
  const platformServiceFee = items.length > 0 ? 1.99 : 0;
  const tax = items.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.tax * item.quantity : ((item.price_per_item * item.quantity) * 0.0825)), 0);
  const discountTotal = items.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.discount * item.quantity : 0), 0);
  const tipTotal = items.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.tip * item.quantity : 0), 0);

  const total = subtotal + deliveryFee + providerServiceFee + platformServiceFee + tax + tipTotal - discountTotal;

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
               {/* Cart Item Thumbnail */}
               <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-stone-100 flex-shrink-0 overflow-hidden relative shadow-sm border border-stone-200/50">
                 <img src={getPizzaImage(item.config || undefined)} alt={item.item_name} className="w-full h-full object-cover" />
                 <div className="absolute top-1 left-1 z-10">
                   <StoreLogo 
                     storeName={item.store_name}
                     logoUrl={getStoreDetails(item.store_id || '', item.store_name).logoUrl}
                     brandColor={getStoreDetails(item.store_id || '', item.store_name).brandColor || 
                       (item.store_id === 'dominos' ? 'blue' : item.store_id === 'pizza-hut' ? 'red' : item.store_id === 'papa-johns' ? 'green' : 'red')
                     }
                     className="w-6 h-6 border-stone-700"
                   />
                 </div>
               </div>

               <div className="flex-1">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">{item.store_name}</p>
                     <h3 className="font-bold text-lg text-stone-900">{item.item_name}</h3>
                   </div>
                   <p className="font-black text-stone-900 text-lg">${(item.deliveryOption ? item.deliveryOption.priceBreakdown.subtotal : item.price_per_item * item.quantity).toFixed(2)}</p>
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
                     <span className="capitalize">{(item.delivery_type || '').replace('-', ' ')}</span>
                    </div>
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
            <h3 className="text-xl font-black mb-6">Order Summary</h3>
            <div className="space-y-3 text-sm font-medium text-stone-400">
              <div className="flex justify-between">
                <span>Pizza Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-800 pt-3">
                <span>Tax</span>
                <span className="text-white">${tax.toFixed(2)}</span>
              </div>
              {platformServiceFee > 0 && (
                <div className="flex justify-between border-t border-stone-800 pt-3">
                  <span>Platform Service Fee</span>
                  <span className="text-white">${platformServiceFee.toFixed(2)}</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="flex justify-between border-t border-stone-800 pt-3">
                  <span>Delivery Provider Fee</span>
                  <span className="text-white">${deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {providerServiceFee > 0 && (
                <div className="flex justify-between border-t border-stone-800 pt-3">
                  <span>Delivery Service Fee</span>
                  <span className="text-white">${providerServiceFee.toFixed(2)}</span>
                </div>
              )}
              {tipTotal > 0 && (
                <div className="flex justify-between border-t border-stone-800 pt-3">
                  <span>Courier Tip</span>
                  <span className="text-white">${tipTotal.toFixed(2)}</span>
                </div>
              )}
              {discountTotal > 0 && (
                <div className="flex justify-between border-t border-stone-800 pt-3 text-green-400">
                  <span>Coupon Discount</span>
                  <span>-${discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-800 pt-4 mt-2">
                <span className="text-lg font-black text-white">Final Total</span>
                <span className="text-lg font-black text-green-400">${total.toFixed(2)}</span>
              </div>
            </div>
            
            <p className="text-[10px] text-stone-500 mt-4 leading-tight italic">
              Final delivery fees and taxes are calculated based on your address and selected provider.
            </p>

            <button 
              onClick={onCheckout} 
              className="w-full font-bold py-3.5 rounded-xl mt-6 shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white transition-all transform hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-400/50"
            >
              <CreditCard className="w-5 h-5" /> Pay ${total.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
