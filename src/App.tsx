import { useState, useMemo, useEffect } from 'react';
import { FloatingPizzaUniverse } from './components/FloatingPizzaUniverse';
import './utils/debug'; // Trigger the debug console output
import { PizzaInput } from './components/PizzaInput';
import { ComparisonCards } from './components/ComparisonCards';
import { HomeView } from './components/HomeView';
import { AuthModal } from './components/AuthModal';
import { HowItWorksView } from './components/HowItWorksView';
import { LocalDeals } from './components/LocalDeals';
import { AdminDashboard } from './components/AdminDashboard';
import { PizzaConfig, DeliveryType, FavoriteConfig, Review, Order, OrderItem } from './types';
import { calculateQuotes } from './lib/pricing';
import { Heart, Search, Star, UserCircle, Store, ShoppingBag } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { calculateOrderFinancials } from './utils/financials';

import { SidebarNavigation, ViewState } from './components/SidebarNavigation';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { OrdersManager } from './components/OrdersManager';
import { CartItem } from './types';

import { TopNav } from './components/TopNav';
import { DietaryModal } from './components/DietaryModal';

export default function App() {
  const [pizzaConfig, setPizzaConfig] = useState<PizzaConfig | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType | 'auto'>('auto');
  const [view, setView] = useState<ViewState>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  
  // Theme state
  const [isLight, setIsLight] = useState(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dietaryModalOpen, setDietaryModalOpen] = useState(false);
  
  // Dietary Preferences
  const [userPreferences, setUserPreferences] = useState<{ isVegetarian: boolean; allowedMeats: string[] } | null>(null);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // State for Favorites from Firestore
  const [favorites, setFavorites] = useState<{id: string, name: string, config: PizzaConfig}[]>([]);
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  
  // State for user submitted reviews across session
  const [userReviews, setUserReviews] = useState<Record<string, Review[]>>({});

  useEffect(() => {
    // Request geolocation on website open as requested by user
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location accessed successfully on startup:", position);
        },
        (error) => {
          console.error("Location access denied or failed on startup:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && localStorage.getItem('miSlice_isPartner') !== 'true') {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().dietary_preferences) {
          setUserPreferences(userDoc.data().dietary_preferences);
        } else {
          setDietaryModalOpen(true);
        }
      } else {
        setUserPreferences(null);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (currentUser && localStorage.getItem('miSlice_isPartner') !== 'true') {
       // Fetch saved pizzas from Firestore for real users
       const q = query(collection(db, 'pizza_configurations'), where('user_id', '==', currentUser.uid));
       const unsub = onSnapshot(q, (snapshot) => {
         const favs = snapshot.docs.map(doc => ({
           id: doc.id,
           name: doc.data().pizza_name,
           config: {
             size: doc.data().size,
             crust: doc.data().crust,
             sauce: doc.data().sauce,
             cheese: doc.data().cheese || [],
             toppings: doc.data().toppings || [], // map meat/veg to this if needed? Wait our config splits them. We need to save them correctly.
             meats: doc.data().meats || [],
             veggies: doc.data().veggies || [],
             extras: doc.data().extras || [],
             quantity: doc.data().quantity || 1
           } as PizzaConfig
         }));
         setFavorites(favs);
       }, (error) => {
         console.error('Error fetching pizza_configurations:', error);
       });
       return () => unsub();
    } else {
       setFavorites([]);
    }
  }, [currentUser]);

  const saveFavorite = async (config: PizzaConfig) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    const configName = `${config.size || 'Medium'} ${config.crust || 'Custom'} Pizza`;
    
    try {
      await addDoc(collection(db, 'pizza_configurations'), {
        user_id: currentUser.uid,
        pizza_name: configName,
        size: config.size,
        crust: config.crust,
        sauce: config.sauce,
        cheese: config.cheese,
        meats: config.meats,
        veggies: config.veggies,
        extras: config.extras,
        quantity: config.quantity,
        created_at: new Date().toISOString()
      });
      setView('saved-pizzas');
    } catch (err) {
      console.error('Failed to save pizza.', err);
    }
  };
  
  const toggleFavoriteStore = (chainId: string) => {
    let fresh;
    if (favoriteStores.includes(chainId)) {
      fresh = favoriteStores.filter(id => id !== chainId);
    } else {
      fresh = [...favoriteStores, chainId];
    }
    setFavoriteStores(fresh);
    localStorage.setItem('miSliceFavStores', JSON.stringify(fresh));
  };
  
  const handleAddReview = (chainId: string, rating: number, text: string) => {
    const review: Review = { id: Date.now().toString(), user: "You", rating, text };
    setUserReviews(prev => ({
      ...prev,
      [chainId]: [...(prev[chainId] || []), review]
    }));
  };

  const handleCustomize = (config: PizzaConfig) => {
    setPizzaConfig(config);
    setView('pizza-builder');
    setTimeout(() => window.scrollTo({ top: 100, behavior: 'smooth' }), 100);
  };

  const handleCompare = (config: PizzaConfig) => {
    setPizzaConfig(config);
    setView('compare');
    setTimeout(() => {
       window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Re-calculate quotes whenever config, delivery preference, or userReviews change
  const quotes = useMemo(() => {
    if (!pizzaConfig) return [];
    return calculateQuotes(pizzaConfig, deliveryType, userReviews);
  }, [pizzaConfig, deliveryType, userReviews]);

  useEffect(() => {
    if (currentUser) {
       const q = query(collection(db, 'cart_items'), where('user_id', '==', currentUser.uid));
       const unsub = onSnapshot(q, (snapshot) => {
         const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem));
         setCart(items);
       }, (error) => {
         console.error('Error fetching cart_items:', error);
       });
       return () => unsub();
    } else {
       const savedCart = localStorage.getItem('miSliceCart');
       if (savedCart) setCart(JSON.parse(savedCart));
    }
  }, [currentUser]);

  const placeOrder = async (address: string, notes: string) => {
    if (!currentUser) return;
    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.subtotal : (item.price_per_item * item.quantity)), 0);
      const deliveryFee = cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.deliveryFee * item.quantity : 0), 0);
      const providerServiceFee = cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.serviceFee * item.quantity : 0), 0);
      const platformServiceFee = cart.length > 0 ? 1.99 : 0;
      const discountTotal = cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.discount * item.quantity : 0), 0);
      const tipTotal = cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.tip * item.quantity : 0), 0);
      
      const baseStoreId = cart[0]?.store_id || 'unknown';
      let taxRate = 0.0825;
      let taxHandlingMode = 'restaurant';
      if (baseStoreId !== 'unknown') {
         const storeSnap = await getDoc(doc(db, 'stores', baseStoreId));
         if (storeSnap.exists() && storeSnap.data().settings) {
            taxRate = (storeSnap.data().settings.tax_rate || 8.25) / 100;
            taxHandlingMode = storeSnap.data().settings.tax_handling_mode || 'restaurant';
         }
      }

      const financials = calculateOrderFinancials(
         subtotal, taxRate, deliveryFee, providerServiceFee, platformServiceFee, tipTotal, discountTotal, 0.20, taxHandlingMode
      );

      const baseStoreName = cart[0]?.store_name || 'Unknown Store';
      const primaryProvider = cart[0]?.deliveryOption?.providerName || 'Store Delivery';
      const primaryProviderId = cart[0]?.deliveryOption?.providerId || 'store_delivery';
      
      const items: OrderItem[] = cart.map((item: CartItem) => ({
         id: item.id || Date.now().toString(),
         orderId: '',
         pizzaName: item.item_name,
         pizzaImage: item.config ? '' : '',
         size: item.config?.size || '',
         crust: item.config?.crust || '',
         sauce: item.config?.sauce || '',
         cheese: item.config?.cheese || [],
         toppings: [...(item.config?.meats || []), ...(item.config?.veggies || [])],
         quantity: item.quantity,
         basePrice: item.deliveryOption ? item.deliveryOption.priceBreakdown.subtotal / item.quantity : item.price_per_item,
         toppingsTotal: 0,
         itemTotal: item.deliveryOption ? item.deliveryOption.priceBreakdown.subtotal : (item.price_per_item * item.quantity)
      }));

      const newOrder = {
        userId: currentUser.uid,
        storeId: baseStoreId,
        storeName: baseStoreName,
        storeLogo: '',
        orderStatus: 'placed',
        selectedDeliveryProvider: primaryProvider,
        selectedDeliveryProviderId: primaryProviderId,
        deliveryType: cart[0]?.delivery_type || 'store',
        deliveryFee,
        providerServiceFee: providerServiceFee,
        estimatedDeliveryTime: cart[0]?.deliveryOption ? `${cart[0].deliveryOption.estimatedTimeMin}-${cart[0].deliveryOption.estimatedTimeMax} min` : '45 min',
        itemSubtotal: subtotal,
        subtotal: subtotal,
        taxAmount: financials.taxAmount,
        tax: financials.taxAmount,
        platformServiceFee,
        tipAmount: tipTotal,
        couponCode: cart[0]?.deliveryOption?.appliedCoupon?.code || '',
        couponDiscount: discountTotal,
        platformFeePercent: 0.20,
        platformFeeAmount: financials.platformFeeAmt,
        restaurantFoodPayout: financials.restaurantPayout,
        taxHandlingMode: taxHandlingMode,
        storeSettlement: financials.storeSettlement,
        payoutStatus: 'pending',
        customerFinalTotal: financials.customerTotal,
        finalTotal: financials.customerTotal,
        paymentStatus: 'paid_demo',
        createdAt: new Date().toISOString(),
        items,
        deliveryAddress: address,
        deliveryNotes: notes
      };

      const docRef = await addDoc(collection(db, 'orders'), newOrder);
      const savedOrder = { ...newOrder, id: docRef.id } as Order;
      
      setCurrentOrder(savedOrder);

      for (const item of cart) {
        if (item.id) {
          await deleteDoc(doc(db, 'cart_items', item.id));
        }
      }
      setCart([]);
      setView('order-confirmation');
    } catch (e) {
      console.error("Failed to place order:", e);
      alert("Order could not be placed. Please try again.");
    }
  };

  const addToCart = async (item: Omit<CartItem, 'id'>, redirect: boolean = false, showAlert: boolean = true) => {
    let currentCartId = null;

    if (redirect) {
       // "Buy Now" behavior: Clear the cart first
       if (currentUser) {
          const cartSnap = await getDocs(query(collection(db, 'cart_items'), where('user_id', '==', currentUser.uid)));
          const deletePromises = cartSnap.docs.map(docSnapshot => deleteDoc(doc(db, 'cart_items', docSnapshot.id)));
          await Promise.all(deletePromises);
       } else {
          setCart([]);
          localStorage.removeItem('miSliceCart');
       }
    }

    if (currentUser) {
       const docRef = await addDoc(collection(db, 'cart_items'), {
         ...item,
         user_id: currentUser.uid,
         created_at: new Date().toISOString()
       });
       currentCartId = docRef.id;
    } else {
       const newItem = { ...item, id: Date.now().toString() } as CartItem;
       const newCart = redirect ? [newItem] : [...cart, newItem];
       setCart(newCart);
       localStorage.setItem('miSliceCart', JSON.stringify(newCart));
    }
    
    if (redirect) {
       setView('cart');
    } else if (showAlert) {
       alert("Added to cart");
    }
  };

  const updateCartQuantity = async (id: string, qty: number) => {
    if (currentUser) {
       await updateDoc(doc(db, 'cart_items', id), { quantity: qty });
    } else {
       const newCart = cart.map(c => c.id === id ? { ...c, quantity: qty } : c);
       setCart(newCart);
       localStorage.setItem('miSliceCart', JSON.stringify(newCart));
    }
  };

  const removeFromCart = async (id: string) => {
    if (currentUser) {
       await deleteDoc(doc(db, 'cart_items', id));
    } else {
       const newCart = cart.filter(c => c.id !== id);
       setCart(newCart);
       localStorage.setItem('miSliceCart', JSON.stringify(newCart));
    }
  };

  const isPartner = !!currentUser && localStorage.getItem('miSlice_isPartner') === 'true';

  return (
    <div className={`relative min-h-screen font-sans flex transition-colors duration-500 overflow-x-hidden ${isLight ? 'bg-stone-100 text-stone-900 light-theme' : 'bg-[#080808] text-stone-100'}`}>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <DietaryModal 
        isOpen={dietaryModalOpen} 
        onClose={() => setDietaryModalOpen(false)} 
        currentUser={currentUser}
        onSave={setUserPreferences}
        canClose={!!userPreferences}
      />
      <TopNav 
        currentUser={currentUser} 
        onOpenAuth={() => setAuthModalOpen(true)} 
        onOpenSettings={() => setDietaryModalOpen(true)}
        isLight={isLight}
        setIsLight={setIsLight}
      />
      <FloatingPizzaUniverse />
      
      <SidebarNavigation 
        currentView={view} 
        onNavigate={setView} 
        cartItemCount={cart.length} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isPartner={isPartner} 
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen transition-all duration-300 relative z-10">
         <div className="w-full px-4 pt-16 lg:pt-8 pb-24 max-w-6xl mx-auto flex-1 flex flex-col items-center">
        
        {view === 'admin-dashboard' && <AdminDashboard />}

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
            onCheckout={() => {
              if (!currentUser) {
                 setAuthModalOpen(true);
              } else {
                 setView('checkout');
              }
            }}  
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
            totalToCharge={cart.reduce((sum, item) => sum + (item.deliveryOption ? item.deliveryOption.priceBreakdown.grandTotal : (item.price_per_item * item.quantity)), 0) + (cart.length > 0 ? 1.99 : 0)}
            onCancel={() => setView('cart')}
            onConfirmOrder={placeOrder}
          />
        )}

        {view === 'saved-pizzas' && (
          <div className="w-full max-w-5xl mx-auto py-8">
            <h2 className="text-3xl font-black text-stone-900 mb-8">My Saved Pizzas</h2>
            {favorites.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200 border-dashed">
                <Heart className="w-8 h-8 mx-auto text-stone-300 mb-4" />
                <p className="text-stone-500 font-bold">You haven't saved any pizzas yet.</p>
                <button onClick={() => setView('pizza-builder')} className="mt-4 text-red-600 font-bold text-sm hover:underline">Build one now</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(fav => (
                  <div key={fav.id} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 relative group">
                    <button 
                       onClick={async () => await deleteDoc(doc(db, 'pizza_configurations', fav.id)) } 
                       className="absolute top-4 right-4 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                       Remove
                    </button>
                    <h3 className="font-bold text-xl text-stone-900 mb-2">{fav.name}</h3>
                    <p className="text-sm font-bold text-stone-500 mb-4">{fav.config.size} • {fav.config.crust}</p>
                    <div className="flex flex-wrap gap-1 mb-6">
                      {[...fav.config.meats, ...fav.config.veggies].map(m => (
                        <span key={m} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-bold uppercase">{m}</span>
                      ))}
                    </div>
                    <button onClick={() => handleCompare(fav.config)} className="w-full bg-stone-900 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-stone-800 flex items-center justify-center gap-2">
                      <Search className="w-4 h-4" /> Order & Compare Prices
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'how-it-works' && (
          <HowItWorksView />
        )}

        {view === 'order-confirmation' && currentOrder && (
          <div className="w-full max-w-3xl mx-auto py-12 text-center relative z-10">
             <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(74,222,128,0.3)] border border-green-400/50 relative">
               <div className="absolute inset-0 bg-green-400 blur-xl opacity-20 rounded-full"></div>
               <svg className="w-12 h-12 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
             </div>
             <h2 className="text-4xl font-black text-white mb-4 tracking-tight drop-shadow-lg">Order Placed Successfully</h2>
             
             <div className="bg-black/40 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white/10 text-left mt-8 mb-8 space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10">
                   <p className="text-xs font-black uppercase text-stone-500 tracking-widest mb-1">Store</p>
                   <p className="text-xl font-black text-white drop-shadow-sm">{currentOrder.storeName}</p>
                </div>
                {currentOrder.items.length > 0 && (
                  <div className="relative z-10">
                     <p className="text-xs font-black uppercase text-stone-500 tracking-widest mb-1">Items</p>
                     <p className="text-lg font-bold text-stone-300">{currentOrder.items[0].pizzaName} {currentOrder.items.length > 1 ? `+ ${currentOrder.items.length - 1} more` : ''}</p>
                  </div>
                )}
                <div className="relative z-10">
                   <p className="text-xs font-black uppercase text-stone-500 tracking-widest mb-1">Delivery Info</p>
                   <p className="text-lg font-bold text-stone-300 flex items-center gap-2">
                     <span className="capitalize">{currentOrder.selectedDeliveryProvider}</span> 
                     <span className="text-white/20">•</span> 
                     <span className="text-green-400 font-black drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]">ETA: {currentOrder.estimatedDeliveryTime}</span>
                   </p>
                </div>
                <div className="relative z-10">
                   <p className="text-xs font-black uppercase text-stone-500 tracking-widest mb-1">Final Charged Total</p>
                   <p className="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">${currentOrder.finalTotal.toFixed(2)}</p>
                </div>
             </div>
             
             <div className="flex gap-4 justify-center">
                <button onClick={() => setView('orders')} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black py-4 px-8 rounded-2xl shadow-[0_0_30px_rgba(255,50,0,0.4)] hover:shadow-[0_0_40px_rgba(255,50,0,0.6)] transition-all hover:scale-[1.02] flex items-center gap-2 border border-orange-400/50">
                  <ShoppingBag className="w-5 h-5" /> Track Order & View Receipt
                </button>
             </div>
          </div>
        )}

        {view === 'orders' && (
          currentUser ? (
            <OrdersManager 
              userId={currentUser.uid} 
              onNavigate={setView}
              onReorder={async (order) => {
                let currentTotal = 0;
                let oldTotal = order.finalTotal;
                
                for (const item of order.items) {
                   const configToPrice: PizzaConfig = {
                      size: item.size as any,
                      crust: item.crust as any,
                      sauce: item.sauce as any,
                      cheese: item.cheese,
                      meats: item.toppings,
                      veggies: [],
                      extras: [],
                      quantity: item.quantity,
                   };
                   
                   // Recalculate using current prices via calculateQuotes
                   const quotesData = calculateQuotes(configToPrice, 'auto', {});
                   const storeQuote = quotesData.find(q => q.chainId === order.storeId);
                   
                   const newBasePrice = storeQuote ? storeQuote.basePrice : item.basePrice;
                   const newToppingsTotal = storeQuote ? storeQuote.toppingsCost : item.toppingsTotal;
                   
                   // Try to get updated delivery option pricing
                   const matchingOption = storeQuote?.deliveryOptions.find(opt => opt.providerId === order.selectedDeliveryProviderId) || storeQuote?.deliveryOptions[0];
                   
                   let deliveryTotal = matchingOption ? matchingOption.priceBreakdown.grandTotal : (newBasePrice + newToppingsTotal) * item.quantity;
                   currentTotal += deliveryTotal;

                   const newItem: Omit<CartItem, 'id'> = {
                      store_id: order.storeId || '',
                      store_name: order.storeName || '',
                      item_name: item.pizzaName,
                      quantity: item.quantity,
                      price_per_item: newBasePrice + newToppingsTotal,
                      total_price: deliveryTotal,
                      delivery_type: order.deliveryType as any || 'store',
                      config: configToPrice,
                      deliveryOption: matchingOption
                   };
                   
                   await addToCart(newItem, false, false);
                }

                if (Math.abs(currentTotal - oldTotal) > 0.01) {
                   alert(`Prices have changed since your last order.\n\nPrevious Total: $${oldTotal.toFixed(2)}\nCurrent Total: $${currentTotal.toFixed(2)}`);
                }
                
                setView('cart');
              }} 
            />
          ) : (
            <div className="w-full max-w-5xl mx-auto py-8">
              <h2 className="text-3xl font-black text-stone-900 mb-8">My Orders</h2>
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200 border-dashed">
                <UserCircle className="w-8 h-8 mx-auto text-stone-300 mb-4" />
                <p className="text-stone-500 font-bold">Please sign in to view your orders.</p>
                <button onClick={() => setAuthModalOpen(true)} className="mt-4 text-red-600 font-bold text-sm hover:underline">Sign In</button>
              </div>
            </div>
          )
        )}

        {view === 'home' && (
          <HomeView 
             onCustomize={handleCustomize} 
             onCompare={(config) => {
               setPizzaConfig(config);
               setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 50);
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
          <div className="w-full max-w-4xl mx-auto pt-4">
             <div className="mb-8 text-center">
                <h1 className="text-3xl font-black text-stone-900 mb-2">Build Your Pizza</h1>
                <p className="text-stone-500">Customize your perfect slice and see real-time price estimates.</p>
             </div>
             <PizzaInput 
               currentConfig={pizzaConfig || { size: '', crust: '', sauce: '', cheese: [], meats: [], veggies: [], extras: [], quantity: 1 }} 
               onConfigChange={setPizzaConfig}
               onSaveFavorite={saveFavorite}
               onAddToCart={addToCart}
               defaultOpen={true}
               userPreferences={userPreferences}
             />
             <div className="mt-12 flex justify-center">
                <button 
                   onClick={() => setView('compare')}
                   disabled={!(pizzaConfig?.crust)}
                   className={`px-8 py-4 rounded-2xl text-lg font-black shadow-xl transition-all ${pizzaConfig?.crust ? 'bg-stone-900 text-white hover:bg-stone-800 hover:-translate-y-1' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                >
                   Compare Prices Now
                </button>
             </div>
          </div>
        )}

        {view === 'compare' && (
          <div className="w-full pt-4">
             <div className="mb-8 text-center flex flex-col items-center">
                <h1 className="text-3xl font-black text-stone-900 mb-2">Compare Deals</h1>
                <p className="text-stone-500 mb-6">See how your custom creation prices out across top stores.</p>
                
                <button onClick={() => setView('pizza-builder')} className="text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors">
                   ← Edit pizza configuration
                </button>
             </div>

            {/* Delivery Options */}
            {pizzaConfig && (
              <div className="mb-8 z-10 flex justify-center w-full animate-in fade-in duration-500">
                <div className="inline-flex bg-white/80 backdrop-blur-md rounded-2xl p-1 shadow-sm border border-stone-200">
                  <button
                    onClick={() => setDeliveryType('auto')}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${deliveryType === 'auto' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'}`}
                  >
                    Best Match (Auto)
                  </button>
                  <button
                    onClick={() => setDeliveryType('store-delivery')}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${deliveryType === 'store-delivery' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'}`}
                  >
                    Store Delivery
                  </button>
                  <button
                    onClick={() => setDeliveryType('pickup')}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${deliveryType === 'pickup' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'}`}
                  >
                    Pickup
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
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
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200 border-dashed max-w-2xl mx-auto">
                 <Search className="w-8 h-8 mx-auto text-stone-300 mb-4" />
                 <p className="text-stone-500 font-bold mb-4">You need to build a pizza first.</p>
                 <button onClick={() => setView('pizza-builder')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">Start Building</button>
              </div>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
