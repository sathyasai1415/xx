import React, { useState } from 'react';
import { Store as StoreIcon, Upload, ArrowRight, CheckCircle2, ChevronRight, Wand2, Download, Pizza, MapPin, Search } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export function AdminOnboarding({ storeData, onComplete }: { storeData: any, onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState(storeData?.store_name || '');
  const [address, setAddress] = useState(storeData?.address || '');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const handleComplete = async () => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'stores', auth.currentUser.uid), {
      is_setup_complete: true,
      store_name: storeName,
      address,
      setup_completed_at: new Date().toISOString()
    });
    onComplete();
  };

  const handleFakeUpload = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full pt-8 pb-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Welcome to MiSlice Store Setup</h1>
        <p className="text-stone-400">Let's get your restaurant online in under 5 minutes.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -z-10 -translate-y-1/2" />
        <div className="absolute top-1/2 left-0 h-0.5 bg-red-600 -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${((step - 1) / 4) * 100}%` }} />
        
        {['Store Info', 'Menu Import', 'Menu Builder', 'Delivery', 'Complete'].map((label, i) => (
          <div key={label} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${step > i ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(255,30,30,0.4)]' : step === i + 1 ? 'bg-black border-2 border-red-500 text-red-500' : 'bg-black border-2 border-white/20 text-stone-500'}`}>
              {step > i + 1 ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= i + 1 ? 'text-white' : 'text-stone-500'}`}>{label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_15px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Subtle Glow Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-white">Store Information</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4 col-span-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Store Name</label>
                      <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:bg-white/10 transition-colors" placeholder="e.g. Mario's Pizza" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Restaurant Type</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:bg-white/10 transition-colors appearance-none">
                      <option className="bg-stone-900">Pizza</option>
                      <option className="bg-stone-900">Italian</option>
                      <option className="bg-stone-900">Fast Food</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:bg-white/10 transition-colors" placeholder="(555) 123-4567" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Full Address</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:bg-white/10 transition-colors" placeholder="123 Pizza Street, Detroit, MI 48201" />
                  </div>
                  <div className="col-span-2 flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-stone-300">
                      <input type="checkbox" defaultChecked className="w-4 h-4 accent-red-500 rounded border-white/20 bg-white/5" /> Delivery Available
                    </label>
                    <label className="flex items-center gap-2 text-sm text-stone-300">
                      <input type="checkbox" defaultChecked className="w-4 h-4 accent-red-500 rounded border-white/20 bg-white/5" /> Pickup Available
                    </label>
                  </div>
                </div>
                <button onClick={() => setStep(2)} className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(255,30,30,0.3)] hover:shadow-[0_0_30px_rgba(255,30,30,0.5)]">
                  Continue to Menu Import
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 text-center py-8">
                <h2 className="text-2xl font-black text-white">Menu Import</h2>
                <p className="text-stone-400 mb-8">Choose how you'd like to import your menu items.</p>
                
                {!isScanning && !scanComplete ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div onClick={handleFakeUpload} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-red-500/50 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,30,30,0.2)] group">
                      <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Option A</h3>
                      <p className="text-white font-black mb-2">Upload Menu PDF</p>
                      <p className="text-xs text-stone-500">Supported: PDF, PNG, JPG</p>
                    </div>
                    <div onClick={() => setStep(3)} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-red-500/50 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,30,30,0.2)] group">
                      <div className="w-16 h-16 bg-stone-500/20 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform group-hover:text-red-500 group-hover:bg-red-500/20">
                        <Pizza className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Option B</h3>
                      <p className="text-white font-black mb-2">Manual Setup</p>
                      <p className="text-xs text-stone-500">Build menu manually</p>
                    </div>
                  </div>
                ) : isScanning ? (
                  <div className="py-20 flex flex-col items-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-red-500 animate-spin"></div>
                      <Wand2 className="w-8 h-8 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-white mt-8 mb-2">Scanning Menu...</h3>
                    <p className="text-stone-400">Extracting pizzas, sizes, and toppings</p>
                  </div>
                ) : (
                  <div className="text-left space-y-6">
                    <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-xl flex gap-4 items-center">
                      <CheckCircle2 className="text-green-400 w-8 h-8" />
                      <div>
                        <h4 className="text-white font-bold">Menu Extracted Successfully!</h4>
                        <p className="text-sm text-green-400/80">We found 12 pizzas and 24 toppings.</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden text-sm">
                      <div className="grid grid-cols-2 p-4 border-b border-white/10 font-bold text-stone-400 uppercase tracking-widest text-[10px]">
                        <span>Item</span>
                        <span className="text-right">Extracted Price</span>
                      </div>
                      {['Large Pizza', 'Pepperoni', 'Bacon', 'Ranch'].map((item, i) => (
                        <div key={item} className="grid grid-cols-2 p-4 border-b border-white/5 text-white">
                          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> {item}</span>
                          <span className="text-right">${i === 0 ? '15.99' : i === 1 ? '1.50' : i === 2 ? '2.00' : '0.75'}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setStep(3)} className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(255,30,30,0.3)] hover:shadow-[0_0_30px_rgba(255,30,30,0.5)]">
                      Review & Edit in Builder
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-white">Menu Builder</h2>
                  <p className="text-sm text-stone-400">Category-based pricing</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {['Base Pizzas', 'Sizes', 'Crusts', 'Sauces', 'Cheese', 'Meat', 'Veggie', 'Premium', 'Drinks'].map((cat, i) => (
                    <div key={cat} className={`p-4 rounded-xl border font-bold text-center cursor-pointer transition-colors ${i === 0 ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-white/5 border-white/10 text-stone-400 hover:bg-white/10 hover:text-white'}`}>
                      {cat}
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                   <h3 className="text-lg font-bold text-white mb-4">Base Pizzas</h3>
                   <div className="space-y-3">
                     {['Classic Cheese', 'Pepperoni', 'Veggie', 'BBQ Chicken'].map(pizza => (
                       <div key={pizza} className="flex justify-between items-center p-3 rounded-lg bg-black/40 border border-white/5">
                         <span className="text-white font-bold">{pizza}</span>
                         <div className="flex items-center gap-4">
                           <span className="text-stone-400 text-sm">Active</span>
                           <div className="w-10 h-5 bg-red-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button onClick={() => setStep(2)} className="text-stone-400 hover:text-white font-bold py-4 px-6 rounded-xl transition-colors">Back</button>
                  <button onClick={() => setStep(4)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-[0_0_20px_rgba(255,30,30,0.3)]">
                    Continue to Delivery
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-white">Delivery Settings</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Store Delivery</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Delivery Fee ($)</label>
                        <input type="number" defaultValue="4.99" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Delivery Radius (Miles)</label>
                        <input type="number" defaultValue="5" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Minimum Order ($)</label>
                        <input type="number" defaultValue="15" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Average ETA (Min)</label>
                        <input type="number" defaultValue="45" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Third Party Delivery Integrations</h3>
                    <div className="space-y-3">
                      {['Uber Eats', 'DoorDash', 'GrubHub'].map(app => (
                        <div key={app} className="flex justify-between items-center p-4 rounded-lg bg-black/40 border border-white/5">
                          <span className="text-white font-bold">{app}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-stone-400 text-sm">Enabled</span>
                            <div className="w-10 h-5 bg-red-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button onClick={() => setStep(3)} className="text-stone-400 hover:text-white font-bold py-4 px-6 rounded-xl transition-colors">Back</button>
                  <button onClick={() => setStep(5)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-[0_0_20px_rgba(255,30,30,0.3)]">
                    Review Details
                  </button>
                </div>
              </div>
            )}
            
            {step === 5 && (
              <div className="space-y-6 text-center py-8">
                <div className="w-24 h-24 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(74,222,128,0.2)]">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Setup Complete!</h2>
                <p className="text-stone-400 mb-8 max-w-lg mx-auto">Your store menu is now live and ready to accept orders. You can jump directly to your merchant dashboard to see live updates.</p>
                
                <button onClick={handleComplete} className="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-12 rounded-xl transition-colors shadow-[0_0_30px_rgba(255,30,30,0.5)] hover:shadow-[0_0_40px_rgba(255,30,30,0.7)] text-lg">
                  Go to Store Dashboard
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
