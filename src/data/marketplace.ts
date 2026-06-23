// ─── Central marketplace data layer ──────────────────────────────────────────
// API-ready: every field maps 1:1 to a DB column or joined relation.

export type PriceRange = '$' | '$$' | '$$$';
export type DietaryTag = 'vegan' | 'vegetarian' | 'gluten-free' | 'halal' | 'spicy';
export type StoreCategory = 'chain' | 'local' | 'artisan' | 'vegan' | 'premium';
export type DeliveryPartner = 'store' | 'doordash' | 'ubereats' | 'grubhub' | 'pickup';

export interface StoreHours {
  day: string;
  open: string;
  close: string;
}

export interface MenuCategory {
  id: string;
  label: string;
  emoji: string;
}

export interface MarketplaceMenuItem {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  category: 'pizza' | 'sides' | 'drinks' | 'desserts' | 'specials';
  imageColor: string; // tailwind gradient class
  tags: DietaryTag[];
  isPopular: boolean;
  isNew: boolean;
  calories?: number;
}

export interface StoreDeal {
  id: string;
  storeId: string;
  title: string;
  description: string;
  discountType: 'percent' | 'fixed' | 'bogo' | 'free_delivery';
  discountValue: number;
  code: string;
  expiresAt: string;
  badge: string;
}

export interface StoreReview {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  helpful: number;
}

export interface MarketplaceStore {
  id: string;
  name: string;
  emoji: string;
  logoColor: string; // tailwind bg class
  category: StoreCategory;
  address: string;
  neighborhood: string;
  distance: number; // miles from user
  coordinates: { x: number; y: number }; // map position (%)
  rating: number;
  reviewCount: number;
  priceRange: PriceRange;
  isOpen: boolean;
  openUntil: string;
  phone: string;
  website?: string;
  deliveryTime: number; // minutes
  deliveryFee: number;
  minOrder: number;
  deliveryPartners: DeliveryPartner[];
  tags: DietaryTag[];
  badges: string[]; // ['New', 'Top Rated', 'Fast Delivery', '#1 in Detroit']
  isFeatured: boolean;
  isNew: boolean;
  promotedDeal?: string; // short deal teaser
  popularItems: string[];
  menu: MarketplaceMenuItem[];
  deals: StoreDeal[];
  reviews: StoreReview[];
  trendScore: number; // 0-100 for "Most Ordered Tonight"
  hours: StoreHours[];
}

// ── Reviews ──────────────────────────────────────────────────────────────────

const REVIEWS: Record<string, StoreReview[]> = {
  dominos: [
    { id: 'r1', user: 'Jake M.', avatar: 'J', rating: 4, text: 'Always consistent. The tracker is great.', date: '2 days ago', helpful: 12 },
    { id: 'r2', user: 'Priya K.', avatar: 'P', rating: 5, text: 'Cheapest in my area hands down. Fast too.', date: '1 week ago', helpful: 8 },
    { id: 'r3', user: 'Tom B.', avatar: 'T', rating: 3, text: 'Good value but sauce is a bit sweet.', date: '2 weeks ago', helpful: 3 },
  ],
  pizzaHut: [
    { id: 'r4', user: 'Sara L.', avatar: 'S', rating: 4, text: 'Stuffed crust is legendary. Cheesy garlic bread too.', date: '3 days ago', helpful: 15 },
    { id: 'r5', user: 'Mike D.', avatar: 'M', rating: 3, text: 'Delivery was late but pizza was hot.', date: '1 week ago', helpful: 5 },
  ],
  marios: [
    { id: 'r6', user: 'Anna V.', avatar: 'A', rating: 5, text: 'Best local pizza in Detroit. Family owned and amazing!', date: '1 day ago', helpful: 28 },
    { id: 'r7', user: 'Chris F.', avatar: 'C', rating: 5, text: 'Margherita is something else. Fresh basil every time.', date: '4 days ago', helpful: 19 },
    { id: 'r8', user: 'Nina P.', avatar: 'N', rating: 4, text: 'Queue can be long on weekends but worth it.', date: '1 week ago', helpful: 11 },
  ],
  localSlice: [
    { id: 'r9', user: 'Derek W.', avatar: 'D', rating: 5, text: 'Fastest delivery I\'ve ever seen. 14 mins flat.', date: '5 hours ago', helpful: 34 },
    { id: 'r10', user: 'Jasmine T.', avatar: 'J', rating: 5, text: 'Cheap and cheerful. Student discount is real!', date: '2 days ago', helpful: 22 },
  ],
  shamz: [
    { id: 'r11', user: 'Omar A.', avatar: 'O', rating: 5, text: 'SHAMZ is the real deal. Toppings are generous.', date: '6 hours ago', helpful: 41 },
    { id: 'r12', user: 'Leila H.', avatar: 'L', rating: 5, text: 'Halal certified and absolutely delicious!', date: '1 day ago', helpful: 29 },
    { id: 'r13', user: 'Tariq B.', avatar: 'T', rating: 4, text: 'Great flavors. The BBQ chicken is incredible.', date: '3 days ago', helpful: 17 },
  ],
  greenPie: [
    { id: 'r14', user: 'Zoe G.', avatar: 'Z', rating: 5, text: 'Best vegan pizza in the city. No compromise on taste!', date: '2 days ago', helpful: 31 },
    { id: 'r15', user: 'Eli R.', avatar: 'E', rating: 4, text: 'The cashew cheese is surprisingly good.', date: '5 days ago', helpful: 14 },
  ],
  brooklyn: [
    { id: 'r16', user: 'Mia C.', avatar: 'M', rating: 5, text: 'Authentic NY slice. The dough is perfect.', date: '1 day ago', helpful: 26 },
    { id: 'r17', user: 'Ryan K.', avatar: 'R', rating: 4, text: 'Pricier but worth every penny for quality.', date: '3 days ago', helpful: 13 },
  ],
};

