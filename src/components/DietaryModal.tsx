import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Check } from 'lucide-react';

interface DietaryModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (prefs: { isVegetarian: boolean; allowedMeats: string[] }) => void;
  canClose?: boolean;
}

export function DietaryModal({ currentUser, isOpen, onClose, onSave, canClose = true }: DietaryModalProps) {
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [allowedMeats, setAllowedMeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const availableMeats = ["Pepperoni", "Italian Sausage", "Beef", "Ham", "Bacon", "Philly Steak", "Grilled Chicken", "Premium Chicken"];

  useEffect(() => {
    if (currentUser && isOpen) {
      getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
        if (snap.exists() && snap.data().dietary_preferences) {
          setIsVegetarian(snap.data().dietary_preferences.isVegetarian);
          setAllowedMeats(snap.data().dietary_preferences.allowedMeats || []);
        } else {
          // Defaults if not set
          setAllowedMeats(availableMeats);
        }
      });
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const toggleMeat = (meat: string) => {
    if (allowedMeats.includes(meat)) {
      setAllowedMeats(allowedMeats.filter(m => m !== meat));
    } else {
      setAllowedMeats([...allowedMeats, meat]);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    const prefs = {
      isVegetarian,
      allowedMeats: isVegetarian ? [] : allowedMeats
    };
    await setDoc(doc(db, 'users', currentUser.uid), { dietary_preferences: prefs }, { merge: true });
    onSave(prefs);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black tracking-tight text-white">Dietary Preferences</h2>
            {(onClose && canClose) && (
               <button onClick={onClose} className="p-2 text-stone-400 hover:text-white rounded-full bg-white/5 transition-colors">
                 <X className="w-5 h-5" />
               </button>
            )}
          </div>
          
          <p className="text-stone-400 text-sm mb-6">
            Please tell us about your dietary preferences so we only show you the toppings you want to eat.
          </p>

          <div className="space-y-6">
            <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
              <div>
                <p className="text-white font-bold">I am Vegetarian</p>
                <p className="text-stone-500 text-xs">I do not eat any meat.</p>
              </div>
              <button 
                onClick={() => setIsVegetarian(!isVegetarian)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isVegetarian ? 'bg-green-500' : 'bg-stone-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isVegetarian ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            {!isVegetarian && (
              <div className="space-y-3">
                <p className="text-stone-300 font-bold text-sm tracking-wide uppercase">Select Meats You Eat:</p>
                <div className="flex flex-wrap gap-2">
                  {availableMeats.map(meat => {
                    const selected = allowedMeats.includes(meat);
                    return (
                      <button
                        key={meat}
                        onClick={() => toggleMeat(meat)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                          selected 
                            ? 'bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]' 
                            : 'bg-black/40 border-white/10 text-stone-400 hover:bg-white/10'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3" />}
                        {meat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-white text-stone-900 font-black py-4 rounded-xl shadow-lg hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
