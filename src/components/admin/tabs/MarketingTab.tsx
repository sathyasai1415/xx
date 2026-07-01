import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Mail, Smartphone, Tag } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: 'discount' | 'bogo' | 'free-delivery' | 'email';
  status: 'active' | 'paused' | 'draft';
  discount: number;
  reach: number;
  clicks: number;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Weekend Special',       type: 'discount',      status: 'active', discount: 20, reach: 412, clicks: 89 },
  { id: '2', name: 'Buy One Get One',        type: 'bogo',          status: 'active', discount: 50, reach: 280, clicks: 67 },
  { id: '3', name: 'Free Delivery Tuesday',  type: 'free-delivery', status: 'paused', discount: 0,  reach: 190, clicks: 41 },
  { id: '4', name: 'Loyalty Email Blast',    type: 'email',         status: 'draft',  discount: 15, reach: 0,   clicks: 0  },
];

const TYPE_LABEL: Record<string, string> = { discount: '% Off', bogo: 'BOGO', 'free-delivery': 'Free Delivery', email: 'Email' };
const TYPE_ICON: Record<string, React.ElementType> = { discount: Tag, bogo: Tag, 'free-delivery': Tag, email: Mail };
const STATUS_COLOR: Record<string, string> = { active: 'text-green-400 bg-green-500/10 border-green-500/25', paused: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25', draft: 'text-stone-400 bg-white/5 border-white/10' };

export function MarketingTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [showNew, setShowNew] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'discount' as Campaign['type'], discount: 10 });

  const toggleStatus = (id: string) =>
    setCampaigns(c => c.map(x => x.id === id ? { ...x, status: x.status === 'active' ? 'paused' : 'active' } : x));

  const addCampaign = () => {
    if (!newCampaign.name) return;
    setCampaigns(c => [...c, { ...newCampaign, id: Date.now().toString(), status: 'draft', reach: 0, clicks: 0 }]);
    setNewCampaign({ name: '', type: 'discount', discount: 10 });
    setShowNew(false);
  };

  const totalReach  = campaigns.filter(c => c.status === 'active').reduce((s, c) => s + c.reach, 0);
  const totalClicks = campaigns.filter(c => c.status === 'active').reduce((s, c) => s + c.clicks, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Marketing</h2>
        <button onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length, icon: Megaphone, color: 'text-violet-400' },
          { label: 'Total Reach',      value: totalReach.toLocaleString(),                          icon: Smartphone, color: 'text-blue-400'   },
          { label: 'Total Clicks',     value: totalClicks.toLocaleString(),                          icon: Tag,        color: 'text-green-400'  },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center">
              <Icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-bold text-stone-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* New campaign form */}
      {showNew && (
        <div className="bg-white/5 border border-white/15 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-stone-400">New Campaign</p>
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Campaign name"
              value={newCampaign.name}
              onChange={e => setNewCampaign(n => ({ ...n, name: e.target.value }))}
              className="col-span-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-red-500"
            />
            <select
              value={newCampaign.type}
              onChange={e => setNewCampaign(n => ({ ...n, type: e.target.value as Campaign['type'] }))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            >
              <option value="discount">% Discount</option>
              <option value="bogo">Buy 1 Get 1</option>
              <option value="free-delivery">Free Delivery</option>
              <option value="email">Email Blast</option>
            </select>
            {newCampaign.type === 'discount' && (
              <input
                type="number"
                placeholder="% off"
                value={newCampaign.discount}
                onChange={e => setNewCampaign(n => ({ ...n, discount: Number(e.target.value) }))}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            )}
            <button onClick={addCampaign}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-colors">
              Create
            </button>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div className="space-y-3">
        {campaigns.map(c => {
          const Icon = TYPE_ICON[c.type] || Tag;
          const ctr = c.reach ? ((c.clicks / c.reach) * 100).toFixed(1) : '0';
          return (
            <div key={c.id} className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white">{c.name}</p>
                  <p className="text-[10px] text-stone-500">{TYPE_LABEL[c.type]}{c.type === 'discount' ? ` · ${c.discount}% off` : ''}</p>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${STATUS_COLOR[c.status]}`}>
                  {c.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Reach',  value: c.reach.toLocaleString()  },
                  { label: 'Clicks', value: c.clicks.toLocaleString() },
                  { label: 'CTR',    value: `${ctr}%`                 },
                ].map(m => (
                  <div key={m.label} className="bg-white/4 rounded-lg p-2 text-center">
                    <p className="text-xs font-black text-white">{m.value}</p>
                    <p className="text-[9px] text-stone-600">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleStatus(c.id)}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg border transition-colors ${c.status === 'active' ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}>
                  {c.status === 'active' ? 'Pause' : 'Activate'}
                </button>
                <button onClick={() => setCampaigns(cs => cs.filter(x => x.id !== c.id))}
                  className="p-1.5 text-stone-700 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
