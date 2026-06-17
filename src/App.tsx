import { useState, useMemo, useEffect } from 'react';
import { FloatingPizzaUniverse } from './components/FloatingPizzaUniverse';
import './utils/debug';
import { seedShamzPizza } from './utils/seedShamzPizza';
import { AppProvider } from './store/AppContext';

// Seed Shamz Pizza store data on load
seedShamzPizza();
import { PremiumPizzaBuilder } from './components/PremiumPizzaBuilder';
import { ComparisonCards } from './components/ComparisonCards';
import { HomeView } from './components/HomeView';
import { HowItWorksView } from './components/HowItWorksView';
import { LocalDeals } from './components/LocalDeals';
import { PizzaConfig, DeliveryType, Review, Order, OrderItem } from './types';
import { calculateQuotes } from './lib/pricing';
import { Heart, Search, ShoppingBag } from 'lucide-react';

import { SidebarNavigation, ViewState } from './components/SidebarNavigation';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { CartItem } from './types';
import { TopNav } from './components/TopNav';
import { StoreOwnerModal } from './components/StoreOwnerModal';
import { StoreOwnerDashboard } from './components/StoreOwnerDashboard';
import { CustomerProfile } from './components/CustomerProfile';
import { RewardsView } from './components/RewardsView';
import { NotificationsView } from './components/NotificationsView';
import { OrderTracking } from './components/OrderTracking';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useAuth } from './store/AuthContext';
import { Loader2 } from 'lucide-react';
import {
  getUserData, saveUserCart, saveUserSavedPizzas,
  saveCustomerOrder, getCustomerOrders,
} from './lib/db';

