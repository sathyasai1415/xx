import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Mic, ArrowRight, Pizza, TrendingUp, Zap, DollarSign, Clock, ShieldCheck, PieChart, Users } from 'lucide-react';
import { ComparisonCards } from './ComparisonCards';
import { Pizza3DBuilder } from './Pizza3DBuilder';
import { PizzaConfig, Quote, CartItem } from '../types';
import riderSvg from '../lib/rider.svg';

const DEFAULT_CONFIG: PizzaConfig = {
  size: "Large",
  crust: "Hand Tossed",
  sauce: "Robust Inspired Tomato Sauce",
  cheese: ["Mozzarella"],
  meats: [],
  veggies: [],
  extras: [],
  quantity: 1
};

interface HomeViewProps {
  onCustomize: (config: PizzaConfig) => void;
  onCompare: (config: PizzaConfig) => void;
  onNavigate: (view: string) => void;
  currentConfig: PizzaConfig | null;
  quotes: Quote[];
  favoriteStores: string[];
  onToggleFavoriteStore: (chainId: string) => void;
  onAddReview: (chainId: string, rating: number, text: string) => void;
  onAddToCart: (item: Omit<CartItem, 'id'>, redirect: boolean) => void;
  userPreferences?: { isVegetarian: boolean; allowedMeats: string[] } | null;
}

