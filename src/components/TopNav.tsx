import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { LogOut, Settings, UserCircle, Sun, Moon, ChevronDown } from 'lucide-react';
import { auth } from '../lib/firebase';

interface TopNavProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  isLight: boolean;
  setIsLight: (val: boolean) => void;
}

export function TopNav({ currentUser, onOpenAuth, onOpenSettings, isLight, setIsLight }: TopNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
      {/* Theme Toggle */}
      <button 
        onClick={() => setIsLight(!isLight)}
        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
      >
        {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {/* User Area */}
      {currentUser ? (
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 pl-3 pr-4 py-2 rounded-full hover:bg-black/80 transition-colors"
          >
            <UserCircle className="w-6 h-6 text-red-500" />
            <span className="text-sm font-bold text-stone-200 hidden sm:block truncate max-w-[120px]">
              {currentUser.email?.split('@')[0]}
            </span>
            <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-white/10">
                 <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Account</p>
                 <p className="text-sm font-bold text-stone-200 truncate">{currentUser.email}</p>
              </div>
              <div className="p-2 space-y-1">
                 <button 
                   onClick={() => { setDropdownOpen(false); onOpenSettings(); }}
                   className="w-full text-left px-3 py-2 text-sm font-bold text-stone-300 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-3 transition-colors"
                 >
                   <Settings className="w-4 h-4" /> Preferences
                 </button>
                 <button 
                   onClick={() => { setDropdownOpen(false); auth.signOut(); }}
                   className="w-full text-left px-3 py-2 text-sm font-bold text-stone-300 hover:text-red-500 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors"
                 >
                   <LogOut className="w-4 h-4" /> Sign Out
                 </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button 
          onClick={onOpenAuth}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all flex items-center gap-2"
        >
          <UserCircle className="w-5 h-5" /> Sign In
        </button>
      )}
    </div>
  );
}
