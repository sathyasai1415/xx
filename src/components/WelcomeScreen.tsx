import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pizza, User, Store, ArrowRight, ChevronLeft, Lock, Eye, EyeOff, Mail, PlayCircle, Bike, X } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import Lightfall from './Lightfall';
import BorderGlow from './BorderGlow';

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

// MiSlice red/orange brand palette for Lightfall
const LIGHTFALL_COLORS = ['#ff6b6b', '#dc2626', '#f97316', '#fbbf24', '#ff4444'];

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
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-16 overflow-hidden"
      style={{ background: '#0f0005' }}>

      {/* ── Lightfall animated background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Lightfall
          colors={LIGHTFALL_COLORS}
          backgroundColor="#2a0808"
          speed={0.4}
          streakCount={6}
          streakWidth={0.8}
          streakLength={1.2}
          glow={1.2}
          density={0.5}
          twinkle={0.8}
          zoom={2.5}
          backgroundGlow={0.4}
          opacity={1}
          mouseInteraction={false}
          mouseStrength={0.4}
          mouseRadius={0.8}
          mouseDampening={0.2}
        />
      </div>

      {/* Dark vignette over the background so content pops */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
          zIndex: 1,
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-md">

        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-20 h-20 rounded-[28px] flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #f97316)',
              boxShadow: '0 8px 32px rgba(220,38,38,0.5)',
            }}
          >
            <Pizza className="w-9 h-9 text-white" />
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tight" style={{ textShadow: '0 2px 20px rgba(220,38,38,0.4)' }}>
            MiSlice
          </h1>
          <p className="text-white/50 text-sm mt-2 font-medium">Compare pizza prices across Michigan.</p>
        </div>

        {/* Main card with BorderGlow */}
        <BorderGlow
          backgroundColor="#130608"
          borderRadius={32}
          glowColor="0 75 65"
          glowRadius={48}
          glowIntensity={1.1}
          coneSpread={28}
          colors={['#dc2626', '#f97316', '#fbbf24']}
          fillOpacity={0.35}
        >
          <div className="p-8 sm:p-10">
            <AnimatePresence mode="wait">

              {/* ── Step 1: Choose role ── */}
              {!role && (
                <motion.div key="choose"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  className="space-y-3"
                >
                  <p className="text-center text-white/40 text-xs font-bold uppercase tracking-widest mb-5">
                    How would you like to continue?
                  </p>

                  {/* Customer */}
                  <GlowCard
                    icon={User} iconBg="from-red-600 to-red-500"
                    title="Customer" desc="Order pizza, compare prices, track delivery."
                    colors={['#dc2626', '#ef4444', '#f87171']}
                    onClick={() => { reset(); setRole('customer'); }}
                  />

                  {/* Store Admin */}
                  <GlowCard
                    icon={Store} iconBg="from-sky-600 to-sky-500"
                    title="Store Admin" desc="Manage your menu, prices, deals & orders."
                    colors={['#0284c7', '#38bdf8', '#7dd3fc']}
                    onClick={() => { reset(); setRole('store_owner'); }}
                  />

                  {/* Delivery Partner */}
                  <GlowCard
                    icon={Bike} iconBg="from-emerald-600 to-emerald-500"
                    title="Delivery Partner" desc="Accept deliveries, track earnings & routes."
                    colors={['#059669', '#34d399', '#6ee7b7']}
                    onClick={() => setShowDriverModal(true)}
                  />

                  <div className="pt-1 space-y-2">
                    {/* Preview Store Owner Demo */}
                    <GlowCard
                      icon={PlayCircle} iconBg="from-orange-600 to-orange-500"
                      title="Preview Store Owner Demo"
                      desc="Explore the full dashboard with realistic mock data — no login needed."
                      colors={['#ea580c', '#fb923c', '#fdba74']}
                      dashed
                      onClick={onDemo}
                    />
                    {/* Preview Customer Demo */}
                    <GlowCard
                      icon={User} iconBg="from-red-600 to-pink-500"
                      title="Preview Customer Demo"
                      desc="Explore the customer experience — no login needed."
                      colors={['#dc2626', '#f472b6', '#fda4af']}
                      dashed
                      onClick={onCustomerDemo}
                    />
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Enter details ── */}
              {role && (
                <motion.div key="form"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                >
                  <button
                    onClick={() => { setRole(null); reset(); }}
                    className="flex items-center gap-1 text-xs font-bold text-white/40 hover:text-white/70 transition-colors mb-6"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>

                  <div className="flex items-center gap-3 mb-7">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        background: role === 'store_owner'
                          ? 'linear-gradient(135deg,#0284c7,#38bdf8)'
                          : 'linear-gradient(135deg,#dc2626,#ef4444)',
                        boxShadow: role === 'store_owner'
                          ? '0 4px 16px rgba(2,132,199,0.4)'
                          : '0 4px 16px rgba(220,38,38,0.4)',
                      }}
                    >
                      {role === 'store_owner' ? <Store className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white">
                        {role === 'store_owner' ? 'Store Admin' : 'Customer'}
                      </h2>
                      <p className="text-white/40 text-xs">Sign in or create an account</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-2xl text-xs font-bold"
                      style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5' }}>
                      {error}
                    </div>
                  )}

                  <form onSubmit={submit} className="space-y-3">
                    <DarkField icon={User} placeholder="Your full name" value={name} onChange={setName} autoFocus />
                    <DarkField icon={Mail} placeholder="Email address" value={email} onChange={setEmail} type="email" />
                    {role === 'store_owner' && (
                      <DarkField icon={Store} placeholder="Store name (e.g. Motor City Pies)" value={storeName} onChange={setStoreName} />
                    )}
                    <div className="flex items-center gap-2.5 px-4 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Lock className="w-4 h-4 text-white/30 shrink-0" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Password (min. 6 characters)"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="w-full bg-transparent py-3.5 text-white text-sm placeholder:text-white/25 outline-none"
                      />
                      <button type="button" onClick={() => setShowPw(s => !s)} className="text-white/30 hover:text-white/60 transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-4 mt-1 font-black text-white flex items-center justify-center gap-2 rounded-2xl disabled:opacity-50 transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #dc2626, #f97316)',
                        boxShadow: '0 6px 24px rgba(220,38,38,0.4)',
                      }}
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Sign In / Register <ArrowRight className="w-4 h-4" /></>
                      )}
                    </motion.button>
                  </form>

                  <p className="text-center text-[11px] text-white/25 mt-5 font-medium">
                    New? We'll create your account automatically.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </BorderGlow>

        <p className="text-center text-white/15 text-[10px] font-bold mt-8">MiSlice © 2026 · Michigan</p>
      </div>

      {/* ── Delivery Partner Modal ── */}
      <AnimatePresence>
        {showDriverModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDriverModal(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pointer-events-none"
            >
              <div
                className="w-full max-w-sm pointer-events-auto relative overflow-hidden max-h-[90vh] overflow-y-auto rounded-[2rem]"
                style={{ background: '#130f1a', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 pt-7 pb-6 text-white relative">
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
                  <p className="text-emerald-100 text-xs font-medium leading-relaxed">Coming soon — here's how it will work.</p>
                </div>

                <div className="px-6 py-5 space-y-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">How It Works</p>
                    <div className="space-y-3">
                      {[
                        { step: '1', color: 'bg-blue-900/60 text-blue-300', title: 'You get a delivery offer', desc: 'A MiSlice order appears in your DoorDash, UberEats, or GrubHub app just like any other delivery request.' },
                        { step: '2', color: 'bg-violet-900/60 text-violet-300', title: 'Tap "Open in MiSlice"', desc: "Before picking up, you'll see a prompt inside your delivery app to redirect to MiSlice for order verification." },
                        { step: '3', color: 'bg-orange-900/60 text-orange-300', title: 'Scan the QR code on the order', desc: 'At the restaurant, scan the QR code printed on the order bag. This confirms you are the assigned driver.' },
                        { step: '4', color: 'bg-emerald-900/60 text-emerald-300', title: 'Order is released to you', desc: 'Once verified, the order is locked to your pickup. No other person can claim or walk off with it.' },
                      ].map(s => (
                        <div key={s.step} className="flex gap-3 items-start">
                          <div className={`w-7 h-7 rounded-xl ${s.color} flex items-center justify-center shrink-0 text-xs font-black`}>{s.step}</div>
                          <div>
                            <p className="text-sm font-black text-white">{s.title}</p>
                            <p className="text-xs text-white/40 leading-relaxed mt-0.5">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl px-4 py-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">Why this exists</p>
                    <p className="text-xs text-amber-200/70 font-medium leading-relaxed">
                      MiSlice uses QR scan verification to <span className="font-black text-amber-300">eliminate missing or stolen orders</span>. Only the assigned, authenticated delivery partner can scan and pick up an order.
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Supported platforms (coming soon)</p>
                    <div className="flex flex-wrap gap-2">
                      {['DoorDash', 'UberEats', 'GrubHub', 'MiSlice Fleet'].map(p => (
                        <span key={p} className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDriverModal(false)}
                    className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#059669,#34d399)', boxShadow: '0 4px 16px rgba(5,150,105,0.35)' }}
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

// ── GlowCard: BorderGlow-wrapped role/action button ──
function GlowCard({
  icon: Icon, iconBg, title, desc, colors, dashed = false, onClick,
}: {
  icon: React.ElementType; iconBg: string; title: string; desc: string;
  colors: string[]; dashed?: boolean; onClick: () => void;
}) {
  return (
    <BorderGlow
      backgroundColor="#1a0a0c"
      borderRadius={20}
      glowColor="0 75 65"
      glowRadius={36}
      glowIntensity={0.9}
      coneSpread={22}
      colors={colors}
      fillOpacity={0.3}
    >
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="w-full p-4 flex items-center gap-4 text-left group"
        style={dashed ? { borderTop: '1px dashed rgba(255,255,255,0.08)' } : {}}
      >
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${iconBg} flex items-center justify-center shrink-0`}
          style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white">{title}</p>
          <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all shrink-0" />
      </motion.button>
    </BorderGlow>
  );
}

// ── DarkField: dark-themed input ──
function DarkField({ icon: Icon, value, onChange, type = 'text', ...rest }: {
  icon: React.ElementType; value: string; onChange: (v: string) => void;
  placeholder?: string; autoFocus?: boolean; type?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <Icon className="w-4 h-4 text-white/30 shrink-0" />
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent py-3.5 text-white text-sm placeholder:text-white/25 outline-none"
        {...rest}
      />
    </div>
  );
}
