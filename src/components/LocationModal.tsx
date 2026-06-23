import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Search, X, Clock, ChevronRight, Loader2, Check } from 'lucide-react';

const SUGGESTED = [
  { label: 'Downtown Detroit', detail: 'Detroit, MI 48226', emoji: '🏙️' },
  { label: 'Midtown Detroit', detail: 'Detroit, MI 48201', emoji: '🎨' },
  { label: 'Corktown', detail: 'Detroit, MI 48216', emoji: '🏘️' },
  { label: 'Eastern Market', detail: 'Detroit, MI 48207', emoji: '🛒' },
  { label: 'Ferndale', detail: 'Ferndale, MI 48220', emoji: '🌳' },
  { label: 'Royal Oak', detail: 'Royal Oak, MI 48067', emoji: '👑' },
  { label: 'Dearborn', detail: 'Dearborn, MI 48126', emoji: '🏭' },
  { label: 'Ann Arbor', detail: 'Ann Arbor, MI 48104', emoji: '🎓' },
];

const QUICK_SEARCH = ['Pizza near me', 'Best deals', 'Open now', 'Under 20 min'];

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onLocationChange: (location: string) => void;
}

export function LocationModal({ isOpen, onClose, currentLocation, onLocationChange }: LocationModalProps) {
  const [query, setQuery] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('miSliceRecentLocations') || '[]'); }
    catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const saveAndClose = (loc: string) => {
    const updated = [loc, ...recent.filter(r => r !== loc)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem('miSliceRecentLocations', JSON.stringify(updated));
    onLocationChange(loc);
    onClose();
  };

  const detectGPS = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      setDetecting(false);
      saveAndClose('Detroit, MI');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setDetecting(false);
        setDetected(true);
        setTimeout(() => saveAndClose('Detroit, MI (GPS)'), 900);
      },
      () => {
        setDetecting(false);
        saveAndClose('Detroit, MI');
      },
      { timeout: 6000 }
    );
  };

  const filtered = query.length > 1
    ? SUGGESTED.filter(s => s.label.toLowerCase().includes(query.toLowerCase()) || s.detail.toLowerCase().includes(query.toLowerCase()))
    : SUGGESTED;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
            onClick={onClose}
          />

          {/* Modal — slides up from bottom */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[201] max-h-[85vh] bg-[#0e0e0e] border-t border-white/10 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mt-3 mb-0 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8 shrink-0">
              <div>
                <h2 className="text-base font-black text-white">Your Location</h2>
                <p className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-red-400" />
                  {currentLocation}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search input */}
            <div className="px-5 py-3 shrink-0">
              <div className="relative flex items-center bg-white/6 border border-white/12 focus-within:border-red-500/40 rounded-2xl overflow-hidden transition-colors">
                <Search className="w-4 h-4 text-stone-500 ml-4 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search city, neighborhood, or zip..."
                  className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder-stone-600 outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && query.trim()) saveAndClose(query.trim());
                    if (e.key === 'Escape') onClose();
                  }}
                />
                {query && (
                  <button onClick={() => setQuery('')} className="mr-3 text-stone-600 hover:text-stone-300 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8 space-y-4">

              {/* GPS detect */}
              <div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={detectGPS}
                  disabled={detecting || detected}
                  className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-500/12 to-red-500/8 border border-red-500/25 hover:border-red-500/45 transition-all group"
                >
                  <div className="w-9 h-9 bg-red-500/15 rounded-xl flex items-center justify-center shrink-0">
                    {detecting
                      ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                      : detected
                      ? <Check className="w-4 h-4 text-green-400" />
                      : <Navigation className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-white">
                      {detecting ? 'Detecting location...' : detected ? 'Location found!' : 'Use my current location'}
                    </p>
                    <p className="text-[10px] text-stone-500">GPS-powered · most accurate results</p>
                  </div>
                  {!detecting && !detected && <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-red-400 ml-auto transition-colors" />}
                </motion.button>
              </div>

              {/* Quick search */}
              {!query && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 mb-2.5">Quick Search</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SEARCH.map(q => (
                      <button
                        key={q}
                        onClick={() => setQuery(q)}
                        className="text-[10px] font-bold text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 px-3 py-1.5 rounded-full transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent */}
              {!query && recent.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 mb-2.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Recent
                  </p>
                  <div className="space-y-1.5">
                    {recent.map((loc, i) => (
                      <LocationRow
                        key={i}
                        emoji="🕐"
                        label={loc}
                        detail="Recent search"
                        onClick={() => saveAndClose(loc)}
                        isCurrent={loc === currentLocation}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 mb-2.5">
                  {query ? 'Results' : 'Suggested Neighborhoods'}
                </p>
                <div className="space-y-1.5">
                  {filtered.length > 0
                    ? filtered.map((s, i) => (
                      <LocationRow
                        key={i}
                        emoji={s.emoji}
                        label={s.label}
                        detail={s.detail}
                        onClick={() => saveAndClose(s.label)}
                        isCurrent={s.label === currentLocation}
                      />
                    ))
                    : query && (
                      <div className="text-center py-6 text-stone-600 text-sm">
                        <p>No matches for "<span className="text-stone-400">{query}</span>"</p>
                        <button
                          onClick={() => saveAndClose(query)}
                          className="mt-3 text-xs font-bold text-red-400 hover:text-red-300"
                        >
                          Use "{query}" as location →
                        </button>
                      </div>
                    )}
                </div>
              </div>

              {/* Custom input CTA */}
              {query.trim() && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => saveAndClose(query.trim())}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-400/30 hover:opacity-90 transition-opacity"
                >
                  <MapPin className="w-4 h-4" /> Set Location to "{query.trim()}"
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function LocationRow({ emoji, label, detail, onClick, isCurrent }: {
  emoji: string; label: string; detail: string; onClick: () => void; isCurrent: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-3 px-3.5 rounded-xl border transition-all group text-left ${
        isCurrent
          ? 'bg-red-500/10 border-red-500/25 text-red-300'
          : 'bg-white/4 border-white/8 hover:border-white/18 hover:bg-white/7'
      }`}
    >
      <span className="text-lg shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isCurrent ? 'text-red-300' : 'text-white'}`}>{label}</p>
        <p className="text-[10px] text-stone-600 truncate">{detail}</p>
      </div>
      {isCurrent
        ? <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
        : <ChevronRight className="w-3.5 h-3.5 text-stone-700 group-hover:text-stone-400 transition-colors shrink-0" />
      }
    </button>
  );
}
