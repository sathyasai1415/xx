import React, { useState, useEffect } from 'react';
import { DeliveryType, CartItem } from '../types';
import { MapPin, Clock, Plus, Minus, ShoppingCart, Bell, Tag, TrendingDown, Zap, Star, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { StoreLogo } from './StoreLogo';
import { STORES } from '../lib/storeData';
import ElectricBorder from './ElectricBorder';
import BorderGlow from './BorderGlow';

// ── Mock deals shown when Firebase has no data ────────────────────────────────
const MOCK_DEALS: LocalDeal[] = [
  { id: 'm-rambo', store_id: 'rambos-pizza',  store_name: "Rambo's Pizza",      title: '4 Pizzas for $3',                     description: 'Action-packed flavor! Get 4 large pizzas with your choice of toppings for just $3.', original_price: 60.00, discounted_price: 3.00, image_url: '', start_date: '', end_date: '', is_active: true, delivery_type: 'pickup',         updated_at: '', distance: 0.5, brand_color: '#FF3B30' },
  { id: 'm1', store_id: 'buntys-pizza',      store_name: "Bunty's Pizza",      title: '2 Large Pizzas for $26',              description: 'Any 2 large pizzas with up to 3 toppings each. Mix and match!',                 original_price: 31.98, discounted_price: 26.00, image_url: '', start_date: '', end_date: '', is_active: true, delivery_type: 'store-delivery', updated_at: '', distance: 0.4, brand_color: '#EA580C' },
  { id: 'm2', store_id: 'shamz-pizza',        store_name: 'Shamz Pizza',        title: 'Free Delivery Fridays',               description: 'Every Friday — free store delivery on orders over $20.',                         original_price: 2.99,  discounted_price: 0.00,  image_url: '', start_date: '', end_date: '', is_active: true, delivery_type: 'store-delivery', updated_at: '', distance: 1.2, brand_color: '#E63946' },
  { id: 'm3', store_id: 'motor-city-slice',   store_name: 'Motor City Slice',   title: 'Student Deal — Large Pizza $12',      description: 'Show your Michigan ID and get any large pizza for $12. Any toppings.',            original_price: 14.99, discounted_price: 12.00, image_url: '', start_date: '', end_date: '', is_active: true, delivery_type: 'pickup',         updated_at: '', distance: 2.5, brand_color: '#F4A261' },
  { id: 'm4', store_id: 'great-lakes-pies',   store_name: 'Great Lakes Pies',   title: 'Tuesday BOGO — Buy 1 Get 1 Half Off', description: 'Every Tuesday — buy any large, get a second large at 50% off.',                   original_price: 30.98, discounted_price: 23.24, image_url: '', start_date: '', end_date: '', is_active: true, delivery_type: 'store-delivery', updated_at: '', distance: 3.1, brand_color: '#2A9D8F' },
  { id: 'm5', store_id: 'motor-city-slice',   store_name: 'Motor City Slice',   title: 'Family Bundle — XL + Sides $22',      description: 'XL cheese pizza plus garlic bread and 2-liter soda.',                            original_price: 28.47, discounted_price: 22.00, image_url: '', start_date: '', end_date: '', is_active: true, delivery_type: 'store-delivery', updated_at: '', distance: 2.5, brand_color: '#F4A261' },
  { id: 'm6', store_id: 'great-lakes-pies',   store_name: 'Great Lakes Pies',   title: 'Pickup Saver — 20% Off',              description: 'Order for pickup and save 20% on your entire order automatically.',               original_price: 20.00, discounted_price: 16.00, image_url: '', start_date: '', end_date: '', is_active: true, delivery_type: 'pickup',         updated_at: '', distance: 3.1, brand_color: '#2A9D8F' },
];

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
  const [deals, setDeals] = useState<LocalDeal[]>([]);
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let lat = 42.3314, lng = -83.0458;

    const fetchDeals = (userLat: number, userLng: number) => {
      const q = query(collection(db, 'deals'), where('is_active', '==', true));
      return onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
          // No Firestore data — use mock deals
          setDeals(MOCK_DEALS);
          setLoading(false);
          return;
        }
        const dealsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LocalDeal[];
        try {
          const storesSnap = await getDocs(collection(db, 'stores'));
          const storesData = storesSnap.docs.reduce((acc, doc) => { acc[doc.id] = doc.data(); return acc; }, {} as Record<string, any>);
          const enriched = dealsData.map(d => {
            const store = storesData[d.store_id];
            let dist = 5.0;
            if (store?.latitude && store?.longitude)
              dist = Math.sqrt(Math.pow(store.latitude - userLat, 2) + Math.pow(store.longitude - userLng, 2)) * 69;
            return { ...d, store_name: store?.store_name || 'Unknown Store', logo_url: store?.logo_url, brand_color: store?.brand_color, distance: dist };
          }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
          setDeals(enriched);
        } catch {
          setDeals(MOCK_DEALS);
        }
        setLoading(false);
      }, () => { setDeals(MOCK_DEALS); setLoading(false); });
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchDeals(pos.coords.latitude, pos.coords.longitude),
        () => { setLocationError('Location denied. Showing default deals for Michigan.'); fetchDeals(lat, lng); }
      );
    } else { fetchDeals(lat, lng); }
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto z-10 relative pt-2 pb-16">
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
                  i === 0 ? (
                    <ElectricBorder key={deal.id} color="#FF6B35" speed={1.2} chaos={0.10} borderRadius={24}>
                      <BorderGlow backgroundColor="#16192A" glowColor="20 80 70" colors={['#FF6B35','#DC2626','#F97316']} borderRadius={24} glowIntensity={1.2}>
                        <DealCard deal={deal} i={i} onAddToCart={onAddToCart} isBest />
                      </BorderGlow>
                    </ElectricBorder>
                  ) : (
                    <BorderGlow key={deal.id} backgroundColor="#16192A" glowColor="20 80 70" colors={['#FF6B35','#DC2626','#F97316']} borderRadius={24}>
                      <DealCard deal={deal} i={i} onAddToCart={onAddToCart} />
                    </BorderGlow>
                  )
                ))}
              </AnimatePresence>
            </div>
          )}
    </div>
  );
}

