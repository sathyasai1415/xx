import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart, Heart, Sparkles, RotateCcw, ChevronRight,
  Star, Clock, ExternalLink, Zap, Award, TrendingDown, Check, Plus, Minus,
  ChevronDown,
} from 'lucide-react';
import { PizzaConfig, Size, Crust, Sauce, CartItem } from '../types';
import { Pizza3DBuilder } from './Pizza3DBuilder';
import { MARKETPLACE_STORES } from '../data/marketplace';

// ── Static data ───────────────────────────────────────────────────────────────

const SIZES: { value: Size; label: string; inch: string; base: number; ring: string; glow: string; desc: string }[] = [
  { value: 'Small',       label: 'S',  inch: '8"',  base: 7.99,  ring: 'ring-sky-400',    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.5)]',  desc: 'Serves 1-2' },
  { value: 'Medium',      label: 'M',  inch: '10"', base: 11.99, ring: 'ring-violet-400', glow: 'shadow-[0_0_20px_rgba(167,139,250,0.5)]', desc: 'Serves 2-3' },
  { value: 'Large',       label: 'L',  inch: '12"', base: 14.99, ring: 'ring-red-400', glow: 'shadow-[0_0_20px_rgba(220,38,38,0.5)]',  desc: 'Serves 3-4' },
  { value: 'Extra Large', label: 'XL', inch: '14"', base: 17.99, ring: 'ring-red-500',    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',   desc: 'Serves 4-6' },
];

const CRUSTS: { value: Crust; emoji: string; desc: string; upcharge?: number }[] = [
  { value: 'Hand Tossed',           emoji: '👋', desc: 'Classic & Airy' },
  { value: 'Crunchy Thin Crust',    emoji: '✂️', desc: 'Light & Crispy' },
  { value: 'Handmade Pan',          emoji: '🍳', desc: 'Thick & Chewy' },
  { value: 'Parmesan Stuffed Crust',emoji: '🧀', desc: 'Extra Cheesy',  upcharge: 3.00 },
  { value: 'Brooklyn Style',        emoji: '🗽', desc: 'NY Foldable' },
  { value: 'New York Style',        emoji: '🍕', desc: 'Authentic NY' },
  { value: 'Gluten Free Crust',     emoji: '🌾', desc: 'GF Friendly',   upcharge: 2.00 },
];

const CRUST_FLAVORS: { value: string; emoji: string; desc: string }[] = [
  { value: 'None',              emoji: '⬜', desc: 'Classic crust' },
  { value: 'Garlic Butter',     emoji: '🧄', desc: 'Rich & savory' },
  { value: 'Parmesan',          emoji: '🧀', desc: 'Aged & nutty' },
  { value: 'Garlic Butter & Herb', emoji: '🫙', desc: 'Herbaceous' },
  { value: 'Butter Parmesan',   emoji: '✨', desc: 'Buttery finish' },
  { value: 'Italian Herb',      emoji: '🌿', desc: 'Mediterranean' },
  { value: 'Sweet Chili',       emoji: '🌶️', desc: 'Sweet heat' },
  { value: 'Cajun',             emoji: '🔥', desc: 'Spicy kick' },
];

const SAUCES: { value: Sauce; color: string; label: string; short: string }[] = [
  { value: 'Robust Inspired Tomato Sauce', color: 'bg-red-600',    label: 'Robust Tomato',   short: 'Tomato'  },
  { value: 'Hearty Marinara',              color: 'bg-red-800',    label: 'Hearty Marinara', short: 'Marinara'},
  { value: 'BBQ Sauce',                    color: 'bg-red-700',  label: 'BBQ Sauce',       short: 'BBQ'     },
  { value: 'Garlic Parmesan White Sauce',  color: 'bg-red-200',  label: 'Garlic Parmesan', short: 'White'   },
  { value: 'Alfredo Sauce',               color: 'bg-yellow-100', label: 'Alfredo',         short: 'Alfredo' },
  { value: 'Buffalo Sauce',               color: 'bg-red-500', label: 'Buffalo Hot',     short: 'Buffalo' },
  { value: 'Ranch Sauce',                 color: 'bg-stone-200',  label: 'Ranch',           short: 'Ranch'   },
  { value: 'No Sauce',                    color: 'bg-stone-800',  label: 'No Sauce',        short: 'None'    },
];

const SAUCE_AMOUNTS = ['Light', 'Normal', 'Extra'] as const;
const CHEESE_AMOUNTS = ['None', 'Light', 'Normal', 'Extra'] as const;

