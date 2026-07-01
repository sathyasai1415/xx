import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Clock, CheckCircle, XCircle, Users, Bell, Trash2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Broadcast {
  id: string;
  title: string;
  body: string;
  sentAt: Timestamp | null;
  successCount: number;
  failCount: number;
  totalTokens: number;
  targetRole: string;
}

const QUICK_TEMPLATES = [
  { label: '🎉 Party Invite',   title: 'Party at the Pizzeria!', body: "Hey! 🍕 Ready for a good time? Come party at Marco's Pizza tonight — deals, music & great vibes!" },
  { label: '🔥 Hot Deal',       title: 'Hot Deal Just for You!', body: 'Hey sweety! 😍 Get 20% off your next order today only. Use code MISLICE20 at checkout!' },
  { label: '🌙 Late Night',     title: "Late night cravings? 🌙", body: "We've got you covered! Order now and get free delivery after 9 PM. Michigan's best pizza is just a tap away." },
  { label: '🍕 New Pizza Alert', title: 'New Pizza Just Dropped! 🍕', body: "You're gonna love this one 😏 Check out our new menu item — limited time only. Order before it's gone!" },
  { label: '❤️ Miss You',       title: 'We miss you! ❤️',        body: "Hey! It's been a while 😢 Come back and enjoy a special welcome-back deal just for you. Tap to claim!" },
];

export function MarketingTab() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'broadcasts'), orderBy('sentAt', 'desc'));
    return onSnapshot(q, snap => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as Broadcast)));
    });
  }, []);

  useEffect(() => { setCharCount(body.length); }, [body]);

  const applyTemplate = (t: typeof QUICK_TEMPLATES[0]) => {
    setTitle(t.title);
    setBody(t.body);
    setResult(null);
    setError('');
  };

  const send = async () => {
    if (!title.trim() || !body.trim()) { setError('Please fill in both title and message.'); return; }
    setSending(true);
    setError('');
    setResult(null);
    try {
      const fn = httpsCallable(getFunctions(), 'sendBroadcastNotification');
      const res = await fn({ title: title.trim(), body: body.trim(), targetRole: 'customer' });
      setResult(res.data as any);
      setTitle('');
      setBody('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 p-1">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#dc2626,#f97316)' }}>
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black text-stone-900">Push Notifications</h2>
          <p className="text-xs text-stone-400">Send custom messages directly to your customers</p>
        </div>
      </div>

      {/* Quick templates */}
      <div>
        <p className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Quick Templates</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map(t => (
            <button key={t.label} onClick={() => applyTemplate(t)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <p className="text-sm font-black text-stone-700 flex items-center gap-2">
          <Bell className="w-4 h-4 text-red-500" /> Compose Message
        </p>

        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 block">Notification Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Party at the Pizzeria! 🎉"
            maxLength={65}
            className="w-full px-4 py-3 rounded-xl text-sm text-stone-800 font-medium outline-none transition-all"
            style={{ background: '#f8f8f8', border: '1.5px solid #e5e5e5' }}
            onFocus={e => e.target.style.borderColor = '#dc2626'}
            onBlur={e => e.target.style.borderColor = '#e5e5e5'}
          />
          <p className="text-[10px] text-stone-300 mt-1 text-right">{title.length}/65</p>
        </div>

        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 block">Message Body</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Hey sweety! 😍 Are you ready for a party at Marco's Pizza tonight?"
            maxLength={200}
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm text-stone-800 font-medium outline-none resize-none transition-all"
            style={{ background: '#f8f8f8', border: '1.5px solid #e5e5e5' }}
            onFocus={e => e.target.style.borderColor = '#dc2626'}
            onBlur={e => e.target.style.borderColor = '#e5e5e5'}
          />
          <p className="text-[10px] text-stone-300 mt-1 text-right">{charCount}/200</p>
        </div>

        {/* Preview */}
        {(title || body) && (
          <div className="rounded-xl p-3 flex items-start gap-3"
            style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
              style={{ background: 'linear-gradient(135deg,#dc2626,#f97316)' }}>
              🍕
            </div>
            <div>
              <p className="text-xs font-black text-white">{title || 'Notification title'}</p>
              <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">{body || 'Message body...'}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold text-red-600"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <XCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {result && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold text-green-700"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <CheckCircle className="w-4 h-4 shrink-0" />
            Sent to {result.sent} customers! {result.failed > 0 && `(${result.failed} failed)`}
          </div>
        )}

        <button
          onClick={send}
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#dc2626,#f97316)', boxShadow: '0 4px 16px rgba(220,38,38,0.3)' }}
        >
          {sending
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
            : <><Send className="w-4 h-4" /> Send to All Customers</>
          }
        </button>

        <div className="flex items-center gap-2 text-[11px] text-stone-400">
          <Users className="w-3.5 h-3.5" />
          Sends to all customers who allowed notifications on MiSlice.
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Recent Broadcasts
          </p>
          <div className="space-y-2">
            {history.slice(0, 10).map(b => (
              <div key={b.id} className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
                <Bell className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-stone-800 truncate">{b.title}</p>
                  <p className="text-xs text-stone-400 truncate mt-0.5">{b.body}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {b.successCount} sent
                    </span>
                    {b.failCount > 0 && (
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> {b.failCount} failed
                      </span>
                    )}
                    <span className="text-[10px] text-stone-300">
                      {b.sentAt?.toDate?.().toLocaleString() ?? ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
