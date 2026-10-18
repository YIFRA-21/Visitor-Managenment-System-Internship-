import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Sliders,
  Check,
  X,
  Radio,
  Building
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { securityApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VisitorMovement() {
  const { t, tStatus, language } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [gateFilter, setGateFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [feedback, setFeedback] = useState(null);

  // Simulation Modal
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simForm, setSimForm] = useState({
    visitor_name: 'Belay Tesfaye',
    badge_code: 'VMS-1042',
    checkpoint_gate: 'Gate 1 — Main Lobby Turnstile',
    direction: 'ENTRY',
    access_level: 'Level 2: General Workspace & Meeting Rooms',
    granted: true
  });
  const [simulating, setSimulating] = useState(false);

  const fetchLogs = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await securityApi.getAccessLogs({
        gate: gateFilter !== 'ALL' ? gateFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined
      });
      const data = res.data?.data || res.data || [];
      setLogs(Array.isArray(data) ? data : []);
      if (res.data?.counts) {
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to synchronize live access logs.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gateFilter, statusFilter, search]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => fetchLogs(true), 15000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleSimulateTap = async (e) => {
    e.preventDefault();
    setSimulating(true);
    try {
      await securityApi.simulateAccessEvent(simForm);
      setShowSimulateModal(false);
      setFeedback({
        type: 'success',
        message: `Simulated ${simForm.direction} event for ${simForm.visitor_name} recorded into SOC access logs.`
      });
      fetchLogs(true);
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSimulating(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Timestamp', 'Visitor Name', 'Company', 'Badge Code', 'Gate', 'Direction', 'Status', 'Clearance Level', 'Officer'];
    const rows = filteredLogs.map((l) => [
      new Date(l.timestamp).toLocaleString(),
      `"${l.visitor_name || ''}"`,
      `"${l.visitor_company || ''}"`,
      l.badge_code || '',
      `"${l.checkpoint_gate || ''}"`,
      l.direction || 'ENTRY',
      l.access_status || 'GRANTED',
      `"${l.access_level || ''}"`,
      `"${l.officer_name || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Access_Control_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((l) => {
    if (directionFilter !== 'ALL' && l.direction !== directionFilter) return false;
    return true;
  });

  const totalEvents = counts?.totalEvents ?? logs.length;
  const entriesCount = counts?.entriesCount ?? logs.filter((l) => l.direction === 'ENTRY' && l.access_status === 'GRANTED').length;
  const exitsCount = counts?.exitsCount ?? logs.filter((l) => l.direction === 'EXIT' || l.access_status === 'CHECKED_OUT' || l.event_type === 'CHECK_OUT').length;
  const denialsCount = counts?.denialsCount ?? logs.filter((l) => l.access_status === 'DENIED').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0d1627] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-extrabold tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
                Facility Access & Perimeter Audit Stream • Live
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {language === 'am' ? 'የመዳረሻና የመንቀሳቀሻ ምዝግብ ማስታወሻዎች' : 'Access Logs & Movement Audit'}
                <Navigation className="w-7 h-7 text-blue-400 shrink-0" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                Live sensor audit trail for physical turnstile taps, badge swipes, zone transitions, and security clearance verifications across all campus checkpoints.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              {language === 'am' ? 'አድስ' : 'Sync Live'}
            </button>

            <button
              onClick={() => setShowSimulateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold tracking-wide shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              Simulate Gate Tap
            </button>

            <button
              onClick={exportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 4 ANIMATED KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Total Audit Events</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{totalEvents}</h3>
            <span className="text-[11px] font-bold text-slate-400">Transactions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Perimeter & turnstile records</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Entries Granted</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{entriesCount}</h3>
            <span className="text-[11px] font-bold text-emerald-400">Passage OK</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Inbound verified visitors</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Exits Processed</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ArrowUpRight className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-purple-400">{exitsCount}</h3>
            <span className="text-[11px] font-bold text-slate-400">Completed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Departed through gate</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-rose-900/40 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Access Denials</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-400">{denialsCount}</h3>
            <span className="text-[11px] font-bold text-rose-400">Intercepted</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Insufficient clearance</p>
        </motion.div>
      </div>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search access logs by visitor name, company, or badge token..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Gate filter */}
          <select
            value={gateFilter}
            onChange={(e) => setGateFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Gates & Turnstiles</option>
            <option value="Gate 1">Gate 1 — Main Lobby Turnstile</option>
            <option value="Turnstile">Turnstile Speed Gates</option>
            <option value="Elevator">Elevator Bank Turnstiles</option>
            <option value="Executive">Executive Wing Security Door</option>
            <option value="Server">Datacenter / Server Room</option>
          </select>

          {/* Direction filter */}
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Directions</option>
            <option value="ENTRY">Inbound (Entry)</option>
            <option value="EXIT">Outbound (Exit)</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="GRANTED">Granted ✓</option>
            <option value="DENIED">Denied ✗</option>
            <option value="CHECKED_OUT">Checked Out</option>
          </select>
        </div>
      </div>

      {/* ── ACCESS LOGS DATA TABLE ── */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
              <tr>
                <th className="py-4 px-5">Visitor & Organization</th>
                <th className="py-4 px-4">Badge / Token</th>
                <th className="py-4 px-4">Gate & Checkpoint</th>
                <th className="py-4 px-4">Direction</th>
                <th className="py-4 px-4">Access Status</th>
                <th className="py-4 px-4">Clearance Level</th>
                <th className="py-4 px-4">Officer on Duty</th>
                <th className="py-4 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Synchronizing live turnstile access logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No access events found matching selected criteria
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isGranted = log.access_status === 'GRANTED';
                  const isExit = log.direction === 'EXIT' || log.access_status === 'CHECKED_OUT';
                  return (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {(log.visitor_name || 'V').charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-white text-xs">{log.visitor_name || 'Visitor'}</p>
                            <p className="text-[10px] text-slate-400">{log.visitor_company || 'Guest'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        {log.badge_code || 'VMS-1001'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{log.checkpoint_gate || 'Gate 1 — Main Lobby Turnstile'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isExit
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {isExit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {log.direction || (isExit ? 'EXIT' : 'ENTRY')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isGranted
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : log.access_status === 'CHECKED_OUT'
                              ? 'bg-slate-800 text-slate-300 border border-slate-700'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {isGranted ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {log.access_status || 'GRANTED'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {log.access_level || 'Level 2: General Workspace'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {log.officer_name || 'SOC Officer'}
                      </td>

                      <td className="py-3.5 px-5 text-right font-mono text-[11px] text-slate-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SIMULATE TAP MODAL ── */}
      <AnimatePresence>
        {showSimulateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Simulate Turnstile RFID Tap</h3>
                    <p className="text-xs text-slate-400">Record a simulated physical access scan</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSimulateModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSimulateTap} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                    Visitor Subject Name
                  </label>
                  <input
                    type="text"
                    value={simForm.visitor_name}
                    onChange={(e) => setSimForm({ ...simForm, visitor_name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                      Badge / Pass Code
                    </label>
                    <input
                      type="text"
                      value={simForm.badge_code}
                      onChange={(e) => setSimForm({ ...simForm, badge_code: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                      Direction
                    </label>
                    <select
                      value={simForm.direction}
                      onChange={(e) => setSimForm({ ...simForm, direction: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="ENTRY">ENTRY (Inbound)</option>
                      <option value="EXIT">EXIT (Outbound)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                    Checkpoint Turnstile Gate
                  </label>
                  <select
                    value={simForm.checkpoint_gate}
                    onChange={(e) => setSimForm({ ...simForm, checkpoint_gate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="Gate 1 — Main Lobby Turnstile">Gate 1 — Main Lobby Turnstile</option>
                    <option value="Gate 2 — Elevator Bank Turnstiles">Gate 2 — Elevator Bank Turnstiles</option>
                    <option value="Gate 3 — Executive Wing Security Door">Gate 3 — Executive Wing Security Door</option>
                    <option value="Gate 4 — IT Datacenter / Server Room">Gate 4 — IT Datacenter / Server Room</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="font-bold text-white text-xs">Simulate Grant Access</p>
                    <p className="text-[10px] text-slate-400">Toggle off to simulate an unauthorized breach denial</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={simForm.granted}
                    onChange={(e) => setSimForm({ ...simForm, granted: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSimulateModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={simulating}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Record Tap Event</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
