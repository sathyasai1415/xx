import React, { useState } from 'react';
import { CartItem } from '../types';
import { CreditCard, MapPin, Loader2, Info } from 'lucide-react';

interface CheckoutProps {
  cart: CartItem[];
  totalToCharge: number;
  onCancel: () => void;
  onConfirmOrder: (address: string, notes: string) => Promise<void>;
}

export function Checkout({ cart, totalToCharge, onCancel, onConfirmOrder }: CheckoutProps) {
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isDelivery = cart.some(item => ['store-delivery', 'third-party', 'doordash-drive', 'uber-direct'].includes(item.delivery_type));

  const handlePay = async () => {
    if (isDelivery && !address.trim()) {
      alert("Please enter a delivery address.");
      return;
    }
    setIsProcessing(true);
    try {
      // Simulate demo payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      await onConfirmOrder(address, notes);
    } catch (e) {
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <h2 className="text-3xl font-black text-white mb-8 tracking-tight drop-shadow-md">Checkout</h2>
      
      <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_15px_30px_rgba(0,0,0,0.5)] border border-white/10 mb-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="bg-blue-950/40 border border-blue-500/30 text-blue-300 p-4 rounded-xl mb-8 flex gap-3 text-sm font-medium relative z-10 shadow-inner">
           <Info className="w-5 h-5 flex-shrink-0 text-blue-400" />
           <p>This is a safe demo mode. No real charges will be made. Your order will be marked as paid via demo flow.</p>
        </div>
        
        {isDelivery && (
          <div className="mb-8 relative z-10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 drop-shadow-sm">
              <MapPin className="w-5 h-5 text-orange-500" /> Delivery Address
            </h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Street Address, Apt/Unit" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-medium text-white placeholder-stone-500 outline-none focus:border-orange-500/50 focus:bg-white/10 transition-colors shadow-inner"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Delivery Instructions (e.g. Leave at door)" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-medium text-white placeholder-stone-500 outline-none focus:border-orange-500/50 focus:bg-white/10 transition-colors shadow-inner"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="mb-8 relative z-10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 drop-shadow-sm">
             <CreditCard className="w-5 h-5 text-red-500" /> Payment Method
          </h3>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 font-medium flex items-center justify-between text-white shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-6 bg-black/40 border border-white/20 rounded flex items-center justify-center text-[10px] font-black uppercase text-stone-400 shadow-sm">Card</div>
              <span>Demo Card (**** 4242)</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 mt-6 relative z-10">
           <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold text-stone-300">Total to Pay</span>
              <span className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">${totalToCharge.toFixed(2)}</span>
           </div>
           
           <div className="flex gap-4">
             <button disabled={isProcessing} onClick={onCancel} className="flex-[0.5] py-4 rounded-xl font-bold bg-white/5 text-stone-300 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-colors shadow-sm">
                Cancel
             </button>
             <button disabled={isProcessing} onClick={handlePay} className="flex-1 py-4 rounded-xl font-black bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-400 hover:to-red-500 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,50,0,0.4)] hover:shadow-[0_0_30px_rgba(255,50,0,0.6)] hover:scale-[1.02]">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay $${totalToCharge.toFixed(2)}`}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
