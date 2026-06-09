import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, PizzaConfig, CartItem } from '../types';
import { ChevronDown, Star, Heart, MessageSquareText, Send, ShoppingCart, CreditCard, Minus, Plus } from 'lucide-react';

interface ComparisonCardsProps {
  quotes: Quote[];
  favoriteStores: string[];
  onToggleFavoriteStore: (chainId: string) => void;
  onAddReview: (chainId: string, rating: number, text: string) => void;
  onAddToCart: (item: Omit<CartItem, 'id'>, redirect: boolean) => void;
  currentConfig: PizzaConfig | null;
}

export function ComparisonCards({ quotes, favoriteStores, onToggleFavoriteStore, onAddReview, onAddToCart, currentConfig }: ComparisonCardsProps) {
  if (quotes.length === 0 || !currentConfig) return null;

  const cheapestId = quotes[0].chainId;

  return (
    <div className="w-full max-w-4xl mx-auto z-10 relative mt-12 mb-24 grid sm:grid-cols-2 gap-6">
      <AnimatePresence>
        {quotes.map((quote, idx) => (
          <QuoteCard 
             key={quote.chainId} 
             quote={quote} 
             isCheapest={quote.chainId === cheapestId} 
             delay={idx * 0.1} 
             isFavorite={favoriteStores.includes(quote.chainId)} 
             onToggleFavorite={() => onToggleFavoriteStore(quote.chainId)} 
             onAddReview={onAddReview} 
             onAddToCart={onAddToCart}
             currentConfig={currentConfig}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function QuoteCard({ quote, isCheapest, delay, isFavorite, onToggleFavorite, onAddReview, onAddToCart, currentConfig }: { key?: string, quote: Quote, isCheapest: boolean, delay: number, isFavorite: boolean, onToggleFavorite: () => void, onAddReview: (chainId: string, rating: number, text: string) => void, onAddToCart: (item: Omit<CartItem, 'id'>, redirect: boolean) => void, currentConfig: PizzaConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [localQty, setLocalQty] = useState(currentConfig.quantity || 1);

  const avgRating = quote.rating.toFixed(1);

  const handleAddToCart = (redirect: boolean) => {
    onAddToCart({
      store_id: quote.chainId,
      store_name: quote.chainName,
      item_name: `Custom ${currentConfig.size} Pizza`,
      config: { ...currentConfig, quantity: localQty },
      quantity: localQty,
      price_per_item: quote.breakdown.grandTotal / (currentConfig.quantity || 1), // Assuming quote handles full qty, we extract per-item
      total_price: quote.breakdown.grandTotal * (localQty / (currentConfig.quantity || 1)),
      delivery_type: quote.deliveryType,
    }, redirect);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay, type: "spring", stiffness: 100, damping: 20 }}
      className={`bg-white rounded-3xl p-6 shadow-lg shadow-stone-200/40 border border-transparent relative flex flex-col group hover:border-red-200 transition-all ${isCheapest ? 'border-red-200' : ''}`}
    >
      {/* Header */}
      {isCheapest && (
        <div className="absolute top-0 right-0 p-3">
          <span className="bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg">BEST VALUE</span>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-100 flex-shrink-0 overflow-hidden shadow-sm">
             <img src={`/images/stores/${quote.chainId === 'local' ? 'local' : quote.chainId}-placeholder.svg`} alt={quote.chainName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src='/images/stores/local-placeholder.svg'; }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h2 className="text-lg font-bold text-stone-900">{quote.chainName}</h2>
               <button onClick={onToggleFavorite} className="text-stone-300 hover:text-red-500 transition-colors" title="Favorite Store">
                 <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
               </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
               <button onClick={() => setShowReviews(true)} className="flex items-center gap-1 group/rating">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-stone-600 group-hover/rating:text-stone-900">{avgRating}</span>
                  <span className="text-[10px] text-stone-400">({quote.reviews.length})</span>
               </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
               {quote.badges.map(b => (
                 <span key={b} className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${b === 'Best Value' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'}`}>
                   {b}
                 </span>
               ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-stone-900">
            ${quote.breakdown.grandTotal.toFixed(2)}
          </p>
          <p className="text-[10px] font-bold text-stone-400 uppercase mt-1">
            {quote.estimatedTimeMin} - {quote.estimatedTimeMax} MIN
          </p>
        </div>
      </div>
      
      <div className="space-y-4 mt-auto">
        <div className="text-sm font-medium text-stone-700">
          {quote.deliveryStatus === 'Store Delivery Available' && (
            <p className="text-green-700 text-xs py-1 px-2 bg-green-50 rounded-lg inline-block font-bold">✓ Direct Store Delivery Available</p>
          )}
          {quote.deliveryStatus === 'Pickup Only' && (
             <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
               <p className="text-stone-700 font-bold mb-1 text-xs uppercase tracking-wider">Pickup Only ({quote.distance})</p>
               <p className="text-stone-500 text-xs">This store does not offer direct delivery or third party apps.</p>
             </div>
          )}
          {quote.deliveryStatus === 'Third-Party Delivery Available' && (
            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
               <p className="text-blue-800 font-bold mb-1 text-xs uppercase tracking-wider">Third-Party Delivery</p>
               <p className="text-blue-600/80 text-[11px] leading-snug">This store does not deliver directly, but it may be available through DoorDash or Uber Eats. Prices and fees may vary.</p>
               <div className="grid grid-cols-2 gap-2 mt-3">
                 {quote.thirdPartyPrices?.doordash && typeof quote.thirdPartyPrices.doordash === 'number' ? (
                   <div className="bg-white px-2 py-1.5 rounded-lg shadow-sm border border-stone-100 text-[10px] font-bold text-stone-600">DoorDash: ~${quote.thirdPartyPrices.doordash.toFixed(2)}</div>
                 ) : quote.badges.includes('DoorDash Available') ? (
                   <div className="bg-white px-2 py-1.5 rounded-lg shadow-sm border border-stone-100 text-[10px] font-bold text-stone-600">DoorDash: Price varies by platform</div>
                 ) : null}
                 {quote.thirdPartyPrices?.ubereats && typeof quote.thirdPartyPrices.ubereats === 'number' ? (
                   <div className="bg-white px-2 py-1.5 rounded-lg shadow-sm border border-stone-100 text-[10px] font-bold text-stone-600">UberEats: ~${quote.thirdPartyPrices.ubereats.toFixed(2)}</div>
                 ) : quote.badges.includes('Uber Eats Available') ? (
                   <div className="bg-white px-2 py-1.5 rounded-lg shadow-sm border border-stone-100 text-[10px] font-bold text-stone-600">UberEats: Price varies by platform</div>
                 ) : null}
               </div>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center text-stone-800 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-3 bg-stone-100 rounded-xl p-1">
            <button onClick={() => setLocalQty(Math.max(1, localQty - 1))} className="p-1 rounded-lg hover:bg-white text-stone-600 shadow-sm transition-colors"><Minus className="w-3.5 h-3.5" /></button>
            <span className="font-bold text-xs w-4 text-center">{localQty}</span>
            <button onClick={() => setLocalQty(localQty + 1)} className="p-1 rounded-lg hover:bg-white text-stone-600 shadow-sm transition-colors"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider mb-0.5">Est. Grand Total</span>
            <span className="text-lg font-black">${((quote.breakdown.grandTotal / (currentConfig.quantity || 1)) * localQty).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-colors ${isOpen ? 'bg-stone-200 text-stone-900 border border-transparent' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}
        >
          {isOpen ? 'Close' : 'Breakdown'}
        </button>
        <button onClick={() => handleAddToCart(false)} className="flex-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-1">
          <ShoppingCart className="w-3.5 h-3.5" /> Add
        </button>
        <button onClick={() => handleAddToCart(true)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-md shadow-red-200">
          Buy Now
        </button>
      </div>

      {/* Expandable Breakdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4"
          >
            <div className="pt-4 border-t border-stone-100 space-y-3 text-xs font-medium bg-stone-50 p-3 rounded-2xl mt-2">
              <div className="flex justify-between text-stone-500">
                <span>Base Pizza</span>
                <span>${quote.basePrice.toFixed(2)}</span>
              </div>
              {quote.toppingsCost > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Extra Cost for Toppings</span>
                  <span>${quote.toppingsCost.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-stone-200/60 my-1" />
              
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span>${quote.breakdown.subtotal.toFixed(2)}</span>
              </div>
              
              {quote.breakdown.deliveryFee > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Store Delivery Fee</span>
                  <span>${quote.breakdown.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              
              {quote.breakdown.serviceFee > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Platform Service Fee</span>
                  <span>${quote.breakdown.serviceFee.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-500">
                <span>Tax</span>
                <span>${quote.breakdown.tax.toFixed(2)}</span>
              </div>

              {quote.breakdown.tip > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Courier Tip (15%)</span>
                  <span>${quote.breakdown.tip.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-end">
               <button onClick={() => setShowReviews(true)} className="flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-stone-800 uppercase tracking-widest px-2 py-1">
                 <MessageSquareText className="w-3 h-3" /> View Reviews
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Reviews Modal */}
      <AnimatePresence>
        {showReviews && <ReviewModal quote={quote} onClose={() => setShowReviews(false)} onAddReview={onAddReview} />}
      </AnimatePresence>
    </motion.div>
  );
}

function ReviewModal({ quote, onClose, onAddReview }: { quote: Quote, onClose: () => void, onAddReview: (id: string, r: number, t: string) => void }) {
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddReview(quote.chainId, newRating, newText);
    setNewText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-stone-900">{quote.chainName} Reviews</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full hover:bg-stone-200 text-stone-500 font-bold">×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4">
          {quote.reviews.length === 0 ? <p className="text-sm text-stone-500">No reviews yet.</p> : quote.reviews.map(r => (
            <div key={r.id} className="bg-stone-50 rounded-2xl p-4">
              <div className="flex justify-between mb-2">
                 <span className="text-xs font-bold text-stone-900">{r.user}</span>
                 <div className="flex">
                   {Array.from({length: 5}).map((_, i) => (
                     <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300'}`} />
                   ))}
                 </div>
              </div>
              <p className="text-sm text-stone-600">{r.text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="border-t border-stone-200 pt-4 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400">Leave a Review</h4>
          <div className="flex gap-1">
             {Array.from({length: 5}).map((_, i) => (
               <button key={i} type="button" onClick={() => setNewRating(i + 1)}>
                  <Star className={`w-6 h-6 hover:scale-110 transition-transform ${i < newRating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-200'}`} />
               </button>
             ))}
          </div>
          <div className="flex gap-2">
             <input type="text" placeholder="Write a short review..." value={newText} onChange={e => setNewText(e.target.value)} className="flex-1 bg-stone-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-stone-200 focus:outline-none" />
             <button type="submit" disabled={!newText.trim()} className="bg-stone-900 text-white p-2 px-4 rounded-xl font-bold disabled:bg-stone-300 flex items-center justify-center">
               <Send className="w-4 h-4" />
             </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
