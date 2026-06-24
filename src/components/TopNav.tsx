import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, ShoppingCart, Heart, Pizza, Check, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface TopNavProps {
  isLight: boolean;
  onThemeChange: (isLight: boolean) => void;
  cartItemCount: number;
  onCartClick: () => void;
  onFavoritesClick: () => void;
  onLogoClick: () => void;
}

function NavBadge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-sm border-2 border-white"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function TopNav({ isLight, onThemeChange, cartItemCount, onCartClick, onFavoritesClick, onLogoClick }: TopNavProps) {
  const { state } = useApp();
  const favoriteCount = state.favoriteStoreIds.size;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-center justify-between px-4 py-3 pointer-events-auto">

        {/* Left — logo (mobile only) */}
        <button
          onClick={onLogoClick}
          className="lg:hidden clay-soft flex items-center gap-2 bg-white rounded-2xl px-3 py-2"
        >
          <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Pizza className="w-4 h-4 text-white" />
          </div>
          <span className="text-stone-800 font-black text-sm tracking-tight">MiSlice</span>
        </button>

        <div className="hidden lg:block" />

        {/* Right — actions */}
        <div className="flex items-center gap-2">

          {/* Favourites */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={onFavoritesClick}
            className="clay-btn relative flex items-center gap-2 bg-white rounded-2xl px-3.5 py-2.5 group"
            title="Favourites"
          >
            <Heart className={`w-4 h-4 transition-colors ${favoriteCount > 0 ? 'fill-red-500 text-red-500' : 'text-stone-400 group-hover:text-red-400'}`} />
            <AnimatePresence mode="wait">
              {favoriteCount > 0 && (
                <motion.span
                  key={favoriteCount}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-xs font-black text-red-400 overflow-hidden whitespace-nowrap"
                >
                  {favoriteCount}
                </motion.span>
              )}
            </AnimatePresence>
            <span className="text-xs font-bold text-stone-500 group-hover:text-stone-800 transition-colors hidden sm:inline">
              Favourites
            </span>
            <NavBadge count={0} />
          </motion.button>

          {/* Cart */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={onCartClick}
            className={`clay-btn relative flex items-center gap-2 rounded-2xl px-3.5 py-2.5 group ${cartItemCount > 0 ? 'bg-amber-50' : 'bg-white'}`}
            title="Cart"
          >
            <ShoppingCart className={`w-4 h-4 transition-colors ${cartItemCount > 0 ? 'text-amber-600' : 'text-stone-400 group-hover:text-amber-500'}`} />
            <AnimatePresence mode="wait">
              {cartItemCount > 0 && (
                <motion.span
                  key={cartItemCount}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="text-xs font-black text-amber-600"
                >
                  {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
                </motion.span>
              )}
            </AnimatePresence>
            <span className={`text-xs font-bold transition-colors hidden sm:inline ${cartItemCount > 0 ? 'text-amber-600' : 'text-stone-500 group-hover:text-stone-800'}`}>
              Cart
            </span>
            <NavBadge count={cartItemCount} />
          </motion.button>

          {/* Theme toggle button + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setDropdownOpen(v => !v)}
              className={`clay-btn w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                dropdownOpen ? 'bg-slate-100 text-slate-700' : 'bg-white text-stone-400 hover:text-amber-500'
              }`}
              title="Theme"
            >
              <AnimatePresence mode="wait">
                {isLight ? (
                  <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun className="w-4 h-4 text-amber-500" />
                  </motion.span>
                ) : (
                  <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden z-[200]"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Appearance</p>
                  </div>

                  <div className="p-2 space-y-1">
                    {[
                      { label: 'Light Mode', icon: Sun,  value: true,  desc: 'Bright & clean' },
                      { label: 'Dark Mode',  icon: Moon, value: false, desc: 'Easy on the eyes' },
                    ].map(opt => {
                      const Icon = opt.icon;
                      const active = isLight === opt.value;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => { onThemeChange(opt.value); setDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                            active ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            active ? 'border-white bg-white' : 'border-slate-300'
                          }`}>
                            {active && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                          </div>
                          <Icon className="w-4 h-4 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-tight">{opt.label}</p>
                            <p className={`text-[10px] leading-tight ${active ? 'text-white/60' : 'text-slate-400'}`}>{opt.desc}</p>
                          </div>
                          {active && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-4 pb-3 pt-1">
                    <p className="text-[10px] text-slate-400 text-center">
                      Meat preferences → <span className="font-bold text-slate-600">My Profile</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
