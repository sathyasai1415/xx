import React, { useState } from 'react';
import {
  Mail, Phone, MapPin, Clock, MessageSquare, CheckCircle,
  Instagram, Facebook, Linkedin, Zap, Store, AlertCircle,
  CreditCard, HelpCircle, Newspaper, Package,
} from 'lucide-react';

const TOPIC_META: Record<string, { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; bg: string; response: string; desc: string }> = {
  'Order Issue': {
    icon: Package, color: 'text-red-600', bg: 'bg-red-50 border-red-200',
    response: '< 2 hours',
    desc: 'Wrong item, missing order, quality complaint, or restaurant error.',
  },
  'Delivery Problem': {
    icon: MapPin, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200',
    response: '< 2 hours',
    desc: 'Late delivery, driver issue, package damaged, or not delivered.',
  },
  'Billing & Payment': {
    icon: CreditCard, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200',
    response: '< 4 hours',
    desc: 'Double charge, incorrect total, refund request, or card issue.',
  },
  'Account Help': {
    icon: HelpCircle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200',
    response: '< 8 hours',
    desc: 'Password reset, account locked, profile update, or data request.',
  },
  'Store Partnership': {
    icon: Store, color: 'text-green-600', bg: 'bg-green-50 border-green-200',
    response: '1 business day',
    desc: 'List your restaurant, update your menu, adjust commission, or grow on MiSlice.',
  },
  'Press & Media': {
    icon: Newspaper, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200',
    response: '2 business days',
    desc: 'Media inquiries, interviews, partnership announcements, or brand assets.',
  },
  'Other': {
    icon: MessageSquare, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200',
    response: '1 business day',
    desc: 'Anything else — feedback, feature requests, general questions.',
  },
};

const TOPICS = Object.keys(TOPIC_META);

const QUICK_ANSWERS = [
  {
    q: 'My order hasn\'t arrived yet.',
    a: 'Open your order in the app → tap "Track Order" for live driver location. If it\'s been 30+ min past the ETA, use the in-app chat with the driver or contact us below.',
    icon: Package,
    color: 'text-red-500',
  },
  {
    q: 'I was charged incorrectly.',
    a: 'Refunds for billing errors are processed within 3–5 business days. Screenshot the incorrect charge and include it in your message for fastest resolution.',
    icon: CreditCard,
    color: 'text-yellow-500',
  },
  {
    q: 'I want to list my restaurant.',
    a: 'Select "Store Partnership" as your topic below and describe your restaurant. Our onboarding team will schedule a call within 1 business day.',
    icon: Store,
    color: 'text-green-500',
  },
  {
    q: 'I can\'t log into my account.',
    a: 'Try "Forgot Password" on the login screen. If your email isn\'t recognized, you may have signed up with a different provider (Google / Apple). Contact us if you\'re still stuck.',
    icon: AlertCircle,
    color: 'text-blue-500',
  },
];

