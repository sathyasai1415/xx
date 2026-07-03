import React, { useState } from 'react';
import { Store as StoreIcon, Upload, ArrowRight, CheckCircle2, Wand2, Pizza, MapPin, LogOut, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { submitStoreApplication } from '../../lib/db';
import { auth } from '../../lib/firebase';

const BUSINESS_TYPES = ['Restaurant', 'Specialty food store', 'Bakery', 'Food truck', 'Ghost kitchen', 'Catering'];
const CUISINE_TYPES   = ['Pizza', 'Italian', 'American', 'Mexican', 'Asian', 'Mediterranean', 'Other'];
const MI_CITIES       = ['Detroit', 'Ann Arbor', 'Grand Rapids', 'Farmington', 'Troy', 'Lansing', 'Dearborn', 'Livonia'];

interface Step {
  id: number;
  label: string;
}
const STEPS: Step[] = [
  { id: 1, label: 'Contact Info' },
  { id: 2, label: 'Store Details' },
  { id: 3, label: 'Menu Import'  },
  { id: 4, label: 'Delivery'     },
  { id: 5, label: 'Submit'       },
];

interface Props {
  storeData: any;
  onComplete: () => void;
  onLogout?: () => void;
}

export function AdminOnboarding({ storeData, onComplete, onLogout }: Props) {
  const [step, setStep] = useState(1);

  // Step 1 — contact
  const [firstName,   setFirstName]   = useState(storeData?.first_name   || '');
  const [lastName,    setLastName]     = useState(storeData?.last_name    || '');
  const [email,       setEmail]        = useState(storeData?.email        || auth.currentUser?.email || '');
  const [phone,       setPhone]        = useState(storeData?.phone        || '');

  // Step 2 — store details
  const [storeName,    setStoreName]    = useState(storeData?.store_name    || '');
  const [brandName,    setBrandName]    = useState(storeData?.brand_name    || '');
  const [businessType, setBusinessType] = useState(storeData?.business_type || '');
  const [cuisineType,  setCuisineType]  = useState(storeData?.cuisine_type  || '');
  const [locations,    setLocations]    = useState(storeData?.locations     || 1);
  const [address,      setAddress]      = useState(storeData?.address       || '');
  const [city,         setCity]         = useState(storeData?.city          || 'Farmington');
  const [state,        setState]        = useState(storeData?.state         || 'MI');
  const [zip,          setZip]          = useState(storeData?.zip           || '');
  const [socialLink,   setSocialLink]   = useState(storeData?.social_link   || '');
  const [smsOptIn,     setSmsOptIn]     = useState(true);

  // Step 3 — menu
  const [isScanning,   setIsScanning]   = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // Step 4 — delivery
  const [deliveryFee,     setDeliveryFee]     = useState(storeData?.delivery_fee     || 4.99);
  const [deliveryRadius,  setDeliveryRadius]  = useState(storeData?.delivery_radius  || 5);
  const [minimumOrder,    setMinimumOrder]    = useState(storeData?.minimum_order    || 15);
  const [avgEta,          setAvgEta]          = useState(storeData?.average_eta      || 45);

  const [submitting, setSubmitting] = useState(false);
  const [agreeCommission, setAgreeCommission] = useState(false);

  const applicationStatus = storeData?.application_status || (storeData?.is_approved ? 'approved' : 'draft');
  const isPendingReview = applicationStatus === 'submitted' || applicationStatus === 'under_review';
  const isApproved      = applicationStatus === 'approved';

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setSubmitting(true);
    try {
      await (submitStoreApplication as any)(auth.currentUser.uid, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        store_name: storeName.trim(),
        brand_name: brandName.trim(),
        business_type: businessType,
        cuisine_type: cuisineType,
        locations: Number(locations),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        social_link: socialLink.trim(),
        sms_opt_in: smsOptIn,
        delivery_fee: Number(deliveryFee),
        delivery_radius: Number(deliveryRadius),
        minimum_order: Number(minimumOrder),
        average_eta: Number(avgEta),
        is_setup_complete: true,
        is_approved: false,
      });
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFakeUpload = () => {
    setIsScanning(true);
    setTimeout(() => { setIsScanning(false); setScanComplete(true); }, 2000);
  };

  function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-xs font-bold text-stone-400 mb-1.5">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
      </div>
    );
  }

  function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
      <input {...props}
        className={`w-full bg-white/5 border border-white/12 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-red-500 focus:bg-white/8 transition-colors ${props.className || ''}`}
      />
    );
  }

  function Select({ value, onChange, children }: { value: string | number; onChange: (v: string) => void; children: React.ReactNode }) {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
      >
        {children}
      </select>
    );
  }

  if (isPendingReview) {
    return (
      <div className="max-w-lg mx-auto pt-20 pb-20 text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center">
          <span className="text-3xl">⏳</span>
        </div>
        <h2 className="text-2xl font-black text-white">Application Under Review</h2>
        <p className="text-stone-400">Our marketplace team is reviewing your restaurant. You'll receive an email once approved. Usually 24–48 hours.</p>
        <p className="text-xs text-stone-600">Status: <span className="font-bold text-white">{applicationStatus.replace(/_/g,' ').toUpperCase()}</span></p>
        <div className="space-y-2">
          <button onClick={() => setStep(1)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">
            Review Application
          </button>
          {onLogout && (
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 border border-white/10 text-stone-400 hover:text-white py-3 rounded-xl transition-colors bg-white/5">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isApproved) {
    return (
      <div className="max-w-lg mx-auto pt-20 pb-20 text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Your Store is Live!</h2>
        <p className="text-stone-400">Your restaurant is approved and visible to customers on MiSlice.</p>
        <button onClick={onComplete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-colors">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full pt-8 pb-20 px-4">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center">
            <StoreIcon className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Let's set up your store</h1>
            <p className="text-xs text-stone-500">Step {step} of {STEPS.length}</p>
          </div>
          {onLogout && (
            <button onClick={onLogout} className="ml-auto flex items-center gap-1.5 text-xs text-stone-500 hover:text-white transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Exit
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex gap-1">
          {STEPS.map(s => (
            <button
              key={s.id}
              onClick={() => s.id < step && setStep(s.id)}
              className="flex-1 group"
            >
              <div className={`h-1.5 rounded-full transition-all ${s.id < step ? 'bg-red-500 cursor-pointer' : s.id === step ? 'bg-red-400' : 'bg-white/10'}`} />
              <p className={`text-[9px] font-bold mt-1 truncate transition-colors ${s.id === step ? 'text-white' : s.id < step ? 'text-red-400' : 'text-stone-600'}`}>{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-black/50 border border-white/10 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >

          {/* Step 1 — Contact Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white mb-0.5">Primary contact info</h2>
                <p className="text-xs text-stone-500">Add your business email and phone number to set up your store account</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" required>
                  <Input placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </Field>
                <Field label="Last name" required>
                  <Input placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
                </Field>
                <Field label="Business email" required>
                  <Input type="email" placeholder="e.g. sam@restaurant.com" value={email} onChange={e => setEmail(e.target.value)} />
                </Field>
                <Field label="Contact phone" required>
                  <Input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                </Field>
              </div>
              <button
                onClick={() => firstName && lastName && email && phone && setStep(2)}
                className="w-full bg-black/80 border border-white/10 hover:border-red-500/50 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 group mt-2"
              >
                Get started <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Step 2 — Store Details */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white mb-0.5">Store details</h2>
                <p className="text-xs text-stone-500">Tell us about your restaurant</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Store name" required>
                    <Input placeholder="e.g. Mario's Pizza" value={storeName} onChange={e => setStoreName(e.target.value)} />
                  </Field>
                  <Field label="Business type" required>
                    <Select value={businessType} onChange={setBusinessType}>
                      <option value="">Select…</option>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </Field>
                  <Field label="Cuisine type">
                    <Select value={cuisineType} onChange={setCuisineType}>
                      <option value="">Select…</option>
                      {CUISINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </Field>
                  <Field label="Number of locations">
                    <Select value={locations} onChange={v => setLocations(Number(v))}>
                      {[1,2,3,4,5,'6-10','11-50','50+'].map(n => <option key={n} value={n}>{n}</option>)}
                    </Select>
                  </Field>
                  <Field label="Brand name">
                    <Input placeholder="e.g. Sathya's Pizza" value={brandName} onChange={e => setBrandName(e.target.value)} />
                  </Field>
                </div>

                <div className="border-t border-white/8 pt-4 space-y-4">
                  <p className="text-xs font-black uppercase tracking-widest text-stone-500">Store address</p>
                  <Field label="Street address" required>
                    <Input placeholder="36700 Farmington Rd" value={address} onChange={e => setAddress(e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Field label="City" required>
                        <Select value={city} onChange={setCity}>
                          {MI_CITIES.map(c => <option key={c} value={c}>{c}, MI, United States</option>)}
                        </Select>
                      </Field>
                    </div>
                    <Field label="Postal code" required>
                      <Input placeholder="48335" value={zip} onChange={e => setZip(e.target.value)} />
                    </Field>
                  </div>
                </div>

                <Field label="Social media or website (optional)">
                  <Input placeholder="https://instagram.com/yourpizza" value={socialLink} onChange={e => setSocialLink(e.target.value)} />
                </Field>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" checked={smsOptIn} onChange={e => setSmsOptIn(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-white/5 focus:ring-red-500" />
                  <div>
                    <p className="text-xs font-bold text-white">Opt in to SMS text messages</p>
                    <p className="text-[10px] text-stone-500">You'll receive important account updates regarding your store on MiSlice.</p>
                  </div>
                </label>

                <div className="flex items-center gap-2 bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <p className="text-[10px] text-blue-300/80">By continuing, you agree to MiSlice Merchant Terms and acknowledge you've read the Privacy Notice.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="px-5 py-3 text-stone-400 hover:text-white font-bold text-sm transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => storeName && businessType && address && setStep(3)}
                  className="flex-1 bg-black/80 border border-white/10 hover:border-red-500/50 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  Get started <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Menu Import */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-white mb-0.5">Import your menu</h2>
                <p className="text-xs text-stone-500">Upload an existing menu or build from scratch</p>
              </div>

              {!isScanning && !scanComplete ? (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Upload, label: 'Upload Menu PDF', desc: 'Supported: PDF, PNG, JPG', action: handleFakeUpload },
                    { icon: Pizza,  label: 'Build Manually',  desc: 'Add items one by one',    action: () => setStep(4) },
                  ].map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.label} onClick={opt.action}
                        className="bg-white/4 hover:bg-white/8 border border-white/10 hover:border-red-500/40 rounded-2xl p-6 text-center transition-all group">
                        <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <Icon className="w-7 h-7" />
                        </div>
                        <p className="text-sm font-black text-white">{opt.label}</p>
                        <p className="text-[10px] text-stone-500 mt-1">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              ) : isScanning ? (
                <div className="py-16 flex flex-col items-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-white/10 border-t-red-500 animate-spin" />
                    <Wand2 className="w-7 h-7 text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-lg font-black text-white mt-6">Scanning your menu…</p>
                  <p className="text-xs text-stone-500 mt-1">Extracting items, sizes & prices with AI</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/25 rounded-xl p-4">
                    <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm font-black text-white">Menu extracted successfully</p>
                      <p className="text-xs text-green-400/80">Found 12 pizzas, 24 toppings, 6 drinks</p>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/8 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-2 px-4 py-2 border-b border-white/8 text-[9px] font-black uppercase tracking-widest text-stone-600">
                      <span>Item</span><span className="text-right">Price</span>
                    </div>
                    {[['Classic Cheese Pizza','$12.99'],['Pepperoni Special','$14.99'],['BBQ Chicken','$15.99'],['Veggie Supreme','$13.99']].map(([name, price]) => (
                      <div key={name} className="grid grid-cols-2 px-4 py-2.5 border-b border-white/5 last:border-0">
                        <span className="flex items-center gap-2 text-xs text-white"><CheckCircle2 className="w-3 h-3 text-green-400" />{name}</span>
                        <span className="text-right text-xs font-bold text-stone-300">{price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="px-5 py-3 text-stone-400 hover:text-white font-bold text-sm transition-colors">Back</button>
                {(scanComplete) && (
                  <button onClick={() => setStep(4)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4 — Delivery */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white mb-0.5">Delivery settings</h2>
                <p className="text-xs text-stone-500">Configure how you deliver to customers</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Delivery fee ($)">
                  <Input type="number" step="0.5" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} />
                </Field>
                <Field label="Delivery radius (miles)">
                  <Input type="number" value={deliveryRadius} onChange={e => setDeliveryRadius(Number(e.target.value))} />
                </Field>
                <Field label="Minimum order ($)">
                  <Input type="number" value={minimumOrder} onChange={e => setMinimumOrder(Number(e.target.value))} />
                </Field>
                <Field label="Avg prep time (min)">
                  <Input type="number" value={avgEta} onChange={e => setAvgEta(Number(e.target.value))} />
                </Field>
              </div>


              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(3)} className="px-5 py-3 text-stone-400 hover:text-white font-bold text-sm transition-colors">Back</button>
                <button onClick={() => setStep(5)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-colors">
                  Review & Submit
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — Submit */}
          {step === 5 && (
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/25 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Ready to submit</h2>
                <p className="text-stone-400 text-sm mt-1">Our team will review your restaurant within 24–48 hours.</p>
              </div>

              {/* Summary */}
              <div className="text-left bg-white/4 border border-white/8 rounded-2xl p-4 space-y-2">
                {[
                  { label: 'Contact',  value: `${firstName} ${lastName}` },
                  { label: 'Email',    value: email },
                  { label: 'Store',    value: storeName },
                  { label: 'Brand',    value: brandName || storeName },
                  { label: 'Type',     value: businessType },
                  { label: 'Cuisine',  value: cuisineType },
                  { label: 'Address',  value: `${address}, ${city}, ${state} ${zip}` },
                ].filter(r => r.value).map(r => (
                  <div key={r.label} className="flex gap-3 text-xs">
                    <span className="text-stone-600 w-20 shrink-0">{r.label}</span>
                    <span className="text-white font-bold truncate">{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Commission & Store Agreement */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-left space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-red-400">Commission & Legal Agreements</p>
                <div className="text-xs text-stone-400 space-y-1.5">
                  <p>• <strong>MiSlice Commission:</strong> 20% platform fee on completed orders.</p>
                  <p>• <strong>Policies:</strong> Free onboarding of store, subject to MiSlice Terms of Service & Privacy Policy.</p>
                </div>
                
                <div className="space-y-2.5 mt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={agreeCommission} onChange={e => setAgreeCommission(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 bg-white/5 focus:ring-red-500 accent-red-600" />
                    <span className="text-[11px] font-bold text-stone-300 group-hover:text-white transition-colors">
                      I agree to the MiSlice Store Merchant Agreement, including the 20% platform commission on orders.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input type="checkbox" id="agree-tos" defaultChecked className="mt-0.5 rounded border-white/20 bg-white/5 focus:ring-red-500 accent-red-600" />
                    <span className="text-[11px] font-bold text-stone-300 group-hover:text-white transition-colors">
                      I agree to the Terms of Service & Privacy Policy.
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">Digital Signature Confirmation</label>
                  <input
                    type="text"
                    placeholder="Type your full legal name to sign"
                    id="digital-signature"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="px-5 py-3 text-stone-400 hover:text-white font-bold text-sm transition-colors">Back</button>
                <button onClick={handleSubmit} disabled={submitting || !agreeCommission}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-colors shadow-[0_0_24px_rgba(220,38,38,0.35)]">
                  {submitting ? 'Submitting…' : 'Sign & Submit Agreement'}
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
