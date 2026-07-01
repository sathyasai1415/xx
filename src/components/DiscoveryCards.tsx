import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Zap, DollarSign, Star, Leaf, ChevronRight, Clock, ArrowRight, Heart, ShoppingCart } from 'lucide-react';
import { RECOMMENDATION_SLICES, MarketplaceStore } from '../data/marketplace';
import { useApp } from '../store/AppContext';
import BorderGlow from './BorderGlow';

interface DiscoveryCardsProps {
  onSearch: (query: string) => void;
  onNavigate: (view: string) => void;
}

const CARDS = [
  {
    id: 'mostOrdered',
    icon: Flame,
    label: 'Most Ordered Tonight',
    sublabel: `${RECOMMENDATION_SLICES.mostOrdered()[0]?.name} & more`,
    gradient: 'from-red-500/18 to-red-500/8',
    border: 'border-red-500/22',
    accent: 'text-red-400',
    iconBg: 'bg-red-500/12',
    dot: 'bg-red-400',
    query: 'most popular pizza',
    getStores: () => RECOMMENDATION_SLICES.mostOrdered(),
  },
  {
    id: 'fastest',
    icon: Zap,
    label: 'Delivered in Under 20 Mins',
    sublabel: `${RECOMMENDATION_SLICES.fastest()[0]?.deliveryTime} min avg`,
    gradient: 'from-red-500/18 to-red-400/8',
    border: 'border-yellow-500/22',
    accent: 'text-yellow-400',
    iconBg: 'bg-yellow-500/12',
    dot: 'bg-yellow-400',
    query: 'fastest delivery pizza',
    getStores: () => RECOMMENDATION_SLICES.fastest(),
  },
  {
    id: 'bestDeals',
    icon: DollarSign,
    label: 'Best Deals Near You',
    sublabel: `${RECOMMENDATION_SLICES.bestDeals().reduce((acc, s) => acc + s.deals.length, 0)} active deals`,
    gradient: 'from-green-500/18 to-emerald-500/8',
    border: 'border-green-500/22',
    accent: 'text-green-400',
    iconBg: 'bg-green-500/12',
    dot: 'bg-green-400',
    query: 'best pizza deals',
    getStores: () => RECOMMENDATION_SLICES.bestDeals(),
  },
  {
    id: 'topRated',
    icon: Star,
    label: 'Highest Rated',
    sublabel: `${RECOMMENDATION_SLICES.topRated()[0]?.rating}★ avg top 5`,
    gradient: 'from-blue-500/18 to-indigo-500/8',
    border: 'border-blue-500/22',
    accent: 'text-blue-400',
    iconBg: 'bg-blue-500/12',
    dot: 'bg-blue-400',
    query: 'best rated pizza',
    getStores: () => RECOMMENDATION_SLICES.topRated(),
  },
  {
    id: 'vegan',
    icon: Leaf,
    label: 'Vegan Favorites',
    sublabel: `${RECOMMENDATION_SLICES.vegan().length} plant-based stores`,
    gradient: 'from-emerald-500/18 to-green-500/8',
    border: 'border-emerald-500/22',
    accent: 'text-emerald-400',
    iconBg: 'bg-emerald-500/12',
    dot: 'bg-emerald-400',
    query: 'vegan pizza near me',
    getStores: () => RECOMMENDATION_SLICES.vegan(),
  },
];

function StoreRow({ store, accent }: { store: MarketplaceStore; accent: string }) {
  const { toggleFavorite, state, showToast } = useApp();
  const isFav = state.favoriteStoreIds.has(store.id);
  return (
    <div className="flex items-center gap-3 py-2 group">
      <div className={`w-9 h-9 ${store.logoColor} rounded-xl flex items-center justify-center text-base shrink-0 overflow-hidden`}>
        {store.id === 'shamz' ? <img src="/shamz-pizza-store.png" className="w-full h-full object-cover" /> : store.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{store.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-0.5 text-[9px] text-yellow-400 font-bold">
            <Star className="w-2.5 h-2.5 fill-current" />{store.rating}
          </span>
          <span className="text-[9px] text-stone-600">·</span>
          <span className="text-[9px] text-stone-500 flex items-center gap-0.5">
            <Clock className="w-2 h-2" />{store.deliveryTime}m
          </span>
          {store.deliveryFee === 0 && <span className="text-[9px] text-green-400 font-bold">Free</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <p className={`text-xs font-black ${accent}`}>
          ${store.menu.filter(m => m.category === 'pizza')[0]?.price.toFixed(2) || '--'}
        </p>
        <button
          onClick={() => { toggleFavorite(store.id); showToast(isFav ? 'Removed' : `${store.name} saved!`); }}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${isFav ? 'bg-red-600/20 text-red-400' : 'bg-white/8 text-stone-500 hover:text-red-400'}`}
        >
          <Heart className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}

export function DiscoveryCards({ onSearch, onNavigate }: DiscoveryCardsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-black uppercase tracking-widest text-stone-500">Discover</p>
        <button onClick={() => onNavigate('local-deals')} className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
          See all deals <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          const isExpanded = expanded === card.id;
          const stores = card.getStores();

          return (
            <BorderGlow key={card.id} backgroundColor="transparent" glowColor="20 70 65" colors={['#FF6B35','#DC2626','#F97316']} borderRadius={16} glowIntensity={0.9} edgeSensitivity={20}>
            <motion.div
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 280, damping: 26 }}
              className={`bg-gradient-to-br ${card.gradient} backdrop-blur-xl rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform`}
              onClick={() => toggle(card.id)}
            >
              <div className="flex items-center gap-3 p-4">
                <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center shrink-0 border ${card.border}`}>
                  <Icon className={`w-5 h-5 ${card.accent}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white leading-tight">{card.label}</p>
                  <p className={`text-[10px] font-bold ${card.accent} mt-0.5`}>{card.sublabel}</p>
                </div>
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </motion.div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    className="overflow-hidden"
                  >
                    <div className={`border-t ${card.border} px-4 py-3 space-y-0 divide-y divide-white/5`}>
                      {stores.slice(0, 4).map(store => (
                        <StoreRow key={store.id} store={store} accent={card.accent} />
                      ))}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSearch(card.query); }}
                        className={`w-full pt-3 flex items-center justify-center gap-2 text-xs font-black ${card.accent} hover:opacity-80 transition-opacity`}
                      >
                        See All {stores.length} Stores <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            </BorderGlow>
          );
        })}
      </div>
    </div>
  );
}
