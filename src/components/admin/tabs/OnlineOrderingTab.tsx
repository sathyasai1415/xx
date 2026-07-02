import React, { useState } from 'react';
import { Globe, CreditCard, Truck, ShoppingBag } from 'lucide-react';

export function OnlineOrderingTab() {
  const [settings, setSettings] = useState({
    onlineOrdering: true,
    pickupEnabled: true,
    deliveryEnabled: true,
    scheduledOrders: false,
    maxScheduleDays: 3,
    minDeliveryOrder: 15,
    minPickupOrder: 0,
    deliveryFee: 4.99,
    deliveryRadius: 5,
    freeDeliveryThreshold: 40,
    uberEats: true,
    doordash: false,
    grubhub: false,
    autoAccept: false,
    orderPauseMinutes: 30,
    cardPayments: true,
    cashPayments: false,
    tipSuggestions: [15, 20, 25],
  });

  const [saved, setSaved] = useState(false);
  const toggle = (key: keyof typeof settings) => setSettings(s => ({ ...s, [key]: !s[key as keyof typeof settings] }));
  const set = (key: keyof typeof settings, val: any) => setSettings(s => ({ ...s, [key]: val }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  function Toggle({ k, label, desc }: { k: keyof typeof settings; label: string; desc?: string }) {
    const val = settings[k];
    return (
      <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{label}</p>
          {desc && <p className="text-[10px] text-stone-500 mt-0.5">{desc}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input type="checkbox" checked={!!val} onChange={() => toggle(k)} className="sr-only peer" />
          <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-red-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Online Ordering</h2>
        <button onClick={save}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Master toggle */}
      <div className={`rounded-2xl p-4 border flex items-center gap-4 transition-all ${settings.onlineOrdering ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <Globe className={`w-6 h-6 ${settings.onlineOrdering ? 'text-green-400' : 'text-red-400'} shrink-0`} />
        <div className="flex-1">
          <p className="text-sm font-black text-white">Online Ordering</p>
          <p className="text-xs text-stone-400">{settings.onlineOrdering ? 'Customers can place orders online' : 'Online ordering is paused'}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={settings.onlineOrdering} onChange={() => toggle('onlineOrdering')} className="sr-only peer" />
          <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:bg-green-500 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-7" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Order types */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-stone-500" />
            <p className="text-xs font-black uppercase tracking-widest text-stone-500">Order Types</p>
          </div>
          <Toggle k="deliveryEnabled" label="Delivery" desc="Deliver to customers in your radius" />
          <Toggle k="pickupEnabled"   label="Pickup"   desc="Customers collect in-store" />
          <Toggle k="scheduledOrders" label="Scheduled Orders" desc="Allow ordering in advance" />
          {settings.scheduledOrders && (
            <div className="pt-2">
              <label className="text-[10px] font-bold text-stone-500">Max schedule days ahead</label>
              <input type="number" value={settings.maxScheduleDays} onChange={e => set('maxScheduleDays', Number(e.target.value))} min={1} max={14}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
            </div>
          )}
        </div>

        {/* Delivery settings */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-stone-500" />
            <p className="text-xs font-black uppercase tracking-widest text-stone-500">Delivery Settings</p>
          </div>
          {[
            { label: 'Delivery fee ($)',         key: 'deliveryFee',            step: 0.5 },
            { label: 'Delivery radius (miles)',  key: 'deliveryRadius',         step: 1   },
            { label: 'Min delivery order ($)',   key: 'minDeliveryOrder',       step: 1   },
            { label: 'Free delivery above ($)',  key: 'freeDeliveryThreshold',  step: 5   },
          ].map(f => (
            <div key={f.key} className="mb-3 last:mb-0">
              <label className="text-[10px] font-bold text-stone-500">{f.label}</label>
              <input type="number" value={(settings as any)[f.key]} step={f.step}
                onChange={e => set(f.key as keyof typeof settings, Number(e.target.value))}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
            </div>
          ))}
        </div>


        {/* Payments */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-stone-500" />
            <p className="text-xs font-black uppercase tracking-widest text-stone-500">Payments</p>
          </div>
          <Toggle k="cardPayments"  label="Card Payments"  desc="Visa, Mastercard, Amex via Stripe" />
          <Toggle k="cashPayments"  label="Cash on Delivery" desc="Allow cash payment at door" />
          <Toggle k="autoAccept"    label="Auto-Accept Orders" desc="Skip manual order confirmation" />
          <div className="mt-3">
            <p className="text-[10px] font-bold text-stone-500 mb-2">Tip suggestions</p>
            <div className="flex gap-2">
              {settings.tipSuggestions.map((t, i) => (
                <input key={i} type="number" value={t}
                  onChange={e => set('tipSuggestions', settings.tipSuggestions.map((x, j) => j === i ? Number(e.target.value) : x))}
                  className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-red-500" />
              ))}
              <span className="text-xs text-stone-600 self-center">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
