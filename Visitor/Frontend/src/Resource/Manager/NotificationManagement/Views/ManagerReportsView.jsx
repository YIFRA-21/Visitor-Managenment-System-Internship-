import React from 'react';
import { FileSpreadsheet, Download, FileText } from 'lucide-react';
const ManagerReportsView = () => {
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400"/> Manager Reports & Export Center
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Generate and download official PDF, Excel, and CSV department notification summaries.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
            { title: 'Executive Summary PDF', desc: 'Complete breakdown of department approval times, visitor alerts, and SLA metrics.', format: 'PDF', icon: FileText, btnCol: 'bg-red-600/20 text-red-300 border-red-500/30' },
            { title: 'Approval Audit Excel', desc: 'Raw spreadsheet of all approval actions, timestamps, and comments.', format: 'XLSX', icon: FileSpreadsheet, btnCol: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' },
            { title: 'Notification Log CSV', desc: 'Export raw notification event log for custom reporting.', format: 'CSV', icon: Download, btnCol: 'bg-blue-600/20 text-blue-300 border-blue-500/30' }
        ].map((r, i) => {
            const Icon = r.icon;
            return (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div>
                <Icon className="w-6 h-6 text-slate-300 mb-2"/>
                <h3 className="text-xs font-bold text-white">{r.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{r.desc}</p>
              </div>

              <button className={`w-full ${r.btnCol} border font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 hover:opacity-80 transition-all`}>
                <Download className="w-3.5 h-3.5"/> Export {r.format}
              </button>
            </div>);
        })}
      </div>
    </div>);
};
export default ManagerReportsView;
