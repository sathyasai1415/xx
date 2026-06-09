import { useState, useMemo, useEffect } from 'react';
import { ParallaxBackground } from './components/ParallaxBackground';
import './utils/debug'; // Trigger the debug console output
import { PizzaInput } from './components/PizzaInput';
import { ComparisonCards } from './components/ComparisonCards';
import { Recommendations } from './components/Recommendations';
import { AuthModal } from './components/AuthModal';
import { LocalDeals } from './components/LocalDeals';
import { AdminDashboard } from './components/AdminDashboard';
import { PizzaConfig, DeliveryType, FavoriteConfig, Review } from './types';
import { calculateQuotes } from './lib/pricing';
import { Heart, Search, Star, UserCircle, Store } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import { Cart } from './components/Cart';
import { CartItem } from './types';
import { ShoppingCart } from 'lucide-react';

type ViewState = 'home' | 'local-deals' | 'admin-dashboard' | 'saved-pizzas' | 'cart';

export default function App() {
  const [pizzaConfig, setPizzaConfig] = useState<PizzaConfig | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType | 'auto'>('auto');
  const [view, setView] = useState<ViewState>('home');
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // State for Favorites from Firestore
  const [favorites, setFavorites] = useState<{id: string, name: string, config: PizzaConfig}[]>([]);
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  
  // State for user submitted reviews across session
  const [userReviews, setUserReviews] = useState<Record<string, Review[]>>({});

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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
    const configName = prompt("Give this pizza a name (e.g. Movie Night Special):", "My Favorite Pizza");
    if (!configName) return;
    
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
      alert('Pizza saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save pizza.');
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
    setView('home');
    setTimeout(() => window.scrollTo({ top: 300, behavior: 'smooth' }), 100);
  };

  const handleCompare = (config: PizzaConfig) => {
    setPizzaConfig(config);
    setView('home');
    setTimeout(() => {
       window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
       });
       return () => unsub();
    } else {
       const savedCart = localStorage.getItem('miSliceCart');
       if (savedCart) setCart(JSON.parse(savedCart));
    }
  }, [currentUser]);

  const addToCart = async (item: Omit<CartItem, 'id'>, redirect: boolean = false, showAlert: boolean = true) => {
    if (currentUser) {
       await addDoc(collection(db, 'cart_items'), {
         ...item,
         user_id: currentUser.uid,
         created_at: new Date().toISOString()
       });
    } else {
       const newItem = { ...item, id: Date.now().toString() } as CartItem;
       const newCart = [...cart, newItem];
       setCart(newCart);
       localStorage.setItem('miSliceCart', JSON.stringify(newCart));
    }
    
    if (redirect) {
       setView('cart');
    } else if (showAlert) {
       // alert("Added to cart"); // Usually handled by inline UI now
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
    <div className="relative min-h-screen font-sans text-stone-800 flex flex-col items-center">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ParallaxBackground />
      
      {/* Header Navigation */}
      <header className="relative w-full z-10 flex flex-col sm:flex-row items-center justify-between px-6 sm:px-10 py-6 max-w-6xl mx-auto gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-200">MI</div>
          <span className="text-xl font-bold tracking-tight text-stone-900 hidden sm:inline">slice.online</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm font-bold text-stone-500">
          <button onClick={() => setView('home')} className={`hover:text-stone-900 transition-colors ${view === 'home' ? 'text-stone-900 font-bold' : ''}`}>Comparison</button>
          <button onClick={() => setView('local-deals')} className={`hover:text-stone-900 transition-colors ${view === 'local-deals' ? 'text-red-600 font-bold' : ''}`}>Local Deals</button>
          
          {currentUser && !isPartner && (
            <button onClick={() => setView('saved-pizzas')} className={`flex items-center gap-1.5 hover:text-stone-900 transition-colors ${view === 'saved-pizzas' ? 'text-stone-900 font-bold' : ''}`}>
              <Heart className="w-4 h-4" /> 
              Saved Pizzas
            </button>
          )}

          {isPartner && (
            <button onClick={() => setView('admin-dashboard')} className={`flex items-center gap-1.5 text-red-600 hover:text-red-700 transition-colors ${view === 'admin-dashboard' ? 'font-black' : ''}`}>
              <Store className="w-4 h-4" /> 
              Dashboard
            </button>
          )}

          {!isPartner && (
            <button onClick={() => setView('cart')} className={`flex items-center gap-1.5 hover:text-stone-900 transition-colors ${view === 'cart' ? 'text-stone-900 font-bold' : ''}`}>
              <ShoppingCart className="w-4 h-4" /> 
              Cart
              {cart.length > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center -ml-1">
                  {cart.length}
                </span>
              )}
            </button>
          )}
        </nav>
        <div>
           {currentUser ? (
             <button onClick={() => auth.signOut()} className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
               <UserCircle className="w-4 h-4" />
               Sign Out
             </button>
           ) : (
             <button onClick={() => setAuthModalOpen(true)} className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-sm font-bold shadow-xl shadow-stone-200 transition-colors">Sign In</button>
           )}
        </div>
      </header>

      <main className="px-4 pt-8 pb-24 max-w-6xl mx-auto flex flex-col items-center w-full z-10 flex-1">
        
        {view === 'local-deals' && <LocalDeals onAddToCart={addToCart} />}
        
        {view === 'admin-dashboard' && <AdminDashboard />}

        {view === 'cart' && (
          <Cart 
            items={cart} 
            onUpdateQuantity={updateCartQuantity} 
            onRemoveItem={removeFromCart} 
            onCheckout={() => {
              if (!currentUser) {
                 setAuthModalOpen(true);
              } else {
                 alert("Redirecting to payment/order fulfillment...");
              }
            }} 
            onContinueShopping={() => setView('home')}
            onEditItem={(item) => {
              if (item.config) {
                setPizzaConfig(item.config);
                setView('home');
              }
            }}
          />
        )}

        {view === 'saved-pizzas' && (
          <div className="w-full max-w-5xl mx-auto py-8">
            <h2 className="text-3xl font-black text-stone-900 mb-8">My Saved Pizzas</h2>
            {favorites.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200 border-dashed">
                <Heart className="w-8 h-8 mx-auto text-stone-300 mb-4" />
                <p className="text-stone-500 font-bold">You haven't saved any pizzas yet.</p>
                <button onClick={() => setView('home')} className="mt-4 text-red-600 font-bold text-sm hover:underline">Build one now</button>
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
                      <Search className="w-4 h-4" /> Compare Prices
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'home' && (
          <>
            {/* Hero */}
            <div className="text-center mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-center text-3xl sm:text-5xl font-light mb-4 sm:mb-6 text-stone-400">
                The <span className="text-stone-900 font-semibold">smartest way</span> to slice the bill.
              </h1>
              <p className="text-base sm:text-lg text-stone-500 font-medium max-w-2xl mx-auto">
                Describe your craving naturally, or build it manually. We'll compare real ingredients across the top chains.
              </p>
            </div>

            {/* Input */}
            <PizzaInput 
              currentConfig={pizzaConfig || { size: '', crust: '', sauce: '', cheese: [], meats: [], veggies: [], extras: [], quantity: 1 }} 
              onConfigChange={setPizzaConfig}
              onSaveFavorite={saveFavorite}
              onAddToCart={addToCart}
            />

            {/* Recommendations */}
            <Recommendations onCustomize={handleCustomize} onCompare={handleCompare} />

            {/* Delivery Options */}
            {pizzaConfig && (
              <div className="mt-8 z-10 flex justify-center w-full animate-in fade-in duration-500">
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
            <ComparisonCards 
               quotes={quotes} 
               favoriteStores={favoriteStores} 
               onToggleFavoriteStore={toggleFavoriteStore} 
               onAddReview={handleAddReview} 
               onAddToCart={addToCart}
               currentConfig={pizzaConfig}
            />
          </>
        )}
      </main>
    </div>
  );
}
