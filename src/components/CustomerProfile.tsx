import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User, MapPin, Phone, Mail, Save, Check,
  Leaf, Wheat, Flame, Heart, Star,
  ShoppingBag, Award, Trash2, Plus, X, Store,
  Clock, CheckCircle2, RotateCcw,
} from 'lucide-react';
import { Order } from '../types';

interface CustomerProfileData {
  name: string;
  email: string;
  phone: string;
  favoritePizzeria: string;
  addresses: { id: string; label: string; address: string; isDefault: boolean }[];
  dietary: { vegetarian: boolean; vegan: boolean; glutenFree: boolean; halal: boolean; spicy: boolean };
  favoriteToppings: string[];
  favoriteCrustStyle: string;
  budgetRange: 'under10' | '10to15' | '15to20' | 'over20';
  notifyDeals: boolean;
  notifyOrders: boolean;
}

const DEFAULT_PROFILE: CustomerProfileData = {
  name: '', email: '', phone: '', favoritePizzeria: '',
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
  { value: 'under10', label: 'Under $10', desc: 'Budget-friendly' },
  { value: '10to15', label: '$10 – $15', desc: 'Mid-range' },
  { value: '15to20', label: '$15 – $20', desc: 'Premium' },
  { value: 'over20', label: '$20+', desc: 'No limit' },
] as const;

const DIETARY_OPTIONS = [
  { key: 'vegetarian' as const, label: 'Vegetarian', icon: Leaf, color: 'text-green-700 border-green-200 bg-green-50' },
  { key: 'vegan' as const, label: 'Vegan', icon: Leaf, color: 'text-emerald-700 border-emerald-200 bg-emerald-50' },
  { key: 'glutenFree' as const, label: 'Gluten Free', icon: Wheat, color: 'text-red-700 border-red-200 bg-red-50' },
  { key: 'halal' as const, label: 'Halal', icon: Star, color: 'text-blue-700 border-blue-200 bg-blue-50' },
  { key: 'spicy' as const, label: 'Love Spicy', icon: Flame, color: 'text-red-700 border-red-200 bg-red-50' },
];

