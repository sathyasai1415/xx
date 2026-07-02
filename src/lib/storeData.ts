export interface StoreMenuItem {
  id: string;
  name: string;
  image: string;
  price: number;
  description: string;
}

export interface StoreData {
  id: string;
  name: string;
  logoUrl?: string;
  brandColor?: string;
  backgroundColor?: string;
  address: string;
  distance: string;
  deliveryAvailable: boolean;
  deliveryProvider: string;
  rating: number;
  openNow: boolean;
  menuItems: StoreMenuItem[];
}

export const STORES: StoreData[] = [
  {
    id: "dominos",
    name: "Domino's",
    logoUrl: "/images/stores/white-horses-in-a-lush-forest.jpg",
    brandColor: "blue",
    backgroundColor: "red",
    address: "123 Main St",
    distance: "1.2 miles",
    deliveryAvailable: true,
    deliveryProvider: "store",
    rating: 4.2,
    openNow: true,
    menuItems: [
      { id: "dominos-pepperoni", name: "Classic Pepperoni", image: "/images/pizzas/pepperoni.jpg", price: 17.49, description: "Classic pepperoni with robust tomato sauce." }
    ]
  },
  {
    id: "pizza-hut",
    name: "Pizza Hut",
    logoUrl: "/images/stores/white-horses-in-a-lush-forest.jpg",
    brandColor: "red",
    backgroundColor: "red",
    address: "456 Elm St",
    distance: "1.8 miles",
    deliveryAvailable: true,
    deliveryProvider: "store",
    rating: 3.8,
    openNow: true,
    menuItems: [
      { id: "ph-stuffed", name: "Stuffed Crust Veggie", image: "/images/pizzas/veggie.jpg", price: 18.49, description: "Stuffed crust topped with fresh veggies." }
    ]
  },
  {
    id: "papa-johns",
    name: "Papa Johns",
    logoUrl: "/images/stores/white-horses-in-a-lush-forest.jpg",
    brandColor: "green",
    backgroundColor: "green",
    address: "789 Oak Ave",
    distance: "2.5 miles",
    deliveryAvailable: true,
    deliveryProvider: "store",
    rating: 4.0,
    openNow: true,
    menuItems: [
      { id: "pj-bbq", name: "BBQ Chicken Fiesta", image: "/images/pizzas/bbq-chicken.jpg", price: 19.99, description: "Grilled chicken, bacon, and BBQ sauce." }
    ]
  },
  {
    id: "jets-pizza",
    name: "Jet's Pizza",
    logoUrl: "/images/stores/white-horses-in-a-lush-forest.jpg",
    brandColor: "red",
    backgroundColor: "blue",
    address: "321 Pine Rd",
    distance: "0.8 miles",
    deliveryAvailable: true,
    deliveryProvider: "store",
    rating: 4.8,
    openNow: true,
    menuItems: [
      { id: "jets-detroit", name: "Detroit-Style Deep Dish", image: "/images/pizzas/meat-lovers.jpg", price: 22.99, description: "Original thick crust deep dish." }
    ]
  },
  {
    id: "marcos-pizza",
    name: "Marco's Pizza",
    logoUrl: "/images/stores/white-horses-in-a-lush-forest.jpg",
    brandColor: "red",
    backgroundColor: "green",
    address: "654 Birch Blvd",
    distance: "3.2 miles",
    deliveryAvailable: true,
    deliveryProvider: "store",
    rating: 4.6,
    openNow: true,
    menuItems: [
      { id: "marcos-hawaiian", name: "Hawaiian", image: "/images/pizzas/hawaiian.jpg", price: 18.99, description: "Ham, pineapple, and extra cheese." }
    ]
  },

 {
    id: "bunty-pizza",
    name: "Bunty Pizza",
    logoUrl: "/images/stores/bunty-pizza-store.png",
    brandColor: "yellow",
    backgroundColor: "yellow",
    address: "35349 Drakeshire Ln",
    distance: "2.4 miles",
    deliveryAvailable: true,
    deliveryProvider: "store",
    rating: 4.7,
    openNow: true,
    menuItems: [
      { id: "bp-spec", name: "Bunty Special", image: "/images/pizzas/pepperoni.jpg", price: 16.99, description: "Pepperoni, sausage, mushrooms, peppers, onions & extra cheese." },
      { id: "bp-butter", name: "Butter Chicken Pizza", image: "/images/pizzas/bbq-chicken.jpg", price: 18.99, description: "Creamy butter chicken, cilantro, red onion on garlic naan crust." },
      { id: "bp-detroit", name: "Detroit Deep Dish", image: "/images/pizzas/meat-lovers.jpg", price: 19.99, description: "Thick crust, brick cheese, pepperoni, tangy tomato stripe." },
      { id: "bp-pep", name: "Pepperoni Blaze", image: "/images/pizzas/pepperoni.jpg", price: 14.99, description: "Triple pepperoni, hot honey drizzle, mozzarella." }
    ]
  },
  {
    id: "rambos-pizza",
    name: "Rambo's Pizza",
    logoUrl: "/images/stores/rambos-pizza.png",
    brandColor: "red",
    backgroundColor: "red",
    address: "777 Action Way, Detroit, MI 48201",
    distance: "0.5 miles",
    deliveryAvailable: true,
    deliveryProvider: "store",
    rating: 4.8,
    openNow: true,
    menuItems: [
      { id: "rambos-pepperoni", name: "Classic Pepperoni", image: "/images/pizzas/pepperoni.jpg", price: 15.99, description: "Action-packed pepperoni with bold tomato sauce." },
      { id: "rambos-cheese", name: "Classic Cheese", image: "/images/pizzas/cheese.jpg", price: 12.99, description: "Rich layers of premium mozzarella on a golden crust." }
    ]
  },
  {
    id: "zumbos-pizza",
    name: "Zumbo's Pizza",
    logoUrl: "/images/stores/zumbos-pizza.png",
    brandColor: "red",
    backgroundColor: "red",
    address: "999 Zumbo Way, Detroit, MI 48201",
    distance: "0.6 miles",
    deliveryAvailable: true,
    deliveryProvider: "store",
    rating: 4.9,
    openNow: true,
    menuItems: [
      { id: "zumbo-chicken-parm", name: "Chicken Parmesan Pizza", image: "/images/pizzas/chicken.jpg", price: 18.99, description: "Crispy chicken, rich marinara, loaded with mozzarella and grated parmesan cheese." }
    ]
  }
];
