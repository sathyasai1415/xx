/**
 * DemoStoreDashboard — fully functional store owner dashboard driven by mock data.
 * Zero Firebase calls. All state is local React state.
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Pizza, Tag, Store, LogOut, Plus, Trash2, Edit2, Check, X,
  DollarSign, ShoppingBag, Power, Loader2, Clock, MapPin, Phone, Save,
  Wallet, TrendingUp, TrendingDown, Timer, Menu as MenuIcon, Zap, Camera,
  ScanLine, Copy, CheckCircle2, ToggleLeft, ToggleRight, Lightbulb,
  RefreshCw, Navigation, User, Bike, PhoneCall, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem { id: string; name: string; description: string; price: number; category: string; available: boolean; }
interface Deal     { id: string; title: string; description: string; original_price: number; discounted_price: number; is_active: boolean; coupon_code: string; }
interface Order    { id: string; createdAt: string; orderStatus: string; items: { name: string; qty: number; itemTotal: number }[]; finalTotal: number; deliveryAddress: string; deliveryType: string; prepMinutes?: number; }

type Tab = 'overview' | 'orders' | 'menu' | 'deals' | 'insights' | 'earnings';
type EarningsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const money = (n: number) => `$${(Number(n)||0).toFixed(2)}`;
const PLATFORM_FEE = 0.20;
const CATEGORIES = ['Pizza', 'Specials', 'Sides', 'Drinks', 'Desserts'];
const ORDER_STAGES = ['placed','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled'];
const PREP_OPTIONS = [10, 15, 20, 25, 30, 45];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STORE = {
  store_name: 'Motor City Pies',
  tagline: 'Detroit-style deep dish since 1987',
  address: '2847 Woodward Ave',
  city: 'Detroit', state: 'MI',
  phone: '+1 (313) 555-0144',
  accepting_orders: true,
};

const INIT_MENU: MenuItem[] = [
  { id: 'm1',  name: 'Detroit-Style Deep Dish',  description: 'Crispy square crust, Wisconsin brick cheese, San Marzano sauce on top',  price: 22.99, category: 'Pizza',    available: true  },
  { id: 'm2',  name: 'Large Pepperoni',           description: 'Classic hand-tossed, 16" with double pepperoni',                          price: 18.99, category: 'Pizza',    available: true  },
  { id: 'm3',  name: 'BBQ Chicken Pizza',         description: 'Smoked chicken, red onion, BBQ sauce, mozzarella',                        price: 19.49, category: 'Pizza',    available: true  },
  { id: 'm4',  name: 'Veggie Supreme',            description: 'Bell peppers, mushrooms, olives, onions, tomatoes',                       price: 17.49, category: 'Pizza',    available: true  },
  { id: 'm5',  name: 'Half-and-Half Special',     description: 'Choose any two toppings on each half — 14" round',                       price: 20.99, category: 'Specials', available: true  },
  { id: 'm6',  name: 'Family Pack (2 Large)',     description: '2 large pizzas + 2 sides + 4 drinks — feeds 5–6',                        price: 54.99, category: 'Specials', available: true  },
  { id: 'm7',  name: 'Garlic Bread (6pc)',        description: 'Toasted sourdough with roasted garlic butter & parsley',                  price: 5.99,  category: 'Sides',    available: true  },
  { id: 'm8',  name: 'Buffalo Wings (10pc)',      description: 'Crispy wings in choice of Buffalo, BBQ, or honey garlic',                 price: 13.99, category: 'Sides',    available: true  },
  { id: 'm9',  name: 'Caesar Salad',             description: 'Romaine, croutons, parmesan, house Caesar dressing',                      price: 8.49,  category: 'Sides',    available: false },
  { id: 'm10', name: 'Coca-Cola (2L)',            description: '',                                                                        price: 3.49,  category: 'Drinks',   available: true  },
  { id: 'm11', name: 'Pepsi (2L)',                description: '',                                                                        price: 3.49,  category: 'Drinks',   available: true  },
  { id: 'm12', name: 'Sparkling Water',           description: 'San Pellegrino, 750ml',                                                   price: 2.99,  category: 'Drinks',   available: true  },
  { id: 'm13', name: 'Chocolate Lava Cake',       description: 'Warm chocolate cake with molten center, vanilla ice cream',               price: 6.99,  category: 'Desserts', available: true  },
  { id: 'm14', name: 'Tiramisu',                 description: 'Classic Italian, house-made with espresso & mascarpone',                   price: 5.99,  category: 'Desserts', available: true  },
];

const INIT_DEALS: Deal[] = [
  { id: 'd1', title: 'Tuesday Twofer',       description: 'Buy 2 large pizzas, get a free garlic bread',      original_price: 43.97, discounted_price: 37.98, is_active: true,  coupon_code: 'MITUE2' },
  { id: 'd2', title: '20% Off — Lunch Rush', description: 'Valid Mon–Fri 11am–2pm. Min order $20.',           original_price: 0,     discounted_price: 0,     is_active: true,  coupon_code: 'MILUNCH' },
  { id: 'd3', title: 'Free Delivery Friday', description: 'No delivery fee on orders $15+. Fridays only.',    original_price: 0,     discounted_price: 0,     is_active: true,  coupon_code: 'MIFRIF' },
  { id: 'd4', title: '$5 Off First Order',   description: 'New customers — use at checkout.',                  original_price: 0,     discounted_price: 0,     is_active: false, coupon_code: 'MINEW5' },
];

// Generate realistic past orders across past 30 days
function makeOrder(id: string, daysAgo: number, hoursAgo: number, status: string, items: Order['items'], total: number, addr = '1204 Gratiot Ave, Detroit, MI'): Order {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return { id, createdAt: d.toISOString(), orderStatus: status, items, finalTotal: total, deliveryAddress: addr, deliveryType: 'delivery' };
}

const INIT_ORDERS: Order[] = [
  // Active right now
  makeOrder('o001', 0, 0, 'placed',        [{ name: 'Large Pepperoni', qty: 1, itemTotal: 18.99 }, { name: 'Coca-Cola (2L)', qty: 2, itemTotal: 6.98 }], 27.47, '5210 Cass Ave, Detroit, MI'),
  makeOrder('o002', 0, 0, 'preparing',     [{ name: 'Detroit-Style Deep Dish', qty: 1, itemTotal: 22.99 }, { name: 'Buffalo Wings (10pc)', qty: 1, itemTotal: 13.99 }], 38.48, '742 Brainard St, Detroit, MI'),
  makeOrder('o003', 0, 1, 'out_for_delivery', [{ name: 'Family Pack (2 Large)', qty: 1, itemTotal: 54.99 }], 54.99, '3120 Michigan Ave, Detroit, MI'),
  // Past delivered
  makeOrder('o004', 0, 3, 'delivered',     [{ name: 'BBQ Chicken Pizza', qty: 1, itemTotal: 19.49 }, { name: 'Sparkling Water', qty: 2, itemTotal: 5.98 }], 26.97),
  makeOrder('o005', 0, 5, 'delivered',     [{ name: 'Large Pepperoni', qty: 2, itemTotal: 37.98 }, { name: 'Garlic Bread (6pc)', qty: 1, itemTotal: 5.99 }], 45.47),
  makeOrder('o006', 1, 2, 'delivered',     [{ name: 'Veggie Supreme', qty: 1, itemTotal: 17.49 }, { name: 'Caesar Salad', qty: 1, itemTotal: 8.49 }], 27.48),
  makeOrder('o007', 1, 6, 'delivered',     [{ name: 'Detroit-Style Deep Dish', qty: 1, itemTotal: 22.99 }, { name: 'Tiramisu', qty: 2, itemTotal: 11.98 }], 35.97),
  makeOrder('o008', 1, 8, 'cancelled',     [{ name: 'BBQ Chicken Pizza', qty: 1, itemTotal: 19.49 }], 19.49),
  makeOrder('o009', 2, 1, 'delivered',     [{ name: 'Half-and-Half Special', qty: 1, itemTotal: 20.99 }, { name: 'Pepsi (2L)', qty: 2, itemTotal: 6.98 }, { name: 'Buffalo Wings (10pc)', qty: 1, itemTotal: 13.99 }], 43.46),
  makeOrder('o010', 2, 4, 'delivered',     [{ name: 'Large Pepperoni', qty: 1, itemTotal: 18.99 }], 18.99),
  makeOrder('o011', 3, 2, 'delivered',     [{ name: 'Family Pack (2 Large)', qty: 1, itemTotal: 54.99 }, { name: 'Chocolate Lava Cake', qty: 2, itemTotal: 13.98 }], 69.97),
  makeOrder('o012', 3, 7, 'delivered',     [{ name: 'Detroit-Style Deep Dish', qty: 1, itemTotal: 22.99 }], 22.99),
  makeOrder('o013', 4, 1, 'delivered',     [{ name: 'Veggie Supreme', qty: 1, itemTotal: 17.49 }, { name: 'Sparkling Water', qty: 1, itemTotal: 2.99 }], 21.48),
  makeOrder('o014', 4, 3, 'cancelled',     [{ name: 'Large Pepperoni', qty: 1, itemTotal: 18.99 }], 18.99),
  makeOrder('o015', 5, 2, 'delivered',     [{ name: 'BBQ Chicken Pizza', qty: 2, itemTotal: 38.98 }, { name: 'Garlic Bread (6pc)', qty: 2, itemTotal: 11.98 }, { name: 'Coca-Cola (2L)', qty: 2, itemTotal: 6.98 }], 60.44),
  makeOrder('o016', 5, 5, 'delivered',     [{ name: 'Half-and-Half Special', qty: 1, itemTotal: 20.99 }], 20.99),
  makeOrder('o017', 6, 1, 'delivered',     [{ name: 'Large Pepperoni', qty: 1, itemTotal: 18.99 }, { name: 'Buffalo Wings (10pc)', qty: 1, itemTotal: 13.99 }], 33.98),
  makeOrder('o018', 6, 4, 'delivered',     [{ name: 'Detroit-Style Deep Dish', qty: 1, itemTotal: 22.99 }, { name: 'Tiramisu', qty: 1, itemTotal: 5.99 }], 29.98),
  makeOrder('o019', 7, 2, 'delivered',     [{ name: 'Family Pack (2 Large)', qty: 1, itemTotal: 54.99 }], 54.99),
  makeOrder('o020', 8, 3, 'delivered',     [{ name: 'Veggie Supreme', qty: 1, itemTotal: 17.49 }, { name: 'Pepsi (2L)', qty: 1, itemTotal: 3.49 }], 21.98),
  makeOrder('o021', 9, 1, 'delivered',     [{ name: 'BBQ Chicken Pizza', qty: 1, itemTotal: 19.49 }, { name: 'Chocolate Lava Cake', qty: 1, itemTotal: 6.99 }], 27.48),
  makeOrder('o022', 10, 5, 'delivered',    [{ name: 'Large Pepperoni', qty: 3, itemTotal: 56.97 }, { name: 'Coca-Cola (2L)', qty: 3, itemTotal: 10.47 }], 69.94),
  makeOrder('o023', 11, 2, 'delivered',    [{ name: 'Detroit-Style Deep Dish', qty: 2, itemTotal: 45.98 }], 45.98),
  makeOrder('o024', 12, 1, 'delivered',    [{ name: 'Half-and-Half Special', qty: 2, itemTotal: 41.98 }, { name: 'Garlic Bread (6pc)', qty: 2, itemTotal: 11.98 }], 55.96),
  makeOrder('o025', 13, 4, 'cancelled',    [{ name: 'Family Pack (2 Large)', qty: 1, itemTotal: 54.99 }], 54.99),
  makeOrder('o026', 14, 2, 'delivered',    [{ name: 'Large Pepperoni', qty: 1, itemTotal: 18.99 }, { name: 'Caesar Salad', qty: 1, itemTotal: 8.49 }], 28.48),
  makeOrder('o027', 15, 3, 'delivered',    [{ name: 'BBQ Chicken Pizza', qty: 1, itemTotal: 19.49 }, { name: 'Buffalo Wings (10pc)', qty: 1, itemTotal: 13.99 }], 34.98),
  makeOrder('o028', 16, 1, 'delivered',    [{ name: 'Detroit-Style Deep Dish', qty: 1, itemTotal: 22.99 }, { name: 'Pepsi (2L)', qty: 2, itemTotal: 6.98 }], 30.97),
  makeOrder('o029', 17, 2, 'delivered',    [{ name: 'Veggie Supreme', qty: 2, itemTotal: 34.98 }], 34.98),
  makeOrder('o030', 18, 4, 'delivered',    [{ name: 'Family Pack (2 Large)', qty: 1, itemTotal: 54.99 }, { name: 'Tiramisu', qty: 2, itemTotal: 11.98 }], 67.97),
  makeOrder('o031', 20, 3, 'delivered',    [{ name: 'Large Pepperoni', qty: 2, itemTotal: 37.98 }], 37.98),
  makeOrder('o032', 22, 2, 'delivered',    [{ name: 'BBQ Chicken Pizza', qty: 1, itemTotal: 19.49 }, { name: 'Chocolate Lava Cake', qty: 2, itemTotal: 13.98 }], 34.97),
  makeOrder('o033', 24, 1, 'delivered',    [{ name: 'Half-and-Half Special', qty: 1, itemTotal: 20.99 }, { name: 'Garlic Bread (6pc)', qty: 1, itemTotal: 5.99 }], 27.98),
  makeOrder('o034', 26, 5, 'delivered',    [{ name: 'Detroit-Style Deep Dish', qty: 1, itemTotal: 22.99 }], 22.99),
  makeOrder('o035', 28, 2, 'delivered',    [{ name: 'Family Pack (2 Large)', qty: 1, itemTotal: 54.99 }, { name: 'Buffalo Wings (10pc)', qty: 1, itemTotal: 13.99 }], 69.98),
];

// ─── Mock delivery drivers ────────────────────────────────────────────────────

const MOCK_DRIVERS = [
  { name: 'Marcus W.',   platform: 'MiSlice Delivery', vehicle: 'Honda Civic · Gray',     rating: 4.9, phone: '+1 (313) 555-0182', eta: 12 },
  { name: 'Destiny L.',  platform: 'MiSlice Delivery', vehicle: 'Toyota Corolla · Blue',  rating: 4.8, phone: '+1 (248) 555-0341', eta: 18 },
  { name: 'Jordan K.',   platform: 'MiSlice Delivery', vehicle: 'Nissan Sentra · Black',  rating: 4.7, phone: '+1 (734) 555-0927', eta: 8  },
];
const STAGE_INDEX: Record<string, number> = { placed:0, confirmed:1, preparing:2, ready_for_pickup:3, out_for_delivery:4, delivered:5, cancelled:0 };
const STAGE_LABELS = ['Order Placed','Confirmed','Preparing','Ready for Pickup','Out for Delivery','Delivered'];

const DEAL_TEMPLATES = [
  { title: '10% Off Your Order',     description: 'Valid on orders over $15', original_price: 0, discounted_price: 0, is_active: true, coupon_code: 'MI10OFF'  },
  { title: '20% Off — Limited Time', description: 'Min order $20',            original_price: 0, discounted_price: 0, is_active: true, coupon_code: 'MI20OFF'  },
  { title: 'Buy 1 Get 1 Pizza Free', description: 'Same size or smaller',     original_price: 0, discounted_price: 0, is_active: true, coupon_code: 'MIBOGO'   },
  { title: 'Free Delivery Today!',   description: 'Min order $15',            original_price: 0, discounted_price: 0, is_active: true, coupon_code: 'MISHIP'   },
  { title: '$5 Off Orders $25+',     description: 'Limited time offer',       original_price: 0, discounted_price: 0, is_active: true, coupon_code: 'MI5BUCK'  },
];

const SCAN_ITEMS = [
  { name: 'Large Margherita',       price: 16.99, category: 'Pizza',    description: '8 slices, fresh basil & buffalo mozzarella' },
  { name: 'Meat Lovers',           price: 21.49, category: 'Pizza',    description: 'Pepperoni, sausage, bacon, ham'              },
  { name: 'Chicken Wings (8pc)',   price: 11.99, category: 'Sides',    description: 'Choice of sauce'                            },
  { name: 'Mozzarella Sticks (6)', price: 7.99,  category: 'Sides',    description: 'Served with marinara'                      },
  { name: 'Lemonade (1L)',         price: 3.99,  category: 'Drinks',   description: 'Fresh-squeezed'                             },
  { name: 'Root Beer (2L)',        price: 3.49,  category: 'Drinks',   description: ''                                           },
  { name: 'Cannoli (2pc)',         price: 4.99,  category: 'Desserts', description: 'Ricotta-filled, chocolate chips'            },
];

let nextId = 100;
const uid = () => `demo-${nextId++}`;

// ─── Root ─────────────────────────────────────────────────────────────────────

export function DemoStoreDashboard({ onExit }: { onExit: () => void }) {
  const [tab, setTab]               = useState<Tab>('overview');
  const [store, setStore]           = useState(STORE);
  const [menu, setMenu]             = useState<MenuItem[]>(INIT_MENU);
  const [deals, setDeals]           = useState<Deal[]>(INIT_DEALS);
  const [orders, setOrders]         = useState<Order[]>(INIT_ORDERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast]           = useState('');

  const flash = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); }, []);
  const goTab = (t: Tab) => { setTab(t); setSidebarOpen(false); };

  const ACTIVE = ['placed','confirmed','preparing','ready_for_pickup','out_for_delivery'];
  const liveCount = orders.filter(o => ACTIVE.includes(o.orderStatus)).length;

  const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',  label: 'Overview',     icon: LayoutDashboard },
    { id: 'orders',    label: 'Orders',        icon: ShoppingBag     },
    { id: 'menu',      label: 'Menu & Prices', icon: Pizza           },
    { id: 'deals',     label: 'Deals',         icon: Tag             },
    { id: 'insights',  label: 'AI Insights',   icon: Zap             },
    { id: 'earnings',  label: 'Earnings',      icon: Wallet          },
  ];

  return (
    <div className="min-h-screen w-full bg-[#080808] text-stone-100 lg:flex">

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-[#0b0b0b] border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-white/8 transition-colors">
          <MenuIcon className="w-5 h-5 text-stone-300" />
        </button>
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shrink-0">
          <Store className="w-4 h-4 text-white" />
        </div>
        <p className="flex-1 text-sm font-black text-white truncate">{store.store_name}</p>
        <span className="text-[9px] font-black px-2.5 py-1 rounded-full border bg-green-500/15 text-green-400 border-green-500/25 shrink-0">● DEMO</span>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-60 shrink-0 bg-[#0b0b0b] border-r border-white/8 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 lg:h-screen lg:sticky lg:top-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white truncate">{store.store_name}</p>
            <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest">Demo Mode</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/8 transition-colors">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {/* Demo banner */}
        <div className="mx-3 mt-3 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2.5">
          <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Preview Mode</p>
          <p className="text-[10px] text-stone-500 mt-0.5">Mock data — changes don't persist</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => goTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === id ? 'bg-gradient-to-r from-red-600/90 to-orange-600/70 text-white' : 'text-stone-400 hover:bg-white/6 hover:text-white'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {id === 'orders' && liveCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">{liveCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/8 space-y-1">
          <div className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black ${store.accepting_orders ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-stone-500/15 text-stone-400 border border-white/10'}`}>
            <Power className="w-3.5 h-3.5" /> {store.accepting_orders ? 'Accepting Orders' : 'Orders Paused'}
          </div>
          <button onClick={onExit} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Exit Demo
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {tab === 'overview'  && <DemoOverview  store={store} menu={menu} orders={orders} onGoTab={goTab} />}
          {tab === 'orders'    && <DemoOrders    orders={orders} setOrders={setOrders} flash={flash} />}
          {tab === 'menu'      && <DemoMenu      menu={menu} setMenu={setMenu} flash={flash} />}
          {tab === 'deals'     && <DemoDeals     deals={deals} setDeals={setDeals} flash={flash} />}
          {tab === 'insights'  && <DemoInsights  orders={orders} />}
          {tab === 'earnings'  && <DemoEarnings  orders={orders} />}
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function DemoOverview({ store, menu, orders, onGoTab }: { store: typeof STORE; menu: MenuItem[]; orders: Order[]; onGoTab: (t: Tab) => void }) {
  const today = new Date().toDateString();
  const todayOrders  = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const completed    = orders.filter(o => o.orderStatus !== 'cancelled');
  const gross        = completed.reduce((s, o) => s + o.finalTotal, 0);
  const net          = gross * (1 - PLATFORM_FEE);
  const pending      = orders.filter(o => o.orderStatus === 'placed');

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-black text-white">Welcome back 👋</h1>
        <span className="text-[9px] font-black bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2.5 py-1 rounded-full uppercase">Demo</span>
      </div>
      <p className="text-sm text-stone-500 mb-6">Here's what's happening at {store.store_name}.</p>

      {pending.length > 0 && (
        <button onClick={() => onGoTab('orders')} className="w-full mb-6 bg-gradient-to-r from-orange-600/20 to-red-600/15 border border-orange-500/30 rounded-2xl px-5 py-4 flex items-center justify-between text-left hover:border-orange-500/50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
            </span>
            <p className="text-sm font-black text-white">{pending.length} new order{pending.length !== 1 ? 's' : ''} need action</p>
          </div>
          <span className="text-xs font-bold text-red-300">Review →</span>
        </button>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's Orders", value: todayOrders.length,  icon: ShoppingBag, color: 'text-red-400'    },
          { label: 'Total Orders',   value: orders.length,        icon: ShoppingBag, color: 'text-blue-400'   },
          { label: 'Net Earnings',   value: money(net),           icon: DollarSign,  color: 'text-green-400'  },
          { label: 'Menu Items',     value: menu.length,          icon: Pizza,       color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[11px] text-stone-500 font-bold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Fee breakdown */}
      <div className="glass rounded-2xl p-5 mb-6">
        <p className="text-xs font-black text-stone-500 uppercase tracking-widest mb-3">MiSlice Fee Breakdown (All-Time)</p>
        <div className="flex h-8 rounded-xl overflow-hidden mb-3">
          <div className="flex items-center justify-center bg-green-600/70 text-[10px] font-black text-white" style={{ width: '80%' }}>Your 80% — {money(net)}</div>
          <div className="flex items-center justify-center bg-red-600/70 text-[10px] font-black text-white" style={{ width: '20%' }}>20%</div>
        </div>
        <div className="flex gap-6 text-xs font-bold">
          <span className="text-stone-400">Gross: <span className="text-white">{money(gross)}</span></span>
          <span className="text-stone-400">MiSlice fee: <span className="text-red-400">−{money(gross * PLATFORM_FEE)}</span></span>
          <span className="text-stone-400">Your payout: <span className="text-green-400">{money(net)}</span></span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { emoji:'📦', label:'View Orders',  tab:'orders'   as Tab },
          { emoji:'🍕', label:'Edit Menu',     tab:'menu'     as Tab },
          { emoji:'🏷️', label:'Create Deal',  tab:'deals'    as Tab },
          { emoji:'📊', label:'AI Insights',  tab:'insights' as Tab },
        ].map(q => (
          <button key={q.label} onClick={() => onGoTab(q.tab)} className="glass hover:bg-white/10 rounded-2xl p-4 text-left transition-all group">
            <span className="text-2xl mb-2 block">{q.emoji}</span>
            <p className="text-sm font-black text-white group-hover:text-red-300 transition-colors">{q.label}</p>
          </button>
        ))}
      </div>

      <h2 className="text-sm font-black text-white mb-3">Recent Orders</h2>
      <div className="space-y-2">
        {orders.slice(0, 6).map(o => (
          <div key={o.id} className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{o.items[0].name}{o.items.length > 1 ? ` +${o.items.length-1}` : ''}</p>
              <p className="text-[11px] text-stone-500 capitalize">{o.orderStatus.replace(/_/g,' ')}</p>
            </div>
            <p className="font-black text-white">{money(o.finalTotal)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function TrackingPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  const status   = order.orderStatus;
  const stageIdx = STAGE_INDEX[status] ?? 0;
  const driver   = MOCK_DRIVERS[parseInt(order.id.replace(/\D/g,'')) % MOCK_DRIVERS.length];
  const showDriver = stageIdx >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="relative w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Live Tracking</p>
            <p className="text-base font-black text-white">Order #{order.id.slice(-3).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/8 text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Stepper */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-4">Order Progress</p>
            {STAGE_LABELS.map((label, i) => {
              const done = i < stageIdx; const cur = i === stageIdx;
              return (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 ${done ? 'bg-green-500 border-green-500' : cur ? 'bg-orange-500 border-orange-500 animate-pulse' : 'bg-transparent border-white/15'}`}>
                      {done ? <Check className="w-3.5 h-3.5 text-white" /> : <div className={`w-2 h-2 rounded-full ${cur ? 'bg-white' : 'bg-stone-700'}`} />}
                    </div>
                    {i < 5 && <div className={`w-0.5 h-5 ${i < stageIdx ? 'bg-green-500/60' : 'bg-white/8'}`} />}
                  </div>
                  <p className={`text-sm font-bold pt-1 pb-4 ${done ? 'text-green-400' : cur ? 'text-orange-300' : 'text-stone-600'}`}>{label}</p>
                </div>
              );
            })}
          </div>

          {/* Map placeholder */}
          <div className="rounded-2xl h-36 bg-stone-900 border border-white/8 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            {showDriver ? (
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40">
                  <Bike className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-black text-white bg-black/60 px-3 py-1 rounded-full">{driver.name} · ETA {driver.eta} min</p>
              </div>
            ) : (
              <div className="relative z-10 text-center">
                <Navigation className="w-6 h-6 text-stone-600 mx-auto mb-1" />
                <p className="text-xs text-stone-600 font-bold">Driver assigned at pickup</p>
              </div>
            )}
          </div>

          {/* Driver card */}
          {showDriver ? (
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Delivery Partner</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shrink-0 font-black text-white text-sm">
                  {driver.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white">{driver.name}</p>
                  <p className="text-[11px] text-stone-500">{driver.platform} · ⭐ {driver.rating}</p>
                  <p className="text-[11px] text-stone-500 truncate">{driver.vehicle}</p>
                </div>
                <a href={`tel:${driver.phone}`} className="flex items-center justify-center w-9 h-9 bg-green-500/15 border border-green-500/25 rounded-xl text-green-400 hover:bg-green-500/25 transition-colors">
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>
              <div className="mt-3 flex items-center gap-2 bg-orange-500/8 border border-orange-500/20 rounded-xl px-3 py-2">
                <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <p className="text-xs font-black text-orange-300">ETA {driver.eta} minutes</p>
                <p className="text-[10px] text-stone-500 ml-auto">{driver.phone}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
              <User className="w-5 h-5 text-stone-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-stone-400">Driver not assigned yet</p>
                <p className="text-xs text-stone-600">Assigned once the order is ready for pickup.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DemoOrders({ orders, setOrders, flash }: { orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>>; flash: (m: string) => void }) {
  const [view, setView] = useState<'active'|'past'|'receipts'>('active');
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const ACTIVE = ['placed','confirmed','preparing','ready_for_pickup','out_for_delivery'];
  const active = orders.filter(o => ACTIVE.includes(o.orderStatus));
  const past   = orders.filter(o => ['delivered','cancelled'].includes(o.orderStatus)).sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  const advance = (id: string, status: string) => {
    setOrders(os => os.map(o => o.id === id ? { ...o, orderStatus: status } : o));
    flash(`Marked: ${status.replace(/_/g,' ')}`);
  };
  const accept = (id: string, mins: number) => {
    setOrders(os => os.map(o => o.id === id ? { ...o, orderStatus: 'confirmed', prepMinutes: mins } : o));
    flash(`Accepted · ${mins} min prep`);
  };

  return (
    <div>
      <AnimatePresence>{trackingOrder && <TrackingPanel order={trackingOrder} onClose={() => setTrackingOrder(null)} />}</AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Orders</h1>
          <p className="text-sm text-stone-500">{active.length} active · {past.length} past</p>
        </div>
        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          {([['active','Active'],['past','Past'],['receipts','Receipts']] as const).map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${view===v?'bg-white/15 text-white':'text-stone-500 hover:text-white'}`}>
              {l}{v==='active'&&active.length>0&&<span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center bg-red-500 rounded-full text-[9px] font-black text-white">{active.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {view === 'active' && (
        active.length === 0
          ? <div className="glass-soft rounded-2xl p-10 text-center text-stone-500 text-sm">No active orders.</div>
          : <div className="space-y-3">
              {active.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(o => {
                const status = o.orderStatus;
                const isNew  = status === 'placed';
                return (
                  <div key={o.id} className={`glass rounded-2xl p-5 ${isNew?'border border-orange-500/40':''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-black text-white flex items-center gap-2">
                          Order #{o.id.replace('o','').padStart(3,'0')}
                          {isNew && <span className="text-[8px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
                        </p>
                        <p className="text-[11px] text-stone-500">{new Date(o.createdAt).toLocaleTimeString()} · {o.deliveryType}{o.prepMinutes ? ` · ${o.prepMinutes}min prep` : ''}</p>
                      </div>
                      <p className="font-black text-white">{money(o.finalTotal)}</p>
                    </div>
                    <div className="text-xs text-stone-400 mb-3 space-y-0.5">
                      {o.items.map((it,i) => <p key={i}>{it.qty}× {it.name}</p>)}
                    </div>
                    {o.deliveryAddress && <p className="text-[11px] text-stone-500 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" /> {o.deliveryAddress}</p>}
                    {isNew ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1"><Timer className="w-3 h-3" /> Prep:</span>
                        {PREP_OPTIONS.map(p => (
                          <button key={p} onClick={() => accept(o.id, p)} className="text-[11px] font-bold bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 px-2.5 py-1.5 rounded-lg transition-colors">{p}m</button>
                        ))}
                        <button onClick={() => advance(o.id, 'cancelled')} className="ml-auto text-[11px] font-bold text-red-400 hover:bg-red-500/10 border border-red-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1"><X className="w-3 h-3" /> Reject</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setTrackingOrder(o)} className="flex items-center gap-1.5 text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 px-3 py-1.5 rounded-lg transition-colors">
                          <Navigation className="w-3 h-3" /> Track
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-300">{status.replace(/_/g,' ')}</span>
                        <select value={status} onChange={e => advance(o.id, e.target.value)} className="ml-auto bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-bold">
                          {ORDER_STAGES.map(s => <option key={s} value={s} className="bg-stone-900">{s.replace(/_/g,' ')}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
      )}

      {view === 'past' && (
        <div className="glass rounded-2xl divide-y divide-white/5 overflow-hidden">
          <div className="grid grid-cols-[1fr_70px_100px_90px] text-[9px] font-black uppercase tracking-widest text-stone-600 px-5 py-3 bg-black/40">
            <span>Order</span><span className="text-center">Items</span><span className="text-center">Total</span><span className="text-center">Status</span>
          </div>
          {past.map(o => (
            <div key={o.id} className="grid grid-cols-[1fr_70px_100px_90px] items-center px-5 py-3 hover:bg-white/3 transition-colors">
              <div>
                <p className="text-xs font-black text-white">#{o.id.replace('o','').padStart(3,'0')}</p>
                <p className="text-[9px] text-stone-600">{new Date(o.createdAt).toLocaleDateString()}</p>
              </div>
              <p className="text-xs text-stone-500 text-center">{o.items.length}</p>
              <p className="text-sm font-black text-white text-center">{money(o.finalTotal)}</p>
              <p className={`text-[9px] font-black uppercase text-center ${o.orderStatus==='delivered'?'text-green-400':'text-red-400'}`}>{o.orderStatus.replace(/_/g,' ')}</p>
            </div>
          ))}
        </div>
      )}

      {view === 'receipts' && (
        <div className="space-y-3">
          <div className="glass rounded-2xl p-4 mb-4">
            <p className="text-xs font-black text-stone-500 mb-3 uppercase tracking-widest">Commission Summary (All Time)</p>
            {(() => {
              const completed = orders.filter(o => o.orderStatus !== 'cancelled');
              const gross = completed.reduce((s,o) => s+o.finalTotal, 0);
              const fee   = gross * PLATFORM_FEE;
              const net   = gross - fee;
              return (
                <div className="flex gap-6">
                  <div><p className="text-[9px] text-stone-500 font-bold uppercase">Gross</p><p className="text-lg font-black text-white">{money(gross)}</p></div>
                  <div><p className="text-[9px] text-stone-500 font-bold uppercase">MiSlice 20%</p><p className="text-lg font-black text-red-400">−{money(fee)}</p></div>
                  <div><p className="text-[9px] text-stone-500 font-bold uppercase">Your Payout</p><p className="text-lg font-black text-green-400">{money(net)}</p></div>
                </div>
              );
            })()}
          </div>
          {orders.filter(o => o.orderStatus !== 'cancelled').map(o => {
            const fee = o.finalTotal * PLATFORM_FEE;
            return (
              <div key={o.id} className="glass rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">#{o.id.replace('o','').padStart(3,'0')}</p>
                  <p className="text-[10px] text-stone-500">{new Date(o.createdAt).toLocaleString()}</p>
                  <p className="text-[9px] text-stone-600 mt-0.5">MiSlice fee: −{money(fee)}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-green-400">+{money(o.finalTotal - fee)}</p>
                  <p className="text-[9px] text-stone-600">of {money(o.finalTotal)} gross</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Menu & Prices ────────────────────────────────────────────────────────────

function DemoMenu({ menu, setMenu, flash }: { menu: MenuItem[]; setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>; flash: (m:string)=>void }) {
  const [form, setForm]       = useState<any>(null);
  const [priceEdit, setPE]    = useState<{id:string;value:string}|null>(null);
  const [showScan, setShowScan] = useState(false);
  const [scanPhase, setSP]    = useState<'idle'|'camera'|'scanning'|'done'>('idle');
  const [scanPct, setScanPct] = useState(0);
  const [camError, setCamError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);

  const grouped = useMemo(() => {
    const g: Record<string,MenuItem[]> = {};
    for (const it of menu) (g[it.category]??=[]).push(it);
    return g;
  }, [menu]);

  const openCamera = async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      streamRef.current = stream;
      setSP('camera');
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(()=>{}); } }, 50);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setCamError('Camera access denied. Please allow camera permission in your browser settings.');
      else if (err.name === 'NotFoundError') setCamError('No camera found on this device.');
      else setCamError('Could not access camera. Try again.');
    }
  };

  const stopCamera = () => { streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current = null; };
  const closeScan  = () => { stopCamera(); setShowScan(false); setSP('idle'); setScanPct(0); setCamError(''); };

  const startScan = () => {
    stopCamera(); setSP('scanning'); setScanPct(0);
    const iv = setInterval(() => setScanPct(p => { if (p>=100) { clearInterval(iv); setSP('done'); return 100; } return p+3; }), 60);
  };

  const importScanned = () => {
    const newItems: MenuItem[] = SCAN_ITEMS.map(it => ({ id: uid(), name: it.name, description: it.description, price: it.price, category: it.category, available: true }));
    setMenu(m => [...m, ...newItems]);
    flash(`Menu imported — ${SCAN_ITEMS.length} items added!`);
    closeScan();
  };

  const save = () => {
    if (!form.name?.trim() || !form.price) { flash('Name and price are required'); return; }
    if (form.id) { setMenu(m => m.map(it => it.id === form.id ? { ...it, ...form, price: Number(form.price) } : it)); flash('Item updated'); }
    else { setMenu(m => [...m, { id: uid(), name: form.name.trim(), description: form.description||'', price: Number(form.price), category: form.category, available: form.available??true }]); flash('Item added'); }
    setForm(null);
  };

  const savePrice = (id: string) => {
    const val = Number(priceEdit?.value);
    if (!val || val <= 0) { setPE(null); return; }
    setMenu(m => m.map(it => it.id === id ? { ...it, price: val } : it));
    setPE(null); flash('Price updated');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Menu & Prices</h1>
          <p className="text-sm text-stone-500">{menu.length} items · changes are local (demo)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowScan(true); setSP('idle'); }}
            className="inline-flex items-center gap-2 bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-300 text-sm font-bold px-4 py-2.5 rounded-xl transition-all">
            <Camera className="w-4 h-4" /> Import Menu
          </button>
          <button onClick={() => setForm({ name:'', description:'', price:0, category:'Pizza', available:true })}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-black px-4 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {CATEGORIES.filter(c => grouped[c]?.length).map(cat => (
        <div key={cat} className="mb-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-stone-600 mb-2">{cat}</p>
          <div className="space-y-2">
            {grouped[cat].map(it => (
              <div key={it.id} className={`glass rounded-2xl px-4 py-3 flex items-center gap-4 ${!it.available?'opacity-60':''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{it.name}</p>
                  {it.description && <p className="text-[11px] text-stone-500 truncate">{it.description}</p>}
                </div>
                {priceEdit?.id === it.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-stone-500 text-sm">$</span>
                    <input autoFocus type="number" step="0.01" value={priceEdit.value} onChange={e=>setPE({id:it.id,value:e.target.value})} onKeyDown={e=>e.key==='Enter'&&savePrice(it.id)} className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white" />
                    <button onClick={()=>savePrice(it.id)} className="text-green-400 p-1"><Check className="w-4 h-4" /></button>
                    <button onClick={()=>setPE(null)} className="text-stone-500 p-1"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={()=>setPE({id:it.id,value:String(it.price)})} className="text-sm font-black text-white hover:text-orange-300 transition-colors flex items-center gap-1 group">
                    {money(it.price)} <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </button>
                )}
                <button onClick={()=>setMenu(m=>m.map(x=>x.id===it.id?{...x,available:!it.available}:x))}
                  className={`text-[9px] font-black px-2 py-1 rounded-full border ${it.available?'bg-green-500/15 text-green-400 border-green-500/25':'bg-stone-500/15 text-stone-500 border-white/10'}`}>
                  {it.available?'LIVE':'OFF'}
                </button>
                <button onClick={()=>setForm({...it})} className="text-stone-500 hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                <button onClick={()=>{setMenu(m=>m.filter(x=>x.id!==it.id));flash('Item removed');}} className="text-stone-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Scan modal */}
      <AnimatePresence>
        {showScan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closeScan} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="relative w-full max-w-md glass rounded-3xl p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-black text-white">Import Menu via Camera</h3>
                <button onClick={closeScan} className="text-stone-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              {scanPhase === 'idle' && (
                <>
                  <div className="bg-black/60 border border-white/10 rounded-2xl aspect-video flex flex-col items-center justify-center gap-3 mb-5">
                    <Camera className="w-12 h-12 text-stone-600" />
                    <p className="text-xs font-bold text-stone-400 text-center px-4">MiSlice AI will scan your menu and extract all items, categories, and prices automatically.</p>
                    {camError && <p className="text-xs text-red-400 font-bold text-center px-4">{camError}</p>}
                  </div>
                  <button onClick={openCamera} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" /> Allow Camera Access
                  </button>
                </>
              )}
              {scanPhase === 'camera' && (
                <>
                  <div className="relative rounded-2xl overflow-hidden aspect-video mb-5 bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute left-4 right-4 top-4 bottom-4 border-2 border-violet-400/60 rounded-xl" />
                      <div className="absolute bottom-3 left-0 right-0 text-center">
                        <span className="text-[10px] font-black text-violet-300 bg-black/60 px-2 py-0.5 rounded-full">Point camera at your menu</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={startScan} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2">
                    <ScanLine className="w-4 h-4" /> Start Scanning
                  </button>
                </>
              )}
              {scanPhase === 'scanning' && (
                <div className="py-8 text-center space-y-5">
                  <ScanLine className="w-10 h-10 text-violet-400 animate-pulse mx-auto" />
                  <div>
                    <p className="text-sm font-black text-white mb-1">Scanning your menu…</p>
                    <p className="text-xs text-stone-500">{scanPct<40?'Detecting items…':scanPct<70?'Reading prices…':'Organizing categories…'}</p>
                  </div>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all" style={{width:`${scanPct}%`}} />
                  </div>
                  <p className="text-xs font-black text-violet-400">{scanPct}%</p>
                </div>
              )}
              {scanPhase === 'done' && (
                <div className="py-4 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                  <div>
                    <p className="text-sm font-black text-white">Scan Complete!</p>
                    <p className="text-xs text-stone-500 mt-1">Found 4 categories · {SCAN_ITEMS.length} items · all prices detected</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-left text-xs font-bold text-stone-400 space-y-1">
                    {['🍕 Pizza — 2 items','🍗 Sides — 2 items','🥤 Drinks — 2 items','🍰 Desserts — 1 item'].map(l=><div key={l}>{l}</div>)}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={closeScan} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-stone-400 glass-soft hover:text-white">Cancel</button>
                    <button onClick={importScanned} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700">Import All</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit modal */}
      <AnimatePresence>
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setForm(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} className="relative w-full max-w-md glass rounded-3xl p-6">
              <h3 className="text-lg font-black text-white mb-4">{form.id?'Edit Item':'Add Item'}</h3>
              <div className="space-y-3">
                <input placeholder="Item name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
                <input placeholder="Description" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-3">
                    <span className="text-stone-500 text-sm">$</span>
                    <input type="number" step="0.01" value={form.price||''} onChange={e=>setForm({...form,price:e.target.value})} className="w-full bg-transparent px-2 py-3 text-white text-sm outline-none" />
                  </div>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm">
                    {CATEGORIES.map(c=><option key={c} value={c} className="bg-stone-900">{c}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-stone-300 font-bold cursor-pointer">
                  <input type="checkbox" checked={form.available??true} onChange={e=>setForm({...form,available:e.target.checked})} /> Available for ordering
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={()=>setForm(null)} className="flex-1 py-3 rounded-xl text-sm font-bold glass-soft text-stone-300">Cancel</button>
                <button onClick={save} className="flex-1 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Deals ────────────────────────────────────────────────────────────────────

function DemoDeals({ deals, setDeals, flash }: { deals: Deal[]; setDeals: React.Dispatch<React.SetStateAction<Deal[]>>; flash: (m:string)=>void }) {
  const [form, setForm]   = useState<any>(null);
  const [copied, setCopied] = useState<string|null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(()=>{});
    setCopied(code); setTimeout(()=>setCopied(null), 1500);
  };

  const save = () => {
    if (!form.title?.trim()) { flash('Title is required'); return; }
    if (form.id) { setDeals(ds=>ds.map(d=>d.id===form.id?{...d,...form}:d)); flash('Deal updated'); }
    else { setDeals(ds=>[...ds, { id:uid(), title:form.title.trim(), description:form.description||'', original_price:Number(form.original_price)||0, discounted_price:Number(form.discounted_price)||0, is_active:form.is_active??true, coupon_code:form.coupon_code||('MI'+Math.random().toString(36).toUpperCase().slice(2,7)) }]); flash('Deal published'); }
    setForm(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-white">Deals & Promotions</h1>
          <p className="text-sm text-stone-500">Published deals appear on the MiSlice customer Deals page.</p>
        </div>
        <button onClick={()=>setForm({title:'',description:'',original_price:0,discounted_price:0,is_active:true,coupon_code:''})}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-black px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      {/* Templates */}
      <div className="mb-6">
        <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 mb-3">Quick Templates</p>
        <div className="flex flex-wrap gap-2">
          {[{e:'🔟',l:'10% Off'},{e:'💥',l:'20% Off'},{e:'🍕',l:'BOGO Pizza'},{e:'🛵',l:'Free Delivery'},{e:'💵',l:'$5 Off'}].map((t,i) => (
            <button key={t.l} onClick={()=>setForm({...DEAL_TEMPLATES[i]})}
              className="flex items-center gap-1.5 px-3 py-2 glass border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold text-stone-300 hover:text-white transition-all">
              {t.e} {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {deals.map(d => (
          <div key={d.id} className={`glass rounded-2xl px-5 py-4 ${!d.is_active?'opacity-60':''}`}>
            <div className="flex items-start gap-4">
              <Tag className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{d.title}</p>
                <p className="text-[11px] text-stone-500 truncate">{d.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
                    <span className="text-[10px] font-black text-stone-300 font-mono tracking-wider">{d.coupon_code}</span>
                  </div>
                  <button onClick={()=>copyCode(d.coupon_code)} className="text-stone-600 hover:text-white transition-colors">
                    {copied===d.coupon_code ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {!!d.discounted_price && <p className="text-sm font-black text-green-400 shrink-0">{money(d.discounted_price)}{!!d.original_price&&<span className="text-stone-600 line-through ml-1 text-xs">{money(d.original_price)}</span>}</p>}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={()=>setDeals(ds=>ds.map(x=>x.id===d.id?{...x,is_active:!x.is_active}:x))}>
                  {d.is_active?<ToggleRight className="w-6 h-6 text-green-400"/>:<ToggleLeft className="w-6 h-6 text-stone-600"/>}
                </button>
                <button onClick={()=>setForm({...d})} className="text-stone-500 hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                <button onClick={()=>{setDeals(ds=>ds.filter(x=>x.id!==d.id));flash('Deal removed');}} className="text-stone-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setForm(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} className="relative w-full max-w-md glass rounded-3xl p-6">
              <h3 className="text-lg font-black text-white mb-4">{form.id?'Edit Deal':'New Deal'}</h3>
              <div className="space-y-3">
                <input placeholder="Deal title" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
                <textarea placeholder="Description" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-red-500" />
                <input placeholder="Coupon code (auto-generated if blank)" value={form.coupon_code||''} onChange={e=>setForm({...form,coupon_code:e.target.value.toUpperCase()})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-red-500" />
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-3">
                    <span className="text-stone-500 text-xs">Was $</span>
                    <input type="number" step="0.01" value={form.original_price||''} onChange={e=>setForm({...form,original_price:e.target.value})} className="w-full bg-transparent px-2 py-3 text-white text-sm outline-none" />
                  </div>
                  <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-3">
                    <span className="text-stone-500 text-xs">Now $</span>
                    <input type="number" step="0.01" value={form.discounted_price||''} onChange={e=>setForm({...form,discounted_price:e.target.value})} className="w-full bg-transparent px-2 py-3 text-white text-sm outline-none" />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-sm font-bold text-stone-300">Active immediately</span>
                  <button type="button" onClick={()=>setForm({...form,is_active:!form.is_active})}>
                    {form.is_active?<ToggleRight className="w-7 h-7 text-green-400"/>:<ToggleLeft className="w-7 h-7 text-stone-600"/>}
                  </button>
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={()=>setForm(null)} className="flex-1 py-3 rounded-xl text-sm font-bold glass-soft text-stone-300">Cancel</button>
                <button onClick={save} className="flex-1 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-orange-500 to-red-600 text-white">Publish</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

type InsightCat = 'all'|'sales'|'operations'|'suggestions';

function DemoInsights({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<InsightCat>('all');
  const [refreshing, setRefreshing] = useState(false);

  const completed = orders.filter(o => o.orderStatus !== 'cancelled');
  const now = Date.now(); const week = 7*86400000;
  const thisWeek = completed.filter(o => now - new Date(o.createdAt).getTime() < week);
  const lastWeek = completed.filter(o => { const a=now-new Date(o.createdAt).getTime(); return a>=week&&a<week*2; });

  const countItems = (ords: Order[]) => {
    const c: Record<string,number> = {};
    ords.forEach(o => o.items.forEach(it => { c[it.name]=(c[it.name]||0)+it.qty; }));
    return c;
  };
  const tI = countItems(thisWeek); const lI = countItems(lastWeek);

  type IC = { id:string; cat:InsightCat; icon:React.ElementType; color:string; bg:string; title:string; detail:string; };
  const insights: IC[] = [];

  Object.entries(tI).forEach(([name,cnt]) => {
    const prev = lI[name]||0;
    if (prev > 0 && cnt > prev) { const pct=Math.round(((cnt-prev)/prev)*100); if (pct>=20) insights.push({id:`up_${name}`,cat:'sales',icon:TrendingUp,color:'text-green-400',bg:'bg-green-500/10',title:`${name} orders up ${pct}% this week`,detail:`${cnt} orders vs ${prev} last week. Consider featuring it as a deal.`}); }
    if (prev > 0 && cnt < prev) { const pct=Math.round(((prev-cnt)/prev)*100); if (pct>=25) insights.push({id:`dn_${name}`,cat:'sales',icon:TrendingDown,color:'text-red-400',bg:'bg-red-500/10',title:`${name} dropped ${pct}%`,detail:`Only ${cnt} orders vs ${prev}. Try a limited-time discount.`}); }
  });

  const dayRevenue: Record<number,number> = {};
  thisWeek.forEach(o => { const d=new Date(o.createdAt).getDay(); dayRevenue[d]=(dayRevenue[d]||0)+o.finalTotal; });
  const dayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayArr = Object.entries(dayRevenue);
  if (dayArr.length >= 2) {
    const peak = [...dayArr].sort((a,b)=>+b[1]-+a[1])[0];
    const slow  = [...dayArr].sort((a,b)=>+a[1]-+b[1])[0];
    if (+peak[1] > +slow[1]*1.4) {
      const pct=Math.round(((+peak[1]-+slow[1])/+slow[1])*100);
      insights.push({id:'peak',cat:'operations',icon:Clock,color:'text-yellow-400',bg:'bg-yellow-500/10',title:`${dayNames[+peak[0]]} revenue is ${pct}% higher than ${dayNames[+slow[0]]}`,detail:`Run a promotion on ${dayNames[+slow[0]]} to lift your slowest day.`});
    }
  }

  const cancelRate=orders.length?(orders.filter(o=>o.orderStatus==='cancelled').length/orders.length)*100:0;
  if (cancelRate>8) insights.push({id:'cancel',cat:'operations',icon:TrendingDown,color:'text-red-400',bg:'bg-red-500/10',title:`Cancellation rate: ${cancelRate.toFixed(0)}%`,detail:'Review prep time estimates. High cancellations hurt your MiSlice ranking.'});

  const thisRev = thisWeek.reduce((s,o)=>s+o.finalTotal,0);
  const lastRev = lastWeek.reduce((s,o)=>s+o.finalTotal,0);
  if (lastRev>0) {
    const pct=Math.round(((thisRev-lastRev)/lastRev)*100);
    if (pct>0) insights.push({id:'rev_up',cat:'sales',icon:TrendingUp,color:'text-emerald-400',bg:'bg-emerald-500/10',title:`Revenue up ${pct}% week-over-week`,detail:`${money(thisRev)} this week vs ${money(lastRev)} last week. Momentum is strong — keep your deals running.`});
  }

  insights.push(
    {id:'family',cat:'suggestions',icon:Lightbulb,color:'text-violet-400',bg:'bg-violet-500/10',title:'Add a Family Bundle to boost average order value',detail:'Bundles (2 pizzas + drinks + sides) increase AOV by 35–60%. Customers love them on weekends.'},
    {id:'drinks',cat:'suggestions',icon:Lightbulb,color:'text-blue-400',bg:'bg-blue-500/10',title:'Pair beverages with pizza at checkout',detail:'Customers who add a drink spend 28% more. Create a "Pizza + Drink" combo deal.'},
    {id:'photos',cat:'suggestions',icon:Camera,color:'text-orange-400',bg:'bg-orange-500/10',title:'Add food photos to your top 5 items',detail:'Listings with photos get 3× more clicks on MiSlice. Upload high-quality images via the menu editor.'},
  );

  const shown = filter==='all' ? insights : insights.filter(i=>i.cat===filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-400" /> AI Insights</h1>
        <button onClick={()=>{setRefreshing(true);setTimeout(()=>setRefreshing(false),900);}} className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-white px-3 py-2 glass rounded-xl transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing?'animate-spin':''}`} /> Refresh
        </button>
      </div>
      <p className="text-sm text-stone-500 mb-6">Real-time intelligence computed from your order history.</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {(['all','sales','operations','suggestions'] as InsightCat[]).map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filter===f?'bg-red-600 text-white':'glass text-stone-500 hover:text-white'}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map(ins => {
          const Icon=ins.icon;
          return (
            <div key={ins.id} className={`${ins.bg} border border-white/10 rounded-2xl p-4 flex gap-4`}>
              <div className={`w-9 h-9 rounded-xl ${ins.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${ins.color}`} />
              </div>
              <div>
                <p className="text-sm font-black text-white mb-1">{ins.title}</p>
                <p className="text-xs text-stone-400 leading-relaxed">{ins.detail}</p>
              </div>
            </div>
          );
        })}
        {shown.length===0 && <div className="glass-soft rounded-2xl p-10 text-center text-stone-500 text-sm">No insights for this filter yet.</div>}
      </div>
    </div>
  );
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

function DemoEarnings({ orders }: { orders: Order[] }) {
  const [period, setPeriod] = useState<EarningsPeriod>('weekly');

  const filterByPeriod = (ords: Order[]) => {
    const now = new Date();
    return ords.filter(o => {
      const d = new Date(o.createdAt);
      if (period==='daily')   return d.toDateString()===now.toDateString();
      if (period==='weekly')  { const w=new Date(now); w.setDate(now.getDate()-7); return d>=w; }
      if (period==='monthly') return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
      return d.getFullYear()===now.getFullYear();
    }).filter(o=>o.orderStatus!=='cancelled');
  };

  const paid  = filterByPeriod(orders);
  const gross = paid.reduce((s,o)=>s+o.finalTotal,0);
  const fees  = gross*PLATFORM_FEE;
  const net   = gross-fees;
  const aov   = paid.length ? gross/paid.length : 0;

  // 7-day chart
  const days = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-(6-i));
    const label=d.toLocaleDateString(undefined,{weekday:'short'});
    const total=orders.filter(o=>o.orderStatus!=='cancelled'&&o.createdAt&&new Date(o.createdAt).toDateString()===d.toDateString()).reduce((s,o)=>s+o.finalTotal,0);
    return {label,total};
  });
  const maxDay=Math.max(1,...days.map(d=>d.total));

  // Category breakdown by item name heuristic
  const catRevenue: Record<string,number> = {};
  paid.forEach(o => o.items.forEach(it => {
    const n=it.name.toLowerCase();
    const cat=n.includes('pizza')||n.includes('deep dish')||n.includes('pepperoni')||n.includes('bbq chicken')||n.includes('veggie')||n.includes('half')||n.includes('margherita')||n.includes('meat')
      ?'Pizzas'
      :n.includes('wing')||n.includes('garlic')||n.includes('salad')||n.includes('stick')||n.includes('side')
      ?'Sides'
      :n.includes('coke')||n.includes('pepsi')||n.includes('water')||n.includes('lemon')||n.includes('root beer')||n.includes('drink')
      ?'Drinks'
      :n.includes('cake')||n.includes('tiramisu')||n.includes('cannoli')||n.includes('dessert')
      ?'Desserts'
      :'Specials';
    catRevenue[cat]=(catRevenue[cat]||0)+it.itemTotal;
  }));
  const cats=Object.entries(catRevenue).sort((a,b)=>b[1]-a[1]);
  const maxCat=Math.max(1,...cats.map(c=>c[1]));
  const CAT_COLORS: Record<string,string>={Pizzas:'from-red-600 to-red-400',Sides:'from-yellow-600 to-yellow-400',Drinks:'from-blue-600 to-blue-400',Desserts:'from-pink-600 to-pink-400',Specials:'from-violet-600 to-violet-400'};

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Earnings</h1>
          <p className="text-sm text-stone-500">Revenue after {Math.round(PLATFORM_FEE*100)}% MiSlice commission.</p>
        </div>
        <div className="flex gap-1 glass p-1 rounded-xl border border-white/10">
          {(['daily','weekly','monthly','yearly'] as EarningsPeriod[]).map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-black capitalize transition-all ${period===p?'bg-white/15 text-white':'text-stone-500 hover:text-white'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {label:'Gross Sales',                           val:money(gross), color:'text-white'      },
          {label:`Fee (${Math.round(PLATFORM_FEE*100)}%)`,val:`−${money(fees)}`, color:'text-red-400'   },
          {label:'Your Net',                              val:money(net),   color:'text-green-400'  },
          {label:'Avg Order',                             val:money(aov),   color:'text-blue-400'   },
        ].map(k=>(
          <div key={k.label} className="glass rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase text-stone-500 mb-2">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* 7-day chart */}
      <div className="glass rounded-2xl p-5 mb-6">
        <p className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4">Revenue — Last 7 Days</p>
        <div className="flex items-end justify-between gap-2 h-36">
          {days.map((d,i)=>(
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              {d.total>0&&<p className="text-[8px] font-bold text-stone-500">${d.total.toFixed(0)}</p>}
              <div className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t-md transition-all" style={{height:`${(d.total/maxDay)*100}%`,minHeight:d.total>0?4:0}} />
              <span className="text-[9px] text-stone-500 font-bold">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      {cats.length>0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <p className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4">Revenue by Category</p>
          <div className="space-y-3">
            {cats.map(([cat,rev])=>(
              <div key={cat}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-white">{cat}</span>
                  <span className="text-stone-400">{money(rev)} · {gross>0?((rev/gross)*100).toFixed(0):0}%</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${CAT_COLORS[cat]||'from-stone-600 to-stone-400'} rounded-full`} style={{width:`${(rev/maxCat)*100}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <h2 className="text-sm font-black text-white mb-3">Transactions</h2>
      {paid.length===0
        ? <div className="glass-soft rounded-2xl p-6 text-center text-stone-500 text-sm">No transactions for this period.</div>
        : (
          <div className="glass rounded-2xl divide-y divide-white/5">
            {[...paid].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,20).map(o=>(
              <div key={o.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-bold text-white">#{o.id.replace('o','').padStart(3,'0')}</p>
                  <p className="text-[11px] text-stone-500">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-green-400">+{money(o.finalTotal*(1-PLATFORM_FEE))}</p>
                  <p className="text-[9px] text-stone-600">of {money(o.finalTotal)} gross</p>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
