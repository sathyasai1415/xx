import React, { useState } from 'react';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Copy, CheckCircle2, Zap, Clock, X } from 'lucide-react';
import { db, auth } from '../../../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

type DealType = 'percent' | 'fixed' | 'bogo' | 'free_delivery';

interface Deal {
  id: string;
  title: string;
  type: DealType;
  value: number;
  code: string;
  active: boolean;
  minOrder: number;
  expiresAt: string;
  usageCount: number;
  usageLimit: number;
}

const TYPE_LABELS: Record<DealType, string> = {
  percent:       '% Off',
  fixed:         '$ Off',
  bogo:          'BOGO',
  free_delivery: 'Free Delivery',
};

const TYPE_COLORS: Record<DealType, string> = {
  percent:       'bg-red-500/15 text-red-400 border-red-500/30',
  fixed:         'bg-green-500/15 text-green-400 border-green-500/30',
  bogo:          'bg-violet-500/15 text-violet-400 border-violet-500/30',
  free_delivery: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

function genCode(prefix = 'MI') {
  return `${prefix}${Math.random().toString(36).toUpperCase().slice(2, 7)}`;
}

const BLANK: Omit<Deal, 'id' | 'usageCount'> = {
  title: '',
  type: 'percent',
  value: 10,
  code: genCode(),
  active: true,
  minOrder: 0,
  expiresAt: '',
  usageLimit: 100,
};

const TEMPLATES: (Omit<Deal, 'id' | 'usageCount' | 'code'> & { label: string; emoji: string })[] = [
  { label: '10% Off',       emoji: '🔟', title: '10% Off Your Order',     type: 'percent',       value: 10,  active: true, minOrder: 0,     expiresAt: '', usageLimit: 200 },
  { label: '20% Off',       emoji: '💥', title: '20% Off — Limited Time', type: 'percent',       value: 20,  active: true, minOrder: 20,    expiresAt: '', usageLimit: 100 },
  { label: '$5 Off',        emoji: '💵', title: '$5 Off Orders $25+',      type: 'fixed',         value: 5,   active: true, minOrder: 25,    expiresAt: '', usageLimit: 150 },
  { label: 'BOGO',          emoji: '🍕', title: 'Buy 1 Get 1 Pizza',       type: 'bogo',          value: 0,   active: true, minOrder: 0,     expiresAt: '', usageLimit: 50  },
  { label: 'Free Delivery', emoji: '🛵', title: 'Free Delivery Today!',    type: 'free_delivery', value: 0,   active: true, minOrder: 15,    expiresAt: '', usageLimit: 300 },
];

interface Props { storeData: any; initialDeals?: Deal[]; }

export function DealsManagerTab({ storeData, initialDeals = [] }: Props) {
  const [deals, setDeals]             = useState<Deal[]>(initialDeals);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<Deal | null>(null);
  const [form, setForm]               = useState<Omit<Deal, 'id' | 'usageCount'>>({ ...BLANK });
  const [copiedCode, setCopiedCode]   = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);

  const storeId = auth.currentUser?.uid || storeData?.uid || 'demo';

  const openNew = (template?: typeof TEMPLATES[0]) => {
    if (template) {
      setForm({ ...BLANK, ...template, code: genCode() });
    } else {
      setForm({ ...BLANK, code: genCode() });
    }
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (deal: Deal) => {
    setEditing(deal);
    const { id, usageCount, ...rest } = deal;
    setForm(rest);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, 'stores', storeId, 'deals', editing.id), { ...form });
        setDeals(prev => prev.map(d => d.id === editing.id ? { ...editing, ...form } : d));
      } else {
        const ref = await addDoc(collection(db, 'stores', storeId, 'deals'), { ...form, usageCount: 0, createdAt: new Date().toISOString() });
        setDeals(prev => [...prev, { id: ref.id, usageCount: 0, ...form }]);
      }
    } catch {
      // Firestore may not be configured — store locally
      if (!editing) {
        setDeals(prev => [...prev, { id: crypto.randomUUID(), usageCount: 0, ...form }]);
      } else {
        setDeals(prev => prev.map(d => d.id === editing.id ? { ...editing, ...form } : d));
      }
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
  };

  const handleToggle = async (deal: Deal) => {
    const updated = { ...deal, active: !deal.active };
    try { await updateDoc(doc(db, 'stores', storeId, 'deals', deal.id), { active: !deal.active }); } catch { /* local only */ }
    setDeals(prev => prev.map(d => d.id === deal.id ? updated : d));
  };

  const handleDelete = async (deal: Deal) => {
    if (!window.confirm(`Delete "${deal.title}"?`)) return;
    try { await deleteDoc(doc(db, 'stores', storeId, 'deals', deal.id)); } catch { /* local only */ }
    setDeals(prev => prev.filter(d => d.id !== deal.id));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const active   = deals.filter(d => d.active);
  const inactive = deals.filter(d => !d.active);

  const fv = (key: keyof typeof form, val: any) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Deals & Coupons</h2>
          <p className="text-xs text-stone-500 mt-0.5">{active.length} active · {inactive.length} paused</p>
        </div>
        <button onClick={() => openNew()}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(220,38,38,0.3)]">
          <Plus className="w-4 h-4" /> Create Deal
        </button>
      </div>

      {/* Quick templates */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 mb-3">Quick Templates</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map(t => (
            <button key={t.label} onClick={() => openNew(t)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-sm font-bold text-stone-300 hover:text-white transition-all">
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active deals */}
      {active.length > 0 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> Active ({active.length})
          </p>
          <div className="space-y-3">
            {active.map(d => <DealCard key={d.id} deal={d} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} onCopy={copyCode} copied={copiedCode === d.code} />)}
          </div>
        </div>
      )}

      {/* Paused deals */}
      {inactive.length > 0 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 mb-3">Paused ({inactive.length})</p>
          <div className="space-y-3">
            {inactive.map(d => <DealCard key={d.id} deal={d} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} onCopy={copyCode} copied={copiedCode === d.code} />)}
          </div>
        </div>
      )}

      {deals.length === 0 && !showForm && (
        <div className="bg-black/40 border border-white/10 rounded-2xl py-16 text-center">
          <Tag className="w-10 h-10 text-stone-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-stone-500 mb-4">No deals yet. Create one or pick a template above.</p>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/15 rounded-3xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">{editing ? 'Edit Deal' : 'New Deal'}</h3>
              <button onClick={() => setShowForm(false)} className="text-stone-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Title */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1 block">Deal Title</label>
              <input value={form.title} onChange={e => fv('title', e.target.value)}
                placeholder="e.g. Friday Pizza Deal"
                className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500" />
            </div>

            {/* Type */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1 block">Deal Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TYPE_LABELS) as DealType[]).map(t => (
                  <button key={t} onClick={() => fv('type', t)}
                    className={`py-2 rounded-xl text-xs font-black border transition-all ${form.type === t ? TYPE_COLORS[t] : 'bg-white/4 border-white/10 text-stone-500 hover:text-white'}`}>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Value */}
            {(form.type === 'percent' || form.type === 'fixed') && (
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1 block">
                  {form.type === 'percent' ? 'Discount %' : 'Discount Amount ($)'}
                </label>
                <input type="number" min={0} value={form.value} onChange={e => fv('value', parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-2.5 text-sm font-black text-white focus:outline-none focus:border-red-500" />
              </div>
            )}

            {/* Code + min order */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1 block">Coupon Code</label>
                <div className="flex gap-1">
                  <input value={form.code} onChange={e => fv('code', e.target.value.toUpperCase())}
                    className="flex-1 min-w-0 bg-white/6 border border-white/12 rounded-xl px-3 py-2.5 text-sm font-black text-white focus:outline-none focus:border-red-500" />
                  <button onClick={() => fv('code', genCode())} className="px-2 py-2 bg-white/5 border border-white/10 rounded-xl text-stone-400 hover:text-white text-[10px] font-bold transition-colors">↺</button>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1 block">Min. Order ($)</label>
                <input type="number" min={0} value={form.minOrder} onChange={e => fv('minOrder', parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-2.5 text-sm font-black text-white focus:outline-none focus:border-red-500" />
              </div>
            </div>

            {/* Expiry + usage limit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1 block">Expires (optional)</label>
                <input type="date" value={form.expiresAt} onChange={e => fv('expiresAt', e.target.value)}
                  className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1 block">Usage Limit</label>
                <input type="number" min={1} value={form.usageLimit} onChange={e => fv('usageLimit', parseInt(e.target.value) || 1)}
                  className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-2.5 text-sm font-black text-white focus:outline-none focus:border-red-500" />
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm font-bold text-stone-300">Active immediately</span>
              <button onClick={() => fv('active', !form.active)} className="shrink-0">
                {form.active
                  ? <ToggleRight className="w-7 h-7 text-green-400" />
                  : <ToggleLeft className="w-7 h-7 text-stone-600" />}
              </button>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-stone-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DealCard({ deal, onEdit, onToggle, onDelete, onCopy, copied }: {
  key?: React.Key;
  deal: Deal;
  onEdit: (d: Deal) => void;
  onToggle: (d: Deal) => void;
  onDelete: (d: Deal) => void;
  onCopy: (code: string) => void;
  copied: boolean;
}) {
  const usagePct = deal.usageLimit ? Math.min((deal.usageCount / deal.usageLimit) * 100, 100) : 0;
  return (
    <div className={`bg-black/40 border rounded-2xl p-4 transition-all ${deal.active ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-60'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${TYPE_COLORS[deal.type]}`}>
              {deal.type === 'percent' ? `${deal.value}% off` : deal.type === 'fixed' ? `$${deal.value} off` : TYPE_LABELS[deal.type]}
            </span>
            {deal.minOrder > 0 && <span className="text-[9px] font-bold text-stone-600">Min ${deal.minOrder}</span>}
            {deal.expiresAt && <span className="flex items-center gap-1 text-[9px] font-bold text-stone-600"><Clock className="w-2.5 h-2.5" /> Exp {deal.expiresAt}</span>}
          </div>
          <p className="text-sm font-black text-white truncate">{deal.title}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onToggle(deal)} className="p-1.5 text-stone-500 hover:text-white rounded-lg hover:bg-white/8 transition-all" title="Toggle active">
            {deal.active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
          <button onClick={() => onEdit(deal)} className="p-1.5 text-stone-500 hover:text-white rounded-lg hover:bg-white/8 transition-all text-[10px] font-bold px-2">Edit</button>
          <button onClick={() => onDelete(deal)} className="p-1.5 text-red-500/50 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Code row */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2">
          <span className="text-xs font-black text-stone-300 font-mono tracking-wider">{deal.code}</span>
          <button onClick={() => onCopy(deal.code)} className="shrink-0">
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-stone-500 hover:text-white transition-colors" />}
          </button>
        </div>
        <div className="text-[10px] font-bold text-stone-600">{deal.usageCount}/{deal.usageLimit} used</div>
      </div>

      {/* Usage bar */}
      <div className="mt-2 h-1 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${usagePct > 80 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${usagePct}%` }} />
      </div>
    </div>
  );
}
