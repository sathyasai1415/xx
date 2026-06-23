import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, PizzaConfig, CartItem, DeliveryProviderOption, Coupon } from '../types';
import { ChevronDown, Star, Heart, MessageSquareText, ShoppingCart, Send, Car, CheckCircle2, Ticket, ArrowRight, Table2 } from 'lucide-react';
import { StoreLogo } from './StoreLogo';
import { STORES } from '../lib/storeData';
import { MARKETPLACE_STORES } from '../data/marketplace';

function getStoreWebsite(chainId: string, chainName: string): string | undefined {
  const ms = MARKETPLACE_STORES.find(s => s.id === chainId || s.name === chainName);
  return ms?.website;
}

function getStoreDetails(chainId: string, chainName: string) {
  const store = STORES.find(s => s.id === chainId || s.name === chainName);
  return store ? { logoUrl: store.logoUrl, brandColor: store.brandColor } : {};
}

function getPizzaImage(config: PizzaConfig | null): string {
  if (!config) return '/images/pizzas/cheese.jpg';
  const hasBuffalo = config.sauce === 'Buffalo Sauce';
  const hasBBQ = config.sauce === 'BBQ Sauce';
  const hasChicken = config.meats.includes('Grilled Chicken');
  const hasPepperoni = config.meats.includes('Pepperoni');
  const hasPineapple = config.veggies.includes('Pineapple');
  const hasLotOfMeat = config.meats.length >= 3;
  const hasLotOfVeggies = config.veggies.length >= 3;

  if (hasBuffalo && hasChicken) return '/images/pizzas/buffalo-chicken.jpg';
  if (hasBBQ && hasChicken) return '/images/pizzas/bbq-chicken.jpg';
  if (hasLotOfMeat) return '/images/pizzas/meat-lovers.jpg';
  if (hasPineapple && config.meats.some(m => m.includes('Ham') || m.includes('Bacon'))) return '/images/pizzas/hawaiian.jpg';
  if (hasPepperoni) return '/images/pizzas/pepperoni.jpg';
  if (hasLotOfVeggies && config.meats.length === 0) return '/images/pizzas/veggie.jpg';
  return '/images/pizzas/cheese.jpg';
}

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

  return (
    <div className="w-full max-w-4xl mx-auto z-10 relative mt-12 mb-24 grid sm:grid-cols-2 gap-6">
      <AnimatePresence>
        {quotes.map((quote, idx) => (
          <QuoteCard 
             key={quote.chainId} 
             quote={quote} 
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

function QuoteCard({ quote, delay, isFavorite, onToggleFavorite, onAddReview, onAddToCart, currentConfig }: { key?: string, quote: Quote, delay: number, isFavorite: boolean, onToggleFavorite: () => void, onAddReview: (chainId: string, rating: number, text: string) => void, onAddToCart: (item: Omit<CartItem, 'id'>, redirect: boolean) => void, currentConfig: PizzaConfig }) {
  const [showReviews, setShowReviews] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [localQty, setLocalQty] = useState(currentConfig.quantity || 1);
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  
  // Track applied coupons: optionId -> couponCode
  const [appliedCoupons, setAppliedCoupons] = useState<Record<string, Coupon>>({});

  const avgRating = quote.rating.toFixed(1);
  const qty = localQty;

  const calculateOptionTotal = (opt: DeliveryProviderOption) => {
     let cost = opt.priceBreakdown.grandTotal;
     cost = (cost / (currentConfig.quantity || 1)) * qty;
     
     const coupon = appliedCoupons[opt.providerId];
     if (coupon) {
        if (coupon.discountType === 'percentage') {
           cost = cost * (1 - (coupon.discountValue / 100));
        } else if (coupon.discountType === 'fixed') {
           cost = Math.max(0, cost - coupon.discountValue);
        } else if (coupon.discountType === 'free_delivery') {
           cost = Math.max(0, cost - (opt.priceBreakdown.deliveryFee * qty));
        }
     }
     return cost;
  };

  const sortedOptions = [...quote.deliveryOptions].sort((a, b) => calculateOptionTotal(a) - calculateOptionTotal(b));
  
  const [selectedOptionId, setSelectedOptionId] = useState<string>(sortedOptions[0]?.providerId || '');

  // Primary option is the actively selected one
  const primaryOption = sortedOptions.find(o => o.providerId === selectedOptionId) || sortedOptions[0];

  const handleAddToCart = (redirect: boolean) => {
    if (!primaryOption) return;
    
    // Copy primaryOption and apply discounts if needed
    const customizedOption = { ...primaryOption };
    const appliedC = appliedCoupons[primaryOption.providerId];
    if (appliedC) {
      customizedOption.appliedCoupon = appliedC;
      customizedOption.priceBreakdown = {
        ...customizedOption.priceBreakdown,
        grandTotal: calculateOptionTotal(primaryOption) / qty, // unit total
      };
    }
    
    onAddToCart({
      store_id: quote.chainId,
      store_name: quote.chainName,
      item_name: `Custom ${currentConfig.size} Pizza`,
      config: { ...currentConfig, quantity: qty },
      quantity: qty,
      price_per_item: (quote.basePrice + quote.toppingsCost) / (currentConfig.quantity || 1),
      total_price: calculateOptionTotal(primaryOption),
      delivery_type: primaryOption.providerId as any,
      platform: primaryOption.providerId,
      deliveryOption: customizedOption,
    }, redirect);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
      transition={{ delay, type: "spring", stiffness: 100, damping: 20 }}
      className={`bg-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] border relative flex flex-col transition-all overflow-hidden cursor-default group/card ${quote.bestValueOptionId ? 'border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.3)]' : 'border-white/10 hover:border-white/30'}`}
    >
      {/* Dynamic Cursor Glow */}
      <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_var(--mouse-x,_50%)_var(--mouse-y,_50%),_rgba(255,150,50,0.15)_0%,_transparent_60%)] z-0" />
      
      {/* Content wrapper for z-index */}
      <div className="relative z-10 w-full h-full flex flex-col">
      {/* Header */}
      {quote.bestValueOptionId && (
        <div className="absolute top-0 right-0 p-3">
          <span className="bg-gradient-to-r from-green-400 to-green-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(74,222,128,0.5)] border border-green-300/50 flex items-center justify-center">💎 BEST OVERALL VALUE</span>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <StoreLogo 
            storeName={quote.chainName}
            logoUrl={getStoreDetails(quote.chainId, quote.chainName).logoUrl}
            brandColor={getStoreDetails(quote.chainId, quote.chainName).brandColor || quote.logoColor || 'bg-stone-500'}
            className="w-14 h-14 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/20"
          />
          <div>
            <div className="flex items-center gap-2">
               <h2 className="text-xl font-black text-white tracking-tight drop-shadow-md">{quote.chainName}</h2>
               <button onClick={onToggleFavorite} className="text-stone-400 hover:text-red-400 transition-colors" title="Favorite Store">
                 <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`} />
               </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               <button onClick={() => setShowReviews(true)} className="flex items-center gap-1 group/rating cursor-pointer">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                  <span className="text-sm font-bold text-stone-300 group-hover/rating:text-white transition-colors">{avgRating}</span>
                  <span className="text-xs text-stone-500 font-medium">({quote.reviews.length})</span>
               </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pizza Image Preview */}
      <div className="pizza-card-media rounded-2xl mb-5 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] border border-white/10 bg-black/40 relative overflow-hidden group/image">
        <img 
          src={getPizzaImage(currentConfig)} 
          alt="Custom Pizza Preview" 
          className="w-full h-40 object-cover scale-105 group-hover/image:scale-100 transition-transform duration-700 opacity-80 group-hover/image:opacity-100" 
          onError={(e) => { e.currentTarget.src='/images/pizzas/cheese.jpg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
        <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-end">
          <div>
            <span className="text-white text-[11px] font-black tracking-widest uppercase drop-shadow-md bg-white/10 px-2 py-1 rounded-md backdrop-blur-md border border-white/20">
              {currentConfig.size} Pizza
            </span>
          </div>
          <div className="text-right">
             <span className="text-stone-300 text-[10px] font-bold block opacity-80 mb-1">Base + Toppings</span>
             <span className="text-white font-black text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">${((quote.basePrice + quote.toppingsCost) * qty / (currentConfig.quantity || 1)).toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Delivery Options */}
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-center mb-2 mt-4 ml-1 pr-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Delivery Options</h3>
          <button onClick={() => setShowTableModal(true)} className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 hover:text-white uppercase tracking-widest transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded">
            <Table2 className="w-3 h-3" /> Compare View
          </button>
        </div>
        
         {sortedOptions.length === 0 ? (
           <p className="text-sm text-stone-400 font-medium bg-white/5 p-3 rounded-xl border border-white/10">No delivery options available.</p>
        ) : sortedOptions.map((opt) => {
           const isExpanded = expandedOptionId === opt.providerId;
           const isPrimary = primaryOption?.providerId === opt.providerId;
           const isDoordash = opt.providerId === 'doordash';
           const isUber = opt.providerId === 'ubereats';
           const isGrubhub = opt.providerId === 'grubhub';
           const bgClass = isPrimary ? (isUber ? 'bg-green-950/40 border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.2)]' : isDoordash ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(248,113,113,0.2)]' : isGrubhub ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'bg-blue-950/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]') : 'bg-black/20 border-white/5';
           const textClass = isUber ? 'text-green-400' : isDoordash ? 'text-red-400' : isGrubhub ? 'text-red-400' : 'text-blue-400';
           
           const finalTotal = calculateOptionTotal(opt);
           const activeCoupon = appliedCoupons[opt.providerId];

           return (
             <div key={opt.providerId} className={`rounded-2xl border transition-all duration-300 relative overflow-hidden group/optblk ${bgClass} hover:border-white/20 hover:bg-white/5`}>
                <div 
                   className="p-3.5 cursor-pointer flex justify-between items-center"
                   onClick={() => {
                     setSelectedOptionId(opt.providerId);
                     if (isPrimary && !isExpanded) setExpandedOptionId(opt.providerId);
                     else if (isPrimary && isExpanded) setExpandedOptionId(null);
                   }}
                >
                   {isPrimary && (
                     <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm ${isUber ? 'bg-green-500' : isDoordash ? 'bg-red-500' : isGrubhub ? 'bg-red-500' : 'bg-stone-600'}`}>
                       <CheckCircle2 className="w-3 h-3" />
                     </div>
                   )}
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center overflow-hidden shrink-0">
                         {isUber ? <span className="font-extrabold text-[10px] text-green-700">UBER</span> :
                          isDoordash ? <span className="font-extrabold text-[10px] text-red-600">DASH</span> :
                          isGrubhub ? <span className="font-extrabold text-[9px] text-red-600">GRUB</span> :
                          opt.providerId === 'pickup' ? <Car className="w-4 h-4 text-stone-600" /> :
                          <span className="font-extrabold text-[10px] text-blue-700">STORE</span>}
                      </div>
                      <div>
                         <div className="flex items-center gap-2">
                            <span className={`font-black text-sm text-white`}>{opt.providerName}</span>
                            {opt.badges.map(b => (
                               <span key={b} className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-white/10 border border-white/20 text-stone-300 shadow-sm">{b}</span>
                            ))}
                         </div>
                         <div className="text-[11px] font-bold text-stone-400 mt-0.5 flex gap-2">
                            {opt.priceBreakdown.deliveryFee === 0 ? 'Free Delivery' : `$${opt.priceBreakdown.deliveryFee.toFixed(2)} Delivery`}
                            <span className="opacity-50">•</span>
                            {opt.estimatedTimeMin}-{opt.estimatedTimeMax} min
                         </div>
                      </div>
                   </div>
                   <div className="text-right flex flex-col items-end">
                      <span className="font-black text-base text-white">${finalTotal.toFixed(2)}</span>
                      {activeCoupon ? (
                         <span className="text-[9px] font-bold text-green-400 bg-green-950/50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-green-500/50">Coupon Applied</span>
                      ) : opt.availableCoupons.length > 0 ? (
                         <span className="text-[9px] font-bold text-yellow-400 bg-yellow-950/50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-yellow-500/50">{opt.availableCoupons.length} Deal{opt.availableCoupons.length > 1 ? 's' : ''}</span>
                      ) : null}
                   </div>
                </div>

                <AnimatePresence>
                   {(isExpanded || isPrimary) && (
                      <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: "auto", opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden bg-black/20"
                      >
                         <div className="px-4 pb-4 pt-1">
                            <div className="border-t border-white/5 mb-3 pt-3">
                               <div className="space-y-1.5 text-xs text-stone-400 font-medium">
                                 <div className="flex justify-between">
                                    <span>Pizza Subtotal</span>
                                    <span>${((quote.basePrice + quote.toppingsCost) * qty / (currentConfig.quantity || 1)).toFixed(2)}</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span>Delivery Fee</span>
                                    <span>${(opt.priceBreakdown.deliveryFee * qty).toFixed(2)}</span>
                                 </div>
                                 {opt.priceBreakdown.serviceFee > 0 && (
                                   <div className="flex justify-between text-red-400">
                                      <span>Service Fee</span>
                                      <span>${(opt.priceBreakdown.serviceFee * qty).toFixed(2)}</span>
                                   </div>
                                 )}
                                 <div className="flex justify-between">
                                    <span>Taxes & Fees</span>
                                    <span>${(opt.priceBreakdown.tax * qty).toFixed(2)}</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span>Recommended Tip</span>
                                    <span>${(opt.priceBreakdown.tip * qty).toFixed(2)}</span>
                                 </div>
                                 {activeCoupon && (
                                   <div className="flex justify-between text-green-400 font-bold bg-green-950/50 px-2 py-1 rounded -mx-2 mt-1">
                                      <span>Discount ({activeCoupon.code})</span>
                                      <span>-${opt.priceBreakdown.grandTotal - finalTotal}</span>
                                   </div>
                                 )}
                               </div>
                            </div>
                            
                            {opt.availableCoupons.length > 0 && (
                               <div className="mb-3">
                                  <span className="text-[10px] font-black uppercase text-stone-500 mb-1.5 block tracking-widest">Coupons & Deals</span>
                                  <div className="flex flex-wrap gap-2">
                                     {opt.availableCoupons.map(c => {
                                        const isApplied = activeCoupon?.code === c.code;
                                        return (
                                          <button 
                                            key={c.code}
                                            onClick={(e) => {
                                               e.stopPropagation();
                                               setAppliedCoupons(prev => isApplied ? { ...prev, [opt.providerId]: undefined as any } : { ...prev, [opt.providerId]: c });
                                            }}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-bold transition-colors border ${isApplied ? 'bg-green-500/20 text-green-400 border-green-500 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'bg-white/5 text-stone-300 border-white/10 hover:border-white/30'}`}
                                          >
                                            <Ticket className="w-3.5 h-3.5" />
                                            {c.code}
                                          </button>
                                        )
                                     })}
                                  </div>
                               </div>
                            )}
                            
                            <div className="pt-3 border-t border-white/5 flex justify-between items-center group">
                                <span className="font-black text-sm text-stone-300">Final Total</span>
                                <span className="font-black text-lg text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">${finalTotal.toFixed(2)}</span>
                            </div>
                         </div>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>
           );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
        {/* Primary add to cart */}
        <div className="flex gap-3">
          <button onClick={() => handleAddToCart(false)} className="flex-[0.4] bg-black/40 hover:bg-black/60 border border-white/10 text-white text-sm font-black py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Add to Cart
          </button>
          <button onClick={() => handleAddToCart(true)} disabled={!primaryOption} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-black py-3.5 rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-[1.02] disabled:opacity-50 uppercase tracking-wider flex justify-center items-center gap-2 border border-red-400/50">
            Order Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reviews Modal */}
      <AnimatePresence>
        {showReviews && <ReviewModal quote={quote} onClose={() => setShowReviews(false)} onAddReview={onAddReview} />}
      </AnimatePresence>
      </div>
      
      {/* Table Modal */}
      <AnimatePresence>
        {showTableModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md rounded-3xl z-[60] flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black/90 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col pointer-events-auto"
            >
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/60">
                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                   <Table2 className="w-4 h-4 text-stone-400" /> Comparison Table
                </h3>
                <button onClick={() => setShowTableModal(false)} className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 text-stone-400 hover:text-white font-bold transition-colors text-xs">×</button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                   <thead className="bg-black/40 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                         <th className="px-4 py-3">Provider</th>
                         <th className="px-4 py-3">Fee</th>
                         <th className="px-4 py-3 text-center">ETA</th>
                         <th className="px-4 py-3">Discounts</th>
                         <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/10">
                      {sortedOptions.map(opt => {
                         const finalTotal = calculateOptionTotal(opt);
                         const isPrimary = primaryOption?.providerId === opt.providerId;
                         const activeCoupon = appliedCoupons[opt.providerId];

                         return (
                            <tr key={opt.providerId} className={`${isPrimary ? 'bg-green-950/30' : 'bg-transparent'} hover:bg-white/5 transition-colors`}>
                               <td className="px-4 py-3 font-bold text-stone-300 flex items-center gap-2">
                                  {opt.providerId === 'doordash' && <span className="w-2 h-2 rounded-full bg-red-500" />}
                                  {opt.providerId === 'ubereats' && <span className="w-2 h-2 rounded-full bg-green-500" />}
                                  {opt.providerId === 'grubhub' && <span className="w-2 h-2 rounded-full bg-red-500" />}
                                  {opt.providerId === 'pickup' && <span className="w-2 h-2 rounded-full bg-stone-500" />}
                                  {opt.providerId === 'store' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                                  {opt.providerName}
                               </td>
                               <td className="px-4 py-3 text-stone-400 font-medium">
                                  {opt.priceBreakdown.deliveryFee === 0 ? 'Free' : `$${(opt.priceBreakdown.deliveryFee * qty).toFixed(2)}`}
                               </td>
                               <td className="px-4 py-3 text-center text-stone-400 font-medium">
                                  {opt.estimatedTimeMin}-{opt.estimatedTimeMax}m
                               </td>
                               <td className="px-4 py-3">
                                  {activeCoupon ? (
                                     <span className="text-[10px] font-bold text-green-400 bg-green-950/50 px-1.5 py-0.5 rounded border border-green-500/50">-{activeCoupon.code}</span>
                                  ) : opt.availableCoupons.length > 0 ? (
                                     <span className="text-[10px] font-medium text-stone-500">{opt.availableCoupons.length} available</span>
                                  ) : (
                                     <span className="text-[10px] items-center text-stone-600">None</span>
                                  )}
                               </td>
                               <td className="px-4 py-3 text-right font-black text-white">
                                  ${finalTotal.toFixed(2)}
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md max-h-[85vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-stone-900 tracking-tight">{quote.chainName} Reviews</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-stone-100 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-900 font-bold transition-colors">×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-8 pr-2 space-y-4 no-scrollbar">
          {quote.reviews.length === 0 ? <p className="text-sm text-stone-500 font-medium p-4 bg-stone-50 rounded-2xl border border-stone-100">No reviews yet. Be the first to review!</p> : quote.reviews.map(r => (
            <div key={r.id} className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
              <div className="flex justify-between items-start mb-3">
                 <span className="text-sm font-black text-stone-900">{r.user}</span>
                 <div className="flex bg-white px-2 py-1 rounded-full shadow-sm border border-stone-100">
                   {Array.from({length: 5}).map((_, i) => (
                     <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-stone-200 text-stone-200'}`} />
                   ))}
                 </div>
              </div>
              <p className="text-sm text-stone-600 font-medium leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="border-t border-stone-100 pt-6 flex flex-col gap-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Leave a Review</h4>
          <div className="flex gap-2">
             {Array.from({length: 5}).map((_, i) => (
               <button key={i} type="button" onClick={() => setNewRating(i + 1)} className="p-1 hover:bg-stone-50 rounded-lg transition-colors">
                  <Star className={`w-8 h-8 transition-transform ${i < newRating ? 'fill-yellow-400 text-yellow-400 hover:scale-110' : 'fill-stone-200 text-stone-200'}`} />
               </button>
             ))}
          </div>
          <div className="flex gap-3 relative">
             <input type="text" placeholder="Write a short review..." value={newText} onChange={e => setNewText(e.target.value)} className="flex-1 bg-stone-100 border border-stone-200 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-stone-200/50 focus:border-stone-400 transition-all outline-none" />
             <button type="submit" disabled={!newText.trim()} className="bg-stone-900 hover:bg-black text-white p-4 rounded-2xl font-bold disabled:bg-stone-300 disabled:text-stone-500 shadow-md transition-all flex items-center justify-center">
               <Send className="w-5 h-5" />
             </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
