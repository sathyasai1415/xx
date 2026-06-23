import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Gift, Star, Zap, Award, ChevronRight, Check, Copy, Lock,
  ShoppingBag, Heart, Users, Pizza, TrendingUp, Sparkles,
} from 'lucide-react';

interface RewardTier {
  name: string;
  minPoints: number;
  color: string;
  bg: string;
  border: string;
  perks: string[];
  icon: string;
}

const TIERS: RewardTier[] = [
  { name: 'Bronze', minPoints: 0, color: 'text-red-700', bg: 'bg-red-800/15', border: 'border-red-700/30', perks: ['5% back on orders', 'Birthday deal'], icon: '🥉' },
  { name: 'Silver', minPoints: 500, color: 'text-stone-300', bg: 'bg-stone-400/10', border: 'border-stone-500/30', perks: ['7% back on orders', 'Free delivery once/month', 'Priority support'], icon: '🥈' },
  { name: 'Gold', minPoints: 1500, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', perks: ['10% back on orders', 'Free delivery always', 'Exclusive deals', 'Early access'], icon: '🥇' },
  { name: 'Platinum', minPoints: 5000, color: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/30', perks: ['15% back on orders', 'Free delivery always', 'VIP deals first', 'Store partner discounts', 'Personal pizza consultant'], icon: '💎' },
];

interface Reward {
  id: string;
  title: string;
  points: number;
  desc: string;
  emoji: string;
  category: string;
  available: boolean;
}

const REWARDS: Reward[] = [
  { id: 'r1', title: 'Free Garlic Bread', points: 100, desc: 'On your next order', emoji: '🥖', category: 'Food', available: true },
  { id: 'r2', title: '$2 Off Your Order', points: 150, desc: 'Minimum $12 order', emoji: '💸', category: 'Discount', available: true },
  { id: 'r3', title: 'Free Delivery', points: 200, desc: 'Valid for 7 days', emoji: '🚗', category: 'Delivery', available: true },
  { id: 'r4', title: '$5 Off Any Large Pizza', points: 350, desc: 'Any store, any size', emoji: '🍕', category: 'Discount', available: true },
  { id: 'r5', title: 'BOGO Free Pizza', points: 600, desc: 'Buy one get one free', emoji: '🎁', category: 'Deal', available: false },
  { id: 'r6', title: 'Free Extra Toppings', points: 80, desc: 'Up to 3 toppings free', emoji: '🧀', category: 'Food', available: true },
  { id: 'r7', title: '$10 Store Credit', points: 800, desc: 'Use at any partner store', emoji: '💳', category: 'Credit', available: false },
  { id: 'r8', title: 'Mystery Deal Box', points: 250, desc: 'Surprise discount revealed on checkout', emoji: '📦', category: 'Mystery', available: true },
];

const HOW_TO_EARN = [
  { icon: ShoppingBag, label: 'Place an Order', pts: '+10 pts per order', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { icon: Star, label: 'Leave a Review', pts: '+25 pts per review', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { icon: Heart, label: 'Save a Store', pts: '+5 pts per save', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { icon: Users, label: 'Refer a Friend', pts: '+100 pts per referral', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  { icon: Pizza, label: 'Build a Pizza', pts: '+2 pts per build', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { icon: TrendingUp, label: 'Streak Bonus', pts: '+50 pts / 5 orders', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
];

const HISTORY = [
  { desc: 'Order at Shamz Pizza', pts: +10, date: '2 days ago' },
  { desc: 'Review submitted', pts: +25, date: '4 days ago' },
  { desc: 'Referred a friend', pts: +100, date: '1 week ago' },
  { desc: 'Redeemed: Free Garlic Bread', pts: -100, date: '1 week ago' },
  { desc: 'Order at Mario\'s Pizza', pts: +10, date: '2 weeks ago' },
  { desc: 'Saved 3 stores', pts: +15, date: '2 weeks ago' },
  { desc: 'Pizza Builder used', pts: +2, date: '3 weeks ago' },
  { desc: 'Welcome bonus', pts: +50, date: '1 month ago' },
];

interface RewardsViewProps {
  onNavigate: (view: string) => void;
}

export function RewardsView({ onNavigate }: RewardsViewProps) {
  const [activeTab, setActiveTab] = useState<'rewards' | 'how' | 'history'>('rewards');
  const [redeemedId, setRedeemedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Simulated points
  const points = HISTORY.reduce((sum, h) => sum + h.pts, 0) + 50;
  const currentTier = [...TIERS].reverse().find(t => points >= t.minPoints) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const progressToNext = nextTier
    ? ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const redeem = (reward: Reward) => {
    if (!reward.available || points < reward.points) return;
    setRedeemedId(reward.id);
    const code = `MISLICE-${reward.id.toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setRedeemedId(null), 3000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-5 h-5 text-red-400" />
          <h1 className="text-2xl font-black text-white">Rewards</h1>
        </div>
        <p className="text-stone-500 text-sm">Earn points on every order and redeem for free food & discounts.</p>
      </div>

      {/* Points card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-600/20 via-red-600/12 to-transparent p-6 shadow-[0_0_40px_rgba(220,38,38,0.12)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Your Points Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{points}</span>
              <span className="text-red-400 font-black text-sm">pts</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg">{currentTier.icon}</span>
              <span className={`text-xs font-black ${currentTier.color}`}>{currentTier.name} Member</span>
            </div>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <Award className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="mt-5">
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] font-bold text-stone-400">Progress to {nextTier.icon} {nextTier.name}</span>
              <span className="text-[10px] font-black text-red-300">{nextTier.minPoints - points} pts to go</span>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Tier overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TIERS.map(tier => (
          <div
            key={tier.name}
            className={`rounded-2xl border p-3 text-center transition-all ${
              tier.name === currentTier.name
                ? `${tier.bg} ${tier.border} ring-1 ring-red-500/30`
                : 'bg-white/3 border-white/6 opacity-50'
            }`}
          >
            <p className="text-xl mb-1">{tier.icon}</p>
            <p className={`text-xs font-black ${tier.color}`}>{tier.name}</p>
            <p className="text-[9px] text-stone-600 mt-0.5">{tier.minPoints === 0 ? 'Starter' : `${tier.minPoints}+ pts`}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white/5 border border-white/8 p-1 rounded-2xl">
        {(['rewards', 'how', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
              activeTab === t ? 'bg-white/12 text-white' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            {t === 'rewards' ? '🎁 Redeem' : t === 'how' ? '⚡ How to Earn' : '📋 History'}
          </button>
        ))}
      </div>

      {/* Rewards catalog */}
      {activeTab === 'rewards' && (
        <div className="space-y-3">
          <p className="text-xs text-stone-500">Tap to redeem · Code copied to clipboard automatically</p>
          {REWARDS.map(reward => {
            const canAfford = points >= reward.points;
            const isRedeemed = redeemedId === reward.id;
            return (
              <motion.div
                key={reward.id}
                layout
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  !reward.available
                    ? 'bg-white/2 border-white/5 opacity-40'
                    : canAfford
                    ? 'bg-white/4 border-white/10 hover:border-red-500/30 cursor-pointer'
                    : 'bg-white/2 border-white/6'
                }`}
                onClick={() => reward.available && canAfford && redeem(reward)}
              >
                <div className="text-3xl shrink-0">{reward.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white">{reward.title}</p>
                  <p className="text-xs text-stone-500">{reward.desc}</p>
                  {!reward.available && <p className="text-[9px] text-stone-600 font-bold mt-0.5">Coming soon</p>}
                </div>
                <div className="shrink-0 text-right">
                  {isRedeemed ? (
                    <div className="flex items-center gap-1.5 text-green-400 text-xs font-black">
                      <Check className="w-3.5 h-3.5" /> Redeemed!
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm font-black ${canAfford ? 'text-red-400' : 'text-stone-600'}`}>{reward.points} pts</p>
                      {!canAfford && reward.available && (
                        <div className="flex items-center gap-1 text-[9px] text-stone-600 mt-0.5">
                          <Lock className="w-2.5 h-2.5" /> Need {reward.points - points} more
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}

          {copiedCode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/25 rounded-2xl"
            >
              <Check className="w-4 h-4 text-green-400 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-black text-green-300">Code copied to clipboard!</p>
                <p className="text-xs font-mono text-green-400 mt-0.5">{copiedCode}</p>
              </div>
              <button onClick={() => setCopiedCode(null)} className="text-stone-500 hover:text-white">
                <Gift className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* How to earn */}
      {activeTab === 'how' && (
        <div className="space-y-3">
          {HOW_TO_EARN.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-4 p-4 bg-white/4 border border-white/8 rounded-2xl">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{item.label}</p>
                </div>
                <p className="text-sm font-black text-red-400 shrink-0">{item.pts}</p>
              </div>
            );
          })}

          {/* Referral CTA */}
          <div className="mt-4 p-5 bg-gradient-to-r from-red-600/15 to-red-600/10 border border-red-500/20 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-red-400" />
              <p className="font-black text-white text-sm">Refer Friends · Earn 100 pts each</p>
            </div>
            <p className="text-xs text-stone-400 mb-4">Share your referral link. When they place their first order, you both get points.</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-stone-400 truncate">
                mislice.online/ref/PIZZA{Math.random().toString(36).slice(2, 8).toUpperCase()}
              </div>
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                onClick={() => { navigator.clipboard?.writeText('mislice.online/ref/PIZZA123').catch(() => {}); }}
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
          </div>

          {/* Current tier perks */}
          <div className={`p-5 rounded-2xl border ${currentTier.bg} ${currentTier.border}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Your Current Perks ({currentTier.icon} {currentTier.name})</p>
            <div className="space-y-2">
              {currentTier.perks.map(perk => (
                <div key={perk} className="flex items-center gap-2 text-sm text-stone-300">
                  <Check className={`w-3.5 h-3.5 shrink-0 ${currentTier.color}`} />
                  {perk}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <p className="font-black text-white text-sm">Points History</p>
            <p className="text-xs font-bold text-stone-500">{points} pts total</p>
          </div>
          <div className="divide-y divide-white/5">
            {HISTORY.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-bold text-white">{h.desc}</p>
                  <p className="text-[10px] text-stone-600">{h.date}</p>
                </div>
                <span className={`font-black text-sm ${h.pts > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {h.pts > 0 ? '+' : ''}{h.pts} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
