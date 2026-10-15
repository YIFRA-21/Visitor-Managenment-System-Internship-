import React, { useState, useEffect } from 'react';
import { TrendingUp, RotateCcw, ArrowRight } from 'lucide-react';
import { workflowRulesApi } from '../../../../services/api';
export default function EscalationReminderAndRetry() {
    const [activeTab, setActiveTab] = useState('escalation');
    const [escalations, setEscalations] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [retries, setRetries] = useState({
        maxRetries: 3,
        retryIntervalSec: 60,
        backoffPolicy: 'exponential',
        backoffMultiplier: 2,
        deadLetterQueueEnabled: true,
        failedQueueCount: 1,
        retryHistoryCount: 420
    });
    useEffect(() => {
        workflowRulesApi.getEscalations().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setEscalations(res.data.data);
        }).catch(() => { });
        workflowRulesApi.getReminders().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setReminders(res.data.data);
        }).catch(() => { });
        workflowRulesApi.getRetries().then(res => {
            if (res.data?.data)
                setRetries(res.data.data);
        }).catch(() => { });
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-rose-500 to-orange-600 rounded-2xl shadow-xl text-white">
            <TrendingUp className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span>
              <span>/</span>
              <span className="text-rose-400 font-bold">Escalation & Retry (§5.14, §5.15, §5.16)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Escalation, Reminder & Retry Engine</h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'escalation', label: 'Escalation Rules (§5.14)', badge: escalations.length },
            { id: 'reminders', label: 'Reminder Rules (§5.15)', badge: reminders.length },
            { id: 'retry', label: 'Retry Engine (§5.16)' }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-rose-700' : 'bg-slate-800 text-rose-400'}`}>
                  {t.badge}
                </span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Escalation Rules (§5.14) */}
      {activeTab === 'escalation' && (<div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">4-Level Escalation Workflows</h3>
            </div>

            <div className="divide-y divide-slate-800">
              {escalations.map(esc => (<div key={esc.id} className="p-4 space-y-3 hover:bg-slate-850">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{esc.rule_name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">Trigger: {esc.trigger_condition}</span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-2 text-xs">
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex-1 text-center">
                      <span className="text-[9px] text-slate-500 block uppercase">Level 1</span>
                      <span className="font-bold text-indigo-400">{esc.l1_target}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 hidden md:block"/>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex-1 text-center">
                      <span className="text-[9px] text-slate-500 block uppercase">Level 2</span>
                      <span className="font-bold text-purple-400">{esc.l2_target}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 hidden md:block"/>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex-1 text-center">
                      <span className="text-[9px] text-slate-500 block uppercase">Level 3</span>
                      <span className="font-bold text-amber-400">{esc.l3_target}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 hidden md:block"/>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex-1 text-center">
                      <span className="text-[9px] text-slate-500 block uppercase">Level 4 Final</span>
                      <span className="font-bold text-rose-400">{esc.l4_target}</span>
                    </div>
                  </div>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* TAB 2: Reminder Rules (§5.15) */}
      {activeTab === 'reminders' && (<div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Automated Reminders</h3>
          </div>

          <div className="divide-y divide-slate-800">
            {reminders.map(rem => (<div key={rem.id} className="p-4 flex items-center justify-between hover:bg-slate-850">
                <div>
                  <h4 className="text-xs font-bold text-white">{rem.name}</h4>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Frequency: <span className="text-indigo-400 font-bold">{rem.frequency}</span> • Event: {rem.event_type}
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  {rem.channels.map((c) => (<span key={c} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-mono font-bold uppercase">
                      {c}
                    </span>))}
                </div>
              </div>))}
          </div>
        </div>)}

      {/* TAB 3: Retry Engine (§5.16) */}
      {activeTab === 'retry' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-2xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <RotateCcw className="h-4 w-4 text-rose-400"/>
            <span>Retry Rules & Exponential Backoff Configurator</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Max Retries</span>
              <div className="text-xl font-black text-rose-400">{retries.maxRetries} Attempts</div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Backoff Strategy</span>
              <div className="text-xl font-black text-indigo-400 uppercase font-mono">{retries.backoffPolicy}</div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Dead Letter Queue</span>
              <div className="text-xl font-black text-emerald-400">{retries.deadLetterQueueEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Failed Queue Tasks</span>
              <div className="text-xl font-black text-amber-400">{retries.failedQueueCount} Tasks</div>
            </div>
          </div>
        </div>)}
    </div>);
}
