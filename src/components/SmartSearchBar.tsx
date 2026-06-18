import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Mic, X, Clock, Star, ArrowRight, Sparkles, Bot } from 'lucide-react';
import { MARKETPLACE_STORES } from '../data/marketplace';

// ── Types ────────────────────────────────────────────────────────────────────

interface SmartSearchBarProps {
  onSearch: (query: string, parsed?: ParsedQuery) => void;
  onLocationChange?: (loc: string) => void;
  location?: string;
}

export interface ParsedQuery {
  partySize?: number;
  budget?: number;
  maxDeliveryTime?: number;
  toppings?: string[];
  crust?: string;
  size?: string;
  dietary?: string[];
  sortBy?: 'price' | 'rating' | 'speed';
  rawQuery: string;
}

// ── Search corpus (real data + common pizza terms) ────────────────────────────

const PIZZA_TERMS = [
  'Pepperoni Pizza', 'Margherita Pizza', 'BBQ Chicken Pizza', 'Veggie Supreme', 'Vegan Pizza',
  'Meat Lovers', 'Hawaiian Pizza', 'Cheese Pizza', 'Thin Crust Pizza', 'Stuffed Crust Pizza',
  'Buffalo Chicken Pizza', 'Supreme Pizza', 'Gluten Free Pizza', 'Detroit Style Pizza',
  'Free Delivery', 'Pizza Deals', 'Pizza under $15', 'Family Combo', 'Lunch Special', 'Fastest Delivery',
];

const STORE_NAMES = MARKETPLACE_STORES.map(s => s.name);
const CORPUS = Array.from(new Set([...PIZZA_TERMS, ...STORE_NAMES]));

const ROTATING_PLACEHOLDERS = [
  'Cheapest Pepperoni Pizza', 'Large pizza under $20', 'Best pizza near me',
  'Vegan pizza open now', 'Pizza for 10 people', 'Fastest delivery',
];

const DEFAULT_RECS = ['Pepperoni Pizza', 'BBQ Chicken Pizza', 'Free Delivery'];

// ── Suggestion engine (substring + token match, ranked) ───────────────────────

function getSuggestions(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const scored = CORPUS.map(c => {
    const lc = c.toLowerCase();
    let score = -1;
    if (lc === q) score = 100;
    else if (lc.startsWith(q)) score = 60;
    else if (lc.split(/\s+/).some(w => w.startsWith(q))) score = 40;
    else if (lc.includes(q)) score = 20;
    return { c, score };
  }).filter(x => x.score >= 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, 6).map(x => x.c);
}

// ── Recommendations from previous searches ────────────────────────────────────

type FreqMap = Record<string, number>;

function loadFreq(): FreqMap {
  try { return JSON.parse(localStorage.getItem('miSliceSearchFreq') || '{}'); } catch { return {}; }
}

function recordSearch(term: string) {
  const freq = loadFreq();
  const key = term.toLowerCase().trim();
  if (!key) return;
  freq[key] = (freq[key] || 0) + 1;
  localStorage.setItem('miSliceSearchFreq', JSON.stringify(freq));
}