export function HomeView({ onCustomize, onCompare, onNavigate, currentConfig, quotes, favoriteStores, onToggleFavoriteStore, onAddReview, onAddToCart, userPreferences }: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const newConfig: PizzaConfig = {
      ...DEFAULT_CONFIG,
      meats: searchQuery.toLowerCase().includes('pepperoni') ? ['Pepperoni'] : (searchQuery.toLowerCase().includes('chicken') ? ['Premium Chicken'] : []),
      veggies: searchQuery.toLowerCase().includes('veggie') ? ['Mushrooms', 'Onions', 'Green Peppers'] : [],
      sauce: searchQuery.toLowerCase().includes('alfredo') ? 'Alfredo Sauce' : (searchQuery.toLowerCase().includes('bbq') ? 'BBQ Sauce' : 'Robust Inspired Tomato Sauce'),
      crust: searchQuery.toLowerCase().includes('thin') ? 'Crunchy Thin Crust' : 'Hand Tossed'
    };
    onCompare(newConfig);
  };

  return (
    <div className="w-full flex-1 flex flex-col pt-8 pb-32 relative overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/rider-bg.png" 
          alt="Night City Rain Pizza Rider" 
          className="w-full h-full object-cover opacity-30"
          onError={(e) => {
            // Fallback if local upload is not found yet
            e.currentTarget.src = "/rider-bg.jpg";
            e.currentTarget.onerror = (e2) => {
               const target = e2.currentTarget as HTMLImageElement;
               target.src = riderSvg;
               target.className = "absolute top-[-200px] right-[-200px] w-[800px] h-[800px] opacity-10 pointer-events-none z-0";
            };
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black w-0 h-0 overflow-hidden"></div>
      </div>
      {/* SECTION 1 - HERO SEARCH */}
      <section className="w-full max-w-4xl mx-auto text-center mb-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <h1 className="text-4xl md:text-6xl font-black text-white text-shadow-sm mb-6 tracking-tight leading-tight">
          Find The Cheapest Pizza <span className="text-red-500">Near You</span>
        </h1>
        <p className="text-lg md:text-xl text-stone-300 font-medium max-w-2xl mx-auto drop-shadow mb-10">
          Compare real prices, delivery fees, taxes, pickup times, and deals from nearby pizza stores.
        </p>

        {/* Big Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-3xl mx-auto mb-8 group/search">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-purple-500/20 rounded-full blur-xl group-focus-within/search:opacity-100 opacity-50 transition-opacity duration-500 pointer-events-none" />
          <div className="flex items-center bg-black/40 backdrop-blur-2xl border border-white/20 rounded-full p-2 relative z-10 transition-all focus-within:scale-[1.02] focus-within:border-orange-500/50 focus-within:shadow-[0_0_30px_rgba(255,100,0,0.3)] duration-300">
            <div className="flex items-center px-4 border-r border-white/10 text-stone-300 hidden sm:flex">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="font-medium whitespace-nowrap text-sm">Detroit, MI</span>
            </div>
            <div className="flex-1 flex items-center px-4">
              <Search className="w-5 h-5 text-stone-400 mr-3" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What pizza are you craving today?"
                className="w-full bg-transparent text-white placeholder-stone-500 font-medium focus:outline-none py-3"
              />
            </div>
            <button type="button" className="p-3 text-stone-400 hover:text-white transition-colors mr-1 group">
              <div className="bg-white/5 p-2 rounded-full group-hover:bg-white/10 transition-colors">
                <Mic className="w-5 h-5" />
              </div>
            </button>
            <button type="submit" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(255,50,0,0.4)] hover:shadow-[0_0_30px_rgba(255,50,0,0.6)] transition-all flex items-center">
              Search
            </button>
          </div>
          
          {/* Quick Links below search */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {['Best Deal Today', 'Fastest Delivery', 'Lowest Total Cost', 'Pickup Specials'].map(tag => (
              <button key={tag} type="button" className="text-xs sm:text-sm font-bold text-stone-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-2 px-4 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all">
                {tag}
              </button>
            ))}
          </div>
        </form>

        {/* Live Comparison Results */}
        {currentConfig && quotes.length > 0 && (
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="w-full mt-12 text-left"
          >
             <h3 className="text-xl font-bold text-white mb-6">Live Comparison Results</h3>
             <ComparisonCards 
                quotes={quotes}
                favoriteStores={favoriteStores}
                onToggleFavoriteStore={onToggleFavoriteStore}
                onAddReview={onAddReview}
                onAddToCart={onAddToCart}
                currentConfig={currentConfig}
             />
          </motion.div>
        )}
      </section>

      {/* SECTION 4 - BUILD YOUR OWN PIZZA */}
      <section className="w-full max-w-5xl mx-auto mb-20 px-4 relative z-10">
        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 sm:p-12 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center justify-between gap-8 group">
          {/* Subtle neon glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="relative z-10 max-w-xl text-center md:text-left order-2 md:order-1">
             <h2 className="text-3xl font-black text-white mb-4">Can't Find It? <span className="text-red-500">Build Your Pizza</span></h2>
             <p className="text-stone-300 mb-8 text-lg font-medium">Design your exact craving in our interactive 3D builder and compare prices across all local chains instantly.</p>
             <button 
                onClick={() => onNavigate('pizza-builder')}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black py-4 px-8 rounded-2xl shadow-[0_0_30px_rgba(255,50,0,0.4)] hover:shadow-[0_0_40px_rgba(255,50,0,0.6)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center md:justify-start gap-3 w-full md:w-auto mx-auto md:mx-0 border border-orange-400/50"
             >
               <Pizza className="w-6 h-6" />
               Start Building
               <ArrowRight className="w-5 h-5 ml-2" />
             </button>
          </div>

          <div className="relative z-10 w-full max-w-xs md:w-1/2 aspect-square order-1 md:order-2 flex items-center justify-center pointer-events-none pb-12">
             <div className="transform scale-90 md:scale-105">
                <Pizza3DBuilder config={{
                  ...DEFAULT_CONFIG,
                  meats: ['Pepperoni', 'Sausage'],
                  veggies: ['Mushrooms', 'Green Peppers']
                }} />
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 - SAVE MONEY SECTION */}
      <section className="w-full max-w-6xl mx-auto mb-20 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: 'Average Savings Today', value: '$6.21', icon: DollarSign, color: 'text-green-500' },
             { label: 'Stores Compared', value: '43', icon: ShieldCheck, color: 'text-blue-500' },
             { label: 'Active Deals', value: '127', icon: Zap, color: 'text-yellow-500' },
             { label: 'Users Saving Money', value: '12.4k', icon: Users, color: 'text-purple-500' }
           ].map((stat, i) => (
             <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center transform transition-transform hover:-translate-y-1 hover:bg-white/10">
               <stat.icon className={`w-8 h-8 mx-auto mb-4 ${stat.color}`} />
               <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
               <div className="text-sm font-bold text-stone-400">{stat.label}</div>
             </div>
           ))}
        </div>
      </section>

      {/* SECTION 6 - FEATURES */}
      <section className="w-full max-w-6xl mx-auto px-4 text-center">
         <h2 className="text-2xl font-black text-white mb-10">Why Use MiSlice?</h2>
         <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
           {[
             { label: 'Real-Time Pricing', icon: Clock },
             { label: 'Verified Store Prices', icon: ShieldCheck },
             { label: 'Delivery Comparison', icon: Zap },
             { label: 'Pickup Comparison', icon: MapPin },
             { label: 'Smart Recommendations', icon: PieChart }
           ].map((feature, i) => (
             <div key={i} className="flex flex-col items-center">
               <div className="w-16 h-16 bg-stone-800/80 backdrop-blur-sm border border-stone-700 rounded-2xl flex items-center justify-center mb-4 text-stone-300">
                 <feature.icon className="w-8 h-8" />
               </div>
               <span className="font-bold text-sm text-stone-300 max-w-[120px] leading-tight">{feature.label}</span>
             </div>
           ))}
         </div>
      </section>

    </div>
  );
}
