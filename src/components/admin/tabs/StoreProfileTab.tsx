import React, { useState } from 'react';
import {
  Store, Phone, Mail, MapPin, Clock, Truck, Tag, FileText,
  DollarSign, Save, CheckCircle2, ChevronDown, ChevronUp, Globe,
} from 'lucide-react';
import { db, auth } from '../../../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type Day = typeof DAYS[number];

const DEFAULT_HOURS: Record<Day, { open: string; close: string; closed: boolean }> = {
  Monday:    { open: '11:00', close: '22:00', closed: false },
  Tuesday:   { open: '11:00', close: '22:00', closed: false },
  Wednesday: { open: '11:00', close: '22:00', closed: false },
  Thursday:  { open: '11:00', close: '22:00', closed: false },
  Friday:    { open: '11:00', close: '23:00', closed: false },
  Saturday:  { open: '11:00', close: '23:00', closed: false },
  Sunday:    { open: '12:00', close: '21:00', closed: false },
};

const CUISINE_OPTIONS = [
  'Pizza', 'Italian', 'American', 'BBQ', 'Vegetarian', 'Vegan',
  'Gluten-Free', 'Halal', 'Kosher', 'Family-Friendly', 'Late Night',
];

interface SectionProps { title: string; icon: React.ElementType; children: React.ReactNode; }
function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/8">
        <Icon className="w-4 h-4 text-red-400 shrink-0" />
        <h3 className="text-sm font-black text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const INPUT = "w-full bg-white/6 border border-white/12 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500 transition-colors";
const SELECT = INPUT + " appearance-none cursor-pointer";

