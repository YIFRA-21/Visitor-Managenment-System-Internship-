import React, { useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
export default function FeatureFlags() {
    const [flags, setFlags] = useState([
        { id: 1, key: 'vip_escort_workflow', name: 'VIP Escort Workflow', enabled: true, category: 'visitor', description: 'Enforces mandatory host escort for VIP visitors' },
        { id: 2, key: 'biometric_verification', name: 'Biometric Verification', enabled: true, category: 'security', description: 'Facial recognition matching at check-in kiosks' },
        { id: 3, key: 'contractor_document_check', name: 'Contractor Safety Doc Check', enabled: true, category: 'compliance', description: 'Requires safety induction docs before contractor check-in' },
        { id: 4, key: 'sms_instant_notifications', name: 'SMS Instant Alerts', enabled: true, category: 'notification', description: 'Sends real-time SMS to host employees upon arrival' },
        { id: 5, key: 'auto_archiving', name: 'Automatic Data Archiving', enabled: false, category: 'system', description: 'Archives visitor records older than 365 days' }
    ]);
    const toggleFlag = (key) => {
        setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <ToggleRight className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Feature Flags & Toggles</h1>
            <p className="text-xs text-slate-400">Enable or disable module capabilities and experimental system features dynamically</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flags.map(flag => (<div key={flag.id} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">{flag.name}</h3>
                <span className="text-[10px] font-mono text-teal-400">{flag.key}</span>
              </div>
              <button onClick={() => toggleFlag(flag.key)} className={`p-1.5 rounded-xl transition ${flag.enabled ? 'text-emerald-400' : 'text-slate-600'}`}>
                {flag.enabled ? <ToggleRight className="h-8 w-8 text-emerald-400"/> : <ToggleLeft className="h-8 w-8 text-slate-600"/>}
              </button>
            </div>
            <p className="text-xs text-slate-400">{flag.description}</p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
              Category: <strong className="text-slate-300 capitalize">{flag.category}</strong>
            </div>
          </div>))}
      </div>
    </div>);
}
