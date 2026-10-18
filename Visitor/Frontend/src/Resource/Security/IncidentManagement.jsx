import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  RefreshCw,
  MapPin,
  User,
  Check,
  X,
  FileText,
  Radio,
  Flame,
  ShieldCheck,
  Eye,
  Trash2,
  RotateCcw,
  Activity,
  Shield,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function IncidentManagement() {
  const { t, language } = useLanguage();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Form State for new incident
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState('MODERATE');
  const [location, setLocation] = useState('Main Entrance Turnstile');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Resolution Modal State
  const [resolvingIncident, setResolvingIncident] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Dossier / Inspect Modal State
  const [inspectingIncident, setInspectingIncident] = useState(null);

  // Delete Confirmation State
  const [deletingIncident, setDeletingIncident] = useState(null);

  const fetchIncidents = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/security/incidents');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setIncidents(data);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to live security incident service.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const timer = setInterval(() => fetchIncidents(true), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Incident title is required.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.post('/security/incidents', {
        title: title.trim(),
        description: details.trim() || 'Logged via Security Command Console',
        severity,
        location: location.trim() || 'General Facility',
      });
      setFeedback({ type: 'success', message: 'Security incident logged successfully and dispatched to SOC.' });
      setTitle('');
      setDetails('');
      setSeverity('MODERATE');
      setShowForm(false);
      await fetchIncidents(true);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to log incident.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus, notes) => {
    setUpdatingId(id);
    try {
      await api.put(`/security/incidents/${id}`, {
        status: newStatus,
        notes: notes || undefined,
      });
      // Optimistic update
      setIncidents(prev =>
        prev.map(inc =>
          inc.id === id ? { ...inc, status: newStatus, resolutionNotes: notes || inc.resolutionNotes } : inc
        )
      );
      if (inspectingIncident && inspectingIncident.id === id) {
        setInspectingIncident(prev => ({ ...prev, status: newStatus, resolutionNotes: notes || prev.resolutionNotes }));
      }
      setFeedback({
        type: 'success',
        message: `Incident #${id} ${newStatus === 'RESOLVED' ? 'resolved and cleared' : 'marked as ' + newStatus.toLowerCase()}.`
      });
      setResolvingIncident(null);
      setResolutionNotes('');
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to update incident status.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickEscalate = async (incident) => {
    setUpdatingId(incident.id);
    try {
      await api.put(`/security/incidents/${incident.id}`, {
        severity: 'CRITICAL',
      });
      setIncidents(prev =>
        prev.map(inc => inc.id === incident.id ? { ...inc, severity: 'CRITICAL' } : inc)
      );
      if (inspectingIncident && inspectingIncident.id === incident.id) {
        setInspectingIncident(prev => ({ ...prev, severity: 'CRITICAL' }));
      }
      setFeedback({
        type: 'success',
        message: `Incident #${incident.id} escalated to CRITICAL priority. SOC alerts dispatched.`
      });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to escalate incident severity.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteIncident = async (id) => {
    setUpdatingId(id);
    try {
      await api.delete(`/security/incidents/${id}`);
      setIncidents(prev => prev.filter(inc => inc.id !== id));
      if (inspectingIncident && inspectingIncident.id === id) {
        setInspectingIncident(null);
      }
      setDeletingIncident(null);
      setFeedback({
        type: 'success',
        message: `Incident #${id} removed from active logs.`
      });
    } catch (err) {
      // Fallback: update status to CLOSED if DELETE isn't allowed
      try {
        await api.put(`/security/incidents/${id}`, { status: 'RESOLVED', notes: 'Closed and archived by officer.' });
        setIncidents(prev => prev.filter(inc => inc.id !== id));
        setDeletingIncident(null);
        setFeedback({ type: 'success', message: `Incident #${id} closed and archived.` });
      } catch (e2) {
        setFeedback({ type: 'error', message: 'Failed to delete incident record.' });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats calculation
  const totalCount = incidents.length;
  const criticalCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'CRITICAL').length;
  const openCount = incidents.filter(i => (i.status || '').toUpperCase() === 'OPEN').length;
  const investigatingCount = incidents.filter(i => (i.status || '').toUpperCase() === 'INVESTIGATING').length;
  const resolvedCount = incidents.filter(i => (i.status || '').toUpperCase() === 'RESOLVED').length;

  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchesSearch =
        searchQuery === '' ||
        (inc.title && inc.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.description && inc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.location && inc.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.incidentCode && inc.incidentCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.reportedByName && inc.reportedByName.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === 'CRITICAL') {
        matchesStatus = (inc.severity || '').toUpperCase() === 'CRITICAL';
      } else if (statusFilter !== 'ALL') {
        matchesStatus = (inc.status || '').toUpperCase() === statusFilter;
      }

      const matchesSeverity =
        severityFilter === 'ALL' || (inc.severity || '').toUpperCase() === severityFilter;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [incidents, searchQuery, statusFilter, severityFilter]);

  const getSeverityBadge = (sev) => {
    switch ((sev || '').toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            Critical Threat
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            High Alert
          </span>
        );
      case 'MODERATE':
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Radio className="w-3 h-3 text-cyan-400" />
            Moderate
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase bg-slate-800 text-slate-400 border border-slate-700">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (st) => {
    switch ((st || '').toUpperCase()) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Resolved
          </span>
        );
      case 'INVESTIGATING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse shadow-sm">
            <Clock className="w-3 h-3 text-amber-400" />
            Investigating
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm">
            <Flame className="w-3 h-3 text-rose-400" />
            Open Case
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO HEADER WITH CURVED WAVE ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0d1627] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

        {/* Ambient Wave SVG */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none w-96 h-48 overflow-hidden">
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0.00,49.98 C150.00,150.00 349.81,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" fill="#f43f5e"></path>
          </svg>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-extrabold tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                SOC Incident Dispatch & Live Audit Feed
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {t('submenu.security-incidents', 'Security Incident Management')}
                <ShieldAlert className="w-7 h-7 text-rose-500 animate-pulse shrink-0" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                Log perimeter breaches, access violations, tailgating incidents, and execute real-time incident resolution across all campus zones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fetchIncidents(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Refresh Incidents"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
              {t('form.refresh', 'Sync Live')}
            </button>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-extrabold tracking-wide shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {showForm ? t('form.cancel', 'Hide Form') : t('form.create', 'Log Incident Report')}
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST ALERT */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
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
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 4 ANIMATED KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onClick={() => { setStatusFilter('ALL'); setSeverityFilter('ALL'); }}
          className="cursor-pointer relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Total Logged</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{totalCount}</h3>
            <span className="text-[11px] font-bold text-slate-400">Cases</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total registered security reports</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onClick={() => setStatusFilter('CRITICAL')}
          className="cursor-pointer relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-rose-900/40 p-5 shadow-lg group transition-all hover:border-rose-500/40"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl group-hover:w-2.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-rose-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              Critical Threats
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{criticalCount}</h3>
            <span className="text-[11px] font-bold text-rose-400">High Risk</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Lockdown & perimeter threats</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onClick={() => setStatusFilter('INVESTIGATING')}
          className="cursor-pointer relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">Active Inquiry</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{investigatingCount}</h3>
            <span className="text-[11px] font-bold text-amber-400">Under Review</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Officers assigned on duty</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onClick={() => setStatusFilter('RESOLVED')}
          className="cursor-pointer relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">Resolved Cases</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{resolvedCount}</h3>
            <span className="text-[11px] font-bold text-emerald-400">Cleared</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Closed security clearances</p>
        </motion.div>
      </div>

      {/* ── CREATE INCIDENT FORM (COLLAPSIBLE / ANIMATED) ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b1220] to-[#0a0f1d] border border-rose-500/30 p-6 md:p-8 shadow-2xl relative">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Log Official Incident & Security Alert</h2>
                    <p className="text-xs text-slate-400">Dispatches instantly to SOC control and appends to permanent audit records.</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateIncident} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                    {t('form.incidentTitle', 'Incident Title')} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('placeholder.reason', 'e.g. Tailgating attempt at East Turnstile A, Unattended Baggage, False Badge Presentation')}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                    {t('form.threatLevel', 'Threat Severity Level')} <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].map((sev) => {
                      const isSelected = severity === sev;
                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setSeverity(sev)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border ${
                            isSelected
                              ? sev === 'CRITICAL'
                                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                                : sev === 'HIGH'
                                ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                                : sev === 'MODERATE'
                                ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/30'
                                : 'bg-slate-700 text-white border-slate-600'
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {sev}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                    {t('form.zoneCheckpoint', 'Zone / Facility Checkpoint')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('placeholder.address', 'e.g. Turnstile Gate East, Floor 2 Reception, Basement Server Room')}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all shadow-inner"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                    {t('form.observations', 'Detailed Observations & Protocol Action Taken')}
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={t('placeholder.notes', 'Describe sequence of events, identities involved, physical badge codes, or witness statements...')}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none shadow-inner"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                  >
                    {t('btn.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-extrabold tracking-wider uppercase shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {t('btn.submitting', 'Logging Incident...')}
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        {t('btn.dispatch', 'Dispatch Incident')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTERING & CONTROLS TOOLBAR ── */}
      <div className="rounded-2xl bg-[#0a0f1d] border border-slate-800 p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('placeholder.searchIncident', 'Search by code, title, checkpoint, or officer...')}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Severity Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            Threat:
          </span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500 font-semibold"
          >
            <option value="ALL">All Threat Levels</option>
            <option value="CRITICAL">Critical Threats</option>
            <option value="HIGH">High Alert</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { key: 'ALL', label: t('filter.allCases', 'All Cases'), count: totalCount },
            { key: 'CRITICAL', label: t('filter.critical', 'Critical'), count: criticalCount },
            { key: 'OPEN', label: t('status.open', 'Open'), count: openCount },
            { key: 'INVESTIGATING', label: t('status.active', 'Active'), count: investigatingCount },
            { key: 'RESOLVED', label: t('status.resolved', 'Resolved'), count: resolvedCount }
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RESPONSIVE HIGH-TECH INCIDENTS TABLE ── */}
      {loading ? (
        <div className="rounded-3xl bg-[#0a0f1d] border border-slate-800 p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500" />
          <p className="text-xs font-bold tracking-wider uppercase">Connecting to SOC Incident Telemetry...</p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-[#0a0f1d] border border-slate-800/80 p-12 text-center shadow-xl space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">No Security Incidents Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL'
              ? 'No security records match your current filter criteria. Try clearing search or severity filters.'
              : 'Perimeter and facility checkpoints report zero active security violations.'}
          </p>
          {(searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setSeverityFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="rounded-3xl bg-[#0a0f1d] border border-slate-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">Incident Code</th>
                  <th className="py-4 px-4 min-w-[260px]">Incident Details & Checkpoint</th>
                  <th className="py-4 px-4 min-w-[130px]">Severity Level</th>
                  <th className="py-4 px-4 min-w-[130px]">Status</th>
                  <th className="py-4 px-4 min-w-[160px]">Reported By & Time</th>
                  <th className="py-4 px-4 sm:px-6 text-right min-w-[200px]">Action Hub</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                <AnimatePresence>
                  {filteredIncidents.map((incident, idx) => {
                    const isUpdating = updatingId === incident.id;
                    const isResolved = (incident.status || '').toUpperCase() === 'RESOLVED';
                    const isInvestigating = (incident.status || '').toUpperCase() === 'INVESTIGATING';
                    const isCritical = (incident.severity || '').toUpperCase() === 'CRITICAL';
                    const formattedDate = incident.createdAt
                      ? new Date(incident.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Recently';

                    return (
                      <motion.tr
                        key={incident.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`hover:bg-slate-800/40 transition-colors group relative ${
                          isCritical ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        {/* Incident Code Column */}
                        <td className="py-4 px-4 sm:px-6 align-top">
                          <div className="flex items-center gap-2">
                            {/* Left colored pip */}
                            <div
                              className={`w-1.5 h-7 rounded-full shrink-0 ${
                                isCritical
                                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                                  : incident.severity === 'HIGH'
                                  ? 'bg-amber-500'
                                  : incident.severity === 'MODERATE'
                                  ? 'bg-cyan-500'
                                  : 'bg-slate-600'
                              }`}
                            />
                            <div>
                              <span className="font-mono text-xs font-black text-rose-400 tracking-wider px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 block w-fit">
                                {incident.incidentCode || `INC-2026-${String(incident.id).padStart(4, '0')}`}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                                #{incident.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Title & Checkpoint Column */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                              {incident.title}
                            </h4>
                            {incident.location && (
                              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[200px]">{incident.location}</span>
                              </div>
                            )}
                            {incident.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {incident.description}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Severity Column */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1.5">
                            {getSeverityBadge(incident.severity)}
                            {/* Threat mini-meter */}
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isCritical
                                    ? 'w-full bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                                    : incident.severity === 'HIGH'
                                    ? 'w-3/4 bg-amber-500'
                                    : incident.severity === 'MODERATE'
                                    ? 'w-1/2 bg-cyan-500'
                                    : 'w-1/4 bg-slate-600'
                                }`}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="py-4 px-4 align-top">
                          {getStatusBadge(incident.status)}
                          {incident.resolutionNotes && (
                            <span className="block text-[10px] text-emerald-400/80 truncate max-w-[140px] mt-1" title={incident.resolutionNotes}>
                              ✓ Note added
                            </span>
                          )}
                        </td>

                        {/* Reported By & Time Column */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1 text-slate-400">
                            <div className="flex items-center gap-1.5 font-bold text-slate-200">
                              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[130px]">{incident.reportedByName || 'Security Officer'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{formattedDate}</span>
                            </div>
                          </div>
                        </td>

                        {/* Action Hub Column with distinct color-coded icons */}
                        <td className="py-4 px-4 sm:px-6 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. Inspect / View Dossier Icon (Cyan) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setInspectingIncident(incident)}
                              title="Inspect Incident Dossier"
                              className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all shadow-sm"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>

                            {/* 2. Investigate Icon (Amber) */}
                            {!isResolved && !isInvestigating && (
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(incident.id, 'INVESTIGATING')}
                                title="Mark Case as Investigating"
                                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all shadow-sm disabled:opacity-50"
                              >
                                <Clock className="w-4 h-4" />
                              </motion.button>
                            )}

                            {/* 3. Resolve Case Icon (Emerald) */}
                            {!isResolved && (
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                disabled={isUpdating}
                                onClick={() => {
                                  setResolvingIncident(incident);
                                  setResolutionNotes('');
                                }}
                                title="Resolve & Clear Incident"
                                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all shadow-sm disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </motion.button>
                            )}

                            {/* 4. Escalate to Critical Icon (Rose) */}
                            {!isCritical && !isResolved && (
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                disabled={isUpdating}
                                onClick={() => handleQuickEscalate(incident)}
                                title="Escalate to Critical Threat Priority"
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all shadow-sm disabled:opacity-50"
                              >
                                <Flame className="w-4 h-4" />
                              </motion.button>
                            )}

                            {/* 5. Reopen Case Icon (Purple) */}
                            {isResolved && (
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(incident.id, 'OPEN')}
                                title="Reopen Security Case"
                                className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all shadow-sm disabled:opacity-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </motion.button>
                            )}

                            {/* 6. Delete / Archive Icon (Red) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={isUpdating}
                              onClick={() => setDeletingIncident(incident)}
                              title="Delete Incident Record"
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all shadow-sm disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="bg-slate-900/60 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Showing <strong>{filteredIncidents.length}</strong> of <strong>{totalCount}</strong> recorded security incidents</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="text-rose-400 font-bold">{criticalCount} Critical</span>
              <span className="text-amber-400 font-bold">{investigatingCount} Active</span>
              <span className="text-emerald-400 font-bold">{resolvedCount} Resolved</span>
            </div>
          </div>
        </div>
      )}

      {/* ── INSPECT INCIDENT DOSSIER MODAL ── */}
      <AnimatePresence>
        {inspectingIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0f1d] border border-cyan-500/40 rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-base">Security Incident Dossier</h3>
                      <span className="font-mono text-xs font-black text-rose-400 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        {inspectingIncident.incidentCode || `INC-2026-${inspectingIncident.id}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Complete telemetry, location audit, and SOC notes</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingIncident(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Severity Badges */}
              <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Threat Level:</span>
                  {getSeverityBadge(inspectingIncident.severity)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Current Status:</span>
                  {getStatusBadge(inspectingIncident.status)}
                </div>
              </div>

              {/* Incident Title & Description */}
              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-white">
                  {inspectingIncident.title}
                </h4>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                  {inspectingIncident.description || 'No additional narrative description recorded.'}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Facility Checkpoint / Zone</span>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    {inspectingIncident.location || 'General Campus'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Logging Officer</span>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-cyan-400" />
                    {inspectingIncident.reportedByName || 'Security Officer'}
                  </p>
                </div>
              </div>

              {/* Resolution Log (if present) */}
              {inspectingIncident.resolutionNotes && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolution Protocol Log</span>
                  </div>
                  <p className="text-slate-200">{inspectingIncident.resolutionNotes}</p>
                </div>
              )}

              {/* Modal Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  {(inspectingIncident.status || '').toUpperCase() !== 'RESOLVED' && (
                    <button
                      onClick={() => {
                        setResolvingIncident(inspectingIncident);
                        setResolutionNotes('');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/30 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Resolve Incident
                    </button>
                  )}
                  {(inspectingIncident.severity || '').toUpperCase() !== 'CRITICAL' && (
                    <button
                      onClick={() => handleQuickEscalate(inspectingIncident)}
                      className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-2 transition"
                    >
                      <Flame className="w-4 h-4" />
                      Escalate Critical
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingIncident(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── RESOLUTION NOTES MODAL DIALOG ── */}
      <AnimatePresence>
        {resolvingIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-[#0a0f1d] border border-emerald-500/40 p-6 md:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Resolve Security Incident</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {resolvingIncident.incidentCode || `INC-2026-${resolvingIncident.id}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResolvingIncident(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-200 mb-1">{resolvingIncident.title}</p>
                <p className="text-[11px] text-slate-400">{resolvingIncident.location}</p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                  {t('form.correctiveActions', 'Resolution Protocol & Corrective Actions')}
                </label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={t(
                    'placeholder.reason',
                    'e.g. Identity verified by Department Host. Temporary pass surrendered. Zone access cleared without breach.'
                  )}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingIncident(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  {t('btn.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={updatingId !== null}
                  onClick={() =>
                    handleUpdateStatus(
                      resolvingIncident.id,
                      'RESOLVED',
                      resolutionNotes || 'Incident resolved and cleared by security officer.'
                    )
                  }
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  {t('btn.confirm', 'Confirm Resolution')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE INCIDENT CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {deletingIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-[#0a0f1d] border border-red-500/40 p-6 md:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Delete Incident Record</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {deletingIncident.incidentCode || `INC-2026-${deletingIncident.id}`}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete or archive this incident report:
                <strong className="text-white block mt-1">"{deletingIncident.title}"</strong>
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingIncident(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingId !== null}
                  onClick={() => handleDeleteIncident(deletingIncident.id)}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
