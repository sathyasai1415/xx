import React from 'react';
import { Play, Film, Image as ImageIcon } from 'lucide-react';

export function HowItWorksView() {
  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-5xl font-black text-red-400 mb-12 text-center tracking-tight drop-shadow-[0_0_15px_rgba(248,113,113,0.8)] uppercase">
        How It Works
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
         {/* Video Card Fake */}
         <div className="bg-[#111118] border border-red-500/30 rounded-[2rem] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] group transition-transform hover:-translate-y-2">
            <div className="relative h-64 bg-black flex items-center justify-center overflow-hidden">
               <img src="/images/pizzas/cheese.jpg" alt="Video cover" className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
               <button className="w-20 h-20 bg-red-500/90 hover:bg-red-400 rounded-full flex items-center justify-center text-white font-black absolute z-10 transition-colors shadow-[0_0_20px_rgba(248,113,113,0.5)]">
                 <Play className="w-8 h-8 ml-2" />
               </button>
            </div>
            <div className="p-8">
               <h3 className="text-2xl font-black text-red-300 mb-4 tracking-wide">1. Build Your Craving</h3>
               <p className="text-xl text-stone-300 font-medium leading-relaxed">
                 Use our interactive 3D builder to craft exactly what you want. We support modular pricing across all top chains, automatically matching your toppings to their menus.
               </p>
            </div>
         </div>

         {/* Picture Card */}
         <div className="bg-[#111118] border border-blue-500/30 rounded-[2rem] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] group transition-transform hover:-translate-y-2">
            <div className="relative h-64 bg-stone-900 flex items-center justify-center overflow-hidden">
               <img src="/images/stores/white-horses-in-a-lush-forest.jpg" alt="Compare prices" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
               <ImageIcon className="w-16 h-16 text-blue-400 absolute z-10 drop-shadow-xl" />
            </div>
            <div className="p-8">
               <h3 className="text-2xl font-black text-blue-300 mb-4 tracking-wide">2. Compare & Save</h3>
               <p className="text-xl text-stone-300 font-medium leading-relaxed">
                 We instantly fetch live quotes from local stores. Compare delivery fees, subtotal, tax, and estimated times side-by-side to find the ultimate deal.
               </p>
            </div>
         </div>
      </div>
      
      <div className="bg-gradient-to-br from-red-900/50 to-[#0A0A0F] border border-red-500/30 p-10 rounded-[3rem] text-center shadow-[0_0_40px_rgba(232,0,45,0.2)]">
         <h3 className="text-4xl font-black text-red-500 mb-6 drop-shadow-[0_0_10px_rgba(232,0,45,0.6)]">Transparent Commission Model</h3>
         <p className="text-2xl font-bold text-stone-200 uppercase tracking-widest leading-loose">
           No hidden fees. <span className="text-green-400">Stores win.</span> <span className="text-red-400">Users win.</span>
         </p>
         <p className="text-lg text-stone-400 max-w-3xl mx-auto mt-6">
           MiSlice empowers local restaurants by routing orders directly to them with competitive, straightforward 20% platform fees—so you get the best pizza and stores keep more revenue.
         </p>
      </div>
    </div>
  );
}
