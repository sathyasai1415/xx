import React, { useState } from 'react';
import { Truck, MapPin, DollarSign, ShieldAlert, CheckCircle, Navigation, MessageSquare, Ticket, User, X } from 'lucide-react';

const MOCK_DELIVERIES = [
  { id: 'DEL-101', store: 'Shamz Pizza', address: '123 Michigan Ave, Detroit', customer: 'Alice Smith', destination: '456 Cass Ave, Detroit', items: '1x Pepperoni (Large), 1x Garlic Knots', fee: 5.50, status: 'Ready for Pickup' },
  { id: 'DEL-102', store: "Domino's", address: '789 Woodward Ave, Detroit', customer: 'John Doe', destination: '101 Grand Blvd, Detroit', items: '2x Cheese Pizza (Medium), 1x Coke', fee: 6.20, status: 'In Transit' },
];

export function DeliveryDriverDashboard() {
  const [deliveries, setDeliveries] = useState(MOCK_DELIVERIES);
  const [earnings, setEarnings] = useState(25.40);

  const advance = (id: string) => {
    setDeliveries(prev => prev.map(d => {
      if (d.id === id) {
        if (d.status === 'Ready for Pickup') return { ...d, status: 'In Transit' };
        if (d.status === 'In Transit') {
          setEarnings(e => e + d.fee);
          return { ...d, status: 'Delivered' };
        }
      }
      return d;
    }));
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-white p-6 max-w-4xl mx-auto font-sans pt-20">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Truck className="text-orange-500 w-7 h-7" /> Delivery Driver Portal
          </h1>
          <p className="text-xs text-white/40">Real-time driver dispatch simulation</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-inner">
          <DollarSign className="text-green-400 w-4 h-4" />
          <div>
            <p className="text-[10px] text-white/40 uppercase font-black">Today's Earnings</p>
            <p className="text-sm font-black text-white">${earnings.toFixed(2)}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase text-white/50 tracking-wider">Active Deliveries</h2>
          {deliveries.filter(d => d.status !== 'Delivered').map(d => (
            <div key={d.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-orange-500/20 text-orange-400 text-[10px] font-black px-3 py-1 rounded-bl-xl border-l border-b border-white/5">
                {d.status}
              </div>
              <div className="pt-2">
                <p className="text-xs font-black text-orange-400">{d.id}</p>
                <h3 className="text-base font-black mt-1">{d.store}</h3>
              </div>
              <div className="space-y-2 text-xs text-white/70">
                <p className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span><strong>Pickup:</strong> {d.address}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong>Dropoff:</strong> {d.destination} ({d.customer})</span>
                </p>
                <p className="text-white/40"><strong>Items:</strong> {d.items}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-xs font-black text-green-400">+${d.fee.toFixed(2)} Delivery Fee</span>
                <button
                  onClick={() => advance(d.id)}
                  className="bg-orange-500 hover:bg-orange-400 text-white text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Navigation className="w-3.5 h-3.5" /> {d.status === 'Ready for Pickup' ? 'Start Delivery' : 'Mark Delivered'}
                </button>
              </div>
            </div>
          ))}
          {deliveries.filter(d => d.status !== 'Delivered').length === 0 && (
            <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-white/50">All deliveries completed!</p>
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-black uppercase text-white/50 tracking-wider">Completed Run History</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {deliveries.filter(d => d.status === 'Delivered').map(d => (
              <div key={d.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs font-black text-green-400">{d.id} · Completed</p>
                  <p className="text-xs text-white/70">{d.store} ➔ {d.customer}</p>
                </div>
                <span className="text-xs font-bold text-white/60">${d.fee.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Towing Driver / Company ──────────────────────────────────────────────────
const MOCK_TOWS = [
  { id: 'TOW-201', car: 'Ford Mustang (Black - ABC-123)', reason: 'Parked in Store pickup zone', address: 'Shamz Pizza Lot, Detroit', customer: 'Owner Request', fee: 120.00, status: 'Dispatched' },
  { id: 'TOW-202', car: 'Chevrolet Cruze (Silver - XYZ-890)', reason: 'Blocking delivery vehicle path', address: 'Woodward Pizza Alley, Detroit', customer: 'Owner Request', fee: 145.00, status: 'In Transit' },
];

export function TowingDashboard() {
  const [tows, setTows] = useState(MOCK_TOWS);
  const [totalFines, setTotalFines] = useState(380.00);

  const completeTow = (id: string) => {
    setTows(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status === 'Dispatched') return { ...t, status: 'In Transit' };
        if (t.status === 'In Transit') {
          setTotalFines(f => f + t.fee);
          return { ...t, status: 'Towed' };
        }
      }
      return t;
    }));
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-white p-6 max-w-4xl mx-auto font-sans pt-20">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-7 h-7" /> Towing Dispatch & Fleet Dashboard
          </h1>
          <p className="text-xs text-white/40">Live store clearing & towing logistics system</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
          <DollarSign className="text-red-400 w-4 h-4" />
          <div>
            <p className="text-[10px] text-white/40 uppercase font-black">All-Time Revenue</p>
            <p className="text-sm font-black text-white">${totalFines.toFixed(2)}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase text-white/50 tracking-wider">Active Tow Dispatches</h2>
          {tows.filter(t => t.status !== 'Towed').map(t => (
            <div key={t.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4 relative">
              <div className="absolute top-0 right-0 bg-red-500/20 text-red-400 text-[10px] font-black px-3 py-1 rounded-bl-xl border-l border-b border-white/5">
                {t.status}
              </div>
              <div className="pt-2">
                <p className="text-xs font-black text-red-400">{t.id}</p>
                <h3 className="text-base font-black mt-1">{t.car}</h3>
                <p className="text-xs text-red-400/80 font-semibold mt-0.5">⚠️ {t.reason}</p>
              </div>
              <div className="space-y-2 text-xs text-white/70">
                <p className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span><strong>Location:</strong> {t.address}</span>
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-xs font-bold text-white/60">${t.fee.toFixed(2)} Payout</span>
                <button
                  onClick={() => completeTow(t.id)}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all"
                >
                  {t.status === 'Dispatched' ? 'Hook Vehicle' : 'Complete Tow'}
                </button>
              </div>
            </div>
          ))}
          {tows.filter(t => t.status !== 'Towed').length === 0 && (
            <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-white/50">All impounded vehicles processed!</p>
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-black uppercase text-white/50 tracking-wider">Completed Tow Records</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {tows.filter(t => t.status === 'Towed').map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs font-black text-green-400">{t.id} · Cleared</p>
                  <p className="text-xs text-white/70">{t.car}</p>
                </div>
                <span className="text-xs font-bold text-white/60">${t.fee.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Support Agent ────────────────────────────────────────────────────────────
const MOCK_TICKETS = [
  { id: 'TKT-880', user: 'Jane Manager (Shamz Pizza)', issue: 'OCR scan price mismatch error on uploading drink items menu', time: '10 min ago', status: 'Open' },
  { id: 'TKT-881', user: 'Mark (Customer)', issue: 'Order ref #FD-331 was cancelled but refund not showing on rewards', time: '23 min ago', status: 'Open' },
];

export function SupportAgentDashboard() {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [resolvedCount, setResolvedCount] = useState(14);

  const resolve = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'Resolved' } : t));
    setResolvedCount(c => c + 1);
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-white p-6 max-w-4xl mx-auto font-sans pt-20">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <MessageSquare className="text-teal-400 w-7 h-7" /> Support Agent Workspace
          </h1>
          <p className="text-xs text-white/40">Platform support ticketing & resolution simulation</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Ticket className="text-teal-400 w-4 h-4" />
          <div>
            <p className="text-[10px] text-white/40 uppercase font-black">Tickets Resolved</p>
            <p className="text-sm font-black text-white">{resolvedCount}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase text-white/50 tracking-wider">Incoming Support Tickets</h2>
          {tickets.filter(t => t.status !== 'Resolved').map(t => (
            <div key={t.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4 relative">
              <div className="absolute top-0 right-0 bg-teal-500/20 text-teal-400 text-[10px] font-black px-3 py-1 rounded-bl-xl border-l border-b border-white/5">
                {t.status}
              </div>
              <div className="pt-2">
                <p className="text-xs font-black text-teal-400">{t.id} · {t.time}</p>
                <h3 className="text-sm font-bold text-white/60 flex items-center gap-1.5 mt-1">
                  <User className="w-3.5 h-3.5 text-white/40" /> {t.user}
                </h3>
                <p className="text-sm text-white font-semibold mt-2">{t.issue}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-[11px] text-white/40 font-bold">Priority: Normal</span>
                <button
                  onClick={() => resolve(t.id)}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all"
                >
                  Resolve Issue
                </button>
              </div>
            </div>
          ))}
          {tickets.filter(t => t.status !== 'Resolved').length === 0 && (
            <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-teal-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-white/50">All support tickets resolved!</p>
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-black uppercase text-white/50 tracking-wider">Resolved Archives</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {tickets.filter(t => t.status === 'Resolved').map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs font-black text-teal-400">{t.id} · Resolved</p>
                  <p className="text-xs text-white/70">{t.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
