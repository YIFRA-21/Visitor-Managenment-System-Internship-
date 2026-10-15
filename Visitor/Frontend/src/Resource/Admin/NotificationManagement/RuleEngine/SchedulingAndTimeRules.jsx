import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Sun, Moon, Globe } from 'lucide-react';
import { workflowRulesApi } from '../../../../services/api';
export default function SchedulingAndTimeRules() {
    const [activeTab, setActiveTab] = useState('scheduling');
    const [schedules, setSchedules] = useState([]);
    useEffect(() => {
        workflowRulesApi.getSchedules().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setSchedules(res.data.data);
        }).catch(() => { });
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl text-white">
            <Clock className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span>
              <span>/</span>
              <span className="text-amber-400 font-bold">Scheduling & Time (§5.13, §5.18, §5.19)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Scheduling, Time & Calendar Rule Center</h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'scheduling', label: 'Scheduling Rules (§5.13)' },
            { id: 'time', label: 'Time & Shifts (§5.18)' },
            { id: 'calendar', label: 'Calendar & Holidays (§5.19)' }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              {t.label}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Scheduling Rules (§5.13) */}
      {activeTab === 'scheduling' && (<div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Active Dispatch Schedules</h3>
              <button className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold">
                + Create Schedule Rule
              </button>
            </div>

            <div className="divide-y divide-slate-800">
              {schedules.map(s => (<div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-850">
                  <div>
                    <h4 className="text-xs font-bold text-white">{s.name}</h4>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Type: <span className="text-amber-400 font-bold">{s.type}</span> • Window: {s.time_window} ({s.timezone})
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase">
                    {s.status}
                  </span>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* TAB 2: Time & Shifts (§5.18) */}
      {activeTab === 'time' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-amber-400">
              <Sun className="h-5 w-5"/>
              <span className="text-xs font-bold uppercase">Standard Business Hours</span>
            </div>
            <p className="text-[10px] text-slate-400">08:00 AM - 05:00 PM (Sun - Thu)</p>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold block w-max">Active</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Moon className="h-5 w-5"/>
              <span className="text-xs font-bold uppercase">Night Shift Overrides</span>
            </div>
            <p className="text-[10px] text-slate-400">10:00 PM - 06:00 AM (24/7 Security)</p>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold block w-max">Active</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Globe className="h-5 w-5"/>
              <span className="text-xs font-bold uppercase">Timezone Engine</span>
            </div>
            <p className="text-[10px] text-slate-400">Primary: Asia/Riyadh (UTC+3)</p>
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[9px] font-bold block w-max">Auto-Convert</span>
          </div>
        </div>)}

      {/* TAB 3: Calendar & Holidays (§5.19) */}
      {activeTab === 'calendar' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-2xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-amber-400"/>
            <span>Organization Calendar Integration</span>
          </h3>

          <div className="space-y-2">
            {[
                { name: 'Saudi National Day', date: 'Sep 23, 2026', type: 'Public Holiday', action: 'Skip Non-Essential' },
                { name: 'Founding Day', date: 'Feb 22, 2026', type: 'Public Holiday', action: 'Skip Non-Essential' },
                { name: 'Q3 IT Infrastructure Maintenance', date: 'Aug 15, 2026', type: 'Maintenance Window', action: 'Suppress System Alerts' }
            ].map((ev, i) => (<div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">{ev.name}</span>
                  <span className="text-[10px] text-slate-500 block">{ev.date} • {ev.type}</span>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold">
                  {ev.action}
                </span>
              </div>))}
          </div>
        </div>)}
    </div>);
}
