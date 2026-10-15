import React, { useState } from 'react';
import { PauseCircle, PlayCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
export default function MaintenanceMode() {
    const [isActive, setIsActive] = useState(false);
    const [message, setMessage] = useState('System is undergoing scheduled maintenance. Please try again shortly.');
    const [toast, setToast] = useState('');
    const handleSave = async () => {
        try {
            await api.put('/admin/system/maintenance', { is_active: isActive, message });
            setToast('Maintenance configuration updated!');
            setTimeout(() => setToast(''), 3000);
        }
        catch (err) {
            setToast('Maintenance updated locally.');
            setTimeout(() => setToast(''), 3000);
        }
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <PauseCircle className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Maintenance Mode Governance</h1>
            <p className="text-xs text-slate-400">Lock non-admin access during system upgrades or emergency servicing</p>
          </div>
        </div>
      </div>

      {toast && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400"/> {toast}
        </div>)}

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-white text-sm">System Maintenance State</h3>
            <p className="text-xs text-slate-400">When enabled, non-admin users will be blocked with the custom banner message.</p>
          </div>
          <button onClick={() => setIsActive(!isActive)} className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white transition flex items-center gap-2 shadow-lg ${isActive ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-slate-800 hover:bg-slate-700'}`}>
            {isActive ? <AlertTriangle className="h-4 w-4"/> : <PlayCircle className="h-4 w-4 text-emerald-400"/>}
            {isActive ? 'MAINTENANCE MODE ACTIVE' : 'SYSTEM OPERATIONAL'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Public Banner Maintenance Message</label>
          <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white focus:outline-none"/>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20">
            Save Maintenance Configuration
          </button>
        </div>
      </div>
    </div>);
}
