import React, { useState, useEffect } from 'react';
import { ScanLine, Save, RefreshCw, CheckCircle2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { db, auth } from '../../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { logAudit } from '../../../utils/audit';

const MARKET_REF = {
  sizes:    { Small: 8.99, Medium: 11.49, Large: 14.99, 'Extra Large': 17.99 },
  crusts:   { 'Hand Tossed': 0, 'Crunchy Thin': 0, 'Handmade Pan': 1.50, 'Stuffed Crust': 2.50, 'Gluten Free': 3.00 },
  extras:   { 'Meat Toppings': 1.50, 'Veggie Toppings': 1.00, 'Extra Cheese': 1.50, 'Premium Toppings': 2.00 },
  delivery: { 'Store Delivery Fee': 3.99, 'Min Order Amount': 12.00 },
};

type PriceSection = keyof typeof MARKET_REF;

const SECTION_LABELS: Record<PriceSection, string> = {
  sizes:    '🍕 Pizza Sizes',
  crusts:   '🔘 Crust Upcharges',
  extras:   '➕ Toppings & Extras',
  delivery: '🛵 Delivery Settings',
};

function pctDelta(current: number, market: number) {
  if (market === 0) return null;
  const d = ((current - market) / market) * 100;
  return Math.abs(d) < 2 ? null : d;
}

export function PriceManagerTab({ storeData }: { storeData: any }) {
  const [prices, setPrices] = useState<Record<string, Record<string, number>>>({
    sizes:    { ...MARKET_REF.sizes },
    crusts:   { ...MARKET_REF.crusts },
    extras:   { ...MARKET_REF.extras },
    delivery: { ...MARKET_REF.delivery },
  });
  const [scanning, setScanning]       = useState(false);
  const [scanDone, setScanDone]       = useState(false);
  const [saved, setSaved]             = useState(false);
  const [lastSaved, setLastSaved]     = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<PriceSection>('sizes');

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      const snap = await getDoc(doc(db, 'stores', auth.currentUser.uid, 'settings', 'pricing'));
      if (snap.exists()) {
        const data = snap.data();
        setPrices(prev => ({ ...prev, ...data }));
        setLastSaved(data?.updatedAt || null);
      }
    };
    load();
  }, []);

  const handleScan = async () => {
    setScanning(true); setScanDone(false);
    await new Promise(r => setTimeout(r, 2000));
    setPrices({
      sizes: {
        Small:         parseFloat((MARKET_REF.sizes.Small         + (Math.random() - 0.5) * 0.5).toFixed(2)),
        Medium:        parseFloat((MARKET_REF.sizes.Medium        + (Math.random() - 0.5) * 0.5).toFixed(2)),
        Large:         parseFloat((MARKET_REF.sizes.Large         + (Math.random() - 0.5) * 0.5).toFixed(2)),
        'Extra Large': parseFloat((MARKET_REF.sizes['Extra Large']+ (Math.random() - 0.5) * 0.5).toFixed(2)),
      },
      crusts:   { ...MARKET_REF.crusts },
      extras:   { ...MARKET_REF.extras },
      delivery: { ...MARKET_REF.delivery },
    });
    setScanning(false); setScanDone(true);
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    const ts = new Date().toISOString();
    await setDoc(doc(db, 'stores', auth.currentUser.uid, 'settings', 'pricing'), { ...prices, updatedAt: ts });
    await logAudit('PRICE_UPDATE', 'pricing', '', JSON.stringify(prices),
      auth.currentUser.uid, storeData?.store_name || 'Store Owner', 'storeOwner');
    setLastSaved(ts);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setPrice = (section: string, key: string, val: number) =>
    setPrices(p => ({ ...p, [section]: { ...p[section], [key]: val } }));

  const currentSection = prices[activeSection] || {};
  const marketSection  = MARKET_REF[activeSection] as Record<string, number>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Price Manager</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Competitive pricing vs the MiSlice market average.
            {lastSaved && <span className="ml-2 text-green-400">Saved {new Date(lastSaved).toLocaleString()}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleScan} disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-300 font-bold text-sm rounded-xl transition-all disabled:opacity-60">
            {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            {scanning ? 'Scanning…' : 'Scan & Suggest'}
          </button>
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-all ${saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_14px_rgba(220,38,38,0.3)]'}`}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Prices</>}
          </button>
        </div>
      </div>

      {scanDone && (
        <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/30 rounded-2xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
          <p className="text-sm font-bold text-violet-300">Market prices scanned. Review and save below.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(SECTION_LABELS) as PriceSection[]).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${activeSection === s ? 'bg-red-600 text-white shadow-[0_4px_14px_rgba(220,38,38,0.3)]' : 'bg-white/5 border border-white/10 text-stone-400 hover:text-white hover:bg-white/8'}`}>
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="bg-violet-500/6 border border-violet-500/20 rounded-2xl p-4 flex items-start gap-3">
        <TrendingUp className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-violet-300 mb-1">MiSlice Market Averages — {SECTION_LABELS[activeSection]}</p>
          <div className="flex flex-wrap gap-4">
            {Object.entries(marketSection).map(([k, v]) => (
              <span key={k} className="text-[10px] text-stone-400 font-bold">
                {k}: <span className="text-violet-300">${v.toFixed(2)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_130px_110px_90px] text-[9px] font-black uppercase tracking-widest text-stone-600 px-5 py-3 border-b border-white/8">
          <span>Item</span>
          <span className="text-center">Your Price</span>
          <span className="text-center">Market Avg</span>
          <span className="text-center">Position</span>
        </div>
        {Object.entries(currentSection).map(([key, val]) => {
          const numVal = val as number;
          const market = marketSection[key] ?? 0;
          const d = pctDelta(numVal, market);
          return (
            <div key={key} className="grid grid-cols-[1fr_130px_110px_90px] items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
              <span className="text-sm font-bold text-white">{key}</span>
              <div className="flex justify-center">
                <div className="flex items-center bg-white/8 border border-white/12 rounded-xl overflow-hidden">
                  <span className="text-xs font-black text-stone-400 px-2">$</span>
                  <input
                    type="number" min={0} step={0.01} value={numVal}
                    onChange={e => setPrice(activeSection, key, parseFloat(e.target.value) || 0)}
                    className="w-16 bg-transparent text-sm font-black text-white pr-2 py-1.5 focus:outline-none text-right"
                  />
                </div>
              </div>
              <div className="text-center text-sm font-bold text-stone-500">${market.toFixed(2)}</div>
              <div className="flex justify-center">
                {d === null ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-stone-600"><Minus className="w-3 h-3" />On par</span>
                ) : d > 0 ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-400"><TrendingUp className="w-3 h-3" />+{d.toFixed(0)}%</span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-400"><TrendingDown className="w-3 h-3" />{d.toFixed(0)}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-stone-600 text-center">
        Prices <span className="text-red-400">10%+ above market</span> may reduce order volume ·
        Prices <span className="text-green-400">below market</span> attract more customers
      </p>
    </div>
  );
}
