import React, { useState, useEffect, useCallback } from 'react';
import { Award, TrendingUp, Users, Building2, ShieldAlert, RefreshCw, AlertCircle, Calendar, ArrowUpRight } from 'lucide-react';
import InteractiveWidgetCard from './InteractiveWidgetCard';
import { reportsApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ExecutiveDashboard({ onNavigate }) {
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await reportsApi.kpis();
            setStats(res.data.data);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500"/> {t('execDash.title', 'Executive & C-Suite Command Center')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('execDash.subtitle', 'High-level organizational throughput, risk governance, and facility capacity benchmarks')}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> {t('execDash.refresh', 'Refresh Metrics')}
        </button>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InteractiveWidgetCard title={t('execDash.kpiTodayVisitors', "Today's Total Visitors")} value={loading ? '—' : stats?.todayVisits ?? 0} subtext={t('execDash.kpiTodaySub', 'Throughput across all branches')} icon={Users} iconBgColor="#6366f115" iconColor="#6366f1" onClick={() => onNavigate?.('visitor_list')}/>
        <InteractiveWidgetCard title={t('execDash.kpiLiveOccupancy', 'Live Occupancy')} value={loading ? '—' : stats?.activeInside ?? 0} subtext={t('execDash.kpiLiveOccupancySub', 'Active visitors inside facilities')} icon={TrendingUp} iconBgColor="#10b98115" iconColor="#10b981" onClick={() => onNavigate?.('live_visitor_tracking')}/>
        <InteractiveWidgetCard title={t('execDash.kpiRiskIndex', 'Security Risk Index')} value={loading ? '—' : stats?.overstaysCount ?? 0} subtext={t('execDash.kpiRiskIndexSub', 'Flagged overstays & active alerts')} icon={ShieldAlert} iconBgColor="#ef444415" iconColor="#ef4444" onClick={() => onNavigate?.('risk_watchlist')}/>
        <InteractiveWidgetCard title={t('execDash.kpiMonthlyVisits', 'Monthly Total Visits')} value={loading ? '—' : stats?.monthlyTotalVisits ?? 0} subtext={t('execDash.kpiMonthlyVisitsSub', '30-day cumulative visitor volume')} icon={Calendar} iconBgColor="#8b5cf615" iconColor="#8b5cf6" onClick={() => onNavigate?.('reporting_dashboard')}/>
      </div>

      {/* Executive Strategic Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500"/> {t('execDash.slaPerf', 'Multi-Branch Facility SLA Performance')}
          </h3>
          <div className="space-y-3">
            {[
            { branch: 'Headquarters Tower A', load: '82%', status: 'Optimal', SLA: '99.4%' },
            { branch: 'Tech & R&D Hub', load: '64%', status: 'Normal', SLA: '98.8%' },
            { branch: 'Logistics Facility North', load: '91%', status: 'High Traffic', SLA: '96.2%' },
        ].map((b, i) => (<div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{b.branch}</p>
                  <p className="text-slate-400">Capacity Load: {b.load}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">SLA {b.SLA}</span>
                  <p className="text-slate-400">{b.status}</p>
                </div>
              </div>))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">{t('execDash.insightBadge', 'Executive Insight')}</span>
            <h3 className="text-xl font-black mt-1">{t('execDash.insightTitle', 'Facility Occupancy & Security Governance')}</h3>
            <p className="text-xs text-slate-300 mt-2">
              {t('execDash.insightDesc', 'All 14 active facility gates and security check-ins are operating within optimal governance protocols.')}
            </p>
          </div>
          <button onClick={() => onNavigate?.('reporting_dashboard')} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-2">
            {t('execDash.openBi', 'Open Full BI Analytics')} <ArrowUpRight className="h-4 w-4"/>
          </button>
        </div>
      </div>
    </div>);
}
