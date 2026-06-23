import React, { useState } from 'react';
import {
  ChefHat, ShoppingBag, Info, Menu, X, Tag,
  LogOut, BarChart2, User, Pizza,
} from 'lucide-react';

export type ViewState =
  | 'home' | 'compare' | 'pizza-builder' | 'saved-pizzas'
  | 'orders' | 'cart' | 'checkout' | 'admin-dashboard'
  | 'how-it-works' | 'local-deals' | 'order-confirmation' | 'order-tracking'
  | 'profile' | 'rewards' | 'notifications' | 'deals-hub';

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

const NAV_SECTIONS = [
  {
    label: 'Discover',
    items: [
      { id: 'compare', label: 'Compare Prices', icon: BarChart2, desc: 'Side-by-side pricing' },
    ],
  },
  {
    label: 'Build',
    items: [
      { id: 'pizza-builder', label: 'Pizza Builder', icon: ChefHat, desc: 'Design your perfect pizza' },
    ],
  },
  {
    label: 'My Account',
    items: [
      { id: 'orders',    label: 'My Orders',       icon: ShoppingBag, desc: 'Order history & reorder' },
      { id: 'deals-hub', label: 'Deals & Rewards', icon: Tag,         desc: 'Live deals, alerts & loyalty points', badge: 'NEW' },
      { id: 'profile',   label: 'My Profile',      icon: User,        desc: 'Preferences & address' },
    ],
  },
  {
    label: 'Info',
    items: [
      { id: 'how-it-works', label: 'How It Works', icon: Info, desc: 'Learn about MiSlice' },
    ],
  },
] as const;

const DEALS_HUB_VIEWS = new Set(['deals-hub', 'local-deals', 'rewards', 'notifications']);

export function SidebarNavigation({
  currentView, onNavigate, cartItemCount, isOpen, setIsOpen,
  isStoreOwner, storeOwnerName, onStoreOwnerLogout,
  customerName, onCustomerLogout,
}: SidebarProps) {
  const [logoSpinning, setLogoSpinning] = useState(false);
  const go = (view: ViewState) => { onNavigate(view); setIsOpen(false); };

  const handleLogoClick = () => {
    setLogoSpinning(true);
    setTimeout(() => { setLogoSpinning(false); go('home'); }, 420);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#0D1020] border border-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
        aria-label="Menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40
        w-64 bg-[#0D1020] border-r border-white/8
        flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 px-5 py-5 border-b border-white/8 hover:bg-white/4 transition-colors group"
          title="Go home"
        >
          <div
            className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shrink-0"
            style={{
              boxShadow: logoSpinning
                ? '0 6px 20px rgba(220,38,38,0.6)'
                : '0 4px 12px rgba(220,38,38,0.4)',
              transform: logoSpinning
                ? 'perspective(300px) rotateY(360deg) scale(1.12)'
                : 'perspective(300px) rotateY(0deg) scale(1)',
              transition: 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
            }}
          >
            <Pizza className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <span className="text-white font-black text-base tracking-tight group-hover:text-red-300 transition-colors">MiSlice</span>
            <p className="text-[9px] text-white/35 font-bold -mt-0.5 uppercase tracking-widest">Pizza Marketplace</p>
          </div>
        </button>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/25 px-3 mb-2">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = currentView === item.id
                    || (item.id === 'deals-hub' && DEALS_HUB_VIEWS.has(currentView));
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(item.id as ViewState)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                        active
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_4px_14px_rgba(220,38,38,0.4)]'
                          : 'text-white/50 hover:bg-white/6 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-white' : 'text-white/35 group-hover:text-white/70'}`} />
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold leading-tight">{item.label}</span>
                          {'badge' in item && item.badge && (
                            <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full shrink-0">{item.badge}</span>
                          )}
                        </div>
                        {!active && (
                          <p className="text-[9px] text-white/25 group-hover:text-white/40 transition-colors leading-tight mt-0.5 truncate">{item.desc}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/8 p-3 space-y-1">
          {isStoreOwner ? (
            <>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-0.5">Store Owner</p>
                <p className="text-xs font-bold text-white truncate">{storeOwnerName}</p>
              </div>
              <button
                onClick={() => go('admin-dashboard')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/6 transition-colors text-sm font-semibold"
              >
                <Store className="w-4 h-4" /> Store Dashboard
              </button>
              <button
                onClick={onStoreOwnerLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/8 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out of Store
              </button>
            </>
          ) : (
            <>
              {/* Customer identity */}
              <button
                onClick={() => go('profile')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-colors group mb-1"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {(customerName || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{customerName || 'Guest'}</p>
                  <p className="text-[9px] text-white/30">View profile</p>
                </div>
              </button>

              {/* Sign out */}
              <button
                onClick={onCustomerLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/25 hover:text-red-400 hover:bg-red-500/8 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </>
          )}
          <p className="text-center text-white/15 text-[9px] font-bold pt-1">MiSlice © 2026</p>
        </div>
      </aside>
    </>
  );
}
