import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Sparkles, Search, Mic, Star, Zap, Shield, TrendingDown,
  Check, Crown, ChevronRight, Lock,
} from 'lucide-react';

interface PremiumUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'yearly') => void;
}

const FEATURES = [
  { icon: Search,      label: 'AI Smart Search',           desc: 'Natural language pizza search — "vegan for 6 under $50"' },
  { icon: Mic,         label: 'Voice Search',               desc: 'Hands-free search with your microphone' },
  { icon: Star,        label: 'Personalised Picks',         desc: 'Recommendations that learn your taste over time' },
  { icon: TrendingDown,label: 'Price Drop Alerts',          desc: 'Get notified when your favourite pizza goes on sale' },
  { icon: Zap,         label: 'Instant Compare',            desc: 'Skip the queue — one tap to the cheapest store' },
  { icon: Shield,      label: 'Ad-free Experience',         desc: 'Zero ads, zero distractions' },
];

const PLANS = [
  {
    id: 'monthly' as const,
    label: 'Monthly',
    price: '$4.99',
    per: '/mo',
    sub: 'Cancel any time',
    highlight: false,
    badge: '',
  },
  {
    id: 'yearly' as const,
    label: 'Annual',
    price: '$39.99',
    per: '/yr',
    sub: 'That\'s $3.33/mo',
    highlight: true,
    badge: 'Best Value · Save 33%',
  },
];

export function PremiumUpgradeModal({ open, onClose, onSubscribe }: PremiumUpgradeModalProps) {
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = () => {
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      onSubscribe(selected);
    }, 1400);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[301] max-w-lg mx-auto bg-[#0C0F1E] border border-white/10 rounded-3xl shadow-[0_40px_120px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-br from-violet-600/20 via-red-600/10 to-transparent border-b border-white/8">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_rgba(251,146,60,0.4)]">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">MiSlice Pro</h2>
              <p className="text-stone-400 text-sm mt-1">Unlock the full power of pizza search</p>
            </div>

            {/* Feature list */}
            <div className="px-6 py-4 grid grid-cols-1 gap-2.5">
              {FEATURES.map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{f.label}</p>
                      <p className="text-[11px] text-stone-500 leading-snug">{f.desc}</p>
                    </div>
                    <Check className="w-4 h-4 text-green-400 shrink-0 mt-1 ml-auto" />
                  </div>
                );
              })}
            </div>

            {/* Plan selector */}
            <div className="px-6 py-4 border-t border-white/8">
              <div className="grid grid-cols-2 gap-3">
                {PLANS.map(plan => (
                  <motion.button
                    key={plan.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(plan.id)}
                    className={`relative p-4 rounded-2xl border text-left transition-all ${
                      selected === plan.id
                        ? 'border-amber-400/60 bg-amber-500/12 shadow-[0_0_20px_rgba(251,146,60,0.2)]'
                        : 'border-white/10 bg-white/4 hover:border-white/20'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-amber-400 text-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        {plan.badge}
                      </span>
                    )}
                    <div className={`w-4 h-4 rounded-full border-2 mb-2 flex items-center justify-center ${
                      selected === plan.id ? 'border-amber-400 bg-amber-400' : 'border-white/20'
                    }`}>
                      {selected === plan.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <p className="text-xs font-black text-stone-400 uppercase tracking-wide">{plan.label}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-white">{plan.price}</span>
                      <span className="text-xs text-stone-500">{plan.per}</span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-0.5">{plan.sub}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_8px_24px_rgba(251,146,60,0.4)] hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Unlock MiSlice Pro · {selected === 'yearly' ? '$39.99/yr' : '$4.99/mo'}
                  </>
                )}
              </motion.button>
              <p className="text-center text-[10px] text-stone-600 mt-2">
                Secure payment · Cancel any time · Instant access
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
