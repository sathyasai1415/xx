import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Plus, Trash2 } from 'lucide-react';
import { logAudit } from '../../../utils/audit';

export function PriceManagerTab({ storeData }: { storeData: any }) {
  const [saving, setSaving] = useState(false);
  const [originalPricing, setOriginalPricing] = useState<any>(null);
  const [pricing, setPricing] = useState<{
    sizes: Record<string, number>;
    crusts: Record<string, number>;
    extras: Record<string, number>;
  }>({
    sizes: { "Small": 8.99, "Medium": 10.99, "Large": 13.99, "Extra Large": 16.99 },
    crusts: { "Hand Tossed": 0, "Crunchy Thin Crust": 0, "Pan": 1.5, "Stuffed Crust": 2.5, "Gluten Free": 3.0 },
    extras: { "Meats (each)": 1.5, "Veggies (each)": 1.0, "Extra Cheese": 1.5 }
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    getDoc(doc(db, 'stores', auth.currentUser.uid, 'settings', 'pricing')).then(snap => {
      if (snap.exists()) {
        setPricing(snap.data() as any);
        setOriginalPricing(snap.data());
      }
    });
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    await setDoc(doc(db, 'stores', auth.currentUser.uid, 'settings', 'pricing'), pricing);
    
    await logAudit(
       'PRICE_UPDATED',
       'settings/pricing',
       originalPricing,
       pricing,
       auth.currentUser.uid,
       storeData?.store_name || auth.currentUser.email || 'Store Owner',
       'storeOwner'
    );
    setOriginalPricing(pricing);
    
    setTimeout(() => setSaving(false), 500);
  };

  const updatePrice = (category: 'sizes' | 'crusts' | 'extras', key: string, val: string) => {
    const num = parseFloat(val);
    setPricing(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: isNaN(num) ? 0 : num
      }
    }));
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center bg-black/40 p-6 rounded-3xl border border-white/10">
        <div>
           <h2 className="text-2xl font-black text-white">Dynamic Modular Pricing</h2>
           <p className="text-stone-400 text-sm mt-1">Set your base prices and upcharges. The 3D builder uses these to calculate user totals.</p>
        </div>
        <button 
           onClick={handleSave} 
           disabled={saving}
           className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all"
        >
          <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Pricing & Sync'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {/* Sizes */}
         <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide uppercase">
               Sizes
            </h3>
            <div className="space-y-3">
               {Object.entries(pricing.sizes).map(([size, price]) => (
                 <div key={size} className="flex justify-between items-center gap-4">
                   <span className="text-stone-300 font-bold flex-1">{size}</span>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                      <input 
                         type="number" step="0.01" 
                         value={price === 0 ? '' : price} 
                         onChange={e => updatePrice('sizes', size, e.target.value)} 
                         className="w-24 bg-black/60 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white font-bold focus:border-red-500 focus:outline-none" 
                      />
                   </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Crusts */}
         <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide uppercase">
               Crust Upcharges
            </h3>
            <div className="space-y-3">
               {Object.entries(pricing.crusts).map(([crust, price]) => (
                 <div key={crust} className="flex justify-between items-center gap-4">
                   <span className="text-stone-300 font-bold flex-1">{crust}</span>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">+$</span>
                      <input 
                         type="number" step="0.01" 
                         value={price === 0 ? '' : price} 
                         onChange={e => updatePrice('crusts', crust, e.target.value)} 
                         placeholder="0.00"
                         className="w-24 bg-black/60 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-white font-bold focus:border-red-500 focus:outline-none placeholder-stone-700" 
                      />
                   </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Extras & Toppings */}
         <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide uppercase">
               Toppings & Extras
            </h3>
            <div className="space-y-3">
               {Object.entries(pricing.extras).map(([extra, price]) => (
                 <div key={extra} className="flex justify-between items-center gap-4">
                   <span className="text-stone-300 font-bold flex-1">{extra}</span>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">+$</span>
                      <input 
                         type="number" step="0.01" 
                         value={price === 0 ? '' : price} 
                         onChange={e => updatePrice('extras', extra, e.target.value)} 
                         className="w-24 bg-black/60 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-white font-bold focus:border-red-500 focus:outline-none" 
                      />
                   </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