const TOPPINGS: { label: string; emoji: string; category: 'meat' | 'veggie' | 'cheese'; color: string; price?: number }[] = [
  // Meats
  { label: 'Pepperoni',       emoji: '🍕', category: 'meat',   color: 'border-red-500/50 bg-red-500/10 text-red-300' },
  { label: 'Italian Sausage', emoji: '🌭', category: 'meat',   color: 'border-red-500/50 bg-red-500/10 text-red-300' },
  { label: 'Beef',            emoji: '🥩', category: 'meat',   color: 'border-red-600/50 bg-red-600/10 text-red-300' },
  { label: 'Ham',             emoji: '🍖', category: 'meat',   color: 'border-pink-500/50 bg-pink-500/10 text-pink-300' },
  { label: 'Bacon',           emoji: '🥓', category: 'meat',   color: 'border-red-400/50 bg-red-400/10 text-red-200' },
  { label: 'Grilled Chicken', emoji: '🍗', category: 'meat',   color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' },
  { label: 'Premium Chicken', emoji: '🐔', category: 'meat',   color: 'border-yellow-400/50 bg-yellow-400/10 text-yellow-200' },
  { label: 'Philly Steak',    emoji: '🥩', category: 'meat',   color: 'border-red-700/50 bg-red-700/10 text-red-400' },
  { label: 'Salami',          emoji: '🫓', category: 'meat',   color: 'border-red-600/50 bg-red-600/10 text-red-300' },
  { label: 'Anchovies',       emoji: '🐟', category: 'meat',   color: 'border-blue-500/50 bg-blue-500/10 text-blue-300' },
  // Veggies
  { label: 'Mushrooms',            emoji: '🍄', category: 'veggie', color: 'border-stone-500/50 bg-stone-500/10 text-stone-300' },
  { label: 'Onions',               emoji: '🧅', category: 'veggie', color: 'border-purple-500/50 bg-purple-500/10 text-purple-300' },
  { label: 'Green Peppers',        emoji: '🫑', category: 'veggie', color: 'border-green-500/50 bg-green-500/10 text-green-300' },
  { label: 'Black Olives',         emoji: '🫒', category: 'veggie', color: 'border-stone-600/50 bg-stone-600/10 text-stone-400' },
  { label: 'Spinach',              emoji: '🥬', category: 'veggie', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' },
  { label: 'Tomatoes',             emoji: '🍅', category: 'veggie', color: 'border-red-400/50 bg-red-400/10 text-red-200' },
  { label: 'Banana Peppers',       emoji: '🌶️', category: 'veggie', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' },
  { label: 'Jalapenos',            emoji: '🌶️', category: 'veggie', color: 'border-green-600/50 bg-green-600/10 text-green-400' },
  { label: 'Pineapple',            emoji: '🍍', category: 'veggie', color: 'border-yellow-400/50 bg-yellow-400/10 text-yellow-200' },
  { label: 'Roasted Red Peppers',  emoji: '🌶️', category: 'veggie', color: 'border-red-500/50 bg-red-500/10 text-red-300' },
  { label: 'Sun-dried Tomatoes',   emoji: '☀️', category: 'veggie', color: 'border-red-600/50 bg-red-600/10 text-red-300' },
  { label: 'Green Chile Peppers',  emoji: '🫑', category: 'veggie', color: 'border-lime-500/50 bg-lime-500/10 text-lime-300' },
  { label: 'Diced Garlic',         emoji: '🧄', category: 'veggie', color: 'border-red-300/50 bg-red-300/10 text-red-200' },
  { label: 'Kalamata Olives',      emoji: '🫒', category: 'veggie', color: 'border-purple-600/50 bg-purple-600/10 text-purple-400' },
  // Cheese
  { label: 'Mozzarella',           emoji: '🧀', category: 'cheese', color: 'border-yellow-300/50 bg-yellow-300/10 text-yellow-200' },
  { label: 'Extra Cheese',         emoji: '🧀', category: 'cheese', color: 'border-red-400/50 bg-red-400/10 text-red-200' },
  { label: 'Cheddar Blend',        emoji: '🧀', category: 'cheese', color: 'border-red-400/50 bg-red-400/10 text-red-200' },
  { label: 'Feta',                 emoji: '🧀', category: 'cheese', color: 'border-stone-300/50 bg-stone-300/10 text-stone-200' },
  { label: 'Provolone',            emoji: '🧀', category: 'cheese', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' },
  { label: 'Parm Asiago Blend',    emoji: '🧀', category: 'cheese', color: 'border-red-300/50 bg-red-300/10 text-red-100' },
];

const DRIZZLES: { label: string; emoji: string; color: string }[] = [
  { label: 'Garlic Parmesan Drizzle',   emoji: '🧄', color: 'border-red-200/50 bg-red-200/8 text-red-200'   },
  { label: 'BBQ Drizzle',               emoji: '🎖', color: 'border-red-700/50 bg-red-700/8 text-red-400'   },
  { label: 'Buffalo Drizzle',           emoji: '🌶️', color: 'border-red-500/50 bg-red-500/8 text-red-300'},
  { label: 'Ranch Drizzle',             emoji: '🥗', color: 'border-stone-300/50 bg-stone-300/8 text-stone-300'   },
  { label: 'Italian Herb Drizzle',      emoji: '🌿', color: 'border-green-500/50 bg-green-500/8 text-green-300'   },
  { label: 'Mango Habanero Drizzle',    emoji: '🥭', color: 'border-yellow-500/50 bg-yellow-500/8 text-yellow-300'},
  { label: 'Balsamic Glaze',            emoji: '✨', color: 'border-purple-500/50 bg-purple-500/8 text-purple-300' },
  { label: 'Hot Honey',                 emoji: '🍯', color: 'border-red-400/50 bg-red-400/8 text-red-300'   },
];

const AI_SUGGESTIONS = [
  { label: '🔥 Most Popular', config: { meats: ['Pepperoni'], veggies: [], cheese: ['Mozzarella', 'Extra Cheese'] } },
  { label: '🥩 Meat Lover',   config: { meats: ['Pepperoni', 'Italian Sausage', 'Beef', 'Bacon'], veggies: [], cheese: ['Mozzarella'] } },
  { label: '🌱 Veggie Delight',config: { meats: [], veggies: ['Mushrooms', 'Onions', 'Green Peppers', 'Spinach'], cheese: ['Mozzarella', 'Feta'] } },
  { label: '🔥 Spicy Fire',   config: { meats: ['Pepperoni', 'Italian Sausage'], veggies: ['Jalapenos', 'Banana Peppers'], cheese: ['Mozzarella'] } },
];

type Placement = 'whole' | 'left' | 'right';

function computeStorePrice(store: typeof MARKETPLACE_STORES[0], config: PizzaConfig): number {
  const base = store.menu.find(m => m.category === 'pizza')?.price ?? 13.99;
  const sizeMult = config.size === 'Small' ? 0.75 : config.size === 'Medium' ? 0.9 : config.size === 'Extra Large' ? 1.25 : 1;
  const toppings = (config.meats?.length || 0) * 1.5 + (config.veggies?.length || 0) * 0.8;
  return parseFloat((base * sizeMult + toppings).toFixed(2));
}

// ── Animated price counter ─────────────────────────────────────────────────────
function AnimatedPrice({ value, className = '' }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (Math.abs(value - prev.current) < 0.01) return;
    const start = prev.current;
    const end = value;
    const dur = 400;
    const startTime = performance.now();
    const frame = (now: number) => {
      const t = Math.min((now - startTime) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(parseFloat((start + (end - start) * eased).toFixed(2)));
      if (t < 1) requestAnimationFrame(frame);
      else prev.current = end;
    };
    requestAnimationFrame(frame);
  }, [value]);

  return <span className={className}>${display.toFixed(2)}</span>;
}

// ── Amount pill selector ───────────────────────────────────────────────────────
function AmountPills<T extends string>({ options, value, onChange, label }: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mt-2.5">
      <span className="text-[10px] font-bold text-stone-500 shrink-0 w-16">{label}</span>
      <div className="flex gap-1.5 bg-white/5 border border-white/8 p-1 rounded-xl">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
              value === opt
                ? 'bg-white/20 text-white'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Placement toggle ──────────────────────────────────────────────────────────
function PlacementToggle({ value, onChange }: { value: Placement; onChange: (v: Placement) => void }) {
  const opts: { v: Placement; icon: string }[] = [
    { v: 'left',  icon: '◧' },
    { v: 'whole', icon: '⬛' },
    { v: 'right', icon: '◨' },
  ];
  return (
    <div className="flex gap-0.5 bg-white/5 border border-white/8 rounded-lg p-0.5">
      {opts.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          title={o.v.charAt(0).toUpperCase() + o.v.slice(1)}
          className={`px-1.5 py-0.5 rounded text-[11px] transition-all font-bold ${
            value === o.v ? 'bg-white/20 text-white' : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

// ── Topping Bubble ─────────────────────────────────────────────────────────────
const ToppingBubble: React.FC<{
  topping: typeof TOPPINGS[0];
  selected: boolean;
  onToggle: () => void;
}> = function ToppingBubble({ topping, selected, onToggle }) {
  return (
    <motion.button
      layout
      whileHover={{ y: -3, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all duration-200 ${
        selected
          ? `${topping.color} ring-1 ring-current shadow-lg scale-105`
          : 'border-white/10 bg-white/4 text-stone-400 hover:border-white/20 hover:text-stone-200'
      }`}
    >
      <span className="text-sm">{topping.emoji}</span>
      <span className="whitespace-nowrap">{topping.label}</span>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-3.5 h-3.5 rounded-full bg-current flex items-center justify-center ml-0.5"
        >
          <Check className="w-2 h-2 text-black" />
        </motion.span>
      )}
      {selected && topping.category !== 'cheese' && (
        <span className="text-[10px] text-stone-500 ml-0.5">+$1.50</span>
      )}
    </motion.button>
  );
}

// ── Store Price Row ────────────────────────────────────────────────────────────
const StorePriceRow: React.FC<{
  store: typeof MARKETPLACE_STORES[0];
  price: number;
  rank: number;
  onOrder: () => void;
}> = function StorePriceRow({ store, price, rank, onOrder }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl border transition-all ${
        rank === 0
          ? 'bg-green-500/8 border-green-500/25 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
          : 'bg-white/4 border-white/8 hover:border-white/15'
      }`}
    >
      <span className={`text-[10px] font-black w-5 text-center shrink-0 ${rank === 0 ? 'text-green-400' : 'text-stone-600'}`}>
        #{rank + 1}
      </span>
      <div className={`w-8 h-8 ${store.logoColor} rounded-xl flex items-center justify-center text-sm shrink-0 overflow-hidden`}>
        {store.id === 'shamz'
          ? <img src="/shamz-pizza-store.png" className="w-full h-full object-cover" alt="" />
          : store.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{store.name}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-yellow-400">★{store.rating}</span>
          <span className="text-stone-700">·</span>
          <span className="text-[9px] text-stone-500 flex items-center gap-0.5">
            <Clock className="w-2 h-2" />{store.deliveryTime}m
          </span>
          {store.deliveryFee === 0 && <span className="text-[9px] text-green-400 font-bold">Free</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <AnimatedPrice value={price} className={`text-sm font-black ${rank === 0 ? 'text-green-400' : 'text-white'}`} />
        {rank === 0 && <p className="text-[8px] text-green-500 font-bold">LOWEST</p>}
      </div>
      <button
        onClick={onOrder}
        className={`text-[9px] font-black px-2 py-1.5 rounded-lg border shrink-0 transition-all hover:scale-105 ${
          rank === 0
            ? 'bg-green-600 border-green-500 text-white'
            : 'bg-white/5 border-white/10 text-stone-300 hover:border-white/25'
        }`}
      >
        Order
      </button>
    </motion.div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-white/6 to-white/2 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">{title}</p>
        {badge && (
          <span className="text-[8px] font-black bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Main Builder ───────────────────────────────────────────────────────────────

interface PremiumPizzaBuilderProps {
  onConfigChange: (config: PizzaConfig) => void;
  currentConfig: PizzaConfig;
  onSaveFavorite: (config: PizzaConfig) => void;
  onAddToCart?: (item: Omit<CartItem, 'id'>, redirect: boolean) => void;
  defaultOpen?: boolean;
  userPreferences?: { isVegetarian: boolean; allowedMeats: string[] } | null;
}

const DEFAULT: PizzaConfig = {
  size: 'Large',
  crust: 'Hand Tossed',
  crustFlavor: 'None',
  sauce: 'Robust Inspired Tomato Sauce',
  sauceAmount: 'Normal',
  cheeseAmount: 'Normal',
  cheese: ['Mozzarella'],
  meats: [],
  veggies: [],
  extras: [],
  drizzles: [],
  toppingPlacements: {},
  quantity: 1,
};

export function PremiumPizzaBuilder({ onConfigChange, currentConfig, onSaveFavorite, onAddToCart }: PremiumPizzaBuilderProps) {
  const config: PizzaConfig = {
    ...DEFAULT,
    ...currentConfig,
    size: currentConfig.size || 'Large',
    crust: currentConfig.crust || 'Hand Tossed',
    crustFlavor: currentConfig.crustFlavor || 'None',
    sauce: currentConfig.sauce || 'Robust Inspired Tomato Sauce',
    sauceAmount: currentConfig.sauceAmount || 'Normal',
    cheeseAmount: currentConfig.cheeseAmount || 'Normal',
    cheese: currentConfig.cheese?.length ? currentConfig.cheese : ['Mozzarella'],
    drizzles: currentConfig.drizzles || [],
    toppingPlacements: currentConfig.toppingPlacements || {},
  };

  const [qty, setQty] = useState(config.quantity || 1);
  const [addedPulse, setAddedPulse] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'meat' | 'veggie' | 'cheese'>('meat');

  const sizeData = SIZES.find(s => s.value === config.size) || SIZES[2];
  const crustData = CRUSTS.find(c => c.value === config.crust);
  const basePrice = sizeData.base + (crustData?.upcharge || 0);
  const toppingPrice = (config.meats.length + config.veggies.length) * 1.5 + config.cheese.length * 0.5;
  const drizzlePrice = (config.drizzles?.length || 0) * 0.75;
  const cheeseUpcharge = config.cheeseAmount === 'Extra' ? 1.5 : config.cheeseAmount === 'None' ? -1.0 : 0;
  const totalPerPizza = basePrice + toppingPrice + drizzlePrice + cheeseUpcharge;
  const grandTotal = totalPerPizza * qty;

  const allSelected = [...config.meats, ...config.veggies, ...config.cheese];

  const storePrices = MARKETPLACE_STORES
    .filter(s => s.isOpen)
    .map(s => ({ store: s, price: computeStorePrice(s, config) }))
    .sort((a, b) => a.price - b.price)
    .slice(0, 6);

  const cheapestStorePrice = storePrices[0]?.price || grandTotal;

  const update = (partial: Partial<PizzaConfig>) => {
    const next = { ...config, ...partial, quantity: qty };
    onConfigChange(next);
  };

  const toggleTopping = (t: typeof TOPPINGS[0]) => {
    if (t.category === 'meat') {
      const cur = config.meats;
      const next = cur.includes(t.label) ? cur.filter(x => x !== t.label) : [...cur, t.label];
      const placements = { ...config.toppingPlacements };
      if (!next.includes(t.label)) delete placements[t.label];
      else placements[t.label] = 'whole';
      update({ meats: next, toppingPlacements: placements });
    } else if (t.category === 'veggie') {
      const cur = config.veggies;
      const next = cur.includes(t.label) ? cur.filter(x => x !== t.label) : [...cur, t.label];
      const placements = { ...config.toppingPlacements };
      if (!next.includes(t.label)) delete placements[t.label];
      else placements[t.label] = 'whole';
      update({ veggies: next, toppingPlacements: placements });
    } else {
      const cur = config.cheese;
      update({ cheese: cur.includes(t.label) ? cur.filter(x => x !== t.label) : [...cur, t.label] });
    }
  };

  const toggleDrizzle = (label: string) => {
    const cur = config.drizzles || [];
    update({ drizzles: cur.includes(label) ? cur.filter(x => x !== label) : [...cur, label] });
  };

  const setPlacement = (topping: string, placement: Placement) => {
    update({ toppingPlacements: { ...config.toppingPlacements, [topping]: placement } });
  };

  const isSelected = (t: typeof TOPPINGS[0]) => {
    if (t.category === 'meat') return config.meats.includes(t.label);
    if (t.category === 'veggie') return config.veggies.includes(t.label);
    return config.cheese.includes(t.label);
  };

  const applyAI = (idx: number) => {
    const s = AI_SUGGESTIONS[idx].config;
    update({ meats: s.meats, veggies: s.veggies, cheese: s.cheese });
  };

  const addToCart = () => {
    if (!onAddToCart) return;
    onAddToCart({
      store_id: 'custom',
      store_name: 'Custom Build',
      item_name: `${config.size} ${config.crust} Pizza`,
      config: { ...config, quantity: qty },
      quantity: qty,
      price_per_item: totalPerPizza,
      total_price: grandTotal,
      delivery_type: 'store-delivery' as any,
    }, false);
    setAddedPulse(true);
    setTimeout(() => setAddedPulse(false), 1200);
  };

  const filteredToppings = TOPPINGS.filter(t => t.category === activeCategory);
  const selectedMeatsAndVeggies = [...config.meats, ...config.veggies];

  return (
    <div className="w-full">
      {/* AI Quick-Pick row */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-stone-600 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Quick Pick
        </span>
        {AI_SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => applyAI(i)}
            className="shrink-0 text-[10px] font-bold text-stone-300 bg-white/5 border border-white/10 hover:border-red-500/30 hover:text-red-300 px-3 py-1.5 rounded-xl transition-all"
          >
            {s.label}
          </motion.button>
        ))}
      </div>

      {/* 3-col desktop / stacked mobile layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-6">

        {/* ── LEFT: Pizza Preview ── */}
        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          {/* Pizza visual */}
          <Section title="Your Pizza">
            <div className="relative aspect-square max-w-[220px] mx-auto">
              <motion.div
                key={allSelected.join(',')}
                animate={{ rotate: [0, 3, -2, 0], scale: [1, 1.02, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Pizza3DBuilder config={config} />
              </motion.div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-36 h-8 bg-red-500/20 blur-2xl rounded-full" />
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm font-black text-white leading-tight">
                {config.size} {config.crust}
              </p>
              {config.crustFlavor && config.crustFlavor !== 'None' && (
                <p className="text-[10px] text-red-400 mt-0.5">{config.crustFlavor} Crust</p>
              )}
              <p className="text-[10px] text-stone-500 mt-0.5">
                {config.sauce}{config.sauceAmount !== 'Normal' ? ` (${config.sauceAmount})` : ''}
              </p>
              {allSelected.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {allSelected.slice(0, 5).map(t => (
                    <span key={t} className="text-[9px] bg-white/8 border border-white/10 px-1.5 py-0.5 rounded-md text-stone-400">{t}</span>
                  ))}
                  {allSelected.length > 5 && (
                    <span className="text-[9px] bg-white/8 border border-white/10 px-1.5 py-0.5 rounded-md text-stone-500">+{allSelected.length - 5} more</span>
                  )}
                </div>
              )}
              {(config.drizzles?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {config.drizzles!.map(d => (
                    <span key={d} className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md">
                      {DRIZZLES.find(dr => dr.label === d)?.emoji} {d.replace(' Drizzle', '').replace(' Glaze', '')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Price summary card */}
          <div className="bg-gradient-to-br from-white/6 to-white/2 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-stone-400 text-xs">
                <span>Base ({config.size} {sizeData.inch})</span>
                <span className="font-bold text-white">${sizeData.base.toFixed(2)}</span>
              </div>
              {(crustData?.upcharge || 0) > 0 && (
                <div className="flex justify-between text-stone-400 text-xs">
                  <span>Crust upcharge</span>
                  <span className="font-bold text-white">+${crustData!.upcharge!.toFixed(2)}</span>
                </div>
              )}
              {toppingPrice > 0 && (
                <div className="flex justify-between text-stone-400 text-xs">
                  <span>Toppings ({config.meats.length + config.veggies.length + config.cheese.length})</span>
                  <span className="font-bold text-white">+${toppingPrice.toFixed(2)}</span>
                </div>
              )}
              {drizzlePrice > 0 && (
                <div className="flex justify-between text-stone-400 text-xs">
                  <span>Drizzles ({config.drizzles?.length})</span>
                  <span className="font-bold text-white">+${drizzlePrice.toFixed(2)}</span>
                </div>
              )}
              {cheeseUpcharge !== 0 && (
                <div className="flex justify-between text-stone-400 text-xs">
                  <span>Cheese ({config.cheeseAmount})</span>
                  <span className={`font-bold ${cheeseUpcharge > 0 ? 'text-white' : 'text-green-400'}`}>
                    {cheeseUpcharge > 0 ? '+' : ''}{cheeseUpcharge.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="font-black text-white text-xs">Per Pizza</span>
                <AnimatedPrice value={totalPerPizza} className="font-black text-red-400 text-sm" />
              </div>

              {/* Qty */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-400 text-xs">Quantity</span>
                <div className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl px-3 py-1.5">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-stone-400 hover:text-white transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-white font-black text-sm w-4 text-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(10, q + 1))} className="text-stone-400 hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                <span className="font-black text-white text-sm">Total</span>
                <AnimatedPrice value={grandTotal} className="font-black text-2xl text-white" />
              </div>

              {cheapestStorePrice < grandTotal && (
                <div className="flex items-center gap-1.5 text-green-400 text-[10px] font-bold bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-1.5">
                  <TrendingDown className="w-3 h-3" />
                  Save ${(grandTotal - cheapestStorePrice).toFixed(2)} ordering from a store
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-2 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={addToCart}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all ${
                  addedPulse
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.35)] border border-red-400/30'
                }`}
              >
                {addedPulse ? <><Check className="w-4 h-4" /> Added!</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart · <AnimatedPrice value={grandTotal} /></>}
              </motion.button>
              <button
                onClick={() => onSaveFavorite(config)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-xs border border-white/10 bg-white/5 hover:border-red-500/30 hover:text-red-400 text-stone-400 transition-all"
              >
                <Heart className="w-3.5 h-3.5" /> Save as Favourite
              </button>
            </div>
          </div>
        </div>

        {/* ── CENTER: Builder Controls ── */}
        <div className="space-y-6">

          {/* ── 1. Size ── */}
          <Section title="Pizza Size">
            <div className="grid grid-cols-4 gap-3">
              {SIZES.map(s => (
                <motion.button
                  key={s.value}
                  whileHover={{ y: -4, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => update({ size: s.value })}
                  className={`relative flex flex-col items-center gap-1 py-4 px-2 rounded-2xl border-2 transition-all duration-200 ${
                    config.size === s.value
                      ? `border-red-400/70 bg-red-500/12 ${s.glow}`
                      : 'border-white/8 bg-white/4 hover:border-white/20'
                  }`}
                >
                  {config.size === s.value && (
                    <motion.div layoutId="size-selected" className="absolute inset-0 rounded-2xl bg-red-500/8" />
                  )}
                  <span className="text-2xl font-black text-white relative z-10">{s.label}</span>
                  <span className="text-[10px] text-stone-500 relative z-10">{s.inch}</span>
                  <span className={`text-[9px] text-stone-600 relative z-10`}>{s.desc}</span>
                  <span className={`text-[10px] font-black relative z-10 ${config.size === s.value ? 'text-red-400' : 'text-stone-400'}`}>${s.base}</span>
                  {config.size === s.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-20"
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </Section>

          {/* ── 2. Crust ── */}
          <Section title="Crust Style">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
              {CRUSTS.map(c => (
                <motion.button
                  key={c.value}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => update({ crust: c.value })}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl border transition-all text-left ${
                    config.crust === c.value
                      ? 'border-violet-400/50 bg-violet-500/12 shadow-[0_0_15px_rgba(167,139,250,0.2)]'
                      : 'border-white/8 bg-white/4 hover:border-white/20'
                  }`}
                >
                  <span className="text-xl">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-black truncate ${config.crust === c.value ? 'text-violet-300' : 'text-white'}`}>
                      {c.value.replace(' Crust', '').replace(' Style', '')}
                    </p>
                    <p className="text-[9px] text-stone-500">{c.desc}</p>
                    {c.upcharge && <p className="text-[9px] text-red-500">+${c.upcharge.toFixed(2)}</p>}
                  </div>
                  {config.crust === c.value && <Check className="w-3.5 h-3.5 text-violet-400 ml-auto shrink-0" />}
                </motion.button>
              ))}
            </div>

            {/* Crust Flavor */}
            <div className="border-t border-white/8 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Crust Flavor</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CRUST_FLAVORS.map(f => (
                  <motion.button
                    key={f.value}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => update({ crustFlavor: f.value })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      config.crustFlavor === f.value
                        ? 'border-red-400/50 bg-red-500/12 text-red-300'
                        : 'border-white/8 bg-white/4 text-stone-400 hover:border-white/20 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-base">{f.emoji}</span>
                    <div>
                      <p className="text-[10px] font-black leading-tight">{f.value}</p>
                      <p className="text-[9px] text-stone-600">{f.desc}</p>
                    </div>
                    {config.crustFlavor === f.value && <Check className="w-3 h-3 ml-auto shrink-0" />}
                  </motion.button>
                ))}
              </div>
            </div>
          </Section>

          {/* ── 3. Sauce ── */}
          <Section title="Sauce">
            <div className="flex flex-wrap gap-2.5 mb-1">
              {SAUCES.map(s => (
                <motion.button
                  key={s.value}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => update({ sauce: s.value })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all ${
                    config.sauce === s.value
                      ? 'border-white/40 bg-white/12 text-white shadow-lg'
                      : 'border-white/8 bg-white/4 text-stone-400 hover:border-white/20 hover:text-stone-200'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${s.color} shadow-sm border border-white/20 shrink-0`} />
                  <span className="text-[11px] font-bold">{s.short}</span>
                  {config.sauce === s.value && <Check className="w-3 h-3 text-white" />}
                </motion.button>
              ))}
            </div>
            {config.sauce !== 'No Sauce' && (
              <AmountPills
                options={SAUCE_AMOUNTS}
                value={config.sauceAmount || 'Normal'}
                onChange={v => update({ sauceAmount: v })}
                label="Amount"
              />
            )}
          </Section>

          {/* ── 4. Cheese Amount ── */}
          <Section title="Cheese" badge="Customize Amount">
            <AmountPills
              options={CHEESE_AMOUNTS}
              value={config.cheeseAmount || 'Normal'}
              onChange={v => update({ cheeseAmount: v })}
              label="Amount"
            />
            <p className="text-[9px] text-stone-600 mt-1.5 pl-[72px]">
              {config.cheeseAmount === 'None' ? '−$1.00' : config.cheeseAmount === 'Extra' ? '+$1.50' : 'Included'}
            </p>

            {/* Cheese type selection */}
            <div className="border-t border-white/8 pt-3 mt-3">
              <p className="text-[10px] font-bold text-stone-500 mb-2">Cheese Types</p>
              <div className="flex flex-wrap gap-2">
                {TOPPINGS.filter(t => t.category === 'cheese').map(t => (
                  <ToppingBubble
                    key={t.label}
                    topping={t}
                    selected={config.cheese.includes(t.label)}
                    onToggle={() => toggleTopping(t)}
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* ── 5. Toppings ── */}
          <Section title="Toppings">
            {/* Category tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/8 p-1 rounded-xl mb-4 w-fit">
              {(['meat', 'veggie'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all capitalize ${
                    activeCategory === cat ? 'bg-white/15 text-white' : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {cat === 'meat' ? '🥩 Meats' : '🥬 Veggies'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {filteredToppings.map(t => (
                  <ToppingBubble
                    key={t.label}
                    topping={t}
                    selected={isSelected(t)}
                    onToggle={() => toggleTopping(t)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Topping Placement section */}
            {selectedMeatsAndVeggies.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/8">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2.5">
                  Placement  <span className="text-stone-600 normal-case tracking-normal">◧ Left · ⬛ Whole · ◨ Right</span>
                </p>
                <div className="space-y-2">
                  {selectedMeatsAndVeggies.map(label => {
                    const topping = TOPPINGS.find(t => t.label === label);
                    const placement = (config.toppingPlacements?.[label] || 'whole') as Placement;
                    return (
                      <div key={label} className="flex items-center justify-between gap-2 bg-white/4 border border-white/8 rounded-xl px-3 py-2">
                        <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                          <span>{topping?.emoji}</span> {label}
                        </span>
                        <PlacementToggle value={placement} onChange={p => setPlacement(label, p)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {allSelected.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between">
                <span className="text-[10px] text-stone-500">{allSelected.length} toppings · +${toppingPrice.toFixed(2)}</span>
                <button
                  onClick={() => update({ meats: [], veggies: [], cheese: ['Mozzarella'], extras: [], toppingPlacements: {} })}
                  className="text-[10px] font-bold text-stone-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            )}
          </Section>

          {/* ── 6. Drizzles ── */}
          <Section title="Finishing Drizzles" badge="New">
            <div className="flex flex-wrap gap-2">
              {DRIZZLES.map(d => {
                const on = config.drizzles?.includes(d.label);
                return (
                  <motion.button
                    key={d.label}
                    whileHover={{ y: -3, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleDrizzle(d.label)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
                      on
                        ? `${d.color} ring-1 ring-current shadow-lg scale-105`
                        : 'border-white/10 bg-white/4 text-stone-400 hover:border-white/20 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-sm">{d.emoji}</span>
                    <span className="whitespace-nowrap">{d.label}</span>
                    {on && (
                      <>
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="w-3.5 h-3.5 rounded-full bg-current flex items-center justify-center ml-0.5">
                          <Check className="w-2 h-2 text-black" />
                        </motion.span>
                        <span className="text-[10px] text-stone-500">+$0.75</span>
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>
            {(config.drizzles?.length || 0) === 0 && (
              <p className="text-[10px] text-stone-600 mt-2">Add a drizzle for the finishing touch — +$0.75 each</p>
            )}
          </Section>

        </div>

        {/* ── RIGHT: Live Price Comparison ── */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-gradient-to-br from-white/6 to-white/2 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-black text-white">Live Prices</p>
                <p className="text-[9px] text-stone-500 mt-0.5">Updates as you build</p>
              </div>
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-1 text-[9px] font-bold text-green-400"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Live
              </motion.div>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {storePrices.map((s, i) => (
                  <StorePriceRow
                    key={s.store.id}
                    store={s.store}
                    price={s.price}
                    rank={i}
                    onOrder={() => {
                      if (onAddToCart) {
                        onAddToCart({
                          store_id: s.store.id,
                          store_name: s.store.name,
                          item_name: `${config.size} Pizza from ${s.store.name}`,
                          config: { ...config, quantity: qty },
                          quantity: qty,
                          price_per_item: s.price,
                          total_price: s.price * qty,
                          delivery_type: 'store-delivery' as any,
                        }, true);
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Savings summary */}
            <div className="mt-4 pt-3 border-t border-white/8">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-stone-500">Most expensive</span>
                <AnimatedPrice value={storePrices[storePrices.length - 1]?.price || 0} className="text-[10px] font-bold text-stone-400 line-through" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-stone-500">Cheapest</span>
                <AnimatedPrice value={storePrices[0]?.price || 0} className="text-[10px] font-black text-green-400" />
              </div>
              <div className="mt-2 bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
                <Zap className="w-3 h-3 text-green-400 shrink-0" />
                <p className="text-[9px] text-green-300 font-bold">
                  Save up to ${(((storePrices[storePrices.length - 1]?.price || 0) - (storePrices[0]?.price || 0)) * qty).toFixed(2)} by choosing the cheapest option
                </p>
              </div>
            </div>

            {/* AI Insight */}
            <div className="mt-3 p-3 bg-violet-500/8 border border-violet-500/20 rounded-2xl">
              <p className="text-[9px] font-black text-violet-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI Insight
              </p>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                {config.meats.includes('Pepperoni')
                  ? 'Customers who added Pepperoni also love a Garlic Parmesan Drizzle 🧄'
                  : config.veggies.length > 2
                  ? 'Great veggie combo! Try Balsamic Glaze for a gourmet finish ✨'
                  : (config.drizzles?.length || 0) > 0
                  ? `Nice drizzle choice! ${config.drizzles![0]} pairs perfectly with your ${config.crust} 🍕`
                  : allSelected.length === 0
                  ? 'Start adding toppings to see personalised suggestions 🍕'
                  : `${config.size} pizzas with ${allSelected.length} toppings are trending right now 🔥`}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
