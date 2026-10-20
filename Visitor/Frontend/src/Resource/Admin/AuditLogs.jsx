import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Activity, FileText, Search, RefreshCw, Download, Eye, CheckCircle2, AlertTriangle, XCircle, Clock, User, Server, Globe, Calendar, Layers, ChevronLeft, ChevronRight, Copy, Check, X, Lock, UserCheck, UserX, Briefcase, Users, Key, Building, LogIn, FileCode, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../components/common/BackButton';
import { systemApi } from '../../services/api';
import { useResponseNavigation, RESPONSE_TYPES } from '../../modules/response';
const PROCESS_MAP = {
    AUTH: {
        label: 'Authentication',
        badgeBg: 'bg-cyan-500/10',
        badgeText: 'text-cyan-400',
        badgeBorder: 'border-cyan-500/20',
        icon: LogIn,
    },
    EMPLOYEE_MANAGEMENT: {
        label: 'Employee Management',
        badgeBg: 'bg-indigo-500/10',
        badgeText: 'text-indigo-400',
        badgeBorder: 'border-indigo-500/20',
        icon: Briefcase,
    },
    USER_MANAGEMENT: {
        label: 'User Management',
        badgeBg: 'bg-blue-500/10',
        badgeText: 'text-blue-400',
        badgeBorder: 'border-blue-500/20',
        icon: Users,
    },
    APPOINTMENTS: {
        label: 'Appointments',
        badgeBg: 'bg-emerald-500/10',
        badgeText: 'text-emerald-400',
        badgeBorder: 'border-emerald-500/20',
        icon: Calendar,
    },
    RBAC: {
        label: 'Roles & Access Control',
        badgeBg: 'bg-amber-500/10',
        badgeText: 'text-amber-400',
        badgeBorder: 'border-amber-500/20',
        icon: Lock,
    },
    CHECKIN: {
        label: 'Visitor Check-In',
        badgeBg: 'bg-teal-500/10',
        badgeText: 'text-teal-400',
        badgeBorder: 'border-teal-500/20',
        icon: UserCheck,
    },
    CHECKOUT: {
        label: 'Visitor Check-Out',
        badgeBg: 'bg-sky-500/10',
        badgeText: 'text-sky-400',
        badgeBorder: 'border-sky-500/20',
        icon: UserX,
    },
    VISITOR_REGISTRATION: {
        label: 'Visitor Registration',
        badgeBg: 'bg-purple-500/10',
        badgeText: 'text-purple-400',
        badgeBorder: 'border-purple-500/20',
        icon: FileText,
    },
    VISITOR_PROFILE: {
        label: 'Visitor Profiles',
        badgeBg: 'bg-violet-500/10',
        badgeText: 'text-violet-400',
        badgeBorder: 'border-violet-500/20',
        icon: User,
    },
    VISITORS: {
        label: 'Visitor Core',
        badgeBg: 'bg-teal-500/10',
        badgeText: 'text-teal-400',
        badgeBorder: 'border-teal-500/20',
        icon: Users,
    },
    ORGANIZATIONS: {
        label: 'Organizations',
        badgeBg: 'bg-fuchsia-500/10',
        badgeText: 'text-fuchsia-400',
        badgeBorder: 'border-fuchsia-500/20',
        icon: Building,
    },
    DEPARTMENTS: {
        label: 'Departments',
        badgeBg: 'bg-pink-500/10',
        badgeText: 'text-pink-400',
        badgeBorder: 'border-pink-500/20',
        icon: Layers,
    },
    DEPARTMENT_MANAGER: {
        label: 'Department Portal',
        badgeBg: 'bg-rose-500/10',
        badgeText: 'text-rose-400',
        badgeBorder: 'border-rose-500/20',
        icon: Briefcase,
    },
    APPROVALS: {
        label: 'Approval Workflows',
        badgeBg: 'bg-lime-500/10',
        badgeText: 'text-lime-400',
        badgeBorder: 'border-lime-500/20',
        icon: CheckCircle2,
    },
    PERMISSION: {
        label: 'Permission Matrix',
        badgeBg: 'bg-yellow-500/10',
        badgeText: 'text-yellow-400',
        badgeBorder: 'border-yellow-500/20',
        icon: Key,
    },
    SECURITY: {
        label: 'Security Operations',
        badgeBg: 'bg-red-500/10',
        badgeText: 'text-red-400',
        badgeBorder: 'border-red-500/20',
        icon: ShieldAlert,
    },
    IDENTITY_VERIFICATION: {
        label: 'Identity Verification',
        badgeBg: 'bg-emerald-500/10',
        badgeText: 'text-emerald-400',
        badgeBorder: 'border-emerald-500/20',
        icon: ShieldCheck,
    },
};
export default function AuditLogs() {
    const { toResponse, toError } = useResponseNavigation();
    // State
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    // Filters
    const [selectedProcess, setSelectedProcess] = useState('ALL');
    const [selectedSeverity, setSelectedSeverity] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [selectedTimeframe, setSelectedTimeframe] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    // Selected Log for Inspector Modal
    const [inspectLog, setInspectLog] = useState(null);
    const [copiedId, setCopiedId] = useState(false);
    // Fetch Statistics
    const loadStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const res = await systemApi.getAuditStats();
            if (res.data && res.data.success) {
                setStats(res.data.data);
            }
        }
        catch (err) {
            console.warn('[AuditLogs] Failed to fetch audit stats:', err);
        }
        finally {
            setStatsLoading(false);
        }
    }, []);
    // Fetch Paginated Logs
    const loadLogs = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh)
                setRefreshing(true);
            else
                setLoading(true);
            const params = {
                page,
                limit,
                module: selectedProcess !== 'ALL' ? selectedProcess : undefined,
                severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
                status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
                search: searchQuery.trim() ? searchQuery.trim() : undefined,
            };
            if (selectedTimeframe === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                params.startDate = today.toISOString().slice(0, 19).replace('T', ' ');
            }
            else if (selectedTimeframe === '7d') {
                const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                params.startDate = d.toISOString().slice(0, 19).replace('T', ' ');
            }
            else if (selectedTimeframe === '30d') {
                const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                params.startDate = d.toISOString().slice(0, 19).replace('T', ' ');
            }
            const res = await systemApi.listAuditLogs(params);
            if (res.data && res.data.success) {
                setLogs(res.data.data || []);
                setTotal(res.data.pagination?.total || 0);
                setTotalPages(res.data.pagination?.totalPages || 1);
            }
            else if (Array.isArray(res.data?.data)) {
                setLogs(res.data.data);
                setTotal(res.data.data.length);
                setTotalPages(1);
            }
        }
        catch (err) {
            console.error('[AuditLogs] Error loading audit logs:', err);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, limit, selectedProcess, selectedSeverity, selectedStatus, selectedTimeframe, searchQuery]);
    useEffect(() => {
        loadStats();
    }, [loadStats]);
    useEffect(() => {
        loadLogs();
    }, [loadLogs]);
    // Export Audit Logs (CSV)
    const handleExportCSV = async () => {
        try {
            const res = await systemApi.exportAuditLogs({
                module: selectedProcess !== 'ALL' ? selectedProcess : undefined,
                severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
                status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
                search: searchQuery.trim() ? searchQuery.trim() : undefined,
            });
            const records = res.data?.data || logs;
            if (!records || records.length === 0) {
                toResponse({
                    type: RESPONSE_TYPES.INFORMATIONAL,
                    title: 'No Audit Records to Export',
                    message: 'There are no audit logs matching your current filter criteria to export.',
                    targetEntity: 'Audit Trail Export',
                    returnUrl: window.location.pathname + window.location.search
                });
                return;
            }
            const headers = ['ID', 'Timestamp', 'Process/Module', 'Event Action', 'Entity', 'Actor', 'IP Address', 'Severity', 'Status'];
            const rows = records.map((r) => [
                r.id || r.audit_id,
                `"${r.created_at}"`,
                `"${r.module}"`,
                `"${r.action}"`,
                `"${r.entity}"`,
                `"${r.actor_name || ''}"`,
                `"${r.ip_address || '127.0.0.1'}"`,
                `"${r.severity}"`,
                `"${r.status}"`,
            ]);
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `system_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        catch (err) {
            toError(err, {
                title: 'Audit Log Export Failed',
                message: 'An error occurred while compiling and exporting the audit logs.',
                returnUrl: window.location.pathname + window.location.search
            });
        }
    };
    // Copy JSON to clipboard
    const handleCopyJson = (content) => {
        navigator.clipboard.writeText(JSON.stringify(content, null, 2));
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };
    // Helper formatting for timestamps
    const formatTimestamp = (ts) => {
        try {
            const d = new Date(ts);
            if (isNaN(d.getTime()))
                return ts;
            return d.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });
        }
        catch {
            return ts;
        }
    };
    // Status Badge Rendering
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'SUCCESS':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3"/> Success
          </span>);
            case 'FAILED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3"/> Failed
          </span>);
            case 'UNAUTHORIZED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Lock className="w-3 h-3"/> Denied
          </span>);
            case 'ERROR':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3"/> Error
          </span>);
            default:
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
            {status}
          </span>);
        }
    };
    // Severity Badge Rendering
    const renderSeverityBadge = (severity) => {
        switch (severity) {
            case 'CRITICAL':
                return (<span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-950/90 text-rose-300 border border-rose-700/60 shadow-sm shadow-rose-900/50">
            Critical
          </span>);
            case 'HIGH':
                return (<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-400 border border-amber-700/50">
            High
          </span>);
            case 'MEDIUM':
                return (<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950/70 text-blue-400 border border-blue-700/40">
            Medium
          </span>);
            default:
                return (<span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/50">
            Low
          </span>);
        }
    };
    // Process Badge
    const renderProcessBadge = (moduleKey) => {
        const meta = PROCESS_MAP[moduleKey] || {
            label: moduleKey.replace(/_/g, ' '),
            badgeBg: 'bg-slate-800',
            badgeText: 'text-slate-300',
            badgeBorder: 'border-slate-700',
            icon: Activity,
        };
        const IconComp = meta.icon;
        return (<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
        <IconComp className="w-3.5 h-3.5 shrink-0"/>
        <span className="truncate max-w-[130px]">{meta.label}</span>
      </span>);
    };
    // Top Process Quick Filter List
    const processTabs = useMemo(() => {
        const defaultList = [
            { id: 'ALL', label: 'All Processes', count: stats?.totalEvents || 0 },
            { id: 'AUTH', label: 'Authentication', count: 0 },
            { id: 'EMPLOYEE_MANAGEMENT', label: 'Employees', count: 0 },
            { id: 'USER_MANAGEMENT', label: 'User Admin', count: 0 },
            { id: 'APPOINTMENTS', label: 'Appointments', count: 0 },
            { id: 'RBAC', label: 'Roles & RBAC', count: 0 },
            { id: 'CHECKIN', label: 'Check-In/Out', count: 0 },
            { id: 'ORGANIZATIONS', label: 'Organizations', count: 0 },
            { id: 'APPROVALS', label: 'Approvals', count: 0 },
            { id: 'SECURITY', label: 'Security Ops', count: 0 },
        ];
        if (!stats || !stats.moduleBreakdown)
            return defaultList;
        return defaultList.map((tab) => {
            if (tab.id === 'ALL')
                return tab;
            const matched = stats.moduleBreakdown.find((m) => m.module === tab.id);
            return {
                ...tab,
                count: matched ? Number(matched.count) : 0,
            };
        });
    }, [stats]);
    return (<div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. HEADER SECTION & ACTIONS                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl text-slate-100 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"/>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/admin/dashboard"/>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-400"/>
                <h1 className="text-2xl font-black tracking-tight text-white font-mono">
                  Enterprise Audit Trail
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full uppercase tracking-wider">
                  Live Stream
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Real-time chronological verification of system events, security mutations, and lifecycle actions across all processes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={() => {
            loadStats();
            loadLogs(true);
        }} disabled={refreshing} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer" title="Refresh audit stream">
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`}/>
              <span>{refreshing ? 'Syncing...' : 'Sync Logs'}</span>
            </button>

            <button onClick={handleExportCSV} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer">
              <Download className="w-3.5 h-3.5"/>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. KPI METRICS CARDS (5 ADMIN METRIC CARDS)                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Audit Events */}
        <div className="border rounded-2xl p-4 sm:p-5 min-h-[136px] flex flex-col justify-between relative overflow-hidden bg-slate-900/90 border-slate-800 shadow-lg shadow-black/40">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-indigo-500 rounded-l-2xl shadow-[0_0_12px_#6366f1]"/>
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Total Audit Events</span>
            <div className="w-8 h-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4"/>
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
              {statsLoading ? '...' : (stats?.totalEvents ?? 0).toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded database mutations</p>
          </div>
        </div>

        {/* Events Today */}
        <div className="border rounded-2xl p-4 sm:p-5 min-h-[136px] flex flex-col justify-between relative overflow-hidden bg-slate-900/90 border-slate-800 shadow-lg shadow-black/40">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-cyan-500 rounded-l-2xl shadow-[0_0_12px_#06b6d4]"/>
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Activity Today</span>
            <div className="w-8 h-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-cyan-400">
              <Clock className="w-4 h-4"/>
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
              {statsLoading ? '...' : (stats?.eventsToday ?? 0).toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Events logged past 24 hours</p>
          </div>
        </div>

        {/* High & Critical Security Events */}
        <div className="border rounded-2xl p-4 sm:p-5 min-h-[136px] flex flex-col justify-between relative overflow-hidden bg-slate-900/90 border-slate-800 shadow-lg shadow-black/40">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-rose-500 rounded-l-2xl shadow-[0_0_12px_#f43f5e]"/>
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">High Risk Events</span>
            <div className="w-8 h-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4"/>
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
              {statsLoading ? '...' : ((stats?.criticalEvents ?? 0) + (stats?.highEvents ?? 0)).toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Critical & high severity alerts</p>
          </div>
        </div>

        {/* Integrity & Success Rate */}
        <div className="border rounded-2xl p-4 sm:p-5 min-h-[136px] flex flex-col justify-between relative overflow-hidden bg-slate-900/90 border-slate-800 shadow-lg shadow-black/40">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-emerald-500 rounded-l-2xl shadow-[0_0_12px_#10b981]"/>
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Integrity Rate</span>
            <div className="w-8 h-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4"/>
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
              {statsLoading ? '...' : `${stats?.successRate ?? 100}%`}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Successful operational events</p>
          </div>
        </div>

        {/* Distinct Active Processes */}
        <div className="border rounded-2xl p-4 sm:p-5 min-h-[136px] flex flex-col justify-between relative overflow-hidden bg-slate-900/90 border-slate-800 shadow-lg shadow-black/40">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-purple-500 rounded-l-2xl shadow-[0_0_12px_#a855f7]"/>
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Monitored Processes</span>
            <div className="w-8 h-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-purple-400">
              <Layers className="w-4 h-4"/>
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
              {statsLoading ? '...' : (stats?.activeProcesses ?? 0).toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Active business modules</p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PROCESS QUICK FILTER TABS                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {processTabs.map((tab) => {
            const isSelected = selectedProcess === tab.id;
            return (<button key={tab.id} onClick={() => {
                    setSelectedProcess(tab.id);
                    setPage(1);
                }} className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}>
              <span>{tab.label}</span>
              {tab.count > 0 && (<span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isSelected ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>)}
            </button>);
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. SEARCH & MULTI-FACETED FILTERS BAR                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Free Text Search */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"/>
            <input type="text" placeholder="Search by action, actor, IP, entity..." value={searchQuery} onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
        }} className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"/>
            {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5"/>
              </button>)}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Severity:</span>
              <select value={selectedSeverity} onChange={(e) => {
            setSelectedSeverity(e.target.value);
            setPage(1);
        }} className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                <option value="ALL">All Severities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Status:</span>
              <select value={selectedStatus} onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
        }} className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="UNAUTHORIZED">Denied</option>
                <option value="ERROR">Error</option>
              </select>
            </div>

            {/* Timeframe Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Timeframe:</span>
              <select value={selectedTimeframe} onChange={(e) => {
            setSelectedTimeframe(e.target.value);
            setPage(1);
        }} className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                <option value="ALL">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(selectedProcess !== 'ALL' || selectedSeverity !== 'ALL' || selectedStatus !== 'ALL' || selectedTimeframe !== 'ALL' || searchQuery) && (<button onClick={() => {
                setSelectedProcess('ALL');
                setSelectedSeverity('ALL');
                setSelectedStatus('ALL');
                setSelectedTimeframe('ALL');
                setSearchQuery('');
                setPage(1);
            }} className="px-2.5 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer">
                <X className="w-3.5 h-3.5"/>
                <span>Reset</span>
              </button>)}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. AUDIT RECORDS STREAM TABLE                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 border-b border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-400">
              <tr>
                <th className="p-4 w-44">Timestamp</th>
                <th className="p-4 w-48">Process / Module</th>
                <th className="p-4">Event Action</th>
                <th className="p-4 w-48">Actor Profile</th>
                <th className="p-4 w-32">Resource</th>
                <th className="p-4 w-28">Severity</th>
                <th className="p-4 w-28">Status</th>
                <th className="p-4 w-36">Origin IP</th>
                <th className="p-4 w-16 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {loading ? (<tr>
                  <td colSpan={9} className="p-16 text-center text-slate-500 font-sans">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
                      <span className="text-xs font-semibold text-slate-400">
                        Loading verified audit events from database...
                      </span>
                    </div>
                  </td>
                </tr>) : logs.length === 0 ? (<tr>
                  <td colSpan={9} className="p-16 text-center text-slate-500 font-sans">
                    <Shield className="h-10 w-10 mx-auto mb-2 text-slate-700"/>
                    <p className="font-bold text-slate-300 text-sm">No audit records match the selected filters</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try clearing or adjusting search queries, module filters, or date range
                    </p>
                  </td>
                </tr>) : (logs.map((record) => (<tr key={record.id || record.audit_id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Timestamp */}
                    <td className="p-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0"/>
                        <span>{formatTimestamp(record.created_at)}</span>
                      </div>
                    </td>

                    {/* Process / Module Badge */}
                    <td className="p-4 font-sans">{renderProcessBadge(record.module)}</td>

                    {/* Action */}
                    <td className="p-4 font-sans font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 text-xs">{record.action}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="p-4 font-sans">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-[10px] font-bold shrink-0">
                          {record.actor_avatar ? (<img src={record.actor_avatar} alt="Avatar" className="w-full h-full rounded-full object-cover"/>) : (<User className="w-3 h-3 text-indigo-400"/>)}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-200 text-xs truncate">
                            {record.actor_name || (record.actor_id ? `User #${record.actor_id}` : 'System')}
                          </div>
                          {record.actor_role && (<div className="text-[10px] text-slate-500 font-mono uppercase">{record.actor_role}</div>)}
                        </div>
                      </div>
                    </td>

                    {/* Resource / Entity */}
                    <td className="p-4 font-mono text-[11px] text-slate-400">
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                        {record.entity}
                        {record.record_id ? ` #${record.record_id}` : ''}
                      </span>
                    </td>

                    {/* Severity */}
                    <td className="p-4">{renderSeverityBadge(record.severity)}</td>

                    {/* Status */}
                    <td className="p-4">{renderStatusBadge(record.status)}</td>

                    {/* Origin IP */}
                    <td className="p-4 font-mono text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-slate-600 shrink-0"/>
                        <span>{record.ip_address || '127.0.0.1'}</span>
                      </div>
                    </td>

                    {/* Actions: Inspect */}
                    <td className="p-4 text-right">
                      <button onClick={() => setInspectLog(record)} className="w-7 h-7 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 flex items-center justify-center transition-all cursor-pointer shadow-sm" title="Inspect Event Payload">
                        <Eye className="w-3.5 h-3.5"/>
                      </button>
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 6. PAGINATION CONTROLS                                              */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-400 font-sans">
            <span>
              Showing <strong className="text-white">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to{' '}
              <strong className="text-white">{Math.min(page * limit, total)}</strong> of{' '}
              <strong className="text-white">{total.toLocaleString()}</strong> events
            </span>

            <div className="flex items-center gap-1.5 ml-4">
              <span>Rows per page:</span>
              <select value={limit} onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
        }} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer" title="Previous Page">
              <ChevronLeft className="w-4 h-4"/>
            </button>

            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200">
              Page {page} of {totalPages}
            </span>

            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer" title="Next Page">
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. EVENT INSPECTOR MODAL DRAWER                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {inspectLog && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {renderProcessBadge(inspectLog.module)}
                    {renderSeverityBadge(inspectLog.severity)}
                    {renderStatusBadge(inspectLog.status)}
                  </div>
                  <h2 className="text-xl font-black text-white font-mono mt-1">{inspectLog.action}</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Event Reference ID: <span className="text-cyan-400">#AUD-{inspectLog.id || inspectLog.audit_id}</span> •{' '}
                    Timestamp: {formatTimestamp(inspectLog.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleCopyJson(inspectLog)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer" title="Copy event payload">
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                    <span>{copiedId ? 'Copied' : 'Copy JSON'}</span>
                  </button>

                  <button onClick={() => setInspectLog(null)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer">
                    <X className="w-5 h-5"/>
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Context Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-400"/> Actor
                    </span>
                    <p className="text-sm font-bold text-white mt-1">{inspectLog.actor_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{inspectLog.actor_email || 'System Authenticated'}</p>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-cyan-400"/> Origin IP
                    </span>
                    <p className="text-sm font-bold font-mono text-white mt-1">{inspectLog.ip_address || '127.0.0.1'}</p>
                    <p className="text-[11px] text-slate-400">{inspectLog.browser || inspectLog.device || 'Direct Network'}</p>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-400"/> Target Resource
                    </span>
                    <p className="text-sm font-bold text-white mt-1">{inspectLog.entity}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {inspectLog.record_id ? `Record #${inspectLog.record_id}` : 'General Process'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Server className="w-3.5 h-3.5 text-amber-400"/> Request Route
                    </span>
                    <p className="text-sm font-bold font-mono text-white mt-1 truncate">
                      {inspectLog.http_method || 'INTERNAL'} {inspectLog.endpoint || '/api'}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-mono">Cryptographically Audited</p>
                  </div>
                </div>

                {/* Diff Viewer (Old Values vs New Values) */}
                {(inspectLog.old_values || inspectLog.new_values) && (<div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-indigo-400"/> Mutation State Inspection (Diff)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Old State */}
                      <div className="bg-slate-950 border border-rose-900/30 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between border-b border-rose-900/20 pb-2">
                          <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5"/> Previous State (Before)
                          </span>
                        </div>
                        <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56 p-2 bg-slate-900/50 rounded-xl">
                          {inspectLog.old_values
                    ? JSON.stringify(inspectLog.old_values, null, 2)
                    : '<No prior state recorded>'}
                        </pre>
                      </div>

                      {/* New State */}
                      <div className="bg-slate-950 border border-emerald-900/30 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between border-b border-emerald-900/20 pb-2">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5"/> Resulting State (After)
                          </span>
                        </div>
                        <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56 p-2 bg-slate-900/50 rounded-xl">
                          {inspectLog.new_values
                    ? JSON.stringify(inspectLog.new_values, null, 2)
                    : '<No new mutation payload>'}
                        </pre>
                      </div>
                    </div>
                  </div>)}

                {/* Metadata Payload */}
                {inspectLog.metadata_json && !inspectLog.new_values && (<div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400"/> Additional Metadata Payload
                    </h3>
                    <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60">
                      {JSON.stringify(inspectLog.metadata_json, null, 2)}
                    </pre>
                  </div>)}

                {/* Chain of Custody Stamp */}
                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400"/>
                    <span>Permanent tamper-resistant compliance record maintained by Enterprise VMS engine</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Node Cluster: vms-cluster-01</span>
                </div>
              </div>
            </motion.div>
          </div>)}
      </AnimatePresence>
    </div>);
}
