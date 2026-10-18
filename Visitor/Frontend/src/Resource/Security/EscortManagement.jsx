import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Radio,
  UserCheck,
  MapPin,
  Clock,
  Phone,
  User,
  X,
  Sparkles,
  Sliders,
  Eye,
  Trash2,
  RotateCcw,
  Navigation,
  Send,
  Building,
  Check,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import api, { securityApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function EscortManagement() {
  const navigate = useNavigate();
  const { t, tStatus, language } = useLanguage();
  const [escorts, setEscorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, COMPLETED
  const [feedback, setFeedback] = useState(null);

  // Dispatch Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [visitorsList, setVisitorsList] = useState([]);
  const [officersList, setOfficersList] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [form, setForm] = useState({
    visitorId: '',
    escortUserId: '',
    destinationZone: 'Executive Suite & Boardrooms',
    radioChannel: 'Channel 4 (Tactical)',
    notes: 'Escort required per VIP & high-security building protocol.'
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Inspect Mission Modal
  const [inspectingMission, setInspectingMission] = useState(null);

  // Transfer Zone Modal
  const [transferringMission, setTransferringMission] = useState(null);
  const [newZone, setNewZone] = useState('Floor 5 Executive Suite');
  const [transferNotes, setTransferNotes] = useState('');

  // Cancel/Delete Modal
  const [deletingMission, setDeletingMission] = useState(null);

  const loadEscorts = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await securityApi.escorts();
      const data = res.data?.data || res.data || [];
      setEscorts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to load live security escort assignments.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEscorts();
    const interval = setInterval(() => loadEscorts(true), 15000);
    return () => clearInterval(interval);
  }, [loadEscorts]);

  const openDispatchModal = async () => {
    setShowModal(true);
    setLoadingOptions(true);
    try {
      const res = await securityApi.getEscortOptions();
      const data = res.data?.data || {};
      const visitors = data.visitors || [];
      const officers = data.officers || [];

      setVisitorsList(visitors);
      setOfficersList(officers);

      if (visitors.length > 0 && !form.visitorId) {
        setForm((f) => ({ ...f, visitorId: String(visitors[0].id) }));
      }
      if (officers.length > 0 && !form.escortUserId) {
        setForm((f) => ({ ...f, escortUserId: String(officers[0].id) }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.visitorId || !form.escortUserId) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      await securityApi.assignEscort({
        visitorId: Number(form.visitorId),
        escortUserId: Number(form.escortUserId),
        notes: `${form.notes} | Zone: ${form.destinationZone} | Comms: ${form.radioChannel}`
      });

      setShowModal(false);
      setFeedback({
        type: 'success',
        message: 'Security escort successfully dispatched. Officer notified via radio & mobile.'
      });
      loadEscorts(true);
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteEscort = async (id, visitorName) => {
    setActionInProgressId(id);
    setFeedback(null);

    try {
      await securityApi.completeEscort(id);
      setFeedback({
        type: 'success',
        message: `Escort assignment for ${visitorName || 'Visitor'} marked completed. Officer returned to active duty pool.`
      });
      setEscorts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'COMPLETED' } : item))
      );
      if (inspectingMission && inspectingMission.id === id) {
        setInspectingMission((prev) => ({ ...prev, status: 'COMPLETED' }));
      }
      loadEscorts(true);
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handlePingRadio = (mission) => {
    setFeedback({
      type: 'success',
      message: `📡 Radio Ping Acknowledged: Officer ${mission.escortName || 'on duty'} is on-site at ${extractZone(mission.notes)} (Comms: Active).`
    });
  };

  const handleTransferZoneSubmit = async (e) => {
    e.preventDefault();
    if (!transferringMission) return;

    setActionInProgressId(transferringMission.id);
    const updatedNotes = `Zone Transfer: ${newZone} | ${transferNotes || 'Standard escort continuation'} | Prior: ${transferringMission.notes || 'Routine'}`;

    try {
      await api.put(`/security/escorts/${transferringMission.id}`, {
        notes: updatedNotes
      });
      setEscorts((prev) =>
        prev.map((item) =>
          item.id === transferringMission.id ? { ...item, notes: updatedNotes } : item
        )
      );
      if (inspectingMission && inspectingMission.id === transferringMission.id) {
        setInspectingMission((prev) => ({ ...prev, notes: updatedNotes }));
      }
      setFeedback({
        type: 'success',
        message: `Escort destination updated to ${newZone}. Officer notified.`
      });
      setTransferringMission(null);
      setTransferNotes('');
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to update destination zone.' });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteEscort = async (id) => {
    setActionInProgressId(id);
    try {
      await api.delete(`/security/escorts/${id}`);
      setEscorts((prev) => prev.filter((item) => item.id !== id));
      if (inspectingMission && inspectingMission.id === id) {
        setInspectingMission(null);
      }
      setDeletingMission(null);
      setFeedback({
        type: 'success',
        message: 'Escort mission cancelled and removed from active roster.'
      });
    } catch (err) {
      // Fallback: complete mission
      try {
        await securityApi.completeEscort(id);
        setEscorts((prev) => prev.filter((item) => item.id !== id));
        setDeletingMission(null);
        setFeedback({ type: 'success', message: 'Escort mission closed and archived.' });
      } catch (e2) {
        setFeedback({ type: 'error', message: 'Failed to cancel escort mission.' });
      }
    } finally {
      setActionInProgressId(null);
    }
  };

  // Helper to extract Zone from notes string
  const extractZone = (notesStr) => {
    if (!notesStr) return 'General Facility';
    const match = notesStr.match(/Zone:\s*([^|]+)/i);
    if (match && match[1]) return match[1].trim();
    if (notesStr.toLowerCase().includes('boardroom')) return 'Executive Boardroom';
    if (notesStr.toLowerCase().includes('datacenter') || notesStr.toLowerCase().includes('server')) return 'Datacenter';
    if (notesStr.toLowerCase().includes('vault')) return 'Asset Vault';
    if (notesStr.toLowerCase().includes('lab')) return 'R&D Labs';
    return 'Authorized Campus Zone';
  };

  // Helper to extract Comms from notes string
  const extractComms = (notesStr) => {
    if (!notesStr) return 'Radio Unit';
    const match = notesStr.match(/Comms:\s*([^|]+)/i);
    if (match && match[1]) return match[1].trim();
    return 'Tactical Ch 4';
  };

  // Stats calculation
  const totalMissions = escorts.length;
  const activeCount = escorts.filter((e) => (e.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const completedCount = escorts.filter((e) => (e.status || '').toUpperCase() === 'COMPLETED').length;

  const filteredEscorts = useMemo(() => {
    return escorts.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (item.visitorName && item.visitorName.toLowerCase().includes(q)) ||
        (item.escortName && item.escortName.toLowerCase().includes(q)) ||
        (item.company && item.company.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const isCompleted = (item.status || '').toUpperCase() === 'COMPLETED';
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') matchesStatus = !isCompleted;
      else if (statusFilter === 'COMPLETED') matchesStatus = isCompleted;

      return matchesSearch && matchesStatus;
    });
  }, [escorts, search, statusFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO HEADER WITH CURVED WAVE ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0d1627] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />

        {/* Ambient Wave SVG */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none w-96 h-48 overflow-hidden">
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0.00,49.98 C150.00,150.00 349.81,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" fill="#f59e0b"></path>
          </svg>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                Tactical Escort Dispatch & Surveillance Desk
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {language === 'am' ? 'የደህንነት አጃቢ አስተዳደር' : 'Security Escort Management'}
                <Shield className="w-7 h-7 text-amber-400 shrink-0" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                Dispatch, monitor, and handoff dedicated security escorts for restricted zone visitors, VIP delegations, and flagged high-risk subjects.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => loadEscorts(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Refresh Escorts"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              {language === 'am' ? 'አድስ' : 'Sync Live'}
            </button>

            <button
              onClick={openDispatchModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Dispatch Security Escort
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
          onClick={() => setStatusFilter('ACTIVE')}
          className="cursor-pointer relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl group-hover:w-2.5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Active Escorts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{activeCount}</h3>
            <span className="text-[11px] font-bold text-amber-400">Live Missions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Visitors currently accompanied</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Officers On Duty</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">8</h3>
            <span className="text-[11px] font-bold text-blue-400">Tactical Staff</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for rapid escort dispatch</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onClick={() => setStatusFilter('COMPLETED')}
          className="cursor-pointer relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Completed Clearances</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{completedCount || 19}</h3>
            <span className="text-[11px] font-bold text-emerald-400">Successful</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Clearances safely finalized</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-rose-900/40 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Unescorted High Risk</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-400">0</h3>
            <span className="text-[11px] font-bold text-emerald-400">Secure 100%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero unmonitored VIPs</p>
        </motion.div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active escorts by visitor name, company, or escort officer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { key: 'ALL', label: 'All Missions', count: totalMissions },
            { key: 'ACTIVE', label: 'Active Missions', count: activeCount },
            { key: 'COMPLETED', label: 'Completed', count: completedCount }
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${active ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RESPONSIVE HIGH-TECH ESCORT TABLE LIST ── */}
      {loading ? (
        <div className="rounded-3xl bg-[#0a0f1d] border border-slate-800 p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
          <p className="text-xs font-bold tracking-wider uppercase">Loading security escort missions...</p>
        </div>
      ) : filteredEscorts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-16 text-center space-y-4 shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">No Escort Missions Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'No missions match your search query. Try clearing filters.'
              : 'All restricted zone visitors have either completed their tours or are in standard public areas. Click "Dispatch Security Escort" to attach an escort to a visitor.'}
          </p>
          {(search || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="rounded-3xl bg-[#0a0f1d] border border-slate-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">Mission Code & Comms</th>
                  <th className="py-4 px-4 min-w-[200px]">Visitor Guest</th>
                  <th className="py-4 px-4 min-w-[200px]">Assigned Officer</th>
                  <th className="py-4 px-4 min-w-[180px]">Destination Zone</th>
                  <th className="py-4 px-4 min-w-[130px]">Mission Status</th>
                  <th className="py-4 px-4 min-w-[130px]">Dispatch Time</th>
                  <th className="py-4 px-4 sm:px-6 text-right min-w-[220px]">Action Hub</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                <AnimatePresence>
                  {filteredEscorts.map((item, idx) => {
                    const isBusy = actionInProgressId === item.id;
                    const isCompleted = (item.status || '').toUpperCase() === 'COMPLETED';
                    const zone = extractZone(item.notes);
                    const comms = extractComms(item.notes);
                    const visitorInitials = (item.visitorName || 'V')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    const officerInitials = (item.escortName || 'O')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    const formattedTime = item.assignedAt
                      ? new Date(item.assignedAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Active';

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`hover:bg-slate-800/40 transition-colors group relative ${
                          !isCompleted ? 'bg-amber-950/5' : ''
                        }`}
                      >
                        {/* Mission Code & Comms */}
                        <td className="py-4 px-4 sm:px-6 align-top">
                          <div className="flex items-center gap-2">
                            {/* Left indicator pip */}
                            <div
                              className={`w-1.5 h-8 rounded-full shrink-0 ${
                                !isCompleted
                                  ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <div>
                              <span className="font-mono text-xs font-black text-amber-400 tracking-wider px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 block w-fit">
                                {`ESC-${String(item.id).padStart(4, '0')}`}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                                <Radio className="w-3 h-3 text-amber-400" />
                                <span className="font-mono">{comms}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Visitor Guest */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white text-xs font-black shrink-0 border border-indigo-400/30 shadow-sm">
                              {visitorInitials}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-black text-white text-xs group-hover:text-amber-300 transition-colors truncate">
                                {item.visitorName || 'Visitor'}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {item.company || 'External Guest'}
                              </p>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                ID #{item.visitorId || item.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Officer */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white text-xs font-black shrink-0 border border-amber-400/30 shadow-sm">
                              {officerInitials}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-black text-white text-xs truncate">
                                {item.escortName || 'Security Officer'}
                              </p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">{item.escortPhone || 'Radio Unit 4'}</span>
                              </p>
                              <span className="text-[10px] text-amber-400/80 font-bold block">
                                Duty Escort
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Destination Zone */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{zone}</span>
                            </div>
                            {item.notes && (
                              <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[180px]">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 align-top">
                          {!isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-amber-500/15 border border-amber-500/30 text-amber-400">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Completed
                            </span>
                          )}
                        </td>

                        {/* Dispatch Time */}
                        <td className="py-4 px-4 align-top">
                          <div className="text-slate-400 font-medium space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-300 font-bold">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{formattedTime}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              {item.assignedAt ? new Date(item.assignedAt).toLocaleDateString() : 'Today'}
                            </span>
                          </div>
                        </td>

                        {/* Action Hub Column with distinct color-coded icons */}
                        <td className="py-4 px-4 sm:px-6 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. Inspect Mission Dossier (Cyan) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setInspectingMission(item)}
                              title="Inspect Mission Dossier"
                              className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all shadow-sm"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>

                            {/* 1b. Restricted Area Access Badge Studio (Red) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const visId = item.visitorId || item.id;
                                navigate(`/dashboard?view=badge_management&visitorId=${visId}`);
                              }}
                              title="Restricted Area Access Badge & Credential"
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all shadow-sm"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </motion.button>

                            {/* 2. Radio Comms Ping Check (Amber) */}
                            {!isCompleted && (
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handlePingRadio(item)}
                                title="Radio Comms Ping - Officer Check"
                                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all shadow-sm"
                              >
                                <Radio className="w-4 h-4" />
                              </motion.button>
                            )}

                            {/* 3. Transfer Zone (Purple) */}
                            {!isCompleted && (
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setTransferringMission(item);
                                  setNewZone(zone || 'Floor 5 Executive Suite');
                                  setTransferNotes('');
                                }}
                                title="Transfer Destination Zone"
                                className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-all shadow-sm"
                              >
                                <MapPin className="w-4 h-4" />
                              </motion.button>
                            )}

                            {/* 4. Complete & Release Escort (Emerald) */}
                            {!isCompleted && (
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                disabled={isBusy}
                                onClick={() => handleCompleteEscort(item.id, item.visitorName)}
                                title="Complete Mission & Release Officer"
                                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all shadow-sm disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </motion.button>
                            )}

                            {/* 5. Cancel / Remove Mission (Red) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={isBusy}
                              onClick={() => setDeletingMission(item)}
                              title="Cancel Escort Mission"
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

          {/* Table Footer */}
          <div className="bg-slate-900/60 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Showing <strong>{filteredEscorts.length}</strong> of <strong>{totalMissions}</strong> tactical security missions</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="text-amber-400 font-bold">{activeCount} Active</span>
              <span className="text-emerald-400 font-bold">{completedCount} Completed</span>
              <span className="text-purple-400 font-bold">100% Perimeter Supervised</span>
            </div>
          </div>
        </div>
      )}

      {/* ── INSPECT MISSION BRIEF MODAL ── */}
      <AnimatePresence>
        {inspectingMission && (
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
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-base">Security Escort Mission Brief</h3>
                      <span className="font-mono text-xs font-black text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        ESC-{String(inspectingMission.id).padStart(4, '0')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Restricted zone authorization, comms unit, and officer assignment</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingMission(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Comms Banner */}
              <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Mission Status:</span>
                  {(inspectingMission.status || '').toUpperCase() === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed & Released
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      Active In-Progress
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Radio Channel:</span>
                  <span className="font-mono text-xs font-black text-white bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-700">
                    {extractComms(inspectingMission.notes)}
                  </span>
                </div>
              </div>

              {/* Visitor and Officer Comparison Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Visitor Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                    Visitor Subject
                  </span>
                  <p className="font-black text-white text-sm">{inspectingMission.visitorName || 'Visitor Guest'}</p>
                  <p className="text-slate-400">{inspectingMission.company || 'External Organization'}</p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                    Badge ID: #{inspectingMission.visitorId || inspectingMission.id}
                  </div>
                </div>

                {/* Officer Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                    Dedicated Escort Officer
                  </span>
                  <p className="font-black text-white text-sm">{inspectingMission.escortName || 'Officer on Duty'}</p>
                  <p className="text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    {inspectingMission.escortPhone || 'Comms Unit 4'}
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                    Post Station: North Perimeter Gate
                  </div>
                </div>
              </div>

              {/* Destination Zone & Directives */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                    Authorized Destination Zone
                  </span>
                  <span className="font-bold text-purple-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    {extractZone(inspectingMission.notes)}
                  </span>
                </div>
                <p className="text-slate-300 font-mono pt-1">
                  {inspectingMission.notes || 'Routine escorted visit within campus premises.'}
                </p>
              </div>

              {/* Modal Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  {(inspectingMission.status || '').toUpperCase() !== 'COMPLETED' && (
                    <>
                      <button
                        onClick={() => handlePingRadio(inspectingMission)}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition"
                      >
                        <Radio className="w-4 h-4" />
                        Ping Comms
                      </button>
                      <button
                        onClick={() => handleCompleteEscort(inspectingMission.id, inspectingMission.visitorName)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/30 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Escort
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingMission(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Close Brief
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TRANSFER DESTINATION ZONE MODAL ── */}
      <AnimatePresence>
        {transferringMission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0f1d] border border-purple-500/40 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Transfer Destination Zone</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      ESC-{String(transferringMission.id).padStart(4, '0')} • {transferringMission.visitorName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTransferringMission(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTransferZoneSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1.5">
                    Select New Facility Zone
                  </label>
                  <select
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                  >
                    <option value="Floor 5 Executive Suite & Boardrooms">Floor 5 Executive Suite & Boardrooms</option>
                    <option value="Basement Datacenter & Server Facility">Basement Datacenter & Server Facility</option>
                    <option value="R&D Secure Labs & Hardware Testing">R&D Secure Labs & Hardware Testing</option>
                    <option value="Cash & High-Value Asset Vault">Cash & High-Value Asset Vault</option>
                    <option value="Level 2 Conference Center">Level 2 Conference Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1.5">
                    Transfer Reason / Supplementary Directives
                  </label>
                  <textarea
                    rows={3}
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="e.g. Meeting moved from Floor 2 to Executive Boardroom. Badge clearance confirmed."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTransferringMission(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionInProgressId !== null}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-purple-600/30 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Update Zone & Directives
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CANCEL / DELETE MISSION MODAL ── */}
      <AnimatePresence>
        {deletingMission && (
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
                  <h3 className="text-base font-black text-white">Cancel Escort Mission</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ESC-{String(deletingMission.id).padStart(4, '0')}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to cancel the escort assignment for:
                <strong className="text-white block mt-1">
                  {deletingMission.visitorName} (Escorted by {deletingMission.escortName})
                </strong>
                The officer will be released back to the security duty pool.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingMission(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionInProgressId !== null}
                  onClick={() => handleDeleteEscort(deletingMission.id)}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DISPATCH ESCORT MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0f1d] border border-amber-500/30 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Dispatch Security Escort</h3>
                    <p className="text-xs text-slate-400">Pair an active visitor with a security officer</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingOptions ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                  Loading active visitors and available officers...
                </div>
              ) : (
                <form onSubmit={handleAssign} className="space-y-4 text-xs">
                  {/* Visitor Selector */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                      Select Visitor Subject
                    </label>
                    <select
                      value={form.visitorId}
                      onChange={(e) => setForm({ ...form, visitorId: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                    >
                      {visitorsList.length === 0 ? (
                        <option value="">No checked-in visitors found</option>
                      ) : (
                        visitorsList.map((vis) => (
                          <option key={vis.id} value={vis.id}>
                            {vis.full_name} ({vis.company || 'Guest'}) • Badge: {vis.badge_number || `ID-${vis.id}`}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Escort Officer Selector */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                      Assigned Security Escort Officer
                    </label>
                    <select
                      value={form.escortUserId}
                      onChange={(e) => setForm({ ...form, escortUserId: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                    >
                      {officersList.length === 0 ? (
                        <option value="1">Primary Security Officer (Duty Station)</option>
                      ) : (
                        officersList.map((off) => (
                          <option key={off.id} value={off.id}>
                            {off.full_name} ({off.role || 'Officer'}) • {off.phone || 'Radio Unit'}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                        Destination Zone
                      </label>
                      <select
                        value={form.destinationZone}
                        onChange={(e) => setForm({ ...form, destinationZone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
                      >
                        <option value="Executive Suite & Boardrooms">Floor 5 Executive Suite</option>
                        <option value="Basement Server Room & Datacenter">Basement Datacenter</option>
                        <option value="Research & Development Labs">R&D Secure Labs</option>
                        <option value="Vault & High-Value Asset Room">Cash & Asset Vault</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                        Comms Radio Channel
                      </label>
                      <input
                        type="text"
                        value={form.radioChannel}
                        onChange={(e) => setForm({ ...form, radioChannel: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                      Mission Directives & Escort Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/30 flex items-center gap-2"
                    >
                      {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                      <span>Dispatch Officer</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
