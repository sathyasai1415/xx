import React, { useState, useRef } from 'react';
import {
  ScanLine, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Save, CheckCircle2, Camera, RefreshCw, Upload, X, DollarSign,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  available: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
  items: MenuItem[];
}

const DEFAULT_MENU: MenuCategory[] = [
  { id: 'pizzas',    emoji: '🍕', name: 'Pizzas',        items: [] },
  { id: 'beverages', emoji: '🥤', name: 'Beverages',     items: [] },
  { id: 'sides',     emoji: '🍟', name: 'Sides',         items: [] },
  { id: 'desserts',  emoji: '🍰', name: 'Desserts',      items: [] },
  { id: 'dips',      emoji: '🥣', name: 'Dips & Sauces', items: [] },
];

// Simulated OCR result after "scanning"
const SCAN_RESULT: MenuCategory[] = [
  { id: 'pizzas', emoji: '🍕', name: 'Pizzas', items: [
    { id: 'p1', name: 'Large Pepperoni',     price: 16.99, description: '8 slices, classic pepperoni', available: true },
    { id: 'p2', name: 'Medium Cheese',       price: 12.99, description: '6 slices, mozzarella blend',  available: true },
    { id: 'p3', name: 'Small BBQ Chicken',   price: 10.99, description: '4 slices, BBQ sauce base',    available: true },
    { id: 'p4', name: 'Large Veggie',        price: 15.49, description: '8 slices, garden veggies',    available: true },
    { id: 'p5', name: 'Gluten Free Cheese',  price: 14.99, description: 'GF crust available',          available: true },
  ]},
  { id: 'beverages', emoji: '🥤', name: 'Beverages', items: [
    { id: 'b1', name: 'Coca-Cola (2L)',   price: 3.49, available: true },
    { id: 'b2', name: 'Pepsi (2L)',       price: 3.49, available: true },
    { id: 'b3', name: 'Lemonade (20oz)', price: 2.49, available: true },
  ]},
  { id: 'sides', emoji: '🍟', name: 'Sides', items: [
    { id: 's1', name: 'Garlic Bread',  price: 4.99, available: true },
    { id: 's2', name: 'Caesar Salad', price: 6.99, available: true },
    { id: 's3', name: 'Chicken Wings (8pc)', price: 11.99, available: true },
  ]},
  { id: 'dips', emoji: '🥣', name: 'Dips & Sauces', items: [
    { id: 'd1', name: 'Ranch Dip',    price: 0.99, available: true },
    { id: 'd2', name: 'BBQ Sauce',    price: 0.99, available: true },
    { id: 'd3', name: 'Garlic Butter',price: 0.99, available: true },
  ]},
  { id: 'desserts', emoji: '🍰', name: 'Desserts', items: [
    { id: 'des1', name: 'Chocolate Brownie', price: 3.99, available: true },
    { id: 'des2', name: 'Cinnamon Twists',   price: 4.49, available: true },
  ]},
];

// ─── Scan Modal ───────────────────────────────────────────────────────────────

