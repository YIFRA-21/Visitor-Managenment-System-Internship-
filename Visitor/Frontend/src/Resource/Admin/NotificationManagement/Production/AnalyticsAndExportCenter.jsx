import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileText, Printer, FileSpreadsheet } from 'lucide-react';
import { productionMonitoringApi } from '../../../../services/api';
export default function AnalyticsAndExportCenter() {
    const [activeTab, setActiveTab] = useState('analytics');
    const [analytics, setAnalytics] = useState({
        deliveryRatePct: 98.4, openRatePct: 91.2, readRatePct: 86.5, failureRatePct: 1.6,
        avgDeliveryTimeMs: 420,
        channelBreakdown: { in_app: 45, email: 35, sms: 15, browser: 5 },
        deliveryTrend: [
            { date: '2026-08-01', count: 1820 }, { date: '2026-08-02', count: 2140 },
            { date: '2026-08-03', count: 1980 }, { date: '2026-08-04', count: 2450 },
            { date: '2026-08-05', count: 2890 }, { date: '2026-08-06', count: 3000 }
        ]
    });
    useEffect(() => {
        productionMonitoringApi.getAnalyticsSummary().then(res => {
            if (res.data?.data)
                setAnalytics(res.data.data);
        }).catch(() => { });
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 rounded-2xl shadow-xl text-white">
            <BarChart3 className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Notification Platform</span><span>/</span>
              <span className="text-blue-400 font-bold">Analytics & Export (§8.15–§8.18)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Notification Analytics, Reports & Export Center</h1>
          </div>
        </div>

        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'analytics', label: 'Analytics Dashboard (§8.15)' },
            { id: 'reports', label: 'Custom Reports (§8.16)' },
            { id: 'export', label: 'Export Center (§8.18)' }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
            </button>))}
        </div>
      </div>

      {/* TAB 1: Analytics (§8.15 & §8.17) */}
      {activeTab === 'analytics' && (<div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
                { label: 'Delivery Rate', value: `${analytics.deliveryRatePct}%`, color: 'text-emerald-400 border-emerald-500/30' },
                { label: 'Open Rate', value: `${analytics.openRatePct}%`, color: 'text-indigo-400 border-indigo-500/30' },
                { label: 'Read Rate', value: `${analytics.readRatePct}%`, color: 'text-cyan-400 border-cyan-500/30' },
                { label: 'Avg Delivery Time', value: `${analytics.avgDeliveryTimeMs} ms`, color: 'text-purple-400 border-purple-500/30' }
            ].map((m, i) => (<div key={i} className={`p-4 bg-slate-900 border ${m.color} rounded-2xl`}>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</span>
                <div className={`text-2xl font-black mt-1 ${m.color.split(' ')[0]}`}>{m.value}</div>
              </div>))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase">Channel Volume Distribution</h4>
              <div className="space-y-2 text-xs">
                {Object.entries(analytics.channelBreakdown || {}).map(([c, pct]) => (<div key={c} className="space-y-1">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-300 uppercase font-bold">{c}</span>
                      <span className="text-cyan-400 font-bold">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>))}
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase">Delivery Trend (Last 6 Days)</h4>
              <div className="space-y-2 text-xs">
                {analytics.deliveryTrend?.map((t, i) => (<div key={i} className="flex justify-between items-center p-2 bg-slate-950 rounded-xl font-mono">
                    <span className="text-slate-400">{t.date}</span>
                    <span className="text-indigo-400 font-bold">{t.count} Delivered</span>
                  </div>))}
              </div>
            </div>
          </div>
        </div>)}

      {/* TAB 2: Reports (§8.16) */}
      {activeTab === 'reports' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-2xl text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <FileText className="h-4 w-4 text-indigo-400"/><span>Custom Notification Reports</span>
          </h3>
          <div className="space-y-2">
            {['Daily Notification Summary', 'Weekly Escalation Audit', 'Monthly Delivery Health Report'].map(rep => (<div key={rep} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <span className="font-bold text-white">{rep}</span>
                <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold">Generate</button>
              </div>))}
          </div>
        </div>)}

      {/* TAB 3: Export Center (§8.18) */}
      {activeTab === 'export' && (<div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl">
          {[
                { format: 'PDF Document', icon: FileText, color: 'text-rose-400 hover:border-rose-500/50' },
                { format: 'Excel Spreadsheet', icon: FileSpreadsheet, color: 'text-emerald-400 hover:border-emerald-500/50' },
                { format: 'CSV Raw Data', icon: Download, color: 'text-cyan-400 hover:border-cyan-500/50' },
                { format: 'Print Summary', icon: Printer, color: 'text-purple-400 hover:border-purple-500/50' }
            ].map((exp, i) => (<button key={i} className={`p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center space-y-2 font-bold text-xs text-white transition-all ${exp.color}`}>
              <exp.icon className="h-6 w-6"/>
              <span>Export {exp.format}</span>
            </button>))}
        </div>)}
    </div>);
}
