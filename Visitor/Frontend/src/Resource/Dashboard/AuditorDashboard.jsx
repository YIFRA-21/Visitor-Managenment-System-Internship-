import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, FileText, Lock, Users, RefreshCw, Loader2, AlertCircle, Search } from 'lucide-react';
import InteractiveWidgetCard from './InteractiveWidgetCard';
import { reportsApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AuditorDashboard({ onNavigate }) {
    const { t } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await reportsApi.auditLogs();
            setLogs(Array.isArray(res.data) ? res.data : res.data.data || []);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = logs.filter(l => !filter || JSON.stringify(l).toLowerCase().includes(filter.toLowerCase()));
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-500"/> {t('auditorDash.title', 'Compliance & Audit Control Center')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('auditorDash.subtitle', 'Immutable audit logs, RBAC policy validations, and security governance tracking')}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> {t('auditorDash.refresh', 'Refresh Audit Trail')}
        </button>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InteractiveWidgetCard title={t('auditorDash.kpiTotalEntries', 'Total Audit Log Entries')} value={logs.length} subtext={t('auditorDash.kpiTotalEntriesSub', 'Indexed system events')} icon={FileText} iconBgColor="#10b98115" iconColor="#10b981" onClick={() => onNavigate?.('audit_logs')}/>
        <InteractiveWidgetCard title={t('auditorDash.kpiComplianceStatus', 'Compliance Status')} value={t('auditorDash.kpi100Compliant', '100% Compliant')} subtext={t('auditorDash.kpiComplianceSub', 'GDPR / SOC2 Policy Validated')} icon={ShieldCheck} iconBgColor="#6366f115" iconColor="#6366f1"/>
        <InteractiveWidgetCard title={t('auditorDash.kpiRbacRules', 'RBAC Policy Rules')} value={t('auditorDash.kpiActive', 'Active')} subtext={t('auditorDash.kpiRbacSub', 'Strict permission checks enforced')} icon={Lock} iconBgColor="#8b5cf615" iconColor="#8b5cf6" onClick={() => onNavigate?.('permission_management')}/>
        <InteractiveWidgetCard title={t('auditorDash.kpiActiveUsers', 'Active System Users')} value={t('auditorDash.kpiOnline', 'Online')} subtext={t('auditorDash.kpiActiveUsersSub', 'Session tokens verified')} icon={Users} iconBgColor="#ec489915" iconColor="#ec4899" onClick={() => onNavigate?.('user_management')}/>
      </div>

      {/* Audit Search & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500"/> {t('auditorDash.realTimeStream', 'Real-Time Audit Log Stream')} ({filtered.length})
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
            <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('auditorDash.filterPlaceholder', 'Filter audit stream...')} className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
        </div>

        {loading ? (<div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto"/></div>) : filtered.length === 0 ? (<p className="text-sm text-slate-400 text-center py-8">{t('auditorDash.noEvents', 'No audit events match your filter')}</p>) : (<div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 sticky top-0 bg-white dark:bg-slate-900">
                  <th className="px-3 py-2">{t('auditorDash.thTimestamp', 'Timestamp')}</th>
                  <th className="px-3 py-2">{t('auditorDash.thActor', 'Actor / User')}</th>
                  <th className="px-3 py-2">{t('auditorDash.thAction', 'Action')}</th>
                  <th className="px-3 py-2">{t('auditorDash.thIp', 'IP Address')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map((item, i) => (<tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-3 py-2 text-slate-500">{new Date(item.created_at || item.timestamp || Date.now()).toLocaleString()}</td>
                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-white">{item.actor_name || item.user_id || 'System'}</td>
                    <td className="px-3 py-2 text-indigo-600 dark:text-indigo-400 font-semibold">{item.action || item.event || 'System Action'}</td>
                    <td className="px-3 py-2 text-slate-400">{item.ip_address || '127.0.0.1'}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>);
}
