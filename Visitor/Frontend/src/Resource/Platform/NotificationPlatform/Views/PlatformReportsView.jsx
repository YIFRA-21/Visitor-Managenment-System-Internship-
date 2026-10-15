import React from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
const PlatformReportsView = () => {
    const reports = [
        { title: 'Daily Platform Performance & Delivery Report', desc: 'Complete breakdown of event counts, channel success rates, and delivery latency metrics.', icon: FileSpreadsheet },
        { title: 'Weekly Provider Health & SLA Audit Report', desc: 'SMTP Mailer, Twilio SMS, and Webhook failover statistics and gateway uptime.', icon: FileSpreadsheet }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-400"/> Platform Reports & Export Center
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Generate and download platform performance reports in PDF, Excel, or CSV format.</p>
      </div>

      <div className="space-y-4">
        {reports.map((r, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{r.title}</span>
              <span className="text-slate-400 block mt-0.5">{r.desc}</span>
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
          </div>))}
      </div>
    </div>);
};
export default PlatformReportsView;
