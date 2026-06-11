import React from 'react';
import { Home, Search, ChefHat, Heart, ShoppingBag, ShoppingCart, Settings, Info, Menu, X, Store, UserCircle, LogOut, Tag } from 'lucide-react';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export type ViewState = 'home' | 'compare' | 'pizza-builder' | 'saved-pizzas' | 'orders' | 'cart' | 'checkout' | 'admin-dashboard' | 'how-it-works' | 'local-deals' | 'order-confirmation';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  cartItemCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isPartner: boolean;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export function SidebarNavigation({ currentView, onNavigate, cartItemCount, isOpen, setIsOpen, isPartner, currentUser, onOpenAuth }: SidebarProps) {
  const navItems = [
    { id: 'home' as ViewState, label: 'Home', icon: Home },
    ...(currentUser && !isPartner ? [{ id: 'local-deals' as ViewState, label: 'Local Deals', icon: Tag }] : []),
    { id: 'pizza-builder' as ViewState, label: 'Pizza Builder', icon: ChefHat },
    { id: 'saved-pizzas' as ViewState, label: 'Favorites', icon: Heart },
    { id: 'orders' as ViewState, label: 'Orders', icon: ShoppingBag },
    { id: 'cart' as ViewState, label: 'Cart', icon: ShoppingCart, badge: cartItemCount },
    ...(isPartner ? [{ id: 'admin-dashboard' as ViewState, label: 'Store Menu', icon: Store }] : []),
    { id: 'how-it-works' as ViewState, label: 'How It Works', icon: Info },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-stone-900/90 border border-stone-700/50 rounded-xl text-white backdrop-blur-md shadow-xl"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40
        w-64 bg-stone-950/80 backdrop-blur-xl border-r border-stone-800/50
        flex flex-col p-4 transition-transform duration-500
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 mb-10 px-2 pt-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            MI
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans">slice<span className="text-stone-500">.online</span></span>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 scrollbar-hide">
          {navItems.map(item => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group
                  ${isActive ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] text-white' : 'text-stone-400 hover:bg-stone-800/50 hover:text-white'}`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg border border-stone-900">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-stone-800/50">
           <p className="text-center text-stone-600 text-xs py-4 font-bold flex items-center justify-center gap-1"><Heart className="w-3 h-3 text-red-600" /> MiSlice © 2026</p>
        </div>
      </aside>
    </>
  );
}
