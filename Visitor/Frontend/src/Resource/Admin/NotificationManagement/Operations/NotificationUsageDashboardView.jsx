import React from 'react';
import { BarChart2, Download, FileText } from 'lucide-react';
import { DashboardCard } from './components/OperationsCards';
export default function NotificationUsageDashboardView() {
    return (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6 text-xs font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <BarChart2 className="h-4 w-4 text-emerald-400"/>
            <span>Notification Usage Dashboard & Enterprise Operations Analytics (§10)</span>
          </h3>
          <p className="text-slate-400 mt-0.5">High-level KPIs, delivery throughput, channel volume distribution, and channel cost breakdown.</p>
        </div>

        <div className="flex space-x-2">
          <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center space-x-1">
            <Download className="h-3.5 w-3.5"/>
            <span>Export PDF</span>
          </button>
          <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center space-x-1">
            <FileText className="h-3.5 w-3.5"/>
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DashboardCard title="Notifications Today" value="3,450" subtext="+12% vs yesterday" color="blue"/>
        <DashboardCard title="Notifications This Week" value="24,500" subtext="Throughput: 42/sec" color="indigo"/>
        <DashboardCard title="Notifications This Month" value="104,200" subtext="Monthly cap: 500,000" color="purple"/>
        <DashboardCard title="Delivery Success Rate" value="98.4%" subtext="Avg latency: 420ms" color="emerald"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Templates */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <h4 className="font-bold uppercase text-[11px] text-cyan-400">Top Utilized Templates</h4>
          <div className="space-y-2 font-mono">
            {[
            { name: 'Standard Visitor Arrival Notice', count: 45200, pct: 45 },
            { name: 'Host Check-in Confirmation', count: 38100, pct: 38 },
            { name: 'VIP Escort Security Alert', count: 14200, pct: 14 },
            { name: 'Appointment Reminder SMS', count: 9800, pct: 10 }
        ].map((t, i) => (<div key={i} className="p-2 bg-slate-900 rounded-lg flex justify-between items-center text-[11px]">
                <span className="font-sans font-bold text-white">{t.name}</span>
                <span className="text-cyan-400 font-bold">{t.count.toLocaleString()}</span>
              </div>))}
          </div>
        </div>

        {/* Department Usage */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <h4 className="font-bold uppercase text-[11px] text-purple-400">Volume by Department</h4>

          <div className="space-y-2 font-mono">
            {[
            { name: 'Security & Operations', count: 52400 },
            { name: 'Reception & Visitors', count: 48200 },
            { name: 'Human Resources', count: 15400 },
            { name: 'Executive Suite', count: 12450 }
        ].map((d, i) => (<div key={i} className="p-2 bg-slate-900 rounded-lg flex justify-between items-center text-[11px]">
                <span className="font-sans font-bold text-white">{d.name}</span>
                <span className="text-purple-400 font-bold">{d.count.toLocaleString()}</span>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
