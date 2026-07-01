import React, { useState } from 'react';
import { Menu, X, LogOut, Pizza, Store, ChevronRight, Home } from 'lucide-react';
import { GridScan } from './GridScan';

export type ViewState =
  | 'home' | 'compare' | 'pizza-builder' | 'saved-pizzas'
  | 'orders' | 'cart' | 'checkout' | 'admin-dashboard'
  | 'how-it-works' | 'local-deals' | 'order-confirmation' | 'order-tracking'
  | 'profile' | 'rewards' | 'notifications' | 'deals-hub'
  | 'legal' | 'contact' | 'favorite-stores';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  cartItemCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isStoreOwner?: boolean;
  storeOwnerName?: string;
  onStoreOwnerLogout?: () => void;
  customerName?: string;
  onCustomerLogout?: () => void;
}

const DEALS_HUB_VIEWS = new Set(['deals-hub', 'local-deals', 'rewards', 'notifications']);

const CUSTOMER_NAV = [
  { label: 'Build a Pizza',  view: 'pizza-builder' as ViewState, emoji: '🍕' },
  { label: 'Compare Pizzas', view: 'compare'        as ViewState, emoji: '⚖️' },
  { label: 'Deals & Offers', view: 'deals-hub'      as ViewState, emoji: '🏷️' },
  { label: 'How It Works',   view: 'how-it-works'   as ViewState, emoji: '💡' },
  { label: 'Contact',        view: 'contact'         as ViewState, emoji: '✉️' },
];

const STORE_NAV = [
  { label: 'Dashboard',    view: 'admin-dashboard' as ViewState, emoji: '📊' },
  { label: 'How It Works', view: 'how-it-works'   as ViewState, emoji: '💡' },
  { label: 'Contact',      view: 'contact'         as ViewState, emoji: '✉️' },
];

export function SidebarNavigation({
  currentView, onNavigate, isOpen, setIsOpen,
  isStoreOwner, storeOwnerName, onStoreOwnerLogout,
  customerName, onCustomerLogout,
}: SidebarProps) {
  const [logoHover, setLogoHover] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const go = (view: ViewState) => { onNavigate(view); setIsOpen(false); };
  const handleLogoClick = () => { go('home'); };

  const navItems = isStoreOwner ? STORE_NAV : CUSTOMER_NAV;

  const isActive = (view: ViewState) =>
    currentView === view || (view === 'deals-hub' && DEALS_HUB_VIEWS.has(currentView));

  const avatar = (() => {
    try {
      const p = JSON.parse(localStorage.getItem('miSliceCustomerProfile') || '{}');
      return p.avatar || '';
    } catch { return ''; }
  })();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #dc2626, #ef4444)',
          boxShadow: '0 4px 16px rgba(220,38,38,0.45)',
        }}
        aria-label="Menu"
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        {!isOpen && <span className="text-white font-black text-sm tracking-tight">Menu</span>}
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 w-64
          flex flex-col transition-transform duration-300 overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: '#0a0a14' }}
      >
        {/* Animated GridScan background */}
        <GridScan
          linesColor="#3a1520"
          scanColor="#dc2626"
          scanOpacity={0.55}
          gridScale={0.13}
          lineThickness={1.2}
          scanGlow={0.7}
          scanSoftness={2.5}
          scanDuration={2.5}
          scanDelay={1.5}
          noiseIntensity={0.008}
          enablePost={false}
        />

        {/* Dark gradient overlay so content stays readable */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: 'linear-gradient(180deg, rgba(10,10,20,0.82) 0%, rgba(10,10,20,0.72) 60%, rgba(10,10,20,0.92) 100%)',
          }}
        />

        {/* ── Logo / Home button ── */}
        <button
          onClick={handleLogoClick}
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
          className="relative z-10 flex items-center gap-3 px-4 py-4 shrink-0 transition-colors group"
          style={{
            borderBottom: '1px solid rgba(220,38,38,0.18)',
            background: logoHover ? 'rgba(220,38,38,0.12)' : 'transparent',
          }}
          title="Go to home"
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #ef4444)',
              boxShadow: logoHover
                ? '0 6px 24px rgba(220,38,38,0.6)'
                : '0 3px 12px rgba(220,38,38,0.4)',
              transform: logoHover ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <Pizza className="w-5 h-5 text-white" />
          </div>

          <div className="text-left flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-black text-lg tracking-tight leading-none transition-colors"
                style={{ color: logoHover ? '#fca5a5' : '#ffffff' }}
              >
                MiSlice
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none"
                style={{ background: 'rgba(220,38,38,0.25)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.4)' }}>
                MI
              </span>
            </div>
            <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              Pizza Marketplace
            </p>
          </div>

          <Home
            className="w-3.5 h-3.5 shrink-0 transition-colors"
            style={{ color: logoHover ? '#fca5a5' : 'rgba(255,255,255,0.2)' }}
          />
        </button>

        {/* ── Nav items ── */}
        <nav className="relative z-10 flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map(item => {
            const active = isActive(item.view);
            const hovered = hoveredItem === item.view;
            return (
              <button
                key={item.view}
                onClick={() => go(item.view)}
                onMouseEnter={() => setHoveredItem(item.view)}
                onMouseLeave={() => setHoveredItem(null)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={
                  active
                    ? {
                        background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                        color: '#ffffff',
                        boxShadow: '0 3px 12px rgba(220,38,38,0.35)',
                        border: '1px solid rgba(220,38,38,0.5)',
                      }
                    : hovered
                    ? {
                        background: 'rgba(220,38,38,0.15)',
                        color: '#fca5a5',
                        border: '1px solid rgba(220,38,38,0.25)',
                      }
                    : {
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.6)',
                        border: '1px solid transparent',
                      }
                }
              >
                <span className="text-base leading-none">{item.emoji}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" style={{ color: 'rgba(255,200,200,0.8)' }} />}
              </button>
            );
          })}
        </nav>

        {/* ── Footer / User ── */}
        <div
          className="relative z-10 shrink-0 p-3 space-y-1"
          style={{
            borderTop: '1px solid rgba(220,38,38,0.18)',
            background: 'rgba(10,10,20,0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isStoreOwner ? (
            <>
              <div className="rounded-xl px-3 py-2 mb-2"
                style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#fca5a5' }}>Store Owner</p>
                <p className="text-xs font-bold text-white truncate">{storeOwnerName}</p>
              </div>
              <button
                onClick={() => go('admin-dashboard')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; }}
              >
                <Store className="w-4 h-4" /> Store Dashboard
              </button>
              <button
                onClick={onStoreOwnerLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'; }}
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out of Store
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => go('profile')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group mb-1"
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{ border: '2px solid rgba(220,38,38,0.5)' }} />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)' }}>
                    {(customerName || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{customerName || 'Guest'}</p>
                  <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>View profile</p>
                </div>
              </button>
              <button
                onClick={onCustomerLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'; }}
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </>
          )}
          <p className="text-center text-[9px] font-bold pt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>
            MiSlice © 2026 · Michigan
          </p>
        </div>
      </aside>
    </>
  );
}
