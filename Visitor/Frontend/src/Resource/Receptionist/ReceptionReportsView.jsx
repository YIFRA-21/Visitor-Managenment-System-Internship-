import React, { useState, useEffect, useMemo } from 'react';
import { Download, Printer, Filter, RefreshCw, Table as TableIcon, TrendingUp, BarChart2, PieChart as PieIcon, Clock, CheckCircle2, Users, Search, Layers, Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api, { getErrorMessage } from '../../services/api';
import BackButton from '../../components/common/BackButton';
export default function ReceptionReportsView() {
    const [reportType, setReportType] = useState('DAILY_VISITORS');
    const [viewMode, setViewMode] = useState('split');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    // Fetch report payload from backend
    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reception/reports?type=${reportType}`);
            setReportData(res.data);
        }
        catch (err) {
            console.error('Error loading report data:', getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReport();
    }, [reportType]);
    // Process data for charts
    const chartData = useMemo(() => {
        if (!reportData || !reportData.data || !Array.isArray(reportData.data))
            return [];
        // Sort chronologically (oldest to newest) for chart display
        const raw = [...reportData.data];
        if (reportType === 'DAILY_VISITORS') {
            return raw
                .map((row) => ({
                name: row.date || 'Unknown',
                total: Number(row.total_visitors || 0),
                completed: Number(row.completed || 0),
                cancelled: Number(row.cancelled || 0),
                arrived: Number(row.arrived || 0),
            }))
                .reverse();
        }
        else if (reportType === 'HOURLY_TRAFFIC') {
            return raw.map((row) => ({
                name: `${row.hour}:00`,
                total: Number(row.visitor_count || 0),
                completed: Number(row.completed || 0),
                cancelled: Number(row.cancelled || 0),
                arrived: Number(row.arrived || 0),
            }));
        }
        else {
            // For other reports, aggregate count by status or category
            return raw.slice(0, 15).map((row, idx) => ({
                name: row.visitor_name || row.title || row.queue_number || `Item #${idx + 1}`,
                total: Number(row.waiting_minutes || 1),
                completed: row.status === 'COMPLETED' ? 1 : 0,
                cancelled: row.status === 'CANCELLED' ? 1 : 0,
                arrived: row.status === 'WAITING' ? 1 : 0,
            }));
        }
    }, [reportData, reportType]);
    // Calculate Key Performance Indicators (KPIs)
    const metrics = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return { total: 0, completed: 0, cancelled: 0, arrived: 0, peakTraffic: 'N/A' };
        }
        const total = chartData.reduce((acc, item) => acc + item.total, 0);
        const completed = chartData.reduce((acc, item) => acc + item.completed, 0);
        const cancelled = chartData.reduce((acc, item) => acc + item.cancelled, 0);
        const arrived = chartData.reduce((acc, item) => acc + item.arrived, 0);
        // Find peak volume entry
        const maxItem = [...chartData].sort((a, b) => b.total - a.total)[0];
        const peakTraffic = maxItem ? `${maxItem.name} (${maxItem.total} visits)` : 'N/A';
        return { total, completed, cancelled, arrived, peakTraffic };
    }, [chartData]);
    // Status Distribution Pie Chart Data
    const pieData = useMemo(() => {
        return [
            { name: 'Arrived / Active', value: metrics.arrived || 1, color: '#10b981' },
            { name: 'Completed', value: metrics.completed || 1, color: '#8b5cf6' },
            { name: 'Cancelled', value: metrics.cancelled || 1, color: '#f43f5e' },
        ];
    }, [metrics]);
    // Filter table data by search input
    const filteredTableRows = useMemo(() => {
        if (!reportData || !reportData.data || !Array.isArray(reportData.data))
            return [];
        if (!searchTerm.trim())
            return reportData.data;
        const term = searchTerm.toLowerCase();
        return reportData.data.filter((row) => Object.values(row).some((val) => val !== null && String(val).toLowerCase().includes(term)));
    }, [reportData, searchTerm]);
    // CSV Export Handler
    const handleExportCSV = () => {
        if (!reportData || !reportData.data || reportData.data.length === 0)
            return;
        const headers = Object.keys(reportData.data[0]).join(',');
        const rows = reportData.data.map((row) => Object.values(row)
            .map((v) => `"${v !== null ? String(v).replace(/"/g, '""') : ''}"`)
            .join(','));
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Reception_Report_${reportType}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header Bar */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shrink-0">
            <TrendingUp className="h-6 w-6"/>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-tight uppercase">
                Reception Operational Analytics & Reports
              </h1>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-full uppercase whitespace-nowrap shrink-0 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive visitor traffic trends, peak load analysis, status volume bar charts, and export tools.
            </p>
          </div>
        </div>

        {/* Action Controls - Strictly Horizontal Row */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={fetchReport} disabled={loading} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs transition-colors flex items-center gap-1.5 shrink-0" title="Refresh Data">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`}/>Refresh
          </button>
          <button onClick={handleExportCSV} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-colors whitespace-nowrap shrink-0">
            <Download className="h-4 w-4"/>
            <span>Export CSV</span>
          </button>
          <button onClick={() => window.print()} className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0">
            <Printer className="h-4 w-4"/>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Report Selection & View Mode Toggles */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-400"/>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Report Type:</span>
          </div>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors">
            <option value="DAILY_VISITORS">Daily Visitor Volume & Traffic Analytics</option>
            <option value="HOURLY_TRAFFIC">Hourly Visitor Peak Load Breakdown</option>
            <option value="WALK_IN_VISITORS">Walk-In Visitor Registrations Log</option>
            <option value="WAITING_TIME">Lobby Waiting & Service Duration Report</option>
            <option value="PERFORMANCE">Reception Front-Desk Audit Trail Report</option>
          </select>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 w-full md:w-auto justify-center">
          <button onClick={() => setViewMode('split')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${viewMode === 'split' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <Layers className="h-3.5 w-3.5"/>
            <span>Split View</span>
          </button>
          <button onClick={() => setViewMode('charts')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${viewMode === 'charts' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <BarChart2 className="h-3.5 w-3.5"/>
            <span>Analytics & Charts</span>
          </button>
          <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${viewMode === 'table' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <TableIcon className="h-3.5 w-3.5"/>
            <span>Data Grid</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a0f19] border border-blue-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Visitor Volume</span>
            <Users className="h-4 w-4 text-blue-400"/>
          </div>
          <div className="text-2xl font-black text-white">{metrics.total}</div>
          <div className="text-[11px] text-blue-400 font-medium">Recorded across timeframe</div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
        </div>

        <div className="bg-[#0a0f19] border border-emerald-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Arrived & Checked In</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400"/>
          </div>
          <div className="text-2xl font-black text-emerald-400">{metrics.arrived}</div>
          <div className="text-[11px] text-emerald-400 font-medium">Active & confirmed entries</div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
        </div>

        <div className="bg-[#0a0f19] border border-purple-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Completed Visits</span>
            <Sparkles className="h-4 w-4 text-purple-400"/>
          </div>
          <div className="text-2xl font-black text-purple-400">{metrics.completed}</div>
          <div className="text-[11px] text-purple-400 font-medium">Successfully checked out</div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>
        </div>

        <div className="bg-[#0a0f19] border border-amber-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Peak Traffic Window</span>
            <Clock className="h-4 w-4 text-amber-400"/>
          </div>
          <div className="text-sm font-bold text-amber-300 truncate">{metrics.peakTraffic}</div>
          <div className="text-[11px] text-amber-400 font-medium">Highest volume concentration</div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
        </div>
      </div>

      {/* VISUAL CHARTS SECTION */}
      {(viewMode === 'split' || viewMode === 'charts') && (<div className="space-y-6">
          {/* Main Traffic Area Chart & Volume Bar Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Interactive Area Traffic Chart */}
            <div className="lg:col-span-2 bg-[#0a0f19] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400"/>
                  <h2 className="text-xs font-black uppercase text-white tracking-wider">
                    Visitor Traffic Trend Analysis
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Timeline Progression</span>
              </div>

              <div className="h-72 w-full">
                {chartData.length === 0 ? (<div className="h-full flex items-center justify-center text-xs text-slate-500">No chart data available</div>) : (<ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorArrived" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }}/>
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }}/>
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: '#e2e8f0' }}/>
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                      <Area type="monotone" dataKey="total" name="Total Visitors" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2}/>
                      <Area type="monotone" dataKey="arrived" name="Arrived / Checked In" stroke="#10b981" fillOpacity={1} fill="url(#colorArrived)" strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>)}
              </div>
            </div>

            {/* 2. Visitor Status Distribution Pie Chart */}
            <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-purple-400"/>
                  <h2 className="text-xs font-black uppercase text-white tracking-wider">
                    Status Distribution
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Share %</span>
              </div>

              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-850">
                {pieData.map((item, i) => (<div key={i} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-300 font-medium">{item.name}</span>
                    </span>
                    <span className="font-mono font-bold text-white">{item.value}</span>
                  </div>))}
              </div>
            </div>
          </div>

          {/* 3. Bar Chart Breakdown */}
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-blue-400"/>
                <h2 className="text-xs font-black uppercase text-white tracking-wider">
                  Visitor Volume Categorical Bar Chart
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Comparative Bar Breakdown</span>
            </div>

            <div className="h-64 w-full">
              {chartData.length === 0 ? (<div className="h-full flex items-center justify-center text-xs text-slate-500">No chart data available</div>) : (<ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }}/>
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }}/>
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: '#e2e8f0' }}/>
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                    <Bar dataKey="total" name="Total Visitors" fill="#3b82f6" radius={[6, 6, 0, 0]}/>
                    <Bar dataKey="arrived" name="Arrived / Checked In" fill="#10b981" radius={[6, 6, 0, 0]}/>
                    <Bar dataKey="completed" name="Completed" fill="#8b5cf6" radius={[6, 6, 0, 0]}/>
                    <Bar dataKey="cancelled" name="Cancelled" fill="#f43f5e" radius={[6, 6, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>)}
            </div>
          </div>
        </div>)}

      {/* DETAILED DATA GRID TABLE SECTION */}
      {(viewMode === 'split' || viewMode === 'table') && (<div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase text-emerald-400 tracking-wider">
                {reportData?.summary?.report_name || 'Reception Operational Report Table'}
              </h2>
              <p className="text-[11px] text-slate-400">Detailed line items and front-desk log records.</p>
            </div>

            {/* Table Search Filter */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500"/>
              <input type="text" placeholder="Search report records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"/>
            </div>
          </div>

          {loading ? (<div className="p-12 text-center text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-2"/>
              <p className="text-xs font-bold uppercase tracking-wider">Compiling Report Data Grid...</p>
            </div>) : filteredTableRows.length === 0 ? (<div className="p-12 text-center text-slate-500">
              <TableIcon className="h-10 w-10 mx-auto text-slate-600 mb-2"/>
              <p className="text-sm font-bold text-slate-400">No Matching Report Data Found</p>
            </div>) : (<div className="overflow-x-auto rounded-xl border border-slate-850">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    {Object.keys(filteredTableRows[0]).slice(0, 8).map((key) => (<th key={key} className="p-3">
                        {key.replace(/_/g, ' ')}
                      </th>))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-slate-950/40">
                  {filteredTableRows.map((row, idx) => (<tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                      {Object.entries(row).slice(0, 8).map(([key, val], i) => (<td key={i} className="p-3 font-mono text-slate-300">
                          {key === 'status' || key === 'appointment_status' ? (<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${String(val).toUpperCase() === 'COMPLETED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                String(val).toUpperCase() === 'ARRIVED' || String(val).toUpperCase() === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                    String(val).toUpperCase() === 'CANCELLED' || String(val).toUpperCase() === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                        'bg-slate-800 text-slate-300'}`}>
                              {String(val)}
                            </span>) : val !== null ? (String(val)) : ('—')}
                        </td>))}
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </div>)}
    </div>);
}
