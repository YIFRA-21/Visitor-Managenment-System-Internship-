import React, { useState } from 'react';
import { Database, Archive, CheckCircle2 } from 'lucide-react';
export default function DataRetentionArchiving() {
    const [retentionDays, setRetentionDays] = useState('365');
    const [autoPurgeLogs, setAutoPurgeLogs] = useState(true);
    const [toast, setToast] = useState('');
    const handleSave = () => {
        setToast('Data retention policies saved.');
        setTimeout(() => setToast(''), 3000);
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Archive className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Data Retention & Compliance Archiving</h1>
            <p className="text-xs text-slate-400">Automated GDPR retention limits, log purging, and historical database compression</p>
          </div>
        </div>
      </div>

      {toast && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400"/> {toast}
        </div>)}

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="h-4 w-4 text-amber-400"/> Visitor History Retention Policy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Visitor Record Retention (Days)</label>
            <input type="number" value={retentionDays} onChange={e => setRetentionDays(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"/>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer w-full">
              <input type="checkbox" checked={autoPurgeLogs} onChange={e => setAutoPurgeLogs(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-amber-500"/>
              Enable Auto-Purging of Expired Identity Attachments
            </label>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20">
            Save Retention Schedule
          </button>
        </div>
      </div>
    </div>);
}
