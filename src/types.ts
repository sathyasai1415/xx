export type Size = "Small" | "Medium" | "Large" | "Extra Large" | "";
export type Crust = "Hand Tossed" | "Handmade Pan" | "Crunchy Thin Crust" | "Brooklyn Style" | "New York Style" | "Parmesan Stuffed Crust" | "Gluten Free Crust" | "";
export type Sauce = "Robust Inspired Tomato Sauce" | "Hearty Marinara" | "Garlic Parmesan White Sauce" | "Alfredo Sauce" | "BBQ Sauce" | "Ranch Sauce" | "Buffalo Sauce" | "No Sauce" | "";

export interface PizzaConfig {
  size: Size;
  crust: Crust;
  sauce: Sauce;
  cheese: string[];
  meats: string[];
  veggies: string[];
  extras: string[];
  quantity: number;
}

export type DeliveryType = 'store-delivery' | 'third-party' | 'pickup' | 'doordash-drive' | 'uber-direct';
export type DeliveryStatus = 'Store Delivery Available' | 'Third-Party Delivery Available' | 'Pickup Only';

export interface Coupon {
  code: string;
  description: string;
  discountType: 'fixed' | 'percentage' | 'free_delivery';
  discountValue: number;
}

export interface PriceBreakdown {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number; // For platform/third-party
  tax: number; // typically 8.25%
  tip: number; // 15% courier tip if delivered
  discount: number; // Applied discount from coupon
  grandTotal: number;
}

export interface DeliveryProviderOption {
  providerId: string; // 'store', 'ubereats', 'doordash', 'pickup'
  providerName: string;
  priceBreakdown: PriceBreakdown;
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  badges: string[];
  availableCoupons: Coupon[];
  appliedCoupon?: Coupon;
}

export interface OrderItem {
  id: string;
  orderId: string;
  pizzaName: string;
  pizzaImage: string;
  size: string;
  crust: string;
  sauce: string;
  cheese: string[];
  toppings: string[];
  quantity: number;
  basePrice: number;
  toppingsTotal: number;
  itemTotal: number;
}

export interface Order {
  id: string;
  userId: string;
  storeId: string;
  storeName: string;
  storeLogo: string;
  orderStatus: 'placed' | 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  selectedDeliveryProvider: string;
  selectedDeliveryProviderId?: string;
  deliveryType: string;
  deliveryFee: number;
  providerServiceFee: number;
  estimatedDeliveryTime: string;
  subtotal: number;
  tax: number;
  platformServiceFee: number;
  couponCode?: string;
  couponDiscount: number;
  finalTotal: number;
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
  items: OrderItem[];
}
export interface Review {
  id: string;
  user: string;
  rating: number; // 1-5
  text: string;
}

export interface Quote {
  chainId: string;
  chainName: string;
  logoColor: string; // e.g. Tailwind class or hex
  basePrice: number;
  toppingsCost: number;
  rating: number;
  reviews: Review[];
  distance: string;
  badges: string[];
  
  // New features for delivery options
  deliveryOptions: DeliveryProviderOption[];
  cheapestOptionId?: string;
  fastestOptionId?: string;
  bestValueOptionId?: string;
}

export interface ChainPricingData {
  id: string;
  name: string;
  color: string;
  defaultDeliveryType: DeliveryType;
  basePrices: Record<string, number>;
  crustPremium: Record<string, number>;
  toppingPrice: number; // price per topping
  storeDeliveryFee?: number; // fee local store charges
  reviews: Review[];
  deliveryOptions: {
    store: boolean;
    pickup: boolean;
    doordash: boolean;
    ubereats: boolean;
    grubhub: boolean;
  };
  distance: string;
}

export interface CartItem {
  id: string; // unique ID for the cart item
  store_id: string; // The ID of the store or chain
  store_name: string; // E.g., Domino's, Local Store
  item_name: string; // E.g., Custom Pizza, or Deal Title
  config?: PizzaConfig; // The configuration if it's a pizza
  deal_id?: string; // If it's a local deal
  quantity: number;
  price_per_item: number;
  total_price: number;
  delivery_type: DeliveryType;
  platform?: string; // e.g., 'store-delivery', 'doordash', 'ubereats'
  estimatedTime?: string;
  custom_delivery_fee?: number;
  deliveryOption?: DeliveryProviderOption;
}

export interface FavoriteConfig {
  id: string;
  name: string;
  config: PizzaConfig;
}

export interface Recommendation {
  id: string;
  name: string;
  storeName: string;
  imageColor: string;
  startingPrice: number;
  deliveryType: string;
  distance: string;
  estimatedTime: string;
  badges: string[];
  config: PizzaConfig;
}
