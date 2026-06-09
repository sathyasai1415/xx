import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Store, User } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'customer' | 'partner'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      // For a real app, we would store whether they are a partner or customer in Firestore.
      // Here, we just log them in. App.tsx will treat them based on the UI flow.
      await signInWithPopup(auth, provider);
      
      // If they chose Partner, we can save a local flag to force the Partner UI
      if (tab === 'partner') {
        localStorage.setItem('miSlice_isPartner', 'true');
      } else {
        localStorage.removeItem('miSlice_isPartner');
      }
      
      onClose();
    } catch (err: any) {
      console.warn(err); // use warn instead of error to not trigger automated prompt if expected
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 bg-stone-100 p-2 rounded-full">
               <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-black text-stone-900 mb-6 tracking-tight">Sign In</h2>
            
            <div className="flex gap-2 mb-6">
               <button 
                 onClick={() => setTab('customer')}
                 className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'customer' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
               >
                  <User className="w-4 h-4" />
                  Customer
               </button>
               <button 
                 onClick={() => setTab('partner')}
                 className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'partner' ? 'bg-red-600 text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
               >
                  <Store className="w-4 h-4" />
                  Partner
               </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-4">
               <p className="text-sm font-bold text-stone-500 text-center mb-4">
                 {tab === 'customer' 
                   ? 'Sign in to save your favorite pizza configurations and find the best local deals.' 
                   : 'Sign in to manage your local pizza store deals and profile.'}
               </p>
               
               <button onClick={handleGoogleSignIn} disabled={loading} className={`w-full py-3 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 ${tab === 'partner' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue with Google'}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
