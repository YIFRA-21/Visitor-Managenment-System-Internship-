import React from 'react';
import { FileSpreadsheet, Download, FileText, Table } from 'lucide-react';
const ReceptionReportsView = () => {
    const reports = [
        { title: 'Daily Front-Desk Operations Summary', desc: 'All check-ins, check-outs, queue stats, and security events for today.', icon: FileText },
        { title: 'Weekly Visitor Flow Report', desc: 'Visitor volume, peak hours, average wait times, and host response rates.', icon: Table },
        { title: 'Monthly Security & Incident Report', desc: 'Blacklist matches, unauthorized entries, emergency alerts, and compliance log.', icon: FileSpreadsheet }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-400"/> Reception Reports & Export Center
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Generate and download front-desk operation reports in PDF, Excel, or CSV format.</p>
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
export default ReceptionReportsView;
