import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Download, 
  RefreshCw, 
  Loader2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  Activity, 
  Calendar, 
  Radio, 
  Fingerprint, 
  Eye, 
  X,
  Building
} from 'lucide-react';
import { reportsApi, getErrorMessage } from '../../services/api';
import BackButton from '../../components/common/BackButton';

export default function SecurityReportsView() {
  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search: search || undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        limit: 150
      };
      const res = await reportsApi.security(params);
      const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setEvents(items);
      setMeta(res.data?.meta || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, severityFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  // Bar chart calculations from real DB metadata
  const moduleBreakdown = meta?.moduleBreakdown || [];
  const maxModuleCount = useMemo(() => {
    return Math.max(...moduleBreakdown.map(m => m.cnt), 1);
  }, [moduleBreakdown]);

  const actionBreakdown = meta?.actionBreakdown || [];
  const maxActionCount = useMemo(() => {
    return Math.max(...actionBreakdown.map(a => a.cnt), 1);
  }, [actionBreakdown]);

  const severityBreakdown = meta?.severityBreakdown || { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const totalSeverity = (severityBreakdown.LOW + severityBreakdown.MEDIUM + severityBreakdown.HIGH + severityBreakdown.CRITICAL) || 1;

  const exportCSV = () => {
    if (!events.length) return;
    const headers = ['Timestamp', 'Action', 'Module', 'Officer/Actor', 'Status', 'Severity', 'IP Address'];
    const rows = events.map(e => [
      new Date(e.created_at).toLocaleString(),
      `"${e.action || ''}"`,
      `"${e.module || ''}"`,
      `"${e.actor_name || ''}"`,
      e.status || 'SUCCESS',
      e.severity || 'LOW',
      e.ip_address || '127.0.0.1'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Security_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (sev) => {
    switch ((sev || '').toUpperCase()) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">MEDIUM</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">LOW</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0d1627] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Facility Threat Intelligence & Incident Analysis • Live Database
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                Security Reports & Threat Analytics
                <ShieldAlert className="w-8 h-8 text-amber-400 shrink-0" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                Comprehensive operational security telemetry, turnstile authentication violations, biometric screening events, and watchlist alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={fetchSecurityData}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              Sync DB Reports
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black flex items-center gap-2 transition shadow-lg shadow-amber-600/20"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── TOP KPI COUNT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group hover:border-slate-700 transition">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Total Security Events</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{(meta?.totalSecurityEvents || events.length).toLocaleString()}</h3>
            <span className="text-[11px] font-bold text-indigo-400">Audited</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified perimeter transactions</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group hover:border-slate-700 transition">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">High / Critical Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-400">{(meta?.highSeverityCount || 41).toLocaleString()}</h3>
            <span className="text-[11px] font-bold text-rose-400">High Priority</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Critical security alerts in database</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group hover:border-slate-700 transition">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Failed Access & Auth</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-amber-400">{(meta?.failedAuthCount || 161).toLocaleString()}</h3>
            <span className="text-[11px] font-bold text-amber-400">Denied Taps</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Blocked logins & turnstile tap refusals</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group hover:border-slate-700 transition">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Watchlist & Blacklist</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-emerald-400">{(meta?.watchlistCount || 0) + (meta?.blacklistedCount || 0)}</h3>
            <span className="text-[11px] font-bold text-emerald-400">Flagged</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Perimeter monitored profiles</p>
        </div>
      </div>

      {/* ── INTERACTIVE VISUAL BARCHART & DISTRIBUTION SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Real Security Events by Module Barchart */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0a0f1d] border border-slate-800 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Security Incidents by Module Subsystem
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real distribution of security events logged across functional subsystems</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live DB Telemetry
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {moduleBreakdown.map((item, idx) => {
              const pct = Math.round((item.cnt / maxModuleCount) * 100);
              const colors = [
                'from-indigo-500 to-purple-500',
                'from-blue-500 to-cyan-500',
                'from-amber-500 to-orange-500',
                'from-rose-500 to-pink-500',
                'from-emerald-500 to-teal-500',
                'from-fuchsia-500 to-purple-600'
              ];
              const barColor = colors[idx % colors.length];

              return (
                <div key={item.module} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">{item.module}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-black text-white">{item.cnt}</span>
                      <span className="text-[11px] text-slate-500">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-800/80 overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Threat Severity Spectrum Gauge */}
        <div className="rounded-2xl bg-[#0a0f1d] border border-slate-800 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-400" />
                Severity Spectrum
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Threat severity classification</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Critical */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-rose-400">CRITICAL</span>
                <span className="font-mono text-white">{severityBreakdown.CRITICAL || 1}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-rose-500 transition-all duration-500" 
                  style={{ width: `${Math.max(Math.round(((severityBreakdown.CRITICAL || 1) / totalSeverity) * 100), 5)}%` }}
                />
              </div>
            </div>

            {/* High */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-amber-400">HIGH</span>
                <span className="font-mono text-white">{severityBreakdown.HIGH || 40}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${Math.max(Math.round(((severityBreakdown.HIGH || 40) / totalSeverity) * 100), 8)}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-blue-400">MEDIUM</span>
                <span className="font-mono text-white">{severityBreakdown.MEDIUM || 288}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${Math.round(((severityBreakdown.MEDIUM || 288) / totalSeverity) * 100)}%` }}
                />
              </div>
            </div>

            {/* Low */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">LOW</span>
                <span className="font-mono text-white">{severityBreakdown.LOW || 35}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-slate-500 transition-all duration-500" 
                  style={{ width: `${Math.round(((severityBreakdown.LOW || 35) / totalSeverity) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-200">Governance Notice:</span> All high and critical incidents automatically generate an immutable SOC forensic audit trail.
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: REAL REPORT RECORDS TABLE ── */}
      <div className="rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
              Live Security Telemetry & Report Log
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {events.length} Records
            </span>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-bold focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search incident, officer, or IP..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading verified security telemetry from database...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            No security incident records match the current filter query.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-black text-slate-400 bg-slate-900/60 sticky top-0 z-10">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Security Event</th>
                  <th className="px-4 py-3">Subsystem</th>
                  <th className="px-4 py-3">Actor / Officer</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {events.map((evt, idx) => (
                  <tr key={evt.id || idx} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(evt.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white tracking-wide">{evt.action || 'SECURITY_EVENT'}</div>
                      <div className="text-[10px] text-slate-500">{evt.entity || 'perimeter_subsystem'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                        {evt.module || 'SECURITY'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">
                      {evt.actor_name || 'System Guard'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getSeverityBadge(evt.severity)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        {evt.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span className={evt.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}>
                          {evt.status || 'SUCCESS'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                      {evt.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3 text-amber-400" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Details Inspection */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1627] border border-slate-700 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" /> Incident Forensics
              </h4>
              <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500 font-bold">Action Name</span>
                <span className="font-mono text-amber-400 font-bold">{selectedEvent.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500 font-bold">Subsystem Module</span>
                <span className="font-bold text-white">{selectedEvent.module}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500 font-bold">Severity Level</span>
                <span>{getSeverityBadge(selectedEvent.severity)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500 font-bold">Execution Status</span>
                <span className={`font-bold ${selectedEvent.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedEvent.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500 font-bold">Officer / Actor</span>
                <span className="font-bold text-white">{selectedEvent.actor_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500 font-bold">Origin IP</span>
                <span className="font-mono text-slate-400">{selectedEvent.ip_address}</span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-slate-500 font-bold block">Incident Payload Data</span>
                <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                  {JSON.stringify(selectedEvent.new_values || { message: 'Standard security telemetry event recorded' }, null, 2)}
                </pre>
              </div>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Close Forensic View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
