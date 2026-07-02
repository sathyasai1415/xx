import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  MarketplaceStore, StoreFilters, DEFAULT_FILTERS,
  searchStores, applyFilters, MARKETPLACE_STORES, firestoreStoreToMarketplace,
} from '../data/marketplace';
import { PizzaConfig } from '../types';
import { watchApprovedStores } from '../lib/db';

// ── State shape ───────────────────────────────────────────────────────────────

export interface SavedLocation {
  id: string;
  label: string;
  address: string;
  emoji: string;
}

interface AppState {
  // Search
  searchQuery: string;
  searchResults: MarketplaceStore[];
  isSearching: boolean;

  // Filters
  filters: StoreFilters;

  // Location
  location: string;
  savedLocations: SavedLocation[];

  // Selected store (for detail sheet)
  selectedStoreId: string | null;

  // Pizza builder config (shared with map/compare)
  builderConfig: PizzaConfig | null;

  // Favorites
  favoriteStoreIds: Set<string>;

  // Toast
  toast: string;

  // Live Firestore stores (real registered stores)
  liveStores: MarketplaceStore[];
}

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_FILTER'; filter: Partial<StoreFilters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_LOCATION'; location: string }
  | { type: 'ADD_SAVED_LOCATION'; loc: SavedLocation }
  | { type: 'REMOVE_SAVED_LOCATION'; id: string }
  | { type: 'SELECT_STORE'; id: string | null }
  | { type: 'SET_BUILDER_CONFIG'; config: PizzaConfig | null }
  | { type: 'TOGGLE_FAVORITE_STORE'; id: string }
  | { type: 'SHOW_TOAST'; msg: string }
  | { type: 'CLEAR_TOAST' }
  | { type: 'SET_LIVE_STORES'; stores: MarketplaceStore[] };

// ── Reducer ───────────────────────────────────────────────────────────────────

// Merges real (Firestore) stores with mock stores. Real stores come first and
// override any mock store with the same ID. Mock stores act as demo data when
// no real stores are registered yet.
function mergeStores(live: MarketplaceStore[]): MarketplaceStore[] {
  const liveIds = new Set(live.map(s => s.id));
  const mocks = MARKETPLACE_STORES.filter(s => !liveIds.has(s.id));
  return [...live, ...mocks];
}

function computeResults(query: string, filters: StoreFilters, liveStores: MarketplaceStore[]): MarketplaceStore[] {
  const all = mergeStores(liveStores);
  const searched = searchStores(query, all);
  return applyFilters(searched, filters);
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LIVE_STORES': {
      const results = computeResults(state.searchQuery, state.filters, action.stores);
      return { ...state, liveStores: action.stores, searchResults: results };
    }
    case 'SET_SEARCH': {
      const results = computeResults(action.query, state.filters, state.liveStores);
      return { ...state, searchQuery: action.query, searchResults: results, isSearching: action.query.trim().length > 0 };
    }
    case 'SET_FILTER': {
      const filters = { ...state.filters, ...action.filter };
      const results = computeResults(state.searchQuery, filters, state.liveStores);
      return { ...state, filters, searchResults: results };
    }
    case 'RESET_FILTERS': {
      const results = computeResults(state.searchQuery, DEFAULT_FILTERS, state.liveStores);
      return { ...state, filters: DEFAULT_FILTERS, searchResults: results };
    }
    case 'SET_LOCATION':
      return { ...state, location: action.location };
    case 'ADD_SAVED_LOCATION': {
      const existing = state.savedLocations.filter(l => l.id !== action.loc.id);
      const locs = [action.loc, ...existing].slice(0, 6);
      localStorage.setItem('miSliceSavedLocs', JSON.stringify(locs));
      return { ...state, savedLocations: locs };
    }
    case 'REMOVE_SAVED_LOCATION': {
      const locs = state.savedLocations.filter(l => l.id !== action.id);
      localStorage.setItem('miSliceSavedLocs', JSON.stringify(locs));
      return { ...state, savedLocations: locs };
    }
    case 'SELECT_STORE':
      return { ...state, selectedStoreId: action.id };
    case 'SET_BUILDER_CONFIG': {
      const results = state.isSearching ? state.searchResults : computeResults('', state.filters, state.liveStores);
      return { ...state, builderConfig: action.config, searchResults: results };
    }
    case 'TOGGLE_FAVORITE_STORE': {
      const next = new Set(state.favoriteStoreIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      localStorage.setItem('miSliceFavStores', JSON.stringify([...next]));
      return { ...state, favoriteStoreIds: next };
    }
    case 'SHOW_TOAST':
      return { ...state, toast: action.msg };
    case 'CLEAR_TOAST':
      return { ...state, toast: '' };
    default:
      return state;
  }
}

// ── Initial state ─────────────────────────────────────────────────────────────

function buildInitialState(): AppState {
  const favIds: string[] = JSON.parse(localStorage.getItem('miSliceFavStores') || '[]');
  const savedLocs: SavedLocation[] = JSON.parse(localStorage.getItem('miSliceSavedLocs') || '[]');
  return {
    searchQuery: '',
    searchResults: applyFilters(MARKETPLACE_STORES, DEFAULT_FILTERS),
    isSearching: false,
    filters: DEFAULT_FILTERS,
    location: 'Detroit, MI',
    savedLocations: savedLocs.length > 0 ? savedLocs : [
      { id: 'home', label: 'Home', address: '42 Baker Street, Detroit MI 48201', emoji: '🏠' },
      { id: 'work', label: 'Work', address: '500 Woodward Ave, Detroit MI 48226', emoji: '💼' },
    ],
    selectedStoreId: null,
    builderConfig: null,
    favoriteStoreIds: new Set(favIds),
    toast: '',
    liveStores: [],
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Convenience helpers
  setSearch: (q: string) => void;
  setFilter: (f: Partial<StoreFilters>) => void;
  resetFilters: () => void;
  selectStore: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  showToast: (msg: string) => void;
  setLocation: (loc: string) => void;
}

const AppCtx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Live store sync from Firestore ──────────────────────────────────────────
  useEffect(() => {
    const unsub = watchApprovedStores(docs => {
      const converted = docs.map(firestoreStoreToMarketplace);
      dispatch({ type: 'SET_LIVE_STORES', stores: converted });
    });
    return unsub;
  }, []);

  const setSearch = useCallback((q: string) => dispatch({ type: 'SET_SEARCH', query: q }), []);
  const setFilter = useCallback((f: Partial<StoreFilters>) => dispatch({ type: 'SET_FILTER', filter: f }), []);
  const resetFilters = useCallback(() => dispatch({ type: 'RESET_FILTERS' }), []);
  const selectStore = useCallback((id: string | null) => dispatch({ type: 'SELECT_STORE', id }), []);
  const toggleFavorite = useCallback((id: string) => dispatch({ type: 'TOGGLE_FAVORITE_STORE', id }), []);
  const setLocation = useCallback((loc: string) => dispatch({ type: 'SET_LOCATION', location: loc }), []);
  const showToast = useCallback((msg: string) => {
    dispatch({ type: 'SHOW_TOAST', msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2800);
  }, []);

  const value = useMemo(() => ({ state, dispatch, setSearch, setFilter, resetFilters, selectStore, toggleFavorite, showToast, setLocation }), [state]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
