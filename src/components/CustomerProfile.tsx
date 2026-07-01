/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import {
  User, MapPin, Phone, Mail, Save, Check,
  Leaf, Wheat, Flame, Heart, Star,
  ShoppingBag, Award, Trash2, Plus, X, Store,
  Clock, CheckCircle2, RotateCcw, Camera, Bell,
  Settings, ChevronRight, Tag, Shield, CreditCard,
} from 'lucide-react';
import { Order } from '../types';

interface CustomerProfileData {
  name: string;
  email: string;
  phone: string;
  favoritePizzeria: string;
  avatar: string;
  addresses: { id: string; label: string; address: string; isDefault: boolean }[];
  dietary: { vegetarian: boolean; vegan: boolean; glutenFree: boolean; halal: boolean; spicy: boolean };
  favoriteToppings: string[];
  favoriteCrustStyle: string;
  budgetRange: 'under10' | '10to15' | '15to20' | 'over20';
  notifyDeals: boolean;
  notifyOrders: boolean;
}

const DEFAULT_PROFILE: CustomerProfileData = {
  name: '', email: '', phone: '', favoritePizzeria: '', avatar: '',
  addresses: [],
  dietary: { vegetarian: false, vegan: false, glutenFree: false, halal: false, spicy: false },
  favoriteToppings: [],
  favoriteCrustStyle: 'Hand Tossed',
  budgetRange: '10to15',
  notifyDeals: true,
  notifyOrders: true,
};

const TOPPING_OPTIONS = [
  { label: 'Pepperoni', emoji: '🍕' }, { label: 'Mushrooms', emoji: '🍄' },
  { label: 'Onions', emoji: '🧅' }, { label: 'Green Peppers', emoji: '🫑' },
  { label: 'Black Olives', emoji: '🫒' }, { label: 'Bacon', emoji: '🥓' },
  { label: 'Italian Sausage', emoji: '🌭' }, { label: 'Grilled Chicken', emoji: '🍗' },
  { label: 'Spinach', emoji: '🥬' }, { label: 'Tomatoes', emoji: '🍅' },
  { label: 'Jalapenos', emoji: '🌶️' }, { label: 'Pineapple', emoji: '🍍' },
  { label: 'Extra Cheese', emoji: '🧀' }, { label: 'Ham', emoji: '🍖' },
];

const CRUST_OPTIONS = [
  'Hand Tossed', 'Crunchy Thin Crust', 'Handmade Pan',
  'Parmesan Stuffed Crust', 'Brooklyn Style', 'New York Style',
];

const BUDGET_OPTIONS = [
  { value: 'under10', label: 'Under $10', desc: 'Budget-friendly', color: 'from-green-500 to-emerald-400' },
  { value: '10to15', label: '$10–$15',   desc: 'Mid-range',       color: 'from-blue-500 to-cyan-400' },
  { value: '15to20', label: '$15–$20',   desc: 'Premium',         color: 'from-violet-500 to-purple-400' },
  { value: 'over20', label: '$20+',      desc: 'No limit',        color: 'from-rose-500 to-pink-400' },
] as const;

const DIETARY_OPTIONS = [
  { key: 'vegetarian' as const, label: 'Vegetarian', icon: Leaf,  emoji: '🥦' },
  { key: 'vegan'      as const, label: 'Vegan',       icon: Leaf,  emoji: '🌿' },
  { key: 'glutenFree' as const, label: 'Gluten Free', icon: Wheat, emoji: '🌾' },
  { key: 'halal'      as const, label: 'Halal',       icon: Star,  emoji: '⭐' },
  { key: 'spicy'      as const, label: 'Love Spicy',  icon: Flame, emoji: '🌶️' },
];

const MEAT_OPTIONS = [
  { id: 'Lamb',      emoji: '🐑' }, { id: 'Pepperoni', emoji: '🍕' },
  { id: 'Chicken',   emoji: '🍗' }, { id: 'Beef',      emoji: '🥩' },
  { id: 'Pork',      emoji: '🥓' }, { id: 'Anchovies', emoji: '🐟' },
];

