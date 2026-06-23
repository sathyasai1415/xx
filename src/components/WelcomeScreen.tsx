import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pizza, User, Store, ArrowRight, ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { MinionsBackground } from './MinionsBackground';
import { useAuth } from '../store/AuthContext';

const PASSWORD = '123456';

type Role = 'customer' | 'store_owner';

export function WelcomeScreen() {
  const { loginLocal } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setError(''); setName(''); setStoreName(''); setPassword(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (role === 'store_owner' && !storeName.trim()) { setError('Please enter your store name.'); return; }
    if (password !== PASSWORD) { setError('Incorrect password. Hint: 123456'); return; }

    setLoading(true);
    try {
      const slug = (role === 'store_owner' ? storeName : name)
        .trim().toLowerCase().replace(/\s+/g, '-');

      await loginLocal({
        uid: `${role}-${slug}`,
        email: `${slug}@mislice.local`,
        fullName: name.trim(),
        role,
        ...(role === 'store_owner' && {
          storeId: slug,
          storeName: storeName.trim(),
        }),
      });
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clay-page relative min-h-screen w-full flex items-center justify-center px-4 py-16 overflow-hidden">
      <MinionsBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="clay w-20 h-20 rounded-[28px] flex items-center justify-center mb-5"
          >
            <Pizza className="w-9 h-9 text-amber-500" />
          </motion.div>
          <h1 className="text-4xl font-black text-stone-800 tracking-tight">MiSlice</h1>
          <p className="text-stone-400 text-sm mt-2 font-medium">Compare pizza prices across Michigan.</p>
        </div>

        {/* Card */}
        <div className="clay rounded-[2.5rem] p-8 sm:p-10">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Choose role ── */}
            {!role && (
              <motion.div key="choose"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <p className="text-center text-stone-500 text-sm font-semibold mb-4">How would you like to continue?</p>

                <RoleCard
                  icon={User}
                  iconColor="text-red-500"
                  title="Customer"
                  desc="Order pizza, compare prices, track delivery."
                  onClick={() => { reset(); setRole('customer'); }}
                />
                <RoleCard
                  icon={Store}
                  iconColor="text-sky-500"
                  title="Store Admin"
                  desc="Manage your menu, prices, deals & orders."
                  onClick={() => { reset(); setRole('store_owner'); }}
                />

                <p className="text-center text-[11px] text-stone-400 pt-3 font-medium">
                  Password for both roles: <span className="font-black text-stone-600">123456</span>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: Enter name + password ── */}
            {role && (
              <motion.div key="form"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              >
                {/* Back */}
                <button
                  onClick={() => { setRole(null); reset(); }}
                  className="flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-stone-700 transition-colors mb-6"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                {/* Role badge */}
                <div className="flex items-center gap-3 mb-7">
                  <div className={`clay-soft w-12 h-12 rounded-2xl flex items-center justify-center ${role === 'store_owner' ? 'text-sky-500' : 'text-red-500'}`}>
                    {role === 'store_owner' ? <Store className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-stone-800">
                      {role === 'store_owner' ? 'Store Admin' : 'Customer'}
                    </h2>
                    <p className="text-stone-400 text-xs">Enter your details to continue</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-2xl">
                    {error}
                  </div>
                )}

                <form onSubmit={submit} className="space-y-3.5">
                  {/* Name */}
                  <Field
                    icon={User}
                    placeholder="Your name"
                    value={name}
                    onChange={setName}
                    autoFocus
                  />

                  {/* Store name — only for store owner */}
                  {role === 'store_owner' && (
                    <Field
                      icon={Store}
                      placeholder="Store name"
                      value={storeName}
                      onChange={setStoreName}
                    />
                  )}

                  {/* Password */}
                  <div className="clay-inset flex items-center gap-2.5 px-4 focus-within:ring-2 focus-within:ring-amber-300/60 transition-all">
                    <Lock className="w-4 h-4 text-stone-400 shrink-0" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full bg-transparent py-3.5 text-stone-800 text-sm placeholder-stone-400 outline-none"
                    />
                    <button type="button" onClick={() => setShowPw(s => !s)} className="text-stone-400 hover:text-stone-700 transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="clay-accent w-full py-4 mt-1 text-stone-900 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-stone-700/30 border-t-stone-700 rounded-full animate-spin" />
                    ) : (
                      <>Enter <ArrowRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                </form>

                <p className="text-center text-[11px] text-stone-400 mt-5 font-medium">
                  Hint: password is <span className="font-black text-stone-600">123456</span>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="text-center text-stone-300 text-[10px] font-bold mt-8">MiSlice © 2026 · Michigan</p>
      </div>
    </div>
  );
}

function RoleCard({ icon: Icon, iconColor, title, desc, onClick }: {
  icon: React.ElementType; iconColor: string; title: string; desc: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="clay-btn w-full bg-white p-5 flex items-center gap-4 text-left group"
    >
      <div className={`clay-soft w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-black text-stone-800">{title}</p>
        <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
      </div>
      <ArrowRight className={`w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-all shrink-0 group-hover:${iconColor}`} />
    </motion.button>
  );
}

function Field({ icon: Icon, value, onChange, ...rest }: {
  icon: React.ElementType; value: string; onChange: (v: string) => void;
  placeholder?: string; autoFocus?: boolean;
}) {
  return (
    <div className="clay-inset flex items-center gap-2.5 px-4 focus-within:ring-2 focus-within:ring-amber-300/60 transition-all">
      <Icon className="w-4 h-4 text-stone-400 shrink-0" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent py-3.5 text-stone-800 text-sm placeholder-stone-400 outline-none"
        {...rest}
      />
    </div>
  );
}