function ScanModal({ onClose, onImport }: { onClose: () => void; onImport: (menu: MenuCategory[]) => void }) {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  const startScan = () => {
    setPhase('scanning');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setPhase('done'); return 100; }
        return p + 4;
      });
    }, 80);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/15 rounded-3xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-black text-white">Import Menu</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {phase === 'idle' && (
          <>
            <div className="bg-black/60 border border-white/10 rounded-2xl aspect-video flex flex-col items-center justify-center gap-3 mb-5">
              <Camera className="w-12 h-12 text-stone-600" />
              <p className="text-xs font-bold text-stone-500 text-center px-4">
                Point your camera at your menu or price list.<br />
                MiSlice AI will scan and extract all items and prices.
              </p>
            </div>
            <div className="space-y-2 mb-5">
              {['Physical menu / printed price list', 'Digital menu screenshot', 'PDF menu (upload)', 'Website URL menu'].map(opt => (
                <div key={opt} className="flex items-center gap-3 p-3 bg-white/4 border border-white/8 rounded-xl">
                  <span className="w-4 h-4 rounded-full border-2 border-red-500 flex-shrink-0" />
                  <span className="text-sm font-bold text-stone-300">{opt}</span>
                </div>
              ))}
            </div>
            <button onClick={startScan}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(220,38,38,0.3)]">
              <ScanLine className="w-4 h-4" /> Start Scanning
            </button>
          </>
        )}

        {phase === 'scanning' && (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center">
              <ScanLine className="w-8 h-8 text-red-400 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black text-white mb-1">Scanning your menu…</p>
              <p className="text-xs text-stone-500">{progress < 40 ? 'Detecting items…' : progress < 70 ? 'Reading prices…' : 'Organizing categories…'}</p>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs font-black text-red-400">{progress}%</p>
          </div>
        )}

        {phase === 'done' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Scan Complete!</p>
              <p className="text-xs text-stone-500 mt-1">Found 5 categories · 18 items · 18 prices</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-left text-xs font-bold text-stone-400 space-y-1">
              {SCAN_RESULT.map(c => (
                <div key={c.id}>{c.emoji} {c.name} — {c.items.length} items</div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-stone-400 bg-white/5 border border-white/10 hover:bg-white/8 transition-all">Cancel</button>
              <button onClick={() => { onImport(SCAN_RESULT); onClose(); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-all">
                Import All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Item editor row ──────────────────────────────────────────────────────────

function ItemRow({ item, onUpdate, onDelete }: { key?: React.Key; item: MenuItem; onUpdate: (item: MenuItem) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(item);

  if (editing) return (
    <div className="bg-white/5 border border-white/12 rounded-xl p-3 space-y-2">
      <div className="grid grid-cols-[1fr_100px] gap-2">
        <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
          className="bg-black/40 border border-white/12 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-red-500" />
        <div className="flex items-center bg-black/40 border border-white/12 rounded-lg overflow-hidden">
          <span className="text-xs text-stone-500 pl-2">$</span>
          <input type="number" min={0} step={0.01} value={draft.price}
            onChange={e => setDraft(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
            className="flex-1 bg-transparent py-1.5 pr-2 text-sm font-black text-white focus:outline-none text-right" />
        </div>
      </div>
      <input value={draft.description || ''} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))}
        placeholder="Description (optional)"
        className="w-full bg-black/40 border border-white/12 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-400 focus:outline-none focus:border-red-500" />
      <div className="flex gap-2">
        <button onClick={() => setEditing(false)} className="text-xs font-bold text-stone-500 px-3 py-1.5 bg-white/5 rounded-lg hover:text-white transition-colors">Cancel</button>
        <button onClick={() => { onUpdate(draft); setEditing(false); }}
          className="text-xs font-bold text-white px-3 py-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Save</button>
      </div>
    </div>
  );

  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/3 transition-colors group ${!item.available ? 'opacity-40' : ''}`}>
      <button onClick={() => onUpdate({ ...item, available: !item.available })}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${item.available ? 'bg-green-500 border-green-500' : 'border-stone-600'}`}>
        {item.available && <span className="text-[8px] text-white font-black">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{item.name}</p>
        {item.description && <p className="text-[10px] text-stone-600 truncate">{item.description}</p>}
      </div>
      <span className="text-sm font-black text-white shrink-0">${item.price.toFixed(2)}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => setEditing(true)} className="p-1.5 text-stone-500 hover:text-white rounded-lg hover:bg-white/8 transition-all">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-red-500/50 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MenuPricesTab({ storeData }: { storeData: any }) {
  const [menu, setMenu]           = useState<MenuCategory[]>(DEFAULT_MENU);
  const [showScan, setShowScan]   = useState(false);
  const [openCats, setOpenCats]   = useState<Set<string>>(new Set(['pizzas']));
  const [saved, setSaved]         = useState(false);
  const [addingTo, setAddingTo]   = useState<string | null>(null);
  const [newItem, setNewItem]     = useState<{ name: string; price: string; description: string }>({ name: '', price: '', description: '' });

  const toggleCat = (id: string) => setOpenCats(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const importMenu = (scanned: MenuCategory[]) => setMenu(scanned);

  const updateItem = (catId: string, item: MenuItem) =>
    setMenu(prev => prev.map(c => c.id === catId ? { ...c, items: c.items.map(i => i.id === item.id ? item : i) } : c));

  const deleteItem = (catId: string, itemId: string) =>
    setMenu(prev => prev.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c));

  const addItem = (catId: string) => {
    if (!newItem.name.trim()) return;
    const item: MenuItem = { id: crypto.randomUUID(), name: newItem.name, price: parseFloat(newItem.price) || 0, description: newItem.description, available: true };
    setMenu(prev => prev.map(c => c.id === catId ? { ...c, items: [...c.items, item] } : c));
    setNewItem({ name: '', price: '', description: '' });
    setAddingTo(null);
  };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const totalItems = menu.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="space-y-5">
      {showScan && <ScanModal onClose={() => setShowScan(false)} onImport={importMenu} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Menu & Prices</h2>
          <p className="text-xs text-stone-500 mt-0.5">{totalItems} items across {menu.filter(c => c.items.length > 0).length} categories</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScan(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-300 font-bold text-sm rounded-xl transition-all">
            <Camera className="w-4 h-4" /> Import Menu
          </button>
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-all ${
              saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_14px_rgba(220,38,38,0.3)]'
            }`}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Menu</>}
          </button>
        </div>
      </div>

      {/* Import prompt if empty */}
      {totalItems === 0 && (
        <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl p-5 flex items-start gap-4">
          <Camera className="w-6 h-6 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-violet-300 mb-1">Import your menu in seconds</p>
            <p className="text-xs text-stone-500 leading-relaxed mb-3">
              Point your camera at your printed or digital menu. MiSlice AI will automatically extract all items, categories, and prices — no manual typing needed.
            </p>
            <button onClick={() => setShowScan(true)}
              className="px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all">
              Scan My Menu
            </button>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-3">
        {menu.map(cat => {
          const isOpen = openCats.has(cat.id);
          return (
            <div key={cat.id} className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
              {/* Category header */}
              <button onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/3 transition-colors">
                <span className="text-xl">{cat.emoji}</span>
                <span className="flex-1 text-left text-sm font-black text-white">{cat.name}</span>
                <span className="text-[10px] font-bold text-stone-600 mr-2">{cat.items.length} items</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-stone-600" /> : <ChevronDown className="w-4 h-4 text-stone-600" />}
              </button>

              {isOpen && (
                <div className="border-t border-white/8 px-4 py-3 space-y-1">
                  {cat.items.map(item => (
                    <ItemRow key={item.id} item={item}
                      onUpdate={i => updateItem(cat.id, i)}
                      onDelete={() => deleteItem(cat.id, item.id)} />
                  ))}

                  {/* Add item inline */}
                  {addingTo === cat.id ? (
                    <div className="bg-white/5 border border-white/12 rounded-xl p-3 mt-2 space-y-2">
                      <div className="grid grid-cols-[1fr_100px] gap-2">
                        <input autoFocus value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                          placeholder="Item name" onKeyDown={e => e.key === 'Enter' && addItem(cat.id)}
                          className="bg-black/40 border border-white/12 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-red-500 placeholder:text-stone-600" />
                        <div className="flex items-center bg-black/40 border border-white/12 rounded-lg overflow-hidden">
                          <span className="text-xs text-stone-500 pl-2">$</span>
                          <input type="number" min={0} step={0.01} value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))}
                            placeholder="0.00" className="flex-1 bg-transparent py-1.5 pr-2 text-sm font-black text-white focus:outline-none text-right" />
                        </div>
                      </div>
                      <input value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                        placeholder="Description (optional)"
                        className="w-full bg-black/40 border border-white/12 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-400 focus:outline-none focus:border-red-500 placeholder:text-stone-600" />
                      <div className="flex gap-2">
                        <button onClick={() => { setAddingTo(null); setNewItem({ name:'',price:'',description:'' }); }}
                          className="text-xs font-bold text-stone-500 px-3 py-1.5 bg-white/5 rounded-lg hover:text-white transition-colors">Cancel</button>
                        <button onClick={() => addItem(cat.id)}
                          className="text-xs font-bold text-white px-3 py-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Add Item</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setAddingTo(cat.id); setOpenCats(prev => new Set([...prev, cat.id])); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 mt-1 text-xs font-bold text-stone-600 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all">
                      <Plus className="w-3.5 h-3.5" /> Add item to {cat.name}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add custom category */}
        <button className="flex items-center gap-2 w-full px-5 py-3.5 bg-white/3 border border-dashed border-white/15 hover:border-red-500/40 hover:bg-red-500/5 rounded-2xl text-sm font-bold text-stone-600 hover:text-red-400 transition-all">
          <Plus className="w-4 h-4" /> Add New Category
        </button>
      </div>
    </div>
  );
}
