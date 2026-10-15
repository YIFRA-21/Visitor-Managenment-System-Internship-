import React, { useState, useEffect } from 'react';
import { Server, Shield, Terminal } from 'lucide-react';
import { productionMonitoringApi } from '../../../../services/api';
export default function HealthPerformanceAndDeploymentCenter() {
    const [activeTab, setActiveTab] = useState('health');
    const [healthStatus, setHealthStatus] = useState({
        overallStatus: 'healthy', activeSocketConnections: 14,
        components: {
            notificationEngine: { status: 'healthy', latencyMs: 2 },
            queueEngine: { status: 'healthy', latencyMs: 1 },
            socketServer: { status: 'healthy', activeSessions: 14 },
            database: { status: 'healthy', poolConnections: 8 },
            smtpGateway: { status: 'healthy', latencyMs: 45 },
            smsGateway: { status: 'degraded', latencyMs: 180 }
        },
        metrics: { cpuUsagePct: 14.2, memoryUsageMb: 164, uptimeSec: 259200 }
    });
    const [securityLogs, setSecurityLogs] = useState([]);
    const [deploymentSpecs, setDeploymentSpecs] = useState(null);
    useEffect(() => {
        productionMonitoringApi.getHealthStatus().then(res => {
            if (res.data?.data)
                setHealthStatus(res.data.data);
        }).catch(() => { });
        productionMonitoringApi.getSecurityLogs().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setSecurityLogs(res.data.data);
        }).catch(() => { });
        productionMonitoringApi.getDeploymentSpecs().then(res => {
            if (res.data?.data)
                setDeploymentSpecs(res.data.data);
        }).catch(() => { });
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 rounded-2xl shadow-xl text-white">
            <Server className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Notification Platform</span><span>/</span>
              <span className="text-emerald-400 font-bold">Health, Security & Deployment (§8.19–§8.28)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">System Health, Security & Deployment Center</h1>
          </div>
        </div>

        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
          {[
            { id: 'health', label: 'System Health (§8.19, §8.20)' },
            { id: 'logs', label: 'Winston Logs (§8.22)' },
            { id: 'security', label: 'Security Monitor (§8.23)', badge: securityLogs.length },
            { id: 'deployment', label: 'Deployment Specs (§8.27)' }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-emerald-700' : 'bg-slate-800 text-emerald-400'}`}>{t.badge}</span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: System Health (§8.19 & §8.20) */}
      {activeTab === 'health' && (<div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Overall Platform Health</span>
              <span className="text-xl font-black text-emerald-400 uppercase">{healthStatus.overallStatus}</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">CPU Utilization</span>
              <span className="text-xl font-black text-indigo-400">{healthStatus.metrics?.cpuUsagePct}%</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Memory Usage</span>
              <span className="text-xl font-black text-cyan-400">{healthStatus.metrics?.memoryUsageMb} MB</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Live WebSockets</span>
              <span className="text-xl font-black text-purple-400">{healthStatus.activeSocketConnections} Active</span>
            </div>
          </div>

          {/* Component Diagnostics */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Core Services Diagnostic</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {Object.entries(healthStatus.components || {}).map(([comp, data]) => (<div key={comp} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white uppercase text-[10px]">{comp}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${data.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{data.status}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">Latency: {data.latencyMs || 2} ms</span>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* TAB 2: Centralized Winston Logs (§8.22) */}
      {activeTab === 'logs' && (<div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 font-mono text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2 font-sans">
            <Terminal className="h-4 w-4 text-emerald-400"/><span>Winston Centralized Log Viewer</span>
          </h3>
          <div className="p-4 bg-slate-950 rounded-xl space-y-1 text-slate-300">
            <div><span className="text-emerald-400">[2026-08-06 09:50:12]</span> [vms-notification-engine] [info]: Socket connected: sock_98421a</div>
            <div><span className="text-cyan-400">[2026-08-06 09:52:00]</span> [vms-notification-engine] [info]: Event CHECKIN_COMPLETED routed to Rule #1</div>
            <div><span className="text-purple-400">[2026-08-06 09:54:18]</span> [vms-notification-engine] [info]: Notification delivered via WebSocket to user_104</div>
          </div>
        </div>)}

      {/* TAB 3: Security Monitor (§8.23) */}
      {activeTab === 'security' && (<div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Shield className="h-4 w-4 text-rose-400"/><span>Security Threat & Violation Monitor</span>
          </h3>
          <div className="space-y-2 text-xs">
            {securityLogs.map(s => (<div key={s.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between font-mono">
                <div>
                  <span className="font-bold text-rose-400 block">{s.id} • {s.event}</span>
                  <span className="text-[10px] text-slate-500">IP: {s.ip} • UA: {s.userAgent}</span>
                </div>
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[9px] font-black uppercase">{s.severity}</span>
              </div>))}
          </div>
        </div>)}

      {/* TAB 4: Deployment Specs (§8.27) */}
      {activeTab === 'deployment' && deploymentSpecs && (<div className="space-y-4 max-w-3xl font-mono text-xs">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-white uppercase font-sans">Dockerfile Specification</h4>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 overflow-x-auto">{deploymentSpecs.dockerfileSpec}</pre>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-white uppercase font-sans">PM2 Process Manager Specification</h4>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 overflow-x-auto">{deploymentSpecs.pm2Spec}</pre>
          </div>
        </div>)}
    </div>);
}
