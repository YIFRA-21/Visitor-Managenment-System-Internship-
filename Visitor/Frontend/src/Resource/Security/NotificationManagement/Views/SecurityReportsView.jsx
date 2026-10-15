import React from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
const SecurityReportsView = () => {
    const reports = [
        { title: 'Daily SOC Shift Incident Summary', desc: 'Watchlist hits, access violations, patrol checkpoints, and emergency events for the current shift.', icon: FileSpreadsheet },
        { title: 'Weekly Security Threat & Response Report', desc: 'Alert volume trends, response times, resolution rates, and equipment uptime statistics.', icon: FileSpreadsheet },
        { title: 'Monthly Compliance & Audit Security Report', desc: 'Full compliance log with chain of custody, investigation case outcomes, and blacklist activity.', icon: FileSpreadsheet }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-400"/> SOC Incident Reports & Export Center
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Generate and download security operations reports in PDF, Excel, or CSV format.</p>
      </div>

      <div className="space-y-4">
        {reports.map((r, i) => {
            const Icon = r.icon;
            return (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
                  <Icon className="w-5 h-5"/>
                </div>
                <div>
                  <span className="font-bold text-white block">{r.title}</span>
                  <span className="text-slate-400 block mt-0.5">{r.desc}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="bg-red-600/20 text-red-300 border border-red-500/30 px-3 py-1.5 rounded font-semibold hover:bg-red-600/30 flex items-center gap-1">
                  <Download className="w-3 h-3"/> PDF
                </button>
                <button className="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded font-semibold hover:bg-emerald-600/30 flex items-center gap-1">
                  <Download className="w-3 h-3"/> Excel
                </button>
                <button className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded font-semibold hover:bg-blue-600/30 flex items-center gap-1">
                  <Download className="w-3 h-3"/> CSV
                </button>
              </div>
            </div>);
        })}
      </div>
    </div>);
};
export default SecurityReportsView;
