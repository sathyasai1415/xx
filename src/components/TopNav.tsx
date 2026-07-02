import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, ShoppingCart, Heart, Pizza, Check, Star, ShoppingBag } from 'lucide-react';
import { gsap } from 'gsap';
import { useApp } from '../store/AppContext';

interface TopNavProps {
  isLight: boolean;
  onThemeChange: (isLight: boolean) => void;
  cartItemCount: number;
  onCartClick: () => void;
  onFavoritesClick: () => void;
  onFavoriteStoresClick: () => void;
  onLogoClick: () => void;
  onOrdersClick: () => void;
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
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-sm"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// PillNav-style button with gsap circle-sweep hover animation
function PillButton({
  children,
  onClick,
  label,
  className = '',
  ease = 'power3.easeOut',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label?: string;
  className?: string;
  ease?: string;
}) {
  const pillRef = useRef<HTMLButtonElement>(null);
  const circleRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const labelHoverRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const layout = useCallback(() => {
    const pill = pillRef.current;
    const circle = circleRef.current;
    if (!pill || !circle) return;

    const rect = pill.getBoundingClientRect();
    const { width: w, height: h } = rect;
    if (!w || !h) return;

    const R = ((w * w) / 4 + h * h) / (2 * h);
    const D = Math.ceil(2 * R) + 2;
    const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
    const originY = D - delta;

    circle.style.width = `${D}px`;
    circle.style.height = `${D}px`;
    circle.style.bottom = `-${delta}px`;

    gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });

    if (labelRef.current) gsap.set(labelRef.current, { y: 0 });
    if (labelHoverRef.current) gsap.set(labelHoverRef.current, { y: h + 12, opacity: 0 });

    tlRef.current?.kill();
    const tl = gsap.timeline({ paused: true });
    tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);
    if (labelRef.current) tl.to(labelRef.current, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
    if (labelHoverRef.current) {
      gsap.set(labelHoverRef.current, { y: Math.ceil(h + 100), opacity: 0 });
      tl.to(labelHoverRef.current, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
    }
    tlRef.current = tl;
  }, [ease]);

  useEffect(() => {
    // Layout after first paint
    const id = requestAnimationFrame(() => {
      layout();
      if (document.fonts?.ready) document.fonts.ready.then(layout).catch(() => {});
    });
    window.addEventListener('resize', layout);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', layout); };
  }, [layout]);

  const handleEnter = () => {
    const tl = tlRef.current;
    if (!tl) return;
    tweenRef.current?.kill();
    tweenRef.current = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: 'auto' });
  };

  const handleLeave = () => {
    const tl = tlRef.current;
    if (!tl) return;
    tweenRef.current?.kill();
    tweenRef.current = tl.tweenTo(0, { duration: 0.2, ease, overwrite: 'auto' });
  };

  return (
    <button
      ref={pillRef}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      aria-label={label}
      className={`pill-btn relative flex items-center justify-center gap-1.5 overflow-hidden ${className}`}
      style={{
        background: 'rgba(124,58,237,0.18)',
        border: '1px solid rgba(139,92,246,0.35)',
        borderRadius: '9999px',
        color: '#C4B5FD',
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}
    >
      {/* gsap circle sweep */}
      <span
        ref={circleRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 0,
          borderRadius: '50%',
          background: 'rgba(139,92,246,0.85)',
          zIndex: 1,
          display: 'block',
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />
      {/* label stack */}
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px', zIndex: 2 }} ref={labelRef}>
        {children}
      </span>
      {/* hover label (purple text on hover) */}
      <span
        ref={labelHoverRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0, top: 0, right: 0, bottom: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          color: '#fff',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        {children}
      </span>
    </button>
  );
}

export function TopNav({ isLight, onThemeChange, cartItemCount, onCartClick, onFavoritesClick, onFavoriteStoresClick, onLogoClick, onOrdersClick }: TopNavProps) {
  const { state, showToast } = useApp();
  const favoriteCount = state.favoriteStoreIds.size;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 pointer-events-auto">

        {/* Left — logo pill */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:opacity-90"
          style={{
            background: 'rgba(15,12,25,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center shadow">
            <Pizza className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-black text-sm tracking-tight">MiSlice</span>
        </button>

        {/* Right — pill nav cluster */}
        <div
          className="flex items-center gap-1.5 px-2 py-2 rounded-full"
          style={{
            background: 'rgba(15,12,25,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          {/* Favourite Stores pill */}
          <PillButton onClick={onFavoriteStoresClick} label="Favourite Stores" className="h-9 px-3.5 text-xs">
            <Star className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-xs font-bold">Stores</span>
          </PillButton>

          {/* Saved pizzas pill */}
          <PillButton onClick={onFavoritesClick} label="Favourites" className="h-9 px-3.5 text-xs">
            <Heart className={`w-3.5 h-3.5 shrink-0 ${favoriteCount > 0 ? 'fill-pink-400 text-pink-400' : ''}`} />
            <span className="hidden sm:inline text-xs font-bold">
              {favoriteCount > 0 ? `${favoriteCount} Saved` : 'Saved'}
            </span>
          </PillButton>

          {/* Orders pill */}
          <PillButton onClick={onOrdersClick} label="Orders" className="h-9 px-3.5 text-xs">
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-xs font-bold">Orders</span>
          </PillButton>

          {/* Cart pill */}
          <div className="relative">
            <PillButton onClick={onCartClick} label="Cart" className="h-9 px-3.5 text-xs">
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <AnimatePresence mode="wait">
                {cartItemCount > 0 && (
                  <motion.span
                    key={cartItemCount}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    className="text-xs font-black"
                  >
                    {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
                  </motion.span>
                )}
              </AnimatePresence>
            </PillButton>
            <NavBadge count={cartItemCount} />
          </div>


          {/* Theme pill */}
          <div className="relative" ref={dropdownRef}>
            <PillButton onClick={() => setDropdownOpen(v => !v)} label="Theme" className="h-9 w-9">
              <AnimatePresence mode="wait">
                {isLight ? (
                  <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                  </motion.span>
                ) : (
                  <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon className="w-3.5 h-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </PillButton>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="absolute right-0 top-12 w-52 rounded-2xl overflow-hidden z-[200]"
                  style={{
                    background: 'rgba(15,12,25,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
                  }}
                >
                  <div className="px-4 py-3 border-b border-violet-500/20">
                    <p className="text-[10px] font-black text-violet-300 uppercase tracking-widest">Appearance</p>
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
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                          style={{
                            background: active ? 'rgba(124,58,237,0.4)' : 'transparent',
                            border: active ? '1px solid rgba(139,92,246,0.5)' : '1px solid transparent',
                            color: active ? '#fff' : '#A78BFA',
                          }}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-tight text-white">{opt.label}</p>
                            <p className="text-[10px] leading-tight text-violet-400">{opt.desc}</p>
                          </div>
                          {active && <Check className="w-3.5 h-3.5 text-violet-300 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-4 pb-3 pt-1">
                    <p className="text-[10px] text-violet-500 text-center">Preferences → My Profile</p>
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
