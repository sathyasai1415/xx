import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, ChevronRight, ChevronDown, ChevronUp, Map, Navigation,
  Pizza, BarChart3, Tag, X, Sparkles,
} from 'lucide-react';
import { SmartSearchBar, ParsedQuery } from './SmartSearchBar';
import { StoreGrid } from './StoreGrid';
import { InteractiveMap } from './InteractiveMap';
import { StoreDetailSheet } from './StoreDetailSheet';
import { Footer } from './Footer';
import { PizzaConfig, Quote, CartItem } from '../types';
import { useApp } from '../store/AppContext';
import { RECOMMENDATION_SLICES, MarketplaceStore } from '../data/marketplace';

// ── Michigan cities ──────────────────────────────────────────────────────────

const MI_CITIES = [
  { label: 'All MI', value: 'All' },
  { label: 'Detroit', value: 'Detroit' },
  { label: 'Dearborn', value: 'Dearborn' },
  { label: 'Ann Arbor', value: 'Ann Arbor' },
  { label: 'Lansing', value: 'Lansing' },
  { label: 'Grand Rapids', value: 'Grand Rapids' },
  { label: 'Flint', value: 'Flint' },
  { label: 'Warren', value: 'Warren' },
];

const DEAL_TICKER = [
  '🍕  Shamz Pizza · Large Pepperoni now $11.99',
  "🏷️  Mario's · Buy One Get One Free — Tuesdays only",
  '⚡  Pizza Palace · Free delivery on orders over $20',
  '🔥  Detroit Deep Dish · 30% off all lunch specials',
  '💰  Ann Arbor Pizza Co. · $5 off any large pizza',
];

const DEFAULT_CONFIG: PizzaConfig = {
  size: 'Large', crust: 'Hand Tossed',
  sauce: 'Robust Inspired Tomato Sauce',
  cheese: ['Mozzarella'], meats: [], veggies: [], extras: [], quantity: 1,
};

function queryToConfig(query: string, parsed?: ParsedQuery): PizzaConfig {
  const q = query.toLowerCase();
  return {
    ...DEFAULT_CONFIG,
    size: parsed?.size as any || (q.includes('large') ? 'Large' : q.includes('small') ? 'Small' : 'Large'),
    crust: parsed?.crust as any || (q.includes('thin') ? 'Crunchy Thin Crust' : 'Hand Tossed'),
    sauce: q.includes('bbq') ? 'BBQ Sauce' : q.includes('alfredo') ? 'Alfredo Sauce' : 'Robust Inspired Tomato Sauce',
    meats: parsed?.toppings || (q.includes('pepperoni') ? ['Pepperoni'] : q.includes('chicken') ? ['Premium Chicken'] : []),
    veggies: (q.includes('veggie') || q.includes('vegan')) ? ['Mushrooms', 'Onions', 'Green Peppers'] : [],
  };
}

// ── Props ────────────────────────────────────────────────────────────────────

interface HomeViewProps {
  onCustomize: (config: PizzaConfig) => void;
  onCompare: (config: PizzaConfig) => void;
  onNavigate: (view: string) => void;
  currentConfig: PizzaConfig | null;
  quotes: Quote[];
  favoriteStores: string[];
  onToggleFavoriteStore: (chainId: string) => void;
  onAddReview: (chainId: string, rating: number, text: string) => void;
  onAddToCart: (item: Omit<CartItem, 'id'>, redirect?: boolean) => void;
  userPreferences?: { isVegetarian: boolean; allowedMeats: string[] } | null;
}

// ── Quick action card ─────────────────────────────────────────────────────────

