import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Store, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

interface StoreOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (storeName: string) => void;
}

// Local store login accounts: storeName -> password
const STORE_ACCOUNTS: Record<string, string> = {
  'Shamz Pizza': '1234',
  "Mario's Pizza": '5678',
  'Pizza Palace': '0000',
};

const LOCAL_STORE_KEY = 'miSliceStoreAccounts';

function loadLocalStoreAccounts(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LOCAL_STORE_KEY) || '{}'); }
  catch { return {}; }
}

function saveLocalStoreAccounts(accounts: Record<string, string>) {
  localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(accounts));
}

// Storefront thumbnails for demo accounts (served from /public)
const STORE_PHOTOS: Record<string, string> = {
  'Shamz Pizza': '/shamz-pizza-store.png',
};

export function StoreOwnerModal({ isOpen, onClose, onLogin }: StoreOwnerModalProps) {
  const [storeName, setStoreName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [newPin, setNewPin] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !pin.trim()) {
      setError('Enter your store name or ID and a password.');
      return;
    }
    setLoading(true);
    setError('');

    await new Promise(r => setTimeout(r, 600));

    const saved = loadLocalStoreAccounts();
    saved[storeName.trim()] = pin;
    saveLocalStoreAccounts(saved);

    onLogin(storeName.trim());
    onClose();
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !newPin.trim()) {
      setError('Enter a store name and password.');
      return;
    }
    setLoading(true);
    setError('');

    await new Promise(r => setTimeout(r, 600));

    const existing = loadLocalStoreAccounts();
    if (STORE_ACCOUNTS[storeName.trim()] || existing[storeName.trim()]) {
      setError('A store with this name already exists.');
      setLoading(false);
      return;
    }
    existing[storeName.trim()] = newPin;
    saveLocalStoreAccounts(existing);
    onLogin(storeName.trim());
    onClose();
    setLoading(false);
  };

  const demoAccounts = Object.entries(STORE_ACCOUNTS);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-stone-950 border border-white/10 rounded-3xl shadow-2xl p-7 overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-orange-500/5 pointer-events-none" />

            <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-stone-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Store Owner</h2>
                <p className="text-stone-500 text-xs font-medium">Manage your pizza store</p>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl border border-white/10 relative z-10">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'login' ? 'bg-red-600 text-white' : 'text-stone-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'register' ? 'bg-red-600 text-white' : 'text-stone-400 hover:text-white'}`}
              >
                Register Store
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-bold rounded-xl relative z-10">
                {error}
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">Store Name or ID</label>
                  <input
                    type="text"
                    list="store-names"
                    placeholder="Enter your store name or ID"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder-stone-600 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-colors"
                    required
                  />
                  <datalist id="store-names">
                    {demoAccounts.map(([name]) => <option key={name} value={name} />)}
                    {Object.keys(loadLocalStoreAccounts()).map(n => <option key={n} value={n} />)}
                  </datalist>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">PIN</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      placeholder="Enter your PIN"
                      value={pin}
                      onChange={e => setPin(e.target.value)}
                      className="w-full pl-10 pr-10 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder-stone-600 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-colors"
                      required
                    />
                    <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In to Dashboard'}
                </button>

                {/* Demo hint */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Demo Accounts</p>
                  <div className="space-y-1.5">
                    {demoAccounts.map(([name, p]) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => { setStoreName(name); setPin(p); }}
                        className="w-full flex items-center gap-3 text-xs font-bold text-stone-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                      >
                        {STORE_PHOTOS[name] ? (
                          <img src={STORE_PHOTOS[name]} alt={name} className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/20 flex items-center justify-center text-red-400 font-black text-sm flex-shrink-0">
                            {name.charAt(0)}
                          </div>
                        )}
                        <span className="flex-1 text-left">{name}</span>
                        <span className="text-stone-500">PIN: {p}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 relative z-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">Store Name</label>
                  <input
                    type="text"
                    placeholder="Your pizza store name"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder-stone-600 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">Create password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      placeholder="Enter a password"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value)}
                      className="w-full pl-10 pr-10 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder-stone-600 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-colors"
                      required
                    />
                    <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Store Account'}
                </button>

                <p className="text-[10px] text-stone-500 text-center">
                  Your store account is saved locally on this device.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
