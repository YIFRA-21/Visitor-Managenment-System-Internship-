import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useResponseNavigation, RESPONSE_TYPES } from '../../../../modules/response';
export default function ManualNotificationAnalyticsAndReports() {
    const { toResponse } = useResponseNavigation();
    const [loading, setLoading] = useState(false);
    // KPIs
    const [kpis, setKpis] = useState({
        totalManual: 1480,
        sentToday: 42,
        sentThisWeek: 280,
        sentThisMonth: 1120,
        totalRecipients: 5920,
        totalBroadcasts: 24,
        totalAnnouncements: 38,
        totalDrafts: 12,
        totalScheduled: 8,
        totalFailed: 5,
        readRate: '94.2%',
        deliverySuccessRate: '99.1%'
    });
    // Chart distributions
    const [charts, setCharts] = useState({
        byModule: [
            { module: 'SECURITY', count: 420 },
            { module: 'RECEPTION', count: 340 },
            { module: 'APPOINTMENTS', count: 310 },
            { module: 'APPROVALS', count: 210 },
            { module: 'SYSTEM', count: 200 }
        ],
        byRole: [
            { role: 'employee', count: 720 },
            { role: 'manager', count: 310 },
            { role: 'visitor', count: 250 },
            { role: 'security', count: 120 },
            { role: 'receptionist', count: 80 }
        ],
        byChannel: [
            { channel: 'in_app', count: 1480 },
            { channel: 'email', count: 820 },
            { channel: 'sms', count: 140 },
            { channel: 'browser', count: 90 }
        ],
        byPriority: [
            { priority: 'medium', count: 780 },
            { priority: 'high', count: 450 },
            { priority: 'low', count: 210 },
            { priority: 'urgent', count: 40 }
        ]
    });
    // Selected Report Type
    const [selectedReport, setSelectedReport] = useState('Manual Notification Report');
    const [exportFormat, setExportFormat] = useState('excel');
    const handleExport = (format) => {
        toResponse({
            type: RESPONSE_TYPES.FILE_RESULT,
            title: 'Report Generated Successfully',
            message: `"${selectedReport}" has been compiled and downloaded in ${format.toUpperCase()} format.`,
            targetEntity: `${selectedReport} (${format.toUpperCase()})`,
            returnUrl: window.location.pathname + window.location.search
        });
    };
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl shadow-xl text-white">
            <BarChart3 className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Notification Center</span>
              <span>/</span>
              <span className="text-indigo-400 font-bold">Analytics & Reports (Part 4.8)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Manual Notification Analytics & Reporting</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={() => handleExport('excel')} className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md">
            <FileSpreadsheet className="h-4 w-4"/>
            <span>Export Excel</span>
          </button>
          <button onClick={() => handleExport('pdf')} className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md">
            <Download className="h-4 w-4"/>
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 12 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
            { label: 'Total Manual', value: kpis.totalManual, color: 'text-indigo-400 border-indigo-500/30' },
            { label: 'Sent Today', value: kpis.sentToday, color: 'text-emerald-400 border-emerald-500/30' },
            { label: 'Sent This Week', value: kpis.sentThisWeek, color: 'text-cyan-400 border-cyan-500/30' },
            { label: 'Sent This Month', value: kpis.sentThisMonth, color: 'text-blue-400 border-blue-500/30' },
            { label: 'Total Recipients', value: kpis.totalRecipients, color: 'text-purple-400 border-purple-500/30' },
            { label: 'Total Broadcasts', value: kpis.totalBroadcasts, color: 'text-rose-400 border-rose-500/30' },
            { label: 'Announcements', value: kpis.totalAnnouncements, color: 'text-pink-400 border-pink-500/30' },
            { label: 'Saved Drafts', value: kpis.totalDrafts, color: 'text-slate-400 border-slate-500/30' },
            { label: 'Scheduled Items', value: kpis.totalScheduled, color: 'text-amber-400 border-amber-500/30' },
            { label: 'Failed Deliveries', value: kpis.totalFailed, color: 'text-red-400 border-red-500/30' },
            { label: 'Read Rate', value: kpis.readRate, color: 'text-teal-400 border-teal-500/30' },
            { label: 'Success Rate', value: kpis.deliverySuccessRate, color: 'text-emerald-400 border-emerald-500/30' }
        ].map((m, idx) => (<div key={idx} className={`p-3.5 bg-slate-900 border ${m.color} rounded-2xl`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</span>
            <div className={`text-xl font-black mt-1 ${m.color.split(' ')[0]}`}>{m.value}</div>
          </div>))}
      </div>

      {/* Multi-Dimensional Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-white uppercase">Notifications by Module</span>
          <div className="space-y-1.5 pt-1">
            {charts.byModule.map((m, i) => (<div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-mono">{m.module}</span>
                <span className="font-bold text-indigo-400">{m.count}</span>
              </div>))}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-white uppercase">Notifications by Role</span>
          <div className="space-y-1.5 pt-1">
            {charts.byRole.map((r, i) => (<div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 capitalize">{r.role}</span>
                <span className="font-bold text-emerald-400">{r.count}</span>
              </div>))}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-white uppercase">Notifications by Channel</span>
          <div className="space-y-1.5 pt-1">
            {charts.byChannel.map((c, i) => (<div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 uppercase font-mono">{c.channel}</span>
                <span className="font-bold text-cyan-400">{c.count}</span>
              </div>))}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-white uppercase">Notifications by Priority</span>
          <div className="space-y-1.5 pt-1">
            {charts.byPriority.map((p, i) => (<div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 capitalize">{p.priority}</span>
                <span className="font-bold text-amber-400">{p.count}</span>
              </div>))}
          </div>
        </div>
      </div>

      {/* 12 Report Generator Panel */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
          <FileText className="h-4 w-4 text-indigo-400"/>
          <span>Enterprise Report Generators</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            'Manual Notification Report', 'Broadcast Report', 'Announcement Report', 'Delivery Report',
            'Read Report', 'Failure Report', 'Retry Report', 'Recipient Report',
            'Organization Report', 'Department Report', 'Role Report', 'Audit Report'
        ].map(reportName => (<button key={reportName} onClick={() => setSelectedReport(reportName)} className={`p-3 rounded-xl border text-left font-bold transition-all ${selectedReport === reportName
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850'}`}>
              {reportName}
            </button>))}
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-white">{selectedReport} Selected</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Ready for compilation and export</p>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={() => handleExport('csv')} className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold">CSV</button>
            <button onClick={() => handleExport('excel')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">Excel</button>
            <button onClick={() => handleExport('pdf')} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold">PDF</button>
            <button onClick={() => handleExport('print')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">Print</button>
          </div>
        </div>
      </div>
    </div>);
}
