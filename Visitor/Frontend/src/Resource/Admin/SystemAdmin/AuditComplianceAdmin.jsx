import React, { useState } from 'react';
import { FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
export default function AuditComplianceAdmin() {
    const [toast, setToast] = useState('');
    const handleExportAudit = (format) => {
        setToast(`Exporting compliance audit logs as ${format}...`);
        setTimeout(() => setToast(''), 3000);
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileText className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Audit & Compliance Policy Center</h1>
            <p className="text-xs text-slate-400">Governance auditing policies, tamper-evident log exports, and compliance reporting</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExportAudit('CSV')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5">
            <Download className="h-4 w-4"/> Export CSV Audit
          </button>
          <button onClick={() => handleExportAudit('PDF')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20">
            <Download className="h-4 w-4"/> Export PDF Report
          </button>
        </div>
      </div>

      {toast && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400"/> {toast}
        </div>)}

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldCheck className="h-4 w-4 text-indigo-400"/> Mandatory Event Logging Rules
        </h3>
        <div className="space-y-3 text-xs text-slate-300">
          <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded bg-slate-800 text-indigo-500"/> Log all Administrative Configuration & Security Policy Changes
          </label>
          <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded bg-slate-800 text-indigo-500"/> Log Authentication Attempts & Failed Password Accesses
          </label>
          <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded bg-slate-800 text-indigo-500"/> Log Visitor Pass Generation & Entry/Exit Timestamp Sweeps
          </label>
        </div>
      </div>
    </div>);
}
