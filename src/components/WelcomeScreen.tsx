import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pizza, User, Store, ArrowRight, ChevronLeft, Sparkles, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signUpCustomer, signUpStoreOwner, signIn, signInWithGoogle, resetPassword, AuthError } from '../lib/auth';

type Step = 'choose' | 'customer' | 'store_owner';
type Mode = 'login' | 'signup';

export function WelcomeScreen() {
  const [step, setStep] = useState<Step>('choose');
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPw, setShowPw] = useState(false);

  // form fields
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const reset = () => { setError(''); setNotice(''); };
  const goChoose = () => { setStep('choose'); setMode('login'); reset(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      if (step === 'customer') {
        if (mode === 'signup') await signUpCustomer({ email, password, fullName, phone });
        else await signIn(email, password);
      } else if (step === 'store_owner') {
        if (mode === 'signup') await signUpStoreOwner({ email, password, fullName, storeName, phone });
        else await signIn(email, password);
      }
      // On success the AuthProvider listener routes the app automatically.
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    reset();
    setLoading(true);
    try {
      await signInWithGoogle();
      // AuthProvider listener routes the app on success.
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    reset();
    if (!email.trim()) { setError('Enter your email above first, then tap reset.'); return; }
    try {
      await resetPassword(email);
      setNotice('Password reset email sent — check your inbox.');
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not send reset email.');
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder-stone-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-colors';
  const isOwner = step === 'store_owner';

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-5 py-12 bg-[#080808] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-orange-600/15 blur-[120px]" />
        <div className="absolute -bottom-32 -right-24 w-[32rem] h-[32rem] rounded-full bg-red-600/12 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,80,0,0.45)] mb-5">
            <Pizza className="w-8 h-8 text-white" />
          </div>
          <div className="inline-flex items-center gap-2 glass-soft text-stone-300 text-[10px] font-black px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3 h-3 text-orange-300" /> Michigan's Pizza Price Comparison
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Welcome to MiSlice</h1>
          <p className="text-stone-400 text-sm mt-2">Choose how you'd like to continue.</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'choose' ? (
            <motion.div key="choose" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
              <button onClick={() => { setStep('customer'); reset(); }}
                className="w-full liquid-glass rounded-3xl p-6 flex items-center gap-4 text-left group hover:border-white/25 transition-colors">
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6 text-orange-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-black text-white">Continue as Customer</p>
                  <p className="text-xs text-stone-400 mt-0.5">Compare prices, order pizza, track delivery & earn rewards.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              <button onClick={() => { setStep('store_owner'); reset(); }}
                className="w-full glass rounded-3xl p-6 flex items-center gap-4 text-left group hover:border-white/25 transition-colors">
                <div className="w-14 h-14 rounded-2xl glass-soft flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Store className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-black text-white">Continue as Store Owner</p>
                  <p className="text-xs text-stone-400 mt-0.5">Manage your store, menu, prices, deals & live orders.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="glass rounded-3xl p-7">
              <button onClick={goChoose} className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-white transition-colors mb-5">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isOwner ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
                  {isOwner ? <Store className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{isOwner ? 'Store Owner' : 'Customer'}</h2>
                  <p className="text-stone-500 text-xs">{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl mb-5">
                {(['login', 'signup'] as Mode[]).map(m => (
                  <button key={m} type="button" onClick={() => { setMode(m); reset(); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${mode === m ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : 'text-stone-400 hover:text-white'}`}>
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {error && <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-bold rounded-xl">{error}</div>}
              {notice && <div className="mb-4 p-3 bg-green-950/40 border border-green-500/30 text-green-300 text-xs font-bold rounded-xl">{notice}</div>}

              <form onSubmit={submit} className="space-y-3">
                {mode === 'signup' && (
                  <input className={inputCls} placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                )}
                {mode === 'signup' && isOwner && (
                  <input className={inputCls} placeholder="Store name" value={storeName} onChange={e => setStoreName(e.target.value)} required />
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input type="email" className={inputCls + ' pl-10'} placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                {mode === 'signup' && (
                  <input className={inputCls} placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
                )}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input type={showPw ? 'text' : 'password'} className={inputCls + ' pl-10 pr-10'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white transition-all shadow-[0_10px_30px_-8px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>}
                </button>

                {mode === 'login' && (
                  <button type="button" onClick={onForgot} className="w-full text-[11px] font-bold text-stone-500 hover:text-stone-300 transition-colors pt-1">
                    Forgot password?
                  </button>
                )}
              </form>

              {!isOwner && (
                <>
                  <div className="flex items-center gap-3 my-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">or</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <button type="button" onClick={onGoogle} disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-white hover:bg-stone-100 text-stone-800 transition-colors flex items-center justify-center gap-3 disabled:opacity-60">
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-stone-700 text-[10px] font-bold mt-8">MiSlice © 2026 · Michigan</p>
      </div>
    </div>
  );
}
