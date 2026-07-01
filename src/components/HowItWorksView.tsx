import React, { useState } from 'react';
import {
  Search, SlidersHorizontal, BarChart2, ShoppingCart, MapPin, Star,
  Store, TrendingDown, Zap, Shield, Clock, ChevronDown, ChevronUp,
  Pizza, Truck, DollarSign, CheckCircle, Users, Package,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    icon: SlidersHorizontal,
    color: 'bg-red-500',
    lightBg: 'bg-red-50',
    lightBorder: 'border-red-200',
    lightText: 'text-red-600',
    title: 'Build Your Pizza',
    desc: 'Use our interactive builder to pick your size, crust, sauce, and toppings. No account required — just start customizing.',
    bullets: [
      'Choose from thin crust, deep dish, stuffed, or gluten-free',
      'Add up to 20 toppings with real modular pricing',
      'Save your pizza as a "Favorite" for quick reorders',
    ],
    emoji: '🍕',
    visual: (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-2">
        {['Size: Large (16")', 'Crust: Detroit Deep Dish', 'Sauce: San Marzano', 'Toppings: Pepperoni + Mushrooms + Basil'].map((t, i) => (
          <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-red-100">
            <CheckCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="text-xs font-semibold text-gray-700">{t}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '02',
    icon: Search,
    color: 'bg-orange-500',
    lightBg: 'bg-orange-50',
    lightBorder: 'border-orange-200',
    lightText: 'text-orange-600',
    title: 'We Fetch Live Prices',
    desc: 'MiSlice instantly queries 50+ local Michigan pizzerias and chains in real time — matching your exact order spec to their menu.',
    bullets: [
      'Prices update every few minutes from live menus',
      'Covers 15+ cities across Michigan',
      'Includes delivery fee, tax, and estimated wait time',
    ],
    emoji: '⚡',
    visual: (
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 space-y-2">
        {[
          { name: 'Motor City Pies', time: '22 min', fetching: false },
          { name: 'Buddy\'s Pizza', time: '28 min', fetching: false },
          { name: 'Jet\'s Pizza', time: '18 min', fetching: true },
          { name: 'Little Caesars', time: '15 min', fetching: true },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-orange-100">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg" />
              <span className="text-xs font-semibold text-gray-700">{s.name}</span>
            </div>
            {s.fetching
              ? <span className="text-[10px] font-bold text-orange-500 animate-pulse">Fetching…</span>
              : <span className="text-[10px] font-bold text-gray-500">{s.time}</span>
            }
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '03',
    icon: BarChart2,
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    lightBorder: 'border-blue-200',
    lightText: 'text-blue-600',
    title: 'Compare Side-by-Side',
    desc: 'See every store\'s total cost, delivery fee, rating, and ETA in one clear view. Sort by price, speed, or rating.',
    bullets: [
      'Full price breakdown: subtotal + delivery + tax',
      'Verified customer ratings (not just Google)',
      'Filter by "Open Now", distance, or max delivery fee',
    ],
    emoji: '📊',
    visual: (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
        {[
          { name: 'Motor City Pies', price: '$28.47', badge: 'Best Value', badgeColor: 'bg-green-100 text-green-700', stars: '4.9' },
          { name: 'Buddy\'s Pizza',  price: '$31.99', badge: null, badgeColor: '', stars: '4.7' },
          { name: 'Jet\'s Pizza',    price: '$26.50', badge: 'Fastest',   badgeColor: 'bg-blue-100 text-blue-700',   stars: '4.5' },
        ].map((r, i) => (
          <div key={i} className={`flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border ${i === 0 ? 'border-green-300 ring-1 ring-green-200' : 'border-blue-100'}`}>
            <div>
              <p className="text-xs font-bold text-gray-800">{r.name}</p>
              <p className="text-[10px] text-gray-400">⭐ {r.stars}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-gray-900">{r.price}</p>
              {r.badge && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${r.badgeColor}`}>{r.badge}</span>}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '04',
    icon: ShoppingCart,
    color: 'bg-green-500',
    lightBg: 'bg-green-50',
    lightBorder: 'border-green-200',
    lightText: 'text-green-600',
    title: 'Order & Pay Securely',
    desc: 'Pick your store and place your order directly through MiSlice — one secure checkout, your card saved for next time.',
    bullets: [
      'Secure checkout powered by Stripe',
      'Apple Pay & Google Pay supported',
      'Order goes directly to the pizzeria — no middleman delays',
    ],
    emoji: '🛒',
    visual: (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-3">
        <div className="bg-white border border-green-200 rounded-xl p-3 text-xs">
          <p className="font-black text-gray-900 mb-1">Order Summary</p>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between"><span>Detroit Deep Dish</span><span>$22.99</span></div>
            <div className="flex justify-between"><span>Delivery fee</span><span>$2.99</span></div>
            <div className="flex justify-between"><span>Tax</span><span>$1.89</span></div>
            <div className="flex justify-between font-black text-gray-900 pt-1 border-t border-gray-100"><span>Total</span><span>$27.87</span></div>
          </div>
        </div>
        <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-black py-2.5 rounded-xl">
          Place Order →
        </button>
      </div>
    ),
  },
  {
    number: '05',
    icon: MapPin,
    color: 'bg-purple-500',
    lightBg: 'bg-purple-50',
    lightBorder: 'border-purple-200',
    lightText: 'text-purple-600',
    title: 'Track in Real Time',
    desc: 'Watch your order move from prep to your door with live driver tracking and SMS updates.',
    bullets: [
      'Live delivery map with driver location',
      'Push & SMS notifications at every stage',
      'Estimated arrival updates in real time',
    ],
    emoji: '📍',
    visual: (
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 space-y-2">
        {[
          { label: 'Order Placed',    done: true },
          { label: 'Confirmed',       done: true },
          { label: 'Preparing',       done: true },
          { label: 'Out for Delivery',done: false, active: true },
          { label: 'Delivered',       done: false },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-purple-500' : s.active ? 'bg-purple-400 animate-pulse' : 'bg-purple-100 border border-purple-200'}`}>
              {s.done && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-xs font-semibold ${s.done ? 'text-purple-700' : s.active ? 'text-purple-500 font-black' : 'text-gray-400'}`}>{s.label}</span>
            {s.active && <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full ml-auto">Now</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '06',
    icon: Star,
    color: 'bg-yellow-500',
    lightBg: 'bg-yellow-50',
    lightBorder: 'border-yellow-200',
    lightText: 'text-yellow-600',
    title: 'Rate & Earn Rewards',
    desc: 'Leave a quick review after each order. Earn MiSlice Points redeemable for discounts on your next pizza.',
    bullets: [
      '10 points per dollar spent — redeem for up to $10 off',
      'Bonus points for first order, referrals, and reviews',
      'Leaderboard of top Michigan pizza fans each month',
    ],
    emoji: '⭐',
    visual: (
      <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5">
        <p className="text-xs font-black text-gray-700 mb-3">Rate Your Order</p>
        <div className="flex gap-1 mb-3">
          {[1,2,3,4,5].map(s => <Star key={s} className="w-7 h-7 text-yellow-400 fill-yellow-400" />)}
        </div>
        <div className="bg-yellow-100 border border-yellow-200 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-bold text-yellow-800">You earned</span>
          <span className="text-sm font-black text-yellow-700">+279 points 🎉</span>
        </div>
      </div>
    ),
  },
];

const FEATURES = [
  { icon: Zap,         color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200', title: 'AI Pizza Builder', desc: 'Intelligently matches your custom build to each store\'s actual menu options and prices.' },
  { icon: TrendingDown, color: 'text-green-600',  bg: 'bg-green-50 border-green-200',  title: 'Real Savings',    desc: 'MiSlice users save an average of $8–14 per order by comparing before they buy.' },
  { icon: Shield,      color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',    title: 'Secure Checkout', desc: 'PCI-compliant payments via Stripe. Your card data never touches our servers.' },
  { icon: Clock,       color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200',title: 'Live ETA',        desc: 'See real-time prep and delivery times before you order — no more guessing.' },
  { icon: Store,       color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200',title: 'Local-First',     desc: 'We prioritize independent Michigan pizzerias. Support local while saving money.' },
  { icon: Users,       color: 'text-red-600',    bg: 'bg-red-50 border-red-200',      title: 'Verified Reviews', desc: 'Only real customers who ordered through MiSlice can leave reviews.' },
];

const STATS = [
  { value: '50+',  label: 'Michigan Stores',    icon: Store },
  { value: '$11',  label: 'Avg Savings / Order', icon: DollarSign },
  { value: '4.8★', label: 'App Rating',          icon: Star },
  { value: '<2min',label: 'Price Comparison',    icon: Zap },
];

const FOR_WHO = [
  {
    icon: Pizza,
    title: 'Pizza Lovers',
    color: 'from-red-500 to-orange-400',
    points: [
      'Find the best deal across 50+ stores instantly',
      'Save $8–14 on every order on average',
      'Track your delivery live from any device',
      'Earn loyalty points on every order',
      'Discover new local spots you\'d never find otherwise',
    ],
    cta: 'Start Comparing Prices',
  },
  {
    icon: Store,
    title: 'Store Owners',
    color: 'from-blue-600 to-blue-400',
    points: [
      'Get listed in front of thousands of hungry Michiganders',
      'Manage orders from a DoorDash-style dashboard',
      'Set your own deals and promotions',
      'Only 20% flat commission — no hidden fees',
      'AI insights to grow your sales every week',
    ],
    cta: 'List Your Restaurant',
  },
];

const FAQS = [
  { q: 'Is MiSlice free to use?', a: 'Yes — MiSlice is completely free for customers. We charge participating stores a 20% platform commission per order, which lets us keep the app free while supporting local businesses.' },
  { q: 'How are prices so accurate?', a: 'Our system pulls prices directly from each store\'s active menu in real time. If a store updates their prices, MiSlice reflects it within minutes.' },
  { q: 'Which cities in Michigan are covered?', a: 'We cover Detroit, Ann Arbor, Grand Rapids, Lansing, Flint, Kalamazoo, Dearborn, Sterling Heights, Warren, and more — with new cities added monthly.' },
  { q: 'Can I order for pickup, not just delivery?', a: 'Absolutely. Every store listing shows both delivery and pickup options with separate pricing and estimated wait times.' },
  { q: 'How do I list my restaurant on MiSlice?', a: 'Go to Contact → select "Store Partnership" and fill out the form. Our partnerships team will reach out within 1 business day to get you set up.' },
  { q: 'What payment methods are accepted?', a: 'We accept all major credit and debit cards, Apple Pay, and Google Pay. Payments are processed securely via Stripe.' },
];

// ─── Accordion item ────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <span className="text-sm font-bold text-gray-900 pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function HowItWorksView() {
  return (
    <div
      className="w-full min-h-screen"
      style={{
        background: '#f8f8f8',
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-20">

        {/* ── Hero ── */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-black px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
            🍕 Michigan's Pizza Marketplace
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 leading-tight">
            One App. Every Pizza.<br />
            <span className="text-red-500">Best Price Guaranteed.</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            MiSlice is the only platform that lets you build your exact pizza order once,
            then instantly compare prices, delivery fees, and wait times across 50+ local Michigan stores — so you always get the best deal.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
            {STATS.map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-2xl py-5 px-3 shadow-sm text-center">
                <s.icon className="w-5 h-5 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step by Step ── */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">How It Works</h2>
            <p className="text-gray-500 text-sm">Six simple steps from craving to doorstep.</p>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isEven = i % 2 === 0;
              return (
                <div key={i} className={`bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col ${isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'} gap-8 items-center`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 ${step.color} rounded-2xl flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-xs font-black ${step.lightText} uppercase tracking-widest`}>Step {step.number}</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{step.emoji} {step.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{step.desc}</p>
                    <ul className="space-y-2">
                      {step.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className={`w-4 h-4 ${step.lightText} shrink-0 mt-0.5`} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-full sm:w-72 shrink-0">
                    {step.visual}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Features Grid ── */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Why MiSlice?</h2>
            <p className="text-gray-500 text-sm">Built from the ground up for Michigan pizza fans and local restaurants.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex gap-4`}>
                  <div className={`w-10 h-10 rounded-2xl border ${f.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 mb-1">{f.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Who Is It For ── */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Who Is MiSlice For?</h2>
            <p className="text-gray-500 text-sm">Whether you love pizza or serve it, MiSlice has you covered.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FOR_WHO.map(w => {
              const Icon = w.icon;
              return (
                <div key={w.title} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${w.color} flex items-center justify-center mb-5`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-4">{w.title}</h3>
                  <ul className="space-y-3 mb-6">
                    {w.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r ${w.color} hover:opacity-90 transition-opacity`}>
                    {w.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Commission callout ── */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <DollarSign className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Transparent Commission Model</h2>
          <p className="text-gray-600 max-w-xl mx-auto text-sm leading-relaxed mb-6">
            MiSlice charges stores a flat <strong className="text-gray-900">20% commission</strong> per order — no monthly fees, no setup costs, no surprises.
            That's less than most delivery platforms, and <strong className="text-gray-900">stores keep 80%</strong> of every sale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 text-center">
              <p className="text-3xl font-black text-green-700">80%</p>
              <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Store Keeps</p>
            </div>
            <div className="text-gray-400 font-black text-xl">+</div>
            <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-center">
              <p className="text-3xl font-black text-red-600">20%</p>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wide">MiSlice Fee</p>
            </div>
            <div className="text-gray-400 font-black text-xl">=</div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 text-center">
              <p className="text-3xl font-black text-blue-700">Win-Win</p>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">For Everyone</p>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-sm">Still have questions? <a href="#contact" className="text-red-500 font-bold hover:underline">Contact us</a> any time.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => <FAQItem key={i} {...faq} />)}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl p-8 sm:p-12 text-center text-white shadow-lg">
          <h2 className="text-3xl font-black mb-3">Ready to Find Your Best Pizza Deal?</h2>
          <p className="text-red-100 text-sm mb-8 max-w-md mx-auto">
            Join thousands of Michigan residents already saving money on every pizza order.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="bg-white text-red-600 font-black px-8 py-3.5 rounded-2xl text-sm hover:bg-red-50 transition-colors shadow-md">
              🍕 Compare Prices Now — It's Free
            </button>
            <button className="bg-white/15 border border-white/30 text-white font-bold px-8 py-3.5 rounded-2xl text-sm hover:bg-white/25 transition-colors">
              List My Restaurant
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