// ── Menu builder helper ────────────────────────────────────────────────────────

function pizza(storeId: string, id: string, name: string, desc: string, price: number, color: string, popular = false, tags: DietaryTag[] = []): MarketplaceMenuItem {
  return { id, storeId, name, description: desc, price, category: 'pizza', imageColor: color, tags, isPopular: popular, isNew: false };
}
function side(storeId: string, id: string, name: string, desc: string, price: number): MarketplaceMenuItem {
  return { id, storeId, name, description: desc, price, category: 'sides', imageColor: 'from-red-600 to-red-500', tags: [], isPopular: false, isNew: false };
}
function drink(storeId: string, id: string, name: string, price: number): MarketplaceMenuItem {
  return { id, storeId, name, description: 'Chilled & refreshing', price, category: 'drinks', imageColor: 'from-blue-500 to-cyan-400', tags: [], isPopular: false, isNew: false };
}

// ── Store catalogue ───────────────────────────────────────────────────────────

export const MARKETPLACE_STORES: MarketplaceStore[] = [
  {
    id: 'dominos',
    name: "Domino's Pizza",
    emoji: '🍕',
    logoColor: 'bg-blue-700',
    category: 'chain',
    address: '123 Main Street',
    neighborhood: 'Downtown',
    distance: 1.2,
    coordinates: { x: 22, y: 28 },
    rating: 4.2,
    reviewCount: 1847,
    priceRange: '$',
    isOpen: true,
    openUntil: '12:00 AM',
    phone: '+1-313-555-0101',
    website: 'https://dominos.com',
    deliveryTime: 28,
    deliveryFee: 2.99,
    minOrder: 10,
    deliveryPartners: ['store', 'doordash', 'ubereats', 'pickup'],
    tags: [],
    badges: ['Free Tracker', '$'],
    isFeatured: false,
    isNew: false,
    promotedDeal: '2 Mediums for $6.99 each',
    popularItems: ['Classic Pepperoni', 'ExtravaganZZa', 'Pacific Veggie'],
    trendScore: 82,
    hours: [{ day: 'Mon-Sun', open: '10:00', close: '24:00' }],
    deals: [
      { id: 'd1', storeId: 'dominos', title: '2 Mediums for $6.99 each', description: 'Pick any 2 medium 2-topping pizzas.', discountType: 'fixed', discountValue: 5, code: 'DOM2MED', expiresAt: '2026-12-31', badge: '🔥 Hot Deal' },
      { id: 'd2', storeId: 'dominos', title: 'Free Delivery over $20', description: 'No delivery fee on orders over $20.', discountType: 'free_delivery', discountValue: 0, code: 'DOMFREE', expiresAt: '2026-12-31', badge: '🚗 Free Delivery' },
    ],
    reviews: REVIEWS.dominos,
    menu: [
      pizza('dominos', 'dom-pep', 'Classic Pepperoni', 'Double pepperoni on robust tomato sauce.', 13.99, 'from-red-600 to-red-500', true),
      pizza('dominos', 'dom-ext', 'ExtravaganZZa', '8 toppings, mozzarella, robust sauce.', 17.99, 'from-red-600 to-red-500', true),
      pizza('dominos', 'dom-veg', 'Pacific Veggie', 'Spinach, tomatoes, mushrooms, onions, peppers.', 14.99, 'from-green-600 to-emerald-500', false, ['vegetarian']),
      pizza('dominos', 'dom-bbq', 'Memphis BBQ Chicken', 'Grilled chicken, BBQ sauce, red onion.', 15.99, 'from-red-700 to-red-600'),
      pizza('dominos', 'dom-marg', 'Margherita', 'Fresh tomato sauce, mozzarella, basil.', 11.99, 'from-red-500 to-pink-500', false, ['vegetarian']),
      side('dominos', 'dom-bread', 'Stuffed Cheesy Bread', 'Mozzarella and cheddar in soft bread.', 6.99),
      side('dominos', 'dom-wings', 'Boneless Wings (8pc)', 'Choice of sauce. Crispy & tender.', 8.99),
      drink('dominos', 'dom-coke', 'Coca-Cola 2L', 2.99),
    ],
  },
  {
    id: 'pizza-hut',
    name: 'Pizza Hut',
    emoji: '🏠',
    logoColor: 'bg-red-600',
    category: 'chain',
    address: '456 Elm Street',
    neighborhood: 'Midtown',
    distance: 1.8,
    coordinates: { x: 65, y: 20 },
    rating: 3.9,
    reviewCount: 2340,
    priceRange: '$$',
    isOpen: true,
    openUntil: '11:00 PM',
    phone: '+1-313-555-0202',
    website: 'https://pizzahut.com',
    deliveryTime: 35,
    deliveryFee: 2.49,
    minOrder: 12,
    deliveryPartners: ['store', 'doordash', 'pickup'],
    tags: [],
    badges: ['Stuffed Crust'],
    isFeatured: false,
    isNew: false,
    promotedDeal: 'Large 1-topping $10.99',
    popularItems: ['Stuffed Crust Pepperoni', 'Supreme', 'Cheese Lovers'],
    trendScore: 65,
    hours: [{ day: 'Mon-Sun', open: '11:00', close: '23:00' }],
    deals: [
      { id: 'd3', storeId: 'pizza-hut', title: 'Large 1-Topping $10.99', description: 'Any large 1-topping delivery pizza.', discountType: 'fixed', discountValue: 4, code: 'PHUTLG', expiresAt: '2026-12-31', badge: '💰 Save $4' },
    ],
    reviews: REVIEWS.pizzaHut,
    menu: [
      pizza('pizza-hut', 'ph-stuf', 'Stuffed Crust Pepperoni', 'Pepperoni with mozzarella-stuffed crust.', 16.99, 'from-red-600 to-rose-500', true),
      pizza('pizza-hut', 'ph-sup', 'Supreme', 'Pepperoni, sausage, peppers, onions, olives.', 17.49, 'from-red-600 to-red-500', true),
      pizza('pizza-hut', 'ph-cheese', 'Cheese Lovers', 'Mozzarella, provolone, white cheddar, romano.', 15.99, 'from-red-400 to-red-500', false, ['vegetarian']),
      pizza('pizza-hut', 'ph-veg', 'Veggie Lovers', 'Fresh vegetables on garlic sauce.', 14.99, 'from-green-500 to-teal-500', false, ['vegetarian']),
      side('pizza-hut', 'ph-bread', 'Original Breadsticks (6pc)', 'Topped with garlic butter & seasoning.', 5.99),
      drink('pizza-hut', 'ph-pepsi', 'Pepsi 2L', 2.99),
    ],
  },
  {
    id: 'papa-johns',
    name: "Papa John's",
    emoji: '🎯',
    logoColor: 'bg-green-700',
    category: 'chain',
    address: '789 Oak Avenue',
    neighborhood: 'Corktown',
    distance: 2.1,
    coordinates: { x: 45, y: 55 },
    rating: 4.1,
    reviewCount: 1560,
    priceRange: '$$',
    isOpen: true,
    openUntil: '11:30 PM',
    phone: '+1-313-555-0303',
    website: 'https://papajohns.com',
    deliveryTime: 32,
    deliveryFee: 1.99,
    minOrder: 10,
    deliveryPartners: ['store', 'ubereats', 'pickup'],
    tags: [],
    badges: ['Better Ingredients'],
    isFeatured: false,
    isNew: false,
    promotedDeal: '25% off online orders',
    popularItems: ['Pepperoni', 'The Works', 'Garden Fresh'],
    trendScore: 58,
    hours: [{ day: 'Mon-Sun', open: '10:30', close: '23:30' }],
    deals: [
      { id: 'd4', storeId: 'papa-johns', title: '25% Off Online Orders', description: 'Use code at checkout.', discountType: 'percent', discountValue: 25, code: 'PAPA25', expiresAt: '2026-12-31', badge: '🎉 25% Off' },
    ],
    reviews: [],
    menu: [
      pizza('papa-johns', 'pj-pep', 'Classic Pepperoni', 'Original sauce, mozzarella, pepperoni.', 14.99, 'from-green-600 to-emerald-500', true),
      pizza('papa-johns', 'pj-works', 'The Works', '6 toppings, sausage, pepperoni, mushrooms.', 17.99, 'from-emerald-600 to-green-400', true),
      pizza('papa-johns', 'pj-garden', 'Garden Fresh', 'Fresh veggies, light tomato sauce.', 14.49, 'from-green-500 to-lime-400', false, ['vegetarian']),
      side('papa-johns', 'pj-chzstx', 'Cheesesticks', 'Mozzarella-loaded breadsticks.', 7.99),
      drink('papa-johns', 'pj-coke', 'Coca-Cola', 1.99),
    ],
  },
  {
    id: 'marios',
    name: "Mario's Pizzeria",
    emoji: '🇮🇹',
    logoColor: 'bg-red-700',
    category: 'local',
    address: '17 Vernor Hwy',
    neighborhood: 'Mexicantown',
    distance: 0.8,
    coordinates: { x: 78, y: 65 },
    rating: 4.8,
    reviewCount: 892,
    priceRange: '$$',
    isOpen: true,
    openUntil: '10:00 PM',
    phone: '+1-313-555-0404',
    website: undefined,
    deliveryTime: 22,
    deliveryFee: 0,
    minOrder: 15,
    deliveryPartners: ['store', 'pickup'],
    tags: ['vegetarian'],
    badges: ['⭐ Top Rated', 'Free Delivery', 'Local Fav'],
    isFeatured: true,
    isNew: false,
    promotedDeal: 'Free delivery all orders',
    popularItems: ['Margherita Classica', 'Quattro Formaggi', 'Diavola'],
    trendScore: 94,
    hours: [{ day: 'Mon-Sat', open: '11:00', close: '22:00' }, { day: 'Sun', open: '12:00', close: '21:00' }],
    deals: [
      { id: 'd5', storeId: 'marios', title: 'Tuesday Family Night', description: 'Buy 2 large pizzas, get free garlic bread.', discountType: 'bogo', discountValue: 0, code: 'MARIO2', expiresAt: '2026-12-31', badge: '👨‍👩‍👧 Family' },
    ],
    reviews: REVIEWS.marios,
    menu: [
      pizza('marios', 'mar-marg', 'Margherita Classica', 'San Marzano tomato, buffalo mozzarella, fresh basil.', 14.99, 'from-red-500 to-pink-400', true, ['vegetarian']),
      pizza('marios', 'mar-4frm', 'Quattro Formaggi', 'Mozzarella, gorgonzola, parmigiano, ricotta.', 16.99, 'from-red-400 to-red-300', true, ['vegetarian']),
      pizza('marios', 'mar-diav', 'Diavola', 'Spicy salami, Calabrian chili, tomato, mozzarella.', 16.49, 'from-red-700 to-red-600'),
      pizza('marios', 'mar-prsc', 'Prosciutto & Rucola', 'Thin crust, prosciutto di Parma, rocket, parmigiano.', 18.99, 'from-green-600 to-emerald-400'),
      pizza('marios', 'mar-ndc', 'Nduja Special', 'Spicy pork, fire-roasted peppers, mozzarella.', 17.49, 'from-red-700 to-red-600'),
      side('marios', 'mar-bread', 'Garlic Focaccia', 'House-baked with rosemary & sea salt.', 5.99),
      side('marios', 'mar-salad', 'Insalata Mista', 'Mixed greens, olives, cherry tomatoes, EVOO.', 7.99),
      drink('marios', 'mar-soda', 'San Pellegrino 500ml', 3.49),
    ],
  },
  {
    id: 'local-slice',
    name: 'Local Slice Co.',
    emoji: '⚡',
    logoColor: 'bg-yellow-600',
    category: 'local',
    address: '33 Michigan Ave',
    neighborhood: 'Corktown',
    distance: 0.5,
    coordinates: { x: 30, y: 72 },
    rating: 4.7,
    reviewCount: 543,
    priceRange: '$',
    isOpen: true,
    openUntil: '11:00 PM',
    phone: '+1-313-555-0505',
    website: undefined,
    deliveryTime: 14,
    deliveryFee: 1.49,
    minOrder: 8,
    deliveryPartners: ['store', 'doordash', 'pickup'],
    tags: [],
    badges: ['⚡ Fastest Delivery', '$', '🏆 Most Ordered'],
    isFeatured: true,
    isNew: false,
    promotedDeal: 'Slice + Drink $5.99',
    popularItems: ['NY Cheese Slice', 'Pepperoni Slice', 'Buffalo Chicken'],
    trendScore: 98,
    hours: [{ day: 'Mon-Sun', open: '10:00', close: '23:00' }],
    deals: [
      { id: 'd6', storeId: 'local-slice', title: 'Slice + Drink $5.99', description: 'Any slice plus any 375ml can.', discountType: 'fixed', discountValue: 2, code: 'SLICE5', expiresAt: '2026-12-31', badge: '⚡ Flash Deal' },
      { id: 'd7', storeId: 'local-slice', title: 'Student 15% Off', description: 'Show valid student ID at pickup.', discountType: 'percent', discountValue: 15, code: 'STUDENT15', expiresAt: '2026-12-31', badge: '🎓 Student' },
    ],
    reviews: REVIEWS.localSlice,
    menu: [
      pizza('local-slice', 'ls-nyc', 'NY Cheese Slice', 'Classic NY thin crust, tomato sauce, mozzarella.', 4.99, 'from-red-400 to-red-500', true, ['vegetarian']),
      pizza('local-slice', 'ls-pep', 'Pepperoni Slice', 'NY thin with generous pepperoni.', 5.99, 'from-red-600 to-red-500', true),
      pizza('local-slice', 'ls-buff', 'Buffalo Chicken Slice', 'Buffalo sauce, grilled chicken, blue cheese.', 6.99, 'from-red-600 to-red-500'),
      pizza('local-slice', 'ls-whole', 'Whole NY Cheese', 'Full 18" New York style.', 16.99, 'from-red-500 to-red-600'),
      pizza('local-slice', 'ls-bbq', 'BBQ Pulled Pork Slice', 'Slow-cooked pork, BBQ drizzle, slaw.', 7.49, 'from-red-700 to-red-600'),
      side('local-slice', 'ls-knots', 'Garlic Knots (6pc)', 'Baked with garlic butter, parsley.', 3.99),
      drink('local-slice', 'ls-can', 'Canned Soda', 1.49),
    ],
  },
  {
    id: 'shamz',
    name: 'Shamz Pizza',
    emoji: '🌟',
    logoColor: 'bg-red-800',
    category: 'local',
    address: '123 Shamz Lane',
    neighborhood: 'New Center',
    distance: 1.5,
    coordinates: { x: 55, y: 38 },
    rating: 4.9,
    reviewCount: 1203,
    priceRange: '$$',
    isOpen: true,
    openUntil: '11:00 PM',
    phone: '+1-313-555-0606',
    website: 'https://shamzpizza.com',
    deliveryTime: 25,
    deliveryFee: 0,
    minOrder: 20,
    deliveryPartners: ['store', 'doordash', 'pickup'],
    tags: ['halal'],
    badges: ['🌟 #1 in Detroit', '🥩 Halal', 'Free Delivery'],
    isFeatured: true,
    isNew: false,
    promotedDeal: '20% off first order',
    popularItems: ['Shamz Meat Feast', 'Pepperoni Supreme', 'BBQ Chicken Ranch'],
    trendScore: 100,
    hours: [{ day: 'Mon-Sun', open: '11:00', close: '23:00' }],
    deals: [
      { id: 'd8', storeId: 'shamz', title: '20% Off First Order', description: 'New customers only. Welcome deal!', discountType: 'percent', discountValue: 20, code: 'WELCOME20', expiresAt: '2026-12-31', badge: '🎉 Welcome' },
      { id: 'd9', storeId: 'shamz', title: 'Tuesday 2-for-1', description: 'Any 2 large pizzas every Tuesday.', discountType: 'bogo', discountValue: 0, code: 'SHAMZ2', expiresAt: '2026-12-31', badge: '🔥 Tuesdays' },
      { id: 'd10', storeId: 'shamz', title: 'Free Delivery $40+', description: 'Spend $40+, delivery is on us.', discountType: 'free_delivery', discountValue: 0, code: 'SFREE40', expiresAt: '2026-12-31', badge: '🚗 Free' },
    ],
    reviews: REVIEWS.shamz,
    menu: [
      pizza('shamz', 'sh-mf', 'Shamz Meat Feast', 'Pepperoni, halal beef, lamb, chicken, mozzarella.', 18.99, 'from-red-700 to-red-600', true),
      pizza('shamz', 'sh-pep', 'Pepperoni Supreme', 'Double pepperoni, smoked mozzarella, bold tomato.', 16.99, 'from-red-600 to-red-400', true),
      pizza('shamz', 'sh-bbq', 'BBQ Chicken Ranch', 'Grilled chicken, BBQ + ranch drizzle, jalapeño.', 17.49, 'from-red-600 to-red-500'),
      pizza('shamz', 'sh-marg', 'Classic Margherita', 'San Marzano tomato, fresh mozzarella, basil.', 13.99, 'from-red-500 to-pink-400', false, ['vegetarian']),
      pizza('shamz', 'sh-truf', 'Truffle Mushroom', 'Wild mushroom, truffle oil, parmigiano, rocket.', 19.99, 'from-stone-600 to-red-700'),
      pizza('shamz', 'sh-veg', 'Veggie Garden', 'Capsicum, olives, sun-dried tomato, feta.', 15.49, 'from-green-600 to-emerald-400', false, ['vegetarian']),
      side('shamz', 'sh-gb', 'Garlic Bread', 'Toasted Italian bread with garlic butter.', 5.49),
      side('shamz', 'sh-fries', 'Loaded Fries', 'Cheese sauce, bacon bits, sour cream.', 7.99),
      drink('shamz', 'sh-cola', 'Coca-Cola 375ml', 2.99),
      drink('shamz', 'sh-water', 'San Pellegrino 500ml', 3.99),
    ],
  },
  {
    id: 'green-pie',
    name: 'Green Garden Pizza',
    emoji: '🌱',
    logoColor: 'bg-emerald-700',
    category: 'vegan',
    address: '901 Woodward Ave',
    neighborhood: 'New Center',
    distance: 2.3,
    coordinates: { x: 18, y: 48 },
    rating: 4.6,
    reviewCount: 421,
    priceRange: '$$',
    isOpen: true,
    openUntil: '9:30 PM',
    phone: '+1-313-555-0707',
    website: 'https://greengardendetroit.com',
    deliveryTime: 30,
    deliveryFee: 2.49,
    minOrder: 15,
    deliveryPartners: ['store', 'ubereats', 'pickup'],
    tags: ['vegan', 'vegetarian', 'gluten-free'],
    badges: ['🌱 100% Vegan', 'GF Options'],
    isFeatured: false,
    isNew: true,
    promotedDeal: 'Plant-based, full flavor',
    popularItems: ['Vegan Margherita', 'BBQ Jackfruit', 'Mediterranean Roast'],
    trendScore: 72,
    hours: [{ day: 'Tue-Sun', open: '11:30', close: '21:30' }],
    deals: [
      { id: 'd11', storeId: 'green-pie', title: 'Meatless Monday 20% Off', description: 'Every Monday, plant-based menu 20% off.', discountType: 'percent', discountValue: 20, code: 'MEATLESS', expiresAt: '2026-12-31', badge: '🌿 Monday' },
    ],
    reviews: REVIEWS.greenPie,
    menu: [
      pizza('green-pie', 'gp-marg', 'Vegan Margherita', 'Cashew mozzarella, tomato, fresh basil, EVOO.', 14.99, 'from-green-600 to-emerald-400', true, ['vegan', 'vegetarian']),
      pizza('green-pie', 'gp-bbqj', 'BBQ Jackfruit', 'Pulled jackfruit, BBQ sauce, red onion, peppers.', 15.99, 'from-red-600 to-red-500', true, ['vegan', 'vegetarian']),
      pizza('green-pie', 'gp-med', 'Mediterranean Roast', 'Roasted veg, hummus base, olives, spinach.', 15.49, 'from-teal-600 to-green-400', false, ['vegan', 'vegetarian', 'gluten-free']),
      pizza('green-pie', 'gp-truffle', 'Vegan Truffle', 'Mushroom, truffle oil, cashew parm, rocket.', 17.99, 'from-stone-500 to-red-600', false, ['vegan', 'vegetarian']),
      side('green-pie', 'gp-knots', 'Garlic Knots (V)', 'Vegan butter & fresh herbs.', 4.99),
      side('green-pie', 'gp-salad', 'Greek Salad', 'Tomato, cucumber, kalamata, vegan feta.', 8.99),
      drink('green-pie', 'gp-juice', 'Cold Pressed Juice', 5.99),
    ],
  },
  {
    id: 'brooklyn',
    name: 'Brooklyn Pie Co.',
    emoji: '🗽',
    logoColor: 'bg-slate-700',
    category: 'artisan',
    address: '520 Gratiot Ave',
    neighborhood: 'Eastern Market',
    distance: 3.1,
    coordinates: { x: 82, y: 42 },
    rating: 4.8,
    reviewCount: 764,
    priceRange: '$$$',
    isOpen: true,
    openUntil: '10:30 PM',
    phone: '+1-313-555-0808',
    website: 'https://brooklynpiedetroit.com',
    deliveryTime: 38,
    deliveryFee: 3.99,
    minOrder: 25,
    deliveryPartners: ['store', 'doordash', 'pickup'],
    tags: [],
    badges: ['⭐ Artisan', 'Wood-Fired', 'Press Pick'],
    isFeatured: false,
    isNew: false,
    promotedDeal: 'Wood-fired in 90 seconds',
    popularItems: ['NY Cheese', 'Prosciutto & Truffle', 'Clam Pie'],
    trendScore: 78,
    hours: [{ day: 'Wed-Mon', open: '12:00', close: '22:30' }],
    deals: [
      { id: 'd12', storeId: 'brooklyn', title: 'Happy Hour Slices $3', description: 'Wed-Fri 2–5pm, slices from $3.', discountType: 'fixed', discountValue: 3, code: 'HAPPY3', expiresAt: '2026-12-31', badge: '🍺 Happy Hour' },
    ],
    reviews: REVIEWS.brooklyn,
    menu: [
      pizza('brooklyn', 'bk-nyc', 'NY Cheese', '18" hand-tossed, low-moisture mozz, tomato.', 18.99, 'from-slate-500 to-gray-400', true, ['vegetarian']),
      pizza('brooklyn', 'bk-prsc', 'Prosciutto & Truffle', 'Di Parma prosciutto, truffle oil, rocket, parm.', 24.99, 'from-red-700 to-stone-500', true),
      pizza('brooklyn', 'bk-clam', 'White Clam Pie', 'Clams, garlic, olive oil, pecorino. No sauce.', 22.99, 'from-sky-600 to-blue-500'),
      pizza('brooklyn', 'bk-marg', 'Neapolitan Margherita', '00 flour, DOP tomatoes, bufala mozzarella.', 19.99, 'from-red-500 to-rose-400', false, ['vegetarian']),
      side('brooklyn', 'bk-an', 'Arancini (4pc)', 'Saffron risotto balls, sugo.', 11.99),
      drink('brooklyn', 'bk-wine', 'House Red Wine (glass)', 9.99),
    ],
  },
  {
    id: 'fire-dough',
    name: 'Fire & Dough',
    emoji: '🔥',
    logoColor: 'bg-red-700',
    category: 'artisan',
    address: '228 Piquette Ave',
    neighborhood: 'Milwaukee Junction',
    distance: 2.7,
    coordinates: { x: 38, y: 18 },
    rating: 4.5,
    reviewCount: 328,
    priceRange: '$$',
    isOpen: true,
    openUntil: '10:00 PM',
    phone: '+1-313-555-0909',
    website: undefined,
    deliveryTime: 35,
    deliveryFee: 2.99,
    minOrder: 20,
    deliveryPartners: ['store', 'ubereats', 'pickup'],
    tags: [],
    badges: ['🔥 Wood Fired', 'New'],
    isFeatured: false,
    isNew: true,
    promotedDeal: 'BOGO on Thursdays',
    popularItems: ['Smoky Chorizo', 'Nduja Honey', 'Seasonal Special'],
    trendScore: 68,
    hours: [{ day: 'Tue-Sun', open: '12:00', close: '22:00' }],
    deals: [
      { id: 'd13', storeId: 'fire-dough', title: 'Thursday BOGO', description: 'Buy 1 pizza, get 1 half price on Thursdays.', discountType: 'bogo', discountValue: 50, code: 'THURS50', expiresAt: '2026-12-31', badge: '🔥 Thursday' },
    ],
    reviews: [],
    menu: [
      pizza('fire-dough', 'fd-chor', 'Smoky Chorizo', 'Spanish chorizo, roasted peppers, piquillo, romesco.', 17.99, 'from-red-600 to-red-500', true),
      pizza('fire-dough', 'fd-nduj', 'Nduja & Honey', 'Spicy Calabrian pork spread, ricotta, wild honey.', 18.49, 'from-red-500 to-red-600', true),
      pizza('fire-dough', 'fd-marg', 'Wood-Fired Margherita', 'Classic Neapolitan, leopard charring.', 15.99, 'from-stone-500 to-red-500', false, ['vegetarian']),
      side('fire-dough', 'fd-burrata', 'Burrata & Heirloom Tomatoes', 'Stracciatella, basil oil, fleur de sel.', 13.99),
      drink('fire-dough', 'fd-water', 'San Pellegrino', 3.99),
    ],
  },
  {
    id: 'pizza-king',
    name: 'Pizza King',
    emoji: '👑',
    logoColor: 'bg-purple-700',
    category: 'local',
    address: '44 Livernois Ave',
    neighborhood: 'University District',
    distance: 3.5,
    coordinates: { x: 72, y: 80 },
    rating: 3.7,
    reviewCount: 612,
    priceRange: '$',
    isOpen: true,
    openUntil: '1:00 AM',
    phone: '+1-313-555-1010',
    website: undefined,
    deliveryTime: 20,
    deliveryFee: 0.99,
    minOrder: 8,
    deliveryPartners: ['store', 'doordash', 'ubereats', 'pickup'],
    tags: [],
    badges: ['💰 Cheapest', 'Late Night', '$'],
    isFeatured: false,
    isNew: false,
    promotedDeal: 'Late night special after 11pm',
    popularItems: ['King Pepperoni', 'BBQ Beef', 'Value Combo'],
    trendScore: 45,
    hours: [{ day: 'Mon-Sun', open: '10:00', close: '01:00' }],
    deals: [
      { id: 'd14', storeId: 'pizza-king', title: 'Late Night: 2 Larges $19.99', description: 'After 11pm, 2 large 1-topping pizzas.', discountType: 'fixed', discountValue: 8, code: 'NIGHT2', expiresAt: '2026-12-31', badge: '🌙 Late Night' },
    ],
    reviews: [],
    menu: [
      pizza('pizza-king', 'pk-pep', 'King Pepperoni', 'Massive pepperoni load, their signature.', 10.99, 'from-purple-600 to-violet-500', true),
      pizza('pizza-king', 'pk-bbq', 'BBQ Beef King', 'Ground beef, BBQ sauce, jalapeños, cheese.', 12.99, 'from-red-700 to-red-600'),
      pizza('pizza-king', 'pk-val', 'Value Combo', 'Cheese + pepperoni, thin crust, 12".', 8.99, 'from-purple-500 to-pink-400'),
      side('pizza-king', 'pk-wings', 'Wings (10pc)', 'Choice of BBQ or hot sauce.', 9.99),
      drink('pizza-king', 'pk-coke', 'Soda (any)', 1.99),
    ],
  },
  {
    id: 'little-italy',
    name: 'Little Italy Ristorante',
    emoji: '🌹',
    logoColor: 'bg-rose-700',
    category: 'premium',
    address: '88 Gratiot Ave',
    neighborhood: 'Eastern Market',
    distance: 2.9,
    coordinates: { x: 48, y: 82 },
    rating: 4.9,
    reviewCount: 487,
    priceRange: '$$$',
    isOpen: false,
    openUntil: 'Opens at 5:00 PM',
    phone: '+1-313-555-1111',
    website: 'https://littleitalydetroit.com',
    deliveryTime: 45,
    deliveryFee: 4.99,
    minOrder: 40,
    deliveryPartners: ['doordash', 'pickup'],
    tags: ['vegetarian'],
    badges: ['🌹 Fine Dining', '⭐ 4.9 Stars', 'Reservation'],
    isFeatured: false,
    isNew: false,
    promotedDeal: 'Chef\'s tasting menu',
    popularItems: ['Tartufo Bianco', 'Caprese Pizza', 'Lobster Bianca'],
    trendScore: 60,
    hours: [{ day: 'Tue-Sun', open: '17:00', close: '22:30' }],
    deals: [],
    reviews: [],
    menu: [
      pizza('little-italy', 'li-truf', 'Tartufo Bianco', 'White truffle, burrata, 24-month prosciutto, rocket.', 28.99, 'from-red-600 to-red-400', true),
      pizza('little-italy', 'li-cap', 'Caprese', 'Heirloom tomatoes, bufala, aged balsamic.', 22.99, 'from-red-400 to-rose-300', false, ['vegetarian']),
      pizza('little-italy', 'li-lob', 'Lobster Bianca', 'Poached lobster, mascarpone, chives, lemon zest.', 34.99, 'from-sky-500 to-blue-400'),
      side('little-italy', 'li-ant', 'Antipasto Board', 'Seasonal Italian cured meats & artisan cheeses.', 24.99),
      drink('little-italy', 'li-wine', 'Barolo DOCG (glass)', 16.99),
    ],
  },
  {
    id: 'speedpie',
    name: 'SpeedPie Express',
    emoji: '🏎️',
    logoColor: 'bg-cyan-700',
    category: 'local',
    address: '71 Grand River Ave',
    neighborhood: 'Grandmont',
    distance: 1.9,
    coordinates: { x: 88, y: 30 },
    rating: 4.0,
    reviewCount: 289,
    priceRange: '$',
    isOpen: true,
    openUntil: '11:00 PM',
    phone: '+1-313-555-1212',
    website: undefined,
    deliveryTime: 15,
    deliveryFee: 1.99,
    minOrder: 10,
    deliveryPartners: ['store', 'doordash', 'pickup'],
    tags: [],
    badges: ['⚡ Under 20 Min', 'GPS Tracked'],
    isFeatured: false,
    isNew: false,
    promotedDeal: 'Guaranteed 20 min or free',
    popularItems: ['Speed Pepperoni', 'Speed Cheese', 'Speed Veggie'],
    trendScore: 71,
    hours: [{ day: 'Mon-Sun', open: '11:00', close: '23:00' }],
    deals: [
      { id: 'd15', storeId: 'speedpie', title: 'Guaranteed Under 20 Min', description: 'Late? Your next order is free.', discountType: 'free_delivery', discountValue: 0, code: 'SPEED20', expiresAt: '2026-12-31', badge: '⚡ Guarantee' },
    ],
    reviews: [],
    menu: [
      pizza('speedpie', 'sp-pep', 'Speed Pepperoni', 'Fast, hot, classic pepperoni.', 11.99, 'from-cyan-600 to-blue-500', true),
      pizza('speedpie', 'sp-cheese', 'Speed Cheese', 'Triple mozzarella blend.', 10.99, 'from-cyan-500 to-sky-400', false, ['vegetarian']),
      pizza('speedpie', 'sp-veg', 'Speed Veggie', 'Fresh veg, light sauce.', 11.49, 'from-teal-600 to-green-500', false, ['vegetarian']),
      side('speedpie', 'sp-wings', 'Micro Wings (6pc)', 'Fast and crispy.', 6.99),
      drink('speedpie', 'sp-can', 'Can Soda', 1.49),
    ],
  },
];

