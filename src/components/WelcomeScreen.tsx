import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pizza, User, Store, ArrowRight, Lock, Eye, EyeOff, Mail, PlayCircle, Bike, X, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { signInWithGoogle } from '../lib/auth';
import Lightfall from './Lightfall';
import BorderGlow from './BorderGlow';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/email-already-in-use': 'Account already exists. Try signing in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/operation-not-allowed': 'Sign-in method not enabled. Contact support.',
  'auth/popup-closed-by-user': 'Sign-in cancelled.',
  'auth/not-admin': 'This account is not an administrator.',
};

const LIGHTFALL_COLORS = ['#ff6b6b', '#dc2626', '#f97316', '#fbbf24', '#ff4444'];

type Mode = 'login' | 'store' | 'demo' | 'admin';

export function WelcomeScreen({ onDemo, onCustomerDemo }: { onDemo: () => void; onCustomerDemo: () => void }) {
  const { loginOrRegister, loginAsAdmin, switchSimulatedRole } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  const devLogin = async (role: string) => {
    setError('');
    setLoading(true);
    try {
      await loginOrRegister('sathyasai1415@gmail.com', '123456', 'customer', 'Sathyasai1415');
      switchSimulatedRole(role);
    } catch (err: any) {
      setError(err?.message || 'Developer demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => { setError(''); setName(''); setEmail(''); setStoreName(''); setPassword(''); };

  const googleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle(mode === 'store' ? 'store_owner' : 'customer');
    } catch (err: any) {
      const code: string = err?.code ?? '';
      setError(FIREBASE_ERRORS[code] || err?.message || 'Google sign-in failed. Try again.');
    } finally { setLoading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (mode === 'store' && !storeName.trim()) { setError('Please enter your store name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const role = mode === 'store' ? 'store_owner' : 'customer';
      await loginOrRegister(email.trim().toLowerCase(), password, role, name.trim(), storeName.trim() || undefined);
    } catch (err: any) {
      const code: string = err?.code ?? '';
      setError(FIREBASE_ERRORS[code] || err?.message || 'Something went wrong. Try again.');
    } finally { setLoading(false); }
  };

  const submitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      await loginAsAdmin(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const code: string = err?.code ?? '';
      setError(FIREBASE_ERRORS[code] || err?.message || 'Admin sign-in failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12 overflow-hidden"
      style={{ background: '#0f0005' }}>

      {/* Lightfall background */}
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
        />
      </div>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)', zIndex: 1 }} />

      <div className="relative z-10 w-full max-w-md">

        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-7">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-20 h-20 rounded-[28px] flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)', boxShadow: '0 8px 32px rgba(220,38,38,0.5)' }}
          >
            <Pizza className="w-9 h-9 text-white" />
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tight" style={{ textShadow: '0 2px 20px rgba(220,38,38,0.4)' }}>
            MiSlice
          </h1>
          <p className="text-white/50 text-sm mt-2 font-medium">Michigan's pizza marketplace</p>
        </div>

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
          <div className="p-7 sm:p-9">
            <AnimatePresence mode="wait">

              {/* ── Demo picker ── */}
              {mode === 'demo' && (
                <motion.div key="demo"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <button onClick={() => setMode('login')} className="text-xs font-bold text-white/40 hover:text-white/70 mb-2 flex items-center gap-1">
                    ← Back
                  </button>
                  <p className="text-center text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Try without signing in</p>
                  <DemoCard
                    icon={Store}
                    title="Store Owner Demo"
                    desc="Full dashboard with mock data"
                    color="from-orange-600 to-orange-500"
                    onClick={() => {
                      if (window.location.hostname === 'localhost' && import.meta.env.DEV) {
                        switchSimulatedRole('store_admin');
                        onCustomerDemo();
                      } else {
                        onDemo();
                      }
                    }}
                  />
                  <DemoCard
                    icon={User}
                    title="Customer Demo"
                    desc="Browse & compare pizzas"
                    color="from-red-600 to-pink-500"
                    onClick={() => {
                      if (window.location.hostname === 'localhost' && import.meta.env.DEV) {
                        switchSimulatedRole(null);
                        onCustomerDemo();
                      } else {
                        onCustomerDemo();
                      }
                    }}
                  />
                  <DemoCard
                    icon={Bike}
                    title="Delivery Partner"
                    desc={window.location.hostname === 'localhost' && import.meta.env.DEV ? "Simulate delivery runs" : "Coming soon"}
                    color="from-emerald-600 to-emerald-500"
                    onClick={() => {
                      if (window.location.hostname === 'localhost' && import.meta.env.DEV) {
                        switchSimulatedRole('delivery_driver');
                        onCustomerDemo();
                      } else {
                        setMode('login');
                        setShowDriverModal(true);
                      }
                    }}
                  />
                  <DemoCard
                    icon={ShieldCheck}
                    title="Platform Admin"
                    desc="Approve stores & manage platform"
                    color="from-red-700 to-red-900"
                    onClick={() => {
                      if (window.location.hostname === 'localhost' && import.meta.env.DEV) {
                        switchSimulatedRole('platform_admin');
                        onCustomerDemo();
                      } else {
                        setMode('admin');
                        clearForm();
                      }
                    }}
                  />
                </motion.div>
              )}

              {/* ── Admin sign-in ── */}
              {mode === 'admin' && (
                <motion.div key="admin"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                >
                  <button onClick={() => { setMode('login'); clearForm(); }} className="text-xs font-bold text-white/40 hover:text-white/70 mb-5 flex items-center gap-1">
                    ← Back
                  </button>

                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', boxShadow: '0 6px 20px rgba(220,38,38,0.4)' }}>
                      <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-lg font-black text-white">Platform Admin</p>
                    <p className="text-xs text-white/40 mt-1">Restricted access — administrators only</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-2xl text-xs font-bold"
                      style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5' }}>
                      {error}
                    </div>
                  )}

                  <form onSubmit={submitAdmin} className="space-y-3">
                    <DarkField icon={Mail} placeholder="Admin email" value={email} onChange={setEmail} type="email" autoFocus />
                    <div className="flex items-center gap-2.5 px-4 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Lock className="w-4 h-4 text-white/30 shrink-0" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Password"
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
                      className="w-full py-4 font-black text-white flex items-center justify-center gap-2 rounded-2xl disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', boxShadow: '0 6px 24px rgba(220,38,38,0.4)' }}
                    >
                      {loading
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><ShieldCheck className="w-4 h-4" /> Sign in as Admin</>
                      }
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* ── Main login/register form ── */}
              {(mode === 'login' || mode === 'store') && (
                <motion.div key="form"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                >
                  {/* Role toggle */}
                  <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {(['login', 'store'] as Mode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => { setMode(m); clearForm(); }}
                        className="flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                        style={mode === m
                          ? { background: 'linear-gradient(135deg,#dc2626,#f97316)', color: '#fff', boxShadow: '0 2px 8px rgba(220,38,38,0.4)' }
                          : { color: 'rgba(255,255,255,0.35)' }
                        }
                      >
                        {m === 'login' ? <><User className="w-3 h-3" /> Customer</> : <><Store className="w-3 h-3" /> Store Owner</>}
                      </button>
                    ))}
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-2xl text-xs font-bold"
                      style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5' }}>
                      {error}
                    </div>
                  )}

                  {/* Google */}
                  <motion.button
                    type="button"
                    onClick={googleSignIn}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-bold text-white/80 mb-4 transition-all disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </motion.button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  </div>

                  {/* Email/password form */}
                  <form onSubmit={submit} className="space-y-3">
                    <DarkField icon={User} placeholder="Your full name" value={name} onChange={setName} autoFocus />
                    <DarkField icon={Mail} placeholder="Email address" value={email} onChange={setEmail} type="email" />
                    {mode === 'store' && (
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
                      className="w-full py-4 font-black text-white flex items-center justify-center gap-2 rounded-2xl disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)', boxShadow: '0 6px 24px rgba(220,38,38,0.4)' }}
                    >
                      {loading
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <>Sign In / Register <ArrowRight className="w-4 h-4" /></>
                      }
                    </motion.button>
                  </form>

                  {mode === 'store' && (
                    <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Dev Demo Logins (ID: 1234567)</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setName('Store Admin');
                            setEmail('admin@zumbo.com');
                            setStoreName('Zumbo Pizza');
                            setPassword('123456');
                          }}
                          className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white font-bold transition-all border border-white/5"
                        >
                          👑 Store Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setName('Jane Manager');
                            setEmail('manager@zumbo.com');
                            setStoreName('Zumbo Pizza');
                            setPassword('123456');
                          }}
                          className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white font-bold transition-all border border-white/5"
                        >
                          📋 Manager
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setName('Bob Cook');
                            setEmail('kitchen@zumbo.com');
                            setStoreName('Zumbo Pizza');
                            setPassword('123456');
                          }}
                          className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white font-bold transition-all border border-white/5"
                        >
                          🍳 Kitchen Staff
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setName('Alice Register');
                            setEmail('cashier@zumbo.com');
                            setStoreName('Zumbo Pizza');
                            setPassword('123456');
                          }}
                          className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white font-bold transition-all border border-white/5"
                        >
                          💵 Cashier
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-center text-[11px] text-white/25 mt-4">
                    New? We'll create your account automatically.
                  </p>

                  {/* Try demo link */}
                  <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      onClick={() => setMode('demo')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white/35 hover:text-white/60 transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Try a demo without signing in
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </BorderGlow>

        {mode !== 'admin' && (
          <button
            onClick={() => { setMode('admin'); clearForm(); }}
            className="mx-auto mt-6 flex items-center gap-1.5 text-[11px] font-bold text-white/25 hover:text-white/60 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Admin sign in
          </button>
        )}

        {window.location.hostname === 'localhost' && import.meta.env.DEV && (
          <div className="mt-8 p-5 rounded-[2rem] bg-white/[0.03] border border-white/10 max-w-sm mx-auto space-y-3 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-center text-orange-400">
              🛠️ Local Development Quick Auth
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => devLogin('customer')}
                className="col-span-2 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-black transition-all hover:brightness-110 shadow-lg"
              >
                Continue as Customer
              </button>
              <button
                type="button"
                onClick={() => devLogin('store_employee')}
                className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-all border border-white/5"
              >
                Store Employee
              </button>
              <button
                type="button"
                onClick={() => devLogin('store_admin')}
                className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-all border border-white/5"
              >
                Store Admin
              </button>
              <button
                type="button"
                onClick={() => devLogin('delivery_driver')}
                className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-all border border-white/5"
              >
                Delivery Driver
              </button>
              <button
                type="button"
                onClick={() => devLogin('towing_driver')}
                className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-all border border-white/5"
              >
                Towing Driver
              </button>
              <button
                type="button"
                onClick={() => devLogin('merchant')}
                className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-all border border-white/5"
              >
                Merchant
              </button>
              <button
                type="button"
                onClick={() => devLogin('support_agent')}
                className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-all border border-white/5"
              >
                Support Agent
              </button>
              <button
                type="button"
                onClick={() => devLogin('platform_admin')}
                className="col-span-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-all border border-white/5"
              >
                Platform Admin
              </button>
            </div>
            
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => devLogin('platform_admin')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md"
              >
                Platform Admin Demo
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-white/15 text-[10px] font-bold mt-4">MiSlice © 2026 · Michigan</p>
      </div>

      {/* Delivery Partner Modal */}
      <AnimatePresence>
        {showDriverModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDriverModal(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="w-full max-w-sm pointer-events-auto relative rounded-[2rem] overflow-hidden max-h-[90vh] overflow-y-auto"
                style={{ background: '#130f1a', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 pt-7 pb-6 text-white relative">
                  <button onClick={() => setShowDriverModal(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                    <Bike className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-black mb-1">Delivery Partner</h2>
                  <p className="text-emerald-100 text-xs font-medium">Coming soon — here's how it will work.</p>
                </div>
                <div className="px-6 py-5">
                  <button onClick={() => setShowDriverModal(false)}
                    className="w-full py-3.5 rounded-2xl font-black text-sm text-white mt-2"
                    style={{ background: 'linear-gradient(135deg,#059669,#34d399)' }}>
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

function DemoCard({ icon: Icon, title, desc, color, onClick }: {
  icon: React.ElementType; title: string; desc: string; color: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-xs text-white/35 mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-white/20 shrink-0" />
    </motion.button>
  );
}

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
