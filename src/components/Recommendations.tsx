import { useState, useEffect } from 'react';
import { Recommendation, PizzaConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search } from 'lucide-react';
import { getPizzaImage } from './PizzaInput';

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "r1",
    name: "Classic Pepperoni",
    storeName: "Domino's",
    imageColor: "dominos",
    startingPrice: 17.49,
    deliveryType: "Store Delivery",
    distance: "1.2 miles",
    estimatedTime: "25 - 45 MIN",
    badges: ["Popular", "Fast Delivery"],
    config: {
      size: "Large", crust: "Hand Tossed", sauce: "Robust Inspired Tomato Sauce",
      cheese: ["Mozzarella"], meats: ["Pepperoni"], veggies: [], extras: [], quantity: 1
    }
  },
  {
    id: "r2",
    name: "Detroit-Style Deep Dish",
    storeName: "Jet's Pizza",
    imageColor: "jets-pizza",
    startingPrice: 22.99,
    deliveryType: "Uber Eats",
    distance: "3.5 miles",
    estimatedTime: "45 - 60 MIN",
    badges: ["Michigan Favorite"],
    config: {
      size: "Large", crust: "Handmade Pan", sauce: "Robust Inspired Tomato Sauce",
      cheese: ["Extra Cheese", "Mozzarella"], meats: ["Pepperoni"], veggies: [], extras: ["Well Done"], quantity: 1
    }
  },
  {
    id: "r3",
    name: "BBQ Chicken Fiesta",
    storeName: "Papa Johns",
    imageColor: "papa-johns",
    startingPrice: 19.99,
    deliveryType: "Store Delivery",
    distance: "2.5 miles",
    estimatedTime: "30 - 45 MIN",
    badges: ["Best Value"],
    config: {
      size: "Large", crust: "Hand Tossed", sauce: "BBQ Sauce",
      cheese: ["Mozzarella", "Cheddar Blend"], meats: ["Grilled Chicken", "Bacon"], veggies: ["Onions"], extras: [], quantity: 1
    }
  },
  {
    id: "r4",
    name: "Stuffed Crust Veggie",
    storeName: "Pizza Hut",
    imageColor: "pizza-hut",
    startingPrice: 18.49,
    deliveryType: "Store Delivery",
    distance: "1.8 miles",
    estimatedTime: "30 - 50 MIN",
    badges: ["Deal"],
    config: {
      size: "Large", crust: "Parmesan Stuffed Crust", sauce: "Robust Inspired Tomato Sauce",
      cheese: ["Mozzarella"], meats: [], veggies: ["Mushrooms", "Green Peppers", "Onions", "Black Olives"], extras: [], quantity: 1
    }
  }
];

const TABS = ["Popular Near You", "Cheapest Today", "Fastest Delivery", "Michigan Favorites", "Deals"];

interface RecommendationsProps {
  onCustomize: (config: PizzaConfig) => void;
  onCompare: (config: PizzaConfig) => void;
}

export function Recommendations({ onCustomize, onCompare }: RecommendationsProps) {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [locationName, setLocationName] = useState("Michigan");

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
           // In a real app we'd reverse-geocode it. For now, mock based on success:
           setLocationName("Your Area");
        },
        (error) => {
           setLocationName("Michigan");
        }
      );
    }
  }, []);

  const sortedRecs = [...RECOMMENDATIONS].sort((a, b) => {
    if (activeTab === "Cheapest Today") return a.startingPrice - b.startingPrice;
    if (activeTab === "Fastest Delivery") return parseInt(a.estimatedTime) - parseInt(b.estimatedTime);
    return 0; 
  });

  return (
    <div className="w-full max-w-5xl mx-auto z-10 relative mb-16 pt-8 border-t border-stone-200/50">
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
           <MapPin className="w-6 h-6 text-red-500" />
           Trending in {locationName}
         </h2>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(t => (
          <button 
             key={t}
             onClick={() => setActiveTab(t)}
             className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === t ? 'bg-stone-900 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <AnimatePresence mode="popLayout">
            {sortedRecs.map((rec, i) => (
              <motion.div
                 layout
                 key={rec.id + activeTab}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 transition={{ delay: i * 0.05 }}
                 className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-stone-200/40 border border-stone-100 group flex flex-col"
              >
                  <div className="h-40 bg-stone-900 relative overflow-hidden flex items-center justify-center p-4">
                     <img 
                       src={getPizzaImage(rec.config)} 
                       alt={`Preview of ${rec.name}`}
                       className="absolute inset-0 w-full h-full object-cover opacity-80"
                       loading="lazy"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/10 to-stone-900/40 mix-blend-multiply"></div>
                     <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10">
                        {rec.badges.map(b => (
                           <span key={b} className="bg-white/90 backdrop-blur text-stone-900 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm">
                             {b}
                           </span>
                        ))}
                     </div>
                     <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-900 border border-stone-700 shadow-xl overflow-hidden z-10">
                        <img 
                           src={`/images/stores/${rec.imageColor}-placeholder.svg`} 
                           alt={`Store logo for ${rec.storeName}`}
                           className="w-full h-full object-cover"
                           loading="lazy"
                           onError={(e) => { e.currentTarget.src='/images/stores/local-placeholder.svg'; }}
                        />
                     </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                      <div className="mb-4">
                        <h3 className="font-bold text-stone-900 text-lg leading-tight mb-1">{rec.name}</h3>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{rec.storeName}</p>
                      </div>
                      
                      <div className="space-y-1 mb-6 mt-auto">
                        <p className="text-xs text-stone-500 flex justify-between">
                           <span>Starts at</span>
                           <span className="font-bold text-stone-900 text-sm">${rec.startingPrice.toFixed(2)}</span>
                        </p>
                        <p className="text-xs text-stone-500 flex justify-between">
                           <span>Time</span>
                           <span className="font-bold">{rec.estimatedTime}</span>
                        </p>
                        <p className="text-[11px] text-stone-400 flex justify-between pt-1">
                           <span>{rec.deliveryType}</span>
                           <span>{rec.distance}</span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button 
                           onClick={() => onCustomize(rec.config)}
                           className="flex-1 bg-stone-100 text-stone-700 hover:bg-stone-200 py-2 rounded-xl text-xs font-bold transition-colors"
                        >
                          Customize
                        </button>
                        <button 
                           onClick={() => onCompare(rec.config)}
                           className="flex-1 bg-red-600 text-white hover:bg-red-700 py-2 rounded-xl text-xs font-bold transition-colors shadow flex items-center justify-center gap-1"
                        >
                          <Search className="w-3.5 h-3.5" />
                          Compare
                        </button>
                      </div>
                  </div>
              </motion.div>
            ))}
         </AnimatePresence>
      </div>
    </div>
  );
}
