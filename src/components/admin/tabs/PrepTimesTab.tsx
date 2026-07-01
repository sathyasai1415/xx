import React, { useState } from 'react';
import { Timer, Zap } from 'lucide-react';

interface PrepCategory {
  id: string;
  name: string;
  prepMinutes: number;
  enabled: boolean;
}

const DEFAULTS: PrepCategory[] = [
  { id: '1', name: 'Standard Pizza',    prepMinutes: 15, enabled: true },
  { id: '2', name: 'Stuffed Crust',     prepMinutes: 20, enabled: true },
  { id: '3', name: 'Specialty / Large', prepMinutes: 25, enabled: true },
  { id: '4', name: 'Calzones',          prepMinutes: 18, enabled: true },
  { id: '5', name: 'Sides & Drinks',    prepMinutes: 5,  enabled: true },
  { id: '6', name: 'Desserts',          prepMinutes: 10, enabled: true },
];

export function PrepTimesTab() {
  const [cats, setCats] = useState<PrepCategory[]>(DEFAULTS);
  const [busyMode, setBusyMode] = useState(false);
  const [busyMultiplier, setBusyMultiplier] = useState(1.5);
  const [saved, setSaved] = useState(false);

  const update = (id: string, key: keyof PrepCategory, val: any) =>
    setCats(c => c.map(x => x.id === id ? { ...x, [key]: val } : x));

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Preparation Times</h2>
        <button onClick={save}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Busy mode toggle */}
      <div className={`rounded-2xl p-4 border flex items-center gap-4 transition-all ${busyMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-black/40 border-white/10'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${busyMode ? 'bg-orange-500/20' : 'bg-white/5'}`}>
          <Zap className={`w-5 h-5 ${busyMode ? 'text-orange-400' : 'text-stone-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white">Busy Mode</p>
          <p className="text-xs text-stone-400">Automatically multiply all prep times during peak hours</p>
        </div>
        <div className="flex items-center gap-3">
          {busyMode && (
            <select value={busyMultiplier} onChange={e => setBusyMultiplier(Number(e.target.value))}
              className="bg-black/60 border border-orange-500/30 text-xs font-bold text-orange-400 rounded-lg px-2 py-1 focus:outline-none">
              <option value={1.25}>×1.25</option>
              <option value={1.5}>×1.5</option>
              <option value={2}>×2.0</option>
            </select>
          )}
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={busyMode} onChange={e => setBusyMode(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-orange-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>
      </div>

      {/* Category prep times */}
      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
          <Timer className="w-4 h-4 text-stone-500" />
          <p className="text-xs font-black uppercase tracking-widest text-stone-500">Category Prep Times</p>
        </div>
        <div className="divide-y divide-white/5">
          {cats.map(cat => (
            <div key={cat.id} className="flex items-center gap-4 px-5 py-4">
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" checked={cat.enabled} onChange={e => update(cat.id, 'enabled', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-red-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
              </label>
              <span className={`flex-1 text-sm font-bold ${cat.enabled ? 'text-white' : 'text-stone-600'}`}>{cat.name}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => update(cat.id, 'prepMinutes', Math.max(5, cat.prepMinutes - 5))}
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-stone-400 hover:text-white hover:bg-white/10 font-black text-sm flex items-center justify-center transition-colors">−</button>
                <span className="text-sm font-black text-white w-14 text-center">
                  {cat.prepMinutes} min
                  {busyMode && <span className="text-orange-400 text-[9px] block">({Math.round(cat.prepMinutes * busyMultiplier)} busy)</span>}
                </span>
                <button onClick={() => update(cat.id, 'prepMinutes', cat.prepMinutes + 5)}
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-stone-400 hover:text-white hover:bg-white/10 font-black text-sm flex items-center justify-center transition-colors">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ETA breakdown */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <p className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4">Estimated Delivery ETA Breakdown</p>
        <div className="space-y-3">
          {[
            { label: 'Order accepted → Prep start', value: '2 min' },
            { label: 'Average prep time', value: `${Math.round(cats.filter(c => c.enabled).reduce((s, c) => s + c.prepMinutes, 0) / cats.filter(c => c.enabled).length)} min` },
            { label: 'Ready → Driver pickup', value: '5 min' },
            { label: 'Delivery radius (avg)', value: '15 min' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-stone-400">{row.label}</span>
              <span className="text-sm font-black text-white">{row.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-black text-white">Total ETA shown to customer</span>
            <span className="text-lg font-black text-red-400">~37 min</span>
          </div>
        </div>
      </div>
    </div>
  );
}
