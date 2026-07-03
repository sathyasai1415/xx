import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, BellOff, Tag, Zap, TrendingDown, Star, Clock,
  Check, Trash2, ChevronRight, Settings,
  ShoppingBag, Gift, MapPin, X, Plus,
} from 'lucide-react';
import {
  collection, query, where, onSnapshot, orderBy,
  doc, updateDoc, deleteDoc, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { registerFcmToken, disableFcmToken } from '../lib/fcm';

interface Notification {
  id: string;
  type: 'deal' | 'price_drop' | 'new_store' | 'order' | 'reward' | 'weekly';
  title: string;
  body: string;
  time: string;
  read: boolean;
  cta?: string;
  ctaView?: string;
  emoji: string;
}

const MOCK_NOTIFS: Notification[] = [
  { id: 'n1', type: 'price_drop', emoji: '📉', title: 'Price Drop Alert!', body: 'Pepperoni Large is now $11.99 at Shamz Pizza — $3 less than yesterday.', time: '5 min ago', read: false, cta: 'Order Now', ctaView: 'home' },
  { id: 'n2', type: 'deal', emoji: '🔥', title: 'Flash Deal: 40% Off', body: "Mario's Pizza is running a 40% off deal for the next 2 hours only!", time: '18 min ago', read: false, cta: 'Grab Deal', ctaView: 'local-deals' },
  { id: 'n3', type: 'reward', emoji: '🎁', title: 'You Earned 25 Points!', body: 'Your review of Pizza Palace earned you 25 reward points. Redeem for free food.', time: '2h ago', read: false, cta: 'View Rewards', ctaView: 'rewards' },
  { id: 'n4', type: 'order', emoji: '📦', title: 'Order Delivered!', body: 'Your order from Shamz Pizza has been delivered. Enjoy your pizza! 🍕', time: '3h ago', read: true },
  { id: 'n5', type: 'new_store', emoji: '🏪', title: 'New Store Near You', body: 'Detroit Deep Dish just joined MiSlice. Check their opening special deals.', time: 'Yesterday', read: true, cta: 'View Store', ctaView: 'home' },
  { id: 'n6', type: 'price_drop', emoji: '💰', title: 'Your Saved Pizza is Cheaper', body: 'Your "Meat Lover Large" build is now $2.50 cheaper at 3 stores today.', time: 'Yesterday', read: true, cta: 'Compare', ctaView: 'compare' },
  { id: 'n7', type: 'weekly', emoji: '📊', title: 'Your Weekly Pizza Recap', body: 'You saved $14.30 this week by using MiSlice to compare prices. 🎉', time: '2 days ago', read: true },
  { id: 'n8', type: 'deal', emoji: '🏷️', title: 'Deal Expiring Soon', body: 'The "Lunch Special" deal at Pizza Palace expires in 2 hours. Use code LUNCH699.', time: '2 days ago', read: true, cta: 'Use Deal', ctaView: 'local-deals' },
];

const PREF_SECTIONS = [
  {
    label: 'Price & Deals',
    prefs: [
      { key: 'priceDrops', label: 'Price Drop Alerts', desc: "When a pizza you've searched gets cheaper", icon: TrendingDown, color: 'text-green-400' },
      { key: 'flashDeals', label: 'Flash Deals', desc: 'Time-limited offers from nearby stores', icon: Zap, color: 'text-yellow-400' },
      { key: 'weeklyDeals', label: 'Weekly Deal Digest', desc: 'Best deals every Monday morning', icon: Tag, color: 'text-red-400' },
    ],
  },
  {
    label: 'Orders & Rewards',
    prefs: [
      { key: 'orderUpdates', label: 'Order Status Updates', desc: 'When your order is confirmed, ready, or delivered', icon: ShoppingBag, color: 'text-blue-400' },
      { key: 'rewardPoints', label: 'Reward Points', desc: 'When you earn or can redeem points', icon: Gift, color: 'text-pink-400' },
    ],
  },
  {
    label: 'Discovery',
    prefs: [
      { key: 'newStores', label: 'New Stores Near You', desc: 'When a new pizza shop joins MiSlice', icon: MapPin, color: 'text-red-400' },
      { key: 'weeklyRecap', label: 'Weekly Savings Recap', desc: 'How much you saved this week', icon: Star, color: 'text-violet-400' },
    ],
  },
];

interface NotificationsViewProps {
  onNavigate: (view: string) => void;
}

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-red-600' : 'bg-stone-700'}`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

export function NotificationsView({ onNavigate }: NotificationsViewProps) {
  const { showToast } = useApp();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'inbox' | 'settings'>('inbox');
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    priceDrops: true, flashDeals: true, weeklyDeals: false,
    orderUpdates: true, rewardPoints: true, newStores: false, weeklyRecap: true,
  });

  const [notifOn, setNotifOn] = useState<boolean>(() => {
    const pref = typeof localStorage !== 'undefined' ? localStorage.getItem('miSliceNotifOn') : null;
    if (pref !== null) return pref === '1';
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });
  const [notifBusy, setNotifBusy] = useState(false);

  const toggleNotifications = useCallback(async () => {
    if (notifBusy) return;
    if (typeof Notification === 'undefined') {
      showToast('This browser does not support notifications.');
      return;
    }
    setNotifBusy(true);
    try {
      if (notifOn) {
        // Turn OFF
        await disableFcmToken();
        setNotifOn(false);
        localStorage.setItem('miSliceNotifOn', '0');
        showToast('🔕 Notifications turned off.');
      } else {
        // Turn ON
        if (Notification.permission === 'denied') {
          showToast('Notifications are blocked — allow them in your browser settings.');
          return;
        }
        await registerFcmToken();
        const ok = Notification.permission === 'granted';
        setNotifOn(ok);
        localStorage.setItem('miSliceNotifOn', ok ? '1' : '0');
        showToast(ok ? '🔔 Notifications turned on!' : 'Notifications not enabled.');
      }
    } finally {
      setNotifBusy(false);
    }
  }, [notifOn, notifBusy, showToast]);

  useEffect(() => {
    if (!profile) {
      setNotifs(MOCK_NOTIFS);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedNotifs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'deal',
          emoji: data.emoji || '🍕',
          title: data.title || 'Notification',
          body: data.message || data.body || '',
          time: data.createdAt ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          read: data.read || false,
        } as Notification;
      });
      setNotifs(loadedNotifs);
    }, (err) => {
      console.warn("Failed to subscribe to notifications in Firestore:", err);
      setNotifs(MOCK_NOTIFS);
    });

    return () => unsubscribe();
  }, [profile]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    if (!profile) {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      return;
    }
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    if (!profile) {
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      return;
    }
    try {
      const batch = writeBatch(db);
      for (const notif of notifs) {
        if (!notif.read) {
          batch.update(doc(db, 'notifications', notif.id), { read: true });
        }
      }
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const dismiss = async (id: string) => {
    if (!profile) {
      setNotifs(prev => prev.filter(n => n.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = async () => {
    if (!profile) {
      setNotifs([]);
      return;
    }
    try {
      const batch = writeBatch(db);
      for (const notif of notifs) {
        batch.delete(doc(db, 'notifications', notif.id));
      }
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const togglePref = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const TYPE_ICON: Record<Notification['type'], { icon: React.FC<any>; color: string }> = {
    deal: { icon: Tag, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    price_drop: { icon: TrendingDown, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    new_store: { icon: MapPin, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    order: { icon: ShoppingBag, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    reward: { icon: Gift, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    weekly: { icon: Star, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-red-400" />
          <div>
            <h1 className="text-2xl font-black text-white">Deal Alerts</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-red-400 font-bold mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {/* Notifications on/off toggle */}
          <button
            onClick={toggleNotifications}
            disabled={notifBusy}
            aria-label={notifOn ? 'Notifications on — tap to turn off' : 'Notifications off — tap to turn on'}
            className="relative flex items-center gap-2 h-9 px-3 rounded-full transition-all disabled:opacity-60"
            style={{
              background: notifOn ? 'rgba(16,185,129,0.18)' : 'rgba(124,58,237,0.18)',
              border: `1px solid ${notifOn ? 'rgba(16,185,129,0.5)' : 'rgba(139,92,246,0.35)'}`,
              color: notifOn ? '#6EE7B7' : '#C4B5FD',
            }}
          >
            {notifOn
              ? <Bell className="w-3.5 h-3.5 shrink-0" />
              : <BellOff className="w-3.5 h-3.5 shrink-0" />}
            <span className="hidden sm:inline text-xs font-bold">{notifOn ? 'On' : 'Off'}</span>
            {/* mini switch track */}
            <span
              className="relative w-7 h-4 rounded-full transition-colors shrink-0"
              style={{ background: notifOn ? 'rgba(16,185,129,0.55)' : 'rgba(255,255,255,0.18)' }}
            >
              <span
                className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                style={{ left: notifOn ? '14px' : '2px' }}
              />
            </span>
          </button>

          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-bold text-stone-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl transition-colors">
              Mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button onClick={clearAll} className="text-xs font-bold text-stone-400 hover:text-red-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl transition-colors">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/8 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'inbox' ? 'bg-white/12 text-white' : 'text-stone-500 hover:text-stone-300'}`}
        >
          <Bell className="w-3.5 h-3.5" />
          Inbox
          {unreadCount > 0 && (
            <span className="text-[8px] font-black bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'bg-white/12 text-white' : 'text-stone-500 hover:text-stone-300'}`}
        >
          <Settings className="w-3.5 h-3.5" />
          Preferences
        </button>
      </div>

      {/* Inbox */}
      {activeTab === 'inbox' && (
        <div className="space-y-2">
          {notifs.length === 0 ? (
            <div className="text-center py-20 bg-white/3 border border-white/8 border-dashed rounded-2xl">
              <BellOff className="w-8 h-8 mx-auto text-stone-600 mb-3" />
              <p className="text-stone-500 font-bold text-sm">All clear — no notifications</p>
              <p className="text-stone-600 text-xs mt-1">We'll let you know when deals drop near you</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifs.map(notif => {
                const typeInfo = TYPE_ICON[notif.type];
                const TypeIcon = typeInfo.icon;
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    onClick={() => markRead(notif.id)}
                    className={`relative flex gap-3 p-4 rounded-2xl border cursor-pointer transition-all group ${
                      !notif.read
                        ? 'bg-white/6 border-white/12 hover:border-white/20'
                        : 'bg-white/2 border-white/6 hover:border-white/12 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Unread dot */}
                    {!notif.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(220,38,38,0.6)]" />
                    )}

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-black text-white truncate">{notif.title}</span>
                        <span className="text-lg shrink-0">{notif.emoji}</span>
                      </div>
                      <p className="text-xs text-stone-400 leading-relaxed">{notif.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] text-stone-600 font-bold flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{notif.time}</span>
                        {notif.cta && (
                          <button
                            onClick={e => { e.stopPropagation(); markRead(notif.id); notif.ctaView && onNavigate(notif.ctaView); }}
                            className="text-[10px] font-black text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                          >
                            {notif.cta} <ChevronRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dismiss button */}
                    <button
                      onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                      className="absolute top-3 right-3 text-stone-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-red-500/10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Preferences */}
      {activeTab === 'settings' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-white/4 border border-white/10 rounded-2xl">
            <div>
              <p className="text-sm font-black text-white">All Notifications</p>
              <p className="text-xs text-stone-500">Master switch for all deal alerts</p>
            </div>
            <ToggleSwitch on={Object.values(prefs).some(Boolean)} onChange={() => {
              const allOn = Object.values(prefs).every(Boolean);
              setPrefs(Object.fromEntries(Object.keys(prefs).map(k => [k, !allOn])));
            }} />
          </div>

          {PREF_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 mb-2.5 px-1">{section.label}</p>
              <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
                {section.prefs.map(pref => {
                  const Icon = pref.icon;
                  return (
                    <div key={pref.key} className="flex items-center gap-4 px-4 py-3.5">
                      <div className={`w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${pref.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{pref.label}</p>
                        <p className="text-[10px] text-stone-600">{pref.desc}</p>
                      </div>
                      <ToggleSwitch on={prefs[pref.key]} onChange={() => togglePref(pref.key)} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="p-4 bg-red-500/8 border border-red-500/20 rounded-2xl text-center">
            <p className="text-xs text-stone-400">
              Notifications are stored locally on your device. No account required.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
