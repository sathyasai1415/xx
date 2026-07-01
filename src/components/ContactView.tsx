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
    <div
      className="w-full min-h-screen py-12 px-4"
      style={{
        background: '#f8f8f8',
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-7 h-7 text-red-500" />
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Contact Us</h1>
        </div>
        <p className="text-gray-500 text-sm mb-10">We're here to help. Reach out to the MiSlice team any time.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Contact info */}
          <div className="lg:col-span-2 space-y-5">

            <div className="bg-white rounded-3xl p-6 space-y-5 shadow-sm border border-gray-100">
              <h2 className="text-base font-black text-gray-900">Get in Touch</h2>

              {[
                { icon: Mail,   label: 'General Support',    value: 'support@mislice.com' },
                { icon: Mail,   label: 'Store Partnerships', value: 'stores@mislice.com' },
                { icon: Mail,   label: 'Privacy & Legal',    value: 'legal@mislice.com' },
                { icon: Phone,  label: 'Customer Support Line', value: '+1 (313) 555-0199' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
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
                  <p className="text-xs text-gray-400">United States</p>
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

            {/* Social */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-black text-gray-900 mb-4">Follow MiSlice</h2>
              <div className="space-y-3">
                {[
                  { icon: Instagram, label: 'Instagram', handle: '@mislice.pizza' },
                  { icon: Facebook,  label: 'Facebook',  handle: 'MiSlice Pizza' },
                  { icon: Linkedin,  label: 'LinkedIn',  handle: 'MiSlice' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                      <s.icon className="w-3.5 h-3.5 text-gray-600" />
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

          {/* Contact form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-white border border-gray-100 rounded-3xl px-8 shadow-sm">
                <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Message Sent!</h2>
                <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                  Thanks for reaching out, {form.name.split(' ')[0]}. We'll reply to <span className="text-red-500 font-semibold">{form.email}</span> within 1 business day.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
                  className="mt-6 text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
                <h2 className="text-base font-black text-gray-900 mb-1">Send a Message</h2>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Your Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                    placeholder="jane@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Topic *</label>
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Message *</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition resize-none"
                    placeholder="Tell us how we can help…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!form.name || !form.email || !form.topic || !form.message}
                  className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_8px_24px_rgba(220,38,38,0.3)] hover:from-red-500 hover:to-red-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send Message
                </button>

                <p className="text-center text-xs text-gray-400">
                  We typically respond within 1 business day.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