export default function App() {
  const [pizzaConfig, setPizzaConfig] = useState<PizzaConfig | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType | 'auto'>('auto');
  const [view, setView] = useState<ViewState>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);

  // Theme state
  const [isLight, setIsLight] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<string>('');
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Cart — all local/localStorage, no auth needed
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('miSliceCart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('miSliceCart', JSON.stringify(newCart));
    if (uid) saveUserCart(uid, newCart).catch(e => console.error('saveUserCart failed', e));
  };

  // Saved pizzas — all local/localStorage
  const [favorites, setFavorites] = useState<{ id: string; name: string; config: PizzaConfig }[]>(() => {
    try {
      const saved = localStorage.getItem('miSliceFavorites');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const saveFavoritesToStorage = (favs: typeof favorites) => {
    setFavorites(favs);
    localStorage.setItem('miSliceFavorites', JSON.stringify(favs));
    if (uid) saveUserSavedPizzas(uid, favs).catch(e => console.error('saveUserSavedPizzas failed', e));
  };

  // Favorite stores
  const [favoriteStores, setFavoriteStores] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('miSliceFavStores');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Authentication (Firebase) — drives role-based routing
  const { profile, loading: authLoading, isAuthenticated, isStoreOwner, logout } = useAuth();
  const uid = profile?.uid ?? null;
  const customerName = profile?.fullName || '';
  const storeOwnerName = profile?.storeName || profile?.fullName || '';

  const handleSignOut = async () => {
    await logout();
    setCart([]);
    setView('home');
    showToast('Signed out.');
  };

  // On login, hydrate cart, saved pizzas and order history from Firestore.
  useEffect(() => {
    if (!uid) return;
    let active = true;
    (async () => {
      try {
        const [data, orders] = await Promise.all([getUserData(uid), getCustomerOrders(uid)]);
        if (!active) return;
        if (Array.isArray(data.cart)) setCart(data.cart as CartItem[]);
        if (Array.isArray(data.savedPizzas)) setFavorites(data.savedPizzas as typeof favorites);
        setPastOrders(orders as Order[]);
      } catch (e) {
        console.error('Failed to load user data from Firestore', e);
      }
    })();
    return () => { active = false; };
  }, [uid]);

  // Reviews
  const [userReviews, setUserReviews] = useState<Record<string, Review[]>>({});

  const saveFavorite = (config: PizzaConfig) => {
    const name = `${config.size || 'Medium'} ${config.crust || 'Custom'} Pizza`;
    const updated = [...favorites, { id: Date.now().toString(), name, config }];
    saveFavoritesToStorage(updated);
    setView('saved-pizzas');
    showToast('Pizza saved!');
  };

  const deleteFavorite = (id: string) => {
    saveFavoritesToStorage(favorites.filter(f => f.id !== id));
  };

  const toggleFavoriteStore = (chainId: string) => {
    const fresh = favoriteStores.includes(chainId)
      ? favoriteStores.filter(id => id !== chainId)
      : [...favoriteStores, chainId];
    setFavoriteStores(fresh);
    localStorage.setItem('miSliceFavStores', JSON.stringify(fresh));
  };

  const handleAddReview = (chainId: string, rating: number, text: string) => {
    const review: Review = { id: Date.now().toString(), user: 'You', rating, text };
    setUserReviews(prev => ({ ...prev, [chainId]: [...(prev[chainId] || []), review] }));
  };

  const handleCustomize = (config: PizzaConfig) => {
    setPizzaConfig(config);
    setView('pizza-builder');
    setTimeout(() => window.scrollTo({ top: 100, behavior: 'smooth' }), 100);
  };

  const handleCompare = (config: PizzaConfig) => {
    setPizzaConfig(config);
    setView('compare');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const quotes = useMemo(() => {
    if (!pizzaConfig) return [];
    return calculateQuotes(pizzaConfig, deliveryType, userReviews);
  }, [pizzaConfig, deliveryType, userReviews]);

  const addToCart = (item: Omit<CartItem, 'id'>, redirect = false, showAlert = true) => {
    const newItem = { ...item, id: Date.now().toString() } as CartItem;
    const newCart = redirect ? [newItem] : [...cart, newItem];
    saveCart(newCart);
    if (redirect) {
      setView('cart');
    } else if (showAlert) {
      showToast('Added to cart!');
    }
  };

  const updateCartQuantity = (id: string, qty: number) => {
    saveCart(cart.map(c => c.id === id ? { ...c, quantity: qty } : c));
  };

  const removeFromCart = (id: string) => {
    saveCart(cart.filter(c => c.id !== id));
  };

  const placeOrder = async (address: string, notes: string) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.subtotal : item.price_per_item * item.quantity), 0);
    const deliveryFee = cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.deliveryFee * item.quantity : 0), 0);
    const tax = cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.tax * item.quantity : item.price_per_item * item.quantity * 0.0825), 0);
    const tipTotal = cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.tip * item.quantity : 0), 0);
    const platformServiceFee = cart.length > 0 ? 1.99 : 0;
    const finalTotal = subtotal + deliveryFee + tax + tipTotal + platformServiceFee;

    const order: Order = {
      id: `order-${Date.now()}`,
      userId: uid || 'local',
      storeId: cart[0]?.store_id || 'unknown',
      storeName: cart[0]?.store_name || 'Unknown Store',
      storeLogo: '',
      orderStatus: 'placed',
      selectedDeliveryProvider: cart[0]?.deliveryOption?.providerName || 'Store Delivery',
      selectedDeliveryProviderId: cart[0]?.deliveryOption?.providerId || 'store',
      deliveryType: cart[0]?.delivery_type || 'store-delivery',
      deliveryFee,
      providerServiceFee: 0,
      estimatedDeliveryTime: cart[0]?.deliveryOption
        ? `${cart[0].deliveryOption.estimatedTimeMin}-${cart[0].deliveryOption.estimatedTimeMax} min`
        : '45 min',
      subtotal,
      tax,
      platformServiceFee,
      couponDiscount: 0,
      finalTotal,
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      items: cart.map(item => ({
        id: item.id,
        orderId: '',
        pizzaName: item.item_name,
        pizzaImage: '',
        size: item.config?.size || '',
        crust: item.config?.crust || '',
        sauce: item.config?.sauce || '',
        cheese: item.config?.cheese || [],
        toppings: [...(item.config?.meats || []), ...(item.config?.veggies || [])],
        quantity: item.quantity,
        basePrice: item.price_per_item,
        toppingsTotal: 0,
        itemTotal: item.price_per_item * item.quantity,
      })) as OrderItem[],
      deliveryAddress: address,
      deliveryNotes: notes,
    } as Order;

    // Persist the order to Firestore (so it survives, shows in history, and is
    // visible to the store owner). Falls back gracefully if offline.
    if (uid) {
      try {
        const id = await saveCustomerOrder(order);
        order.id = id;
      } catch (e) {
        console.error('Failed to persist order to Firestore', e);
      }
    }

    setCurrentOrder(order);
    setPastOrders(prev => [order, ...prev.filter(o => o.id !== order.id)].slice(0, 50));
    saveCart([]);
    setView('order-tracking');
  };

  const reorder = (order: Order) => {
    const newCart: CartItem[] = order.items.map(item => ({
      id: Date.now().toString() + Math.random(),
      store_id: order.storeId,
      store_name: order.storeName,
      item_name: item.pizzaName,
      quantity: item.quantity,
      price_per_item: item.basePrice,
      total_price: item.itemTotal,
      delivery_type: order.deliveryType as any,
      config: {
        size: item.size as any,
        crust: item.crust as any,
        sauce: item.sauce as any,
        cheese: item.cheese,
        meats: item.toppings,
        veggies: [],
        extras: [],
        quantity: item.quantity,
      },
    }));
    saveCart(newCart);
    setView('cart');
  };

  // Past orders — hydrated from Firestore on login and prepended on checkout.

  // ── Auth loading splash ───────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#080808]">
        <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
      </div>
    );
  }

  // ── Not signed in: Firebase login/signup gate ─────────────────────────────
  if (!isAuthenticated) {
    return (
      <AppProvider>
        <WelcomeScreen />
      </AppProvider>
    );
  }

  // ── Store owner: dedicated portal, no customer UI ─────────────────────────
  if (isStoreOwner) {
    return (
      <AppProvider>
        <StoreOwnerDashboard storeName={storeOwnerName} onLogout={handleSignOut} />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
    <div className={`relative min-h-screen font-sans flex transition-colors duration-500 overflow-x-hidden ${isLight ? 'bg-stone-100 text-stone-900 light-theme' : 'bg-[#080808] text-stone-100'}`}>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-stone-900 text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-300 whitespace-nowrap">
          {toast}
        </div>
      )}

      <TopNav
        isLight={isLight}
        setIsLight={setIsLight}
        cartItemCount={cart.length}
        onCartClick={() => setView('cart')}
        onFavoritesClick={() => setView('saved-pizzas')}
        onLogoClick={() => setView('home')}
      />
      <FloatingPizzaUniverse />

      <SidebarNavigation
        currentView={view}
        onNavigate={setView}
        cartItemCount={cart.length}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isStoreOwner={isStoreOwner}
        storeOwnerName={storeOwnerName}
        onStoreOwnerLogin={handleSignOut}
        onStoreOwnerLogout={handleSignOut}
        customerName={customerName}
        onCustomerLogout={handleSignOut}
      />

      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen transition-all duration-300 relative z-10">
        <div className="w-full px-4 pt-16 lg:pt-8 pb-24 max-w-6xl mx-auto flex-1 flex flex-col items-center">

          {view === 'local-deals' && (
            <div className="w-full">
              <div className="mb-8 text-center pt-8">
                <h1 className="text-3xl font-black text-white mb-2">Local Deals</h1>
                <p className="text-stone-300">Discover handpicked deals from pizza shops near you.</p>
              </div>
              <LocalDeals onAddToCart={addToCart} />
            </div>
          )}

          {view === 'cart' && (
            <Cart
              items={cart}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={() => setView('checkout')}
              onContinueShopping={() => setView('pizza-builder')}
              onEditItem={(item) => {
                if (item.config) {
                  setPizzaConfig(item.config);
                  setView('pizza-builder');
                }
              }}
            />
          )}

          {view === 'checkout' && (
            <Checkout
              cart={cart}
              totalToCharge={cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.grandTotal : item.price_per_item * item.quantity), 0) + (cart.length > 0 ? 1.99 : 0)}
              onCancel={() => setView('cart')}
              onConfirmOrder={placeOrder}
            />
          )}

          {view === 'saved-pizzas' && (
            <div className="w-full max-w-5xl mx-auto py-8">
              <h2 className="text-3xl font-black text-white mb-8">My Saved Pizzas</h2>
              {favorites.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                  <Heart className="w-8 h-8 mx-auto text-stone-500 mb-4" />
                  <p className="text-stone-400 font-bold">You haven't saved any pizzas yet.</p>
                  <button onClick={() => setView('pizza-builder')} className="mt-4 text-red-500 font-bold text-sm hover:underline">Build one now</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map(fav => (
                    <div key={fav.id} className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 relative group">
                      <button
                        onClick={() => deleteFavorite(fav.id)}
                        className="absolute top-4 right-4 text-stone-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm font-bold"
                      >
                        Remove
                      </button>
                      <h3 className="font-bold text-xl text-white mb-2">{fav.name}</h3>
                      <p className="text-sm font-bold text-stone-400 mb-4">{fav.config.size} • {fav.config.crust}</p>
                      <div className="flex flex-wrap gap-1 mb-6">
                        {[...fav.config.meats, ...fav.config.veggies].map(m => (
                          <span key={m} className="text-[10px] bg-white/10 text-stone-300 px-2 py-0.5 rounded font-bold uppercase">{m}</span>
                        ))}
                      </div>
                      <button onClick={() => handleCompare(fav.config)} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-2.5 rounded-xl shadow-md hover:from-orange-400 hover:to-red-500 flex items-center justify-center gap-2">
                        <Search className="w-4 h-4" /> Order & Compare Prices
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'how-it-works' && <HowItWorksView />}

          {view === 'profile' && (
            <CustomerProfile onNavigate={(v) => setView(v as ViewState)} />
          )}

          {view === 'rewards' && (
            <RewardsView onNavigate={(v) => setView(v as ViewState)} />
          )}

          {view === 'notifications' && (
            <NotificationsView onNavigate={(v) => setView(v as ViewState)} />
          )}

          {view === 'order-tracking' && currentOrder && (
            <OrderTracking
              order={currentOrder}
              onViewOrders={() => setView('orders')}
              onHome={() => setView('home')}
              onReorder={reorder}
            />
          )}

          {view === 'order-confirmation' && currentOrder && (
            <div className="w-full max-w-3xl mx-auto py-12 text-center relative z-10">
              <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(74,222,128,0.3)] border border-green-400/50 relative">
                <div className="absolute inset-0 bg-green-400 blur-xl opacity-20 rounded-full"></div>
                <svg className="w-12 h-12 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-4xl font-black text-white mb-4 tracking-tight drop-shadow-lg">Order Placed!</h2>

              <div className="bg-black/40 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white/10 text-left mt-8 mb-8 space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                  <p className="text-xs font-black uppercase text-stone-500 tracking-widest mb-1">Store</p>
                  <p className="text-xl font-black text-white">{currentOrder.storeName}</p>
                </div>
                {currentOrder.items.length > 0 && (
                  <div className="relative z-10">
                    <p className="text-xs font-black uppercase text-stone-500 tracking-widest mb-1">Items</p>
                    <p className="text-lg font-bold text-stone-300">{currentOrder.items[0].pizzaName}{currentOrder.items.length > 1 ? ` + ${currentOrder.items.length - 1} more` : ''}</p>
                  </div>
                )}
                <div className="relative z-10">
                  <p className="text-xs font-black uppercase text-stone-500 tracking-widest mb-1">Delivery</p>
                  <p className="text-lg font-bold text-stone-300 flex items-center gap-2">
                    <span className="capitalize">{currentOrder.selectedDeliveryProvider}</span>
                    <span className="text-white/20">•</span>
                    <span className="text-green-400 font-black">ETA: {currentOrder.estimatedDeliveryTime}</span>
                  </p>
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-black uppercase text-stone-500 tracking-widest mb-1">Total</p>
                  <p className="text-3xl font-black text-white">${currentOrder.finalTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center flex-wrap">
                <button onClick={() => setView('orders')} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black py-4 px-8 rounded-2xl shadow-[0_0_30px_rgba(255,50,0,0.4)] transition-all hover:scale-[1.02] flex items-center gap-2 border border-orange-400/50">
                  <ShoppingBag className="w-5 h-5" /> View Order History
                </button>
                <button onClick={() => setView('home')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl border border-white/10 transition-all">
                  Back to Home
                </button>
              </div>
            </div>
          )}

          {view === 'orders' && (
            <div className="w-full max-w-5xl mx-auto py-8">
              <h2 className="text-3xl font-black text-white mb-8">Order History</h2>
              {pastOrders.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                  <ShoppingBag className="w-8 h-8 mx-auto text-stone-500 mb-4" />
                  <p className="text-stone-400 font-bold">No orders yet.</p>
                  <button onClick={() => setView('pizza-builder')} className="mt-4 text-red-500 font-bold text-sm hover:underline">Build a pizza</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastOrders.map(order => (
                    <div key={order.id} className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-black text-white text-lg">{order.storeName}</p>
                          <p className="text-stone-400 text-sm">{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="font-black text-white text-xl">${order.finalTotal.toFixed(2)}</p>
                      </div>
                      <p className="text-stone-400 text-sm mb-4">{order.items.map(i => i.pizzaName).join(', ')}</p>
                      <button
                        onClick={() => reorder(order)}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold py-2 px-6 rounded-xl text-sm transition-all"
                      >
                        Reorder
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'home' && (
            <HomeView
              onCustomize={handleCustomize}
              onCompare={(config) => {
                setPizzaConfig(config);
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
              }}
              onNavigate={setView}
              currentConfig={pizzaConfig}
              quotes={quotes}
              favoriteStores={favoriteStores}
              onToggleFavoriteStore={toggleFavoriteStore}
              onAddReview={handleAddReview}
              onAddToCart={addToCart}
            />
          )}

          {view === 'pizza-builder' && (
            <div className="w-full pt-4">
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black px-4 py-2 rounded-full mb-4">
                  ✦ Premium Pizza Builder
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Build Your Perfect Pizza</h1>
                <p className="text-stone-400 text-sm">Live prices from every store update as you customize.</p>
              </div>
              <PremiumPizzaBuilder
                currentConfig={pizzaConfig || { size: 'Large', crust: 'Hand Tossed', sauce: 'Robust Inspired Tomato Sauce', cheese: ['Mozzarella'], meats: [], veggies: [], extras: [], quantity: 1 }}
                onConfigChange={setPizzaConfig}
                onSaveFavorite={saveFavorite}
                onAddToCart={addToCart}
                defaultOpen={true}
              />
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setView('compare')}
                  disabled={!(pizzaConfig?.crust)}
                  className={`px-8 py-4 rounded-2xl text-lg font-black shadow-xl transition-all ${pizzaConfig?.crust ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white shadow-[0_0_25px_rgba(255,50,0,0.4)] border border-orange-400/50 hover:-translate-y-1' : 'bg-white/10 text-stone-500 border border-white/10 cursor-not-allowed'}`}
                >
                  Compare Prices Across All Stores →
                </button>
              </div>
            </div>
          )}

          {view === 'compare' && (
            <div className="w-full pt-4">
              <div className="mb-8 text-center flex flex-col items-center">
                <h1 className="text-3xl font-black text-white mb-2">Compare Deals</h1>
                <p className="text-stone-300 mb-6">See how your custom creation prices out across top stores.</p>
                <button onClick={() => setView('pizza-builder')} className="text-sm font-bold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors">
                  ← Edit pizza configuration
                </button>
              </div>

              {pizzaConfig && (
                <div className="mb-8 z-10 flex justify-center w-full animate-in fade-in duration-500">
                  <div className="inline-flex bg-white/10 backdrop-blur-md rounded-2xl p-1 shadow-sm border border-white/10">
                    {(['auto', 'store-delivery', 'pickup'] as const).map((type, i) => (
                      <button
                        key={type}
                        onClick={() => setDeliveryType(type)}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${deliveryType === type ? 'bg-white text-stone-900' : 'text-stone-300 hover:text-white'}`}
                      >
                        {type === 'auto' ? 'Best Match' : type === 'store-delivery' ? 'Store Delivery' : 'Pickup'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pizzaConfig && quotes.length > 0 ? (
                <ComparisonCards
                  quotes={quotes}
                  favoriteStores={favoriteStores}
                  onToggleFavoriteStore={toggleFavoriteStore}
                  onAddReview={handleAddReview}
                  onAddToCart={addToCart}
                  currentConfig={pizzaConfig}
                />
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed max-w-2xl mx-auto">
                  <Search className="w-8 h-8 mx-auto text-stone-500 mb-4" />
                  <p className="text-stone-400 font-bold mb-4">Build a pizza first to compare prices.</p>
                  <button onClick={() => setView('pizza-builder')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">Start Building</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
    </AppProvider>
  );
}
