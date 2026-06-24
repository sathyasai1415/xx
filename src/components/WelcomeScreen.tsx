import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pizza, User, Store, ArrowRight, ChevronLeft, Lock, Eye, EyeOff, Mail, PlayCircle, Bike, X } from 'lucide-react';
import { MinionsBackground } from './MinionsBackground';
import { useAuth } from '../store/AuthContext';

type Role = 'customer' | 'store_owner';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/email-already-in-use': 'Account already exists. Try signing in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

export function WelcomeScreen({ onDemo, onCustomerDemo }: { onDemo: () => void; onCustomerDemo: () => void }) {
  const { loginOrRegister } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  const reset = () => { setError(''); setName(''); setEmail(''); setStoreName(''); setPassword(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (role === 'store_owner' && !storeName.trim()) { setError('Please enter your store name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      await loginOrRegister(email.trim().toLowerCase(), password, role!, name.trim(), storeName.trim() || undefined);
    } catch (err: any) {
      const code: string = err?.code ?? '';
      setError(FIREBASE_ERRORS[code] || 'Something went wrong. Try again.');
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

                {/* Delivery partner */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowDriverModal(true)}
                  className="clay-btn w-full bg-white p-5 flex items-center gap-4 text-left group"
                >
                  <div className="clay-soft w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-emerald-500">
                    <Bike className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-stone-800">Delivery Partner</p>
                    <p className="text-xs text-stone-400 mt-0.5">Accept deliveries, track earnings & routes.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-all shrink-0" />
                </motion.button>

                {/* Demo option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onDemo}
                  className="w-full border-2 border-dashed border-orange-300/60 rounded-[1.5rem] p-4 flex items-center gap-4 text-left group hover:border-orange-400/80 transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 text-orange-500 group-hover:bg-orange-100 transition-colors">
                    <PlayCircle className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-stone-700">Preview Store Owner Demo</p>
                    <p className="text-xs text-stone-400 mt-0.5">Explore the full dashboard with realistic mock data — no login needed.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-orange-300 group-hover:translate-x-1 transition-all shrink-0" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onCustomerDemo}
                  className="w-full border-2 border-dashed border-red-300/60 rounded-[1.5rem] p-4 flex items-center gap-4 text-left group hover:border-red-400/80 transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 text-red-500 group-hover:bg-red-100 transition-colors">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-stone-700">Preview Customer Demo</p>
                    <p className="text-xs text-stone-400 mt-0.5">Explore the customer experience — no login needed.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-red-300 group-hover:translate-x-1 transition-all shrink-0" />
                </motion.button>
              </motion.div>
            )}

            {/* ── Step 2: Enter details + login/register ── */}
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
                    <p className="text-stone-400 text-xs">Sign in or create an account</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-2xl">
                    {error}
                  </div>
                )}

                <form onSubmit={submit} className="space-y-3.5">
                  <Field icon={User} placeholder="Your full name" value={name} onChange={setName} autoFocus />
                  <Field icon={Mail} placeholder="Email address" value={email} onChange={setEmail} type="email" />

                  {role === 'store_owner' && (
                    <Field icon={Store} placeholder="Store name (e.g. Motor City Pies)" value={storeName} onChange={setStoreName} />
                  )}

                  {/* Password */}
                  <div className="clay-inset flex items-center gap-2.5 px-4 focus-within:ring-2 focus-within:ring-amber-300/60 transition-all">
                    <Lock className="w-4 h-4 text-stone-400 shrink-0" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Password (min. 6 characters)"
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
                      <>Sign In / Register <ArrowRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                </form>

                <p className="text-center text-[11px] text-stone-400 mt-5 font-medium">
                  New? We'll create your account automatically.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="text-center text-stone-300 text-[10px] font-bold mt-8">MiSlice © 2026 · Michigan</p>
      </div>

      {/* Delivery Partner — Vision & Coming Soon modal */}
      <AnimatePresence>
        {showDriverModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDriverModal(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pointer-events-none"
            >
              <div className="clay rounded-[2rem] w-full max-w-sm pointer-events-auto relative overflow-hidden max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-7 pb-6 text-white relative">
                  <button
                    onClick={() => setShowDriverModal(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                    <Bike className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-black mb-1">Delivery Partner Login</h2>
                  <p className="text-emerald-100 text-xs font-medium leading-relaxed">
                    Coming soon — here's how it will work.
                  </p>
                </div>

                <div className="px-6 py-5 space-y-5">

                  {/* How it works */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">How It Works</p>
                    <div className="space-y-3">
                      {[
                        {
                          step: '1',
                          color: 'bg-blue-100 text-blue-600',
                          title: 'You get a delivery offer',
                          desc: 'A MiSlice order appears in your DoorDash, UberEats, or GrubHub app just like any other delivery request.',
                        },
                        {
                          step: '2',
                          color: 'bg-violet-100 text-violet-600',
                          title: 'Tap "Open in MiSlice"',
                          desc: "Before picking up, you'll see a prompt inside your delivery app to redirect to MiSlice for order verification.",
                        },
                        {
                          step: '3',
                          color: 'bg-orange-100 text-orange-600',
                          title: 'Scan the QR code on the order',
                          desc: 'At the restaurant, scan the QR code printed on the order bag. This confirms you are the assigned driver.',
                        },
                        {
                          step: '4',
                          color: 'bg-emerald-100 text-emerald-600',
                          title: 'Order is released to you',
                          desc: 'Once verified, the order is locked to your pickup. No other person can claim or walk off with it.',
                        },
                      ].map(s => (
                        <div key={s.step} className="flex gap-3 items-start">
                          <div className={`w-7 h-7 rounded-xl ${s.color} flex items-center justify-center shrink-0 text-xs font-black`}>
                            {s.step}
                          </div>
                          <div>
                            <p className="text-sm font-black text-stone-800">{s.title}</p>
                            <p className="text-xs text-stone-500 leading-relaxed mt-0.5">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Why this matters */}
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Why this exists</p>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      MiSlice uses QR scan verification to <span className="font-black">eliminate missing or stolen orders</span>. Only the assigned, authenticated delivery partner from DoorDash, UberEats, GrubHub, or MiSlice's own fleet can scan and pick up an order. Everyone else is blocked — no exceptions.
                    </p>
                  </div>

                  {/* Supported platforms */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Supported platforms (coming soon)</p>
                    <div className="flex flex-wrap gap-2">
                      {['DoorDash', 'UberEats', 'GrubHub', 'MiSlice Fleet'].map(p => (
                        <span key={p} className="text-[11px] font-bold bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full border border-stone-200">{p}</span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDriverModal(false)}
                    className="clay-accent w-full py-3.5 text-stone-900 font-black text-sm"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
      <ArrowRight className={`w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-all shrink-0`} />
    </motion.button>
  );
}

function Field({ icon: Icon, value, onChange, type = 'text', ...rest }: {
  icon: React.ElementType; value: string; onChange: (v: string) => void;
  placeholder?: string; autoFocus?: boolean; type?: string;
}) {
  return (
    <div className="clay-inset flex items-center gap-2.5 px-4 focus-within:ring-2 focus-within:ring-amber-300/60 transition-all">
      <Icon className="w-4 h-4 text-stone-400 shrink-0" />
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent py-3.5 text-stone-800 text-sm placeholder-stone-400 outline-none"
        {...rest}
      />
    </div>
  );
}
