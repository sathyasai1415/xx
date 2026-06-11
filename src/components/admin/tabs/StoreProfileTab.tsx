import React, { useState } from 'react';
import { db, auth } from '../../../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { Settings, Save, MapPin } from 'lucide-react';

export function StoreProfileTab({ storeData }: { storeData: any }) {
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    store_name: storeData?.store_name || '',
    phone: storeData?.phone || '',
    email: storeData?.email || '',
    address: storeData?.address || '',
    city: storeData?.city || '',
    state: storeData?.state || '',
    zip: storeData?.zip || '',
    description: storeData?.description || '',
    tax_rate: storeData?.tax_rate || 6,
    tax_handling: storeData?.tax_handling || 'restaurant', // 'restaurant' or 'platform'
  });

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    await updateDoc(doc(db, 'stores', auth.currentUser.uid), {
      ...data,
      updated_at: new Date().toISOString()
    });
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-white">Store Profile & Settings</h2>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
         <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4"><Settings className="w-5 h-5 text-red-500" /> Basic Details</h3>
         <div className="grid grid-cols-2 gap-4">
           <div className="col-span-2">
             <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Store Name</label>
             <input type="text" value={data.store_name} onChange={e => setData({...data, store_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none" />
           </div>
           <div>
             <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Phone</label>
             <input type="text" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none" />
           </div>
           <div>
             <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Email</label>
             <input type="text" value={data.email} onChange={e => setData({...data, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none" />
           </div>
           <div className="col-span-2">
             <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Address</label>
             <input type="text" value={data.address} onChange={e => setData({...data, address: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none" />
           </div>
           <div className="col-span-2 sm:col-span-1">
             <label className="block text-xs font-bold text-stone-500 uppercase mb-2">City</label>
             <input type="text" value={data.city} onChange={e => setData({...data, city: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none" />
           </div>
           <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-stone-500 uppercase mb-2">State</label>
               <input type="text" value={data.state} onChange={e => setData({...data, state: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none" />
             </div>
             <div>
               <label className="block text-xs font-bold text-stone-500 uppercase mb-2">ZIP</label>
               <input type="text" value={data.zip} onChange={e => setData({...data, zip: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none" />
             </div>
           </div>
         </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
         <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4"><DollarSign className="w-5 h-5 text-red-500" /> Tax & Financials</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div>
             <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Tax Rate (%)</label>
             <input type="number" step="0.01" value={data.tax_rate} onChange={e => setData({...data, tax_rate: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none" />
           </div>
           <div>
             <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Tax Handling Mode</label>
             <select value={data.tax_handling} onChange={e => setData({...data, tax_handling: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none appearance-none">
               <option value="restaurant">Pay Tax to Restaurant</option>
               <option value="platform">Platform Handles Tax</option>
             </select>
             <p className="text-[10px] text-stone-500 mt-2 font-bold leading-relaxed">
               {data.tax_handling === 'restaurant' 
                 ? 'MiSlice will forward all collected tax directly to your payouts. You are responsible for remitting it.'
                 : 'MiSlice will withhold tax and remit it on your behalf.'}
             </p>
           </div>
         </div>
      </div>
    </div>
  );
}

// Icon for the header
function DollarSign(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
}
