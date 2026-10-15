import React, { useState, useEffect } from 'react';
import { Siren } from 'lucide-react';
import { workflowRulesApi } from '../../../../services/api';
export default function CheckinCheckoutEmergencySystemRules() {
    const [activeTab, setActiveTab] = useState('checkin');
    const [checkinRules, setCheckinRules] = useState([]);
    const [checkoutRules, setCheckoutRules] = useState([]);
    const [emergencyRules, setEmergencyRules] = useState([]);
    const [systemRules, setSystemRules] = useState([]);
    useEffect(() => {
        workflowRulesApi.getCheckinRules().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setCheckinRules(res.data.data);
        }).catch(() => { });
        workflowRulesApi.getCheckoutRules().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setCheckoutRules(res.data.data);
        }).catch(() => { });
        workflowRulesApi.getEmergencyRules().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setEmergencyRules(res.data.data);
        }).catch(() => { });
        workflowRulesApi.getSystemRules().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setSystemRules(res.data.data);
        }).catch(() => { });
    }, []);
    const tabConfig = {
        checkin: { rules: checkinRules, label: 'Check-In Notification Rules (6 Events)', color: 'bg-emerald-600' },
        checkout: { rules: checkoutRules, label: 'Check-Out Notification Rules (5 Events)', color: 'bg-cyan-600' },
        emergency: { rules: emergencyRules, label: 'Emergency Notification Rules (8 Events – Highest Priority)', color: 'bg-rose-600' },
        system: { rules: systemRules, label: 'System Infrastructure Rules (10 Events)', color: 'bg-slate-600' }
    };
    const current = tabConfig[activeTab];
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 via-cyan-600 to-rose-500 rounded-2xl shadow-xl text-white">
            <Siren className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span>
              <span>/</span>
              <span className="text-emerald-400 font-bold">Module Rules (§5.31–§5.34)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Check-In, Check-Out, Emergency & System Rules</h1>
          </div>
        </div>

        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
          {[
            { id: 'checkin', label: 'Check-In (§5.31)', badge: checkinRules.length },
            { id: 'checkout', label: 'Check-Out (§5.32)', badge: checkoutRules.length },
            { id: 'emergency', label: 'Emergency (§5.33)', badge: emergencyRules.length },
            { id: 'system', label: 'System (§5.34)', badge: systemRules.length }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? `${tabConfig[t.id].color} text-white shadow-lg` : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400'}`}>{t.badge}</span>
            </button>))}
        </div>
      </div>

      {/* Rule Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{current.label}</h3>
          <button className={`px-3 py-1.5 ${current.color} hover:opacity-90 text-white rounded-xl text-xs font-bold`}>+ Create Module Rule</button>
        </div>

        <table className="w-full text-left text-xs font-medium">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
            <tr>
              <th className="p-3">Rule ID</th>
              <th className="p-3">Event Name</th>
              <th className="p-3">Rule Name</th>
              <th className="p-3">Recipients</th>
              <th className="p-3">Channels</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {current.rules.map(r => (<tr key={r.id} className="hover:bg-slate-850">
                <td className="p-3 font-mono font-bold text-indigo-400">{r.id}</td>
                <td className="p-3 font-mono text-[10px] text-purple-400 font-bold">{r.event}</td>
                <td className="p-3 font-bold text-white">{r.name}</td>
                <td className="p-3 text-slate-400">{r.recipients.join(', ')}</td>
                <td className="p-3">
                  <div className="flex space-x-1">
                    {r.channels.map((c) => (<span key={c} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-mono font-bold uppercase">{c}</span>))}
                  </div>
                </td>
                <td className="p-3 uppercase font-bold text-[10px] text-amber-400">{r.priority}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase">{r.status}</span></td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