const ACTIVE_STATUSES = new Set(['placed', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery']);

const INPUT = "w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all";
const LABEL = "text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2";
const SECTION = "bg-white rounded-2xl p-5 shadow-sm border border-slate-100";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-200'}`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    placed: { label: 'Placed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    pending: { label: 'Pending', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    confirmed: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    preparing: { label: 'Preparing', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    ready_for_pickup: { label: 'Ready', cls: 'bg-green-50 text-green-700 border-green-200' },
    out_for_delivery: { label: 'On the way', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    delivered: { label: 'Delivered', cls: 'bg-green-50 text-green-700 border-green-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
    refunded: { label: 'Refunded', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  return <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${s.cls}`}>{s.label}</span>;
}

const MEAT_OPTIONS = [
  { id: 'Lamb',      emoji: '🐑' },
  { id: 'Pepperoni', emoji: '🍕' },
  { id: 'Chicken',   emoji: '🍗' },
  { id: 'Beef',      emoji: '🥩' },
  { id: 'Pork',      emoji: '🥓' },
  { id: 'Anchovies', emoji: '🐟' },
];

interface CustomerProfileProps {
  onNavigate: (view: string) => void;
  orders?: Order[];
  meatPreferences?: string[];
  onSaveMeatPreferences?: (meats: string[]) => void;
}

export function CustomerProfile({ onNavigate, orders = [], meatPreferences = [], onSaveMeatPreferences }: CustomerProfileProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
  const [orderSubTab, setOrderSubTab] = useState<'active' | 'completed'>('active');

  const [profile, setProfile] = useState<CustomerProfileData>(() => {
    try { return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem('miSliceCustomerProfile') || '{}') }; }
    catch { return DEFAULT_PROFILE; }
  });
  const [saved, setSaved] = useState(false);
  const [addressForm, setAddressForm] = useState<{ label: string; address: string } | null>(null);
  const [draftMeats, setDraftMeats] = useState<string[]>(meatPreferences);
  const [meatSaved, setMeatSaved] = useState(false);

  const toggleMeat = (id: string) =>
    setDraftMeats(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const saveMeats = () => {
    onSaveMeatPreferences?.(draftMeats);
    setMeatSaved(true);
    setTimeout(() => setMeatSaved(false), 2000);
  };

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

  const addAddress = () => {
    if (!addressForm?.address.trim()) return;
    const newAddr = { id: Date.now().toString(), label: addressForm.label || 'Home', address: addressForm.address, isDefault: profile.addresses.length === 0 };
    update({ addresses: [...profile.addresses, newAddr] });
    setAddressForm(null);
  };

  const removeAddress = (id: string) => update({ addresses: profile.addresses.filter(a => a.id !== id) });
  const setDefault = (id: string) => update({ addresses: profile.addresses.map(a => ({ ...a, isDefault: a.id === id })) });

  const favCount = (() => { try { return (JSON.parse(localStorage.getItem('miSliceFavorites') || '[]') as any[]).length; } catch { return 0; } })();

  const initials = profile.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.has(o.orderStatus));
  const completedOrders = orders.filter(o => !ACTIVE_STATUSES.has(o.orderStatus));

  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
          <p className="text-slate-400 text-sm mt-0.5">Personalize your MiSlice experience</p>
        </div>
        {activeTab === 'info' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={saveProfile}
            className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all ${
              saved
                ? 'bg-green-500 text-white shadow-[0_4px_12px_rgba(34,197,94,0.35)]'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.35)]'
            }`}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
          </motion.button>
        )}
      </div>

      {/* Avatar + profile summary card */}
      <div className={SECTION + " space-y-4"}>
        {/* Top row: avatar + stats */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-xl shadow-[0_4px_16px_rgba(37,99,235,0.35)] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 font-black text-lg leading-tight">{profile.name || 'Pizza Lover'}</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            {[
              { icon: ShoppingBag, val: orders.length, label: 'Orders' },
              { icon: Heart, val: favCount, label: 'Saved' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-black text-slate-900">{s.val}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact + pizzeria details */}
        {(profile.email || profile.phone || profile.favoritePizzeria || true) && (
          <div className="border-t border-slate-100 pt-4 grid sm:grid-cols-2 gap-4">
            {/* Contact info */}
            {(profile.email || profile.phone) && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                {profile.email && (
                  <p className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    {profile.email}
                  </p>
                )}
                {profile.phone && (
                  <p className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    {profile.phone}
                  </p>
                )}
              </div>
            )}

            {/* Favorite Pizzeria */}
            {profile.favoritePizzeria && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Favorite Pizzeria</p>
                <p className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                  <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  {profile.favoritePizzeria}
                </p>
              </div>
            )}

            {/* Meat Preferences — editable */}
            <div className="space-y-2 sm:col-span-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meat Preferences</p>
              <p className="text-[10px] text-slate-400">Select the meats you eat — used to personalise your pizza builder.</p>
              <div className="grid grid-cols-3 gap-2">
                {MEAT_OPTIONS.map(opt => {
                  const on = draftMeats.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleMeat(opt.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        on
                          ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        on ? 'bg-red-500 border-red-500' : 'border-slate-300'
                      }`}>
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
                className={`mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  meatSaved
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-900 text-white hover:bg-slate-700'
                }`}
              >
                {meatSaved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : <>Save Preferences</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="bg-slate-100 rounded-2xl p-1 flex gap-1">
        {([
          { id: 'info', label: 'My Info', icon: User },
          { id: 'orders', label: `Orders${orders.length > 0 ? ` (${orders.length})` : ''}`, icon: ShoppingBag },
        ] as const).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── INFO TAB ── */}
      {activeTab === 'info' && (
        <>
          {/* Basic info */}
          <div className={SECTION + " space-y-4"}>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Personal Info</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Full Name</label>
                <input value={profile.name} onChange={e => update({ name: e.target.value })} placeholder="Your name" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input type="email" value={profile.email} onChange={e => update({ email: e.target.value })} placeholder="you@email.com" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input type="tel" value={profile.phone} onChange={e => update({ phone: e.target.value })} placeholder="+1 (555) 000-0000" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Favorite Pizzeria</label>
                <input value={profile.favoritePizzeria} onChange={e => update({ favoritePizzeria: e.target.value })} placeholder="e.g. Domino's, Little Caesars…" className={INPUT} />
              </div>
            </div>
          </div>

          {/* Delivery addresses */}
          <div className={SECTION + " space-y-4"}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Delivery Addresses</h3>
              {!addressForm && (
                <button onClick={() => setAddressForm({ label: 'Home', address: '' })}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl transition-colors shadow-sm">
                  <Plus className="w-3 h-3" /> Add Address
                </button>
              )}
            </div>

            {profile.addresses.map(addr => (
              <div key={addr.id} className="flex items-start gap-3 py-3 px-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-800">{addr.label}</p>
                    {addr.isDefault && <span className="text-[8px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">DEFAULT</span>}
                  </div>
                  <p className="text-xs text-stone-400">{addr.address}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr.id)} className="text-[9px] font-bold text-stone-400 hover:text-green-600 transition-colors px-2 py-1">Set default</button>
                  )}
                  <button onClick={() => removeAddress(addr.id)} className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {addressForm && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Label</label>
                    <input value={addressForm.label} onChange={e => setAddressForm(a => ({ ...a!, label: e.target.value }))}
                      placeholder="Home / Work / Other" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Street Address</label>
                    <input value={addressForm.address} onChange={e => setAddressForm(a => ({ ...a!, address: e.target.value }))}
                      placeholder="123 Main St, Detroit, MI" className={INPUT} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAddressForm(null)} className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                  <button onClick={addAddress} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Address
                  </button>
                </div>
              </div>
            )}

            {profile.addresses.length === 0 && !addressForm && (
              <p className="text-stone-400 text-xs text-center py-3">No saved addresses. Add one for faster checkout.</p>
            )}
          </div>

          {/* Dietary preferences */}
          <div className={SECTION + " space-y-4"}>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Dietary Preferences</h3>
            <p className="text-xs text-slate-500">We'll filter results and show compatible options first.</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(d => {
                const Icon = d.icon;
                const on = profile.dietary[d.key];
                return (
                  <button
                    key={d.key}
                    onClick={() => toggleDietary(d.key)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                      on ? d.color : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {d.label}
                    {on && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favorite toppings */}
          <div className={SECTION + " space-y-4"}>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Favourite Toppings</h3>
            <p className="text-xs text-slate-500">Pre-fills your pizza builder and powers recommendations.</p>
            <div className="flex flex-wrap gap-2">
              {TOPPING_OPTIONS.map(t => {
                const on = profile.favoriteToppings.includes(t.label);
                return (
                  <button
                    key={t.label}
                    onClick={() => toggleTopping(t.label)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
                      on
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm">{t.emoji}</span>
                    {t.label}
                    {on && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
            {profile.favoriteToppings.length > 0 && (
              <button onClick={() => update({ favoriteToppings: [] })} className="text-[10px] font-bold text-stone-600 hover:text-red-400 flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          {/* Crust preference */}
          <div className={SECTION + " space-y-4"}>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Favourite Crust</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CRUST_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => update({ favoriteCrustStyle: c })}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    profile.favoriteCrustStyle === c
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {profile.favoriteCrustStyle === c && <Check className="w-3 h-3 inline mr-1" />}
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Budget range */}
          <div className={SECTION + " space-y-4"}>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Budget Per Pizza</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BUDGET_OPTIONS.map(b => (
                <button
                  key={b.value}
                  onClick={() => update({ budgetRange: b.value })}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    profile.budgetRange === b.value
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-black text-sm mb-0.5">{b.label}</p>
                  <p className="text-[9px] opacity-70">{b.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick link to rewards */}
          <button onClick={() => onNavigate('deals-hub')}
            className="w-full flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 group text-left transition-all">
            <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">My Rewards</p>
              <p className="text-[10px] text-slate-400">250 points earned</p>
            </div>
          </button>
        </>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-2">
            {([
              { id: 'active', label: `Active${activeOrders.length > 0 ? ` (${activeOrders.length})` : ''}`, icon: Clock },
              { id: 'completed', label: `Completed${completedOrders.length > 0 ? ` (${completedOrders.length})` : ''}`, icon: CheckCircle2 },
            ] as const).map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setOrderSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    orderSubTab === tab.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Orders */}
          {orderSubTab === 'active' && (
            activeOrders.length === 0 ? (
              <div className={SECTION + " text-center py-10"}>
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-bold text-sm">No active orders</p>
                <p className="text-slate-400 text-xs mt-1">Your in-progress orders will appear here</p>
                <button onClick={() => onNavigate('pizza-builder')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Order a pizza</button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <div key={order.id} className={SECTION}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-black text-slate-800">{order.storeName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <StatusBadge status={order.orderStatus} />
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {order.items.map(i => i.pizzaName).join(', ')}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>ETA: {order.estimatedDeliveryTime}</span>
                      </div>
                      <p className="font-black text-slate-800">${order.finalTotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Completed Orders */}
          {orderSubTab === 'completed' && (
            completedOrders.length === 0 ? (
              <div className={SECTION + " text-center py-10"}>
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-bold text-sm">No completed orders yet</p>
                <p className="text-slate-400 text-xs mt-1">Past orders will show up here once delivered</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedOrders.map(order => (
                  <div key={order.id} className={SECTION}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-black text-slate-800">{order.storeName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <StatusBadge status={order.orderStatus} />
                    </div>
                    <p className="text-xs text-slate-500 mb-1">
                      {order.items.map(i => i.pizzaName).join(', ')}
                    </p>
                    <p className="text-[10px] text-slate-400 mb-3">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onNavigate('pizza-builder')}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Reorder
                      </button>
                      <p className="font-black text-slate-800">${order.finalTotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
