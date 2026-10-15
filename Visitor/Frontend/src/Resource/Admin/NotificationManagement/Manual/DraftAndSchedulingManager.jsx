import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Copy, Trash2 } from 'lucide-react';
export default function DraftAndSchedulingManager() {
    const [activeTab, setActiveTab] = useState('drafts');
    const [drafts, setDrafts] = useState([]);
    const [schedules, setSchedules] = useState([]);
    // Recurring form
    const [recurrencePattern, setRecurrencePattern] = useState('weekly');
    const [cronExpression, setCronExpression] = useState('0 9 * * 1');
    const [timezone, setTimezone] = useState('UTC+3');
    const [skipHolidays, setSkipHolidays] = useState(true);
    useEffect(() => {
        // Mock load
        setDrafts([
            { id: 6001, draft_name: 'Q3 Security Policy Reminder', created_by: 'Security Officer', version: 2, last_modified: new Date().toISOString(), status: 'draft' },
            { id: 6002, draft_name: 'New Visitor Check-In Protocol', created_by: 'Reception Desk', version: 1, last_modified: new Date(Date.now() - 86400000).toISOString(), status: 'draft' }
        ]);
        setSchedules([
            { id: 7001, title: 'Weekly Access Audit Alert', schedule_type: 'weekly', next_run: new Date(Date.now() + 86400000).toLocaleDateString(), timezone: 'UTC+3', status: 'scheduled' },
            { id: 7002, title: 'Monthly Visitor Log Summary', schedule_type: 'monthly', next_run: new Date(Date.now() + 604800000).toLocaleDateString(), timezone: 'UTC+3', status: 'scheduled' }
        ]);
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl text-white">
            <Calendar className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Notification Center</span>
              <span>/</span>
              <span className="text-amber-400 font-bold">Drafts & Scheduling (Part 4.5)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Draft & Scheduling Engine</h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'drafts', label: 'Draft Manager', badge: drafts.length },
            { id: 'schedules', label: 'Scheduled Items', badge: schedules.length },
            { id: 'recurring', label: 'Recurring Engine' }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-amber-700' : 'bg-slate-800 text-amber-400'}`}>
                  {t.badge}
                </span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Drafts */}
      {activeTab === 'drafts' && (<div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Saved Drafts & Version Snapshots</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {drafts.map(d => (<div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-850">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{d.draft_name}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-indigo-400 border border-slate-700 rounded text-[9px] font-mono font-bold">
                        v{d.version}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">Created by {d.created_by} • Last modified: {new Date(d.last_modified).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
                      Resume Edit
                    </button>
                    <button className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
                      <Copy className="h-4 w-4"/>
                    </button>
                    <button className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg">
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* TAB 2: Schedules */}
      {activeTab === 'schedules' && (<div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Scheduled Dispatches</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {schedules.map(s => (<div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-850">
                  <div>
                    <h4 className="text-xs font-bold text-white">{s.title}</h4>
                    <div className="text-[10px] text-slate-500 mt-0.5">Next Run: {s.next_run} ({s.timezone}) • Pattern: {s.schedule_type}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-black uppercase">
                    {s.status}
                  </span>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* TAB 3: Recurring Engine */}
      {activeTab === 'recurring' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-2xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Clock className="h-4 w-4 text-amber-400"/>
            <span>Recurring Schedule Configurator</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Recurrence Pattern</label>
              <select value={recurrencePattern} onChange={e => setRecurrencePattern(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="cron">Custom Cron Expression</option>
              </select>
            </div>

            {recurrencePattern === 'cron' && (<div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cron Expression</label>
                <input type="text" value={cronExpression} onChange={e => setCronExpression(e.target.value)} placeholder="e.g. 0 9 * * 1" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"/>
              </div>)}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Timezone Alignment</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white">
                  <option value="UTC+3">Riyadh (UTC+3)</option>
                  <option value="UTC+0">UTC / GMT</option>
                  <option value="EST">Eastern Time (EST)</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={skipHolidays} onChange={e => setSkipHolidays(e.target.checked)} className="rounded bg-slate-950 border-slate-700 text-indigo-600"/>
                  <span>Skip Public Holidays</span>
                </label>
              </div>
            </div>

            <button className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md uppercase tracking-wider">
              Save Recurring Configuration
            </button>
          </div>
        </div>)}
    </div>);
}
