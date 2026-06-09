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

export type DeliveryType = 'store-delivery' | 'third-party' | 'pickup';
export type DeliveryStatus = 'Store Delivery Available' | 'Third-Party Delivery Available' | 'Pickup Only';

export interface PriceBreakdown {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number; // For platform/third-party
  tax: number; // typically 8.25%
  tip: number; // 15% courier tip if delivered
  grandTotal: number;
}

export interface Review {
  id: string;
  user: string;
  rating: number; // 1-5
  text: string;
}

export interface ThirdPartyPrices {
  doordash?: number | 'varies';
  ubereats?: number | 'varies';
  grubhub?: number | 'varies';
}

export interface Quote {
  chainId: string;
  chainName: string;
  logoColor: string; // e.g. Tailwind class or hex
  deliveryType: DeliveryType;
  deliveryStatus: DeliveryStatus;
  basePrice: number;
  toppingsCost: number;
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  breakdown: PriceBreakdown;
  rating: number;
  reviews: Review[];
  distance: string;
  thirdPartyPrices?: ThirdPartyPrices;
  badges: string[];
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
