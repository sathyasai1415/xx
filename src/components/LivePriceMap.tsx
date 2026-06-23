import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'motion/react';
import {
  MapPin, Pizza, Zap, Star, DollarSign, Clock, ArrowRight,
  TrendingDown, ChevronDown, ChevronUp, Flame, Award,
} from 'lucide-react';
import { PizzaConfig } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StorePin {
  id: string;
  name: string;
  shortName: string;
  x: number; // % from left
  y: number; // % from top
  price: number;
  rating: number;
  deliveryTime: number;
  deliveryFee: number;
  isOpen: boolean;
  isBestDeal?: boolean;
  isFastest?: boolean;
}

interface LivePriceMapProps {
  config: PizzaConfig | null;
  onSelectStore: (storeId: string) => void;
  onCompare: (config: PizzaConfig) => void;
}

// ── Store data (changes based on config) ─────────────────────────────────────

const BASE_STORES: StorePin[] = [
  { id: 'dominos', name: "Domino's Pizza", shortName: "Domino's", x: 22, y: 28, price: 16.99, rating: 4.2, deliveryTime: 28, deliveryFee: 2.99, isOpen: true },
  { id: 'pizza-hut', name: 'Pizza Hut', shortName: 'Pizza Hut', x: 65, y: 20, price: 18.49, rating: 4.0, deliveryTime: 35, deliveryFee: 2.49, isOpen: true },
  { id: 'papa-johns', name: "Papa John's", shortName: "Papa John's", x: 45, y: 55, price: 17.49, rating: 4.3, deliveryTime: 30, deliveryFee: 1.99, isOpen: true },
  { id: 'marios', name: "Mario's Pizza", shortName: "Mario's", x: 78, y: 65, price: 14.99, rating: 4.7, deliveryTime: 22, deliveryFee: 0, isOpen: true },
  { id: 'local1', name: 'Local Slice Co.', shortName: 'Local Slice', x: 30, y: 72, price: 12.99, rating: 4.8, deliveryTime: 18, deliveryFee: 1.49, isOpen: true },
  { id: 'tonys', name: "Tony's Pie Shop", shortName: "Tony's", x: 58, y: 42, price: 15.49, rating: 4.5, deliveryTime: 25, deliveryFee: 0.99, isOpen: false },
];

function computePrices(stores: StorePin[], config: PizzaConfig | null): StorePin[] {
  if (!config) return stores;
  const base = config.size === 'Small' ? -3 : config.size === 'Large' ? 3 : config.size === 'Extra Large' ? 6 : 0;
  const toppingsCost = ((config.meats?.length || 0) + (config.veggies?.length || 0)) * 0.8;
  return stores.map(s => ({
    ...s,
    price: parseFloat((s.price + base + toppingsCost * (0.8 + Math.random() * 0.4)).toFixed(2)),
  }));
}

function addBadges(stores: StorePin[]): StorePin[] {
  const open = stores.filter(s => s.isOpen);
  const cheapest = open.reduce((a, b) => a.price < b.price ? a : b, open[0]);
  const fastest = open.reduce((a, b) => a.deliveryTime < b.deliveryTime ? a : b, open[0]);
  return stores.map(s => ({
    ...s,
    isBestDeal: s.id === cheapest?.id,
    isFastest: s.id === fastest?.id && s.id !== cheapest?.id,
  }));
}

// ── Animated price number ─────────────────────────────────────────────────────

function AnimatedPrice({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    const steps = 12;
    const diff = value - displayed;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setDisplayed(prev => parseFloat((prev + diff / steps).toFixed(2)));
      if (step >= steps) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [value]);
  return <>${displayed.toFixed(2)}</>;
}

// ── Map background (CSS-only, no external API) ────────────────────────────────

function MapBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base map color */}
      <div className="absolute inset-0 bg-[#1a1f2e]" />

      {/* Grid roads */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Major horizontal roads */}
        <line x1="0" y1="30" x2="100" y2="30" stroke="#334155" strokeWidth="1.5" />
        <line x1="0" y1="55" x2="100" y2="55" stroke="#334155" strokeWidth="1.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#334155" strokeWidth="0.8" />
        {/* Major vertical roads */}
        <line x1="25" y1="0" x2="25" y2="100" stroke="#334155" strokeWidth="1.5" />
        <line x1="60" y1="0" x2="60" y2="100" stroke="#334155" strokeWidth="1.5" />
        <line x1="82" y1="0" x2="82" y2="100" stroke="#334155" strokeWidth="0.8" />
        {/* Diagonal road */}
        <line x1="0" y1="10" x2="45" y2="80" stroke="#334155" strokeWidth="0.8" />
        <line x1="55" y1="0" x2="100" y2="60" stroke="#334155" strokeWidth="0.8" />
        {/* Blocks */}
        <rect x="26" y="31" width="33" height="23" fill="#1e2535" stroke="#293244" strokeWidth="0.3" />
        <rect x="61" y="31" width="20" height="23" fill="#1c2232" stroke="#293244" strokeWidth="0.3" />
        <rect x="26" y="56" width="33" height="18" fill="#1d2333" stroke="#293244" strokeWidth="0.3" />
      </svg>

      {/* Heatmap zones */}
      <div className="absolute inset-0 opacity-15">
        {/* "Fastest Delivery" zone */}
        <div className="absolute w-56 h-48 rounded-full blur-3xl bg-yellow-500/60" style={{ left: '15%', top: '50%', transform: 'translate(-50%,-50%)' }} />
        {/* "Best Deal" zone */}
        <div className="absolute w-64 h-52 rounded-full blur-3xl bg-green-500/50" style={{ left: '72%', top: '62%', transform: 'translate(-50%,-50%)' }} />
        {/* "Highest Rated" zone */}
        <div className="absolute w-48 h-40 rounded-full blur-3xl bg-blue-500/40" style={{ left: '50%', top: '40%', transform: 'translate(-50%,-50%)' }} />
      </div>

      {/* Zone labels */}
      <div className="absolute text-[9px] font-black text-yellow-400/50 select-none" style={{ left: '7%', top: '60%' }}>
        ⚡ FAST ZONE
      </div>
      <div className="absolute text-[9px] font-black text-green-400/50 select-none" style={{ left: '63%', top: '72%' }}>
        💰 DEAL ZONE
      </div>
      <div className="absolute text-[9px] font-black text-blue-400/50 select-none" style={{ left: '42%', top: '30%' }}>
        ⭐ TOP RATED
      </div>

      {/* Delivery radius ring */}
      <div className="absolute border-2 border-red-500/10 rounded-full" style={{ width: 320, height: 320, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
      <div className="absolute border border-red-500/5 rounded-full" style={{ width: 480, height: 480, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />

      {/* Center pin (user location) */}
      <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
        <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-[0_0_12px_rgba(239,68,68,0.8)] relative z-10">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-60" />
        </div>
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-red-400/70 whitespace-nowrap">YOU</div>
      </div>

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]/70 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/40 via-transparent to-[#0a0a0a]/40 pointer-events-none" />
    </div>
  );
}

// ── Store pin ─────────────────────────────────────────────────────────────────

function StorePinMarker({ store, selected, onClick }: { store: StorePin; selected: boolean; onClick: () => void }) {
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{ left: `${store.x}%`, top: `${store.y}%`, transform: 'translate(-50%, -100%)', zIndex: selected ? 30 : 10 }}
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: Math.random() * 0.3 }}
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
    >
      {/* Badge */}
      {(store.isBestDeal || store.isFastest) && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap ${store.isBestDeal ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}
        >
          {store.isBestDeal ? '💰 BEST' : '⚡ FAST'}
        </motion.div>
      )}

      {/* Pin bubble */}
      <motion.div
        animate={{
          backgroundColor: selected ? '#ef4444' : store.isOpen ? '#1e293b' : '#111',
          borderColor: selected ? '#ef4444' : store.isBestDeal ? '#22c55e' : store.isFastest ? '#eab308' : '#334155',
          boxShadow: selected
            ? '0 0 20px rgba(239,68,68,0.6), 0 4px 12px rgba(0,0,0,0.5)'
            : store.isBestDeal
            ? '0 0 14px rgba(34,197,94,0.4), 0 4px 8px rgba(0,0,0,0.4)'
            : '0 4px 8px rgba(0,0,0,0.4)',
        }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-2xl border-2 backdrop-blur-xl whitespace-nowrap"
      >
        <div className="text-base">🍕</div>
        <div>
          <motion.p
            key={store.price}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
            className={`text-xs font-black leading-none ${selected ? 'text-white' : store.isOpen ? 'text-green-400' : 'text-stone-500'}`}
          >
            ${store.price.toFixed(2)}
          </motion.p>
          <p className={`text-[8px] font-bold leading-none mt-0.5 ${selected ? 'text-white/80' : 'text-stone-500'}`}>
            {store.shortName}
          </p>
        </div>
      </motion.div>

      {/* Pointer */}
      <div className={`w-2 h-2 mx-auto -mt-0.5 rotate-45 border-b-2 border-r-2 ${selected ? 'bg-red-600 border-red-500' : 'bg-[#1e293b] border-[#334155]'}`} />
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function LivePriceMap({ config, onSelectStore, onCompare }: LivePriceMapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [stores, setStores] = useState<StorePin[]>(addBadges(computePrices(BASE_STORES, null)));

  // Update prices when config changes
  useEffect(() => {
    const updated = addBadges(computePrices(BASE_STORES, config));
    setStores(updated);
  }, [config]);

  const selectedStore = stores.find(s => s.id === selected);
  const sortedStores = [...stores].filter(s => s.isOpen).sort((a, b) => a.price - b.price);

  const handlePin = (id: string) => {
    setSelected(prev => (prev === id ? null : id));
    setShowPanel(true);
  };

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="bg-black/60 backdrop-blur border-b border-white/8 px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-black text-sm">Live Price Map</h3>
          <p className="text-stone-500 text-xs mt-0.5">
            {config
              ? `Showing prices for ${config.size || 'Medium'} · ${config.crust || 'Hand Tossed'} · ${[...(config.meats || []), ...(config.veggies || [])].join(', ') || 'Cheese'}`
              : 'Prices update as you build your pizza'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {stores.filter(s => s.isOpen).length} stores open
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative h-72 sm:h-96">
        <MapBackground />

        {/* Store pins */}
        <div className="absolute inset-0">
          {stores.map(store => (
            <StorePinMarker
              key={store.id}
              store={store}
              selected={selected === store.id}
              onClick={() => handlePin(store.id)}
            />
          ))}
        </div>

        {/* Selected store popup */}
        <AnimatePresence>
          {selectedStore && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-72 bg-black/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 z-40 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-black text-white text-sm">{selectedStore.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-0.5 text-yellow-400 text-xs font-bold"><Star className="w-3 h-3 fill-current" />{selectedStore.rating}</span>
                    <span className="text-stone-600">·</span>
                    <span className="text-stone-400 text-xs font-medium flex items-center gap-0.5"><Clock className="w-3 h-3" />{selectedStore.deliveryTime} min</span>
                    <span className="text-stone-600">·</span>
                    <span className="text-stone-400 text-xs font-medium">{selectedStore.deliveryFee === 0 ? <span className="text-green-400 font-bold">Free delivery</span> : `$${selectedStore.deliveryFee.toFixed(2)} del.`}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-stone-500 hover:text-white p-1">
                  <motion.div whileHover={{ rotate: 90 }}>✕</motion.div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-green-400">${selectedStore.price.toFixed(2)}</p>
                  <p className="text-xs text-stone-500">for your pizza</p>
                </div>
                <div className="flex gap-2">
                  {selectedStore.isBestDeal && (
                    <span className="text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">💰 Best Deal</span>
                  )}
                  {selectedStore.isFastest && (
                    <span className="text-[10px] font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-lg">⚡ Fastest</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => { onSelectStore(selectedStore.id); config && onCompare(config); }}
                className="w-full mt-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                Compare All Prices <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-green-300/70 bg-black/50 backdrop-blur px-2 py-1 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500/40 border border-green-500/30" />
            Best Deal Area
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-yellow-300/70 bg-black/50 backdrop-blur px-2 py-1 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-yellow-500/40 border border-yellow-500/30" />
            Fastest Delivery
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-300/70 bg-black/50 backdrop-blur px-2 py-1 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-500/30" />
            Top Rated
          </div>
        </div>
      </div>

      {/* Price list below map */}
      <div className="bg-black/50 backdrop-blur border-t border-white/8">
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Ranked by Price</p>
          <p className="text-[10px] text-stone-600 font-bold">Tap pin on map for details</p>
        </div>
        <div className="space-y-0">
          {sortedStores.map((store, i) => (
            <motion.div
              key={store.id}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={() => handlePin(store.id)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selected === store.id ? 'bg-red-600/10 border-l-2 border-l-red-500' : 'hover:bg-white/4 border-l-2 border-l-transparent'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-stone-500 border border-white/10'}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{store.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-stone-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-yellow-500" />{store.rating}</span>
                  <span className="text-[9px] text-stone-500 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{store.deliveryTime}m</span>
                  {store.deliveryFee === 0 && <span className="text-[9px] text-green-400 font-bold">Free del.</span>}
                </div>
              </div>
              <div className="text-right">
                <motion.p
                  key={store.price}
                  initial={{ y: -4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`text-sm font-black ${i === 0 ? 'text-green-400' : 'text-white'}`}
                >
                  ${store.price.toFixed(2)}
                </motion.p>
                {i === 0 && <p className="text-[9px] text-green-500 font-bold">Lowest</p>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Build + compare CTA */}
        <div className="p-4 border-t border-white/6">
          <button
            onClick={() => config && onCompare(config)}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]"
          >
            <Pizza className="w-4 h-4" />
            {config ? 'Full Price Comparison' : 'Build Pizza → See Live Prices'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
