import React, { useState } from 'react';
import { Activity, Server, RefreshCw, Radio } from 'lucide-react';
export default function NotificationCommandCenterView() {
    const [metrics, setMetrics] = useState({
        total: 128450,
        active: 1420,
        scheduled: 85,
        pending: 42,
        processing: 18,
        delivered: 124800,
        read: 108400,
        acknowledged: 95200,
        failed: 120,
        retryQueue: 14,
        deadLetterQueue: 6,
        queueHealth: 'healthy',
        engineHealth: 'healthy',
        smtpStatus: 'healthy',
        socketStatus: 'healthy',
        smsStatus: 'degraded',
        apiStatus: 'healthy',
        systemHealthScore: 98.4
    });
    const [liveFeed, setLiveFeed] = useState([
        { id: 'ev_1', time: '10:14:02', event: 'DELIVERED', recipient: 'Security Desk', channel: 'In-App & SMS', status: 'success' },
        { id: 'ev_2', time: '10:13:45', event: 'SCHEDULED', recipient: 'All Employees', channel: 'Email', status: 'pending' },
        { id: 'ev_3', time: '10:12:10', event: 'FAILED_RETRY', recipient: 'Branch Manager', channel: 'SMS Gateway Timeout', status: 'error' },
        { id: 'ev_4', time: '10:10:00', event: 'ACKNOWLEDGED', recipient: 'VIP Escort Officer', channel: 'Mobile Push', status: 'success' }
    ]);
    return (<div className="space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-1">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse"/>
            <span>Real-Time Command Center</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Live Sync Active</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">System Health & Notification Telemetry</h2>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Health Score</span>
            <span className="text-lg font-black text-emerald-400">{metrics.systemHealthScore}%</span>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all">
            <RefreshCw className="h-4 w-4"/>
            <span>Force Telemetry Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
            { label: 'Total Notifications', val: metrics.total.toLocaleString(), color: 'text-slate-100', border: 'border-slate-800' },
            { label: 'Delivered', val: metrics.delivered.toLocaleString(), color: 'text-emerald-400', border: 'border-emerald-500/30' },
            { label: 'Read & Opened', val: metrics.read.toLocaleString(), color: 'text-indigo-400', border: 'border-indigo-500/30' },
            { label: 'Acknowledged', val: metrics.acknowledged.toLocaleString(), color: 'text-cyan-400', border: 'border-cyan-500/30' },
            { label: 'Scheduled', val: metrics.scheduled.toString(), color: 'text-purple-400', border: 'border-purple-500/30' },
            { label: 'Retry Queue', val: metrics.retryQueue.toString(), color: 'text-amber-400', border: 'border-amber-500/30' },
            { label: 'Processing', val: metrics.processing.toString(), color: 'text-blue-400', border: 'border-blue-500/30' },
            { label: 'Dead Letter Queue', val: metrics.deadLetterQueue.toString(), color: 'text-rose-400', border: 'border-rose-500/30' },
            { label: 'Failed Deliveries', val: metrics.failed.toString(), color: 'text-rose-500', border: 'border-rose-600/30' },
            { label: 'Active Sessions', val: '18 Live', color: 'text-teal-400', border: 'border-teal-500/30' },
            { label: 'Queue Engine', val: metrics.queueHealth.toUpperCase(), color: 'text-emerald-400', border: 'border-emerald-500/30' },
            { label: 'SMS Gateway', val: metrics.smsStatus.toUpperCase(), color: 'text-amber-400', border: 'border-amber-500/30' }
        ].map((c, i) => (<div key={i} className={`p-3.5 bg-slate-900/90 border ${c.border} rounded-2xl`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{c.label}</span>
            <div className={`text-xl font-black ${c.color}`}>{c.val}</div>
          </div>))}
      </div>

      {/* Gateway Status & Live Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gateway Health Monitors */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Server className="h-4 w-4 text-blue-400"/>
            <span>Infrastructure & Gateway Status</span>
          </h3>

          <div className="space-y-3 text-xs">
            {[
            { name: 'Notification Rule Engine', status: metrics.engineHealth, latency: '2 ms' },
            { name: 'RabbitMQ / Queue Engine', status: metrics.queueHealth, latency: '1 ms' },
            { name: 'Socket.IO Real-time Server', status: metrics.socketStatus, latency: '3 ms' },
            { name: 'Enterprise SMTP Gateway', status: metrics.smtpStatus, latency: '42 ms' },
            { name: 'Twilio / Bulk SMS Gateway', status: metrics.smsStatus, latency: '180 ms (Degraded)' },
            { name: 'REST API & Webhook Service', status: metrics.apiStatus, latency: '8 ms' }
        ].map((g, i) => (<div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <div>
                  <div className="font-bold text-white text-xs">{g.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Latency: {g.latency}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${g.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {g.status}
                </span>
              </div>))}
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
              <Activity className="h-4 w-4 text-emerald-400"/>
              <span>Live Notification Activity Stream</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Auto-refreshing 1s</span>
          </div>

          <div className="space-y-2">
            {liveFeed.map(ev => (<div key={ev.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-3">
                  <span className="text-slate-500 text-[11px]">{ev.time}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${ev.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : ev.status === 'pending' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {ev.event}
                  </span>
                  <span className="text-white font-bold">{ev.recipient}</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans">{ev.channel}</span>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
