import React from 'react';
import {
  Home, ChefHat, ShoppingBag, Info, Menu, X, Tag, Store,
  LogOut, BarChart2, Map, User, Gift, Bell, Star, ChevronRight,
  Pizza, Zap,
} from 'lucide-react';

export type ViewState =
  | 'home' | 'compare' | 'pizza-builder' | 'saved-pizzas'
  | 'orders' | 'cart' | 'checkout' | 'admin-dashboard'
  | 'how-it-works' | 'local-deals' | 'order-confirmation' | 'order-tracking'
  | 'profile' | 'rewards' | 'notifications';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  cartItemCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isStoreOwner?: boolean;
  storeOwnerName?: string;
  onStoreOwnerLogin?: () => void;
  onStoreOwnerLogout?: () => void;
  customerName?: string;
  onCustomerLogout?: () => void;
}

const DIVIDER = '---';

const NAV_SECTIONS = [
  {
    label: 'Discover',
    items: [
      { id: 'home', label: 'Home', icon: Home, desc: 'Stores, deals & pizza map' },
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
      { id: 'orders', label: 'My Orders', icon: ShoppingBag, desc: 'Order history & reorder' },
      { id: 'rewards', label: 'Rewards', icon: Gift, desc: 'Points & loyalty perks', badge: 'NEW' },
      { id: 'local-deals', label: 'Deals & Alerts', icon: Tag, desc: 'Live deals + price alerts' },
      { id: 'profile', label: 'My Profile', icon: User, desc: 'Preferences & address' },
    ],
  },
  {
    label: 'Info',
    items: [
      { id: 'how-it-works', label: 'How It Works', icon: Info, desc: 'Learn about MiSlice' },
    ],
  },
] as const;

export function SidebarNavigation({
  currentView, onNavigate, cartItemCount, isOpen, setIsOpen,
  isStoreOwner, storeOwnerName, onStoreOwnerLogin, onStoreOwnerLogout,
  customerName, onCustomerLogout,
}: SidebarProps) {
  const go = (view: ViewState) => { onNavigate(view); setIsOpen(false); };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 clay-soft bg-white rounded-xl text-stone-700"
        aria-label="Menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40
        w-64 bg-white/95 backdrop-blur-xl border-r border-stone-200/70
        flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <button
          onClick={() => go('home')}
          className="flex items-center gap-3 px-5 py-5 border-b border-stone-100 hover:bg-stone-50 transition-colors"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
            <Pizza className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <span className="text-stone-800 font-black text-base tracking-tight">MiSlice</span>
            <p className="text-[9px] text-stone-400 font-bold -mt-0.5 uppercase tracking-widest">Pizza Marketplace</p>
          </div>
        </button>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 px-3 mb-2">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(item.id as ViewState)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group relative ${
                        active
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[0_6px_16px_-4px_rgba(255,171,46,0.5)]'
                          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-stone-400 group-hover:text-stone-700'} transition-colors`} />
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold leading-tight">{item.label}</span>
                          {'badge' in item && item.badge && (
                            <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full shrink-0">{item.badge}</span>
                          )}
                        </div>
                        {!active && (
                          <p className="text-[9px] text-stone-400 group-hover:text-stone-500 transition-colors leading-tight mt-0.5 truncate">{item.desc}</p>
                        )}
                      </div>
                      {active && <div className="w-1 h-4 bg-white/50 rounded-full shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-stone-100 p-3 space-y-1">
          {isStoreOwner ? (
            <>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2 mb-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-0.5">Store Owner</p>
                <p className="text-xs font-bold text-stone-800 truncate">{storeOwnerName}</p>
              </div>
              <button
                onClick={() => go('admin-dashboard')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors text-sm font-bold"
              >
                <Store className="w-4 h-4" /> Store Dashboard
              </button>
              <button
                onClick={onStoreOwnerLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-stone-400 hover:text-red-500 hover:bg-red-50 text-xs font-bold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out of Store
              </button>
            </>
          ) : (
            <>
              {/* Customer identity */}
              <button
                onClick={() => go('profile')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-100 transition-colors group mb-1"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {(customerName || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800 truncate">{customerName || 'Guest'}</p>
                  <p className="text-[9px] text-stone-400">View profile</p>
                </div>
              </button>

              {/* Store owner switch */}
              <button
                onClick={onStoreOwnerLogin}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors group"
              >
                <Store className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-stone-500 group-hover:text-stone-800 transition-colors">Store Owner?</p>
                  <p className="text-[9px] text-stone-400">Switch to store dashboard</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </button>

              {/* Sign out */}
              <button
                onClick={onCustomerLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-stone-400 hover:text-red-500 hover:bg-red-50 text-xs font-bold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </>
          )}
          <p className="text-center text-stone-300 text-[9px] font-bold pt-1">MiSlice © 2026</p>
        </div>
      </aside>
    </>
  );
}
