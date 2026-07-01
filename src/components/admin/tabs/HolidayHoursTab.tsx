import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';

interface HolidayEntry {
  id: string;
  name: string;
  date: string;
  closed: boolean;
  openTime: string;
  closeTime: string;
}

const DEFAULT_HOLIDAYS: HolidayEntry[] = [
  { id: '1', name: "New Year's Day",   date: '2027-01-01', closed: true,  openTime: '11:00', closeTime: '22:00' },
  { id: '2', name: 'Memorial Day',     date: '2026-05-25', closed: false, openTime: '12:00', closeTime: '21:00' },
  { id: '3', name: 'Independence Day', date: '2026-07-04', closed: false, openTime: '12:00', closeTime: '23:00' },
  { id: '4', name: 'Labor Day',        date: '2026-09-07', closed: false, openTime: '12:00', closeTime: '21:00' },
  { id: '5', name: 'Thanksgiving',     date: '2026-11-26', closed: true,  openTime: '11:00', closeTime: '22:00' },
  { id: '6', name: 'Christmas Day',    date: '2026-12-25', closed: true,  openTime: '11:00', closeTime: '22:00' },
];

const REGULAR_HOURS = [
  { day: 'Monday',    open: '11:00', close: '22:00', closed: false },
  { day: 'Tuesday',   open: '11:00', close: '22:00', closed: false },
  { day: 'Wednesday', open: '11:00', close: '22:00', closed: false },
  { day: 'Thursday',  open: '11:00', close: '22:00', closed: false },
  { day: 'Friday',    open: '11:00', close: '23:00', closed: false },
  { day: 'Saturday',  open: '11:00', close: '23:00', closed: false },
  { day: 'Sunday',    open: '12:00', close: '22:00', closed: false },
];

export function HolidayHoursTab() {
  const [holidays, setHolidays] = useState<HolidayEntry[]>(DEFAULT_HOLIDAYS);
  const [regularHours, setRegularHours] = useState(REGULAR_HOURS);
  const [showAdd, setShowAdd] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', closed: true, openTime: '12:00', closeTime: '22:00' });
  const [saved, setSaved] = useState(false);

  const addHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) return;
    setHolidays(h => [...h, { ...newHoliday, id: Date.now().toString() }]);
    setNewHoliday({ name: '', date: '', closed: true, openTime: '12:00', closeTime: '22:00' });
    setShowAdd(false);
  };

  const update = (id: string, key: keyof HolidayEntry, val: any) =>
    setHolidays(h => h.map(e => e.id === id ? { ...e, [key]: val } : e));

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Hours & Holidays</h2>
        <button onClick={save}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Regular hours */}
      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
          <Clock className="w-4 h-4 text-stone-500" />
          <p className="text-xs font-black uppercase tracking-widest text-stone-500">Regular Hours</p>
        </div>
        <div className="divide-y divide-white/5">
          {regularHours.map((h, i) => (
            <div key={h.day} className="flex items-center gap-4 px-5 py-3">
              <span className="text-sm font-bold text-white w-28">{h.day}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={!h.closed} onChange={e => setRegularHours(r => r.map((x, j) => j === i ? { ...x, closed: !e.target.checked } : x))} className="sr-only peer" />
                <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-red-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
              </label>
              {!h.closed ? (
                <div className="flex items-center gap-2 ml-auto">
                  <input type="time" value={h.open} onChange={e => setRegularHours(r => r.map((x, j) => j === i ? { ...x, open: e.target.value } : x))}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500" />
                  <span className="text-stone-600 text-xs">–</span>
                  <input type="time" value={h.close} onChange={e => setRegularHours(r => r.map((x, j) => j === i ? { ...x, close: e.target.value } : x))}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500" />
                </div>
              ) : (
                <span className="ml-auto text-xs font-bold text-red-400">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Holiday overrides */}
      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-500" />
            <p className="text-xs font-black uppercase tracking-widest text-stone-500">Holiday Hours</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 text-xs font-black text-red-400 hover:text-red-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Holiday
          </button>
        </div>

        {showAdd && (
          <div className="px-5 py-4 border-b border-white/8 bg-white/3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Holiday name" value={newHoliday.name} onChange={e => setNewHoliday(n => ({ ...n, name: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-red-500" />
              <input type="date" value={newHoliday.date} onChange={e => setNewHoliday(n => ({ ...n, date: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-stone-400 cursor-pointer">
                <input type="checkbox" checked={newHoliday.closed} onChange={e => setNewHoliday(n => ({ ...n, closed: e.target.checked }))} className="rounded" />
                Closed all day
              </label>
              {!newHoliday.closed && (
                <div className="flex items-center gap-2">
                  <input type="time" value={newHoliday.openTime} onChange={e => setNewHoliday(n => ({ ...n, openTime: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" />
                  <span className="text-stone-600">–</span>
                  <input type="time" value={newHoliday.closeTime} onChange={e => setNewHoliday(n => ({ ...n, closeTime: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" />
                </div>
              )}
              <button onClick={addHoliday} className="ml-auto px-4 py-1.5 bg-red-600 text-white text-xs font-black rounded-lg hover:bg-red-700 transition-colors">
                Add
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {holidays.map(h => (
            <div key={h.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{h.name}</p>
                <p className="text-[10px] text-stone-500">{new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={h.closed} onChange={e => update(h.id, 'closed', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-red-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
                <span className="ml-2 text-xs font-bold text-stone-400">Closed</span>
              </label>
              {!h.closed && (
                <div className="flex items-center gap-1">
                  <input type="time" value={h.openTime} onChange={e => update(h.id, 'openTime', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none w-24" />
                  <span className="text-stone-600 text-xs">–</span>
                  <input type="time" value={h.closeTime} onChange={e => update(h.id, 'closeTime', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none w-24" />
                </div>
              )}
              <button onClick={() => setHolidays(hs => hs.filter(x => x.id !== h.id))}
                className="text-stone-700 hover:text-red-400 transition-colors p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
