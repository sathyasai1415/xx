import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2, ChefHat, Bike, PackageCheck, Receipt, Phone,
  MapPin, Clock, Store, ShoppingBag, RotateCcw, Star,
} from 'lucide-react';
import { Order } from '../types';

interface OrderTrackingProps {
  order: Order;
  onViewOrders: () => void;
  onHome: () => void;
  onReorder: (order: Order) => void;
}

type Stage = { key: string; label: string; sub: string; icon: React.ElementType };

const DELIVERY_STAGES: Stage[] = [
  { key: 'confirmed', label: 'Order Confirmed', sub: 'The store received your order', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', sub: 'Your pizza is in the oven', icon: ChefHat },
  { key: 'out_for_delivery', label: 'Out for Delivery', sub: 'Your driver is on the way', icon: Bike },
  { key: 'delivered', label: 'Delivered', sub: 'Enjoy your meal!', icon: PackageCheck },
];

const PICKUP_STAGES: Stage[] = [
  { key: 'confirmed', label: 'Order Confirmed', sub: 'The store received your order', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', sub: 'Your pizza is in the oven', icon: ChefHat },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', sub: 'Come grab it at the counter', icon: Store },
  { key: 'delivered', label: 'Picked Up', sub: 'Enjoy your meal!', icon: PackageCheck },
];

const STAGE_MS = 7000; // each stage advances every 7s (demo)

const COURIERS = [
  { name: 'Marcus T.', vehicle: 'Toyota Corolla · Red' },
  { name: 'Aisha K.', vehicle: 'Honda Civic · Silver' },
  { name: 'Diego R.', vehicle: 'Ford Focus · Blue' },
  { name: 'Priya S.', vehicle: 'E-Bike · Black' },
];

function providerAccent(id?: string) {
  switch (id) {
    case 'doordash': return { text: 'text-red-400', dot: 'bg-red-500', label: 'DoorDash' };
    case 'ubereats': return { text: 'text-green-400', dot: 'bg-green-500', label: 'Uber Eats' };
    case 'grubhub': return { text: 'text-red-400', dot: 'bg-red-500', label: 'Grubhub' };
    case 'pickup': return { text: 'text-stone-300', dot: 'bg-stone-500', label: 'Pickup' };
    default: return { text: 'text-blue-400', dot: 'bg-blue-500', label: 'Store Delivery' };
  }
}

export function OrderTracking({ order, onViewOrders, onHome, onReorder }: OrderTrackingProps) {
  const isPickup = order.deliveryType === 'pickup' || order.selectedDeliveryProviderId === 'pickup';
  const stages = isPickup ? PICKUP_STAGES : DELIVERY_STAGES;

  const [stageIdx, setStageIdx] = useState(0);
  const courier = useMemo(() => COURIERS[Math.floor(Math.random() * COURIERS.length)], []);

  // Parse the high end of the ETA range ("22-32 min" → 32) for the countdown.
  const etaMinutes = useMemo(() => {
    const m = (order.estimatedDeliveryTime || '').match(/(\d+)\s*-\s*(\d+)/);
    if (m) return parseInt(m[2], 10);
    const single = (order.estimatedDeliveryTime || '').match(/(\d+)/);
    return single ? parseInt(single[1], 10) : 35;
  }, [order.estimatedDeliveryTime]);

  const [secondsLeft, setSecondsLeft] = useState(etaMinutes * 60);

  // Advance through stages.
  useEffect(() => {
    if (stageIdx >= stages.length - 1) return;
    const t = setTimeout(() => setStageIdx(i => Math.min(i + 1, stages.length - 1)), STAGE_MS);
    return () => clearTimeout(t);
  }, [stageIdx, stages.length]);

  // Countdown timer (stops when delivered).
  useEffect(() => {
    const done = stageIdx >= stages.length - 1;
    if (done) { setSecondsLeft(0); return; }
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [stageIdx, stages.length]);

  const isDelivered = stageIdx >= stages.length - 1;
  const accent = providerAccent(order.selectedDeliveryProviderId);
  const progressPct = (stageIdx / (stages.length - 1)) * 100;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-1">
      {/* Header */}
      <div className="text-center mb-8">
        <AnimatePresence mode="wait">
          <motion.h1
            key={isDelivered ? 'done' : 'live'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-black text-white tracking-tight"
          >
            {isDelivered ? (isPickup ? 'Picked Up! 🎉' : 'Delivered! 🎉') : (isPickup ? 'Preparing your pickup' : 'Tracking your order')}
          </motion.h1>
        </AnimatePresence>
        <p className="text-stone-500 text-sm mt-2">
          {order.storeName} · Order #{order.id.slice(-6).toUpperCase()}
        </p>
      </div>

      {/* ETA + live map */}
      <div className="glass rounded-3xl overflow-hidden mb-6">
        {/* Animated "map" band */}
        <div className="relative h-40 bg-gradient-to-br from-stone-900 to-black overflow-hidden">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '22px 22px' }} />
          {/* route line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
            <path d="M40,120 C140,120 160,40 360,40" fill="none" stroke="rgba(249,115,22,0.4)" strokeWidth="3" strokeDasharray="6 6" />
          </svg>
          {/* store marker */}
          <div className="absolute left-[8%] bottom-[22%] flex flex-col items-center">
            <div className="w-8 h-8 rounded-full glass flex items-center justify-center"><Store className="w-4 h-4 text-red-300" /></div>
          </div>
          {/* home marker */}
          <div className="absolute right-[8%] top-[18%] flex flex-col items-center">
            <div className="w-8 h-8 rounded-full glass flex items-center justify-center"><MapPin className="w-4 h-4 text-red-400" /></div>
          </div>
          {/* moving courier */}
          {!isPickup && (
            <motion.div
              className="absolute"
              initial={{ left: '10%', top: '70%' }}
              animate={{
                left: isDelivered ? '88%' : `${10 + progressPct * 0.75}%`,
                top: isDelivered ? '20%' : `${70 - progressPct * 0.5}%`,
              }}
              transition={{ type: 'spring', stiffness: 40, damping: 14 }}
            >
              <div className={`w-9 h-9 rounded-full ${accent.dot} flex items-center justify-center shadow-lg ring-4 ring-white/10`}>
                <Bike className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          )}
        </div>

        {/* ETA bar */}
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">
              {isDelivered ? 'Status' : isPickup ? 'Ready in' : 'Arriving in'}
            </p>
            <p className="text-2xl font-black text-white flex items-center gap-2">
              {isDelivered ? (
                <span className="text-green-400">Complete</span>
              ) : (
                <><Clock className="w-5 h-5 text-red-300" /> {mins}:{secs.toString().padStart(2, '0')}</>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">Via</p>
            <p className={`text-sm font-black flex items-center gap-1.5 ${accent.text}`}>
              <span className={`w-2 h-2 rounded-full ${accent.dot}`} /> {accent.label}
            </p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="glass rounded-3xl p-6 mb-6">
        <div className="relative">
          {/* progress rail */}
          <div className="absolute left-[18px] top-3 bottom-3 w-0.5 bg-white/10" />
          <motion.div
            className="absolute left-[18px] top-3 w-0.5 bg-gradient-to-b from-red-400 to-red-500"
            initial={{ height: 0 }}
            animate={{ height: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          />
          <div className="space-y-6">
            {stages.map((stage, i) => {
              const done = i < stageIdx;
              const active = i === stageIdx;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="flex items-center gap-4 relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                    done || active
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white'
                      : 'glass-soft text-stone-600'
                  } ${active ? 'ring-4 ring-red-500/20' : ''}`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-black transition-colors ${done || active ? 'text-white' : 'text-stone-600'}`}>
                      {stage.label}
                      {active && !isDelivered && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-black text-red-300 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Now
                        </span>
                      )}
                    </p>
                    <p className={`text-[11px] ${done || active ? 'text-stone-400' : 'text-stone-700'}`}>{stage.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Courier card (delivery only, once out for delivery) */}
      <AnimatePresence>
        {!isPickup && stageIdx >= 2 && !isDelivered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-3xl p-5 mb-6 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center text-lg font-black text-white shrink-0">
              {courier.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white">{courier.name}</p>
              <p className="text-[11px] text-stone-500 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" /> 4.9 · {courier.vehicle}
              </p>
            </div>
            <button className="w-10 h-10 rounded-full glass-soft flex items-center justify-center text-green-400 hover:text-green-300 transition-colors">
              <Phone className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt summary */}
      <div className="glass rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-4 h-4 text-red-300" />
          <p className="text-sm font-black text-white">Order Summary</p>
        </div>
        <div className="space-y-2.5 mb-4">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-stone-300 font-bold">{item.quantity}× {item.pizzaName}</span>
              <span className="text-stone-400">${item.itemTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/8 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-stone-500"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          {order.deliveryFee > 0 && <div className="flex justify-between text-stone-500"><span>Delivery</span><span>${order.deliveryFee.toFixed(2)}</span></div>}
          <div className="flex justify-between text-stone-500"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
          {order.platformServiceFee > 0 && <div className="flex justify-between text-stone-500"><span>Service fee</span><span>${order.platformServiceFee.toFixed(2)}</span></div>}
          <div className="flex justify-between text-white font-black text-base pt-2 border-t border-white/8 mt-2">
            <span>Total</span><span>${order.finalTotal.toFixed(2)}</span>
          </div>
        </div>
        {order.deliveryAddress && (
          <div className="mt-4 pt-4 border-t border-white/8 flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-stone-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-stone-400">{order.deliveryAddress}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isDelivered ? (
          <>
            <button
              onClick={() => onReorder(order)}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_-8px_rgba(220,38,38,0.5)]"
            >
              <RotateCcw className="w-4 h-4" /> Reorder
            </button>
            <button onClick={onViewOrders} className="flex-1 glass font-bold text-white py-4 rounded-2xl hover:border-white/25 transition-colors">
              Order History
            </button>
          </>
        ) : (
          <>
            <button onClick={onViewOrders} className="flex-1 inline-flex items-center justify-center gap-2 glass font-bold text-white py-4 rounded-2xl hover:border-white/25 transition-colors">
              <ShoppingBag className="w-4 h-4" /> Order History
            </button>
            <button onClick={onHome} className="flex-1 glass-soft font-bold text-stone-300 py-4 rounded-2xl hover:text-white transition-colors">
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
