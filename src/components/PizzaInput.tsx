import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Search, SlidersHorizontal, Settings2, Heart, ShoppingCart } from 'lucide-react';
import { PizzaConfig, Size, Crust, Sauce, CartItem } from '../types';
import { Pizza3DBuilder } from './Pizza3DBuilder';

interface PizzaInputProps {
  onConfigChange: (config: PizzaConfig) => void;
  currentConfig: PizzaConfig;
  onSaveFavorite: (config: PizzaConfig) => void;
  onAddToCart?: (item: Omit<CartItem, 'id'>, redirect: boolean) => void;
  defaultOpen?: boolean;
  userPreferences?: { isVegetarian: boolean; allowedMeats: string[] } | null;
}

const OPTIONS = {
  sizes: ["", "Small", "Medium", "Large", "Extra Large"] as Size[],
  crusts: ["", "Hand Tossed", "Handmade Pan", "Crunchy Thin Crust", "Brooklyn Style", "New York Style", "Parmesan Stuffed Crust", "Gluten Free Crust"] as Crust[],
  sauces: ["", "Robust Inspired Tomato Sauce", "Hearty Marinara", "Garlic Parmesan White Sauce", "Alfredo Sauce", "BBQ Sauce", "Ranch Sauce", "Buffalo Sauce", "No Sauce"] as Sauce[],
  cheese: ["Mozzarella", "Extra Cheese", "Light Cheese", "No Cheese", "Cheddar Blend", "Feta", "Parmesan Asiago", "Provolone"],
  meats: ["Pepperoni", "Italian Sausage", "Beef", "Ham", "Bacon", "Philly Steak", "Grilled Chicken", "Premium Chicken"],
  veggies: ["Mushrooms", "Onions", "Green Peppers", "Black Olives", "Spinach", "Tomatoes", "Banana Peppers", "Jalapenos", "Pineapple", "Roasted Red Peppers"],
  extras: ["Extra Sauce", "Light Sauce", "Extra Cheese", "Light Cheese", "Well Done", "Square Cut"]
};