// ── Search engine ─────────────────────────────────────────────────────────────

export function searchStores(query: string, stores: MarketplaceStore[]): MarketplaceStore[] {
  if (!query.trim()) return stores;
  const q = query.toLowerCase();
  return stores.filter(s => {
    return (
      s.name.toLowerCase().includes(q) ||
      s.neighborhood.toLowerCase().includes(q) ||
      s.tags.some(t => t.includes(q)) ||
      s.badges.some(b => b.toLowerCase().includes(q)) ||
      s.menu.some(m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)) ||
      s.deals.some(d => d.title.toLowerCase().includes(q)) ||
      s.popularItems.some(p => p.toLowerCase().includes(q)) ||
      q.includes('cheap') && s.priceRange === '$' ||
      q.includes('vegan') && s.tags.includes('vegan') ||
      q.includes('halal') && s.tags.includes('halal') ||
      q.includes('fast') && s.deliveryTime < 25 ||
      q.includes('open') && s.isOpen ||
      q.includes('free delivery') && s.deliveryFee === 0 ||
      q.includes('local') && (s.category === 'local' || s.category === 'artisan')
    );
  });
}

// ── Filter engine ─────────────────────────────────────────────────────────────

export interface StoreFilters {
  openNow: boolean;
  freeDelivery: boolean;
  maxDeliveryTime: number | null; // mins, null = any
  minRating: number | null;
  maxDistance: number | null; // miles
  priceRanges: PriceRange[];
  dietary: DietaryTag[];
  deliveryPartner: DeliveryPartner | null;
  sortBy: 'recommended' | 'price' | 'rating' | 'distance' | 'speed' | 'trending';
}