export function ContactView() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const selectedMeta = form.topic ? TOPIC_META[form.topic] : null;

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background: '#f8f8f8',
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="w-full max-w-5xl mx-auto px-4 py-12 space-y-12">

        {/* ── Hero ── */}
        <div>
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-black px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
            💬 Support & Partnerships
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 leading-tight">
            How Can We Help?
          </h1>
          <p className="text-gray-500 text-base max-w-xl leading-relaxed">
            The MiSlice team is based in Detroit and available 7 days a week.
            Whether you have an order issue, billing question, or want to partner with us — we're here.
          </p>
        </div>

        {/* ── Quick Answers ── */}
        <div>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Common Questions — Quick Answers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_ANSWERS.map((qa, i) => {
              const Icon = qa.icon;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <Icon className={`w-4 h-4 ${qa.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 mb-1">{qa.q}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{qa.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main contact grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Contact info */}
          <div className="lg:col-span-2 space-y-5">

            <div className="bg-white rounded-3xl p-6 space-y-5 shadow-sm border border-gray-200">
              <h2 className="text-base font-black text-gray-900">Get in Touch</h2>

              {[
                { icon: Mail,  label: 'General Support',     value: 'support@mislice.com',      note: '< 4 hour response' },
                { icon: Mail,  label: 'Store Partnerships',  value: 'stores@mislice.com',        note: '1 business day' },
                { icon: Mail,  label: 'Billing & Refunds',   value: 'billing@mislice.com',       note: '< 4 hour response' },
                { icon: Mail,  label: 'Press & Media',       value: 'press@mislice.com',         note: '2 business days' },
                { icon: Phone, label: 'Urgent Support Line', value: '+1 (313) 555-0199',         note: 'Mon–Sun, 9am–9pm ET' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-yellow-400" />
                      {item.note}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-0.5">Headquarters</p>
                  <p className="text-sm font-semibold text-gray-900">Detroit, Michigan</p>
                  <p className="text-xs text-gray-400">Proudly built in the Mitten 🧤</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-0.5">Support Hours</p>
                  <p className="text-sm font-semibold text-gray-900">Mon–Fri: 9am – 9pm ET</p>
                  <p className="text-xs text-gray-400">Sat–Sun: 10am – 7pm ET</p>
                </div>
              </div>
            </div>

            {/* Topic guide */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-base font-black text-gray-900 mb-1">Response Times by Topic</h2>
              <p className="text-xs text-gray-400 mb-4">We prioritize urgent order and billing issues.</p>
              <div className="space-y-3">
                {TOPICS.map(t => {
                  const m = TOPIC_META[t];
                  const Icon = m.icon;
                  return (
                    <div key={t} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg border ${m.bg} flex items-center justify-center`}>
                          <Icon className={`w-3 h-3 ${m.color}`} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{t}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${m.bg} ${m.color}`}>{m.response}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Social */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-base font-black text-gray-900 mb-1">Follow MiSlice</h2>
              <p className="text-xs text-gray-400 mb-4">Daily deals, new store announcements, and Michigan pizza love.</p>
              <div className="space-y-3">
                {[
                  { icon: Instagram, label: 'Instagram', handle: '@mislice.pizza', color: 'text-pink-500 bg-pink-50 border-pink-100' },
                  { icon: Facebook,  label: 'Facebook',  handle: 'MiSlice Pizza', color: 'text-blue-500 bg-blue-50 border-blue-100' },
                  { icon: Linkedin,  label: 'LinkedIn',  handle: 'MiSlice', color: 'text-blue-700 bg-blue-50 border-blue-100' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 border rounded-xl flex items-center justify-center ${s.color}`}>
                      <s.icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">{s.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{s.handle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-white border border-gray-200 rounded-3xl px-8 shadow-sm">
                <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Message Sent!</h2>
                <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-1">
                  Thanks for reaching out, <strong className="text-gray-900">{form.name.split(' ')[0]}</strong>.
                </p>
                <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                  We'll reply to <span className="text-red-500 font-semibold">{form.email}</span>{' '}
                  {selectedMeta ? `within ${selectedMeta.response}.` : 'within 1 business day.'}
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
                  className="mt-8 text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
                >
                  ← Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
                <div>
                  <h2 className="text-lg font-black text-gray-900 mb-1">Send a Message</h2>
                  <p className="text-xs text-gray-400">Fill out the form and our team will get back to you fast.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Your Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Email Address *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Topic *</label>
                  <select
                    required
                    value={form.topic}
                    onChange={e => set('topic', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                  >
                    <option value="">Select a topic…</option>
                    {TOPICS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {/* Dynamic context hint */}
                  {selectedMeta && (
                    <div className={`mt-2 border rounded-xl px-3 py-2.5 flex items-start gap-2 ${selectedMeta.bg}`}>
                      <selectedMeta.icon className={`w-4 h-4 ${selectedMeta.color} shrink-0 mt-0.5`} />
                      <div>
                        <p className="text-xs text-gray-700 leading-relaxed">{selectedMeta.desc}</p>
                        <p className={`text-[10px] font-black mt-0.5 ${selectedMeta.color}`}>
                          ⚡ Typical response: {selectedMeta.response}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Message *</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition resize-none"
                    placeholder="Describe your issue or question in as much detail as possible. If it's about an order, include your order number."
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Tip: include your order number or screenshots for faster resolution.</p>
                </div>

                <button
                  type="submit"
                  disabled={!form.name || !form.email || !form.topic || !form.message}
                  className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_8px_24px_rgba(220,38,38,0.3)] hover:from-red-500 hover:to-red-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send Message →
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Store Partnership CTA ── */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-400 rounded-2xl flex items-center justify-center shrink-0">
            <Store className="w-7 h-7 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-black text-gray-900 mb-1">Own a Pizzeria in Michigan?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Join 50+ local stores already growing their delivery revenue on MiSlice. No monthly fees — just a flat 20% commission per order.
              Our onboarding team will get you live in under 48 hours.
            </p>
          </div>
          <button
            onClick={() => { set('topic', 'Store Partnership'); document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="shrink-0 bg-gradient-to-r from-green-500 to-green-600 text-white font-black text-sm px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Get Listed →
          </button>
        </div>

      </div>
    </div>
  );
}
