import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './utils/debug';
import { AppProvider } from './store/AppContext';
import { PremiumPizzaBuilder } from './components/PremiumPizzaBuilder';
import { ComparisonCards } from './components/ComparisonCards';
import { HomeView } from './components/HomeView';
import { HowItWorksView } from './components/HowItWorksView';
import { LegalView } from './components/LegalView';
import { ContactView } from './components/ContactView';
import { LocalDeals } from './components/LocalDeals';
import { DealsHub } from './components/DealsHub';
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
import { PlatformAdminDashboard } from './components/admin/PlatformAdminDashboard';
import { CustomerProfile } from './components/CustomerProfile';
import { RewardsView } from './components/RewardsView';
import { NotificationsView } from './components/NotificationsView';
import { OrderTracking } from './components/OrderTracking';
import { WelcomeScreen } from './components/WelcomeScreen';
import { DemoStoreDashboard } from './components/DemoStoreDashboard';
import { FavoriteStoresPicker } from './components/FavoriteStoresPicker';
import { type CompareMode } from './components/ComparisonCards';
import { DeliveryDriverDashboard, TowingDashboard, SupportAgentDashboard } from './components/DevMockDashboards';
import { useAuth } from './store/AuthContext';
import { Loader2 } from 'lucide-react';
import {
  getUserData, saveUserCart, saveUserSavedPizzas,
  saveCustomerOrder, watchCustomerOrders,
} from './lib/db';
import { registerFcmToken, listenForMessages } from './lib/fcm';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import Lightfall from './components/Lightfall';
import DotField from './components/DotField';
import TextCursor from './components/TextCursor';
import Hyperspeed from './components/Hyperspeed';
import { VideoIntro } from './components/VideoIntro';

const HYPERSPEED_OPTS = {
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5] as [number, number],
  lightStickHeight: [1.3, 1.7] as [number, number],
  movingAwaySpeed: [60, 80] as [number, number],
  movingCloserSpeed: [-120, -160] as [number, number],
  carLightsLength: [400 * 0.03, 400 * 0.2] as [number, number],
  carLightsRadius: [0.05, 0.14] as [number, number],
  carWidthPercentage: [0.3, 0.5] as [number, number],
  carShiftX: [-0.8, 0.8] as [number, number],
  carFloorSeparation: [0, 5] as [number, number],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0x131318,
    brokenLines: 0x131318,
    leftCars: [0xd856bf, 0x6750a2, 0xc247ac] as number[],
    rightCars: [0x03b3c3, 0x0e5ea5, 0x324555] as number[],
    sticks: 0x03b3c3,
  },
};

const SHOWCASE_CARDS = [
  { store: "Domino's",    price: '$14.99', time: '25 min', rating: 4.2, best: false },
  { store: 'Pizza Hut',  price: '$13.49', time: '30 min', rating: 4.0, best: false },
  { store: "Papa John's",price: '$15.99', time: '35 min', rating: 4.3, best: false },
  { store: 'Shamz Pizza',price: '$11.99', time: '18 min', rating: 4.8, best: true  },
];

const SHOWCASE_INGREDIENTS = [
  { emoji: '🌿', x: '6%',  y: '10%', delay: 0,   dur: 4.2 },
  { emoji: '🧀', x: '84%', y: '8%',  delay: 0.6, dur: 3.8 },
  { emoji: '🍅', x: '4%',  y: '70%', delay: 1.1, dur: 4.5 },
  { emoji: '🫒', x: '88%', y: '65%', delay: 0.3, dur: 3.5 },
  { emoji: '🌶️', x: '50%', y: '3%',  delay: 0.8, dur: 4.0 },
  { emoji: '🧅', x: '16%', y: '86%', delay: 1.5, dur: 3.9 },
];

function PizzaShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[24px] select-none mb-8 max-w-2xl mx-auto"
      style={{
        background: 'radial-gradient(ellipse at 60% 40%, rgba(180,40,0,0.22) 0%, rgba(10,13,24,0) 70%), #0A0D18',
        border: '1px solid rgba(220,80,0,0.25)',
        boxShadow: '0 40px_120px_-40px rgba(220,38,0,0.5)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,100,30,0.13) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      </div>
      {SHOWCASE_INGREDIENTS.map((ing, i) => (
        <motion.span key={i} className="absolute text-lg pointer-events-none z-10"
          style={{ left: ing.x, top: ing.y }}
          animate={{ y: [0, -10, 0], rotate: [-8, 8, -8], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: ing.dur, delay: ing.delay, repeat: Infinity, ease: 'easeInOut' }}>
          {ing.emoji}
        </motion.span>
      ))}
      <div className="flex justify-center pt-8 pb-2 relative z-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 'clamp(80px, 18vw, 130px)', lineHeight: 1, filter: 'drop-shadow(0 8px 32px rgba(255,100,30,0.55))' }}>
          🍕
        </motion.div>
      </div>
      <div className="flex justify-center mb-4 z-20 relative">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-300"
          style={{ background: 'rgba(255,100,30,0.12)', border: '1px solid rgba(255,100,30,0.25)' }}>
          🔥 Pepperoni Large · Live Price Comparison
        </div>
      </div>
      <div className="px-4 pb-5 space-y-2 z-20 relative">
        {SHOWCASE_CARDS.map((card, i) => (
          <motion.div key={card.store}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: 'easeOut' }}
            className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
            style={{
              background: card.best ? 'linear-gradient(135deg,rgba(220,80,0,0.28) 0%,rgba(255,150,50,0.12) 100%)' : 'rgba(255,255,255,0.04)',
              border: card.best ? '1px solid rgba(255,120,30,0.55)' : '1px solid rgba(255,255,255,0.07)',
            }}>
            <span className="text-base">🍕</span>
            <span className="flex-1 text-xs sm:text-sm font-bold text-white truncate">{card.store}</span>
            <span className="text-[10px] text-white/50">{card.time}</span>
            <span className="text-[10px] text-amber-400">★ {card.rating}</span>
            <span className={`text-sm font-black ${card.best ? 'text-orange-300' : 'text-white/80'}`}>{card.price}</span>
            {card.best && (
              <motion.span animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 shrink-0"
                style={{ background: 'rgba(255,120,30,0.85)', color: '#fff' }}>
                Best Deal
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function DevRoleSwitcher() {
  const { simulatedRole, switchSimulatedRole } = useAuth();

  if (window.location.hostname !== 'localhost' || !import.meta.env.DEV) return null;

  return (
    <div className="fixed top-3 right-4 z-[99999] bg-stone-950/90 text-white backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl shadow-2xl flex items-center gap-2">
      <span className="text-[9px] font-black uppercase text-orange-400">Dev Role:</span>
      <select
        value={simulatedRole || 'customer'}
        onChange={(e) => {
          const val = e.target.value;
          switchSimulatedRole(val === 'customer' ? null : val);
        }}
        className="bg-transparent border-0 text-white text-xs font-extrabold outline-none cursor-pointer"
        style={{ colorScheme: 'dark' }}
      >
        <option value="customer" className="bg-stone-900 text-white font-bold">Customer</option>
        <option value="store_employee" className="bg-stone-900 text-white font-bold">Store Employee</option>
        <option value="store_admin" className="bg-stone-900 text-white font-bold">Store Admin</option>
        <option value="delivery_driver" className="bg-stone-900 text-white font-bold">Delivery Driver</option>
        <option value="towing_driver" className="bg-stone-900 text-white font-bold">Towing Driver</option>
        <option value="towing_company" className="bg-stone-900 text-white font-bold">Towing Company</option>
        <option value="merchant" className="bg-stone-900 text-white font-bold">Merchant</option>
        <option value="support_agent" className="bg-stone-900 text-white font-bold">Support Agent</option>
        <option value="platform_admin" className="bg-stone-900 text-white font-bold">Platform Admin</option>
      </select>
    </div>
  );
}

export default function App() {
  const [demoMode, setDemoMode] = useState(false);
  const [customerDemoMode, setCustomerDemoMode] = useState(false);
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [pizzaConfig, setPizzaConfig] = useState<PizzaConfig | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType | 'auto'>('auto');
  const [view, setView] = useState<ViewState>('home');
  const [compareMode, setCompareMode] = useState<CompareMode>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);

  // Theme + meat preferences (persisted)
  const [isLight, setIsLight] = useState(() => {
    try { return localStorage.getItem('miSliceTheme') === 'light'; } catch { return false; }
  });
  const [meatPreferences, setMeatPreferences] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('miSliceMeatPrefs') || '[]'); } catch { return []; }
  });

  const savePreferences = (theme: boolean, meats: string[]) => {
    setIsLight(theme);
    setMeatPreferences(meats);
    try {
      localStorage.setItem('miSliceTheme', theme ? 'light' : 'dark');
      localStorage.setItem('miSliceMeatPrefs', JSON.stringify(meats));
    } catch { /* ignore */ }
  };

  // Premium subscription
  const [isPremium, setIsPremium] = useState(() => {
    try { return localStorage.getItem('miSlicePro') === 'true'; } catch { return false; }
  });

  const activatePremium = () => {
    setIsPremium(true);
    try { localStorage.setItem('miSlicePro', 'true'); } catch { /* ignore */ }
    showToast('🎉 Welcome to MiSlice Pro!');
  };

  const saveMeatPreferences = (meats: string[]) => {
    setMeatPreferences(meats);
    try { localStorage.setItem('miSliceMeatPrefs', JSON.stringify(meats)); } catch { /* ignore */ }
  };

  // Toast notification
  const [toast, setToast] = useState<string>('');
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Big, bright in-app push popup (shown when an FCM message arrives while the
  // tab is focused — the browser suppresses the OS notification in that case).
  const [pushPopup, setPushPopup] = useState<{ title: string; body: string } | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showPushPopup = (title: string, body: string) => {
    setPushPopup({ title, body });
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => setPushPopup(null), 7000);
    // buzz the device if supported
    try { navigator.vibrate?.([120, 60, 120]); } catch { /* no-op */ }
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
  const { profile, loading: authLoading, isAuthenticated, isStoreOwner, isAdmin, logout, simulatedRole } = useAuth();
  const uid = profile?.uid ?? null;
  const customerName = profile?.fullName || '';
  const storeOwnerName = profile?.storeName || profile?.fullName || '';

  const handleSignOut = async () => {
    await logout();
    setCart([]);
    setView('home');
    showToast('Signed out.');
  };

  // On login, hydrate cart + saved pizzas from Firestore (one-time read).
  useEffect(() => {
    if (!uid) return;
    let active = true;
    (async () => {
      try {
        const data = await getUserData(uid);
        if (!active) return;
        if (Array.isArray(data.cart)) setCart(data.cart as CartItem[]);
        if (Array.isArray(data.savedPizzas)) setFavorites(data.savedPizzas as typeof favorites);
      } catch (e) {
        console.error('Failed to load user data from Firestore', e);
      }
    })();
    return () => { active = false; };
  }, [uid]);

  // Live order history — fires instantly from the local cache, then pushes
  // real-time updates as the store advances each order's status.
  useEffect(() => {
    if (!uid) return;
    const unsub = watchCustomerOrders(uid, (orders) => setPastOrders(orders as Order[]));
    return unsub;
  }, [uid]);

  // Show video intro once per customer login session (real or demo).
  const shownIntroForRef = useRef<string | null>(null);
  useEffect(() => {
    if (uid && !isStoreOwner && !isAdmin && uid !== shownIntroForRef.current) {
      shownIntroForRef.current = uid;
      setShowVideoIntro(true);
    }
    if (!uid) shownIntroForRef.current = null;
  }, [uid, isStoreOwner, isAdmin]);

  // Show intro for customer demo mode entry.
  const prevCustomerDemo = useRef(false);
  useEffect(() => {
    if (customerDemoMode && !prevCustomerDemo.current) {
      setShowVideoIntro(true);
    }
    prevCustomerDemo.current = customerDemoMode;
  }, [customerDemoMode]);

  // Register FCM token for all signed-in users so they get push notifications.
  useEffect(() => {
    if (!uid) return;
    registerFcmToken().catch(() => {});
    const unsub = listenForMessages((title, body) => showPushPopup(title, body));
    return unsub;
  }, [uid]);

  // Real-time Firestore notifications listener for home-screen popups
  const shownNotifIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          const notifId = change.doc.id;

          // Trigger popup if the notification is unread and has not been shown in this session
          if (data.read === false && !shownNotifIds.current.has(notifId)) {
            shownNotifIds.current.add(notifId);
            showPushPopup(data.title || 'New Alert', data.message || data.body || '');
          }
        }
      });
    }, (err) => {
      console.warn('Firestore notifications listener failed in App.tsx', err);
    });

    return unsub;
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
        <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
      </div>
    );
  }

  // ── Demo mode: full store owner experience with mock data ─────────────────
  if (demoMode) {
    return (
      <AppProvider>
        <DevRoleSwitcher onSwitch={(role) => {
          setDemoMode(false);
          setCustomerDemoMode(true);
        }} />
        <DemoStoreDashboard onExit={() => setDemoMode(false)} />
      </AppProvider>
    );
  }

  // ── Not signed in: Firebase login/signup gate ─────────────────────────────
  if (!isAuthenticated && !customerDemoMode) {
    return (
      <AppProvider>
        <WelcomeScreen onDemo={() => setDemoMode(true)} onCustomerDemo={() => setCustomerDemoMode(true)} />
      </AppProvider>
    );
  }

  // ── Admin: platform administration portal ───────────────────────────────
  if (isAdmin) {
    return (
      <AppProvider>
        <DevRoleSwitcher onSwitch={(role) => { if (!role) setCustomerDemoMode(true); }} />
        <PlatformAdminDashboard />
      </AppProvider>
    );
  }

  // ── Store owner: dedicated portal, no customer UI ─────────────────────────
  if (isStoreOwner) {
    return (
      <AppProvider>
        <DevRoleSwitcher onSwitch={(role) => { if (!role) setCustomerDemoMode(true); }} />
        <StoreOwnerDashboard storeId={profile?.storeId || profile?.uid || ''} storeName={storeOwnerName} onLogout={handleSignOut} />
      </AppProvider>
    );
  }

  // ── Delivery Driver Dashboard ──────────────────────────────────────────────
  if (simulatedRole === 'delivery_driver') {
    return (
      <AppProvider>
        <DevRoleSwitcher onSwitch={(role) => { if (!role) setCustomerDemoMode(true); }} />
        <DeliveryDriverDashboard />
      </AppProvider>
    );
  }

  // ── Towing Driver / Company Dashboard ──────────────────────────────────────
  if (simulatedRole === 'towing_driver' || simulatedRole === 'towing_company') {
    return (
      <AppProvider>
        <DevRoleSwitcher onSwitch={(role) => { if (!role) setCustomerDemoMode(true); }} />
        <TowingDashboard />
      </AppProvider>
    );
  }

  // ── Support Agent Dashboard ────────────────────────────────────────────────
  if (simulatedRole === 'support_agent') {
    return (
      <AppProvider>
        <DevRoleSwitcher onSwitch={(role) => { if (!role) setCustomerDemoMode(true); }} />
        <SupportAgentDashboard />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
    <DevRoleSwitcher onSwitch={(role) => { if (!role) setCustomerDemoMode(true); }} />
    {showVideoIntro && <VideoIntro onDismiss={() => setShowVideoIntro(false)} />}
    <TextCursor spacing={75} followMouseDirection randomFloat exitDuration={0.35} removalInterval={22} maxPoints={8} />
    <div className={`relative min-h-screen font-sans flex overflow-x-hidden transition-colors duration-300 ${isLight ? 'light-theme bg-white' : 'bg-[#0A0D18]'}`}>
      {/* Light theme: DotField background */}
      {isLight && (
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ height: '100vh' }}>
          <DotField
            dotRadius={1.5}
            dotSpacing={14}
            bulgeStrength={67}
            glowRadius={160}
            sparkle={false}
            waveAmplitude={0}
            cursorRadius={500}
            cursorForce={0.1}
            bulgeOnly
            gradientFrom="#A855F7"
            gradientTo="#B497CF"
            glowColor="#120F17"
          />
        </div>
      )}
      {/* Dark theme: Lightfall background */}
      {!isLight && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Lightfall
            colors={['#FF6B35', '#DC2626', '#F97316']}
            backgroundColor="#0A0D18"
            speed={0.35}
            streakCount={4}
            streakWidth={0.8}
            streakLength={1.2}
            glow={0.6}
            density={0.4}
            twinkle={0.7}
            zoom={3}
            backgroundGlow={0.15}
            opacity={0.35}
            mouseInteraction={false}
          />
        </div>
      )}
      {/* Bright in-app push popup (foreground FCM message) */}
      <AnimatePresence>
        {pushPopup && (
          <motion.button
            key="push-popup"
            initial={{ opacity: 0, y: -80, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            onClick={() => setPushPopup(null)}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md text-left rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #ff2d55, #ff6b00 55%, #ffb300)',
              boxShadow: '0 20px 60px -10px rgba(255,45,85,0.7), 0 0 0 3px rgba(255,255,255,0.25) inset, 0 0 40px rgba(255,107,0,0.6)',
            }}
          >
            {/* animated shine sweep */}
            <motion.span
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.6, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-1/3 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }}
            />
            <div className="relative flex items-center gap-4 px-5 py-4">
              <motion.div
                animate={{ rotate: [0, -12, 12, -8, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.8 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}
              >
                🍕
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-lg leading-tight drop-shadow"
                   style={{ textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
                  {pushPopup.title}
                </p>
                <p className="text-white/95 text-sm font-semibold leading-snug mt-0.5"
                   style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
                  {pushPopup.body}
                </p>
              </div>
              <span className="text-white/80 text-2xl font-black leading-none shrink-0">×</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] clay bg-white text-stone-800 text-sm font-bold px-6 py-3 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 whitespace-nowrap">
          {toast}
        </div>
      )}

      <TopNav
        isLight={isLight}
        onThemeChange={(light) => savePreferences(light, meatPreferences)}
        cartItemCount={cart.length}
        onCartClick={() => setView('cart')}
        onFavoritesClick={() => setView('saved-pizzas')}
        onFavoriteStoresClick={() => setView('favorite-stores')}
        onLogoClick={() => setView('home')}
        onOrdersClick={() => setView('orders')}
      />


      <SidebarNavigation
        currentView={view}
        onNavigate={setView}
        cartItemCount={cart.length}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isStoreOwner={isStoreOwner}
        storeOwnerName={storeOwnerName}
        onStoreOwnerLogout={handleSignOut}
        customerName={customerName}
        onCustomerLogout={customerDemoMode ? () => setCustomerDemoMode(false) : handleSignOut}
        isDemo={customerDemoMode}
      />

      <main className={`flex-1 lg:pl-64 flex flex-col min-h-screen transition-all duration-300 relative z-10 ${view === 'profile' ? 'bg-white' : ''}`}>

        {/* Home view renders full-bleed with its own dark layout */}
        {view === 'home' && (
          <div className="w-full flex-1 pt-14 lg:pt-0">
            <HomeView
              onCustomize={handleCustomize}
              onCompare={(config) => {
                setPizzaConfig(config);
                setView('compare');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
              }}
              onNavigate={setView}
              currentConfig={pizzaConfig}
              quotes={quotes}
              favoriteStores={favoriteStores}
              onToggleFavoriteStore={toggleFavoriteStore}
              onAddReview={handleAddReview}
              onAddToCart={addToCart}
              isPremium={isPremium}
              onUpgrade={activatePremium}
              isLight={isLight}
            />
          </div>
        )}

        <div className={`w-full px-4 pt-16 lg:pt-8 pb-24 max-w-6xl mx-auto flex-1 flex flex-col items-center ${view === 'home' ? 'hidden' : ''}`}>

          {(view === 'deals-hub' || view === 'local-deals' || view === 'rewards' || view === 'notifications') && (
            <div className="w-full">
              <DealsHub
                initialTab={view === 'rewards' ? 'rewards' : view === 'notifications' ? 'alerts' : 'deals'}
                onNavigate={(v) => setView(v as ViewState)}
                onAddToCart={addToCart}
              />
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
                <div className="clay bg-white text-center py-20 rounded-3xl">
                  <Heart className="w-8 h-8 mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-500 font-bold">You haven't saved any pizzas yet.</p>
                  <button onClick={() => setView('pizza-builder')} className="mt-4 text-red-600 font-bold text-sm hover:underline">Build one now</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map(fav => (
                    <div key={fav.id} className="clay bg-white p-6 rounded-3xl relative group">
                      <button
                        onClick={() => deleteFavorite(fav.id)}
                        className="absolute top-4 right-4 text-stone-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-sm font-bold"
                      >
                        Remove
                      </button>
                      <h3 className="font-bold text-xl text-stone-800 mb-2">{fav.name}</h3>
                      <p className="text-sm font-bold text-stone-400 mb-4">{fav.config.size} • {fav.config.crust}</p>
                      <div className="flex flex-wrap gap-1 mb-6">
                        {[...fav.config.meats, ...fav.config.veggies].map(m => (
                          <span key={m} className="text-[10px] clay-inset text-stone-500 px-2 py-0.5 rounded font-bold uppercase">{m}</span>
                        ))}
                      </div>
                      <button onClick={() => handleCompare(fav.config)} className="clay-accent w-full text-stone-900 font-bold py-2.5 flex items-center justify-center gap-2">
                        <Search className="w-4 h-4" /> Order & Compare Prices
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'how-it-works' && <HowItWorksView />}
          {view === 'legal' && <LegalView />}
          {view === 'contact' && <ContactView />}

          {view === 'favorite-stores' && (
            <div className="relative w-full min-h-screen overflow-hidden">
              {/* Hyperspeed background */}
              <div className="absolute inset-0 z-0" style={{ height: '100%' }}>
                <Hyperspeed effectOptions={HYPERSPEED_OPTS} />
              </div>
              {/* Overlay to dim the background */}
              <div className="absolute inset-0 z-10 bg-black/55 pointer-events-none" />
              {/* Content */}
              <div className="relative z-20 w-full">
                <FavoriteStoresPicker
                  favoriteStores={favoriteStores}
                  onToggle={toggleFavoriteStore}
                />
              </div>
            </div>
          )}

          {view === 'profile' && (
            <CustomerProfile onNavigate={(v) => setView(v as ViewState)} orders={pastOrders} meatPreferences={meatPreferences} onSaveMeatPreferences={saveMeatPreferences} isLight={isLight} />
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
              <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Order Placed!</h2>

              <div className="clay bg-white rounded-[2rem] p-8 text-left mt-8 mb-8 space-y-6">
                <div>
                  <p className="text-xs font-black uppercase text-stone-400 tracking-widest mb-1">Store</p>
                  <p className="text-xl font-black text-stone-800">{currentOrder.storeName}</p>
                </div>
                {currentOrder.items.length > 0 && (
                  <div>
                    <p className="text-xs font-black uppercase text-stone-400 tracking-widest mb-1">Items</p>
                    <p className="text-lg font-bold text-stone-600">{currentOrder.items[0].pizzaName}{currentOrder.items.length > 1 ? ` + ${currentOrder.items.length - 1} more` : ''}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-black uppercase text-stone-400 tracking-widest mb-1">Delivery</p>
                  <p className="text-lg font-bold text-stone-600 flex items-center gap-2">
                    <span className="capitalize">{currentOrder.selectedDeliveryProvider}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-green-600 font-black">ETA: {currentOrder.estimatedDeliveryTime}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-stone-400 tracking-widest mb-1">Total</p>
                  <p className="text-3xl font-black text-stone-800">${currentOrder.finalTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center flex-wrap">
                <button onClick={() => setView('orders')} className="clay-accent text-stone-900 font-black py-4 px-8 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> View Order History
                </button>
                <button onClick={() => setView('home')} className="clay-btn bg-white text-stone-700 font-bold py-4 px-8">
                  Back to Home
                </button>
              </div>
            </div>
          )}

          {view === 'orders' && (
            <div className="w-full max-w-5xl mx-auto py-8">
              <h2 className="text-3xl font-black text-white mb-8">Order History</h2>
              {pastOrders.length === 0 ? (
                <div className="clay bg-white text-center py-20 rounded-3xl">
                  <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-500 font-bold">No orders yet.</p>
                  <button onClick={() => setView('pizza-builder')} className="mt-4 text-red-600 font-bold text-sm hover:underline">Build a pizza</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastOrders.map(order => (
                    <div key={order.id} className="clay bg-white rounded-3xl p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-black text-stone-800 text-lg">{order.storeName}</p>
                          <p className="text-stone-400 text-sm">{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="font-black text-stone-800 text-xl">${order.finalTotal.toFixed(2)}</p>
                      </div>
                      <p className="text-stone-500 text-sm mb-4">{order.items.map(i => i.pizzaName).join(', ')}</p>
                      <button
                        onClick={() => reorder(order)}
                        className="clay-accent text-stone-900 font-bold py-2 px-6 text-sm"
                      >
                        Reorder
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'pizza-builder' && (
            <div className="w-full pt-4">
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black px-4 py-2 rounded-full mb-4">
                  ✦ Premium Pizza Builder
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Build Your Perfect Pizza</h1>
                <p className="text-white/50 text-sm">Live prices from every store update as you customize.</p>
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
                  className={`px-8 py-4 text-lg font-black transition-all ${pizzaConfig?.crust ? 'clay-accent text-stone-900' : 'clay-inset text-stone-400 cursor-not-allowed'}`}
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
                <p className="text-white/50 mb-6">See how your custom creation prices out across top stores.</p>
                <button onClick={() => setView('pizza-builder')} className="text-sm font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors">
                  ← Edit pizza configuration
                </button>
              </div>

              {/* Pizza price showcase */}
              <PizzaShowcase />

              {pizzaConfig && (
                <div className="mb-8 z-10 flex justify-center w-full animate-in fade-in duration-500">
                  <div className="bg-white/6 border border-white/10 inline-flex rounded-2xl p-1">
                    {(['auto', 'store-delivery', 'pickup'] as const).map((type, i) => (
                      <button
                        key={type}
                        onClick={() => setDeliveryType(type)}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${deliveryType === type ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                      >
                        {type === 'auto' ? 'Best Option' : type === 'store-delivery' ? 'Store Delivery' : 'In-Store Pickup'}
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
                  compareMode={compareMode}
                  onCompareModeChange={setCompareMode}
                  onGoToFavoritesPicker={() => setView('favorite-stores')}
                />
              ) : (
                <div className="clay bg-white text-center py-20 rounded-3xl max-w-2xl mx-auto">
                  <Search className="w-8 h-8 mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-500 font-bold mb-4">Build a pizza first to compare prices.</p>
                  <button onClick={() => setView('pizza-builder')} className="clay-accent text-stone-900 px-6 py-3 font-bold">Start Building</button>
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
