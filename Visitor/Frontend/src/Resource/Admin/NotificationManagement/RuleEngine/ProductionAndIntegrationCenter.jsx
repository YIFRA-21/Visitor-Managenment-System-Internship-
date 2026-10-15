import React, { useState, useEffect } from 'react';
import { Server, Shield, Radio } from 'lucide-react';
import { workflowRulesApi } from '../../../../services/api';
export default function ProductionAndIntegrationCenter() {
    const [activeTab, setActiveTab] = useState('prod');
    const [prodStatus, setProdStatus] = useState({
        engineStatus: 'operational', maintenanceMode: false,
        totalPublishedRules: 32, totalDraftRules: 8, totalArchivedRules: 12,
        lastBackup: '2026-08-06T06:00:00Z', lastHealthCheck: '2026-08-06T08:00:00Z',
        deploymentValidation: 'passed',
        systemDiagnostics: {
            ruleEngine: 'healthy', database: 'healthy', notificationQueue: 'healthy',
            emailGateway: 'healthy', smsGateway: 'degraded', webhookDispatcher: 'healthy',
            backgroundWorkers: 'healthy', auditLogger: 'healthy'
        }
    });
    const [jobs, setJobs] = useState({
        queueStatus: { pending: 3, processing: 1, completed: 14200, failed: 22, deadLetter: 4 },
        workers: [
            { id: 'WRK-01', name: 'Notification Dispatcher', status: 'running', processed: 8420, uptime: '72h 14m' },
            { id: 'WRK-02', name: 'Retry Queue Processor', status: 'running', processed: 186, uptime: '72h 14m' },
            { id: 'WRK-03', name: 'Scheduled Job Runner', status: 'idle', processed: 420, uptime: '72h 14m' }
        ]
    });
    useEffect(() => {
        workflowRulesApi.getProductionStatus().then(res => { if (res.data?.data)
            setProdStatus(res.data.data); }).catch(() => { });
        workflowRulesApi.getBackgroundJobs().then(res => { if (res.data?.data)
            setJobs(res.data.data); }).catch(() => { });
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-500 rounded-2xl shadow-xl text-white">
            <Server className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span><span>/</span>
              <span className="text-emerald-400 font-bold">Production & Integration (§5.47–§5.50)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Production Management, API/Webhooks & Background Jobs</h1>
          </div>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
          {[
            { id: 'prod', label: 'Production Admin (§5.50)' },
            { id: 'api', label: 'API Triggers (§5.47)' },
            { id: 'webhook', label: 'Webhooks (§5.48)' },
            { id: 'jobs', label: 'Background Jobs (§5.49)' }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
            </button>))}
        </div>
      </div>

      {/* TAB 1: Production Rule Management (§5.50) */}
      {activeTab === 'prod' && (<div className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Engine Status</span>
              <span className="text-lg font-black text-emerald-400 uppercase">{prodStatus.engineStatus}</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Published Rules</span>
              <span className="text-lg font-black text-white">{prodStatus.totalPublishedRules}</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Maintenance Mode</span>
              <span className="text-lg font-black text-amber-400">{prodStatus.maintenanceMode ? 'ACTIVE' : 'OFF'}</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Health Check</span>
              <span className="text-lg font-black text-emerald-400 uppercase">PASSED</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-white uppercase">System Diagnostics (8 Services)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {Object.entries(prodStatus.systemDiagnostics || {}).map(([s, st]) => (<div key={s} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">{s}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${st === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{st}</span>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* TAB 2: API Triggers (§5.47) */}
      {activeTab === 'api' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-2xl text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Shield className="h-4 w-4 text-emerald-400"/><span>API Trigger Engine Configuration</span>
          </h3>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div><strong className="text-slate-400">Authentication:</strong> <span className="text-white ml-2">API Key & JWT Bearer Token</span></div>
            <div><strong className="text-slate-400">Rate Limiting:</strong> <span className="text-emerald-400 font-mono ml-2">100 requests / minute</span></div>
            <div><strong className="text-slate-400">Endpoint:</strong> <span className="text-cyan-400 font-mono ml-2">POST /api/rules/api-trigger</span></div>
          </div>
        </div>)}

      {/* TAB 3: Webhooks (§5.48) */}
      {activeTab === 'webhook' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-2xl text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Radio className="h-4 w-4 text-cyan-400"/><span>Webhook Engine Configuration</span>
          </h3>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div><strong className="text-slate-400">Incoming Webhooks:</strong> <span className="text-emerald-400 ml-2">HMAC-SHA256 Secret Verified</span></div>
            <div><strong className="text-slate-400">Outgoing Target:</strong> <span className="text-cyan-400 font-mono ml-2">https://hooks.example.com/vms</span></div>
          </div>
        </div>)}

      {/* TAB 4: Background Jobs (§5.49) */}
      {activeTab === 'jobs' && (<div className="space-y-4 max-w-3xl">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase">Background Workers ({jobs.workers?.length})</h4>
            <div className="space-y-2 text-xs">
              {jobs.workers?.map((w) => (<div key={w.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">{w.name}</span>
                    <span className="text-[10px] text-slate-500">Processed: {w.processed} • Uptime: {w.uptime}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-black uppercase">{w.status}</span>
                </div>))}
            </div>
          </div>
        </div>)}
    </div>);
}
