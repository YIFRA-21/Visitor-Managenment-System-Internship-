import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, TrendingUp, Users, Clock, AlertTriangle, RefreshCw, AlertCircle, FileText, Download, Calendar } from 'lucide-react';
import { reportsApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ReportingDashboard() {
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await reportsApi.kpis();
            setStats(res.data.data);
            setLastRefresh(new Date());
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const KPICard = ({ icon: Icon, label, value, sub, color }) => (<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-2">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: color + '15' }}>
          <Icon className="h-5 w-5" style={{ color }}/>
        </div>
        <span className="text-[10px] font-extrabold uppercase text-slate-400">KPI</span>
      </div>
      <p className="text-3xl font-black text-slate-800 dark:text-white">{loading ? '—' : (value ?? '0')}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>);
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-500"/> {t('reports.title', 'Executive BI & Reporting Control Center')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('reports.subtitle', 'Enterprise analytics, operational KPIs, and intelligence metrics')}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> {t('form.refresh', 'Refresh KPIs')}
        </button>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* KPI Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard icon={Users} label="Today's Total Visits" value={stats?.todayVisits} color="#6366f1"/>
        <KPICard icon={TrendingUp} label="Currently Inside" value={stats?.activeInside} color="#10b981"/>
        <KPICard icon={AlertTriangle} label="Overstays Detected" value={stats?.overstaysCount} color="#f59e0b"/>
        <KPICard icon={Calendar} label="Monthly Total Visits" value={stats?.monthlyTotalVisits} color="#8b5cf6"/>
        <KPICard icon={Clock} label="Avg Visit Duration" value={stats?.avgVisitDurationMinutes ? `${stats.avgVisitDurationMinutes}m` : '—'} color="#ec4899"/>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg space-y-3">
          <FileText className="h-8 w-8 text-indigo-200"/>
          <h3 className="text-lg font-black">Operational Reports</h3>
          <p className="text-xs text-indigo-100">Access visitor logs, check-in records, security incident reports, and audit trails.</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg space-y-3">
          <TrendingUp className="h-8 w-8 text-emerald-200"/>
          <h3 className="text-lg font-black">Occupancy & Peak Traffic</h3>
          <p className="text-xs text-emerald-100">Analyze hourly arrival peaks, department traffic, and facility capacity.</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg space-y-3">
          <Download className="h-8 w-8 text-amber-200"/>
          <h3 className="text-lg font-black">Custom Report Builder</h3>
          <p className="text-xs text-amber-100">Design custom reports, select custom fields, schedule email delivery, and export CSVs.</p>
        </div>
      </div>
    </div>);
}
