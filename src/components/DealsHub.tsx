import React, { useState, useEffect } from 'react';
import { Tag, Bell, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { LocalDeals } from './LocalDeals';
import { NotificationsView } from './NotificationsView';
import { RewardsView } from './RewardsView';
import { CartItem } from '../types';

type Tab = 'deals' | 'alerts' | 'rewards';

interface DealsHubProps {
  initialTab?: Tab;
  onNavigate: (view: string) => void;
  onAddToCart: (item: Omit<CartItem, 'id'>, redirect: boolean) => void;
}

const TABS: { id: Tab; label: string; icon: React.FC<any>; desc: string }[] = [
  { id: 'deals',   label: 'Deals',    icon: Tag,  desc: 'Live deals from nearby stores' },
  { id: 'alerts',  label: 'My Alerts', icon: Bell, desc: 'Notifications & price alerts' },
  { id: 'rewards', label: 'Rewards',  icon: Gift, desc: 'Points & loyalty perks' },
];

export function DealsHub({ initialTab = 'deals', onNavigate, onAddToCart }: DealsHubProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="w-full max-w-5xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2 mb-1">
          <Tag className="w-5 h-5 text-red-400" />
          Deals &amp; Rewards
        </h1>
        <p className="text-stone-500 text-sm">Your deals, alerts and loyalty points — all in one place.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/5 border border-white/8 p-1 rounded-2xl max-w-md">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.96 }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                isActive ? 'bg-white/12 text-white' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'deals' && (
        <LocalDeals onAddToCart={onAddToCart} />
      )}
      {activeTab === 'alerts' && (
        <NotificationsView onNavigate={onNavigate} />
      )}
      {activeTab === 'rewards' && (
        <RewardsView onNavigate={onNavigate} />
      )}
    </div>
  );
}
