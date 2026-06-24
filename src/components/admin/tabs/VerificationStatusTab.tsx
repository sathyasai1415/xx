import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';

interface Props { storeData: any; }

const STEPS = [
  { key: 'account',    label: 'Account Created',          always: true },
  { key: 'info',       label: 'Restaurant Information',   field: 'store_name' },
  { key: 'menu',       label: 'Menu Uploaded',            field: 'menu_uploaded' },
  { key: 'contract',   label: 'Contract Signed',          field: 'contract_signed' },
  { key: 'bank',       label: 'Bank Account Connected',   field: 'bank_connected' },
  { key: 'review',     label: 'Admin Review',             adminStep: true },
  { key: 'activation', label: 'Store Activation',         adminStep: true },
];

export function VerificationStatusTab({ storeData }: Props) {
  const status: string = storeData?.status || 'pending';
  const adminNotes: string = storeData?.admin_notes || '';
  const submittedAt: string = storeData?.submitted_at || storeData?.created_at || '';
  const expectedApproval: string = storeData?.expected_approval || '';

  const getStepState = (step: typeof STEPS[0]): 'done' | 'pending' | 'waiting' => {
    if (step.always) return 'done';
    if (step.adminStep) {
      if (status === 'approved' || status === 'active') return 'done';
      if (step.key === 'activation' && status === 'under_review') return 'waiting';
      return 'waiting';
    }
    if (step.field && storeData?.[step.field]) return 'done';
    return 'pending';
  };

  const completedCount = STEPS.filter(s => getStepState(s) === 'done').length;
  const pct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Verification Status</h2>
        <p className="text-xs text-stone-500 mt-0.5">Track your store's approval progress</p>
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-3 rounded-2xl p-5 border ${
        status === 'approved' || status === 'active'
          ? 'bg-green-500/10 border-green-500/30'
          : status === 'under_review'
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-white/5 border-white/10'
      }`}>
        {status === 'approved' || status === 'active' ? (
          <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" />
        ) : (
          <Clock className="w-8 h-8 text-yellow-400 shrink-0 animate-pulse" />
        )}
        <div>
          <p className="text-base font-black text-white">
            {status === 'approved' || status === 'active'
              ? 'Your store is approved and live!'
              : status === 'under_review'
              ? 'Your restaurant is under review'
              : 'Application submitted'}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            {status === 'approved' || status === 'active'
              ? 'Customers can now find and order from your store on MiSlice.'
              : 'You can continue setting up your store while our team verifies your information. Estimated review: 24–48 hours.'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-black text-white">Store Setup Progress</p>
          <span className="text-xs font-black text-red-400">{pct}%</span>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const state = getStepState(step);
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  state === 'done'    ? 'bg-green-500/20 border-green-500 text-green-400' :
                  state === 'pending' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                  'bg-white/5 border-white/20 text-stone-600'
                }`}>
                  {state === 'done' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : state === 'pending' ? (
                    <span className="text-[8px] font-black">!</span>
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                </div>
                <p className={`text-sm font-bold ${
                  state === 'done' ? 'text-white' : state === 'pending' ? 'text-stone-400' : 'text-stone-600'
                }`}>{step.label}</p>
                {state === 'pending' && (
                  <span className="ml-auto text-[9px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Incomplete</span>
                )}
                {state === 'waiting' && (
                  <span className="ml-auto text-[9px] font-black text-stone-600 bg-white/5 px-2 py-0.5 rounded-full">Waiting</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Submitted</p>
          <p className="text-sm font-black text-white">
            {submittedAt ? new Date(submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '—'}
          </p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Expected Approval</p>
          <p className="text-sm font-black text-yellow-400">
            {expectedApproval
              ? new Date(expectedApproval).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
              : '24–48 hours'}
          </p>
        </div>
      </div>

      {/* Admin notes */}
      {adminNotes && (
        <div className="bg-yellow-500/8 border border-yellow-500/25 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <p className="text-xs font-black text-yellow-400">Notes from MiSlice Admin</p>
          </div>
          <p className="text-sm text-stone-300 leading-relaxed">{adminNotes}</p>
        </div>
      )}

      {/* What to do now */}
      {status !== 'approved' && status !== 'active' && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-black text-white mb-4">What you can do while waiting</p>
          <div className="space-y-2">
            {[
              { emoji: '🍕', text: 'Upload your full menu with photos and prices' },
              { emoji: '🏷️', text: 'Create upcoming deals and promotions' },
              { emoji: '🏪', text: 'Complete your store profile — logo, hours, description' },
              { emoji: '💳', text: 'Connect your bank account for payouts' },
            ].map(item => (
              <div key={item.text} className="flex items-start gap-3 py-2">
                <span className="text-lg shrink-0">{item.emoji}</span>
                <p className="text-sm text-stone-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
