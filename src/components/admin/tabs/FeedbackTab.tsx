import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp } from 'lucide-react';

interface Props { storeData: any; orders: any[]; }

const MOCK_REVIEWS = [
  { id: '1', customer: 'Alex M.', rating: 5, comment: 'Best pizza in Farmington! Crust was perfect and delivery was super fast.', date: '2026-06-28', reply: '', order: 'Pepperoni Large' },
  { id: '2', customer: 'Sarah K.', rating: 4, comment: 'Really good pizza, would order again. The BBQ chicken was amazing.', date: '2026-06-26', reply: '', order: 'BBQ Chicken' },
  { id: '3', customer: 'James T.', rating: 3, comment: 'Pizza was good but delivery took a bit longer than expected.', date: '2026-06-24', reply: 'Thank you for the feedback! We\'re working on improving delivery times.', order: 'Veggie Supreme' },
  { id: '4', customer: 'Maria L.', rating: 5, comment: 'Absolutely delicious! The crust is thin and crispy just the way I like it.', date: '2026-06-22', reply: '', order: 'Margherita' },
  { id: '5', customer: 'David R.', rating: 2, comment: 'Pizza arrived cold. Taste was okay but temperature was disappointing.', date: '2026-06-20', reply: '', order: 'Cheese Large' },
];

export function FeedbackTab({ storeData, orders }: Props) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'unreplied'>('all');
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const avgRating = MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length;
  const dist = [5, 4, 3, 2, 1].map(s => ({ stars: s, count: MOCK_REVIEWS.filter(r => r.rating === s).length }));

  const filtered = MOCK_REVIEWS.filter(r => {
    if (filter === 'positive') return r.rating >= 4;
    if (filter === 'negative') return r.rating <= 2;
    if (filter === 'unreplied') return !r.reply && !replies[r.id];
    return true;
  });

  function Stars({ n, size = 'sm' }: { n: number; size?: 'sm' | 'lg' }) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className={`${size === 'lg' ? 'w-5 h-5' : 'w-3 h-3'} ${i <= n ? 'text-yellow-400 fill-yellow-400' : 'text-stone-700'}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Customer Feedback</h2>
        <span className="text-xs text-stone-500">{MOCK_REVIEWS.length} reviews</span>
      </div>

      {/* Rating summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center">
          <p className="text-5xl font-black text-white mb-1">{avgRating.toFixed(1)}</p>
          <Stars n={Math.round(avgRating)} size="lg" />
          <p className="text-xs text-stone-500 mt-2">Overall rating</p>
        </div>
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-5 space-y-2">
          {dist.map(d => (
            <div key={d.stars} className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-400 w-4">{d.stars}</span>
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
              <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400/70 rounded-full"
                  style={{ width: `${(d.count / MOCK_REVIEWS.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-stone-500 w-4">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Positive',  value: MOCK_REVIEWS.filter(r => r.rating >= 4).length, icon: ThumbsUp,  color: 'text-green-400' },
          { label: 'Neutral',   value: MOCK_REVIEWS.filter(r => r.rating === 3).length, icon: MessageSquare, color: 'text-yellow-400' },
          { label: 'Negative',  value: MOCK_REVIEWS.filter(r => r.rating <= 2).length, icon: ThumbsDown, color: 'text-red-400' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/4 border border-white/8 rounded-xl p-3 text-center">
              <Icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-bold text-stone-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl w-fit">
        {(['all', 'positive', 'negative', 'unreplied'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-black rounded-lg capitalize transition-all ${filter === f ? 'bg-red-600 text-white' : 'text-stone-500 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {filtered.map(review => {
          const replied = review.reply || replies[review.id];
          return (
            <div key={review.id} className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                    {review.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">{review.customer}</p>
                    <p className="text-[9px] text-stone-600">{review.date} · {review.order}</p>
                  </div>
                </div>
                <Stars n={review.rating} />
              </div>
              <p className="text-sm text-stone-300 leading-relaxed mb-3">{review.comment}</p>

              {replied ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Your reply</p>
                  <p className="text-xs text-stone-300">{replied}</p>
                </div>
              ) : (
                <div className="mt-2">
                  <textarea
                    value={drafts[review.id] || ''}
                    onChange={e => setDrafts(d => ({ ...d, [review.id]: e.target.value }))}
                    placeholder="Write a reply..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-red-500 resize-none transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (drafts[review.id]?.trim()) {
                        setReplies(r => ({ ...r, [review.id]: drafts[review.id] }));
                        setDrafts(d => ({ ...d, [review.id]: '' }));
                      }
                    }}
                    className="mt-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg transition-colors"
                  >
                    Post Reply
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-stone-600 text-sm py-8">No reviews match this filter.</p>
        )}
      </div>
    </div>
  );
}
