import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Clock, MapPin, Phone, ExternalLink, Heart, ShoppingCart,
  ChevronDown, ChevronUp, Tag, Pizza, Share2, Navigation, X,
  CheckCircle, Info, Zap, TrendingUp, Plus, Eye,
} from 'lucide-react';
import { MarketplaceStore, MarketplaceMenuItem } from '../data/marketplace';
import { useApp } from '../store/AppContext';
import { PizzaConfig } from '../types';
import { CartItem } from '../types';

interface StoreGridProps {
  onAddToCart: (item: Omit<CartItem, 'id'>, redirect?: boolean) => void;
  onCompare: (config: PizzaConfig) => void;
  onNavigate: (view: string) => void;
  onOpenStore?: (store: MarketplaceStore) => void;
}

// ── Price stars ────────────────────────────────────────────────────────────────

function PriceRange({ range }: { range: string }) {
  return (
    <span className="text-stone-400 text-xs font-bold">
      <span className={range.length >= 1 ? 'text-green-400' : ''}>$</span>
      <span className={range.length >= 2 ? 'text-green-400' : 'text-stone-700'}>$</span>
      <span className={range.length >= 3 ? 'text-green-400' : 'text-stone-700'}>$</span>
    </span>
  );
}

// ── Menu item row ──────────────────────────────────────────────────────────────

