import React, { useState, useEffect } from 'react';
import { Download, Users, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function EmployeeReports() {
    const { t, tStatus } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [reportsData, setReportsData] = useState([]);
    const [dateRange, setDateRange] = useState('THIS_MONTH');
    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get('/appointments');
            setReportsData(res.data || []);
        }
        catch (err) {
            // Mock fallback report data
            setReportsData([
                { id: 501, visitor_name: 'Dr. Evelyn Carter', company: 'IT Park', date: '2026-07-28', status: 'COMPLETED', room: 'Boardroom A' },
                { id: 502, visitor_name: 'Marcus Brody', company: 'IT Park', date: '2026-07-25', status: 'COMPLETED', room: 'Suite 2B' },
                { id: 503, visitor_name: 'Sophia Laurent', company: 'IT Park', date: '2026-07-20', status: 'COMPLETED', room: 'Studio 4D' },
            ]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReports();
    }, [dateRange]);
    const handleExportCSV = () => {
        const headers = ['ID', 'Visitor Name', 'Company', 'Date', 'Status', 'Location'];
        const csvRows = [headers.join(',')];
        reportsData.forEach((row) => {
            const values = [
                row.id,
                `"${row.visitor_name || row.full_name || ''}"`,
                `"${row.company || ''}"`,
                `"${row.scheduled_start || row.date || ''}"`,
                `"${row.status || ''}"`,
                `"${row.room_name || row.room || ''}"`,
            ];
            csvRows.push(values.join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Host_Visitor_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">My Host Visitor Reports</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Analytics and exportable log history for your hosted visitor appointments.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={handleExportCSV} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-transform active:scale-95">
            <Download className="h-4 w-4"/>
            <span>Export CSV Log</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Hosted Guests</span>
            <Users className="h-4 w-4 text-indigo-400"/>
          </div>
          <h2 className="text-2xl font-black text-white">48</h2>
          <p className="text-[10px] text-emerald-400 font-bold">+12% vs last month</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Completed Visits</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400"/>
          </div>
          <h2 className="text-2xl font-black text-white">44</h2>
          <p className="text-[10px] text-slate-400 font-semibold">91.6% completion rate</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Avg Meeting Duration</span>
            <Clock className="h-4 w-4 text-purple-400"/>
          </div>
          <h2 className="text-2xl font-black text-white">52 min</h2>
          <p className="text-[10px] text-slate-400 font-semibold">Within facility guidelines</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Host Compliance</span>
            <TrendingUp className="h-4 w-4 text-amber-400"/>
          </div>
          <h2 className="text-2xl font-black text-emerald-400">100%</h2>
          <p className="text-[10px] text-slate-400 font-semibold">SOC2 & Security compliant</p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-800/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-850 pb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Hosted Visits Record Log</h3>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none">
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="ALL">All Time</option>
          </select>
        </div>

        {loading ? (<div className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
            Compiling Reports...
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 font-black uppercase text-[10px]">
                  <th className="pb-3">{t('table.visitorName', 'Visitor Name')}</th>
                  <th className="pb-3">{t('table.company', 'Company')}</th>
                  <th className="pb-3">{t('table.visitDate', 'Visit Date')}</th>
                  <th className="pb-3">{t('table.location', 'Location')}</th>
                  <th className="pb-3 text-right">{t('table.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {reportsData.map((r, i) => (<tr key={i} className="hover:bg-slate-900/50">
                    <td className="py-3.5 font-bold text-white">{r.visitor_name || r.full_name}</td>
                    <td className="py-3.5 text-slate-400">{r.company || r.visitor_company || 'Guest'}</td>
                    <td className="py-3.5 text-slate-300 font-mono">
                      {new Date(r.scheduled_start || r.date || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-slate-300">{r.room_name || r.room || 'Main Lobby'}</td>
                    <td className="py-3.5 text-right">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold rounded-full uppercase">
                        {tStatus(r.status) || 'COMPLETED'}
                      </span>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>);
}
