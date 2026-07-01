import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, ChevronRight, ChevronDown, ChevronUp, Map, Navigation,
  Pizza, BarChart3, Tag, X, Sparkles, Play, Pause, Volume2, VolumeX,
  Lock, Crown,
} from 'lucide-react';
import MagicBento, { BentoCardData } from './MagicBento';
import { SmartSearchBar, ParsedQuery } from './SmartSearchBar';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';
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
  isPremium?: boolean;
  onUpgrade?: () => void;
  isLight?: boolean;
}

// ── Quick action card ─────────────────────────────────────────────────────────

function QuickAction({ icon: Icon, title, sub, onClick }: {
  icon: React.ElementType; title: string; sub: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 text-left transition w-full"
      style={{
        background: 'rgba(18,15,28,0.9)',
        border: '1px solid rgba(139,92,246,0.2)',
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-105"
        style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
        <Icon className="w-5 h-5 sm:w-5 sm:h-5 text-violet-300" />
      </div>
      <p className="text-sm sm:text-sm font-bold text-white mb-1 leading-tight">{title}</p>
      <p className="text-xs text-white/40 leading-relaxed hidden sm:block">{sub}</p>
      <div className="flex items-center gap-1 text-xs font-semibold text-violet-400 mt-3 sm:mt-4">
        <span>Open</span> <ChevronRight className="w-3 h-3" />
      </div>
    </motion.button>
  );
}

// ── Hero video card ───────────────────────────────────────────────────────────

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };
  const toggleMute = () => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-red-500/40 bg-gradient-to-br from-orange-900 to-red-900 shadow-[0_40px_120px_-40px_rgba(220,38,38,0.8)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_35%)] pointer-events-none z-10" />

      {videoFailed ? (
        <div className="w-full h-[200px] sm:h-[300px] lg:h-[420px] bg-gradient-to-br from-orange-900 via-red-900 to-blue-900 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.18),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_65%,rgba(255,69,0,0.1),transparent_50%)]" />
          <span className="text-[100px] sm:text-[140px] lg:text-[180px] opacity-[0.12] select-none" style={{ filter: 'drop-shadow(0 0 60px rgba(255,107,44,0.5))' }}>🍕</span>
        </div>
      ) : (
        <video
          ref={videoRef}
          src="/hero-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
          className="w-full h-[200px] sm:h-[300px] lg:h-[420px] object-cover object-center"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-4 z-20">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/30 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-white border border-blue-400/50">
          AI Pizza Builder
        </div>
        <h2 className="mt-2 sm:mt-4 text-lg sm:text-2xl lg:text-3xl font-black text-white leading-tight">Build your perfect pizza and compare price quotes instantly.</h2>
        <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm text-blue-100 max-w-xl hidden sm:block">
          Watch AI pizza creation, then tap compare to see the best local deals from nearby pizza shops.
        </p>
      </div>

      {!videoFailed && (
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 flex items-center gap-2 sm:gap-3 z-20">
          <button onClick={togglePlay} aria-label={playing ? 'Pause video' : 'Play video'}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition hover:bg-black/50">
            {playing ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <button onClick={toggleMute} aria-label={muted ? 'Unmute video' : 'Mute video'}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition hover:bg-black/50">
            {muted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function HomeView({
  onCompare, onNavigate, currentConfig, onAddToCart, isPremium = false, onUpgrade, isLight = false,
}: HomeViewProps) {
  const { state, setSearch } = useApp();
  const [activeCity, setActiveCity] = useState('All');
  const [sheetStore, setSheetStore] = useState<MarketplaceStore | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
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

  const bentoPizzaCards: BentoCardData[] = [
    { color: '#1A0A0A', title: 'Compare Prices', description: 'See live quotes from every pizza chain near you — Dominos, Pizza Hut, Jets and more.', label: 'Compare', icon: '📊', accent: '#FF6B35', onClick: () => onCompare(DEFAULT_CONFIG) },
    { color: '#0F1020', title: 'AI Pizza Builder', description: 'Describe your perfect pizza in plain English and let AI configure it for you.', label: 'Build', icon: '🤖', accent: '#818CF8', onClick: () => onCompare(DEFAULT_CONFIG) },
    { color: '#120A18', title: 'Best Deals Near You', description: 'Michigan-exclusive flash deals, BOGO offers, and student discounts updated in real time from local pizzerias.', label: 'Deals', icon: '🏷️', accent: '#F59E0B', onClick: () => onNavigate('local-deals') },
    { color: '#071510', title: 'Local Michigan Stores', description: 'Discover independent pizzerias — Bunty\'s, Shamz, Motor City Slice and more hidden gems.', label: 'Discover', icon: '📍', accent: '#34D399', onClick: () => onNavigate('local-deals') },
    { color: '#15080A', title: 'Smart Search', description: 'Search by price, topping, delivery time or diet. MiSlice Pro unlocks AI-powered precision results.', label: 'Search', icon: '🔍', accent: '#F87171', onClick: () => {} },
    { color: '#0A0F18', title: 'Track Orders', description: 'Follow your order from oven to door with live status updates across all delivery platforms.', label: 'Track', icon: '🛵', accent: '#60A5FA', onClick: () => onNavigate('orders') },
  ];

  return (
    <div
      className="w-full flex-1 min-h-screen overflow-x-hidden text-white relative"
      style={isLight ? {
        background: '#f8f8f8',
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      } : { background: 'transparent' }}
    >
      {/* ── Live deal ticker ───────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5">
        <button
          onClick={() => onNavigate('local-deals')}
          className="w-full max-w-3xl mx-auto block"
        >
          <div className={`rounded-full border border-orange-500/30 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm shadow-[0_18px_40px_-24px_rgba(220,38,38,0.4)] transition ${isLight ? 'bg-white/80 backdrop-blur-sm text-gray-900 hover:bg-white' : 'bg-orange-500/10 text-white hover:bg-orange-500/20'}`}>
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-orange-500">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" /> Live
            </span>
            <div className="flex-1 overflow-hidden text-left">
              <AnimatePresence mode="wait">
                <motion.p key={tickerIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className={`font-semibold truncate ${isLight ? 'text-gray-700' : 'text-stone-200'}`}>
                  {DEAL_TICKER[tickerIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
            <ChevronRight className="w-4 h-4 text-orange-400" />
          </div>
        </button>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:py-12">
        <section className="grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start lg:items-center">

          {/* HeroVideo + MagicBento — shown first on mobile */}
          <div className="relative order-1 lg:order-2 -mx-4 sm:mx-0 flex flex-col gap-4 sm:gap-5">
            <HeroVideo />
            <MagicBento
              cards={bentoPizzaCards}
              textAutoHide={false}
              enableStars
              enableSpotlight
              enableBorderGlow
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
              spotlightRadius={350}
              particleCount={10}
              glowColor="220, 38, 38"
              disableAnimations={false}
            />
          </div>

          {/* Text + search + actions */}
          <div className="max-w-2xl order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/50 bg-orange-500/20 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-white shadow-[0_10px_30px_rgba(220,38,38,0.25)] mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-200" />
              Compare pizza prices in seconds
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02] ${isLight ? 'text-gray-900' : 'text-white'}`}
            >
              Find better pizza deals near you.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.45, ease: 'easeOut' }}
              className={`mt-4 sm:mt-6 text-base sm:text-lg max-w-xl leading-7 sm:leading-8 ${isLight ? 'text-gray-600' : 'text-blue-100'}`}
            >
              Compare prices, discover local pizza deals, and build pizza with AI — all from one fast, trustworthy marketplace.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.45, ease: 'easeOut' }}
              className="mt-5 sm:mt-10"
            >
              {isPremium ? (
                <SmartSearchBar onSearch={handleSearch} location={activeCity === 'All' ? 'Michigan' : `${activeCity}, MI`} />
              ) : (
                /* ── Locked search bar for free users ── */
                <div className="relative w-full max-w-3xl mx-auto">
                  {/* Blurred ghost of the real bar */}
                  <div className="pointer-events-none select-none blur-[3px] opacity-50">
                    <div className="flex items-center bg-white rounded-full border border-stone-100 px-5 py-3.5 gap-3"
                      style={{ boxShadow: '8px 8px 24px rgba(176,182,204,0.45), -8px -8px 22px rgba(255,255,255,0.95)' }}>
                      <Lock className="w-5 h-5 text-stone-300 shrink-0" />
                      <span className="flex-1 text-stone-400 text-sm font-medium">Search for pizza…</span>
                      <div className="bg-amber-100 text-amber-700 font-black text-sm rounded-full px-6 py-2.5">Search</div>
                    </div>
                  </div>

                  {/* Upgrade overlay */}
                  <button
                    onClick={() => setUpgradeOpen(true)}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-[0_8px_24px_rgba(251,146,60,0.5)] group-hover:shadow-[0_12px_32px_rgba(251,146,60,0.6)] transition-all"
                    >
                      <Crown className="w-4 h-4" />
                      Unlock Smart Search — MiSlice Pro
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                    <p className="text-white/60 text-xs font-medium">From $3.33/mo · Cancel any time</p>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </div>

      {/* ── Nearby stores reveal ───────────────────────────────────────────── */}
      <section ref={storesRef} className="relative z-10 w-full max-w-6xl mx-auto px-5 scroll-mt-6">
        <AnimatePresence mode="wait">
          {!showStores ? (
            <motion.div
              key="reveal-cta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[2rem] px-6 py-12 sm:py-16 text-center max-w-2xl mx-auto"
              style={{
                background: 'rgba(15,12,25,0.85)',
                border: '1px solid rgba(139,92,246,0.2)',
                boxShadow: '0 24px 80px -20px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5"
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(139,92,246,0.35)' }}>
                <MapPin className="w-6 h-6 text-violet-300" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Nearby Pizza Stores</h2>
              <p className="text-white/50 text-sm max-w-xs mx-auto mb-7 leading-relaxed">
                Browse open pizzerias across Michigan sorted by price and delivery time.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                onClick={revealStores}
                className="inline-flex items-center gap-2 font-black text-sm px-7 py-3.5 rounded-full transition"
                style={{
                  background: 'rgba(124,58,237,0.85)',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
                }}
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
              <div className="rounded-3xl p-5 sm:p-6 mb-8" style={{ background: 'rgba(18,15,28,0.9)', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-violet-300" />
                      Stores Near You
                    </h2>
                    <p className="text-[11px] text-white/50 mt-1">
                      {activeCity !== 'All' ? `${activeCity}, MI` : 'Michigan'} · {storeCount} open
                    </p>
                  </div>
                  <button
                    onClick={() => setShowStores(false)}
                    title="Close stores panel"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                          ? 'text-white'
                          : 'text-white/50 hover:text-white/80'
                      }`}
                      style={activeCity === city.value ? {
                        background: 'rgba(124,58,237,0.5)',
                        border: '1px solid rgba(139,92,246,0.5)',
                      } : {
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
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
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Map className="w-4 h-4 text-blue-200" /> Pizza Map
                    <span className="text-[8px] font-black clay-inset text-white px-2 py-0.5 rounded-full">LIVE</span>
                  </h2>
                  <button
                    onClick={() => setMapExpanded(e => !e)}
                    className="flex items-center gap-1 text-[11px] font-bold text-white hover:text-blue-100 transition-colors"
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
                      className="overflow-hidden rounded-3xl clay bg-blue-900/40 border border-blue-500/30"
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
                      className="clay-inset w-full h-28 rounded-3xl flex items-center justify-center gap-3 text-blue-200 hover:text-blue-50 transition-colors group bg-blue-500/20 border border-blue-400/30"
                    >
                      <Map className="w-5 h-5 group-hover:text-orange-300 transition-colors" />
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

      <PremiumUpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onSubscribe={() => { setUpgradeOpen(false); onUpgrade?.(); }}
      />

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
