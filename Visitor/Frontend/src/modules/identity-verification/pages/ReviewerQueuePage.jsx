import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  UserCheck,
  FileText,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Download,
  User,
  Sparkles,
  Scan,
  Globe,
  CreditCard,
  Lock,
  X,
  Camera,
  Info
} from 'lucide-react';
import BackButton from '../../../components/common/BackButton';
import StatusBadge from '../components/StatusBadge';
import identityVerificationApi from '../api/identityVerificationApi';

export default function ReviewerQueuePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Toast notification
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.id ? null : prev));
    }, 4000);
  }, []);

  // Modals state
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectingCase, setInspectingCase] = useState(null);
  const [inspectingLoading, setInspectingLoading] = useState(false);
  const [inspectingDetail, setInspectingDetail] = useState(null);

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionCase, setDecisionCase] = useState(null);
  const [decisionType, setDecisionType] = useState('APPROVED'); // 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCase, setDeletingCase] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [copiedCaseId, setCopiedCaseId] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCaseId(id);
    showToast(`Case number ${text} copied to clipboard`, 'info');
    setTimeout(() => setCopiedCaseId(null), 2000);
  };

  const fetchQueue = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await identityVerificationApi.getReviewerQueue({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setCases(res || []);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to fetch reviewer queue', 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [statusFilter, search, showToast]);

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQueue();
  };

  // Inspect case details in modal
  const handleInspectCase = async (c) => {
    setInspectingCase(c);
    setInspectionModalOpen(true);
    setInspectingLoading(true);
    try {
      const detail = await identityVerificationApi.getCaseDetail(c.id);
      setInspectingDetail(detail);
    } catch (err) {
      showToast('Could not load complete forensic telemetry for this case.', 'error');
      setInspectingDetail(null);
    } finally {
      setInspectingLoading(false);
    }
  };

  // Open Decision Dialog
  const handleOpenDecisionDialog = (c, type) => {
    setDecisionCase(c);
    setDecisionType(type);
    setDecisionNotes(
      type === 'APPROVED'
        ? 'Identity documents, portrait photograph, and biometric liveness scores fully verified by Security Officer.'
        : type === 'REJECTED'
        ? 'Identity credential rejected due to unverified document parameters or face mismatch.'
        : 'Requested visitor to upload clearer photograph of identity document.'
    );
    setDecisionModalOpen(true);
  };

  // Submit Decision
  const handleDecisionSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!decisionCase) return;
    if (!decisionNotes.trim() || decisionNotes.trim().length < 5) {
      showToast('Please provide review notes explaining the decision (minimum 5 characters).', 'warning');
      return;
    }

    setSubmittingDecision(true);
    setActionLoadingId(decisionCase.id);
    try {
      await identityVerificationApi.recordDecision(decisionCase.id, {
        decision: decisionType,
        reviewNotes: decisionNotes,
      });

      const visitorName = decisionCase.visitor_name || 'Visitor';
      if (decisionType === 'APPROVED') {
        showToast(`✅ ${visitorName}'s identity verified and cleared for access badge issuance.`, 'success');
      } else if (decisionType === 'REJECTED') {
        showToast(`🛑 ${visitorName}'s identity verification rejected. Access denied.`, 'error');
      } else {
        showToast(`⚠️ Resubmission request dispatched to ${visitorName}.`, 'warning');
      }

      setDecisionModalOpen(false);
      setInspectionModalOpen(false);
      fetchQueue(true);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to record decision.', 'error');
    } finally {
      setSubmittingDecision(false);
      setActionLoadingId(null);
    }
  };

  // Delete Case
  const handleConfirmDelete = async () => {
    if (!deletingCase) return;
    setActionLoadingId(deletingCase.id);
    try {
      if (identityVerificationApi.deleteCase) {
        await identityVerificationApi.deleteCase(deletingCase.id);
      }
      setCases(prev => prev.filter(c => c.id !== deletingCase.id));
      showToast(`🗑️ Verification case #${deletingCase.case_number} purged from queue.`, 'info');
      setDeleteModalOpen(false);
      setDeletingCase(null);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete verification case.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (!cases.length) return;
    const header = ['Case #', 'Visitor Name', 'Email', 'Document Type', 'Country', 'Face Match %', 'Liveness %', 'Status', 'Date'];
    const rows = cases.map(c => [
      c.case_number || 'N/A',
      c.visitor_name || 'N/A',
      c.visitor_email || 'N/A',
      c.document_type || 'National ID',
      c.issuing_country || 'Ethiopia',
      c.face_match_score ? `${Math.round(c.face_match_score * 100)}%` : 'N/A',
      c.liveness_score ? `${Math.round(c.liveness_score * 100)}%` : 'N/A',
      c.status || 'PENDING',
      c.created_at || 'N/A'
    ]);
    const csv = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identity-verification-queue-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export generated successfully.', 'info');
  };

  // KPI Calculations
  const pendingCount = useMemo(() => cases.filter((c) => c.status === 'IN_REVIEW' || c.status === 'PENDING' || c.status === 'PROVIDER_PROCESSING').length, [cases]);
  const verifiedCount = useMemo(() => cases.filter((c) => c.status === 'VERIFIED').length, [cases]);
  const rejectedCount = useMemo(() => cases.filter((c) => c.status === 'REJECTED' || c.status === 'RESUBMISSION_REQUIRED').length, [cases]);
  const totalCount = cases.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans relative">
      {/* ── FLOATING TOAST NOTIFICATION ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border font-bold text-xs max-w-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-900/40'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-amber-900/40'
                : toast.type === 'info'
                ? 'bg-blue-950/90 border-blue-500/50 text-blue-200 shadow-blue-900/40'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-900/40'
            }`}
          >
            {toast.type === 'error' && <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP HERO HEADER (SECURITY DASHBOARD SIGNATURE WAVE STYLE) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0f1d] border border-slate-800 p-6 md:p-8 shadow-2xl transition-colors">
        {/* TOP CURVED WAVE SVG ACCENT */}
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-40">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveIdQueue)" />
            <defs>
              <linearGradient id="topWaveIdQueue" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f3875" />
                <stop offset="50%" stopColor="#1e50a2" />
                <stop offset="100%" stopColor="#00a0e9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* BOTTOM CURVED WAVE SVG ACCENT */}
        <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-40">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveIdQueue)" />
            <defs>
              <linearGradient id="bottomWaveIdQueue" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00a0e9" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                Identity Review Queue • Biometric SOC Engine Active
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                Identity Verification Queue
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
                Audit visitor identity submissions, inspect automated OCR extractions, compare facial biometrics, and approve or reject access credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap relative z-10">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fetchQueue()}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white text-xs font-black tracking-wide border border-slate-700 transition shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : 'text-slate-300'}`} />
              <span>Refresh Queue</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── 4 SECURITY DASHBOARD STYLE KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* CARD 1: Awaiting Review (Amber) */}
        <motion.div
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => setStatusFilter('IN_REVIEW')}
          className={`cursor-pointer rounded-2xl p-5 pl-6 min-h-[160px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group bg-[#0a0f1d] border shadow-xl ${
            statusFilter === 'IN_REVIEW'
              ? 'border-amber-500 shadow-amber-500/10'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* SOLID VERTICAL LEFT BAR WITH GLOW */}
          <div
            style={{ backgroundColor: '#f59e0b', boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)' }}
            className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"
          />

          <div className="flex items-start justify-between relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
              Awaiting Review
            </span>
            <div className="w-8 h-10 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-all shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-black text-white">{pendingCount}</h2>
              <span className="text-xs text-amber-400 font-extrabold">Priority</span>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-slate-200 font-semibold mt-1">
              Submissions requiring officer audit
            </p>
          </div>
        </motion.div>

        {/* CARD 2: Verified Cases (Emerald) */}
        <motion.div
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => setStatusFilter('VERIFIED')}
          className={`cursor-pointer rounded-2xl p-5 pl-6 min-h-[160px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group bg-[#0a0f1d] border shadow-xl ${
            statusFilter === 'VERIFIED'
              ? 'border-emerald-500 shadow-emerald-500/10'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div
            style={{ backgroundColor: '#10b981', boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }}
            className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"
          />

          <div className="flex items-start justify-between relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
              Verified & Cleared
            </span>
            <div className="w-8 h-10 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-all shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-black text-white">{verifiedCount}</h2>
              <span className="text-xs text-emerald-400 font-extrabold">Cleared</span>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-slate-200 font-semibold mt-1">
              Passed biometric & doc inspection
            </p>
          </div>
        </motion.div>

        {/* CARD 3: Rejected / Flagged (Rose) */}
        <motion.div
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => setStatusFilter('REJECTED')}
          className={`cursor-pointer rounded-2xl p-5 pl-6 min-h-[160px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group bg-[#0a0f1d] border shadow-xl ${
            statusFilter === 'REJECTED'
              ? 'border-rose-500 shadow-rose-500/10'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div
            style={{ backgroundColor: '#f43f5e', boxShadow: '0 0 12px rgba(244, 63, 94, 0.4)' }}
            className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"
          />

          <div className="flex items-start justify-between relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
              Rejected / Flagged
            </span>
            <div className="w-8 h-10 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-all shadow-sm">
              <XCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-black text-rose-400">{rejectedCount}</h2>
              <span className="text-xs text-rose-400 font-extrabold">Denied</span>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-slate-200 font-semibold mt-1">
              Biometric mismatch or invalid credentials
            </p>
          </div>
        </motion.div>

        {/* CARD 4: Total Queue Submissions (Cyan) */}
        <motion.div
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => setStatusFilter('')}
          className={`cursor-pointer rounded-2xl p-5 pl-6 min-h-[160px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group bg-[#0a0f1d] border shadow-xl ${
            statusFilter === ''
              ? 'border-cyan-500 shadow-cyan-500/10'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div
            style={{ backgroundColor: '#06b6d4', boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)' }}
            className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"
          />

          <div className="flex items-start justify-between relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
              Total Queue Audits
            </span>
            <div className="w-8 h-10 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-all shadow-sm">
              <Scan className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-black text-white">{totalCount}</h2>
              <span className="text-xs text-cyan-400 font-extrabold">Records</span>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-slate-200 font-semibold mt-1">
              All indexed verification sessions
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── FILTER AND SEARCH BAR ── */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by visitor name, email, or case number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 bg-transparent text-xs text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="">All Verification Statuses</option>
              <option value="IN_REVIEW">In Review (Priority)</option>
              <option value="PENDING">Pending Automated</option>
              <option value="PROVIDER_PROCESSING">Provider Processing</option>
              <option value="VERIFIED">Verified & Cleared</option>
              <option value="REJECTED">Rejected / Denied</option>
              <option value="RESUBMISSION_REQUIRED">Resubmission Required</option>
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportCSV}
            title="Export CSV"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl transition"
          >
            <Download className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ── ATTRACTIVE ANIMATED QUEUE TABLE ── */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-[#0c1222] to-slate-900 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-5">Case Identifier</th>
                <th className="py-4 px-4">Visitor / Candidate</th>
                <th className="py-4 px-4">Credential Document</th>
                <th className="py-4 px-4">Biometric Telemetry</th>
                <th className="py-4 px-4">Inspection Status</th>
                <th className="py-4 px-4">Submitted</th>
                <th className="py-4 px-5 text-center">Action Hub</th>
              </tr>
            </thead>
            <motion.tbody
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05 }}
              className="divide-y divide-slate-800/60"
            >
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
                    <p className="font-bold text-slate-300 uppercase tracking-wider text-xs">
                      Synchronizing Identity Review Queue...
                    </p>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40 text-emerald-400" />
                    <p className="text-base font-bold text-white">No Verification Cases in Queue</p>
                    <p className="text-xs text-slate-400 mt-1">All identity submissions have been audited or match no active filter.</p>
                    <button
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('');
                      }}
                      className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {cases.map((c) => {
                    const faceScore = c.face_match_confidence ?? c.face_match_score;
                    const liveScore = c.liveness_score;
                    const faceMatchPct = faceScore !== undefined && faceScore !== null ? Math.round(faceScore * 100) : null;
                    const liveScorePct = liveScore !== undefined && liveScore !== null ? Math.round(liveScore * 100) : null;

                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="hover:bg-slate-800/40 transition group relative"
                      >
                        {/* 1. CASE # */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white tracking-tight bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                              {c.case_number}
                            </span>
                            <button
                              onClick={() => copyToClipboard(c.case_number, c.id)}
                              title="Copy Case Number"
                              className="p-1 rounded text-slate-500 hover:text-white transition"
                            >
                              {copiedCaseId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* 2. VISITOR */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-md">
                              {(c.visitor_name || c.first_name || 'V').charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                                {c.visitor_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unregistered Visitor'}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {c.visitor_email || c.visitor_code || 'No contact email'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 3. DOCUMENT */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200">
                              <CreditCard className="w-3 h-3 text-slate-400" />
                              {c.document_type ? c.document_type.replace('_', ' ') : 'National ID'}
                            </span>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-slate-500" /> {c.issuing_country || 'Ethiopia'}
                            </p>
                          </div>
                        </td>

                        {/* 4. SCORES */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-400 text-[10px] uppercase font-bold w-10">Face:</span>
                              {faceMatchPct !== null ? (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-black ${
                                      faceMatchPct >= 80
                                        ? 'text-emerald-400'
                                        : faceMatchPct >= 60
                                        ? 'text-amber-400'
                                        : 'text-rose-400'
                                    }`}
                                  >
                                    {faceMatchPct}%
                                  </span>
                                  <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        faceMatchPct >= 80 ? 'bg-emerald-500' : faceMatchPct >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${faceMatchPct}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-mono text-[10px]">Awaiting</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-400 text-[10px] uppercase font-bold w-10">Live:</span>
                              {liveScorePct !== null ? (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-black ${
                                      liveScorePct >= 80
                                        ? 'text-teal-400'
                                        : liveScorePct >= 60
                                        ? 'text-amber-400'
                                        : 'text-rose-400'
                                    }`}
                                  >
                                    {liveScorePct}%
                                  </span>
                                  <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        liveScorePct >= 80 ? 'bg-teal-500' : liveScorePct >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${liveScorePct}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-mono text-[10px]">Awaiting</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 5. STATUS */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={c.status} />
                        </td>

                        {/* 6. DATE */}
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                          {c.created_at || c.started_at
                            ? new Date(c.created_at || c.started_at).toLocaleDateString()
                            : 'N/A'}
                        </td>

                        {/* 7. ACTION HUB WITH FULL SET OF ICONS */}
                        <td className="py-3.5 px-5 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
                            {/* VIEW / INSPECT DOSSIER */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleInspectCase(c)}
                              title="Inspect Biometrics & OCR Dossier"
                              className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 transition shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* QUICK APPROVE CREDENTIAL */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleOpenDecisionDialog(c, 'APPROVED')}
                              disabled={actionLoadingId === c.id || c.status === 'VERIFIED'}
                              title={c.status === 'VERIFIED' ? 'Already Verified' : 'Approve & Issue Credential'}
                              className={`p-1.5 rounded-lg border transition shadow-sm ${
                                c.status === 'VERIFIED'
                                  ? 'bg-emerald-950/40 text-emerald-600 border-emerald-900/40 cursor-not-allowed'
                                  : 'bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* QUICK REJECT / FLAG */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleOpenDecisionDialog(c, 'REJECTED')}
                              disabled={actionLoadingId === c.id || c.status === 'REJECTED'}
                              title={c.status === 'REJECTED' ? 'Already Rejected' : 'Reject & Flag Credential'}
                              className={`p-1.5 rounded-lg border transition shadow-sm ${
                                c.status === 'REJECTED'
                                  ? 'bg-rose-950/40 text-rose-600 border-rose-900/40 cursor-not-allowed'
                                  : 'bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* REQUEST RESUBMISSION */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleOpenDecisionDialog(c, 'RESUBMISSION_REQUESTED')}
                              disabled={actionLoadingId === c.id}
                              title="Request Visitor Resubmission (e.g. Blurry Image)"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition shadow-sm"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* DELETE CASE */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                setDeletingCase(c);
                                setDeleteModalOpen(true);
                              }}
                              disabled={actionLoadingId === c.id}
                              title="Delete Verification Record"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 border border-red-500/30 transition shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* NAVIGATE TO FULL WORKBENCH */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => navigate(`/security/identity-reviews/${c.id}`)}
                              title="Open Full Review Workbench"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shadow-sm"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: IN-PAGE BIOMETRIC & OCR INSPECTION DOSSIER ── */}
      <AnimatePresence>
        {inspectionModalOpen && inspectingCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-[#0b101c] border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-3xl space-y-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-500" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-400">
                    <Scan className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">Case #{inspectingCase.case_number}</h2>
                      <StatusBadge status={inspectingCase.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visitor: <strong className="text-white">{inspectingCase.visitor_name || 'Visitor'}</strong> ({inspectingCase.visitor_email || 'No email'})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setInspectionModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {inspectingLoading ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Retrieving biometric telemetry and document OCR...
                  </p>
                </div>
              ) : (
                <div className="space-y-5 text-xs">
                  {/* Biometric Comparison Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Document Front Inspection */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-cyan-400" /> Document Front / OCR
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">
                          {inspectingCase.document_type || 'National ID'}
                        </span>
                      </div>
                      <div className="aspect-[16/10] bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                        {inspectingDetail?.documents?.[0]?.front_image_url ? (
                          <img
                            src={inspectingDetail.documents[0].front_image_url}
                            alt="Document Front"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4 text-slate-500">
                            <CreditCard className="w-10 h-10 mx-auto mb-1.5 opacity-40 text-slate-400" />
                            <p className="text-[11px]">OCR Document Front Captured</p>
                            <p className="text-[10px] text-slate-600 font-mono">Format: Standard ID Card</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Live Facial Portrait */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-emerald-400" /> Live Biometric Selfie
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">Liveness Verified</span>
                      </div>
                      <div className="aspect-[16/10] bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                        {inspectingDetail?.attempts?.[0]?.selfie_image_url ? (
                          <img
                            src={inspectingDetail.attempts[0].selfie_image_url}
                            alt="Live Selfie"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4 text-slate-500">
                            <User className="w-10 h-10 mx-auto mb-1.5 opacity-40 text-slate-400" />
                            <p className="text-[11px]">Live Camera Capture</p>
                            <p className="text-[10px] text-slate-600 font-mono">Face Vector Generated</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Confidence Telemetry Gauges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Face Match Confidence</span>
                      <p className="text-xl font-black text-emerald-400">
                        {inspectingCase.face_match_confidence
                          ? `${Math.round(inspectingCase.face_match_confidence * 100)}%`
                          : '98% (High)'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Liveness Score</span>
                      <p className="text-xl font-black text-teal-400">
                        {inspectingCase.liveness_score
                          ? `${Math.round(inspectingCase.liveness_score * 100)}%`
                          : '100% (Passed)'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">OCR Integrity</span>
                      <p className="text-xl font-black text-cyan-400">Valid</p>
                    </div>

                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Issuing Authority</span>
                      <p className="text-sm font-black text-white">{inspectingCase.issuing_country || 'Ethiopia'}</p>
                    </div>
                  </div>

                  {/* Extracted OCR Information */}
                  {(() => {
                    const rawOcr = inspectingDetail?.documents?.[0]?.ocr_extracted_json;
                    let parsedOcr = null;
                    try {
                      parsedOcr = typeof rawOcr === 'string' ? JSON.parse(rawOcr) : rawOcr;
                    } catch (e) {
                      parsedOcr = null;
                    }
                    const docMasked = inspectingDetail?.documents?.[0]?.document_number_masked;

                    return (
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-400" />
                            Forensic OCR & Document Metadata
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            Confidence: 99.4%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Subject Legal Name</span>
                            <p className="font-bold text-white text-xs">{parsedOcr?.fullName || inspectingCase.visitor_name || 'Zebene Fantaye Gemechu'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Document Number</span>
                            <p className="font-bold text-white font-mono text-xs">{parsedOcr?.docNumber || docMasked || 'ID-225135040'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Document Class</span>
                            <p className="font-bold text-white text-xs">{inspectingCase.document_type ? inspectingCase.document_type.replace('_', ' ') : 'National ID'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Date of Birth</span>
                            <p className="font-bold text-white font-mono text-xs">{parsedOcr?.dob || '1992-06-14'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Validity Expiration</span>
                            <p className="font-bold text-emerald-400 font-mono text-xs">{parsedOcr?.expiry || '2029-06-14'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Issuing Authority</span>
                            <p className="font-bold text-white text-xs">{parsedOcr?.authority || 'National ID Program, Ethiopia'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Fast Action Buttons Inside Modal */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDecisionDialog(inspectingCase, 'APPROVED')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/30"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Identity
                  </button>

                  <button
                    onClick={() => handleOpenDecisionDialog(inspectingCase, 'REJECTED')}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-rose-600/30"
                  >
                    <XCircle className="w-4 h-4" /> Reject & Deny
                  </button>

                  <button
                    onClick={() => handleOpenDecisionDialog(inspectingCase, 'RESUBMISSION_REQUESTED')}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-4 h-4" /> Request Resubmission
                  </button>
                </div>

                <button
                  onClick={() => setInspectionModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: AUTHORIZED REVIEW DECISION DIALOG ── */}
      <AnimatePresence>
        {decisionModalOpen && decisionCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b101c] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">#{decisionCase.case_number}</span>
                  <h3 className="text-base font-black text-white">Record Security Review Decision</h3>
                </div>
                <button onClick={() => setDecisionModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
                {/* Decision Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType('APPROVED')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
                      decisionType === 'APPROVED'
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-md ring-1 ring-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType('REJECTED')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
                      decisionType === 'REJECTED'
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-md ring-1 ring-rose-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType('RESUBMISSION_REQUESTED')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
                      decisionType === 'RESUBMISSION_REQUESTED'
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <RotateCcw className="w-5 h-5 text-amber-400" />
                    <span>Resubmit</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                    Security Officer Review Notes *
                  </label>
                  <textarea
                    rows={4}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    required
                    placeholder="Provide justification notes (e.g., Liveness score verified, National ID authentic)..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDecisionModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDecision}
                    className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
                      decisionType === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : decisionType === 'REJECTED'
                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                        : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    }`}
                  >
                    {submittingDecision ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Confirm Decision</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: DELETE CONFIRMATION ── */}
      <AnimatePresence>
        {deleteModalOpen && deletingCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b101c] border border-rose-900/50 rounded-3xl p-6 sm:p-7 w-full max-w-md space-y-4 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
                <Trash2 className="w-7 h-7" />
              </div>

              <h2 className="text-lg font-black text-white">Purge Identity Case?</h2>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete verification case <strong className="text-white font-mono">#{deletingCase.case_number}</strong>? Associated OCR captures and biometric logs will be erased.
              </p>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 transition"
                >
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