export const DEFAULT_FILTERS: StoreFilters = {
  openNow: false,
  freeDelivery: false,
  maxDeliveryTime: null,
  minRating: null,
  maxDistance: null,
  priceRanges: [],
  dietary: [],
  deliveryPartner: null,
  sortBy: 'recommended',
};

export function applyFilters(stores: MarketplaceStore[], filters: StoreFilters): MarketplaceStore[] {
  let result = [...stores];

  if (filters.openNow) result = result.filter(s => s.isOpen);
  if (filters.freeDelivery) result = result.filter(s => s.deliveryFee === 0);
  if (filters.maxDeliveryTime) result = result.filter(s => s.deliveryTime <= filters.maxDeliveryTime!);
  if (filters.minRating) result = result.filter(s => s.rating >= filters.minRating!);
  if (filters.maxDistance) result = result.filter(s => s.distance <= filters.maxDistance!);
  if (filters.priceRanges.length) result = result.filter(s => filters.priceRanges.includes(s.priceRange));
  if (filters.dietary.length) result = result.filter(s => filters.dietary.every(d => s.tags.includes(d)));
  if (filters.deliveryPartner) result = result.filter(s => s.deliveryPartners.includes(filters.deliveryPartner!));

  switch (filters.sortBy) {
    case 'price': result.sort((a, b) => a.deliveryFee - b.deliveryFee); break;
    case 'rating': result.sort((a, b) => b.rating - a.rating); break;
    case 'distance': result.sort((a, b) => a.distance - b.distance); break;
    case 'speed': result.sort((a, b) => a.deliveryTime - b.deliveryTime); break;
    case 'trending': result.sort((a, b) => b.trendScore - a.trendScore); break;
    case 'recommended':
    default:
      result.sort((a, b) => {
        const scoreA = a.rating * 0.4 + (1 / a.distance) * 0.3 + (a.trendScore / 100) * 0.3;
        const scoreB = b.rating * 0.4 + (1 / b.distance) * 0.3 + (b.trendScore / 100) * 0.3;
        return scoreB - scoreA;
      });
  }

  return result;
}

// ── Recommendation slices ─────────────────────────────────────────────────────

export const RECOMMENDATION_SLICES = {
  mostOrdered: () => [...MARKETPLACE_STORES].sort((a, b) => b.trendScore - a.trendScore).slice(0, 5),
  fastest: () => [...MARKETPLACE_STORES].filter(s => s.isOpen).sort((a, b) => a.deliveryTime - b.deliveryTime).slice(0, 5),
  bestDeals: () => MARKETPLACE_STORES.filter(s => s.deals.length > 0 && s.isOpen).slice(0, 5),
  topRated: () => [...MARKETPLACE_STORES].sort((a, b) => b.rating - a.rating).slice(0, 5),
  vegan: () => MARKETPLACE_STORES.filter(s => s.tags.includes('vegan') || s.tags.includes('vegetarian')),
  cheapest: () => [...MARKETPLACE_STORES].filter(s => s.isOpen).sort((a, b) => a.deliveryFee - b.deliveryFee).slice(0, 5),
  newStores: () => MARKETPLACE_STORES.filter(s => s.isNew),
  freeDelivery: () => MARKETPLACE_STORES.filter(s => s.deliveryFee === 0 && s.isOpen),
};
