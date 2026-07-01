import { PizzaConfig, ChainPricingData, Quote, DeliveryType, PriceBreakdown, Review, DeliveryProviderOption, Coupon } from '../types';

export const mockChains: ChainPricingData[] = [
  {
    id: "dominos",
    name: "Domino's",
    color: "bg-blue-600",
    defaultDeliveryType: "store-delivery",
    basePrices: { "Small": 8.99, "Medium": 12.99, "Large": 15.99, "Extra Large": 17.99 },
    crustPremium: { "Hand Tossed": 0, "Handmade Pan": 1.0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0, "New York Style": 0, "Parmesan Stuffed Crust": 2.50, "Gluten Free Crust": 3.00 },
    toppingPrice: 1.50,
    storeDeliveryFee: 4.99,
    reviews: [
      { id: '1', user: 'Alex', rating: 4, text: 'Fast delivery, good crust.' },
      { id: '2', user: 'Jamie', rating: 5, text: 'Always my go-to!' }
    ],
    deliveryOptions: { store: true, pickup: true, doordash: false, ubereats: false, grubhub: false },
    distance: "1.2 miles"
  },
  {
    id: "papa-johns",
    name: "Papa Johns",
    color: "bg-green-700",
    defaultDeliveryType: "store-delivery",
    basePrices: { "Small": 9.99, "Medium": 14.99, "Large": 17.99, "Extra Large": 19.99 },
    crustPremium: { "Hand Tossed": 0, "Handmade Pan": 1.5, "Crunchy Thin Crust": 0, "Brooklyn Style": 0, "New York Style": 0, "Parmesan Stuffed Crust": 3.00, "Gluten Free Crust": 3.00 },
    toppingPrice: 1.75,
    storeDeliveryFee: 5.49,
    reviews: [
      { id: '3', user: 'Chris', rating: 4, text: 'Love the garlic sauce.' }
    ],
    deliveryOptions: { store: true, pickup: true, doordash: true, ubereats: false, grubhub: false },
    distance: "2.5 miles"
  },
  {
    id: "pizza-hut",
    name: "Pizza Hut",
    color: "bg-red-600",
    defaultDeliveryType: "store-delivery",
    basePrices: { "Small": 9.99, "Medium": 13.99, "Large": 16.99, "Extra Large": 18.99 },
    crustPremium: { "Hand Tossed": 0, "Handmade Pan": 1.0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0, "New York Style": 0, "Parmesan Stuffed Crust": 2.00, "Gluten Free Crust": 2.50 },
    toppingPrice: 1.25,
    storeDeliveryFee: 4.50,
    reviews: [
      { id: '4', user: 'Sam', rating: 3, text: 'Pizza was okay, delivery time a bit long.' },
      { id: '5', user: 'Taylor', rating: 4, text: 'Stuffed crust is legendary.' }
    ],
    deliveryOptions: { store: true, pickup: true, doordash: true, ubereats: true, grubhub: true },
    distance: "1.8 miles"
  },
  {
    id: "jets-pizza",
    name: "Jet's Pizza",
    color: "bg-red-700",
    defaultDeliveryType: "third-party", // Removed direct delivery
    basePrices: { "Small": 12.99, "Medium": 16.99, "Large": 20.99, "Extra Large": 24.99 },
    crustPremium: { "Hand Tossed": 0, "Handmade Pan": 0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0, "New York Style": 0, "Parmesan Stuffed Crust": 0, "Gluten Free Crust": 2.50 },
    toppingPrice: 2.00,
    storeDeliveryFee: 0,
    reviews: [
      { id: '6', user: 'Jordan', rating: 5, text: 'Detroit style deep dish is unbeatable!' }
    ],
    deliveryOptions: { store: false, pickup: true, doordash: true, ubereats: true, grubhub: true },
    distance: "0.8 miles"
  },
  {
    id: "marcos-pizza",
    name: "Marco's Pizza",
    color: "bg-red-800",
    defaultDeliveryType: "third-party",
    basePrices: { "Small": 11.99, "Medium": 14.99, "Large": 18.99, "Extra Large": 21.99 },
    crustPremium: { "Hand Tossed": 0, "Handmade Pan": 0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0, "New York Style": 0, "Parmesan Stuffed Crust": 0, "Gluten Free Crust": 3.00 },
    toppingPrice: 1.75,
    storeDeliveryFee: 0,
    reviews: [],
    deliveryOptions: { store: false, pickup: true, doordash: true, ubereats: true, grubhub: true },
    distance: "3.2 miles"
  },
  {
    id: "buntys-pizza",
    name: "Bunty's Pizza",
    color: "bg-orange-600",
    defaultDeliveryType: "store-delivery",
    basePrices: { "Small": 2.49, "Medium": 3.49, "Large": 14.49, "Extra Large": 16.99 },
    crustPremium: { "Hand Tossed": 0, "Handmade Pan": 1.0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0, "New York Style": 0, "Parmesan Stuffed Crust": 2.50, "Gluten Free Crust": 2.50 },
    toppingPrice: 0.29,
    storeDeliveryFee: 0.49,
    reviews: [
      { id: 'b1', user: 'Ravi', rating: 5, text: 'Best local pizza in Michigan, hands down!' },
      { id: 'b2', user: 'Priya', rating: 5, text: 'Lamb topping is amazing, never going anywhere else.' },
      { id: 'b3', user: 'Mike', rating: 4, text: 'Great value, fast delivery and fresh ingredients.' },
      { id: 'b4', user: 'Sara', rating: 5, text: 'The garlic butter drizzle is unreal. 10/10!' }
    ],
    deliveryOptions: { store: true, pickup: true, doordash: true, ubereats: true, grubhub: false },
    distance: "0.4 miles"
  }
];

