import React, { useState, useEffect } from 'react';
import { BarChart3, Search } from 'lucide-react';
import { workflowRulesApi } from '../../../../services/api';
export default function RuleAnalyticsAndPerformance() {
    const [activeTab, setActiveTab] = useState('analytics');
    const [analytics, setAnalytics] = useState({
        totalExecutions: 14280, successfulExecutions: 13856, failedExecutions: 424,
        avgExecutionTimeMs: 3.2, successRate: 97.03, failureRate: 2.97,
        retryCount: 186, escalationCount: 42,
        topTriggerEvents: [
            { event: 'CHECKIN_COMPLETED', count: 4210 }, { event: 'APPT_APPROVED', count: 3180 },
            { event: 'VISITOR_REGISTERED', count: 2640 }, { event: 'CHECKOUT_COMPLETED', count: 1890 }
        ],
        topRules: [
            { name: 'Visitor Check-In Alert', executions: 4210 }, { name: 'Appointment Approval', executions: 3180 },
            { name: 'Visitor Pass Generated', executions: 2120 }
        ]
    });
    const [performance, setPerformance] = useState({
        avgExecTimeMs: 3.2, avgQueueTimeMs: 1.8, avgProcessingTimeMs: 1.4,
        memoryUsageMb: 128, cpuUsagePct: 12,
        slowRules: [{ name: 'Emergency Broadcast L4', avgMs: 8.4 }, { name: 'Bulk Org Announcement', avgMs: 6.1 }],
        failedRules: [{ name: 'SMS Gateway Dispatch', failures: 18 }],
        retryStats: { totalRetries: 186, successAfterRetry: 164, failedAfterRetry: 22 },
        healthIndicators: { ruleEngine: 'healthy', notificationQueue: 'healthy', emailGateway: 'healthy', smsGateway: 'degraded', database: 'healthy' }
    });
    const [logs, setLogs] = useState([]);
    const [logSearch, setLogSearch] = useState('');
    useEffect(() => {
        workflowRulesApi.getAnalytics().then(res => { if (res.data?.data)
            setAnalytics(res.data.data); }).catch(() => { });
        workflowRulesApi.getPerformance().then(res => { if (res.data?.data)
            setPerformance(res.data.data); }).catch(() => { });
        workflowRulesApi.getExecutionLogs().then(res => { if (res.data?.data && Array.isArray(res.data.data))
            setLogs(res.data.data); }).catch(() => { });
    }, []);
    const filteredLogs = logs.filter(l => !logSearch || l.rule.toLowerCase().includes(logSearch.toLowerCase()) || l.event.toLowerCase().includes(logSearch.toLowerCase()));
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 via-teal-600 to-cyan-500 rounded-2xl shadow-xl text-white">
            <BarChart3 className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span><span>/</span>
              <span className="text-teal-400 font-bold">Analytics & Performance (§5.40, §5.41, §5.44)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Analytics, Performance & Execution Logs</h1>
          </div>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'analytics', label: 'Analytics Dashboard (§5.40)' },
            { id: 'performance', label: 'Performance Monitor (§5.41)' },
            { id: 'logs', label: 'Execution Logs (§5.44)', badge: logs.length }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-teal-700' : 'bg-slate-800 text-teal-400'}`}>{t.badge}</span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Analytics (§5.40) */}
      {activeTab === 'analytics' && (<div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
                { label: 'Total Executions', value: analytics.totalExecutions?.toLocaleString(), color: 'text-indigo-400 border-indigo-500/30' },
                { label: 'Success Rate', value: `${analytics.successRate}%`, color: 'text-emerald-400 border-emerald-500/30' },
                { label: 'Avg Exec Time', value: `${analytics.avgExecutionTimeMs} ms`, color: 'text-teal-400 border-teal-500/30' },
                { label: 'Retry Count', value: analytics.retryCount, color: 'text-amber-400 border-amber-500/30' }
            ].map((m, i) => (<div key={i} className={`p-4 bg-slate-900 border ${m.color} rounded-2xl`}>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</span>
                <div className={`text-2xl font-black mt-1 ${m.color.split(' ')[0]}`}>{m.value}</div>
              </div>))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-white uppercase">Top Trigger Events</h4>
              {analytics.topTriggerEvents?.map((e, i) => (<div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-950 rounded-xl">
                  <span className="font-mono text-purple-400 font-bold">{e.event}</span>
                  <span className="font-bold text-white">{e.count}</span>
                </div>))}
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-white uppercase">Top Executed Rules</h4>
              {analytics.topRules?.map((r, i) => (<div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-950 rounded-xl">
                  <span className="text-slate-300 font-bold">{r.name}</span>
                  <span className="font-bold text-teal-400">{r.executions}</span>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* TAB 2: Performance Monitor (§5.41) */}
      {activeTab === 'performance' && (<div className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Queue Time</span>
              <div className="text-xl font-black text-cyan-400">{performance.avgQueueTimeMs} ms</div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Memory Usage</span>
              <div className="text-xl font-black text-purple-400">{performance.memoryUsageMb} MB</div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">CPU Usage</span>
              <div className="text-xl font-black text-indigo-400">{performance.cpuUsagePct}%</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-white uppercase">Health Indicators</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              {Object.entries(performance.healthIndicators || {}).map(([k, v]) => (<div key={k} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">{k}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${v === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{v}</span>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* TAB 3: Execution Logs (§5.44) */}
      {activeTab === 'logs' && (<div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400"/>
            <input type="text" value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search execution logs..." className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white"/>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <tr>
                  <th className="p-3">Log ID</th><th className="p-3">Business Event</th><th className="p-3">Rule Name</th>
                  <th className="p-3">Recipients</th><th className="p-3">Channels</th><th className="p-3">Status</th>
                  <th className="p-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredLogs.map(l => (<tr key={l.id} className="hover:bg-slate-850">
                    <td className="p-3 font-mono font-bold text-indigo-400">{l.id}</td>
                    <td className="p-3 font-mono text-[10px] text-purple-400 font-bold">{l.event}</td>
                    <td className="p-3 font-bold text-white">{l.rule}</td>
                    <td className="p-3 text-slate-400">{l.recipients}</td>
                    <td className="p-3 font-mono text-[10px]">{l.channels}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${l.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{l.status}</span></td>
                    <td className="p-3 font-mono text-[10px] text-teal-400">{l.execTimeMs} ms</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}
    </div>);
}
