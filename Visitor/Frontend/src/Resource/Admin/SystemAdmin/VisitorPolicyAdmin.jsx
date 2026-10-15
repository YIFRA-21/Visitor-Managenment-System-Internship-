import React, { useState } from 'react';
import { UserCheck, Shield, CheckCircle2, Save } from 'lucide-react';
export default function VisitorPolicyAdmin() {
    const [toast, setToast] = useState('');
    const [policy, setPolicy] = useState({
        require_id_scan: true,
        require_photo_capture: true,
        require_host_approval: true,
        max_stay_hours: 8,
        allow_walkins: true,
        enforce_ndas: true
    });
    const handleSave = () => {
        setToast('Visitor Policies updated successfully!');
        setTimeout(() => setToast(''), 3000);
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UserCheck className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Visitor & Check-In Policies</h1>
            <p className="text-xs text-slate-400">Configure registration workflows, pass issuance rules, and facility entry criteria</p>
          </div>
        </div>
      </div>

      {toast && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400"/> {toast}
        </div>)}

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Shield className="h-4 w-4 text-emerald-400"/> Entry Screening & Verification Mandatory Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 p-3.5 rounded-xl cursor-pointer">
            <input type="checkbox" checked={policy.require_id_scan} onChange={e => setPolicy(p => ({ ...p, require_id_scan: e.target.checked }))} className="rounded bg-slate-800 border-slate-700 text-emerald-500"/>
            Require Government ID Photo Scan at Check-In
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 p-3.5 rounded-xl cursor-pointer">
            <input type="checkbox" checked={policy.require_photo_capture} onChange={e => setPolicy(p => ({ ...p, require_photo_capture: e.target.checked }))} className="rounded bg-slate-800 border-slate-700 text-emerald-500"/>
            Require Live Webcam Badge Photo Capture
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 p-3.5 rounded-xl cursor-pointer">
            <input type="checkbox" checked={policy.require_host_approval} onChange={e => setPolicy(p => ({ ...p, require_host_approval: e.target.checked }))} className="rounded bg-slate-800 border-slate-700 text-emerald-500"/>
            Require Host Employee Approval Before Badge Print
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 p-3.5 rounded-xl cursor-pointer">
            <input type="checkbox" checked={policy.enforce_ndas} onChange={e => setPolicy(p => ({ ...p, enforce_ndas: e.target.checked }))} className="rounded bg-slate-800 border-slate-700 text-emerald-500"/>
            Enforce Digital NDA / Visitor Agreement Signature
          </label>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1">Max Authorized Single Visit Duration (Hours)</label>
          <input type="number" value={policy.max_stay_hours} onChange={e => setPolicy(p => ({ ...p, max_stay_hours: Number(e.target.value) }))} className="w-full md:w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"/>
        </div>

        <div className="flex justify-end pt-4">
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2">
            <Save className="h-4 w-4"/> Save Visitor Policies
          </button>
        </div>
      </div>
    </div>);
}
