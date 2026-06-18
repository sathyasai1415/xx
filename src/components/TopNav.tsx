import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, ShoppingCart, Heart, Pizza } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface TopNavProps {
  isLight: boolean;
  setIsLight: (val: boolean) => void;
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

export function TopNav({ isLight, setIsLight, cartItemCount, onCartClick, onFavoritesClick, onLogoClick }: TopNavProps) {
  const { state } = useApp();
  const favoriteCount = state.favoriteStoreIds.size;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-center justify-between px-4 py-3 pointer-events-auto">

        {/* Left — logo (mobile only, hidden on lg where sidebar shows) */}
        <button
          onClick={onLogoClick}
          className="lg:hidden clay-soft flex items-center gap-2 bg-white rounded-2xl px-3 py-2"
        >
          <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Pizza className="w-4 h-4 text-white" />
          </div>
          <span className="text-stone-800 font-black text-sm tracking-tight">MiSlice</span>
        </button>

        {/* Desktop spacer (sidebar takes left side) */}
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
            className={`clay-btn relative flex items-center gap-2 rounded-2xl px-3.5 py-2.5 group ${
              cartItemCount > 0 ? 'bg-amber-50' : 'bg-white'
            }`}
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

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsLight(!isLight)}
            className="clay-btn w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-stone-400 hover:text-amber-500"
            title="Toggle theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </motion.button>

        </div>
      </div>
    </div>
  );
}
