import React, { useState } from 'react';
import { ShieldCheck, DollarSign, Sliders, Database, Moon, Cpu } from 'lucide-react';
export default function PreferencesAndGovernanceView() {
    const [activeTab, setActiveTab] = useState('quiet');
    return (<div className="space-y-6">
      {/* Sub Tab Bar */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit flex-wrap gap-1">
        {[
            { id: 'quiet', label: 'Quiet Hours & Bypass (§9)', icon: Moon },
            { id: 'preferences', label: 'User Prefs & Subscriptions (§7, §8)', icon: Sliders },
            { id: 'quota', label: 'Quota & Limits (§19)', icon: Database },
            { id: 'cost', label: 'Cost Monitoring (§20)', icon: DollarSign },
            { id: 'governance', label: 'Compliance & Legal Hold (§14, §21)', icon: ShieldCheck },
            { id: 'ai', label: 'AI Optimization Ext (§25)', icon: Cpu }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <t.icon className="h-3.5 w-3.5"/>
            <span>{t.label}</span>
          </button>))}
      </div>

      {/* TAB 1: QUIET HOURS (§9) */}
      {activeTab === 'quiet' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Moon className="h-4 w-4 text-purple-400"/>
            <span>Organization Quiet Hours & Emergency Bypass Policies</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-white block">Working Hours</span>
              <span className="text-purple-400 font-mono text-lg block">08:00 – 17:00</span>
              <span className="text-[10px] text-slate-500">Standard business notification delivery window</span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-white block">Quiet Hours (Night Window)</span>
              <span className="text-amber-400 font-mono text-lg block">20:00 – 06:00</span>
              <span className="text-[10px] text-slate-500">Non-urgent notifications queued until morning</span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-white block">Critical Notification Bypass</span>
              <span className="text-emerald-400 font-black text-lg block">ENABLED</span>
              <span className="text-[10px] text-slate-500">Emergency & VIP alerts bypass quiet hours instantly</span>
            </div>
          </div>
        </div>)}

      {/* TAB 2: COST MONITORING (§20) */}
      {activeTab === 'cost' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-emerald-400"/>
            <span>Channel Cost & Consumption Dashboard</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 font-sans uppercase block">Current Month Expenditure</span>
              <span className="text-2xl font-black text-emerald-400">$142.50</span>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 font-sans uppercase block">SMTP Email Cost</span>
              <span className="text-xl font-bold text-indigo-400">$25.10</span>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 font-sans uppercase block">Bulk SMS Gateway Cost</span>
              <span className="text-xl font-bold text-amber-400">$117.40</span>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 font-sans uppercase block">Monthly Budget Cap</span>
              <span className="text-xl font-bold text-slate-300">$500.00</span>
            </div>
          </div>
        </div>)}

      {/* TAB 3: AI EXTENSIONS (§25) */}
      {activeTab === 'ai' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-purple-400"/>
            <span>AI Recommendation & Predictive Delivery Extensions (Architecture Ready)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="font-bold text-purple-400 block mb-1">1. Optimal Delivery Time Prediction</span>
              <p className="text-[11px] text-slate-400">Extension point for ML model predicting when each recipient is most likely to open notifications.</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="font-bold text-purple-400 block mb-1">2. Duplicate Rule & Anomaly Detection</span>
              <p className="text-[11px] text-slate-400">Extension point to flag redundant or conflicting notification rules across branches.</p>
            </div>
          </div>
        </div>)}
    </div>);
}
