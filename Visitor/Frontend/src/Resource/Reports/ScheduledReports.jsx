import React, { useState } from 'react';
import { Calendar, Mail, Plus, Trash2 } from 'lucide-react';
export default function ScheduledReports() {
    const [schedules, setSchedules] = useState([
        { id: '1', name: 'Daily Visitor Executive Summary', frequency: 'DAILY', recipients: 'executive-team@company.com', format: 'PDF', active: true },
        { id: '2', name: 'Weekly Security Audit Log', frequency: 'WEEKLY', recipients: 'security-head@company.com', format: 'CSV', active: true },
        { id: '3', name: 'Monthly Department SLA Report', frequency: 'MONTHLY', recipients: 'dept-managers@company.com', format: 'PDF', active: true },
    ]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', frequency: 'WEEKLY', recipients: '', format: 'PDF' });
    const addSchedule = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.recipients.trim())
            return;
        setSchedules(prev => [
            ...prev,
            { id: Date.now().toString(), name: form.name, frequency: form.frequency, recipients: form.recipients, format: form.format, active: true }
        ]);
        setShowModal(false);
        setForm({ name: '', frequency: 'WEEKLY', recipients: '', format: 'PDF' });
    };
    const removeSchedule = (id) => {
        setSchedules(prev => prev.filter(s => s.id !== id));
    };
    const toggleActive = (id) => {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    };
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-500"/> Automated Scheduled Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure automated daily, weekly, or monthly report emails for managers and executives
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition">
          <Plus className="h-4 w-4"/> Create Automated Schedule
        </button>
      </div>

      {/* List of Schedules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {schedules.map(item => (<div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                {item.frequency} ({item.format})
              </span>
              <button type="button" onClick={() => toggleActive(item.id)} className={`text-xs font-bold ${item.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                {item.active ? 'Active ✓' : 'Paused ⏸'}
              </button>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{item.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                <Mail className="h-3.5 w-3.5"/> {item.recipients}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => removeSchedule(item.id)} className="text-slate-400 hover:text-red-500 text-xs flex items-center gap-1">
                <Trash2 className="h-3.5 w-3.5"/> Delete
              </button>
            </div>
          </div>))}
      </div>

      {/* Modal */}
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500"/> New Scheduled Report
            </h2>
            <form onSubmit={addSchedule} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Report Title</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Daily Reception Throughput" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-sm"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-sm">
                    <option value="DAILY">Daily @ 8:00 AM</option>
                    <option value="WEEKLY">Weekly (Mondays)</option>
                    <option value="MONTHLY">Monthly (1st)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Format</label>
                  <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-sm">
                    <option value="PDF">PDF Report</option>
                    <option value="CSV">CSV Data File</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Recipient Email(s)</label>
                <input type="text" value={form.recipients} onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))} required placeholder="emails comma-separated..." className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-sm"/>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
