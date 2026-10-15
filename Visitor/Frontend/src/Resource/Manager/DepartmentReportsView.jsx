// Frontend/src/Resource/Manager/DepartmentReportsView.tsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { managerApi } from '../../modules/employee-management/api/managerApi';
export default function DepartmentReportsView() {
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(null);
    const fetchReports = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await managerApi.getReports();
            setReports(data);
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to generate department reports');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReports();
    }, []);
    const handleExport = async (type) => {
        setExporting(type);
        try {
            const res = await managerApi.exportData(type);
            const items = res.data || [];
            if (items.length === 0) {
                alert('No data available to export.');
                return;
            }
            // Convert to CSV
            const headers = Object.keys(items[0]).join(',');
            const rows = items.map((obj) => Object.values(obj)
                .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
                .join(','));
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `department_${type.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        catch (err) {
            alert('Export failed: ' + (err?.message || 'Error'));
        }
        finally {
            setExporting(null);
        }
    };
    const statusCounts = reports?.statusCounts || [];
    const hostWorkloads = reports?.hostWorkloads || [];
    const recentVolume = reports?.recentVolume || [];
    return (<div className="p-6 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Department Analytics & Reports
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
                Department Insights
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live statistics, host workload balance, and compliance data exports.
            </p>
          </div>
        </div>

        {/* CSV Export Dropdown / Buttons */}
        <div className="flex items-center space-x-2">
          <button onClick={() => handleExport('APPOINTMENTS')} disabled={!!exporting} className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition">
            <Download className="w-3.5 h-3.5 text-indigo-400"/>
            <span>Export Visits</span>
          </button>
          <button onClick={() => handleExport('VISITORS')} disabled={!!exporting} className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition">
            <Download className="w-3.5 h-3.5 text-sky-400"/>
            <span>Export Guests</span>
          </button>
          <button onClick={() => handleExport('EMPLOYEES')} disabled={!!exporting} className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition">
            <Download className="w-3.5 h-3.5 text-emerald-400"/>
            <span>Export Staff</span>
          </button>
        </div>
      </div>

      {loading ? (<div className="py-24 text-center text-slate-400 text-xs animate-pulse">
          Computing real-time department analytics from database...
        </div>) : (<div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown Card */}
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <PieChartIcon className="w-5 h-5"/>
                  </div>
                  <h3 className="text-sm font-bold text-white">Visit Request Status Breakdown</h3>
                </div>
              </div>

              {statusCounts.length === 0 ? (<p className="text-xs text-slate-500 italic py-6 text-center">No appointment status data.</p>) : (<div className="space-y-3">
                  {statusCounts.map((sc, idx) => (<div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          {sc.appointment_status} ({sc.approval_status})
                        </span>
                        <span className="font-bold text-white">{sc.count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, sc.count * 20)}%` }}/>
                      </div>
                    </div>))}
                </div>)}
            </div>

            {/* Host Workload Distribution */}
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <BarChart3 className="w-5 h-5"/>
                  </div>
                  <h3 className="text-sm font-bold text-white">Host Workload & Completion</h3>
                </div>
              </div>

              {hostWorkloads.length === 0 ? (<p className="text-xs text-slate-500 italic py-6 text-center">No host workload records found.</p>) : (<div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {hostWorkloads.map((hw, idx) => (<div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{hw.full_name}</p>
                        <p className="text-[11px] text-slate-400">{hw.completed_appointments} completed</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg font-bold">
                          {hw.total_appointments} total visits
                        </span>
                      </div>
                    </div>))}
                </div>)}
            </div>
          </div>

          {/* 7-Day Trend Card */}
          <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                  <TrendingUp className="w-5 h-5"/>
                </div>
                <h3 className="text-sm font-bold text-white">7-Day Appointment Traffic</h3>
              </div>
            </div>

            {recentVolume.length === 0 ? (<p className="text-xs text-slate-500 italic py-6 text-center">No traffic logged in the last 7 days.</p>) : (<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {recentVolume.map((rv, idx) => (<div key={idx} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-1">
                    <p className="text-[11px] text-slate-400 font-medium">
                      {new Date(rv.date_val).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                    </p>
                    <p className="text-xl font-black text-white">{rv.count}</p>
                    <span className="text-[10px] text-slate-500">visits</span>
                  </div>))}
              </div>)}
          </div>
        </div>)}
    </div>);
}
