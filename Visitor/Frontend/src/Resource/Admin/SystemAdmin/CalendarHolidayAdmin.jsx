import React, { useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
export default function CalendarHolidayAdmin() {
    const [holidays, setHolidays] = useState([
        { id: 1, name: 'Ethiopian New Year (Enkutatash)', date: '2026-09-11', type: 'NATIONAL' },
        { id: 2, name: 'Finding of True Cross (Meskel)', date: '2026-09-27', type: 'NATIONAL' }
    ]);
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const addHoliday = (e) => {
        e.preventDefault();
        if (!name || !date)
            return;
        setHolidays(prev => [...prev, { id: Date.now(), name, date, type: 'NATIONAL' }]);
        setName('');
        setDate('');
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Calendar className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Calendar & Holiday Administration</h1>
            <p className="text-xs text-slate-400">Define official public holidays, operating workdays, and facility blackout dates</p>
          </div>
        </div>
      </div>

      <form onSubmit={addHoliday} className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Plus className="h-4 w-4 text-pink-400"/> Add Official Public Holiday
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Holiday Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Independence Day" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-600/20">
              Add Holiday
            </button>
          </div>
        </div>
      </form>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
            <tr>
              <th className="p-4">Holiday Name</th>
              <th className="p-4">Date</th>
              <th className="p-4">Type</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {holidays.map(h => (<tr key={h.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-bold text-white">{h.name}</td>
                <td className="p-4 font-mono text-pink-300">{h.date}</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{h.type}</span></td>
                <td className="p-4 text-right">
                  <button onClick={() => setHolidays(prev => prev.filter(item => item.id !== h.id))} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="h-4 w-4"/>
                  </button>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
