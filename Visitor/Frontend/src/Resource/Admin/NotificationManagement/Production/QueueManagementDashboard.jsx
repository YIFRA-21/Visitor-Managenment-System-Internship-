import React, { useState, useEffect } from 'react';
import { Layers, AlertTriangle, RotateCcw } from 'lucide-react';
import { productionMonitoringApi } from '../../../../services/api';
export default function QueueManagementDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [queueStats, setQueueStats] = useState({
        queueLength: 8, processingRateJobsPerSec: 14.5, completedJobs: 14200, failedJobs: 22,
        retryJobs: 186, deadLetterJobs: 4, avgProcessingTimeMs: 1.8,
        queues: { pending: 3, scheduled: 2, processing: 1, completed: 14200, retry: 2, failed: 22, deadLetter: 4 },
        workers: [
            { id: 'WRK-01', name: 'Notification Dispatcher Worker', status: 'healthy', jobsHandled: 8420, memoryUsageMb: 64 },
            { id: 'WRK-02', name: 'Retry & DLQ Worker', status: 'healthy', jobsHandled: 186, memoryUsageMb: 42 }
        ]
    });
    useEffect(() => {
        productionMonitoringApi.getQueueStats().then(res => {
            if (res.data?.data)
                setQueueStats(res.data.data);
        }).catch(() => { });
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500 via-teal-600 to-indigo-600 rounded-2xl shadow-xl text-white">
            <Layers className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Notification Platform</span><span>/</span>
              <span className="text-cyan-400 font-bold">Queue Platform (§8.9–§8.14)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Queue Management & DLQ Inspector</h1>
          </div>
        </div>

        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'dashboard', label: 'Queue Dashboard (§8.10)', badge: queueStats.queueLength },
            { id: 'workers', label: 'Queue Workers (§8.11)', badge: queueStats.workers?.length },
            { id: 'dlq', label: 'Dead Letter Queue (§8.13)', badge: queueStats.deadLetterJobs }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-cyan-700' : 'bg-slate-800 text-cyan-400'}`}>{t.badge}</span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Queue Dashboard (§8.10) */}
      {activeTab === 'dashboard' && (<div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
                { label: 'Pending Jobs', value: queueStats.queues?.pending, color: 'text-indigo-400 border-indigo-500/30' },
                { label: 'Processing Rate', value: `${queueStats.processingRateJobsPerSec} / sec`, color: 'text-teal-400 border-teal-500/30' },
                { label: 'Completed Jobs', value: queueStats.completedJobs?.toLocaleString(), color: 'text-emerald-400 border-emerald-500/30' },
                { label: 'Failed Jobs', value: queueStats.failedJobs, color: 'text-rose-400 border-rose-500/30' }
            ].map((m, i) => (<div key={i} className={`p-4 bg-slate-900 border ${m.color} rounded-2xl`}>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</span>
                <div className={`text-2xl font-black mt-1 ${m.color.split(' ')[0]}`}>{m.value}</div>
              </div>))}
          </div>

          {/* Queues Breakdown Grid */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Active Queue Channels</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {Object.entries(queueStats.queues || {}).map(([k, v]) => (<div key={k} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">{k}</span>
                  <span className="text-lg font-black text-cyan-400 font-mono">{v} Jobs</span>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* TAB 2: Workers (§8.11) */}
      {activeTab === 'workers' && (<div className="space-y-4 max-w-3xl">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Queue Worker Status</h3>
            <div className="space-y-2">
              {queueStats.workers?.map((w) => (<div key={w.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{w.name} ({w.id})</span>
                    <span className="text-[10px] text-slate-400">Jobs Handled: {w.jobsHandled} • Memory: {w.memoryUsageMb} MB</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase">{w.status}</span>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* TAB 3: Dead Letter Queue (§8.13) */}
      {activeTab === 'dlq' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-rose-400"/><span>Dead Letter Queue Inspector (4 Failed Jobs)</span>
            </h3>
            <button className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1">
              <RotateCcw className="h-3.5 w-3.5"/><span>Re-Queue All Failed</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {[
                { id: 'DLQ-01', event: 'SMS_GATEWAY_TIMEOUT', error: 'SMS Gateway unreachable after 3 exponential retries', count: 3 },
                { id: 'DLQ-02', event: 'EMAIL_SMTP_REJECT', error: 'Invalid SMTP recipient address: user_deleted@domain.invalid', count: 3 }
            ].map(job => (<div key={job.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-rose-400">{job.id} • {job.event}</span>
                  <span className="text-[10px] text-slate-500">Max Retries Exceeded ({job.count})</span>
                </div>
                <p className="text-[10px] text-slate-400">{job.error}</p>
              </div>))}
          </div>
        </div>)}
    </div>);
}
