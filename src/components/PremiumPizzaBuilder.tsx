import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart, Heart, Sparkles, RotateCcw, ChevronRight,
  Star, Clock, ExternalLink, Zap, Award, TrendingDown, Check, Plus, Minus,
  ChevronDown, Flame, Scissors, MessageSquare, Info,
} from 'lucide-react';
import { PizzaConfig, Size, Crust, Sauce, CartItem } from '../types';
import { MARKETPLACE_STORES } from '../data/marketplace';

// ── Static data ───────────────────────────────────────────────────────────────

const SIZES: { value: Size; label: string; inch: string; base: number; ring: string; glow: string; desc: string; px: number }[] = [
  { value: 'Small',       label: 'S',  inch: '8"',  base: 7.99,  ring: 'ring-sky-400',    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.5)]',  desc: 'Serves 1–2', px: 80  },
  { value: 'Medium',      label: 'M',  inch: '10"', base: 11.99, ring: 'ring-violet-400', glow: 'shadow-[0_0_20px_rgba(167,139,250,0.5)]', desc: 'Serves 2–3', px: 100 },
  { value: 'Large',       label: 'L',  inch: '12"', base: 14.99, ring: 'ring-red-400',    glow: 'shadow-[0_0_20px_rgba(220,38,38,0.5)]',  desc: 'Serves 3–4', px: 126 },
  { value: 'Extra Large', label: 'XL', inch: '14"', base: 17.99, ring: 'ring-red-500',    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',  desc: 'Serves 4–6', px: 152 },
];

const CRUSTS: { value: Crust; emoji: string; desc: string; upcharge?: number }[] = [
  { value: 'Hand Tossed',            emoji: '👋', desc: 'Classic & Airy' },
  { value: 'Crunchy Thin Crust',     emoji: '✂️', desc: 'Light & Crispy' },
  { value: 'Handmade Pan',           emoji: '🍳', desc: 'Thick & Chewy' },
  { value: 'Parmesan Stuffed Crust', emoji: '🧀', desc: 'Extra Cheesy',  upcharge: 3.00 },
  { value: 'Brooklyn Style',         emoji: '🗽', desc: 'NY Foldable' },
  { value: 'New York Style',         emoji: '🍕', desc: 'Authentic NY' },
  { value: 'Gluten Free Crust',      emoji: '🌾', desc: 'GF Friendly',  upcharge: 2.00 },
];

const CRUST_FLAVORS: { value: string; emoji: string; desc: string }[] = [
  { value: 'None',                 emoji: '⬜', desc: 'Classic crust' },
  { value: 'Garlic Butter',        emoji: '🧄', desc: 'Rich & savory' },
  { value: 'Parmesan',             emoji: '🧀', desc: 'Aged & nutty' },
  { value: 'Garlic Butter & Herb', emoji: '🫙', desc: 'Herbaceous' },
  { value: 'Butter Parmesan',      emoji: '✨', desc: 'Buttery finish' },
  { value: 'Italian Herb',         emoji: '🌿', desc: 'Mediterranean' },
  { value: 'Sweet Chili',          emoji: '🌶️', desc: 'Sweet heat' },
  { value: 'Cajun',                emoji: '🔥', desc: 'Spicy kick' },
];

const SAUCES: { value: Sauce; dotClass: string; label: string; short: string; bg: string }[] = [
  { value: 'Robust Inspired Tomato Sauce', dotClass: 'bg-red-600',    label: 'Robust Tomato',   short: 'Tomato',   bg: 'from-red-900/40 to-red-800/20'     },
  { value: 'Hearty Marinara',              dotClass: 'bg-red-900',    label: 'Hearty Marinara', short: 'Marinara', bg: 'from-red-950/40 to-red-900/20'     },
  { value: 'BBQ Sauce',                   dotClass: 'bg-amber-900',  label: 'BBQ Sauce',       short: 'BBQ',      bg: 'from-amber-950/40 to-amber-900/20' },
  { value: 'Garlic Parmesan White Sauce',  dotClass: 'bg-yellow-100', label: 'Garlic Parmesan', short: 'White',    bg: 'from-yellow-900/30 to-yellow-800/15'},
  { value: 'Alfredo Sauce',               dotClass: 'bg-amber-50',   label: 'Alfredo',         short: 'Alfredo',  bg: 'from-amber-900/30 to-amber-800/15' },
  { value: 'Buffalo Sauce',               dotClass: 'bg-orange-500', label: 'Buffalo Hot',     short: 'Buffalo',  bg: 'from-orange-900/40 to-orange-800/20'},
  { value: 'Ranch Sauce',                 dotClass: 'bg-stone-100',  label: 'Ranch',           short: 'Ranch',    bg: 'from-stone-700/40 to-stone-600/20' },
  { value: 'No Sauce',                    dotClass: 'bg-stone-700',  label: 'No Sauce',        short: 'None',     bg: 'from-stone-800/40 to-stone-700/20' },
];

const SAUCE_AMOUNTS = ['Light', 'Normal', 'Extra'] as const;
const CHEESE_AMOUNTS = ['None', 'Light', 'Normal', 'Extra'] as const;
const TOPPING_AMOUNTS = ['Light', 'Moderate', 'Extra'] as const;

const BAKE_OPTIONS: { value: PizzaConfig['bakePreference']; emoji: string; desc: string }[] = [
  { value: 'Light Bake',  emoji: '🌤️', desc: 'Soft, less crispy' },
  { value: 'Normal Bake', emoji: '🍕',  desc: 'Standard bake' },
  { value: 'Well Done',   emoji: '🔥',  desc: 'Extra crispy crust' },
];