/** Top 3 recommendations weighted by the user's previous searches. */
function getRecommendations(): { items: string[]; personalized: boolean } {
  const freq = loadFreq();
  const entries = Object.entries(freq);
  if (entries.length === 0) return { items: DEFAULT_RECS, personalized: false };

  // Token weights from history.
  const tokens: Record<string, number> = {};
  for (const [term, count] of entries) {
    for (const w of term.split(/\s+/)) if (w.length > 2) tokens[w] = (tokens[w] || 0) + count;
  }

  const scored = CORPUS.map(c => {
    const lc = c.toLowerCase();
    let score = 0;
    for (const w of lc.split(/\s+/)) if (tokens[w]) score += tokens[w];
    if (freq[lc]) score += freq[lc] * 3; // strongly boost things they searched before
    return { c, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  const items = scored.map(x => x.c);
  // Top up to 3 with defaults the user hasn't already got.
  for (const d of DEFAULT_RECS) if (items.length < 3 && !items.includes(d)) items.push(d);
  return { items: items.slice(0, 3), personalized: true };
}

// ── AI parsing ────────────────────────────────────────────────────────────────

const AI_PATTERNS: { pattern: RegExp; extract: (m: RegExpMatchArray) => Partial<ParsedQuery> }[] = [
  { pattern: /(\d+)\s*people/i, extract: m => ({ partySize: parseInt(m[1]) }) },
  { pattern: /under\s*\$?(\d+)/i, extract: m => ({ budget: parseInt(m[1]) }) },
  { pattern: /\$(\d+)\s*budget/i, extract: m => ({ budget: parseInt(m[1]) }) },
  { pattern: /(\d+)\s*min/i, extract: m => ({ maxDeliveryTime: parseInt(m[1]) }) },
  { pattern: /vegan|vegetarian/i, extract: () => ({ dietary: ['vegan'] }) },
  { pattern: /thin\s*crust/i, extract: () => ({ crust: 'Thin Crust' }) },
  { pattern: /large/i, extract: () => ({ size: 'Large' }) },
  { pattern: /pepperoni/i, extract: () => ({ toppings: ['Pepperoni'] }) },
  { pattern: /fastest|quick|asap/i, extract: () => ({ sortBy: 'speed' as const }) },
  { pattern: /cheapest|cheap|deal/i, extract: () => ({ sortBy: 'price' as const }) },
  { pattern: /best|rated|top/i, extract: () => ({ sortBy: 'rating' as const }) },
];

function parseQuery(raw: string): ParsedQuery {
  const q: ParsedQuery = { rawQuery: raw };
  for (const { pattern, extract } of AI_PATTERNS) {
    const m = raw.match(pattern);
    if (m) Object.assign(q, extract(m));
  }
  return q;
}

function getAIInsight(q: ParsedQuery): string | null {
  if (q.partySize && q.budget) return `Finding ${q.partySize} pizzas under $${q.budget} ($${(q.budget / q.partySize).toFixed(0)}/person)`;
  if (q.partySize) return `Enough pizza for ${q.partySize} people`;
  if (q.budget) return `Stores with total under $${q.budget}`;
  if (q.maxDeliveryTime) return `Delivering in under ${q.maxDeliveryTime} mins`;
  if (q.dietary?.includes('vegan')) return `Vegan-friendly options`;
  if (q.sortBy === 'speed') return `Ranked by fastest delivery`;
  return null;
}

// Voice recognition availability (Web Speech API).
const SpeechRec: any = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

// ── Component ─────────────────────────────────────────────────────────────────

export function SmartSearchBar({ onSearch, onLocationChange, location = 'Michigan' }: SmartSearchBarProps) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('miSliceRecentSearches') || '[]'); } catch { return []; }
  });
  const [recs, setRecs] = useState(getRecommendations());
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  // Rotating placeholder
  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % ROTATING_PLACEHOLDERS.length), 3000);
    return () => clearInterval(id);
  }, []);

  // Live suggestions
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setAiInsight(null); return; }
    setSuggestions(getSuggestions(query));
    setAiInsight(getAIInsight(parseQuery(query)));
  }, [query]);

  // Close on outside click / Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setExpanded(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const doSearch = useCallback((q: string) => {
    const term = q.trim();
    if (!term) return;
    recordSearch(term);
    const updated = [term, ...recentSearches.filter(s => s.toLowerCase() !== term.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('miSliceRecentSearches', JSON.stringify(updated));
    setRecs(getRecommendations());
    setExpanded(false);
    inputRef.current?.blur();
    onSearch(term, parseQuery(term));
  }, [onSearch, recentSearches]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSearch(query); };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('miSliceRecentSearches');
  };

  // Voice search
  const toggleMic = () => {
    if (!SpeechRec) return;
    if (micActive) { recogRef.current?.stop(); setMicActive(false); return; }
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) { setQuery(transcript); doSearch(transcript); }
    };
    rec.onend = () => setMicActive(false);
    rec.onerror = () => setMicActive(false);
    recogRef.current = rec;
    setMicActive(true);
    setExpanded(true);
    try { rec.start(); } catch { setMicActive(false); }
  };

  const hasDropdown = expanded; // always show panel while focused/expanded

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto z-30">
      {/* Soft glow */}
      <motion.div
        animate={{ opacity: expanded ? 0.5 : 0.25 }}
        className="absolute inset-0 bg-gradient-to-r from-amber-200/40 via-orange-200/30 to-amber-100/30 rounded-3xl blur-2xl pointer-events-none"
      />

      <form onSubmit={handleSubmit}>
        <motion.div
          layout
          animate={{ borderRadius: hasDropdown ? '20px 20px 0 0' : '9999px' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="flex items-center bg-white relative z-10 border border-stone-100"
          style={{ boxShadow: expanded ? '0 14px 44px -8px rgba(176,182,204,0.7), inset 0 1px 0 rgba(255,255,255,0.9)' : '8px 8px 24px rgba(176,182,204,0.45), -8px -8px 22px rgba(255,255,255,0.95)' }}
          onClick={() => { setExpanded(true); inputRef.current?.focus(); }}
        >
          {/* Location pill — desktop only */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onLocationChange?.(location); }}
            className="hidden md:flex items-center gap-1.5 pl-4 pr-3 py-2 border-r border-stone-100 text-stone-600 hover:text-stone-900 transition-colors shrink-0 group"
          >
            <MapPin className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-sm font-bold whitespace-nowrap max-w-[120px] truncate">{location}</span>
          </button>

          {/* Input */}
          <div className="flex-1 flex items-center min-w-0 pl-3 sm:pl-4">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400 mr-2 sm:mr-3 shrink-0" />
            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setExpanded(true)}
                onKeyDown={e => { if (e.key === 'Escape') { setExpanded(false); inputRef.current?.blur(); } }}
                enterKeyHint="search"
                aria-label="Search for pizza"
                className="w-full bg-transparent text-stone-800 font-medium focus:outline-none py-3 sm:py-3.5 pr-7 text-sm sm:text-base"
                placeholder={micActive ? 'Listening…' : ''}
              />
              {!query && !micActive && (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-y-0 left-0 flex items-center text-stone-500 font-medium text-sm sm:text-base pointer-events-none select-none truncate max-w-full"
                  >
                    {ROTATING_PLACEHOLDERS[placeholderIdx]}
                  </motion.span>
                </AnimatePresence>
              )}
              {query && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setQuery(''); inputRef.current?.focus(); }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mic — only if supported */}
          {SpeechRec && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleMic(); }}
              aria-label="Voice search"
              className={`p-2 sm:p-2.5 mx-0.5 sm:mx-1 transition-colors rounded-full hover:bg-stone-100 shrink-0 ${micActive ? 'text-red-500' : 'text-stone-400 hover:text-stone-700'}`}
            >
              <motion.span animate={{ scale: micActive ? [1, 1.25, 1] : 1 }} transition={{ repeat: micActive ? Infinity : 0, duration: 0.8 }} className="block">
                <Mic className="w-5 h-5" />
              </motion.span>
            </button>
          )}

          {/* Search button — icon on mobile, label on desktop */}
          <button
            type="submit"
            onClick={(e) => e.stopPropagation()}
            aria-label="Search"
            className="clay-accent text-stone-900 font-black rounded-full mr-1 sm:mr-1.5 shrink-0 flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:py-3 sm:px-6 text-sm"
          >
            <Search className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </motion.div>
      </form>

      {/* Dropdown */}
      <AnimatePresence>
        {hasDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className="absolute left-0 right-0 bg-white border border-stone-100 border-t-0 rounded-b-2xl shadow-[0_24px_60px_-12px_rgba(176,182,204,0.7)] overflow-hidden z-20 max-h-[65vh] overflow-y-auto no-scrollbar"
          >
            {/* AI insight */}
            {aiInsight && (
              <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 bg-violet-50 border-b border-stone-100">
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <p className="text-violet-600 text-xs font-bold flex-1 min-w-0 truncate">{aiInsight}</p>
                <button type="button" onClick={() => doSearch(query)}
                  className="flex items-center gap-1 text-[10px] font-black text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full hover:bg-violet-200 transition-colors shrink-0">
                  Apply <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Typing: suggestions + always a "search anyway" row */}
            {query.length > 0 && (
              <div className="py-2">
                {suggestions.map(s => (
                  <button key={s} type="button" onClick={() => doSearch(s)}
                    className="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-stone-50 text-left transition-colors group">
                    <Search className="w-4 h-4 text-stone-300 group-hover:text-stone-500 shrink-0" />
                    <span className="text-sm text-stone-600 group-hover:text-stone-900 truncate">{s}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 ml-auto shrink-0" />
                  </button>
                ))}
                <button type="button" onClick={() => doSearch(query)}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-stone-50 text-left transition-colors group border-t border-stone-100">
                  <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Search className="w-2.5 h-2.5 text-amber-600" />
                  </div>
                  <span className="text-sm text-stone-600 group-hover:text-stone-900 truncate">Search for "<strong className="text-stone-900">{query}</strong>"</span>
                </button>
              </div>
            )}

            {/* Empty: recommendations + recent + trending */}
            {query.length === 0 && (
              <div className="py-2">
                {/* Recommendations from previous searches */}
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-4 sm:px-5 pt-2 pb-1 flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-amber-500" /> {recs.personalized ? 'Recommended for you' : 'Popular picks'}
                </p>
                {recs.items.map((r, i) => (
                  <button key={r} type="button" onClick={() => doSearch(r)}
                    className="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-stone-50 text-left transition-colors group">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-[11px] font-black text-amber-600 shrink-0">{i + 1}</span>
                    <span className="text-sm text-stone-700 group-hover:text-stone-900 font-bold truncate">{r}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 ml-auto shrink-0" />
                  </button>
                ))}

                {/* Recent */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-4 sm:px-5 pt-3 pb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Recent</p>
                      <button type="button" onClick={clearRecent} className="text-[10px] font-bold text-stone-400 hover:text-red-500 transition-colors">Clear</button>
                    </div>
                    {recentSearches.slice(0, 4).map((s, i) => (
                      <button key={i} type="button" onClick={() => doSearch(s)}
                        className="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-stone-50 text-left transition-colors group">
                        <Clock className="w-4 h-4 text-stone-300 group-hover:text-stone-500 shrink-0" />
                        <span className="text-sm text-stone-500 group-hover:text-stone-900 truncate">{s}</span>
                      </button>
                    ))}
                  </>
                )}

                {/* AI hint */}
                <div className="mx-3 sm:mx-4 mt-3 mb-1 p-3 bg-violet-50 rounded-xl flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                  <p className="text-[11px] sm:text-xs text-stone-500 leading-snug">
                    Try <span className="text-violet-600 font-bold">"pizza for 6 under $50"</span> or <span className="text-violet-600 font-bold">"fastest vegan pizza"</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
