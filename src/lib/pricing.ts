import { PizzaConfig, ChainPricingData, Quote, DeliveryType, PriceBreakdown, Review } from '../types';

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
    deliveryOptions: { store: true, pickup: true, doordash: false, ubereats: true, grubhub: false },
    distance: "1.2 miles"
  },
  {
    id: "papajohns",
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
    deliveryOptions: { store: true, pickup: true, doordash: true, ubereats: false, grubhub: true },
    distance: "2.5 miles"
  },
  {
    id: "pizzahut",
    name: "Pizza Hut",
    color: "bg-red-600",
    defaultDeliveryType: "store-delivery",
    basePrices: { "Small": 9.99, "Medium": 13.99, "Large": 16.99, "Extra Large": 18.99 },
    crustPremium: { "Hand Tossed": 0, "Handmade Pan": 1.0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0, "New York Style": 0, "Parmesan Stuffed Crust": 2.00, "Gluten Free Crust": 2.50 },
    toppingPrice: 1.25,
    storeDeliveryFee: 4.50,
    reviews: [
      { id: '4', user: 'Sam', rating: 3, text: 'Pizza was okay, delivery tool a bit long.' },
      { id: '5', user: 'Taylor', rating: 4, text: 'Stuffed crust is legendary.' }
    ],
    deliveryOptions: { store: true, pickup: true, doordash: true, ubereats: true, grubhub: true },
    distance: "1.8 miles"
  },
  {
    id: "littlecaesars",
    name: "Little Caesars",
    color: "bg-orange-500",
    defaultDeliveryType: "third-party", // DoorDash/UberEats
    basePrices: { "Small": 6.00, "Medium": 7.99, "Large": 9.99, "Extra Large": 11.99 },
    crustPremium: { "Hand Tossed": 0, "Handmade Pan": 0, "Crunchy Thin Crust": 1.0, "Brooklyn Style": 0, "New York Style": 0, "Parmesan Stuffed Crust": 3.00, "Gluten Free Crust": 1.50 },
    toppingPrice: 2.00, // Third party usually marks up toppings too
    reviews: [
      { id: '6', user: 'Jordan', rating: 5, text: 'Super cheap and fast!' }
    ],
    deliveryOptions: { store: false, pickup: true, doordash: true, ubereats: true, grubhub: false },
    distance: "0.8 miles"
  },
  {
    id: "localpizza",
    name: "Local Pizza Shop",
    color: "bg-stone-600",
    defaultDeliveryType: "pickup", 
    basePrices: { "Small": 11.99, "Medium": 14.99, "Large": 18.99, "Extra Large": 21.99 },
    crustPremium: { "Hand Tossed": 0, "Handmade Pan": 2.0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0, "New York Style": 0, "Parmesan Stuffed Crust": 0, "Gluten Free Crust": 4.00 },
    toppingPrice: 2.00, 
    reviews: [],
    deliveryOptions: { store: false, pickup: true, doordash: false, ubereats: false, grubhub: false },
    distance: "3.2 miles"
  }
];

export function calculateQuotes(config: PizzaConfig, deliveryPreference: DeliveryType | 'auto', userReviews: Record<string, Review[]> = {}): Quote[] {
  const sorted = mockChains.map(chain => {
    // 1. Determine Delivery Type
    const deliveryType = deliveryPreference === 'auto' ? chain.defaultDeliveryType : deliveryPreference;
    
    // 2. Base Math
    let basePrice = (chain.basePrices[config.size] || 15.99) + (chain.crustPremium[config.crust] || 0);
    // Extra elements are counted as toppings
    let totalToppingsCount = config.cheese.length + config.meats.length + config.veggies.length + config.extras.length;
    // Assume first cheese is free
    if (config.cheese.length > 0) totalToppingsCount -= 1;
    
    let toppingsCost = Math.max(0, totalToppingsCount) * chain.toppingPrice;
    
    // Third-party markup
    if (deliveryType === 'third-party') {
      basePrice *= 1.20; // 20% markup
      toppingsCost *= 1.20;
    }

    const subtotal = basePrice + toppingsCost;
    let deliveryFee = 0;
    let serviceFee = 0;
    
    if (deliveryType === 'store-delivery') {
      deliveryFee = chain.storeDeliveryFee || 4.99;
    } else if (deliveryType === 'third-party') {
      deliveryFee = 2.99; // 3rd party delivery fee mock
      serviceFee = subtotal * 0.15; // 15% platform fee
    }

    const tax = subtotal * 0.0825;
    
    // Tip only on delivery
    const tip = deliveryType === 'pickup' ? 0 : subtotal * 0.15;

    const grandTotal = subtotal + deliveryFee + serviceFee + tax + tip;
    
    const breakdown: PriceBreakdown = {
      subtotal,
      deliveryFee,
      serviceFee,
      tax,
      tip,
      grandTotal
    };

    // 3. Time estimation
    let timeMin = 15;
    let timeMax = 25;
    if (deliveryType === 'store-delivery') {
      timeMin = 30;
      timeMax = 45;
    } else if (deliveryType === 'third-party') {
      timeMin = 45;
      timeMax = 60;
    }

    // Combine mock reviews and user reviews
    const combinedReviews = [...chain.reviews, ...(userReviews[chain.id] || [])];
    const avgRating = combinedReviews.length > 0 ? combinedReviews.reduce((sum, r) => sum + r.rating, 0) / combinedReviews.length : 0;

    let deliveryStatus: 'Store Delivery Available' | 'Third-Party Delivery Available' | 'Pickup Only' = 'Pickup Only';
    if (chain.deliveryOptions.store) {
      deliveryStatus = 'Store Delivery Available';
    } else if (chain.deliveryOptions.doordash || chain.deliveryOptions.ubereats || chain.deliveryOptions.grubhub) {
      deliveryStatus = 'Third-Party Delivery Available';
    }

    const thirdPartyPrices: any = {};
    if (chain.deliveryOptions.doordash) thirdPartyPrices.doordash = grandTotal * 1.05; // mock higher price
    if (chain.deliveryOptions.ubereats) thirdPartyPrices.ubereats = grandTotal * 1.08;

    return {
      chainId: chain.id,
      chainName: chain.name,
      logoColor: chain.color,
      deliveryType,
      deliveryStatus,
      basePrice: basePrice * (config.quantity || 1),
      toppingsCost: toppingsCost * (config.quantity || 1),
      estimatedTimeMin: timeMin,
      estimatedTimeMax: timeMax,
      breakdown: {
        subtotal: subtotal * (config.quantity || 1),
        deliveryFee,
        serviceFee,
        tax: tax * (config.quantity || 1),
        tip: tip * (config.quantity || 1),
        grandTotal: grandTotal * (config.quantity || 1)
      },
      rating: avgRating,
      reviews: combinedReviews,
      distance: chain.distance,
      thirdPartyPrices,
      badges: []
    };
  }).sort((a, b) => a.breakdown.grandTotal - b.breakdown.grandTotal);

  if (sorted.length > 0) sorted[0].badges.push('Best Value');
  return sorted;
}