function MenuItemRow({ item, onAdd }: { item: MarketplaceMenuItem; onAdd: (item: MarketplaceMenuItem) => void }) {
  return (
    <div className="flex items-center gap-3 py-2.5 group">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.imageColor} flex items-center justify-center shrink-0 text-lg`}>
        {item.category === 'pizza' ? '🍕' : item.category === 'sides' ? '🥗' : item.category === 'drinks' ? '🥤' : '🍰'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{item.name}</p>
        <p className="text-[10px] text-stone-500 truncate">{item.description}</p>
        {item.tags.length > 0 && (
          <div className="flex gap-1 mt-0.5">
            {item.tags.slice(0, 2).map(t => (
              <span key={t} className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded">{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <p className="text-sm font-black text-green-400">${item.price.toFixed(2)}</p>
        <button
          onClick={() => onAdd(item)}
          className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shadow-[0_0_10px_rgba(220,38,38,0.4)]"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Deal badge ─────────────────────────────────────────────────────────────────

function DealBadge({ deal }: { deal: { title: string; badge: string; code: string } }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(deal.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-xl px-3 py-2">
      <span className="text-xs font-bold text-green-300 flex-1 truncate">{deal.badge} {deal.title}</span>
      <button
        onClick={copy}
        className="text-[9px] font-black text-green-400 bg-green-500/15 border border-green-500/20 px-2 py-0.5 rounded-lg hover:bg-green-500/25 transition-colors shrink-0"
      >
        {copied ? <><CheckCircle className="w-3 h-3 inline" /> Copied!</> : deal.code}
      </button>
    </div>
  );
}

// ── Store Card ─────────────────────────────────────────────────────────────────

function StoreCard({ store, index, onAddToCart, onCompare, onNavigate, onOpenStore }: {
  store: MarketplaceStore;
  index: number;
  onAddToCart: StoreGridProps['onAddToCart'];
  onCompare: StoreGridProps['onCompare'];
  onNavigate: StoreGridProps['onNavigate'];
  onOpenStore?: StoreGridProps['onOpenStore'];
}) {
  const { state, toggleFavorite, showToast } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'deals' | 'reviews'>('menu');
  const isFav = state.favoriteStoreIds.has(store.id);

  const addMenuItem = (item: MarketplaceMenuItem) => {
    onAddToCart({
      store_id: store.id,
      store_name: store.name,
      item_name: item.name,
      quantity: 1,
      price_per_item: item.price,
      total_price: item.price,
      delivery_type: 'store-delivery',
    });
    showToast(`${item.name} added to cart!`);
  };

  const handleCompare = () => {
    const config: PizzaConfig = {
      size: 'Large',
      crust: 'Hand Tossed',
      sauce: 'Robust Inspired Tomato Sauce',
      cheese: ['Mozzarella'],
      meats: store.menu.find(m => m.isPopular && m.category === 'pizza')?.name.includes('Pepperoni') ? ['Pepperoni'] : [],
      veggies: [],
      extras: [],
      quantity: 1,
    };
    onCompare(config);
    showToast(`Comparing ${store.name}...`);
  };

  const handleCall = () => window.open(`tel:${store.phone}`, '_self');
  const handleDirections = () => window.open(`https://maps.google.com/?q=${encodeURIComponent(store.address + ', Detroit, MI')}`, '_blank');
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: store.name, text: `Check out ${store.name} on MiSlice!` });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied!');
    }
  };

  const menuItems = store.menu.filter(m => m.category === 'pizza').slice(0, activeTab === 'menu' ? 8 : 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), type: 'spring', stiffness: 300, damping: 28 }}
      className={`bg-[#111]/90 backdrop-blur border rounded-2xl overflow-hidden transition-all duration-300 ${
        expanded ? 'border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.1)]' : 'border-white/8 hover:border-white/15'
      } ${!store.isOpen ? 'opacity-70' : ''}`}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Logo */}
        <div className={`w-14 h-14 ${store.logoColor} rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg relative`}>
          {store.id === 'shamz' && <img src="/shamz-pizza-store.png" alt="" className="w-full h-full object-cover rounded-2xl" />}
          {store.id !== 'shamz' && store.emoji}
          {store.isNew && (
            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[7px] font-black px-1 py-0.5 rounded-full">NEW</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <p className="font-black text-white text-sm truncate">{store.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="flex items-center gap-0.5 text-yellow-400 text-xs font-bold">
                  <Star className="w-3 h-3 fill-current" />{store.rating}
                </span>
                <span className="text-stone-600 text-xs">·</span>
                <span className="text-stone-500 text-xs">{store.reviewCount.toLocaleString()} reviews</span>
                <span className="text-stone-600 text-xs">·</span>
                <PriceRange range={store.priceRange} />
                <span className="text-stone-600 text-xs">·</span>
                <span className="text-stone-500 text-xs">{store.neighborhood}</span>
              </div>
            </div>
            {/* Fav + expand */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(store.id); showToast(isFav ? 'Removed from favorites' : `${store.name} saved!`); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFav ? 'bg-red-600/20 text-red-400' : 'bg-white/5 text-stone-500 hover:text-red-400'}`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
              </button>
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                <ChevronDown className="w-4 h-4 text-stone-500" />
              </motion.div>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${store.isOpen ? 'text-green-400 bg-green-500/8 border-green-500/20' : 'text-red-400 bg-red-500/8 border-red-500/20'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${store.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {store.isOpen ? `Open · ${store.openUntil}` : store.openUntil}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-stone-500 font-medium">
              <Clock className="w-2.5 h-2.5" />{store.deliveryTime} min
            </span>
            <span className="text-[10px] text-stone-500 font-medium">
              {store.deliveryFee === 0 ? <span className="text-green-400 font-bold">Free delivery</span> : `$${store.deliveryFee.toFixed(2)} del`}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-stone-500">
              <MapPin className="w-2.5 h-2.5" />{store.distance} mi
            </span>
          </div>

          {/* Badges */}
          {store.badges.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {store.badges.map(b => (
                <span key={b} className="text-[8px] font-black text-red-300 bg-red-500/8 border border-red-500/15 px-1.5 py-0.5 rounded-full">{b}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            {/* Action bar */}
            <div className="flex items-center gap-2 px-4 pb-3">
              <button
                onClick={() => onOpenStore?.(store)}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(220,38,38,0.25)]"
              >
                <Eye className="w-3.5 h-3.5" /> View Menu & Order
              </button>
              <button
                onClick={handleCompare}
                className="flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 px-3 py-2.5 rounded-xl transition-colors"
              >
                <TrendingUp className="w-3 h-3" /> Compare
              </button>
              <button onClick={handleCall} className="w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-stone-400 hover:text-green-400 hover:border-green-500/30 transition-colors">
                <Phone className="w-4 h-4" />
              </button>
              <button onClick={handleDirections} className="w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-stone-400 hover:text-blue-400 hover:border-blue-500/30 transition-colors">
                <Navigation className="w-4 h-4" />
              </button>
              <button onClick={handleShare} className="w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-stone-400 hover:text-white hover:border-white/25 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Promoted deal */}
            {store.deals.length > 0 && (
              <div className="px-4 pb-3">
                <DealBadge deal={store.deals[0]} />
              </div>
            )}

            {/* Tab bar */}
            <div className="flex border-b border-white/8 px-4">
              {(['menu', 'deals', 'reviews'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2.5 px-4 text-xs font-bold capitalize border-b-2 transition-colors -mb-px ${activeTab === tab ? 'border-red-500 text-white' : 'border-transparent text-stone-500 hover:text-white'}`}
                >
                  {tab}
                  {tab === 'deals' && store.deals.length > 0 && (
                    <span className="ml-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full inline-flex items-center justify-center">{store.deals.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="px-4 py-3 max-h-64 overflow-y-auto no-scrollbar">
              {activeTab === 'menu' && (
                <div className="divide-y divide-white/5">
                  {store.menu.map(item => (
                    <MenuItemRow key={item.id} item={item} onAdd={addMenuItem} />
                  ))}
                  <button
                    onClick={() => onNavigate('pizza-builder')}
                    className="w-full text-center py-3 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    Customize your own pizza → Builder
                  </button>
                </div>
              )}

              {activeTab === 'deals' && (
                <div className="space-y-2 py-1">
                  {store.deals.length === 0 ? (
                    <p className="text-center text-stone-500 text-xs py-6">No active deals right now.</p>
                  ) : store.deals.map(deal => (
                    <div key={deal.id} className="bg-white/4 border border-white/8 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-white">{deal.title}</p>
                        <span className="text-[9px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full shrink-0">{deal.badge}</span>
                      </div>
                      <p className="text-[10px] text-stone-500 mb-2">{deal.description}</p>
                      <DealBadge deal={deal} />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-3 py-1">
                  {store.reviews.length === 0 ? (
                    <p className="text-center text-stone-500 text-xs py-6">No reviews yet. Be the first!</p>
                  ) : store.reviews.map(r => (
                    <div key={r.id} className="bg-white/4 border border-white/8 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 text-[10px] font-black flex items-center justify-center border border-red-500/20">{r.avatar}</div>
                        <p className="text-xs font-bold text-white">{r.user}</p>
                        <div className="flex items-center gap-0.5 ml-auto">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-2.5 h-2.5 ${i < r.rating ? 'text-yellow-400 fill-current' : 'text-stone-700'}`} />
                          ))}
                        </div>
                        <span className="text-[9px] text-stone-600">{r.date}</span>
                      </div>
                      <p className="text-[11px] text-stone-400">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Grid ───────────────────────────────────────────────────────────────────────

export function StoreGrid({ onAddToCart, onCompare, onNavigate, onOpenStore }: StoreGridProps) {
  const { state } = useApp();
  const { searchResults, isSearching } = state;

  if (searchResults.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <div className="text-5xl mb-4">🍕</div>
        <p className="text-white font-black text-lg mb-2">No stores found</p>
        <p className="text-stone-500 text-sm">Try adjusting your filters or search differently.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {searchResults.map((store, i) => (
        <StoreCard
          key={store.id}
          store={store}
          index={i}
          onAddToCart={onAddToCart}
          onCompare={onCompare}
          onNavigate={onNavigate}
          onOpenStore={onOpenStore}
        />
      ))}
    </div>
  );
}