export function getPizzaImage(config: PizzaConfig): string {
  const hasChicken = config.meats.some(m => m.toLowerCase().includes('chicken'));
  const hasBBQ = config.sauce === 'BBQ Sauce';
  const hasBuffalo = config.sauce === 'Buffalo Sauce';
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

function getToppingIcon(topping: string): string | null {
  const t = topping.toLowerCase();
  if (t.includes('pepperoni')) return 'pepperoni.svg';
  if (t.includes('mushroom')) return 'mushrooms.svg';
  if (t.includes('onion')) return 'onions.svg';
  if (t.includes('pineapple')) return 'pineapple.svg';
  if (t.includes('chicken')) return 'chicken.svg';
  if (t.includes('sausage') || t.includes('beef') || t.includes('philly')) return 'sausage.svg';
  if (t.includes('pepper') || t.includes('spinach') || t.includes('olive') || t.includes('tomato')) return 'veggie.svg';
  if (t.includes('bacon') || t.includes('ham')) return 'bacon.svg';
  return null;
}

export function PizzaInput({ onConfigChange, currentConfig, onSaveFavorite, onAddToCart, defaultOpen = false, userPreferences = null }: PizzaInputProps) {
  const [aiQuery, setAiQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showBuilder, setShowBuilder] = useState(defaultOpen);
  const [savedMessage, setSavedMessage] = useState('');

  const availableMeats = userPreferences 
    ? (userPreferences.isVegetarian ? [] : userPreferences.allowedMeats) 
    : OPTIONS.meats;

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    setIsParsing(true);
    try {
      const res = await fetch('/api/parse-pizza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // Merge defaults if AI misses something
      onConfigChange({
        size: (data.size || 'Large') as Size,
        crust: (data.crust || 'Hand Tossed') as Crust,
        sauce: (data.sauce || 'Robust Inspired Tomato Sauce') as Sauce,
        cheese: data.cheese || ["Mozzarella"],
        meats: data.meats || [],
        veggies: data.veggies || [],
        extras: data.extras || [],
        quantity: data.quantity || 1
      });
      setShowBuilder(true);
    } catch (err) {
      console.error(err);
      // AI failed to parse, falling back to manual builder silently
      setShowBuilder(true);
    } finally {
      setIsParsing(false);
    }
  };

  const handleArrayToggle = (key: 'cheese' | 'meats' | 'veggies' | 'extras', item: string) => {
    const list = currentConfig[key];
    const newItems = list.includes(item) ? list.filter(t => t !== item) : [...list, item];
    onConfigChange({ ...currentConfig, [key]: newItems });
  };

  const handleSaveToCart = () => {
    if (!onAddToCart) return;
    const basePrice = currentConfig.size === 'Extra Large' ? 17.99 : currentConfig.size === 'Large' ? 14.99 : currentConfig.size === 'Medium' ? 11.99 : 9.99;
    const toppingsPrice = (currentConfig.meats.length + currentConfig.veggies.length) * 1.5;
    const total = (basePrice + toppingsPrice) * (currentConfig.quantity || 1);
    
    onAddToCart({
      store_id: 'custom',
      store_name: 'Custom Pizza',
      item_name: `Custom ${currentConfig.size} ${currentConfig.crust}`,
      config: currentConfig,
      quantity: currentConfig.quantity || 1,
      price_per_item: basePrice + toppingsPrice,
      total_price: total,
      delivery_type: 'store-delivery'
    }, false);

    setSavedMessage('Pizza saved to cart!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleReset = () => {
    onConfigChange({ size: '', crust: '', sauce: '', cheese: [], meats: [], veggies: [], extras: [], quantity: 1 });
  };

  const hasCrust = !!currentConfig.crust;
  const hasSauce = !!currentConfig.sauce;

  const estimatedPrice = currentConfig.size ? 
    ((currentConfig.size === 'Extra Large' ? 18 : currentConfig.size === 'Large' ? 15 : currentConfig.size === 'Medium' ? 12 : 10) + ((currentConfig.meats.length + currentConfig.veggies.length) * 1.5)) * (currentConfig.quantity || 1)
    : 0;

  return (
    <div className="w-full max-w-2xl mx-auto z-10 relative">
      <div className="bg-black/60 backdrop-blur-2xl rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden">
        
        {/* AI Input Section */}
        <div className="p-6 sm:p-8 border-b border-white/5">
          <form onSubmit={handleAiSubmit} className="relative flex items-center group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-400/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl w-full transition-all focus-within:border-white/30">
              <div className="pl-4 pr-2 text-stone-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <input
                type="text"
                className="w-full bg-transparent border-none py-4 text-lg sm:text-xl text-white placeholder:text-stone-500 font-bold tracking-tight focus:outline-none focus:ring-0"
                placeholder="I'm craving a large thin crust with..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                disabled={isParsing}
              />
              <div className="pr-3 flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setShowBuilder(!showBuilder)}
                  className="p-3 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors hidden sm:block"
                  title="Manual Builder"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={isParsing || !aiQuery.trim()}
                  className="bg-red-600 border border-red-500/50 hover:bg-red-700 disabled:bg-white/10 disabled:text-stone-500 text-white px-6 py-3 rounded-xl transition-colors font-bold shadow-[0_0_15px_rgba(255,30,30,0.3)] disabled:shadow-none"
                >
                  {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Analyze</span>}
                </button>
              </div>
            </div>
          </form>
          
          <button 
            type="button"
            onClick={() => setShowBuilder(!showBuilder)}
            className="mt-4 flex items-center justify-center gap-2 w-full text-sm font-bold text-stone-500 hover:text-white sm:hidden"
          >
            <Settings2 className="w-4 h-4" />
            Manual Builder
          </button>
        </div>

        {/* Builder UI Expansion */}
        <AnimatePresence>
          {showBuilder && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-transparent"
            >
              <div className="p-6 sm:p-8 space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Pizza Builder</h3>
                   <button 
                     onClick={() => onSaveFavorite(currentConfig)}
                     className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-200 bg-white"
                   >
                     <Heart className="w-3.5 h-3.5 fill-red-600" />
                     Save Configuration
                   </button>
                </div>

                {/* Visual Preview */}
                <div className="bg-stone-900 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-stone-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4"></div>
                   
                   <div className="w-48 h-48 sm:w-64 sm:h-64 flex-shrink-0 relative">
                     <Pizza3DBuilder config={currentConfig} />
                   </div>
                   
                   <div className="flex-1 relative z-10 w-full">
                     <h4 className="text-white text-2xl font-black mb-1 capitalize leading-tight">
                        {currentConfig.size} {currentConfig.crust || 'Select a crust'}
                     </h4>
                     {hasSauce && (
                       <p className="text-stone-400 text-sm font-medium mb-4">
                          {currentConfig.sauce}
                       </p>
                     )}
                     
                     <div className="flex flex-wrap gap-2 mb-6">
                        {[...currentConfig.meats, ...currentConfig.veggies, ...currentConfig.cheese, ...currentConfig.extras].map((topping, index) => {
                          const icon = getToppingIcon(topping);
                          return (
                            <div key={`${topping}-${index}`} className="flex items-center gap-1.5 bg-stone-800/80 backdrop-blur-sm border border-stone-700 rounded-lg px-2.5 py-1.5 shadow-sm">
                              {icon && <img src={`/images/toppings/${icon}`} alt="" className="w-4 h-4 opacity-90" />}
                              <span className="text-[10px] font-bold text-stone-200 tracking-wide uppercase">{topping}</span>
                            </div>
                          );
                        })}
                     </div>

                     <div className="flex flex-col gap-3">
                         <div className="flex justify-between items-end border-b border-stone-700 pb-3">
                           <div>
                             <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Estimated Price</span>
                             <span className="text-2xl font-black text-green-500">${estimatedPrice.toFixed(2)}</span>
                           </div>
                           <div className="text-right">
                             <button onClick={handleReset} className="text-xs font-bold text-stone-400 hover:text-stone-200 uppercase tracking-wider transition-colors">
                               Reset Pizza
                             </button>
                           </div>
                         </div>
                         <div className="flex gap-2">
                           {savedMessage ? (
                             <div className="flex-1 bg-green-500/20 text-green-400 font-bold py-2.5 rounded-xl text-center text-sm border border-green-500/30 flex items-center justify-center">
                               {savedMessage}
                             </div>
                           ) : (
                             <button 
                               onClick={handleSaveToCart}
                               disabled={!hasCrust}
                               className={`flex-1 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg ${hasCrust ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-900/50 text-red-200/50 cursor-not-allowed'}`}
                             >
                               <ShoppingCart className="w-4 h-4" /> Save to Cart
                             </button>
                           )}
                         </div>
                     </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Size & Crust */}
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="space-y-3 flex-1">
                        <label className="block text-[11px] font-bold tracking-widest text-stone-500 uppercase">Size</label>
                        <select 
                          className="w-full bg-stone-100 border-none rounded-lg p-2 text-xs font-bold text-stone-700"
                          value={currentConfig.size}
                          onChange={(e) => onConfigChange({...currentConfig, size: e.target.value as Size})}
                        >
                           {OPTIONS.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3 w-24">
                        <label className="block text-[11px] font-bold tracking-widest text-stone-500 uppercase">Qty</label>
                        <select 
                          className="w-full bg-stone-100 border-none rounded-lg p-2 text-xs font-bold text-stone-700"
                          value={currentConfig.quantity || 1}
                          onChange={(e) => onConfigChange({...currentConfig, quantity: parseInt(e.target.value)})}
                        >
                           {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[11px] font-bold tracking-widest text-stone-500 uppercase flex justify-between">
                         Crust
                         {!hasCrust && <span className="text-red-500 animate-pulse">Required *</span>}
                      </label>
                      <select 
                        className="w-full bg-stone-100 border-none rounded-lg p-2 text-xs font-bold text-stone-700"
                        value={currentConfig.crust}
                        onChange={(e) => onConfigChange({...currentConfig, crust: e.target.value as Crust})}
                      >
                         {OPTIONS.crusts.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[11px] font-bold tracking-widest text-stone-500 uppercase">Sauce</label>
                      <select 
                        className={`w-full border-none rounded-lg p-2 text-xs font-bold transition-colors ${!hasCrust ? 'bg-stone-50 text-stone-400 cursor-not-allowed' : 'bg-stone-100 text-stone-700'}`}
                        value={currentConfig.sauce}
                        disabled={!hasCrust}
                        onChange={(e) => onConfigChange({...currentConfig, sauce: e.target.value as Sauce})}
                      >
                         {OPTIONS.sauces.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Toppings Columns */}
                  <div className={`space-y-6 transition-opacity duration-300 ${!hasSauce ? 'opacity-40 pointer-events-none' : ''}`}>
                     <div className="space-y-3">
                        <label className="block text-[11px] font-bold tracking-widest text-stone-500 uppercase">Cheese</label>
                        <div className="flex flex-wrap gap-1.5">
                           {OPTIONS.cheese.map(c => (
                             <button key={c} onClick={() => handleArrayToggle('cheese', c)} className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${currentConfig.cheese.includes(c) ? 'bg-yellow-100 text-yellow-800' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                               {c} {currentConfig.cheese.includes(c) ? '×' : '+'}
                             </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="block text-[11px] font-bold tracking-widest text-stone-500 uppercase">Meats</label>
                        <div className="flex flex-wrap gap-1.5">
                           {availableMeats.length > 0 ? availableMeats.map(m => (
                             <button key={m} onClick={() => handleArrayToggle('meats', m)} className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${currentConfig.meats.includes(m) ? 'bg-red-100 text-red-800' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                               {m} {currentConfig.meats.includes(m) ? '×' : '+'}
                             </button>
                           )) : (
                             <span className="text-xs text-stone-400 italic">No meats selected in your dietary preferences.</span>
                           )}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="block text-[11px] font-bold tracking-widest text-stone-500 uppercase">Veggies & Extras</label>
                        <div className="flex flex-wrap gap-1.5">
                           {OPTIONS.veggies.map(v => (
                             <button key={v} onClick={() => handleArrayToggle('veggies', v)} className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${currentConfig.veggies.includes(v) ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                               {v} {currentConfig.veggies.includes(v) ? '×' : '+'}
                             </button>
                           ))}
                           {OPTIONS.extras.map(e => (
                             <button key={e} onClick={() => handleArrayToggle('extras', e)} className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${currentConfig.extras.includes(e) ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                               {e} {currentConfig.extras.includes(e) ? '×' : '+'}
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
