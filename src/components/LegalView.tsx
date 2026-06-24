import React, { useState } from 'react';
import {
  HelpCircle, FileText, Shield, Lock, ChevronDown, CheckCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type LegalTab = 'faq' | 'terms' | 'privacy' | 'data-privacy';

interface LegalViewProps {
  initialTab?: LegalTab;
}

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQS = [
  {
    category: 'General',
    items: [
      { q: 'What is MiSlice?', a: 'MiSlice is a Michigan-based pizza marketplace that lets you compare prices, build custom pizzas using AI, discover local deals, and place orders from multiple pizza restaurants — all in one place.' },
      { q: 'Is MiSlice free to use?', a: 'Yes! MiSlice is completely free for customers. We charge a small platform fee to partner restaurants (not to you), which helps us keep the lights on and the deals flowing.' },
      { q: 'Which cities does MiSlice cover?', a: "We currently cover major Michigan cities including Detroit, Dearborn, Ann Arbor, Lansing, Grand Rapids, Flint, and Warren. We're expanding rapidly — stay tuned for new city launches." },
    ],
  },
  {
    category: 'Orders & Delivery',
    items: [
      { q: 'How do I place an order?', a: "Use the AI Pizza Builder or search for what you want, compare prices across nearby stores, then tap \"Order\" on your preferred store. You'll complete payment and confirm your delivery address before checkout." },
      { q: 'Can I track my order?', a: "Yes. After placing an order, you'll see a live tracking view showing estimated preparation time, pickup by the driver, and delivery to your door." },
      { q: 'What delivery providers does MiSlice use?', a: 'MiSlice integrates with multiple delivery providers (including store-operated delivery and third-party drivers). The available options and fees are shown before checkout so you can choose the best option.' },
      { q: 'What if my order is wrong or late?', a: 'Contact us immediately through the "My Orders" page. For order accuracy issues, we work with the restaurant on your behalf. For delivery delays, we\'ll escalate to the delivery provider.' },
      { q: 'Can I cancel or modify an order?', a: 'Orders can be cancelled within 2 minutes of placement. After that, the restaurant has already begun preparation. To request a cancellation after that window, contact the store directly.' },
    ],
  },
  {
    category: 'Pricing & Payments',
    items: [
      { q: 'Are the prices on MiSlice accurate?', a: 'We do our best to display live, up-to-date prices from partner stores. Prices are refreshed regularly, but final pricing is always confirmed at checkout.' },
      { q: 'What payment methods are accepted?', a: 'We accept all major credit and debit cards (Visa, Mastercard, AmEx, Discover), Apple Pay, and Google Pay. Payment is processed securely — we never store your full card number.' },
      { q: 'Why does the total at checkout differ from the price shown?', a: 'The final total includes applicable sales tax, delivery fees, and any selected add-ons. All fees are itemized at checkout before you confirm payment.' },
    ],
  },
  {
    category: 'Deals & Rewards',
    items: [
      { q: 'How do MiSlice Rewards work?', a: 'Earn points on every order placed through MiSlice. Points can be redeemed for discounts on future orders. Check the Deals & Rewards section for your current balance.' },
      { q: 'How do I get deal alerts?', a: "Enable notifications in your profile settings. You'll receive push alerts and emails when stores near you post new deals, flash sales, or limited-time promotions." },
    ],
  },
  {
    category: 'Account & Privacy',
    items: [
      { q: 'How do I delete my account?', a: 'Go to your Profile and select "Delete Account," or submit a Data Deletion request through the Data Rights tab. Deletion is permanent and irreversible.' },
      { q: 'How does MiSlice use my data?', a: 'We use your data to process orders, personalize your experience, and improve our service. We never sell your personal data. See the Privacy Policy tab for full details.' },
      { q: 'I forgot my password. How do I reset it?', a: "On the login screen, tap \"Forgot Password\" and enter your email. You'll receive a reset link within a few minutes. If you don't see it, check your spam folder." },
    ],
  },
  {
    category: 'For Store Owners',
    items: [
      { q: 'How do I list my restaurant on MiSlice?', a: 'Contact us at stores@mislice.com. We\'ll schedule an onboarding call, set up your store profile, and get you live within 48 hours.' },
      { q: "What is MiSlice's commission structure?", a: 'MiSlice charges a transparent 20% platform fee on orders routed through the app. No hidden fees, monthly subscriptions, or setup costs.' },
      { q: 'Can I manage my own deals?', a: 'Yes. Through the Store Dashboard you can create, edit, and schedule promotions that appear in real-time on the marketplace and in customer deal alerts.' },
    ],
  },
];

// ── Data Privacy request types ─────────────────────────────────────────────────

const REQUEST_TYPES = [
  { value: 'access',      label: 'Access My Data',       desc: 'Request a copy of all personal data MiSlice holds about you.' },
  { value: 'correct',     label: 'Correct My Data',      desc: 'Request corrections to inaccurate or incomplete personal data.' },
  { value: 'delete',      label: 'Delete My Data',       desc: 'Request deletion of your personal data from our systems.' },
  { value: 'portability', label: 'Data Portability',     desc: 'Receive your data in a portable, machine-readable format.' },
  { value: 'opt-out',     label: 'Opt Out of Marketing', desc: 'Stop receiving promotional emails and push notifications.' },
  { value: 'restrict',    label: 'Restrict Processing',  desc: 'Limit how we use your data in specific circumstances.' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string; key?: React.Key }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <span className="text-sm font-bold text-stone-200 group-hover:text-white transition-colors">{q}</span>
        <ChevronDown className={`w-4 h-4 text-stone-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-stone-400 leading-relaxed">{a}</p>}
    </div>
  );
}

function FAQContent() {
  const [activeCategory, setActiveCategory] = useState('General');
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {FAQS.map(cat => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
              activeCategory === cat.category
                ? 'bg-red-500 text-white shadow-[0_4px_14px_rgba(220,38,38,0.4)]'
                : 'bg-white/8 text-stone-400 hover:text-white hover:bg-white/12'
            }`}
          >
            {cat.category}
          </button>
        ))}
      </div>
      {FAQS.filter(c => c.category === activeCategory).map(cat => (
        <div key={cat.category} className="bg-white/4 border border-white/10 rounded-3xl px-6 py-2">
          {cat.items.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
        </div>
      ))}
      <div className="mt-10 text-center bg-gradient-to-br from-red-900/40 to-transparent border border-red-500/20 rounded-3xl p-8">
        <p className="text-stone-300 font-bold mb-1">Still have questions?</p>
        <p className="text-stone-400 text-sm">Reach out any time through our Contact Us page.</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="text-stone-400 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 ml-2">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function TermsContent() {
  return (
    <div className="space-y-8 text-stone-300">
      <p className="text-stone-400 text-sm">Last updated: June 2026</p>
      <Section title="1. Acceptance of Terms">
        <p>By accessing or using MiSlice, you agree to be bound by these Terms of Use. If you do not agree, please do not use the Service. MiSlice is a Michigan-based pizza marketplace connecting customers with local pizza restaurants.</p>
      </Section>
      <Section title="2. Eligibility">
        <p>You must be at least 13 years of age to use the Service. Users under 18 must have parental or guardian consent.</p>
      </Section>
      <Section title="3. Account Registration">
        <p>To access certain features you may need to create an account. You agree to:</p>
        <BulletList items={[
          'Provide accurate, current, and complete information during registration',
          'Maintain and promptly update your account information',
          'Keep your password confidential and not share it with any third party',
          'Notify MiSlice immediately of any unauthorized use of your account',
          'Be responsible for all activity that occurs under your account',
        ]} />
      </Section>
      <Section title="4. Orders and Transactions">
        <p>MiSlice acts as a marketplace platform. When you place an order:</p>
        <BulletList items={[
          'You enter into a direct transaction with the restaurant fulfilling your order',
          'Prices displayed are subject to change without notice',
          'MiSlice collects a platform fee from stores, not from customers',
          'Refunds and order issues must be resolved with the restaurant directly',
          'Estimated delivery times are approximate and not guaranteed',
        ]} />
      </Section>
      <Section title="5. Prohibited Conduct">
        <p>You agree not to:</p>
        <BulletList items={[
          'Use the Service for any unlawful purpose',
          'Post false, inaccurate, misleading, or defamatory content',
          'Attempt to gain unauthorized access to any part of the Service',
          'Scrape, copy, or republish any data without written permission',
          'Interfere with or disrupt the Service or its servers',
          'Use automated tools, bots, or scripts to interact with the Service',
          'Impersonate any person or entity',
        ]} />
      </Section>
      <Section title="6. User Content">
        <p>By submitting reviews, photos, or other content to MiSlice, you grant us a non-exclusive, royalty-free, worldwide license to use and publish such content in connection with the Service. You represent that you own or have rights to any content you submit.</p>
      </Section>
      <Section title="7. Intellectual Property">
        <p>All content on MiSlice — including text, graphics, logos, and software — is the property of MiSlice or its content suppliers and is protected by applicable copyright and trademark laws. Unauthorized use is strictly prohibited.</p>
      </Section>
      <Section title="8. Disclaimers and Limitation of Liability">
        <p className="uppercase text-xs tracking-wide">The Service is provided "as is" without warranties of any kind. MiSlice shall not be liable for any indirect, incidental, special, or consequential damages, including lost profits, data loss, or personal injury resulting from food orders placed through the platform.</p>
      </Section>
      <Section title="9. Allergen & Dietary Notice">
        <p>Menu and ingredient information is provided by partner restaurants and may not always be complete. If you have food allergies or dietary requirements, contact the restaurant directly before ordering. MiSlice assumes no liability for adverse reactions.</p>
      </Section>
      <Section title="10. Governing Law">
        <p>These Terms are governed by the laws of the State of Michigan. Any disputes shall be subject to the exclusive jurisdiction of the state and federal courts located in Michigan.</p>
      </Section>
      <Section title="11. Changes to Terms">
        <p>MiSlice may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance. We will notify registered users of material changes via email or in-app notification.</p>
      </Section>
      <Section title="12. Contact">
        <p>Questions about these Terms? Email <span className="text-red-400 font-semibold">legal@mislice.com</span></p>
      </Section>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-8 text-stone-300">
      <p className="text-stone-400 text-sm">Last updated: June 2026</p>
      <Section title="1. Introduction">
        <p>MiSlice is committed to protecting your privacy. This Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. By using MiSlice, you consent to the practices described herein.</p>
      </Section>
      <Section title="2. Information We Collect">
        <p className="font-semibold text-stone-300">Information you provide:</p>
        <BulletList items={[
          'Account details: name, email, phone number, and password',
          'Delivery address and location data',
          'Payment information (processed via third-party payment processors)',
          'Order history, saved pizzas, and preferences',
          'Reviews, ratings, and feedback you submit',
        ]} />
        <p className="font-semibold text-stone-300 mt-3">Collected automatically:</p>
        <BulletList items={[
          'Device info: IP address, browser type, OS, device identifiers',
          'Usage data: pages visited, features used, clicks, search queries',
          'Location data (when permitted by your device settings)',
          'Cookies and similar tracking technologies',
        ]} />
      </Section>
      <Section title="3. How We Use Your Information">
        <BulletList items={[
          'To create and manage your account',
          'To process orders and facilitate transactions with restaurants',
          'To personalize your experience and recommend deals',
          'To send order confirmations, updates, and support communications',
          'To send marketing communications (with your consent; opt out any time)',
          'To improve the Service through analytics and research',
          'To detect, prevent, and respond to fraud or security incidents',
          'To comply with legal obligations',
        ]} />
      </Section>
      <Section title="4. Cookies and Tracking">
        <p>We use cookies and similar technologies to enhance your experience. Types: <span className="text-stone-200 font-semibold">Essential</span> (required for the Service), <span className="text-stone-200 font-semibold">Analytics</span> (understand usage), <span className="text-stone-200 font-semibold">Preferences</span> (remember settings), and <span className="text-stone-200 font-semibold">Marketing</span> (deliver relevant promotions, with consent). You can manage cookies via your browser settings.</p>
      </Section>
      <Section title="5. Sharing of Information">
        <p>We do not sell your personal information. We may share it with:</p>
        <BulletList items={[
          'Restaurants — name, address, and order details to fulfill your order',
          'Delivery partners — location and order details for fulfillment',
          'Payment processors — to process transactions securely',
          'Service providers — analytics, hosting, support (under data processing agreements)',
          'Legal authorities — when required by law or to protect user safety',
          'Business transfers — in connection with a merger or acquisition',
        ]} />
      </Section>
      <Section title="6. Data Retention">
        <p>We retain your data for as long as your account is active or as needed to provide the Service. Order and transaction data is retained for up to 7 years for legal and tax compliance. You may request deletion at any time.</p>
      </Section>
      <Section title="7. Security">
        <p>We implement industry-standard security measures including encryption in transit (TLS), hashed password storage, and access controls. No internet transmission is 100% secure — use a strong, unique password for your account.</p>
      </Section>
      <Section title="8. Your Rights & Choices">
        <p>You may have the right to access, correct, delete, or port your data, opt out of marketing, or restrict certain processing. Submit a request via the Data Rights tab or email <span className="text-red-400 font-semibold">privacy@mislice.com</span>. We respond within 30 days.</p>
      </Section>
      <Section title="9. Children's Privacy">
        <p>MiSlice is not directed to children under 13. We do not knowingly collect data from children under 13. If you believe a child has submitted information, contact us at <span className="text-red-400 font-semibold">privacy@mislice.com</span>.</p>
      </Section>
      <Section title="10. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time and will notify you of material changes via email or in-app notice. Continued use constitutes acceptance.</p>
      </Section>
    </div>
  );
}

function DataPrivacyContent() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', requestType: '', description: '', confirm: false });
  const [submitted, setSubmitted] = useState(false);
  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  if (submitted) {
    return (
      <div className="py-24 text-center">
        <div className="w-20 h-20 bg-green-500/20 border border-green-400/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3">Request Submitted</h2>
        <p className="text-stone-400 max-w-sm mx-auto leading-relaxed">
          We'll respond within <span className="text-white font-semibold">30 days</span> to <span className="text-red-400">{form.email}</span>.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ firstName: '', lastName: '', email: '', phone: '', requestType: '', description: '', confirm: false }); }}
          className="mt-8 text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-stone-400 text-sm mb-8">Exercise your rights under CCPA, GDPR, and applicable privacy laws.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {REQUEST_TYPES.map(r => (
          <button
            key={r.value}
            type="button"
            onClick={() => set('requestType', r.value)}
            className={`text-left p-4 rounded-2xl border transition-all ${
              form.requestType === r.value
                ? 'bg-red-500/20 border-red-500/60 text-white'
                : 'bg-white/4 border-white/10 text-stone-400 hover:border-white/25 hover:text-stone-200'
            }`}
          >
            <p className="font-bold text-sm mb-1">{r.label}</p>
            <p className="text-xs leading-relaxed opacity-80">{r.desc}</p>
          </button>
        ))}
      </div>
      <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} className="bg-white/4 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1.5">First Name *</label>
            <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500/60" placeholder="Jane" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1.5">Last Name *</label>
            <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500/60" placeholder="Doe" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-400 mb-1.5">Email Address *</label>
          <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500/60" placeholder="jane@example.com" />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-400 mb-1.5">Phone (optional)</label>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500/60" placeholder="+1 (555) 000-0000" />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-400 mb-1.5">Request Type *</label>
          <select required value={form.requestType} onChange={e => set('requestType', e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/60">
            <option value="" className="bg-stone-900">Select a request type…</option>
            {REQUEST_TYPES.map(r => <option key={r.value} value={r.value} className="bg-stone-900">{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-400 mb-1.5">Additional Details</label>
          <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500/60 resize-none" placeholder="Describe your request in more detail (optional)…" />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" required checked={form.confirm} onChange={e => set('confirm', e.target.checked)} className="mt-0.5 accent-red-500 shrink-0" />
          <span className="text-xs text-stone-400 leading-relaxed">I confirm the information provided is accurate and I am authorized to make this request. I understand MiSlice will need to verify my identity before processing.</span>
        </label>
        <button
          type="submit"
          disabled={!form.requestType || !form.firstName || !form.email || !form.confirm}
          className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_8px_24px_rgba(220,38,38,0.4)] hover:from-red-500 hover:to-red-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit Privacy Request
        </button>
        <p className="text-center text-xs text-stone-500">We respond within 30 days. For urgent requests email <span className="text-red-400">privacy@mislice.com</span></p>
      </form>
    </div>
  );
}

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS: { id: LegalTab; label: string; icon: React.ElementType }[] = [
  { id: 'faq',          label: 'FAQs',           icon: HelpCircle },
  { id: 'terms',        label: 'Terms of Use',   icon: FileText   },
  { id: 'privacy',      label: 'Privacy Policy', icon: Shield     },
  { id: 'data-privacy', label: 'Data Rights',    icon: Lock       },
];

// ── Main component ─────────────────────────────────────────────────────────────

export function LegalView({ initialTab = 'faq' }: LegalViewProps) {
  const [tab, setTab] = useState<LegalTab>(initialTab);

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <activeTab.icon className="w-7 h-7 text-red-400" />
        <h1 className="text-4xl font-black text-white tracking-tight">{activeTab.label}</h1>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-10 border-b border-white/8 pb-5">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full transition-all ${
                tab === t.id
                  ? 'bg-red-500 text-white shadow-[0_4px_14px_rgba(220,38,38,0.4)]'
                  : 'bg-white/6 text-stone-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'faq'          && <FAQContent />}
      {tab === 'terms'        && <TermsContent />}
      {tab === 'privacy'      && <PrivacyContent />}
      {tab === 'data-privacy' && <DataPrivacyContent />}
    </div>
  );
}