const mockCoupons: Record<string, Coupon[]> = {
  doordash: [
    { code: 'DASH10', description: '10% off delivery', discountType: 'percentage', discountValue: 10 }
  ],
  ubereats: [
    { code: 'SAVE5', description: 'Save $5 on orders', discountType: 'fixed', discountValue: 5 }
  ],
  grubhub: [
    { code: 'GRUB7', description: '$7 off your first order', discountType: 'fixed', discountValue: 7 }
  ],
  store: [
    { code: 'FREEDEL', description: 'Free delivery today', discountType: 'free_delivery', discountValue: 0 }
  ]
};

export function calculateQuotes(config: PizzaConfig, deliveryPreference: DeliveryType | 'auto', userReviews: Record<string, Review[]> = {}): Quote[] {
  const sorted = mockChains.map(chain => {
    // 2. Base Math
    let basePriceInternal = (chain.basePrices[config.size] || 15.99) + (chain.crustPremium[config.crust] || 0);
    let totalToppingsCount = config.cheese.length + config.meats.length + config.veggies.length + config.extras.length;
    if (config.cheese.length > 0) totalToppingsCount -= 1;
    let toppingsCostInternal = Math.max(0, totalToppingsCount) * chain.toppingPrice;

    const quantity = config.quantity || 1;
    basePriceInternal *= quantity;
    toppingsCostInternal *= quantity;

    const createOption = (providerId: string, providerName: string, isThirdParty: boolean): DeliveryProviderOption => {
      let markupPrice = basePriceInternal;
      let markupToppings = toppingsCostInternal;

      if (isThirdParty) {
        markupPrice *= 1.20; // 20% markup
        markupToppings *= 1.20;
      }

      const subtotal = markupPrice + markupToppings;
      let deliveryFee = 0;
      let serviceFee = 0;

      let estMin = 15;
      let estMax = 25;

      if (providerId === 'pickup') {
        // pickup 
      } else if (!isThirdParty) {
        deliveryFee = chain.storeDeliveryFee || 4.99;
        estMin = 25; estMax = 35;
      } else {
        if (providerId === 'doordash') {
          deliveryFee = 4.00;
          estMin = 22; estMax = 32;
        } else if (providerId === 'ubereats') {
          deliveryFee = 5.00;
          estMin = 28; estMax = 38;
        } else if (providerId === 'grubhub') {
          deliveryFee = 3.49;
          estMin = 26; estMax = 36;
        }
        serviceFee = subtotal * 0.15;
      }

      const tax = subtotal * 0.0825;
      const tip = providerId === 'pickup' ? 0 : subtotal * 0.15;

      let grandTotal = subtotal + deliveryFee + serviceFee + tax + tip;
      let discount = 0;

      const optionCoupons = mockCoupons[providerId] || [];

      // We'll calculate the best total cost here for the sake of the badges, 
      // but users can select it in the UI. We return availableCoupons.
      return {
        providerId,
        providerName,
        priceBreakdown: {
          subtotal,
          deliveryFee,
          serviceFee,
          tax,
          tip,
          discount,
          grandTotal
        },
        estimatedTimeMin: estMin,
        estimatedTimeMax: estMax,
        badges: [],
        availableCoupons: optionCoupons
      }
    };

    const deliveryOptions: DeliveryProviderOption[] = [];

    // Add explicitly filtered options based on deliveryPreference if applicable
    if (deliveryPreference === 'pickup' && chain.deliveryOptions.pickup) {
      deliveryOptions.push(createOption('pickup', 'Pickup', false));
    } else {
      if (chain.deliveryOptions.store) deliveryOptions.push(createOption('store', 'Store Delivery', false));
      if (chain.deliveryOptions.ubereats) deliveryOptions.push(createOption('ubereats', 'Uber Eats', true));
      if (chain.deliveryOptions.doordash) deliveryOptions.push(createOption('doordash', 'DoorDash', true));
      if (chain.deliveryOptions.grubhub) deliveryOptions.push(createOption('grubhub', 'Grubhub', true));
    }

    // Evaluate options to find cheapest/fastest
    let cheapestOptionId: string | undefined;
    let fastestOptionId: string | undefined;

    let minPrice = Infinity;
    let minTime = Infinity;

    deliveryOptions.forEach(opt => {
      if (opt.priceBreakdown.grandTotal < minPrice) { minPrice = opt.priceBreakdown.grandTotal; cheapestOptionId = opt.providerId; }
      if (opt.estimatedTimeMin < minTime) { minTime = opt.estimatedTimeMin; fastestOptionId = opt.providerId; }
    });

    if (cheapestOptionId) {
      const cheapOpt = deliveryOptions.find(o => o.providerId === cheapestOptionId);
      if (cheapOpt) cheapOpt.badges.push('🏆 Cheapest Delivery');
    }
    if (fastestOptionId && fastestOptionId !== cheapestOptionId) {
      const fastOpt = deliveryOptions.find(o => o.providerId === fastestOptionId);
      if (fastOpt) fastOpt.badges.push('⚡ Fastest Arrival');
    }

    const combinedReviews = [...chain.reviews, ...(userReviews[chain.id] || [])];
    const avgRating = combinedReviews.length > 0 ? combinedReviews.reduce((sum, r) => sum + r.rating, 0) / combinedReviews.length : 0;

    const itemToReturn: Quote = {
      chainId: chain.id,
      chainName: chain.name,
      logoColor: chain.color,
      basePrice: basePriceInternal,
      toppingsCost: toppingsCostInternal,
      rating: avgRating,
      reviews: combinedReviews,
      distance: chain.distance,
      badges: [],
      deliveryOptions,
      cheapestOptionId,
      fastestOptionId,
      bestValueOptionId: undefined
    };
    return itemToReturn;
  }).sort((a, b) => {
    // Sort primarily by the cheapest available delivery option
    const getMinPrice = (q: Quote) => {
      if (q.deliveryOptions.length === 0) return Infinity;
      return Math.min(...q.deliveryOptions.map(o => o.priceBreakdown.grandTotal));
    };
    return getMinPrice(a) - getMinPrice(b);
  });

  if (sorted.length > 0) {
    sorted[0].badges.push('Best Value');
    if (sorted[0].deliveryOptions.length > 0 && sorted[0].cheapestOptionId) {
      sorted[0].bestValueOptionId = sorted[0].cheapestOptionId;
    }
  }
  return sorted;
}
