import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, ChevronDown, X, Check, Clock, Star, MapPin, DollarSign, Leaf, Zap, RotateCcw } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { StoreFilters, PriceRange, DietaryTag } from '../data/marketplace';

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}
function Chip({ active, onClick, children, color = 'red' }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
        active
          ? `bg-${color}-600 border-${color}-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]`
          : 'bg-white/6 border-white/10 text-stone-400 hover:text-white hover:border-white/25'
      }`}
    >
      {children}
    </button>
  );
}

export function FilterBar() {
  const { state, setFilter, resetFilters } = useApp();
  const { filters, searchResults } = state;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeCount = [
    filters.openNow,
    filters.freeDelivery,
    filters.maxDeliveryTime !== null,
    filters.minRating !== null,
    filters.maxDistance !== null,
    filters.priceRanges.length > 0,
    filters.dietary.length > 0,
  ].filter(Boolean).length;

  const togglePrice = (p: PriceRange) => {
    const has = filters.priceRanges.includes(p);
    setFilter({ priceRanges: has ? filters.priceRanges.filter(x => x !== p) : [...filters.priceRanges, p] });
  };
  const toggleDietary = (d: DietaryTag) => {
    const has = filters.dietary.includes(d);
    setFilter({ dietary: has ? filters.dietary.filter(x => x !== d) : [...filters.dietary, d] });
  };

  const sortOptions: { label: string; value: StoreFilters['sortBy'] }[] = [
    { label: 'Recommended', value: 'recommended' },
    { label: 'Fastest', value: 'speed' },
    { label: 'Top Rated', value: 'rating' },
    { label: 'Cheapest', value: 'price' },
    { label: 'Closest', value: 'distance' },
    { label: 'Trending', value: 'trending' },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Main filter row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {/* Results count + advanced button */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 ${showAdvanced ? 'bg-red-600 border-red-500 text-white' : 'bg-white/6 border-white/10 text-stone-400 hover:text-white'}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="bg-white text-red-600 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">{activeCount}</span>
          )}
        </button>

        <div className="w-px h-5 bg-white/10 shrink-0" />

        {/* Sort */}
        {sortOptions.map(opt => (
          <Chip key={opt.value} active={filters.sortBy === opt.value} onClick={() => setFilter({ sortBy: opt.value })}>
            {opt.label}
          </Chip>
        ))}

        <div className="w-px h-5 bg-white/10 shrink-0" />

        {/* Quick filters */}
        <Chip active={filters.openNow} onClick={() => setFilter({ openNow: !filters.openNow })} color="green">
          <div className={`w-1.5 h-1.5 rounded-full ${filters.openNow ? 'bg-white' : 'bg-green-500'}`} />
          Open Now
        </Chip>

        <Chip active={filters.freeDelivery} onClick={() => setFilter({ freeDelivery: !filters.freeDelivery })}>
          🚗 Free Delivery
        </Chip>

        <Chip active={filters.maxDeliveryTime === 20} onClick={() => setFilter({ maxDeliveryTime: filters.maxDeliveryTime === 20 ? null : 20 })}>
          <Zap className="w-3 h-3" /> Under 20 Min
        </Chip>

        <Chip active={filters.minRating === 4.5} onClick={() => setFilter({ minRating: filters.minRating === 4.5 ? null : 4.5 })}>
          <Star className="w-3 h-3 fill-current" /> 4.5+
        </Chip>

        <Chip active={filters.dietary.includes('vegan')} onClick={() => toggleDietary('vegan')} color="green">
          🌱 Vegan
        </Chip>

        <Chip active={filters.dietary.includes('halal')} onClick={() => toggleDietary('halal')}>
          🥩 Halal
        </Chip>

        {activeCount > 0 && (
          <button onClick={resetFilters} className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 px-2 py-1.5 shrink-0 transition-colors">
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Advanced panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
              {/* Price range */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Price</p>
                <div className="flex gap-1.5">
                  {(['$', '$$', '$$$'] as PriceRange[]).map(p => (
                    <button
                      key={p}
                      onClick={() => togglePrice(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${filters.priceRanges.includes(p) ? 'bg-red-600 border-red-500 text-white' : 'bg-white/5 border-white/10 text-stone-400 hover:text-white'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Distance</p>
                <div className="flex flex-col gap-1">
                  {[{ label: '< 1 mi', val: 1 }, { label: '< 2 mi', val: 2 }, { label: '< 5 mi', val: 5 }].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setFilter({ maxDistance: filters.maxDistance === opt.val ? null : opt.val })}
                      className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-bold transition-all ${filters.maxDistance === opt.val ? 'text-red-400 bg-red-500/10' : 'text-stone-500 hover:text-white'}`}
                    >
                      <MapPin className="w-3 h-3" /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery time */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Delivery Time</p>
                <div className="flex flex-col gap-1">
                  {[{ label: '< 20 min', val: 20 }, { label: '< 30 min', val: 30 }, { label: '< 45 min', val: 45 }].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setFilter({ maxDeliveryTime: filters.maxDeliveryTime === opt.val ? null : opt.val })}
                      className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-bold transition-all ${filters.maxDeliveryTime === opt.val ? 'text-red-400 bg-red-500/10' : 'text-stone-500 hover:text-white'}`}
                    >
                      <Clock className="w-3 h-3" /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Min Rating</p>
                <div className="flex flex-col gap-1">
                  {[4.5, 4.0, 3.5].map(r => (
                    <button
                      key={r}
                      onClick={() => setFilter({ minRating: filters.minRating === r ? null : r })}
                      className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-bold transition-all ${filters.minRating === r ? 'text-red-400 bg-red-500/10' : 'text-stone-500 hover:text-white'}`}
                    >
                      <Star className="w-3 h-3 fill-current text-yellow-500" /> {r}+
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-stone-500 font-bold">
          <span className="text-white">{searchResults.length}</span> stores
          {state.searchQuery && <> for "<span className="text-red-400">{state.searchQuery}</span>"</>}
        </p>
        {activeCount > 0 && (
          <p className="text-[10px] text-stone-600 font-bold">{activeCount} filter{activeCount > 1 ? 's' : ''} active</p>
        )}
      </div>
    </div>
  );
}
