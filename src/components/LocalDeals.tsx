import React, { useState, useEffect } from 'react';
import { PizzaConfig, DeliveryType, Quote, Review, CartItem } from '../types';
import { MapPin, Search, Clock, Navigation, Plus, Minus, ShoppingCart, Bell, Tag, TrendingDown, Zap, Star, Gift, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { StoreLogo } from './StoreLogo';
import { STORES } from '../lib/storeData';

function getStoreDetails(storeId: string, storeName: string) {
  const store = STORES.find(s => s.id === storeId || s.name === storeName);
  return store ? { logoUrl: store.logoUrl, brandColor: store.brandColor } : {};
}

interface LocalDeal {
  id: string;
  store_id: string;
  title: string;
  description: string;
  original_price: number;
  discounted_price: number;
  image_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  delivery_type: DeliveryType;
  updated_at: string;
  // Merged store data
  store_name?: string;
  logo_url?: string;
  brand_color?: string;
  distance?: number;
}

// ── Alert preferences panel ──────────────────────────────────────────────────

const ALERT_PREFS = [
  { key: 'priceDrops', label: 'Price Drop Alerts', desc: "When a pizza you've searched gets cheaper", icon: TrendingDown, color: 'text-green-400' },
  { key: 'flashDeals', label: 'Flash Deals', desc: 'Time-limited offers from nearby stores', icon: Zap, color: 'text-yellow-400' },
  { key: 'weeklyDeals', label: 'Weekly Deal Digest', desc: 'Best deals every Monday morning', icon: Tag, color: 'text-red-400' },
  { key: 'rewardPoints', label: 'Reward Points', desc: 'When you earn or can redeem points', icon: Gift, color: 'text-pink-400' },
  { key: 'newStores', label: 'New Stores Near You', desc: 'When a new pizza shop joins MiSlice in Michigan', icon: MapPin, color: 'text-red-400' },
  { key: 'orderUpdates', label: 'Order Status Updates', desc: 'When your order is confirmed or delivered', icon: ShoppingCart, color: 'text-blue-400' },
];

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-red-600' : 'bg-stone-700'}`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

function AlertPreferences() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('miSliceAlertPrefs') || '{}'); }
    catch { return {}; }
  });

  const defaults: Record<string, boolean> = {
    priceDrops: true, flashDeals: true, weeklyDeals: false,
    rewardPoints: true, newStores: false, orderUpdates: true,
  };

  const toggle = (key: string) => {
    const next = { ...defaults, ...prefs, [key]: !(prefs[key] ?? defaults[key]) };
    setPrefs(next);
    localStorage.setItem('miSliceAlertPrefs', JSON.stringify(next));
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-4 h-4 text-red-400" />
        <p className="text-sm font-black text-white">My Deal Preferences</p>
      </div>
      <p className="text-xs text-stone-500 mb-4">Choose what kind of alerts you want. All preferences are saved locally.</p>

      <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
        {ALERT_PREFS.map(pref => {
          const Icon = pref.icon;
          const on = prefs[pref.key] ?? defaults[pref.key];
          return (
            <div key={pref.key} className="flex items-center gap-4 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                <Icon className={`w-3.5 h-3.5 ${pref.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{pref.label}</p>
                <p className="text-[10px] text-stone-600">{pref.desc}</p>
              </div>
              <ToggleSwitch on={on} onChange={() => toggle(pref.key)} />
            </div>
          );
        })}
      </div>
      <p className="text-center text-[10px] text-stone-700 pt-2">Preferences are stored on this device only.</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LocalDeals({ onAddToCart }: { onAddToCart: (item: Omit<CartItem, 'id'>, redirect: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<'deals' | 'preferences'>('deals');
  const [deals, setDeals] = useState<LocalDeal[]>([]);
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get location logic
    let lat = 42.3314; // Default to Detroit, MI
    let lng = -83.0458;
    
    const fetchDeals = (userLat: number, userLng: number) => {
       const q = query(collection(db, 'deals'), where('is_active', '==', true));
       
       return onSnapshot(q, async (snapshot) => {
         const dealsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LocalDeal[];
         
         // Fetch all stores to join data (in a real app, do geocoding/distance math or use GeoFire)
         try {
           const storesSnap = await getDocs(collection(db, 'stores'));
           const storesData = storesSnap.docs.reduce((acc, doc) => {
             acc[doc.id] = doc.data();
             return acc;
           }, {} as Record<string, any>);
           
           const enrichedDeals = dealsData.map(d => {
             const store = storesData[d.store_id];
             // Mock math for distance (1 degree is approx 69 miles)
             let dist = 5.0; // default
             if (store && store.latitude && store.longitude) {
               dist = Math.sqrt(Math.pow(store.latitude - userLat, 2) + Math.pow(store.longitude - userLng, 2)) * 69;
             }
             return {
               ...d,
               store_name: store?.store_name || "Unknown Store",
               logo_url: store?.logo_url,
               brand_color: store?.brand_color,
               distance: dist
             };
           }).sort((a,b) => (a.distance || 0) - (b.distance || 0));
           
           setDeals(enrichedDeals);
         } catch (err) {
           console.error("Error fetching stores for deals:", err);
           setDeals(dealsData); 
         }
         
         setLoading(false);
       }, (err) => {
         console.error(err);
         setLoading(false);
       });
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchDeals(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.log("Location denied, using Michigan defaults");
          setLocationError('Location denied. Showing default deals for Michigan.');
          fetchDeals(lat, lng);
        }
      );
    } else {
      fetchDeals(lat, lng);
    }

  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto z-10 relative pt-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-red-400" />
            Deals & Alerts
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">Michigan · Real-time discounts + your price alert preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/8 p-1 rounded-2xl mb-6 max-w-xs">
        <button
          onClick={() => setActiveTab('deals')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'deals' ? 'bg-white/12 text-white' : 'text-stone-500 hover:text-stone-300'}`}
        >
          <Tag className="w-3.5 h-3.5" /> Local Deals
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'preferences' ? 'bg-white/12 text-white' : 'text-stone-500 hover:text-stone-300'}`}
        >
          <Bell className="w-3.5 h-3.5" /> My Alerts
        </button>
      </div>

      {activeTab === 'preferences' && <AlertPreferences />}

      {activeTab === 'deals' && (
        <>
          {locationError && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-xl mb-5 text-xs font-bold">
              {locationError}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : deals.length === 0 ? (
            <div className="text-center py-20 bg-white/4 rounded-3xl border border-white/8 border-dashed">
              <Tag className="w-8 h-8 mx-auto text-stone-600 mb-3" />
              <p className="text-stone-500 font-bold text-sm mb-1">No active deals right now.</p>
              <p className="text-stone-600 text-xs">Store owners in Michigan haven't posted discounts today — check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {deals.map((deal, i) => (
                  <DealCard key={deal.id} deal={deal} i={i} onAddToCart={onAddToCart} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DealCard({ deal, i, onAddToCart }: { key?: string | number, deal: LocalDeal, i: number, onAddToCart: (item: Omit<CartItem, 'id'>, redirect: boolean) => void }) {
  const [qty, setQty] = useState(1);

  return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: i * 0.05 }}
         className="bg-white rounded-3xl overflow-hidden shadow-lg border border-stone-100 flex flex-col group bg-gradient-to-b from-white to-stone-50"
      >
          <div className="pizza-card-media bg-stone-200">
            {deal.image_url ? (
               <img src={deal.image_url} alt={deal.title} className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.src='/images/stores/white-horses-in-a-lush-forest.jpg'; }} />
            ) : (
               <img src="/images/stores/white-horses-in-a-lush-forest.jpg" alt={deal.title} className="w-full h-full object-cover" loading="lazy" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute top-3 right-3 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-sm z-20">
              SAVE ${ (deal.original_price - deal.discounted_price).toFixed(2) }
            </div>
            <div className="absolute top-3 left-3 flex gap-1 z-20">
               <StoreLogo 
                 storeName={deal.store_name || "Unknown Store"}
                 logoUrl={'/images/stores/white-horses-in-a-lush-forest.jpg'}
                 brandColor={deal.brand_color || getStoreDetails(deal.store_id || '', deal.store_name || '').brandColor || 'stone'}
                 className="w-10 h-10 border-stone-800 shadow"
               />
            </div>
            <div className="absolute bottom-3 left-3 flex gap-1 z-20">
               <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded capitalize">
                 {(deal.delivery_type || '').replace('-', ' ')}
               </span>
            </div>
          </div>
          
          <div className="p-6 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-3">
               <div>
                 <p className="text-[10px] font-black tracking-widest text-stone-400 uppercase mb-1">{deal.store_name}</p>
                 <h3 className="font-bold text-stone-900 text-lg leading-tight">{deal.title}</h3>
               </div>
            </div>
            
            <p className="text-stone-500 text-xs mb-4 flex-1">{deal.description}</p>
            
            <div className="flex items-center gap-3 mb-4 bg-white rounded-xl p-3 border border-stone-100 shadow-sm">
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider line-through">${deal.original_price.toFixed(2)}</span>
                 <span className="text-2xl font-black text-green-600 leading-none">${deal.discounted_price.toFixed(2)}</span>
               </div>
               <div className="ml-auto flex flex-col items-end gap-1">
                 <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                   <MapPin className="w-3 h-3" />
                   {deal.distance ? deal.distance.toFixed(1) : '?'} mi
                 </div>
                 <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                   <Clock className="w-3 h-3" />
                   {deal.end_date ? new Date(deal.end_date).toLocaleDateString() : 'Limited Time'}
                 </div>
               </div>
            </div>

            <div className="flex justify-between items-center pt-2 pb-4 border-b border-stone-100 mb-4">
               <div className="flex items-center gap-3 bg-stone-100 rounded-xl p-1">
                 <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1 rounded-lg hover:bg-white text-stone-600 shadow-sm transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                 <span className="font-bold text-sm w-4 text-center">{qty}</span>
                 <button onClick={() => setQty(qty + 1)} className="p-1 rounded-lg hover:bg-white text-stone-600 shadow-sm transition-colors"><Plus className="w-3.5 h-3.5" /></button>
               </div>
               <div className="text-right">
                  <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider mb-0.5">Total</span>
                  <span className="text-xl font-black">${(deal.discounted_price * qty).toFixed(2)}</span>
               </div>
            </div>

            <div className="flex gap-2">
               <button onClick={() => onAddToCart({
                 store_id: deal.store_id,
                 store_name: deal.store_name || "Unknown Store",
                 item_name: deal.title,
                 deal_id: deal.id,
                 quantity: qty,
                 price_per_item: deal.discounted_price,
                 total_price: deal.discounted_price * qty,
                 delivery_type: deal.delivery_type
               }, false)} className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center shadow-md">
                 <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add
               </button>
               <button onClick={() => onAddToCart({
                 store_id: deal.store_id,
                 store_name: deal.store_name || "Unknown Store",
                 item_name: deal.title,
                 deal_id: deal.id,
                 quantity: qty,
                 price_per_item: deal.discounted_price,
                 total_price: deal.discounted_price * qty,
                 delivery_type: deal.delivery_type
               }, true)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center shadow-md shadow-red-200">
                 Buy Now
               </button>
            </div>
          </div>
      </motion.div>
  );
}