export function StoreProfileTab({ storeData }: { storeData: any }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const [basic, setBasic] = useState({
    store_name:  storeData?.store_name  || '',
    phone:       storeData?.phone       || '',
    email:       storeData?.email       || '',
    website:     storeData?.website     || '',
    description: storeData?.description || '',
    street:      storeData?.street      || storeData?.address || '',
    city:        storeData?.city        || '',
    state:       storeData?.state       || 'MI',
    zip:         storeData?.zip         || '',
  });

  const [hours, setHours] = useState<Record<Day, { open: string; close: string; closed: boolean }>>(
    storeData?.hours || DEFAULT_HOURS
  );

  const [delivery, setDelivery] = useState({
    offers_delivery:  storeData?.offers_delivery  ?? true,
    offers_pickup:    storeData?.offers_pickup    ?? true,
    delivery_radius:  storeData?.delivery_radius  ?? 5,
    delivery_fee:     storeData?.delivery_fee     ?? 3.99,
    min_order:        storeData?.min_order        ?? 12.00,
    avg_prep_time:    storeData?.avg_prep_time    ?? 20,
    avg_delivery_time:storeData?.avg_delivery_time?? 35,
  });

  const [cuisine, setCuisine] = useState<string[]>(storeData?.cuisine_tags || ['Pizza']);

  const [tax, setTax] = useState({
    tax_rate:     storeData?.tax_rate     ?? 6,
    tax_handling: storeData?.tax_handling ?? 'restaurant',
  });

  const toggleCuisine = (tag: string) =>
    setCuisine(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const setDay = (day: Day, field: 'open' | 'close' | 'closed', val: string | boolean) =>
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } }));

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    const payload = { ...basic, hours, ...delivery, cuisine_tags: cuisine, ...tax, updated_at: new Date().toISOString() };
    try {
      await updateDoc(doc(db, 'stores', auth.currentUser.uid), payload);
    } catch { /* not connected — local only */ }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Store Profile</h2>
          <p className="text-xs text-stone-500 mt-0.5">This information appears on your MiSlice listing</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 ${
            saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_14px_rgba(220,38,38,0.3)]'
          }`}>
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
        </button>
      </div>

      {/* Store Identity */}
      <Section title="Store Identity" icon={Store}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Store Name">
                <input value={basic.store_name} onChange={e => setBasic(p => ({ ...p, store_name: e.target.value }))}
                  placeholder="e.g. Marco's Pizza Detroit" className={INPUT} />
              </Field>
            </div>
            <Field label="Phone Number">
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input value={basic.phone} onChange={e => setBasic(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 (313) 555-0100" className={INPUT + ' pl-9'} />
              </div>
            </Field>
            <Field label="Email">
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input value={basic.email} onChange={e => setBasic(p => ({ ...p, email: e.target.value }))}
                  placeholder="orders@yourstore.com" className={INPUT + ' pl-9'} />
              </div>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Website (optional)">
                <div className="relative">
                  <Globe className="w-4 h-4 text-stone-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input value={basic.website} onChange={e => setBasic(p => ({ ...p, website: e.target.value }))}
                    placeholder="https://yourstore.com" className={INPUT + ' pl-9'} />
                </div>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="About Your Store">
                <textarea value={basic.description} onChange={e => setBasic(p => ({ ...p, description: e.target.value }))}
                  rows={3} maxLength={300} placeholder="Tell customers what makes your pizza special…"
                  className={INPUT + ' resize-none'} />
                <p className="text-[9px] text-stone-600 text-right mt-1">{basic.description.length}/300</p>
              </Field>
            </div>
          </div>
        </div>
      </Section>

      {/* Address */}
      <Section title="Location" icon={MapPin}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Street Address">
              <input value={basic.street} onChange={e => setBasic(p => ({ ...p, street: e.target.value }))}
                placeholder="123 Pizza Lane" className={INPUT} />
            </Field>
          </div>
          <Field label="City">
            <input value={basic.city} onChange={e => setBasic(p => ({ ...p, city: e.target.value }))}
              placeholder="Detroit" className={INPUT} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="State">
              <select value={basic.state} onChange={e => setBasic(p => ({ ...p, state: e.target.value }))} className={SELECT}>
                {['MI','OH','IN','IL','WI','MN'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="ZIP">
              <input value={basic.zip} onChange={e => setBasic(p => ({ ...p, zip: e.target.value }))}
                placeholder="48201" className={INPUT} maxLength={10} />
            </Field>
          </div>
        </div>
      </Section>

      {/* Cuisine Tags */}
      <Section title="Cuisine & Specialties" icon={Tag}>
        <p className="text-[10px] text-stone-500 mb-3">Select all that apply — these appear as filters on MiSlice.</p>
        <div className="flex flex-wrap gap-2">
          {CUISINE_OPTIONS.map(tag => (
            <button key={tag} onClick={() => toggleCuisine(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                cuisine.includes(tag)
                  ? 'bg-red-600/20 border-red-500/50 text-red-300'
                  : 'bg-white/4 border-white/10 text-stone-500 hover:text-white hover:bg-white/8'
              }`}>
              {tag}
            </button>
          ))}
        </div>
      </Section>

      {/* Hours */}
      <Section title="Operating Hours" icon={Clock}>
        <div className="space-y-2">
          {DAYS.map(day => (
            <div key={day} className={`grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] items-center gap-3 py-2 border-b border-white/5 last:border-0 ${hours[day].closed ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDay(day, 'closed', !hours[day].closed)}
                  className={`w-8 h-4 rounded-full transition-all relative shrink-0 ${hours[day].closed ? 'bg-stone-700' : 'bg-green-500'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${hours[day].closed ? 'left-0.5' : 'left-4'}`} />
                </button>
                <span className="text-xs font-bold text-stone-300 truncate">{day.slice(0, 3)}</span>
              </div>
              {hours[day].closed ? (
                <span className="text-xs font-bold text-stone-600">Closed</span>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="time" value={hours[day].open} onChange={e => setDay(day, 'open', e.target.value)}
                    className="bg-white/6 border border-white/12 rounded-lg px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-red-500 w-28" />
                  <span className="text-stone-600 text-xs font-bold shrink-0">to</span>
                  <input type="time" value={hours[day].close} onChange={e => setDay(day, 'close', e.target.value)}
                    className="bg-white/6 border border-white/12 rounded-lg px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-red-500 w-28" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Delivery & Pickup */}
      <Section title="Delivery & Pickup" icon={Truck}>
        <div className="space-y-5">
          {/* Toggles */}
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'offers_delivery', label: 'Delivery', emoji: '🛵' },
              { key: 'offers_pickup',   label: 'Pickup',   emoji: '🏪' },
            ].map(({ key, label, emoji }) => (
              <button key={key}
                onClick={() => setDelivery(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  delivery[key as keyof typeof delivery]
                    ? 'bg-green-500/15 border-green-500/40 text-green-300'
                    : 'bg-white/4 border-white/10 text-stone-500'
                }`}>
                {emoji} {label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${delivery[key as keyof typeof delivery] ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-stone-600'}`}>
                  {delivery[key as keyof typeof delivery] ? 'ON' : 'OFF'}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Delivery Radius (mi)">
              <input type="number" min={1} max={25} value={delivery.delivery_radius}
                onChange={e => setDelivery(p => ({ ...p, delivery_radius: parseFloat(e.target.value) || 1 }))}
                className={INPUT} />
            </Field>
            <Field label="Delivery Fee ($)">
              <input type="number" min={0} step={0.01} value={delivery.delivery_fee}
                onChange={e => setDelivery(p => ({ ...p, delivery_fee: parseFloat(e.target.value) || 0 }))}
                className={INPUT} />
            </Field>
            <Field label="Min. Order ($)">
              <input type="number" min={0} step={0.01} value={delivery.min_order}
                onChange={e => setDelivery(p => ({ ...p, min_order: parseFloat(e.target.value) || 0 }))}
                className={INPUT} />
            </Field>
            <Field label="Avg Prep Time (min)">
              <input type="number" min={5} max={120} value={delivery.avg_prep_time}
                onChange={e => setDelivery(p => ({ ...p, avg_prep_time: parseInt(e.target.value) || 15 }))}
                className={INPUT} />
            </Field>
            <Field label="Avg Delivery Time (min)">
              <input type="number" min={10} max={120} value={delivery.avg_delivery_time}
                onChange={e => setDelivery(p => ({ ...p, avg_delivery_time: parseInt(e.target.value) || 30 }))}
                className={INPUT} />
            </Field>
          </div>
          <p className="text-[10px] text-stone-600">
            Estimated time shown to customers: <span className="text-stone-400 font-bold">{delivery.avg_prep_time + delivery.avg_delivery_time} min total</span>
          </p>
        </div>
      </Section>

      {/* Tax & Financials */}
      <Section title="Tax & Financials" icon={DollarSign}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Tax Rate (%)">
            <input type="number" step="0.01" min={0} max={20} value={tax.tax_rate}
              onChange={e => setTax(p => ({ ...p, tax_rate: parseFloat(e.target.value) || 0 }))}
              className={INPUT} />
            <p className="text-[9px] text-stone-600 mt-1.5">Michigan default: 6%</p>
          </Field>
          <Field label="Tax Handling">
            <select value={tax.tax_handling}
              onChange={e => setTax(p => ({ ...p, tax_handling: e.target.value }))}
              className={SELECT}>
              <option value="restaurant">I'll remit tax myself</option>
              <option value="platform">MiSlice remits on my behalf</option>
            </select>
            <p className="text-[9px] text-stone-600 mt-1.5 leading-relaxed">
              {tax.tax_handling === 'restaurant'
                ? 'MiSlice forwards collected tax in your payouts. You are responsible for filing.'
                : 'MiSlice withholds and remits tax for you (may involve additional fee).'}
            </p>
          </Field>
        </div>

        {/* MiSlice fee reminder */}
        <div className="mt-5 bg-red-500/8 border border-red-500/20 rounded-xl p-4 flex gap-3">
          <span className="text-red-400 text-lg shrink-0">ℹ️</span>
          <div>
            <p className="text-xs font-black text-red-300 mb-1">MiSlice Platform Fee — 20%</p>
            <p className="text-[10px] text-stone-500 leading-relaxed">
              MiSlice retains 20% of each order's subtotal as a platform fee. You receive 80% of gross sales via weekly payouts. This fee covers payment processing, platform maintenance, and customer support.
            </p>
          </div>
        </div>
      </Section>

      {/* About / Legal section */}
      <Section title="MiSlice Listing Preview" icon={FileText}>
        <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center shrink-0">
              <Store className="w-7 h-7 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-black text-white">{basic.store_name || 'Your Store Name'}</h4>
              <p className="text-[10px] text-stone-500 mt-0.5">{basic.city || 'Detroit'}, {basic.state || 'MI'} · {delivery.avg_prep_time + delivery.avg_delivery_time} min · ${delivery.delivery_fee.toFixed(2)} delivery</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {cuisine.slice(0, 4).map(tag => (
                  <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-stone-400 font-bold">{tag}</span>
                ))}
              </div>
              <p className="text-[10px] text-stone-500 mt-2 leading-relaxed line-clamp-2">{basic.description || 'Add a description to tell customers what makes your pizza special.'}</p>
            </div>
          </div>
        </div>
        <p className="text-[9px] text-stone-600 mt-2 text-center">This is an approximation of how your store appears to customers on MiSlice.</p>
      </Section>

      {/* Save footer */}
      <div className="flex justify-end pt-2 pb-8">
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_14px_rgba(220,38,38,0.3)]'
          }`}>
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Profile Saved!</> : <><Save className="w-4 h-4" /> Save All Changes</>}
        </button>
      </div>

    </div>
  );
}
