import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User, MapPin, Phone, Mail, Edit2, Save, RotateCcw, Check,
  Leaf, Wheat, Flame, Heart, ChevronRight, Camera, Star,
  ShoppingBag, Clock, Award, Trash2, Plus, X,
} from 'lucide-react';

interface CustomerProfileData {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: { id: string; label: string; address: string; isDefault: boolean }[];
  dietary: { vegetarian: boolean; vegan: boolean; glutenFree: boolean; halal: boolean; spicy: boolean };
  favoriteToppings: string[];
  favoriteCrustStyle: string;
  budgetRange: 'under10' | '10to15' | '15to20' | 'over20';
  notifyDeals: boolean;
  notifyOrders: boolean;
}

const DEFAULT_PROFILE: CustomerProfileData = {
  name: '', email: '', phone: '',
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
  { key: 'glutenFree' as const, label: 'Gluten Free', icon: Wheat, color: 'text-amber-700 border-amber-200 bg-amber-50' },
  { key: 'halal' as const, label: 'Halal', icon: Star, color: 'text-blue-700 border-blue-200 bg-blue-50' },
  { key: 'spicy' as const, label: 'Love Spicy', icon: Flame, color: 'text-red-700 border-red-200 bg-red-50' },
];

const INPUT = "w-full clay-inset px-4 py-3 text-stone-800 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300/60 transition-all";
const LABEL = "text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2";
const SECTION = "clay bg-white rounded-3xl p-5";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-amber-500' : 'bg-stone-300'}`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

interface CustomerProfileProps {
  onNavigate: (view: string) => void;
}

export function CustomerProfile({ onNavigate }: CustomerProfileProps) {
  const [profile, setProfile] = useState<CustomerProfileData>(() => {
    try { return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem('miSliceCustomerProfile') || '{}') }; }
    catch { return DEFAULT_PROFILE; }
  });
  const [saved, setSaved] = useState(false);
  const [addressForm, setAddressForm] = useState<{ label: string; address: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('miSliceCustomerProfile', JSON.stringify(profile));
  }, [profile]);

  const update = (partial: Partial<CustomerProfileData>) => setProfile(p => ({ ...p, ...partial }));

  const saveProfile = () => {
    localStorage.setItem('miSliceCustomerProfile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

  const orderCount = (() => { try { return (JSON.parse(localStorage.getItem('miSliceOrders') || '[]') as any[]).length; } catch { return 0; } })();
  const favCount = (() => { try { return (JSON.parse(localStorage.getItem('miSliceFavorites') || '[]') as any[]).length; } catch { return 0; } })();
  const cartCount = (() => { try { return (JSON.parse(localStorage.getItem('miSliceCart') || '[]') as any[]).length; } catch { return 0; } })();

  const initials = profile.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black text-stone-800">My Profile</h1>
          <p className="text-stone-400 text-sm mt-0.5">Personalize your MiSlice experience</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={saveProfile}
          className={`clay-btn flex items-center gap-2 px-5 py-2.5 font-black text-sm ${
            saved ? 'bg-green-500 text-white' : 'clay-accent text-stone-900'
          }`}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
        </motion.button>
      </div>

      {/* Avatar + quick stats */}
      <div className={SECTION + " flex items-center gap-5"}>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-xl">
            {initials}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-stone-800 font-black text-base">{profile.name || 'Pizza Lover'}</p>
          <p className="text-stone-400 text-xs">{profile.email || 'Add your email below'}</p>
        </div>
        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-4">
          {[
            { icon: ShoppingBag, val: orderCount, label: 'Orders' },
            { icon: Heart, val: favCount, label: 'Saved' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-black text-stone-800">{s.val}</p>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Basic info */}
      <div className={SECTION + " space-y-4"}>
        <h3 className="font-black text-stone-800 text-sm uppercase tracking-widest">Personal Info</h3>
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
        </div>
      </div>

      {/* Delivery addresses */}
      <div className={SECTION + " space-y-4"}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-stone-800 text-sm uppercase tracking-widest">Delivery Addresses</h3>
          {!addressForm && (
            <button onClick={() => setAddressForm({ label: 'Home', address: '' })}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl transition-colors">
              <Plus className="w-3 h-3" /> Add Address
            </button>
          )}
        </div>

        {profile.addresses.map(addr => (
          <div key={addr.id} className="flex items-start gap-3 py-3 px-3 rounded-xl clay-inset">
            <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-stone-800">{addr.label}</p>
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
          <div className="clay-inset border border-amber-200 rounded-xl p-4 space-y-3">
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
              <button onClick={() => setAddressForm(null)} className="clay-btn px-4 py-2 text-xs font-bold text-stone-500 bg-white">Cancel</button>
              <button onClick={addAddress} className="clay-accent px-4 py-2 text-xs font-bold text-stone-900 flex items-center gap-1.5">
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
        <h3 className="font-black text-stone-800 text-sm uppercase tracking-widest">Dietary Preferences</h3>
        <p className="text-xs text-stone-500">We'll filter results and show compatible options first.</p>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map(d => {
            const Icon = d.icon;
            const on = profile.dietary[d.key];
            return (
              <button
                key={d.key}
                onClick={() => toggleDietary(d.key)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                  on ? d.color : 'clay-inset text-stone-500 hover:text-stone-800'
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
        <h3 className="font-black text-stone-800 text-sm uppercase tracking-widest">Favourite Toppings</h3>
        <p className="text-xs text-stone-500">Pre-fills your pizza builder and powers recommendations.</p>
        <div className="flex flex-wrap gap-2">
          {TOPPING_OPTIONS.map(t => {
            const on = profile.favoriteToppings.includes(t.label);
            return (
              <button
                key={t.label}
                onClick={() => toggleTopping(t.label)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
                  on
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'clay-inset text-stone-500 hover:text-stone-800'
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
        <h3 className="font-black text-stone-800 text-sm uppercase tracking-widest">Favourite Crust</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CRUST_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => update({ favoriteCrustStyle: c })}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                profile.favoriteCrustStyle === c
                  ? 'border-violet-200 bg-violet-50 text-violet-700'
                  : 'clay-inset text-stone-500 hover:text-stone-800'
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
        <h3 className="font-black text-stone-800 text-sm uppercase tracking-widest">Budget Per Pizza</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BUDGET_OPTIONS.map(b => (
            <button
              key={b.value}
              onClick={() => update({ budgetRange: b.value })}
              className={`py-3 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                profile.budgetRange === b.value
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'clay-inset text-stone-500 hover:text-stone-800'
              }`}
            >
              <p className="font-black text-sm mb-0.5">{b.label}</p>
              <p className="text-[9px] opacity-70">{b.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigate('orders')}
          className="clay-btn flex items-center gap-3 p-4 bg-white rounded-2xl group text-left">
          <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-800 group-hover:text-blue-600 transition-colors">My Orders</p>
            <p className="text-[10px] text-stone-400">{orderCount} order{orderCount !== 1 ? 's' : ''}</p>
          </div>
        </button>
        <button onClick={() => onNavigate('rewards')}
          className="clay-btn flex items-center gap-3 p-4 bg-white rounded-2xl group text-left">
          <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-800 group-hover:text-amber-600 transition-colors">My Rewards</p>
            <p className="text-[10px] text-stone-400">250 points earned</p>
          </div>
        </button>
      </div>
    </div>
  );
}
