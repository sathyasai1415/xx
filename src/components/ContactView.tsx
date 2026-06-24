import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare, CheckCircle, Instagram, Facebook, Linkedin } from 'lucide-react';

const TOPICS = [
  'Order Issue', 'Delivery Problem', 'Billing & Payment',
  'Account Help', 'Store Partnership', 'Press & Media', 'Other',
];

export function ContactView() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-2">
        <MessageSquare className="w-7 h-7 text-red-400" />
        <h1 className="text-4xl font-black text-white tracking-tight">Contact Us</h1>
      </div>
      <p className="text-stone-400 text-sm mb-10">We're here to help. Reach out to the MiSlice team any time.</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Contact info */}
        <div className="lg:col-span-2 space-y-5">

          <div className="bg-white/4 border border-white/10 rounded-3xl p-6 space-y-5">
            <h2 className="text-base font-black text-white">Get in Touch</h2>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 mb-0.5">General Support</p>
                <p className="text-sm font-semibold text-white">support@mislice.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 mb-0.5">Store Partnerships</p>
                <p className="text-sm font-semibold text-white">stores@mislice.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 mb-0.5">Privacy & Legal</p>
                <p className="text-sm font-semibold text-white">legal@mislice.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 mb-0.5">Customer Support Line</p>
                <p className="text-sm font-semibold text-white">+1 (313) 555-0199</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 mb-0.5">Headquarters</p>
                <p className="text-sm font-semibold text-white">Detroit, Michigan</p>
                <p className="text-xs text-stone-500">United States</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 mb-0.5">Support Hours</p>
                <p className="text-sm font-semibold text-white">Mon–Fri: 9am – 9pm ET</p>
                <p className="text-xs text-stone-500">Sat–Sun: 10am – 7pm ET</p>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="bg-white/4 border border-white/10 rounded-3xl p-6">
            <h2 className="text-base font-black text-white mb-4">Follow MiSlice</h2>
            <div className="space-y-3">
              {[
                { icon: Instagram, label: 'Instagram', handle: '@mislice.pizza' },
                { icon: Facebook, label: 'Facebook', handle: 'MiSlice Pizza' },
                { icon: Linkedin, label: 'LinkedIn', handle: 'MiSlice' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/8 rounded-xl flex items-center justify-center">
                    <s.icon className="w-3.5 h-3.5 text-stone-300" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-400">{s.label}</p>
                    <p className="text-sm font-semibold text-white">{s.handle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="lg:col-span-3">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-white/4 border border-white/10 rounded-3xl px-8">
              <div className="w-16 h-16 bg-green-500/20 border border-green-400/40 rounded-full flex items-center justify-center mb-5">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Message Sent!</h2>
              <p className="text-stone-400 text-sm max-w-xs leading-relaxed">
                Thanks for reaching out, {form.name.split(' ')[0]}. We'll reply to <span className="text-red-400">{form.email}</span> within 1 business day.
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
                className="mt-6 text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/4 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5">
              <h2 className="text-base font-black text-white mb-1">Send a Message</h2>

              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1.5">Your Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500/60"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1.5">Email Address *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500/60"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1.5">Topic *</label>
                <select
                  required
                  value={form.topic}
                  onChange={e => set('topic', e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/60"
                >
                  <option value="" className="bg-stone-900">Select a topic…</option>
                  {TOPICS.map(t => (
                    <option key={t} value={t} className="bg-stone-900">{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1.5">Message *</label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500/60 resize-none"
                  placeholder="Tell us how we can help…"
                />
              </div>

              <button
                type="submit"
                disabled={!form.name || !form.email || !form.topic || !form.message}
                className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_8px_24px_rgba(220,38,38,0.4)] hover:from-red-500 hover:to-red-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send Message
              </button>

              <p className="text-center text-xs text-stone-500">
                We typically respond within 1 business day.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
