import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { AdminOnboarding } from './admin/AdminOnboarding';
import { StoreDashboard } from './admin/StoreDashboard';
import { PlatformAdminDashboard } from './admin/PlatformAdminDashboard';

export function AdminDashboard() {
  const [storeData, setStoreData] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeOrders, setStoreOrders] = useState<any[]>([]);
  
  const isPlatformAdmin = auth.currentUser?.email === 'sathyasai1415@gmail.com';

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    if (isPlatformAdmin) {
       // specific loading logic for platform admin if needed, else skip store setup
       setLoading(false);
       return;
    }

    const storeRef = doc(db, 'stores', uid);

    const unsubStore = onSnapshot(storeRef, (docSnap) => {
      if (docSnap.exists()) {
        setStoreData(docSnap.data());
      } else {
        const emailParts = auth.currentUser?.email?.split('@');
        const uniqueId = emailParts ? emailParts[0] : 'UNKNOWN';
        setDoc(storeRef, {
          unique_store_id: uniqueId,
          store_name: "My Pizza Store",
          created_at: new Date().toISOString(),
          is_active: true,
          is_setup_complete: false
        });
      }
      setLoading(false);
    });

    const dealsQ = query(collection(db, 'deals'), where('store_id', '==', uid));
    const unsubDeals = onSnapshot(dealsQ, (snapshot) => {
       const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
       setDeals(docs);
    });

    const ordersQ = query(collection(db, 'orders'), where('storeId', '==', uid));
    const unsubOrders = onSnapshot(ordersQ, (snapshot) => {
       const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
       docs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
       setStoreOrders(docs);
    });

    return () => {
      unsubStore();
      unsubDeals();
      unsubOrders();
    };
  }, []);

  if (loading) return <div className="p-20 text-center flex items-center justify-center min-h-screen bg-[#080808]"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" /></div>;

  return (
    <div className="w-full min-h-screen bg-[#080808]">
       {isPlatformAdmin ? (
         <PlatformAdminDashboard />
       ) : !storeData?.is_setup_complete ? (
         <AdminOnboarding 
           storeData={storeData} 
           onComplete={() => setStoreData({ ...storeData, is_setup_complete: true })} 
         />
       ) : (
         <StoreDashboard storeData={storeData} deals={deals} orders={storeOrders} />
       )}
    </div>
  );
}
