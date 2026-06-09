import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Loader2, Plus, LogOut, Store as StoreIcon, Tag, DollarSign } from 'lucide-react';

export function AdminDashboard() {
  const [storeData, setStoreData] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'profile' | 'deals'>('profile');

  // Form State
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  
  // Deal form
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [dealTitle, setDealTitle] = useState('');
  const [dealOriginal, setDealOriginal] = useState('');
  const [dealDiscount, setDealDiscount] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const storeRef = doc(db, 'stores', uid);

    const unsubStore = onSnapshot(storeRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreData(data);
        setStoreName(data.store_name);
        setAddress(data.address || '');
      } else {
        // Create initial profile
        const emailParts = auth.currentUser?.email?.split('@');
        const uniqueId = emailParts ? emailParts[0] : 'UNKNOWN';
        setDoc(storeRef, {
          unique_store_id: uniqueId,
          store_name: "My Pizza Store",
          created_at: new Date().toISOString(),
          is_active: true
        });
      }
      setLoading(false);
    });

    const dealsQ = query(collection(db, 'deals'), where('store_id', '==', uid));
    const unsubDeals = onSnapshot(dealsQ, (snapshot) => {
       const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
       setDeals(docs);
    });

    return () => {
      unsubStore();
      unsubDeals();
    };
  }, []);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'stores', auth.currentUser.uid), {
      store_name: storeName,
      address,
      updated_at: new Date().toISOString()
    });
    alert('Profile Updated');
  };

  const handleAddDeal = async () => {
    if (!auth.currentUser || !dealTitle || !dealDiscount) return;
    await addDoc(collection(db, 'deals'), {
      store_id: auth.currentUser.uid,
      title: dealTitle,
      original_price: parseFloat(dealOriginal) || 0,
      discounted_price: parseFloat(dealDiscount) || 0,
      is_active: true,
      updated_at: new Date().toISOString()
    });
    setDealTitle('');
    setDealOriginal('');
    setDealDiscount('');
    setIsAddingDeal(false);
  };

  const toggleDealActive = async (dealId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'deals', dealId), {
      is_active: !currentStatus,
      updated_at: new Date().toISOString()
    });
  };

  const deleteDeal = async (dealId: string) => {
    await deleteDoc(doc(db, 'deals', dealId));
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto w-full pt-8 pb-20">
       <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-stone-200 mb-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <StoreIcon className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-2xl font-black text-stone-900 tracking-tight">{storeData?.store_name || 'Store Dashboard'}</h1>
               <p className="text-sm font-bold text-stone-400 uppercase tracking-widest mt-1">ID: {storeData?.unique_store_id}</p>
             </div>
          </div>
          <button onClick={() => auth.signOut()} className="flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold text-sm bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
       </div>

       <div className="flex gap-4 mb-8">
         <button onClick={() => setTab('profile')} className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wide flex items-center gap-2 ${tab === 'profile' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
           <StoreIcon className="w-4 h-4" /> Store Profile
         </button>
         <button onClick={() => setTab('deals')} className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wide flex items-center gap-2 ${tab === 'deals' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
           <Tag className="w-4 h-4" /> Deals & Offers
         </button>
       </div>

       {tab === 'profile' && (
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
            <h2 className="text-lg font-black text-stone-900 mb-6">Profile Settings</h2>
            <div className="space-y-4 max-w-md">
               <div>
                 <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Store Name</label>
                 <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Address</label>
                 <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500" />
               </div>
               <button onClick={handleUpdateProfile} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors mt-4">
                 Save Changes
               </button>
            </div>
         </div>
       )}

       {tab === 'deals' && (
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-stone-900">Active Deals</h2>
              <button onClick={() => setIsAddingDeal(!isAddingDeal)} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-stone-800 transition-colors">
                <Plus className="w-4 h-4" />
                New Deal
              </button>
            </div>

            {isAddingDeal && (
              <div className="mb-8 bg-stone-50 p-6 rounded-2xl border border-stone-200">
                <h3 className="text-sm font-bold text-stone-900 mb-4">Create a Deal</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                   <div className="sm:col-span-3">
                     <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Title</label>
                     <input type="text" value={dealTitle} onChange={e => setDealTitle(e.target.value)} placeholder="e.g. Large Pepperoni $9.99" className="w-full bg-white border border-stone-200 rounded-xl p-2.5" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Original Price ($)</label>
                     <input type="number" step="0.01" value={dealOriginal} onChange={e => setDealOriginal(e.target.value)} className="w-full bg-white border border-stone-200 rounded-xl p-2.5" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Discount Price ($)</label>
                     <input type="number" step="0.01" value={dealDiscount} onChange={e => setDealDiscount(e.target.value)} className="w-full bg-white border border-stone-200 rounded-xl p-2.5" />
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={handleAddDeal} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Publish Deal</button>
                   <button onClick={() => setIsAddingDeal(false)} className="bg-stone-200 text-stone-700 px-4 py-2 rounded-xl text-xs font-bold">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-4">
               {deals.length === 0 && !isAddingDeal && (
                 <p className="text-stone-500 text-sm">No deals found. Create one to show up on the local deals page!</p>
               )}
               {deals.map(deal => (
                 <div key={deal.id} className={`p-4 rounded-2xl border flex items-center justify-between ${deal.is_active ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-200 opacity-60'}`}>
                    <div>
                      <h4 className="font-bold text-stone-900">{deal.title}</h4>
                      <div className="flex gap-4 mt-2">
                         <span className="text-xs text-stone-500 line-through">${deal.original_price?.toFixed(2)}</span>
                         <span className="text-xs font-bold text-green-700">${deal.discounted_price?.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={() => toggleDealActive(deal.id, deal.is_active)} className="text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg">
                         {deal.is_active ? 'Disable' : 'Enable'}
                       </button>
                       <button onClick={() => deleteDeal(deal.id)} className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg">
                         Delete
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
       )}
    </div>
  );
}
