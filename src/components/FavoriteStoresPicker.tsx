import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Check, Star, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { mockChains } from '../lib/pricing';

const MAX_FAVORITES = 5;

// Static metadata to enrich the store list in the picker
const STORE_META: Record<string, { emoji: string; tagline: string; specialty: string }> = {
  'dominos':      { emoji: '🍕', tagline: 'Fast & reliable',         specialty: 'Brooklyn Style' },
  'papa-johns':   { emoji: '🧄', tagline: 'Better ingredients',      specialty: 'Garlic sauce' },
  'pizza-hut':    { emoji: '🏠', tagline: 'Pan pizza icons',         specialty: 'Stuffed Crust' },
  'jets-pizza':   { emoji: '✈️', tagline: 'Detroit-style deep dish', specialty: 'Square deep dish' },
  'marcos-pizza': { emoji: '🌿', tagline: 'Fresh never frozen',      specialty: 'Fresh-cut veggies' },
};

const COLOR_MAP: Record<string, string> = {
  'bg-blue-600':  'bg-blue-600',
  'bg-green-700': 'bg-green-700',
  'bg-red-600':   'bg-red-600',
  'bg-orange-600':'bg-orange-600',
  'bg-blue-700':  'bg-blue-700',
};

interface FavoriteStoresPickerProps {
  favoriteStores: string[];
  onToggle: (storeId: string) => void;
}

export function FavoriteStoresPicker({ favoriteStores, onToggle }: FavoriteStoresPickerProps) {
  const count = favoriteStores.length;
  const atMax = count >= MAX_FAVORITES;

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center">
            <Heart className="w-5 h-5 text-red-400 fill-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Favorite Stores</h2>
            <p className="text-stone-400 text-sm">Pick up to {MAX_FAVORITES} stores you love ordering from.</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{count} of {MAX_FAVORITES} selected</span>
            {atMax && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full"
              >
                Max reached
              </motion.span>
            )}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full"
              animate={{ width: `${(count / MAX_FAVORITES) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
          </div>
        </div>
      </div>

      {/* How this helps callout */}
      <div className="mb-6 bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl px-4 py-3.5 flex gap-3 items-start">
        <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-black text-violet-300 mb-0.5">How favorites work in Compare</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            When you build a pizza, switch to <span className="text-white font-bold">Favorites mode</span> to compare only your top stores.
            If a cheaper option exists outside your favorites, MiSlice will alert you automatically.
          </p>
        </div>
      </div>

      {/* Store grid */}
      <div className="space-y-3">
        {mockChains.map((store, idx) => {
          const isFav = favoriteStores.includes(store.id);
          const meta = STORE_META[store.id];
          const disabled = atMax && !isFav;

          return (
            <motion.button
              key={store.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onToggle(store.id)}
              disabled={disabled}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left group relative
                ${isFav
                  ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                  : disabled
                    ? 'bg-white/3 border-white/5 opacity-40 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                }`}
            >
              {/* Store avatar */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl ${COLOR_MAP[store.color] ?? 'bg-stone-600'}`}>
                {meta?.emoji ?? '🍕'}
              </div>

              {/* Store info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-black text-white">{store.name}</p>
                  {isFav && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[10px] font-black text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full border border-red-500/30"
                    >
                      FAVORITE
                    </motion.span>
                  )}
                </div>
                <p className="text-xs text-stone-500 font-medium">{meta?.tagline ?? 'Local pizza'}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-stone-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {store.distance}
                  </span>
                  {meta?.specialty && (
                    <span className="text-[11px] text-violet-400/80 font-medium">★ {meta.specialty}</span>
                  )}
                </div>
              </div>

              {/* Toggle indicator */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                ${isFav ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 'bg-white/10 group-hover:bg-white/20'}`}
              >
                <AnimatePresence mode="wait">
                  {isFav ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </motion.div>
                  ) : (
                    <motion.div key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Heart className="w-4 h-4 text-stone-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Tip at bottom */}
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-stone-500 font-medium">
            Go to <span className="text-white font-bold">Compare Prices</span> → select <span className="text-red-400 font-bold">My {count} Favorite{count !== 1 ? 's' : ''}</span> to compare only your preferred stores.
          </p>
        </motion.div>
      )}
    </div>
  );
}