const ACTIVE_STATUSES = new Set(['placed','pending','confirmed','preparing','ready_for_pickup','out_for_delivery']);

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    placed:            { label: 'Placed',      cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    pending:           { label: 'Pending',     cls: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
    confirmed:         { label: 'Confirmed',   cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    preparing:         { label: 'Preparing',   cls: 'bg-orange-50 text-orange-600 border-orange-200' },
    ready_for_pickup:  { label: 'Ready',       cls: 'bg-green-50 text-green-600 border-green-200' },
    out_for_delivery:  { label: 'On the way',  cls: 'bg-purple-50 text-purple-600 border-purple-200' },
    delivered:         { label: 'Delivered',   cls: 'bg-green-50 text-green-600 border-green-200' },
    cancelled:         { label: 'Cancelled',   cls: 'bg-red-50 text-red-600 border-red-200' },
    refunded:          { label: 'Refunded',    cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  };
  const s = map[status] || { label: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  return (
    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{children}</p>
  );
}

interface CustomerProfileProps {
  onNavigate: (view: string) => void;
  orders?: Order[];
  meatPreferences?: string[];
  onSaveMeatPreferences?: (meats: string[]) => void;
  isLight?: boolean;
}

export function CustomerProfile({ onNavigate, orders = [], meatPreferences = [], onSaveMeatPreferences }: CustomerProfileProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'settings'>('profile');
  const [orderSubTab, setOrderSubTab] = useState<'active' | 'completed'>('active');
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<CustomerProfileData>(() => {
    try { return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem('miSliceCustomerProfile') || '{}') }; }
    catch { return DEFAULT_PROFILE; }
  });
  const [saved, setSaved] = useState(false);
  const [addressForm, setAddressForm] = useState<{ label: string; address: string } | null>(null);
  const [draftMeats, setDraftMeats] = useState<string[]>(meatPreferences);
  const [meatSaved, setMeatSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem('miSliceCustomerProfile', JSON.stringify(profile));
  }, [profile]);

  const update = (partial: Partial<CustomerProfileData>) => setProfile(p => ({ ...p, ...partial }));

  const saveProfile = () => {
    localStorage.setItem('miSliceCustomerProfile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleTopping = (t: string) => {
    const cur = profile.favoriteToppings;
    update({ favoriteToppings: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] });
  };

  const toggleDietary = (key: keyof CustomerProfileData['dietary']) =>
    update({ dietary: { ...profile.dietary, [key]: !profile.dietary[key] } });

  const toggleMeat = (id: string) =>
    setDraftMeats(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const saveMeats = () => {
    onSaveMeatPreferences?.(draftMeats);
    setMeatSaved(true);
    setTimeout(() => setMeatSaved(false), 2000);
  };

  const addAddress = () => {
    if (!addressForm?.address.trim()) return;
    const newAddr = { id: Date.now().toString(), label: addressForm.label || 'Home', address: addressForm.address, isDefault: profile.addresses.length === 0 };
    update({ addresses: [...profile.addresses, newAddr] });
    setAddressForm(null);
  };

  const removeAddress = (id: string) => update({ addresses: profile.addresses.filter(a => a.id !== id) });
  const setDefault = (id: string) => update({ addresses: profile.addresses.map(a => ({ ...a, isDefault: a.id === id })) });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) update({ avatar: ev.target.result as string }); };
    reader.readAsDataURL(file);
  };

  const favCount = (() => { try { return (JSON.parse(localStorage.getItem('miSliceFavorites') || '[]') as unknown[]).length; } catch { return 0; } })();
  const initials = profile.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const activeOrders = orders.filter(o => ACTIVE_STATUSES.has(o.orderStatus));
  const completedOrders = orders.filter(o => !ACTIVE_STATUSES.has(o.orderStatus));

  const TABS = [
    { id: 'profile'  as const, label: 'Profile',  icon: User },
    { id: 'orders'   as const, label: 'Orders',   icon: ShoppingBag, badge: orders.length || undefined },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const INPUT = "w-full rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none bg-gray-50 border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all";
  const LABEL = "text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2";

  return (
    <div
      className="relative w-full min-h-screen"
      style={{
        background: '#f8f8f8',
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero ── */}
        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
          {/* Top gradient band */}
          <div className="h-24 w-full relative" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.85) 0%, rgba(79,70,229,0.75) 50%, rgba(168,85,247,0.7) 100%)' }}>
            <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 14px)' }} />
          </div>

          <div className="px-6 pb-6">
            {/* Avatar + save button row */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-2xl shrink-0"
                  style={{ background: profile.avatar ? 'transparent' : 'linear-gradient(135deg, #7C3AED, #4F46E5)', boxShadow: '0 8px 32px rgba(124,58,237,0.35)', border: '3px solid white' }}
                >
                  {profile.avatar
                    ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(124,58,237,0.9)', border: '2px solid white' }}
                  title="Change photo"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={saveProfile}
                className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all ${
                  saved ? 'bg-green-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
              >
                {saved ? <><Check className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save</>}
              </motion.button>
            </div>

            <div className="mb-5">
              <h2 className="text-gray-900 font-black text-xl leading-tight">{profile.name || 'Pizza Lover'}</h2>
              <p className="text-violet-500 text-xs mt-0.5">{profile.email || 'MiSlice Member'}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShoppingBag, val: orders.length, label: 'Orders' },
                { icon: Heart,       val: favCount,      label: 'Saved' },
                { icon: Award,       val: '250',         label: 'Points' },
              ].map(s => (
                <div key={s.label} className="text-center rounded-xl py-3 bg-gray-50 border border-gray-100">
                  <p className="text-lg font-black text-gray-900">{s.val}</p>
                  <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-1 p-1 rounded-2xl bg-white border border-gray-100 shadow-sm">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
                  active ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge ? (
                  <span className="absolute top-1.5 right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">{tab.badge}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ── PROFILE TAB ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">

              <Card>
                <SectionTitle>Personal Info</SectionTitle>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name',        key: 'name',            type: 'text',  placeholder: 'Your name' },
                    { label: 'Email',             key: 'email',           type: 'email', placeholder: 'you@email.com' },
                    { label: 'Phone',             key: 'phone',           type: 'tel',   placeholder: '+1 (555) 000-0000' },
                    { label: 'Favorite Pizzeria', key: 'favoritePizzeria',type: 'text',  placeholder: 'e.g. Domino\'s, Jets…' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={LABEL}>{f.label}</label>
                      <input
                        type={f.type}
                        value={(profile as Record<string, unknown>)[f.key] as string}
                        onChange={e => update({ [f.key]: e.target.value } as Partial<CustomerProfileData>)}
                        placeholder={f.placeholder}
                        className={INPUT}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Delivery Addresses */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle>Delivery Addresses</SectionTitle>
                  {!addressForm && (
                    <button
                      onClick={() => setAddressForm({ label: 'Home', address: '' })}
                      className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {profile.addresses.map(addr => (
                    <div key={addr.id} className="flex items-start gap-3 px-3 py-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-violet-100">
                        <MapPin className="w-3.5 h-3.5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{addr.label}</p>
                          {addr.isDefault && <span className="text-[8px] font-black text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">DEFAULT</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{addr.address}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!addr.isDefault && (
                          <button onClick={() => setDefault(addr.id)} className="text-[9px] font-bold text-gray-400 hover:text-violet-600 transition-colors px-2 py-1">Set default</button>
                        )}
                        <button onClick={() => removeAddress(addr.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {addressForm && (
                    <div className="rounded-xl p-4 space-y-3 bg-violet-50 border border-violet-100">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={LABEL}>Label</label>
                          <input value={addressForm.label} onChange={e => setAddressForm(a => ({ ...a!, label: e.target.value }))}
                            placeholder="Home / Work" className={INPUT} />
                        </div>
                        <div>
                          <label className={LABEL}>Street Address</label>
                          <input value={addressForm.address} onChange={e => setAddressForm(a => ({ ...a!, address: e.target.value }))}
                            placeholder="123 Main St, Detroit" className={INPUT} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setAddressForm(null)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-xl bg-white border border-gray-200 transition-colors">Cancel</button>
                        <button onClick={addAddress} className="px-4 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Add Address
                        </button>
                      </div>
                    </div>
                  )}

                  {profile.addresses.length === 0 && !addressForm && (
                    <p className="text-gray-400 text-xs text-center py-4">No saved addresses. Add one for faster checkout.</p>
                  )}
                </div>
              </Card>

              {/* Dietary Preferences */}
              <Card>
                <SectionTitle>Dietary Preferences</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(d => {
                    const on = profile.dietary[d.key];
                    return (
                      <button
                        key={d.key}
                        onClick={() => toggleDietary(d.key)}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                          on ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm">{d.emoji}</span>
                        {d.label}
                        {on && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Meat Preferences */}
              <Card>
                <SectionTitle>Meat Preferences</SectionTitle>
                <p className="text-[11px] text-gray-400 mb-4">Select the meats you eat — personalises your pizza builder.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {MEAT_OPTIONS.map(opt => {
                    const on = draftMeats.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleMeat(opt.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          on ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${on ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                          {on && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-sm">{opt.emoji}</span>
                        {opt.id}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={saveMeats}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${meatSaved ? 'bg-green-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                >
                  {meatSaved ? <><Check className="w-3.5 h-3.5" />Saved!</> : 'Save Preferences'}
                </button>
              </Card>

              {/* Favourite Toppings */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle>Favourite Toppings</SectionTitle>
                  {profile.favoriteToppings.length > 0 && (
                    <button onClick={() => update({ favoriteToppings: [] })} className="text-[10px] font-bold text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {TOPPING_OPTIONS.map(t => {
                    const on = profile.favoriteToppings.includes(t.label);
                    return (
                      <button
                        key={t.label}
                        onClick={() => toggleTopping(t.label)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all border ${
                          on ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm">{t.emoji}</span>
                        {t.label}
                        {on && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Favourite Crust */}
              <Card>
                <SectionTitle>Favourite Crust</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CRUST_OPTIONS.map(c => {
                    const on = profile.favoriteCrustStyle === c;
                    return (
                      <button
                        key={c}
                        onClick={() => update({ favoriteCrustStyle: c })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border ${
                          on ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {on && <Check className="w-3 h-3 inline mr-1 text-violet-600" />}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Budget */}
              <Card>
                <SectionTitle>Budget Per Pizza</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BUDGET_OPTIONS.map(b => {
                    const on = profile.budgetRange === b.value;
                    return (
                      <button
                        key={b.value}
                        onClick={() => update({ budgetRange: b.value })}
                        className={`py-3 px-3 rounded-xl text-xs font-bold text-center transition-all relative overflow-hidden border ${
                          on ? 'bg-violet-100 border-violet-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {on && <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${b.color}`} />}
                        <p className={`font-black text-sm mb-0.5 relative ${on ? 'text-violet-700' : 'text-gray-600'}`}>{b.label}</p>
                        <p className={`text-[9px] relative ${on ? 'text-violet-500' : 'text-gray-400'}`}>{b.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Rewards quick-link */}
              <button
                onClick={() => onNavigate('deals-hub')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all group bg-white border border-gray-100 shadow-sm hover:border-violet-200"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-yellow-50 border border-yellow-100">
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors">My Rewards</p>
                  <p className="text-[10px] text-gray-400">250 points · Redeem for deals</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
              </button>
            </motion.div>
          )}

          {/* ── ORDERS TAB ── */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">

              <div className="flex gap-2">
                {([
                  { id: 'active'    as const, label: `Active${activeOrders.length > 0 ? ` (${activeOrders.length})` : ''}`,           icon: Clock },
                  { id: 'completed' as const, label: `Completed${completedOrders.length > 0 ? ` (${completedOrders.length})` : ''}`, icon: CheckCircle2 },
                ] as const).map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setOrderSubTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                        orderSubTab === tab.id
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {orderSubTab === 'active' && (
                activeOrders.length === 0 ? (
                  <Card className="text-center py-10">
                    <Clock className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-bold text-sm">No active orders</p>
                    <p className="text-gray-400 text-xs mt-1">Your in-progress orders will appear here</p>
                    <button onClick={() => onNavigate('pizza-builder')} className="mt-4 text-violet-600 font-bold text-sm hover:text-violet-700 transition-colors">Order a pizza →</button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {activeOrders.map(order => (
                      <Card key={order.id}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-black text-gray-900">{order.storeName}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                          </div>
                          <StatusBadge status={order.orderStatus} />
                        </div>
                        <p className="text-xs text-gray-400 mb-3">{order.items.map(i => i.pizzaName).join(', ')}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5 text-violet-500" />
                            ETA: {order.estimatedDeliveryTime}
                          </div>
                          <p className="font-black text-gray-900">${order.finalTotal.toFixed(2)}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )
              )}

              {orderSubTab === 'completed' && (
                completedOrders.length === 0 ? (
                  <Card className="text-center py-10">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-bold text-sm">No completed orders yet</p>
                    <p className="text-gray-400 text-xs mt-1">Past orders will show up here once delivered</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {completedOrders.map(order => (
                      <Card key={order.id}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-black text-gray-900">{order.storeName}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                          </div>
                          <StatusBadge status={order.orderStatus} />
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{order.items.map(i => i.pizzaName).join(', ')}</p>
                        <p className="text-[10px] text-gray-400 mb-3">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => onNavigate('pizza-builder')}
                            className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" /> Reorder
                          </button>
                          <p className="font-black text-gray-900">${order.finalTotal.toFixed(2)}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )
              )}
            </motion.div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">

              <Card>
                <SectionTitle>Notifications</SectionTitle>
                <div className="space-y-3">
                  {[
                    { key: 'notifyDeals'  as const, icon: Tag,  label: 'Deal Alerts',   desc: 'New deals and price drops near you' },
                    { key: 'notifyOrders' as const, icon: Bell, label: 'Order Updates',  desc: 'Status changes for your orders' },
                  ].map(item => {
                    const Icon = item.icon;
                    const on = profile[item.key];
                    return (
                      <div key={item.key} className="flex items-center justify-between gap-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-50">
                            <Icon className="w-4 h-4 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{item.label}</p>
                            <p className="text-[10px] text-gray-400">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => update({ [item.key]: !on } as Partial<CustomerProfileData>)}
                          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-violet-600' : 'bg-gray-200'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${on ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <SectionTitle>Account</SectionTitle>
                <div className="space-y-1">
                  {[
                    { icon: Shield,     label: 'Privacy & Data',  desc: 'Manage your data rights',       action: () => onNavigate('legal') },
                    { icon: CreditCard, label: 'Billing',         desc: 'Payment methods & history',      action: () => {} },
                    { icon: Award,      label: 'Loyalty Rewards', desc: 'Points, tiers & redemptions',   action: () => onNavigate('deals-hub') },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group hover:bg-gray-50"
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-violet-50">
                          <Icon className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors">{item.label}</p>
                          <p className="text-[10px] text-gray-400">{item.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <SectionTitle>Danger Zone</SectionTitle>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (confirm('Clear all saved profile data?')) {
                        localStorage.removeItem('miSliceCustomerProfile');
                        setProfile(DEFAULT_PROFILE);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:text-red-600 transition-colors text-left bg-red-50 border border-red-100"
                  >
                    <Trash2 className="w-4 h-4" /> Clear Profile Data
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-8" />
      </div>
    </div>
  );
}