const CUT_OPTIONS: { value: PizzaConfig['cutStyle']; emoji: string; desc: string }[] = [
  { value: 'Pie Cut',    emoji: '🔺', desc: 'Traditional triangles' },
  { value: 'Square Cut', emoji: '⬜', desc: 'Party/square slices' },
  { value: 'No Cut',     emoji: '⭕', desc: 'Leave whole / uncut' },
];

const TOPPINGS: { label: string; emoji: string; category: 'meat' | 'veggie' | 'cheese'; color: string; dot: string }[] = [
  // Meats
  { label: 'Pepperoni',       emoji: '🍕', category: 'meat',   color: 'border-red-500/50 bg-red-500/10 text-red-300',         dot: 'bg-red-500'    },
  { label: 'Italian Sausage', emoji: '🌭', category: 'meat',   color: 'border-red-500/50 bg-red-500/10 text-red-300',         dot: 'bg-red-600'    },
  { label: 'Beef',            emoji: '🥩', category: 'meat',   color: 'border-red-600/50 bg-red-600/10 text-red-300',         dot: 'bg-red-700'    },
  { label: 'Ham',             emoji: '🍖', category: 'meat',   color: 'border-pink-500/50 bg-pink-500/10 text-pink-300',      dot: 'bg-pink-500'   },
  { label: 'Bacon',           emoji: '🥓', category: 'meat',   color: 'border-red-400/50 bg-red-400/10 text-red-200',         dot: 'bg-red-400'    },
  { label: 'Grilled Chicken', emoji: '🍗', category: 'meat',   color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',dot: 'bg-yellow-500' },
  { label: 'Premium Chicken', emoji: '🐔', category: 'meat',   color: 'border-yellow-400/50 bg-yellow-400/10 text-yellow-200',dot: 'bg-yellow-400' },
  { label: 'Philly Steak',    emoji: '🥩', category: 'meat',   color: 'border-red-700/50 bg-red-700/10 text-red-400',         dot: 'bg-red-800'    },
  { label: 'Salami',          emoji: '🫓', category: 'meat',   color: 'border-red-600/50 bg-red-600/10 text-red-300',         dot: 'bg-red-600'    },
  { label: 'Anchovies',       emoji: '🐟', category: 'meat',   color: 'border-blue-500/50 bg-blue-500/10 text-blue-300',      dot: 'bg-blue-500'   },
  // Veggies
  { label: 'Mushrooms',           emoji: '🍄', category: 'veggie', color: 'border-stone-500/50 bg-stone-500/10 text-stone-300',    dot: 'bg-stone-500'   },
  { label: 'Onions',              emoji: '🧅', category: 'veggie', color: 'border-purple-500/50 bg-purple-500/10 text-purple-300', dot: 'bg-purple-500'  },
  { label: 'Green Peppers',       emoji: '🫑', category: 'veggie', color: 'border-green-500/50 bg-green-500/10 text-green-300',    dot: 'bg-green-500'   },
  { label: 'Black Olives',        emoji: '🫒', category: 'veggie', color: 'border-stone-600/50 bg-stone-600/10 text-stone-400',    dot: 'bg-stone-700'   },
  { label: 'Spinach',             emoji: '🥬', category: 'veggie', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',dot:'bg-emerald-600' },
  { label: 'Tomatoes',            emoji: '🍅', category: 'veggie', color: 'border-red-400/50 bg-red-400/10 text-red-200',           dot: 'bg-red-400'    },
  { label: 'Banana Peppers',      emoji: '🌶️', category: 'veggie', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300', dot: 'bg-yellow-400' },
  { label: 'Jalapenos',           emoji: '🌶️', category: 'veggie', color: 'border-green-600/50 bg-green-600/10 text-green-400',    dot: 'bg-green-700'   },
  { label: 'Pineapple',           emoji: '🍍', category: 'veggie', color: 'border-yellow-400/50 bg-yellow-400/10 text-yellow-200', dot: 'bg-yellow-300' },
  { label: 'Roasted Red Peppers', emoji: '🌶️', category: 'veggie', color: 'border-red-500/50 bg-red-500/10 text-red-300',          dot: 'bg-red-500'    },
  { label: 'Sun-dried Tomatoes',  emoji: '☀️', category: 'veggie', color: 'border-red-600/50 bg-red-600/10 text-red-300',           dot: 'bg-red-700'    },
  { label: 'Green Chile Peppers', emoji: '🫑', category: 'veggie', color: 'border-lime-500/50 bg-lime-500/10 text-lime-300',        dot: 'bg-lime-600'   },
  { label: 'Diced Garlic',        emoji: '🧄', category: 'veggie', color: 'border-red-300/50 bg-red-300/10 text-red-200',           dot: 'bg-amber-200'  },
  { label: 'Kalamata Olives',     emoji: '🫒', category: 'veggie', color: 'border-purple-600/50 bg-purple-600/10 text-purple-400',  dot: 'bg-purple-700' },
  { label: 'Red Onions',          emoji: '🧅', category: 'veggie', color: 'border-pink-500/50 bg-pink-500/10 text-pink-300',        dot: 'bg-pink-600'   },
  { label: 'Artichoke Hearts',    emoji: '🌿', category: 'veggie', color: 'border-green-400/50 bg-green-400/10 text-green-300',     dot: 'bg-green-500'  },
  // Cheese
  { label: 'Mozzarella',        emoji: '🧀', category: 'cheese', color: 'border-yellow-300/50 bg-yellow-300/10 text-yellow-200', dot: 'bg-yellow-200' },
  { label: 'Extra Cheese',      emoji: '🧀', category: 'cheese', color: 'border-red-400/50 bg-red-400/10 text-red-200',          dot: 'bg-yellow-300' },
  { label: 'Cheddar Blend',     emoji: '🧀', category: 'cheese', color: 'border-orange-400/50 bg-orange-400/10 text-orange-200', dot: 'bg-orange-400' },
  { label: 'Feta',              emoji: '🧀', category: 'cheese', color: 'border-stone-300/50 bg-stone-300/10 text-stone-200',    dot: 'bg-stone-300'  },
  { label: 'Provolone',         emoji: '🧀', category: 'cheese', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300', dot: 'bg-yellow-400' },
  { label: 'Parm Asiago Blend', emoji: '🧀', category: 'cheese', color: 'border-red-300/50 bg-red-300/10 text-red-100',          dot: 'bg-amber-100'  },
  { label: 'Ricotta',           emoji: '🧀', category: 'cheese', color: 'border-stone-200/50 bg-stone-200/10 text-stone-100',    dot: 'bg-stone-100'  },
  { label: 'American Cheese',   emoji: '🧀', category: 'cheese', color: 'border-orange-300/50 bg-orange-300/10 text-orange-200', dot: 'bg-orange-300' },
];

const DRIZZLES: { label: string; emoji: string; color: string }[] = [
  { label: 'Garlic Parmesan Drizzle', emoji: '🧄', color: 'border-yellow-200/50 bg-yellow-200/8 text-yellow-200'  },
  { label: 'BBQ Drizzle',             emoji: '🎖',  color: 'border-amber-700/50 bg-amber-700/8 text-amber-400'    },
  { label: 'Buffalo Drizzle',         emoji: '🌶️', color: 'border-orange-500/50 bg-orange-500/8 text-orange-300'  },
  { label: 'Ranch Drizzle',           emoji: '🥗',  color: 'border-stone-300/50 bg-stone-300/8 text-stone-300'    },
  { label: 'Italian Herb Drizzle',    emoji: '🌿',  color: 'border-green-500/50 bg-green-500/8 text-green-300'    },
  { label: 'Mango Habanero Drizzle',  emoji: '🥭',  color: 'border-yellow-500/50 bg-yellow-500/8 text-yellow-300' },
  { label: 'Balsamic Glaze',          emoji: '✨',  color: 'border-purple-500/50 bg-purple-500/8 text-purple-300' },
  { label: 'Hot Honey',               emoji: '🍯',  color: 'border-amber-400/50 bg-amber-400/8 text-amber-300'    },
  { label: 'Sriracha Drizzle',        emoji: '🔥',  color: 'border-red-500/50 bg-red-500/8 text-red-300'          },
  { label: 'Pesto Drizzle',           emoji: '🌱',  color: 'border-green-400/50 bg-green-400/8 text-green-200'    },
];

const AI_SUGGESTIONS = [
  { label: '🔥 Most Popular',   config: { meats: ['Pepperoni'], veggies: [], cheese: ['Mozzarella', 'Extra Cheese'], drizzles: [] as string[] } },
  { label: '🥩 Meat Lover',     config: { meats: ['Pepperoni', 'Italian Sausage', 'Beef', 'Bacon'], veggies: [], cheese: ['Mozzarella'], drizzles: [] as string[] } },
  { label: '🌱 Veggie Delight', config: { meats: [], veggies: ['Mushrooms', 'Onions', 'Green Peppers', 'Spinach'], cheese: ['Mozzarella', 'Feta'], drizzles: ['Balsamic Glaze'] } },
  { label: '🔥 Spicy Fire',     config: { meats: ['Pepperoni', 'Italian Sausage'], veggies: ['Jalapenos', 'Banana Peppers'], cheese: ['Mozzarella'], drizzles: ['Sriracha Drizzle'] } },
  { label: '🍗 BBQ Chicken',    config: { meats: ['Grilled Chicken', 'Bacon'], veggies: ['Red Onions', 'Roasted Red Peppers'], cheese: ['Cheddar Blend', 'Mozzarella'], drizzles: ['BBQ Drizzle'] } },
  { label: '🧀 White Pie',      config: { meats: [], veggies: ['Spinach', 'Artichoke Hearts', 'Diced Garlic'], cheese: ['Ricotta', 'Mozzarella', 'Parm Asiago Blend'], drizzles: ['Garlic Parmesan Drizzle'] } },
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
      <div className="flex gap-1 bg-white/5 border border-white/8 p-1 rounded-xl">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
              value === opt ? 'bg-white/20 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'
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
  const opts: { v: Placement; label: string; title: string }[] = [
    { v: 'left',  label: '◧ Left',  title: 'Left half only' },
    { v: 'whole', label: '⬛ Whole', title: 'Entire pizza' },
    { v: 'right', label: '◨ Right', title: 'Right half only' },
  ];
  return (
    <div className="flex gap-0.5 bg-white/5 border border-white/8 rounded-lg p-0.5">
      {opts.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          title={o.title}
          className={`px-2 py-0.5 rounded text-[10px] transition-all font-bold whitespace-nowrap ${
            value === o.v ? 'bg-white/20 text-white' : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Topping Amount toggle ──────────────────────────────────────────────────────
function ToppingAmountToggle({ value, onChange }: {
  value: 'Light' | 'Moderate' | 'Extra';
  onChange: (v: 'Light' | 'Moderate' | 'Extra') => void;
}) {
  return (
    <div className="flex gap-0.5 bg-white/5 border border-white/8 rounded-lg p-0.5">
      {TOPPING_AMOUNTS.map(amt => (
        <button
          key={amt}
          onClick={() => onChange(amt)}
          title={`${amt} amount`}
          className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
            value === amt
              ? amt === 'Extra' ? 'bg-red-500/40 text-red-200'
              : amt === 'Light' ? 'bg-white/15 text-stone-300'
              : 'bg-white/20 text-white'
              : 'text-stone-600 hover:text-stone-400'
          }`}
        >
          {amt === 'Moderate' ? 'Reg' : amt}
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
      whileHover={{ y: -3, scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onToggle}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all duration-200 ${
        selected
          ? `${topping.color} ring-1 ring-current shadow-lg scale-[1.03]`
          : 'border-white/10 bg-white/4 text-stone-400 hover:border-white/25 hover:text-stone-200 hover:bg-white/8'
      }`}
    >
      <span className="text-sm">{topping.emoji}</span>
      <span className="whitespace-nowrap">{topping.label}</span>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-3.5 h-3.5 rounded-full bg-current flex items-center justify-center ml-0.5 shrink-0"
        >
          <Check className="w-2 h-2 text-black" />
        </motion.span>
      )}
      {selected && topping.category !== 'cheese' && (
        <span className="text-[9px] text-stone-500/80">+$1.50</span>
      )}
    </motion.button>
  );
};

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
          {store.deliveryFee === 0 && <span className="text-[9px] text-green-400 font-bold">Free del.</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <AnimatedPrice value={price} className={`text-sm font-black ${rank === 0 ? 'text-green-400' : 'text-white'}`} />
        {rank === 0 && <p className="text-[8px] text-green-500 font-bold">LOWEST</p>}
      </div>
      <button
        onClick={onOrder}
        className={`text-[9px] font-black px-2 py-1.5 rounded-lg border shrink-0 transition-all hover:scale-105 active:scale-95 ${
          rank === 0
            ? 'bg-green-600 border-green-500 text-white hover:bg-green-500'
            : 'bg-white/5 border-white/10 text-stone-300 hover:border-white/25 hover:bg-white/10'
        }`}
      >
        Order
      </button>
    </motion.div>
  );
};

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, badge, children, icon }: { title: string; badge?: string; children: React.ReactNode; icon?: string }) {
  return (
    <div className="bg-gradient-to-br from-white/6 to-white/2 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-base">{icon}</span>}
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

// ── OptionCard ─────────────────────────────────────────────────────────────────
function OptionCard({ selected, onClick, emoji, label, desc }: {
  selected: boolean; onClick: () => void;
  emoji: string; label: string; desc: string; key?: React.Key;
}) {
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 text-center ${
        selected
          ? 'border-red-400/60 bg-red-500/12 shadow-[0_0_18px_rgba(220,38,38,0.25)]'
          : 'border-white/8 bg-white/4 hover:border-white/25 hover:bg-white/8'
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className={`text-[11px] font-black leading-tight ${selected ? 'text-red-300' : 'text-white'}`}>{label}</p>
        <p className="text-[9px] text-stone-500 mt-0.5">{desc}</p>
      </div>
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

// ── Flat Pizza Visual ──────────────────────────────────────────────────────────
function PizzaVisual({ config, toppings }: { config: PizzaConfig; toppings: typeof TOPPINGS }) {
  const sauceData = SAUCES.find(s => s.value === config.sauce);
  const selectedToppingDots = toppings.filter(t =>
    (t.category === 'meat' && config.meats.includes(t.label)) ||
    (t.category === 'veggie' && config.veggies.includes(t.label))
  );

  // Fixed dot positions for up to 12 toppings on the pizza
  const DOT_POSITIONS = [
    { top: '20%', left: '50%' }, { top: '35%', left: '72%' }, { top: '60%', left: '75%' },
    { top: '75%', left: '55%' }, { top: '70%', left: '32%' }, { top: '48%', left: '22%' },
    { top: '28%', left: '35%' }, { top: '45%', left: '55%' }, { top: '32%', left: '58%' },
    { top: '58%', left: '45%' }, { top: '50%', left: '38%' }, { top: '40%', left: '65%' },
  ];

  return (
    <div className="relative mx-auto" style={{ width: 180, height: 180 }}>
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl scale-110" />

      {/* Crust ring */}
      <div className="absolute inset-0 rounded-full border-[12px] border-amber-800/70 bg-amber-900/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]" />

      {/* Sauce layer */}
      <div className={`absolute inset-3 rounded-full bg-gradient-to-br ${sauceData?.bg || 'from-red-900/40 to-red-800/20'} border border-white/5`} />

      {/* Cheese layer */}
      <div className={`absolute inset-3 rounded-full transition-opacity duration-300 ${
        config.cheeseAmount === 'None' ? 'opacity-0' : config.cheeseAmount === 'Light' ? 'opacity-40' : config.cheeseAmount === 'Extra' ? 'opacity-100' : 'opacity-70'
      }`}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200/20 to-yellow-100/10" />
      </div>

      {/* Topping dots */}
      <AnimatePresence>
        {selectedToppingDots.slice(0, 12).map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`absolute w-4 h-4 rounded-full ${t.dot} border border-white/20 shadow-sm -translate-x-1/2 -translate-y-1/2`}
            style={{ top: DOT_POSITIONS[i].top, left: DOT_POSITIONS[i].left }}
            title={t.label}
          />
        ))}
      </AnimatePresence>

      {/* Center slice lines */}
      {config.cutStyle === 'Pie Cut' && (
        <svg className="absolute inset-3 pointer-events-none opacity-20" viewBox="0 0 100 100">
          <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeWidth="0.8" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeWidth="0.8" />
          <line x1="22" y1="22" x2="78" y2="78" stroke="white" strokeWidth="0.8" />
          <line x1="78" y1="22" x2="22" y2="78" stroke="white" strokeWidth="0.8" />
        </svg>
      )}
      {config.cutStyle === 'Square Cut' && (
        <svg className="absolute inset-3 pointer-events-none opacity-20" viewBox="0 0 100 100">
          <line x1="33" y1="0" x2="33" y2="100" stroke="white" strokeWidth="0.8" />
          <line x1="66" y1="0" x2="66" y2="100" stroke="white" strokeWidth="0.8" />
          <line x1="0" y1="33" x2="100" y2="33" stroke="white" strokeWidth="0.8" />
          <line x1="0" y1="66" x2="100" y2="66" stroke="white" strokeWidth="0.8" />
        </svg>
      )}

      {/* Drizzle shimmer */}
      {(config.drizzles?.length || 0) > 0 && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-3 rounded-full border-2 border-dashed border-amber-400/30 pointer-events-none"
        />
      )}

      {/* Bake indicator */}
      {config.bakePreference === 'Well Done' && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs border border-orange-400/50">
          🔥
        </div>
      )}
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
  toppingAmounts: {},
  bakePreference: 'Normal Bake',
  cutStyle: 'Pie Cut',
  specialInstructions: '',
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
    toppingAmounts: currentConfig.toppingAmounts || {},
    bakePreference: currentConfig.bakePreference || 'Normal Bake',
    cutStyle: currentConfig.cutStyle || 'Pie Cut',
    specialInstructions: currentConfig.specialInstructions || '',
  };

  const [qty, setQty] = useState(config.quantity || 1);
  const [addedPulse, setAddedPulse] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
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
  const selectedMeatsAndVeggies = [...config.meats, ...config.veggies];

  const storePrices = MARKETPLACE_STORES
    .filter(s => s.isOpen)
    .map(s => ({ store: s, price: computeStorePrice(s, config) }))
    .sort((a, b) => a.price - b.price)
    .slice(0, 6);

  const cheapestStorePrice = storePrices[0]?.price || grandTotal;

  const update = (partial: Partial<PizzaConfig>) => {
    onConfigChange({ ...config, ...partial, quantity: qty });
  };

  const toggleTopping = (t: typeof TOPPINGS[0]) => {
    if (t.category === 'meat') {
      const cur = config.meats;
      const isAdding = !cur.includes(t.label);
      const next = isAdding ? [...cur, t.label] : cur.filter(x => x !== t.label);
      const placements = { ...config.toppingPlacements };
      const amounts = { ...config.toppingAmounts };
      if (!isAdding) { delete placements[t.label]; delete amounts[t.label]; }
      else { placements[t.label] = 'whole'; amounts[t.label] = 'Moderate'; }
      update({ meats: next, toppingPlacements: placements, toppingAmounts: amounts });
    } else if (t.category === 'veggie') {
      const cur = config.veggies;
      const isAdding = !cur.includes(t.label);
      const next = isAdding ? [...cur, t.label] : cur.filter(x => x !== t.label);
      const placements = { ...config.toppingPlacements };
      const amounts = { ...config.toppingAmounts };
      if (!isAdding) { delete placements[t.label]; delete amounts[t.label]; }
      else { placements[t.label] = 'whole'; amounts[t.label] = 'Moderate'; }
      update({ veggies: next, toppingPlacements: placements, toppingAmounts: amounts });
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

  const setToppingAmount = (topping: string, amount: 'Light' | 'Moderate' | 'Extra') => {
    update({ toppingAmounts: { ...config.toppingAmounts, [topping]: amount } });
  };

  const isSelected = (t: typeof TOPPINGS[0]) => {
    if (t.category === 'meat') return config.meats.includes(t.label);
    if (t.category === 'veggie') return config.veggies.includes(t.label);
    return config.cheese.includes(t.label);
  };

  const applyAI = (idx: number) => {
    const s = AI_SUGGESTIONS[idx].config;
    const placements: Record<string, 'whole'> = {};
    const amounts: Record<string, 'Moderate'> = {};
    [...s.meats, ...s.veggies].forEach(t => { placements[t] = 'whole'; amounts[t] = 'Moderate'; });
    update({ meats: s.meats, veggies: s.veggies, cheese: s.cheese, drizzles: s.drizzles, toppingPlacements: placements, toppingAmounts: amounts });
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
    setTimeout(() => setAddedPulse(false), 1400);
  };

  const saveFavorite = () => {
    onSaveFavorite(config);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 1400);
  };

  const filteredToppings = TOPPINGS.filter(t => t.category === activeCategory);

  return (
    <div className="w-full">

      {/* ── AI Quick-Pick Row ── */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-stone-600 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-violet-500" /> Quick Pick
        </span>
        {AI_SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => applyAI(i)}
            className="shrink-0 text-[10px] font-bold text-stone-300 bg-white/5 border border-white/10 hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/8 px-3 py-1.5 rounded-xl transition-all"
          >
            {s.label}
          </motion.button>
        ))}
      </div>

      {/* ── Main grid: LEFT summary | CENTER builder ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-6">

        {/* ══════════════════════════════════════════════════════════
            LEFT — Flat Pizza Visual + Price + Cart
        ══════════════════════════════════════════════════════════ */}
        <div className="lg:sticky lg:top-24 h-fit space-y-4">

          {/* Visual pizza card */}
          <div className="bg-gradient-to-br from-white/6 to-white/2 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-4">Your Pizza</p>

            {/* Flat pizza illustration */}
            <div className="flex justify-center mb-4">
              <motion.div
                key={allSelected.join(',') + config.size + config.sauce + config.cheeseAmount + config.cutStyle + config.bakePreference}
                initial={{ scale: 0.92, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              >
                <PizzaVisual config={config} toppings={TOPPINGS} />
              </motion.div>
            </div>

            {/* Summary text */}
            <div className="text-center space-y-1.5">
              <p className="text-sm font-black text-white">
                {sizeData.inch} {config.crust}
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {config.crustFlavor && config.crustFlavor !== 'None' && (
                  <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full font-bold">{config.crustFlavor}</span>
                )}
                <span className="text-[10px] bg-white/8 text-stone-400 border border-white/10 px-2 py-0.5 rounded-full">
                  {SAUCES.find(s => s.value === config.sauce)?.short ?? 'Sauce'}
                  {config.sauce !== 'No Sauce' && config.sauceAmount !== 'Normal' ? ` · ${config.sauceAmount}` : ''}
                </span>
                <span className="text-[10px] bg-white/8 text-stone-400 border border-white/10 px-2 py-0.5 rounded-full">
                  Cheese · {config.cheeseAmount}
                </span>
              </div>

              {/* Topping badges */}
              {allSelected.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center pt-1">
                  {allSelected.slice(0, 8).map(t => {
                    const info = TOPPINGS.find(tp => tp.label === t);
                    return (
                      <span key={t} className="text-[9px] bg-white/6 border border-white/10 px-1.5 py-0.5 rounded-md text-stone-400 flex items-center gap-0.5">
                        {info?.emoji} {t}
                      </span>
                    );
                  })}
                  {allSelected.length > 8 && (
                    <span className="text-[9px] bg-white/6 border border-white/10 px-1.5 py-0.5 rounded-md text-stone-500">
                      +{allSelected.length - 8} more
                    </span>
                  )}
                </div>
              )}

              {/* Drizzle badges */}
              {(config.drizzles?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {config.drizzles!.map(d => (
                    <span key={d} className="text-[9px] bg-amber-500/8 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      {DRIZZLES.find(dr => dr.label === d)?.emoji} {d.replace(' Drizzle', '').replace(' Glaze', '')}
                    </span>
                  ))}
                </div>
              )}

              {/* Bake / cut badges */}
              <div className="flex flex-wrap gap-1 justify-center">
                {config.bakePreference !== 'Normal Bake' && (
                  <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-md">{config.bakePreference}</span>
                )}
                {config.cutStyle !== 'Pie Cut' && (
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md">{config.cutStyle}</span>
                )}
              </div>

              {config.specialInstructions && (
                <p className="text-[9px] text-stone-500 italic truncate px-3 pt-0.5">"{config.specialInstructions}"</p>
              )}
            </div>

            {/* Completion progress */}
            <div className="mt-4 pt-3 border-t border-white/8">
              {(() => {
                const steps = [
                  { done: true, label: 'Size' },
                  { done: true, label: 'Crust' },
                  { done: config.sauce !== 'No Sauce', label: 'Sauce' },
                  { done: allSelected.length > 0, label: 'Toppings' },
                ];
                const doneCount = steps.filter(s => s.done).length;
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-stone-600">Build progress</span>
                      <span className="text-[9px] font-black text-stone-500">{doneCount}/{steps.length}</span>
                    </div>
                    <div className="flex gap-1">
                      {steps.map(s => (
                        <div key={s.label} className={`flex-1 h-1 rounded-full transition-all duration-500 ${s.done ? 'bg-red-500' : 'bg-white/10'}`} title={s.label} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Price summary + cart */}
          <div className="bg-gradient-to-br from-white/6 to-white/2 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Price Breakdown</p>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-xs">Base ({config.size} · {sizeData.inch})</span>
                <span className="font-bold text-white text-xs">${sizeData.base.toFixed(2)}</span>
              </div>
              {(crustData?.upcharge || 0) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 text-xs">Crust upcharge</span>
                  <span className="font-bold text-amber-400 text-xs">+${crustData!.upcharge!.toFixed(2)}</span>
                </div>
              )}
              {toppingPrice > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 text-xs">Toppings ({config.meats.length + config.veggies.length + config.cheese.length})</span>
                  <span className="font-bold text-white text-xs">+${toppingPrice.toFixed(2)}</span>
                </div>
              )}
              {drizzlePrice > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 text-xs">Drizzles ({config.drizzles?.length})</span>
                  <span className="font-bold text-white text-xs">+${drizzlePrice.toFixed(2)}</span>
                </div>
              )}
              {cheeseUpcharge !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 text-xs">Cheese ({config.cheeseAmount})</span>
                  <span className={`font-bold text-xs ${cheeseUpcharge > 0 ? 'text-white' : 'text-green-400'}`}>
                    {cheeseUpcharge > 0 ? '+' : ''}{cheeseUpcharge.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center">
                <span className="font-black text-white text-xs">Per Pizza</span>
                <AnimatedPrice value={totalPerPizza} className="font-black text-red-400" />
              </div>

              {/* Quantity picker */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-400 text-xs">Quantity</span>
                <div className="flex items-center gap-3 bg-white/8 border border-white/12 rounded-xl px-3 py-1.5">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="text-stone-400 hover:text-white transition-colors active:scale-90"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-white font-black text-sm w-4 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(10, q + 1))}
                    className="text-stone-400 hover:text-white transition-colors active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                <span className="font-black text-white">Total</span>
                <AnimatedPrice value={grandTotal} className="font-black text-2xl text-white" />
              </div>

              {cheapestStorePrice < grandTotal * 0.95 && (
                <div className="flex items-center gap-1.5 text-green-400 text-[10px] font-bold bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-1.5">
                  <TrendingDown className="w-3 h-3 shrink-0" />
                  Save ${(grandTotal - cheapestStorePrice).toFixed(2)} ordering from a store
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={addToCart}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all ${
                  addedPulse
                    ? 'bg-green-600 border border-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.35)] border border-red-400/30'
                }`}
              >
                <AnimatePresence mode="wait">
                  {addedPulse ? (
                    <motion.span key="added" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Added to cart!
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" /> Add to Cart · <AnimatedPrice value={grandTotal} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={saveFavorite}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-xs border transition-all ${
                  savedPulse
                    ? 'border-red-500/60 bg-red-500/15 text-red-400'
                    : 'border-white/10 bg-white/5 hover:border-red-500/30 hover:text-red-400 text-stone-400'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 transition-all ${savedPulse ? 'fill-red-400 text-red-400' : ''}`} />
                {savedPulse ? 'Saved!' : 'Save as Favorite'}
              </motion.button>

              <button
                onClick={() => update({ ...DEFAULT, size: config.size })}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-[11px] text-stone-600 hover:text-stone-400 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset toppings & sauces
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            CENTER — Builder Sections
        ══════════════════════════════════════════════════════════ */}
        <div className="space-y-5">

          {/* 1. Size */}
          <Section title="Pizza Size" icon="📐">
            <div className="grid grid-cols-4 gap-3">
              {SIZES.map(s => (
                <motion.button
                  key={s.value}
                  whileHover={{ y: -4, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => update({ size: s.value })}
                  className={`relative flex flex-col items-center gap-1 py-5 px-2 rounded-2xl border-2 transition-all duration-200 group ${
                    config.size === s.value
                      ? `border-red-400/70 bg-red-500/12 ${s.glow}`
                      : 'border-white/8 bg-white/4 hover:border-white/25 hover:bg-white/8'
                  }`}
                >
                  {config.size === s.value && (
                    <motion.div layoutId="size-selected" className="absolute inset-0 rounded-2xl bg-red-500/8" />
                  )}
                  <span className="text-3xl font-black text-white relative z-10">{s.label}</span>
                  <span className="text-[11px] font-bold text-stone-400 relative z-10">{s.inch}</span>
                  <span className="text-[9px] text-stone-600 relative z-10">{s.desc}</span>
                  <span className={`text-[11px] font-black relative z-10 mt-0.5 ${config.size === s.value ? 'text-red-400' : 'text-stone-500'}`}>${s.base}</span>
                  {config.size === s.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center z-20 shadow-[0_0_8px_rgba(220,38,38,0.6)]"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </Section>

          {/* 2. Crust Style + Crust Flavor */}
          <Section title="Crust" icon="🍞">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
              {CRUSTS.map(c => (
                <motion.button
                  key={c.value}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => update({ crust: c.value })}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl border transition-all text-left group ${
                    config.crust === c.value
                      ? 'border-violet-400/50 bg-violet-500/12 shadow-[0_0_15px_rgba(167,139,250,0.2)]'
                      : 'border-white/8 bg-white/4 hover:border-white/22 hover:bg-white/8'
                  }`}
                >
                  <span className="text-xl">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-black truncate ${config.crust === c.value ? 'text-violet-300' : 'text-white'}`}>
                      {c.value.replace(' Crust', '').replace(' Style', '')}
                    </p>
                    <p className="text-[9px] text-stone-500">{c.desc}</p>
                    {c.upcharge && <p className="text-[9px] text-amber-400 font-bold">+${c.upcharge.toFixed(2)}</p>}
                  </div>
                  {config.crust === c.value && <Check className="w-3.5 h-3.5 text-violet-400 ml-auto shrink-0" />}
                </motion.button>
              ))}
            </div>

            <div className="border-t border-white/8 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Crust Flavor</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CRUST_FLAVORS.map(f => (
                  <motion.button
                    key={f.value}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => update({ crustFlavor: f.value })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      config.crustFlavor === f.value
                        ? 'border-red-400/50 bg-red-500/12 text-red-300'
                        : 'border-white/8 bg-white/4 text-stone-400 hover:border-white/20 hover:text-stone-200 hover:bg-white/8'
                    }`}
                  >
                    <span className="text-base">{f.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black leading-tight truncate">{f.value}</p>
                      <p className="text-[9px] text-stone-600">{f.desc}</p>
                    </div>
                    {config.crustFlavor === f.value && <Check className="w-3 h-3 ml-auto shrink-0 text-red-400" />}
                  </motion.button>
                ))}
              </div>
            </div>
          </Section>

          {/* 3. Sauce */}
          <Section title="Sauce" icon="🍅">
            <div className="flex flex-wrap gap-2.5 mb-1">
              {SAUCES.map(s => (
                <motion.button
                  key={s.value}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => update({ sauce: s.value })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all ${
                    config.sauce === s.value
                      ? 'border-white/40 bg-white/12 text-white shadow-lg scale-[1.04]'
                      : 'border-white/8 bg-white/4 text-stone-400 hover:border-white/22 hover:text-stone-200 hover:bg-white/8'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${s.dotClass} shadow-sm border border-white/20 shrink-0`} />
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

          {/* 4. Cheese */}
          <Section title="Cheese" icon="🧀" badge="Customize Amount">
            <AmountPills
              options={CHEESE_AMOUNTS}
              value={config.cheeseAmount || 'Normal'}
              onChange={v => update({ cheeseAmount: v })}
              label="Amount"
            />
            <p className="text-[9px] text-stone-600 mt-1.5 pl-[72px]">
              {config.cheeseAmount === 'None' ? '−$1.00 · no cheese' : config.cheeseAmount === 'Extra' ? '+$1.50 · double layer' : 'Included · standard layer'}
            </p>
            <div className="border-t border-white/8 pt-3 mt-3">
              <p className="text-[10px] font-bold text-stone-500 mb-2">Cheese Type</p>
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

          {/* 5. Toppings */}
          <Section title="Toppings" icon="🥩">
            {/* Category tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/8 p-1 rounded-xl mb-4 w-fit">
              {(['meat', 'veggie'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all capitalize ${
                    activeCategory === cat ? 'bg-white/18 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'
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

            {/* Per-topping customization */}
            {selectedMeatsAndVeggies.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/8">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Customize Each Topping
                </p>
                <div className="space-y-2">
                  {selectedMeatsAndVeggies.map(label => {
                    const topping = TOPPINGS.find(t => t.label === label);
                    const placement = (config.toppingPlacements?.[label] || 'whole') as Placement;
                    const amount = (config.toppingAmounts?.[label] || 'Moderate') as 'Light' | 'Moderate' | 'Extra';
                    return (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 space-y-2 hover:border-white/14 transition-colors"
                      >
                        <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                          <span>{topping?.emoji}</span> {label}
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-stone-500 font-bold w-12">Amount</span>
                            <ToppingAmountToggle value={amount} onChange={a => setToppingAmount(label, a)} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-stone-500 font-bold w-12">Side</span>
                            <PlacementToggle value={placement} onChange={p => setPlacement(label, p)} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {allSelected.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between">
                <span className="text-[10px] text-stone-500">{allSelected.length} topping{allSelected.length !== 1 ? 's' : ''} · +${toppingPrice.toFixed(2)}</span>
                <button
                  onClick={() => update({ meats: [], veggies: [], cheese: ['Mozzarella'], extras: [], toppingPlacements: {}, toppingAmounts: {} })}
                  className="text-[10px] font-bold text-stone-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset toppings
                </button>
              </div>
            )}
          </Section>

          {/* 6. Finishing Drizzles */}
          <Section title="Finishing Drizzles" icon="✨" badge="New">
            <div className="flex flex-wrap gap-2">
              {DRIZZLES.map(d => {
                const on = config.drizzles?.includes(d.label);
                return (
                  <motion.button
                    key={d.label}
                    whileHover={{ y: -3, scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleDrizzle(d.label)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
                      on
                        ? `${d.color} ring-1 ring-current shadow-lg scale-[1.04]`
                        : 'border-white/10 bg-white/4 text-stone-400 hover:border-white/22 hover:text-stone-200 hover:bg-white/8'
                    }`}
                  >
                    <span className="text-sm">{d.emoji}</span>
                    <span className="whitespace-nowrap">{d.label}</span>
                    {on && (
                      <>
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3.5 h-3.5 rounded-full bg-current flex items-center justify-center ml-0.5 shrink-0">
                          <Check className="w-2 h-2 text-black" />
                        </motion.span>
                        <span className="text-[10px] text-stone-500 ml-0.5">+$0.75</span>
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>
            {(config.drizzles?.length || 0) === 0 && (
              <p className="text-[10px] text-stone-600 mt-2">Drizzles are added after baking for the finishing touch — +$0.75 each</p>
            )}
          </Section>

          {/* 7. Bake Preference */}
          <Section title="Bake Preference" icon="🔥">
            <div className="grid grid-cols-3 gap-2.5">
              {BAKE_OPTIONS.map(b => (
                <OptionCard
                  key={b.value}
                  selected={config.bakePreference === b.value}
                  onClick={() => update({ bakePreference: b.value })}
                  emoji={b.emoji}
                  label={b.value!}
                  desc={b.desc}
                />
              ))}
            </div>
          </Section>

          {/* 8. Cut Style */}
          <Section title="Cut Style" icon="✂️">
            <div className="grid grid-cols-3 gap-2.5">
              {CUT_OPTIONS.map(c => (
                <OptionCard
                  key={c.value}
                  selected={config.cutStyle === c.value}
                  onClick={() => update({ cutStyle: c.value })}
                  emoji={c.emoji}
                  label={c.value!}
                  desc={c.desc}
                />
              ))}
            </div>
          </Section>

          {/* 9. Special Instructions */}
          <Section title="Special Instructions" icon="📝">
            <textarea
              rows={3}
              value={config.specialInstructions || ''}
              onChange={e => update({ specialInstructions: e.target.value.slice(0, 250) })}
              placeholder="E.g. extra crispy on the bottom, light sauce, leave at door, allergy notes…"
              className="w-full bg-white/6 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500/40 focus:bg-white/8 resize-none transition-all"
            />
            <div className="flex justify-between items-center mt-1.5">
              <p className="text-[9px] text-stone-600">Optional — store will see this with your order</p>
              <p className="text-[9px] text-stone-600">{(config.specialInstructions || '').length}/250</p>
            </div>
          </Section>

        </div>

      </div>
    </div>
  );
}