function QuickAction({ icon: Icon, title, sub, onClick }: {
  icon: React.ElementType; title: string; sub: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="clay-btn bg-white rounded-3xl p-6 text-left group"
    >
      <div className="clay-soft w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5 text-amber-500" />
      </div>
      <p className="text-sm font-black text-stone-800 mb-1">{title}</p>
      <p className="text-xs text-stone-400 leading-relaxed">{sub}</p>
      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-4 group-hover:gap-2 transition-all">
        Open <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </motion.button>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function HomeView({
  onCompare, onNavigate, currentConfig, onAddToCart,
}: HomeViewProps) {
  const { state, setSearch } = useApp();
  const [activeCity, setActiveCity] = useState('All');
  const [sheetStore, setSheetStore] = useState<MarketplaceStore | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const storesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => (i + 1) % DEAL_TICKER.length), 3800);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (query: string, parsed?: ParsedQuery) => {
    setSearch(query);
    if (query.trim()) onCompare(queryToConfig(query, parsed));
  };

  const revealStores = () => {
    setShowStores(true);
    setTimeout(() => storesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const storeCount = state.searchResults.length;

  return (
    <div className="w-full flex-1 flex flex-col pb-28 relative overflow-x-hidden">

      {/* ── Live deal ticker ───────────────────────────────────────────────── */}
      <button
        onClick={() => onNavigate('local-deals')}
        className="relative z-20 w-full max-w-2xl mx-auto mt-6 px-2"
      >
        <div className="clay-soft bg-white rounded-full flex items-center gap-3 px-4 py-2.5">
          <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Live
          </span>
          <div className="flex-1 overflow-hidden text-left">
            <AnimatePresence mode="wait">
              <motion.p
                key={tickerIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-xs font-semibold text-stone-600 truncate"
              >
                {DEAL_TICKER[tickerIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        </div>
      </button>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 w-full max-w-3xl mx-auto px-5 pt-16 pb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 clay-soft bg-white text-stone-500 text-[10px] font-black px-4 py-2 rounded-full mb-8"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          Michigan's Pizza Price Comparison · {RECOMMENDATION_SLICES.mostOrdered().length} stores live
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="text-5xl sm:text-6xl font-black text-stone-800 tracking-tight leading-[1.05] mb-5"
        >
          The Cheapest{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
            Pizza
          </span>
          <br />in Michigan
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-stone-500 text-base max-w-md mx-auto mb-10 leading-relaxed"
        >
          Compare live prices, delivery fees, and deals from every pizza shop near you.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <SmartSearchBar onSearch={handleSearch} location={activeCity === 'All' ? 'Michigan' : `${activeCity}, MI`} />
        </motion.div>
      </section>

      {/* ── Quick actions ──────────────────────────────────────────────────── */}
      <section className="relative z-10 w-full max-w-4xl mx-auto px-5 mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction icon={Pizza} title="Build a Pizza" sub="Design it, see live prices everywhere." onClick={() => onNavigate('pizza-builder')} />
          <QuickAction icon={BarChart3} title="Compare Prices" sub="Side-by-side cost across stores." onClick={() => onNavigate('compare')} />
          <QuickAction icon={Tag} title="Deals & Alerts" sub="Live offers and price alerts." onClick={() => onNavigate('local-deals')} />
        </div>
      </section>

      {/* ── Nearby stores reveal ───────────────────────────────────────────── */}
      <section ref={storesRef} className="relative z-10 w-full max-w-6xl mx-auto px-5 scroll-mt-6">
        <AnimatePresence mode="wait">
          {!showStores ? (
            <motion.div
              key="reveal-cta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="clay bg-white rounded-[2.5rem] px-8 py-16 sm:py-20 text-center max-w-2xl mx-auto"
            >
              <div className="clay-soft w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-6">
                <Navigation className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-800 mb-3">Find Pizza Near You</h2>
              <p className="text-stone-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                Discover open pizza shops across Michigan, sorted by price and delivery time.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={revealStores}
                className="clay-accent inline-flex items-center gap-2.5 text-stone-900 font-black text-sm px-8 py-4"
              >
                <Navigation className="w-4 h-4" /> Find Nearby Stores
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="stores"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* City filter + header */}
              <div className="clay bg-white rounded-3xl p-5 sm:p-6 mb-8">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-black text-stone-800 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      Stores Near You
                    </h2>
                    <p className="text-[11px] text-stone-400 mt-1">
                      {activeCity !== 'All' ? `${activeCity}, MI` : 'Michigan'} · {storeCount} open
                    </p>
                  </div>
                  <button
                    onClick={() => setShowStores(false)}
                    className="clay-btn w-9 h-9 rounded-full bg-white flex items-center justify-center text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {MI_CITIES.map(city => (
                    <button
                      key={city.value}
                      onClick={() => { setActiveCity(city.value); setSearch(''); }}
                      className={`text-[11px] font-bold px-3.5 py-2 rounded-full transition-all ${
                        activeCity === city.value
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[0_4px_14px_-4px_rgba(255,171,46,0.6)]'
                          : 'clay-inset text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {city.label}
                    </button>
                  ))}
                </div>
              </div>

              <StoreGrid
                onAddToCart={onAddToCart}
                onCompare={onCompare}
                onNavigate={onNavigate}
                onOpenStore={setSheetStore}
              />

              {/* Pizza map */}
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-black text-stone-800 flex items-center gap-2">
                    <Map className="w-4 h-4 text-amber-500" /> Pizza Map
                    <span className="text-[8px] font-black clay-inset text-amber-600 px-2 py-0.5 rounded-full">LIVE</span>
                  </h2>
                  <button
                    onClick={() => setMapExpanded(e => !e)}
                    className="flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    {mapExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Collapse</> : <><ChevronDown className="w-3.5 h-3.5" /> Expand</>}
                  </button>
                </div>
                <AnimatePresence>
                  {mapExpanded ? (
                    <motion.div
                      key="map-expanded"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 420, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                      className="overflow-hidden rounded-3xl clay bg-white"
                    >
                      <InteractiveMap config={currentConfig} onSelectStore={() => {}} onCompare={onCompare} onOpenStore={setSheetStore} />
                    </motion.div>
                  ) : (
                    <motion.button
                      key="map-collapsed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setMapExpanded(true)}
                      className="clay-inset w-full h-28 rounded-3xl flex items-center justify-center gap-3 text-stone-400 hover:text-stone-700 transition-colors group"
                    >
                      <Map className="w-5 h-5 group-hover:text-amber-500 transition-colors" />
                      <span className="text-xs font-bold">Explore the live pizza map</span>
                      <ChevronDown className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Modals & sheets ───────────────────────────────────────────────── */}
      <StoreDetailSheet
        store={sheetStore}
        onClose={() => setSheetStore(null)}
        onAddToCart={onAddToCart}
      />

      <Footer />
    </div>
  );
}
