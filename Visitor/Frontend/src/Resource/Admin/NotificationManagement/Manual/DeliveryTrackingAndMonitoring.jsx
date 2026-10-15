import React, { useState } from 'react';
import { Activity, RotateCcw, Download } from 'lucide-react';
import { manualNotificationApi } from '../../../../services/api';
export default function DeliveryTrackingAndMonitoring() {
    const [loading, setLoading] = useState(false);
    const [trackingData, setTrackingData] = useState({
        notificationId: 5001,
        referenceNumber: 'MNT-0001',
        subject: 'Annual Security Clearance Audit',
        summary: {
            queued: 450,
            processing: 0,
            sent: 450,
            delivered: 442,
            read: 390,
            acknowledged: 350,
            failed: 8,
            retrying: 2,
            cancelled: 0,
            expired: 0
        },
        timeline: [
            { stage: 'Created', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Composed by System Admin' },
            { stage: 'Queued', timestamp: new Date(Date.now() - 3590000).toISOString(), details: 'Enqueued into Email & In-App queues' },
            { stage: 'Processing', timestamp: new Date(Date.now() - 3580000).toISOString(), details: 'Worker picked up 450 tasks' },
            { stage: 'Delivered', timestamp: new Date(Date.now() - 3500000).toISOString(), details: '442 delivered successfully' },
            { stage: 'Read', timestamp: new Date(Date.now() - 1800000).toISOString(), details: '390 recipients opened notification' }
        ],
        recipients: [
            { id: 1, name: 'Sarah Johnson', role: 'employee', channel: 'email', status: 'read', read_at: new Date(Date.now() - 1800000).toISOString(), retries: 0 },
            { id: 2, name: 'Michael Chen', role: 'manager', channel: 'in_app', status: 'read', read_at: new Date(Date.now() - 2400000).toISOString(), retries: 0 },
            { id: 3, name: 'James Wilson', role: 'security', channel: 'sms', status: 'failed', read_at: null, retries: 3 }
        ]
    });
    const handleRetryFailed = async () => {
        setLoading(true);
        try {
            await manualNotificationApi.dispatch({ action: 'retry' });
        }
        catch (e) {
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-xl text-white">
            <Activity className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Notification Center</span>
              <span>/</span>
              <span className="text-cyan-400 font-bold">Delivery Tracking & Monitoring (Part 4.7)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Delivery Tracking & Queue Monitoring</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={handleRetryFailed} disabled={loading} className="flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md">
            <RotateCcw className="h-4 w-4"/>
            <span>Retry Failed Deliveries</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold">
            <Download className="h-4 w-4"/>
            <span>Export Delivery Report</span>
          </button>
        </div>
      </div>

      {/* 10 Status KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
            { label: 'Queued', value: trackingData.summary.queued, color: 'text-indigo-400 border-indigo-500/30' },
            { label: 'Processing', value: trackingData.summary.processing, color: 'text-blue-400 border-blue-500/30' },
            { label: 'Sent', value: trackingData.summary.sent, color: 'text-cyan-400 border-cyan-500/30' },
            { label: 'Delivered', value: trackingData.summary.delivered, color: 'text-emerald-400 border-emerald-500/30' },
            { label: 'Read', value: trackingData.summary.read, color: 'text-teal-400 border-teal-500/30' },
            { label: 'Acknowledged', value: trackingData.summary.acknowledged, color: 'text-purple-400 border-purple-500/30' },
            { label: 'Failed', value: trackingData.summary.failed, color: 'text-rose-400 border-rose-500/30' },
            { label: 'Retrying', value: trackingData.summary.retrying, color: 'text-amber-400 border-amber-500/30' },
            { label: 'Cancelled', value: trackingData.summary.cancelled, color: 'text-slate-400 border-slate-500/30' },
            { label: 'Expired', value: trackingData.summary.expired, color: 'text-slate-400 border-slate-500/30' }
        ].map((m, idx) => (<div key={idx} className={`p-3.5 bg-slate-900 border ${m.color} rounded-2xl`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</span>
            <div className={`text-xl font-black mt-1 ${m.color.split(' ')[0]}`}>{m.value}</div>
          </div>))}
      </div>

      {/* Delivery Stage Timeline Visualizer */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">8-Stage Delivery Timeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {trackingData.timeline.map((t, idx) => (<div key={idx} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"/>
                <span className="text-xs font-bold text-white">{t.stage}</span>
              </div>
              <p className="text-[10px] text-slate-400">{t.details}</p>
              <span className="text-[9px] text-slate-500 font-mono block pt-1">{new Date(t.timestamp).toLocaleTimeString()}</span>
            </div>))}
        </div>
      </div>

      {/* Recipient Tracking Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Recipient Delivery & Read Tracking Grid</h3>
        </div>

        <table className="w-full text-left text-xs font-medium">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
            <tr>
              <th className="p-3">Recipient Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Channel</th>
              <th className="p-3">Delivery Status</th>
              <th className="p-3">Read Time</th>
              <th className="p-3">Retry Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {trackingData.recipients.map((r) => (<tr key={r.id} className="hover:bg-slate-850">
                <td className="p-3 font-bold text-white">{r.name}</td>
                <td className="p-3 uppercase text-[10px] font-bold text-slate-400">{r.role}</td>
                <td className="p-3 uppercase text-[10px] font-mono">{r.channel}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.status === 'read' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-3 font-mono text-[10px] text-slate-400">{r.read_at ? new Date(r.read_at).toLocaleString() : 'Unread'}</td>
                <td className="p-3 font-mono text-xs">{r.retries}</td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