function DealCard({ deal, i, onAddToCart, isBest }: { deal: LocalDeal, i: number, onAddToCart: (item: Omit<CartItem, 'id'>, redirect: boolean) => void, isBest?: boolean }) {
  const [qty, setQty] = useState(1);
  const accent = deal.brand_color || '#DC2626';
  const savings = deal.original_price - deal.discounted_price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className="rounded-3xl overflow-hidden flex flex-col"
    >
      {/* Colored header banner — no image needed */}
      <div className="relative h-28 overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 100%)` }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 50%, ${accent}55 0%, transparent 70%)` }} />
        {/* Store name pill top-left */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg" style={{ backgroundColor: accent }}>
            {(deal.store_name || '?')[0]}
          </div>
          <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">{deal.store_name}</span>
        </div>
        {/* Savings badge top-right */}
        {savings > 0 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white font-black text-[10px] px-2.5 py-1 rounded-lg shadow">
            SAVE ${savings.toFixed(2)}
          </div>
        )}
        {/* Best deal badge */}
        {isBest && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-black px-2 py-0.5 rounded-full">
            <Star className="w-2.5 h-2.5 fill-orange-400 text-orange-400" /> BEST DEAL
          </div>
        )}
        {/* Delivery type badge bottom-right */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/50 backdrop-blur-sm text-white/70 text-[10px] uppercase font-bold px-2 py-0.5 rounded capitalize">
            {(deal.delivery_type || '').replace('-', ' ')}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-black text-white text-base leading-tight mb-1">{deal.title}</h3>
        <p className="text-stone-400 text-xs mb-4 flex-1 leading-relaxed">{deal.description}</p>

        {/* Price row */}
        <div className="flex items-center gap-3 mb-4 bg-white/5 rounded-2xl p-3 border border-white/8">
          <div className="flex flex-col">
            {savings > 0 && (
              <span className="text-[10px] font-bold text-stone-500 line-through">${deal.original_price.toFixed(2)}</span>
            )}
            <span className="text-2xl font-black leading-none" style={{ color: accent }}>
              {deal.discounted_price === 0 ? 'FREE' : `$${deal.discounted_price.toFixed(2)}`}
            </span>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400 bg-white/5 px-2 py-0.5 rounded">
              <MapPin className="w-3 h-3" />
              {deal.distance ? deal.distance.toFixed(1) : '?'} mi
            </div>
            <div className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {deal.end_date ? new Date(deal.end_date).toLocaleDateString() : 'Limited Time'}
            </div>
          </div>
        </div>

        {/* Qty + total */}
        <div className="flex justify-between items-center pt-2 pb-4 border-b border-white/8 mb-4">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1 rounded-lg hover:bg-white/10 text-stone-300 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
            <span className="font-bold text-sm w-4 text-center text-white">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="p-1 rounded-lg hover:bg-white/10 text-stone-300 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider mb-0.5">Total</span>
            <span className="text-xl font-black text-white">${(deal.discounted_price * qty).toFixed(2)}</span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-2">
          <button onClick={() => onAddToCart({ store_id: deal.store_id, store_name: deal.store_name || 'Unknown Store', item_name: deal.title, deal_id: deal.id, quantity: qty, price_per_item: deal.discounted_price, total_price: deal.discounted_price * qty, delivery_type: deal.delivery_type }, false)}
            className="flex-1 bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center border border-white/10">
            <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add
          </button>
          <button onClick={() => onAddToCart({ store_id: deal.store_id, store_name: deal.store_name || 'Unknown Store', item_name: deal.title, deal_id: deal.id, quantity: qty, price_per_item: deal.discounted_price, total_price: deal.discounted_price * qty, delivery_type: deal.delivery_type }, true)}
            className="flex-1 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center shadow-lg"
            style={{ backgroundColor: accent }}>
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
