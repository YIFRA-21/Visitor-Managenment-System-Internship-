import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  Download,
  Eye,
  Edit2,
  Archive,
  Loader2,
  AlertCircle,
  Play,
  UserX,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Trash2,
  Radio,
  Check,
  X,
  Shield,
  Lock,
  Phone,
  Mail,
  Building,
  User,
  ShieldBan,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { blacklistWatchlistApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import FieldError from '../../components/common/FieldError';
import { validateText, validateName } from '../../utils/formValidation';

export default function BlacklistWatchlistVerification() {
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    showNotification(message, type);
  }, [showNotification]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [submittingModal, setSubmittingModal] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    visitorName: '',
    email: '',
    phone: '',
    idNumber: '',
    idType: 'National ID',
    listType: 'WATCHLIST',
    riskLevel: 'MEDIUM',
    reason: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    internalNotes: ''
  });
  const [addErrors, setAddErrors] = useState({});
  const clearAddError = (f) => {
    if (addErrors[f]) {
      setAddErrors(prev => {
        const next = { ...prev };
        delete next[f];
        return next;
      });
    }
  };

  const [editForm, setEditForm] = useState({
    listType: 'WATCHLIST',
    reason: '',
    description: '',
    riskLevel: 'MEDIUM',
    status: 'ACTIVE',
    expiryDate: '',
    internalNotes: ''
  });

  const [clearanceForm, setClearanceForm] = useState({ decision: 'APPROVE_CLEARANCE', notes: '' });
  const [verifyForm, setVerifyForm] = useState({ idNumber: '', email: '', phone: '', referenceNumber: '' });
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Load directory
  const loadDirectory = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    try {
      const res = await blacklistWatchlistApi.getDirectory({
        search,
        listType: listTypeFilter,
        riskLevel: riskFilter,
        status: statusFilter,
        isArchived: showArchived ? 'true' : 'false'
      });
      setRecords(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [search, listTypeFilter, riskFilter, statusFilter, showArchived]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  // ── QUICK RESPONSIVE ACTIONS: BLACKLIST & WATCHLIST ──

  // Quick Action: Elevate or toggle to BLACKLIST
  const handleSetBlacklist = async (rec) => {
    setActionLoadingId(rec.id);
    const targetName = rec.visitorName || rec.idNumber || 'Subject';
    try {
      // Optimistic state update
      setRecords(prev =>
        prev.map(r =>
          r.id === rec.id
            ? { ...r, listType: 'BLACKLIST', riskLevel: 'HIGH', status: 'ACTIVE' }
            : r
        )
      );

      await blacklistWatchlistApi.updateRecord(rec.id, {
        listType: 'BLACKLIST',
        riskLevel: 'HIGH',
        status: 'ACTIVE'
      });

      showToast(`🛡️ ${targetName} is now BLACKLISTED. Perimeter turnstile & door lockout active.`, 'error');
      loadDirectory(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      loadDirectory(true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Designate or toggle to WATCHLIST
  const handleSetWatchlist = async (rec) => {
    setActionLoadingId(rec.id);
    const targetName = rec.visitorName || rec.idNumber || 'Subject';
    try {
      // Optimistic state update
      setRecords(prev =>
        prev.map(r =>
          r.id === rec.id
            ? { ...r, listType: 'WATCHLIST', riskLevel: 'MEDIUM', status: 'ACTIVE' }
            : r
        )
      );

      await blacklistWatchlistApi.updateRecord(rec.id, {
        listType: 'WATCHLIST',
        riskLevel: 'MEDIUM',
        status: 'ACTIVE'
      });

      showToast(`👁️ ${targetName} designated under ACTIVE WATCHLIST. Security monitoring alert dispatched.`, 'warning');
      loadDirectory(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      loadDirectory(true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Permanent Delete or Archive
  const handleConfirmDelete = async () => {
    if (!selectedRecord) return;
    setActionLoadingId(selectedRecord.id);
    const targetName = selectedRecord.visitorName || selectedRecord.idNumber || 'Subject';
    try {
      if (blacklistWatchlistApi.deleteRecord) {
        await blacklistWatchlistApi.deleteRecord(selectedRecord.id);
      } else {
        await blacklistWatchlistApi.archiveRecord(selectedRecord.id);
      }

      setRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
      showToast(`🗑️ ${targetName} permanently removed from intelligence registry.`, 'info');
      setShowDeleteModal(false);
      setSelectedRecord(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Toggle Archive
  const handleArchiveToggle = async (rec) => {
    setActionLoadingId(rec.id);
    const targetName = rec.visitorName || rec.idNumber || 'Subject';
    try {
      if (rec.status === 'ARCHIVED') {
        await blacklistWatchlistApi.restoreRecord(rec.id);
        showToast(`♻️ ${targetName} restored to active directory.`, 'success');
      } else {
        await blacklistWatchlistApi.archiveRecord(rec.id);
        showToast(`📦 ${targetName} archived successfully.`, 'info');
      }
      loadDirectory(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Form Submissions
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const newErrs = {};
    const nameErr = validateName(addForm.visitorName, 'Visitor Full Name', true);
    if (nameErr) newErrs.visitorName = nameErr;
    const idErr = validateText(addForm.idNumber, 'Identity Credential', 3, 50, true);
    if (idErr) newErrs.idNumber = idErr;
    const reasonErr = validateText(addForm.reason, 'Flag Reason', 3, 200, true);
    if (reasonErr) newErrs.reason = reasonErr;

    if (Object.keys(newErrs).length > 0) {
      setAddErrors(newErrs);
      return;
    }

    setSubmittingModal(true);
    try {
      await blacklistWatchlistApi.createRecord(addForm);
      setShowAddModal(false);
      setAddErrors({});
      setAddForm({
        visitorName: '',
        email: '',
        phone: '',
        idNumber: '',
        idType: 'National ID',
        listType: 'WATCHLIST',
        riskLevel: 'MEDIUM',
        reason: '',
        description: '',
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        internalNotes: ''
      });
      showToast('Record added to security intelligence registry.', 'success');
      loadDirectory();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmittingModal(true);
    try {
      await blacklistWatchlistApi.updateRecord(selectedRecord.id, editForm);
      setShowEditModal(false);
      showToast('Security record updated successfully.', 'success');
      loadDirectory(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleClearanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmittingModal(true);
    try {
      await blacklistWatchlistApi.reviewClearance(
        selectedRecord.id,
        clearanceForm.decision,
        clearanceForm.notes
      );
      setShowClearanceModal(false);
      const isApproved = clearanceForm.decision === 'APPROVE_CLEARANCE';
      showToast(
        isApproved
          ? `✅ Clearance granted for ${selectedRecord.visitorName || 'subject'}.`
          : `⚠️ Clearance denied. Strict watchlist protocols maintained.`,
        isApproved ? 'success' : 'warning'
      );
      loadDirectory(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmittingModal(false);
    }
  };

  const runVerification = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await blacklistWatchlistApi.verifyVisitor(verifyForm);
      setVerifyResult(res.data.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setVerifying(false);
    }
  };

  const exportCSV = () => {
    if (!records.length) return;
    const header = [
      'Visitor Code',
      'Visitor Name',
      'ID Number',
      'List Type',
      'Risk Level',
      'Reason',
      'Status',
      'Effective Date'
    ];
    const rows = records.map(r => [
      r.visitorCode || 'N/A',
      r.visitorName || 'N/A',
      r.idNumber || 'N/A',
      r.listType,
      r.riskLevel,
      JSON.stringify(r.reason),
      r.status,
      r.effectiveDate || 'N/A'
    ]);
    const csv = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blacklist-watchlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export generated successfully.', 'info');
  };

  // KPI calculations
  const totalCount = records.length;
  const blacklistCount = useMemo(() => records.filter(r => r.listType === 'BLACKLIST').length, [records]);
  const watchlistCount = useMemo(() => records.filter(r => r.listType === 'WATCHLIST').length, [records]);
  const criticalCount = useMemo(() => records.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length, [records]);

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, x: -15, transition: { duration: 0.2 } }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans relative">
      {/* ── FLOATING INTERACTIVE TOAST NOTIFICATION ── */}
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

      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0d1627] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-extrabold tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                Identity Screening & Threat Intelligence • Active Filter
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {t('security.blacklistTitle', 'Blacklist & Watchlist Intelligence')}
                <ShieldAlert className="w-7 h-7 text-rose-500 shrink-0" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                Automated perimeter screening, watchlist risk profiling, physical turnstile lockout rules, and legal clearance audits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowVerifyModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              {t('security.sandbox', 'Verification Sandbox')}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              {t('security.addRecord', 'Add Security Record')}
            </motion.button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* ── 4 ANIMATED KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onClick={() => {
            setListTypeFilter('ALL');
            setRiskFilter('ALL');
          }}
          className={`cursor-pointer relative overflow-hidden rounded-2xl bg-[#0a0f1d] border p-5 shadow-lg group transition-all ${
            listTypeFilter === 'ALL' && riskFilter === 'ALL'
              ? 'border-blue-500 shadow-blue-500/10'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Total Flagged Subjects</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{totalCount}</h3>
            <span className="text-[11px] font-bold text-slate-400">Records</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Subjects monitored in database</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onClick={() => setListTypeFilter('BLACKLIST')}
          className={`cursor-pointer relative overflow-hidden rounded-2xl bg-[#0a0f1d] border p-5 shadow-lg group transition-all ${
            listTypeFilter === 'BLACKLIST'
              ? 'border-rose-500 shadow-rose-500/15'
              : 'border-rose-900/40 hover:border-rose-700/60'
          }`}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-rose-300">Blacklisted (Blocked)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-400">{blacklistCount}</h3>
            <span className="text-[11px] font-bold text-rose-400">Lockout</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Denied building entrance</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onClick={() => setListTypeFilter('WATCHLIST')}
          className={`cursor-pointer relative overflow-hidden rounded-2xl bg-[#0a0f1d] border p-5 shadow-lg group transition-all ${
            listTypeFilter === 'WATCHLIST'
              ? 'border-amber-500 shadow-amber-500/15'
              : 'border-slate-800 hover:border-amber-700/60'
          }`}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300">Active Watchlist</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-amber-400">{watchlistCount}</h3>
            <span className="text-[11px] font-bold text-slate-400">Under Watch</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Requires security notification</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onClick={() => setRiskFilter('CRITICAL')}
          className={`cursor-pointer relative overflow-hidden rounded-2xl bg-[#0a0f1d] border p-5 shadow-lg group transition-all ${
            riskFilter === 'CRITICAL'
              ? 'border-purple-500 shadow-purple-500/15'
              : 'border-slate-800 hover:border-purple-700/60'
          }`}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300">Critical / High Risk</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-purple-400">{criticalCount}</h3>
            <span className="text-[11px] font-bold text-purple-400">Elevated</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Highest alert classification</p>
        </motion.div>
      </div>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('security.searchPlaceholder', 'Search Name, ID Number, Phone, Visitor Code...')}
              className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-700 bg-slate-900/90 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-slate-500 transition"
            />
          </div>

          <select
            value={listTypeFilter}
            onChange={e => setListTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs border border-slate-700 bg-slate-900/90 text-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
          >
            <option value="ALL">All List Types</option>
            <option value="BLACKLIST">🔴 Blacklist Only (Lockout)</option>
            <option value="WATCHLIST">🟡 Watchlist Only (Monitor)</option>
          </select>

          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs border border-slate-700 bg-slate-900/90 text-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 ${
              showArchived
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            {showArchived ? 'Showing Archived' : 'Show Archived'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportCSV}
            title="Export CSV"
            className="p-2.5 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl transition"
          >
            <Download className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadDirectory()}
            disabled={loading}
            title="Refresh Directory"
            className="p-2.5 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-rose-500' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* ── ATTRACTIVE & ANIMATED SECURITY TABLE ── */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden relative">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Querying SOC threat intelligence directory...
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-500">
              <ShieldCheck className="w-8 h-8 text-emerald-400/80" />
            </div>
            <h3 className="text-base font-bold text-white">No Flagged Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All scanned individuals are currently cleared or no records match the chosen filter query.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setListTypeFilter('ALL');
                setRiskFilter('ALL');
                setShowArchived(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase font-black tracking-wider text-slate-400 bg-gradient-to-r from-slate-900 via-[#0c1222] to-slate-900">
                  <th className="px-5 py-4">{t('table.visitor', 'Subject / Visitor')}</th>
                  <th className="px-4 py-4">{t('table.identityNumber', 'Identity Credential')}</th>
                  <th className="px-4 py-4">{t('table.listType', 'Classification')}</th>
                  <th className="px-4 py-4">{t('table.riskLevel', 'Threat Severity')}</th>
                  <th className="px-4 py-4">{t('table.reason', 'Flag Reason & Synopsis')}</th>
                  <th className="px-4 py-4">{t('table.status', 'System Status')}</th>
                  <th className="px-4 py-4">{t('table.createdDate', 'Indexed')}</th>
                  <th className="px-5 py-4 text-center">{t('table.actions', 'Action Hub')}</th>
                </tr>
              </thead>
              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-slate-800/60"
              >
                <AnimatePresence>
                  {records.map(rec => {
                    const isBlacklist = rec.listType === 'BLACKLIST';
                    const isWatchlist = rec.listType === 'WATCHLIST';
                    const isCrit = rec.riskLevel === 'CRITICAL' || rec.riskLevel === 'HIGH';

                    return (
                      <motion.tr
                        key={rec.id}
                        variants={rowVariants}
                        layout
                        exit={{ opacity: 0, x: -20 }}
                        className={`group transition-colors relative hover:bg-slate-800/40 ${
                          isBlacklist
                            ? 'hover:border-l-4 hover:border-l-rose-500'
                            : 'hover:border-l-4 hover:border-l-amber-500'
                        }`}
                      >
                        {/* 1. VISITOR / SUBJECT */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs shadow-md shrink-0 border ${
                                isBlacklist
                                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {rec.visitorName?.charAt(0) || 'V'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                                {rec.visitorName || 'Unregistered Profile'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono tracking-tight">
                                {rec.visitorCode || 'N/A'} {rec.company ? `• ${rec.company}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. IDENTITY CREDENTIAL */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-bold text-slate-200 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800 inline-block">
                              {rec.idNumber || '—'}
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {rec.idType || 'Identity Document'}
                            </p>
                          </div>
                        </td>

                        {/* 3. CLASSIFICATION BADGE */}
                        <td className="px-4 py-3.5">
                          {isBlacklist ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow-sm shadow-rose-900/30">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                              <Lock className="w-3 h-3 text-rose-400" />
                              BLACKLIST (BLOCKED)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm shadow-amber-900/30">
                              <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                              WATCHLIST (MONITOR)
                            </span>
                          )}
                        </td>

                        {/* 4. THREAT SEVERITY */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${
                                rec.riskLevel === 'CRITICAL'
                                  ? 'bg-rose-600 text-white'
                                  : rec.riskLevel === 'HIGH'
                                  ? 'bg-orange-500 text-white'
                                  : rec.riskLevel === 'MEDIUM'
                                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              }`}
                            >
                              {rec.riskLevel}
                            </span>
                            {/* Threat bars meter */}
                            <div className="flex gap-0.5">
                              <span className={`w-1 h-3 rounded-sm ${isCrit ? 'bg-rose-500' : 'bg-amber-400'}`} />
                              <span
                                className={`w-1 h-3 rounded-sm ${
                                  rec.riskLevel === 'CRITICAL' || rec.riskLevel === 'HIGH'
                                    ? 'bg-rose-500'
                                    : rec.riskLevel === 'MEDIUM'
                                    ? 'bg-amber-400'
                                    : 'bg-slate-700'
                                }`}
                              />
                              <span
                                className={`w-1 h-3 rounded-sm ${
                                  rec.riskLevel === 'CRITICAL'
                                    ? 'bg-rose-500'
                                    : rec.riskLevel === 'HIGH'
                                    ? 'bg-orange-400'
                                    : 'bg-slate-700'
                                }`}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 5. REASON */}
                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="text-slate-300 font-medium truncate" title={rec.reason}>
                            {rec.reason || 'Flagged security notification'}
                          </p>
                          {rec.description && (
                            <p className="text-[10px] text-slate-500 truncate">{rec.description}</p>
                          )}
                        </td>

                        {/* 6. STATUS */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : rec.status === 'CLEARED'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                rec.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            {rec.status}
                          </span>
                        </td>

                        {/* 7. INDEXED DATE */}
                        <td className="px-4 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                          {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* 8. ADJUSTED ICON ACTIONS (VIEW, DELETE, BLACKLIST, WATCHLIST, CLEARANCE) */}
                        <td className="px-5 py-3.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
                            {/* VIEW DOSSIER ICON */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                setSelectedRecord(rec);
                                setShowDetailsModal(true);
                              }}
                              title="View Security Dossier"
                              className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 transition shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* RESPONSIVE BLACKLIST TOGGLE/ACTION */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleSetBlacklist(rec)}
                              disabled={actionLoadingId === rec.id}
                              title={
                                isBlacklist
                                  ? 'Active in Blacklist (Click to Re-assert Lockout)'
                                  : 'Elevate to Blacklist (Perimeter Lockout)'
                              }
                              className={`p-1.5 rounded-lg border transition shadow-sm ${
                                isBlacklist
                                  ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/40 ring-1 ring-rose-400'
                                  : 'bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {actionLoadingId === rec.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserX className="w-3.5 h-3.5" />
                              )}
                            </motion.button>

                            {/* RESPONSIVE WATCHLIST TOGGLE/ACTION */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleSetWatchlist(rec)}
                              disabled={actionLoadingId === rec.id}
                              title={
                                isWatchlist
                                  ? 'Active in Watchlist (Click to Re-assert Monitor)'
                                  : 'Place under Watchlist (Continuous Surveillance)'
                              }
                              className={`p-1.5 rounded-lg border transition shadow-sm ${
                                isWatchlist
                                  ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/40 ring-1 ring-amber-300 font-black'
                                  : 'bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 border-amber-500/30'
                              }`}
                            >
                              <Radio className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* SECURITY CLEARANCE AUDIT ICON */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                setSelectedRecord(rec);
                                setClearanceForm({
                                  decision: rec.status === 'CLEARED' ? 'REJECT_CLEARANCE' : 'APPROVE_CLEARANCE',
                                  notes: rec.clearanceNotes || ''
                                });
                                setShowClearanceModal(true);
                              }}
                              title="Review Security Clearance"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition shadow-sm"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* EDIT RECORD ICON */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                setSelectedRecord(rec);
                                setEditForm({
                                  listType: rec.listType || 'WATCHLIST',
                                  reason: rec.reason || '',
                                  description: rec.description || '',
                                  riskLevel: rec.riskLevel || 'MEDIUM',
                                  status: rec.status || 'ACTIVE',
                                  expiryDate: rec.expiryDate ? rec.expiryDate.split('T')[0] : '',
                                  internalNotes: rec.internalNotes || ''
                                });
                                setShowEditModal(true);
                              }}
                              title="Edit Security Metadata"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shadow-sm"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* ARCHIVE TOGGLE ICON */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleArchiveToggle(rec)}
                              title={rec.status === 'ARCHIVED' ? 'Restore from Archive' : 'Archive Record'}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border border-slate-700 transition shadow-sm"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* PERMANENT DELETE ICON */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                setSelectedRecord(rec);
                                setShowDeleteModal(true);
                              }}
                              title="Delete Record"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 border border-red-500/30 transition shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL 1: VIEW SECURITY DOSSIER ── */}
      <AnimatePresence>
        {showDetailsModal && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-[#0b101c] border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-2xl space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  selectedRecord.listType === 'BLACKLIST'
                    ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-700'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
                }`}
              />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border shadow-xl ${
                      selectedRecord.listType === 'BLACKLIST'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    {selectedRecord.visitorName?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">{selectedRecord.visitorName || 'Unregistered Profile'}</h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          selectedRecord.listType === 'BLACKLIST'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {selectedRecord.listType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      REF: {selectedRecord.visitorCode || 'N/A'} • System ID: #{selectedRecord.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Identity Document</span>
                  <p className="font-mono font-bold text-white">{selectedRecord.idNumber || '—'}</p>
                  <p className="text-[10px] text-slate-500">{selectedRecord.idType || 'National ID'}</p>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Threat Level</span>
                  <p
                    className={`font-black ${
                      selectedRecord.riskLevel === 'CRITICAL'
                        ? 'text-rose-400'
                        : selectedRecord.riskLevel === 'HIGH'
                        ? 'text-orange-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {selectedRecord.riskLevel} SEVERITY
                  </p>
                  <p className="text-[10px] text-slate-500">Status: {selectedRecord.status}</p>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Effective Window</span>
                  <p className="font-bold text-white">
                    {selectedRecord.effectiveDate
                      ? new Date(selectedRecord.effectiveDate).toLocaleDateString()
                      : 'Immediate'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Expires: {selectedRecord.expiryDate ? new Date(selectedRecord.expiryDate).toLocaleDateString() : 'Indefinite'}
                  </p>
                </div>
              </div>

              {/* Synopsis & Reason */}
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Stated Incident Reason
                  </span>
                  <p className="text-slate-200 leading-relaxed font-medium">{selectedRecord.reason}</p>
                </div>

                {selectedRecord.description && (
                  <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Detailed Telemetry</span>
                    <p className="text-slate-300 leading-relaxed">{selectedRecord.description}</p>
                  </div>
                )}

                {selectedRecord.internalNotes && (
                  <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">Security Internal Notes</span>
                    <p className="text-slate-300 leading-relaxed">{selectedRecord.internalNotes}</p>
                  </div>
                )}
              </div>

              {/* Fast Action Triggers */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleSetBlacklist(selectedRecord);
                      setShowDetailsModal(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <UserX className="w-3.5 h-3.5" /> Blacklist
                  </button>
                  <button
                    onClick={() => {
                      handleSetWatchlist(selectedRecord);
                      setShowDetailsModal(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Radio className="w-3.5 h-3.5" /> Watchlist
                  </button>
                </div>

                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: CLEARANCE REVIEW ── */}
      <AnimatePresence>
        {showClearanceModal && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b101c] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" /> Security Clearance & Audit
                </h2>
                <button onClick={() => setShowClearanceModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Granting legal or security clearance changes the subject status to <strong className="text-emerald-400">CLEARED</strong> and permits gate access.
              </p>

              <form onSubmit={handleClearanceSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                    Clearance Decision *
                  </label>
                  <select
                    value={clearanceForm.decision}
                    onChange={e => setClearanceForm(f => ({ ...f, decision: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-900 text-white rounded-xl focus:border-emerald-500"
                  >
                    <option value="APPROVE_CLEARANCE">✅ Approve Clearance (Remove Lockout & Clear)</option>
                    <option value="REJECT_CLEARANCE">❌ Reject Clearance (Maintain Watchlist/Lockout)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                    Legal / Security Audit Notes *
                  </label>
                  <textarea
                    rows={4}
                    value={clearanceForm.notes}
                    onChange={e => setClearanceForm(f => ({ ...f, notes: e.target.value }))}
                    required
                    placeholder="Document basis for clearance (e.g. Identity verified by Legal Officer, incident resolved)..."
                    className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-900 text-white rounded-xl focus:border-emerald-500 placeholder-slate-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClearanceModal(false)}
                    className="flex-1 h-10 min-h-[40px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingModal}
                    className="flex-1 h-10 min-h-[40px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {submittingModal && <RefreshCw className="h-4 w-4 animate-spin shrink-0" />}
                    <span>{submittingModal ? 'Committing...' : 'Commit Clearance Decision'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: EDIT RECORD ── */}
      <AnimatePresence>
        {showEditModal && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b101c] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-indigo-400" /> Edit Security Classification
                </h2>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">List Type</label>
                    <select
                      value={editForm.listType}
                      onChange={e => setEditForm(f => ({ ...f, listType: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-white rounded-xl"
                    >
                      <option value="WATCHLIST">Watchlist (Monitoring)</option>
                      <option value="BLACKLIST">Blacklist (Immediate Lockout)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Threat Risk Level</label>
                    <select
                      value={editForm.riskLevel}
                      onChange={e => setEditForm(f => ({ ...f, riskLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-white rounded-xl"
                    >
                      <option value="LOW">Low Risk</option>
                      <option value="MEDIUM">Medium Risk</option>
                      <option value="HIGH">High Risk</option>
                      <option value="CRITICAL">Critical Risk</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Flag Reason *</label>
                  <input
                    type="text"
                    value={editForm.reason}
                    onChange={e => setEditForm(f => ({ ...f, reason: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-white rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Detailed Description</label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-white rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Internal Notes</label>
                  <input
                    type="text"
                    value={editForm.internalNotes}
                    onChange={e => setEditForm(f => ({ ...f, internalNotes: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-white rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 h-10 min-h-[40px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingModal}
                    className="flex-1 h-10 min-h-[40px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {submittingModal && <RefreshCw className="h-4 w-4 animate-spin shrink-0" />}
                    <span>{submittingModal ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 4: DELETE CONFIRMATION ── */}
      <AnimatePresence>
        {showDeleteModal && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b101c] border border-rose-900/50 rounded-3xl p-6 sm:p-7 w-full max-w-md space-y-4 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
                <Trash2 className="w-7 h-7" />
              </div>

              <h2 className="text-lg font-black text-white">Permanently Remove Subject?</h2>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove <strong className="text-white">{selectedRecord.visitorName || selectedRecord.idNumber}</strong> from the intelligence database? Perimeter restrictions will be lifted.
              </p>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 h-10 min-h-[40px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoadingId === selectedRecord.id}
                  onClick={handleConfirmDelete}
                  className="flex-1 h-10 min-h-[40px] bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {actionLoadingId === selectedRecord.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                  ) : (
                    <Trash2 className="h-4 w-4 shrink-0" />
                  )}
                  <span>{actionLoadingId === selectedRecord.id ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 5: ADD RECORD ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b101c] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-500" /> Add Intelligence Entry
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      {t('form.listType', 'List Type')} *
                    </label>
                    <select
                      value={addForm.listType}
                      onChange={e => setAddForm(f => ({ ...f, listType: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-white rounded-xl"
                    >
                      <option value="WATCHLIST">{t('form.watchlist', 'Watchlist (Screening Required)')}</option>
                      <option value="BLACKLIST">{t('form.blacklist', 'Blacklist (Immediate Block)')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      {t('form.riskLevel', 'Risk Level')} *
                    </label>
                    <select
                      value={addForm.riskLevel}
                      onChange={e => setAddForm(f => ({ ...f, riskLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-white rounded-xl"
                    >
                      <option value="LOW">{t('risk.low', 'Low Risk')}</option>
                      <option value="MEDIUM">{t('risk.medium', 'Medium Risk')}</option>
                      <option value="HIGH">{t('risk.high', 'High Risk')}</option>
                      <option value="CRITICAL">{t('risk.critical', 'Critical Risk')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      {t('form.visitorName', 'Visitor Full Name')} *
                    </label>
                    <input
                      type="text"
                      value={addForm.visitorName}
                      data-invalid={Boolean(addErrors.visitorName)}
                      aria-invalid={Boolean(addErrors.visitorName)}
                      onChange={e => {
                        setAddForm(f => ({ ...f, visitorName: e.target.value }));
                        clearAddError('visitorName');
                      }}
                      placeholder={t('placeholder.fullName', 'e.g. John Doe')}
                      className={`w-full px-3 py-2 bg-slate-900 text-white rounded-xl focus:outline-none transition-all ${
                        addErrors.visitorName ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-700'
                      }`}
                    />
                    <FieldError error={addErrors.visitorName} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      {t('form.idNumber', 'Identity Credential')} *
                    </label>
                    <input
                      type="text"
                      value={addForm.idNumber}
                      data-invalid={Boolean(addErrors.idNumber)}
                      aria-invalid={Boolean(addErrors.idNumber)}
                      onChange={e => {
                        setAddForm(f => ({ ...f, idNumber: e.target.value }));
                        clearAddError('idNumber');
                      }}
                      placeholder={t('placeholder.idNumber', 'Passport or NID...')}
                      className={`w-full px-3 py-2 bg-slate-900 text-white rounded-xl focus:outline-none transition-all ${
                        addErrors.idNumber ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-700'
                      }`}
                    />
                    <FieldError error={addErrors.idNumber} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {t('form.reason', 'Flag Reason')} *
                  </label>
                  <input
                    type="text"
                    value={addForm.reason}
                    data-invalid={Boolean(addErrors.reason)}
                    aria-invalid={Boolean(addErrors.reason)}
                    onChange={e => {
                      setAddForm(f => ({ ...f, reason: e.target.value }));
                      clearAddError('reason');
                    }}
                    required
                    placeholder={t('placeholder.reason', 'Trespass, security incident, observation...')}
                    className={`w-full px-3 py-2 bg-slate-900 text-white rounded-xl focus:outline-none transition-all ${
                      addErrors.reason ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-700'
                    }`}
                  />
                  <FieldError error={addErrors.reason} />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-10 min-h-[40px] bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl transition"
                  >
                    {t('btn.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingModal}
                    className="flex-1 h-10 min-h-[40px] bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {submittingModal && <RefreshCw className="h-4 w-4 animate-spin shrink-0" />}
                    <span>{submittingModal ? 'Adding Record...' : t('btn.create', 'Add Record')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 6: VERIFICATION SANDBOX ── */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b101c] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Play className="h-5 w-5 text-emerald-400" /> Identity Screening Sandbox
                </h2>
                <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <input
                  type="text"
                  value={verifyForm.idNumber}
                  onChange={e => setVerifyForm(f => ({ ...f, idNumber: e.target.value }))}
                  placeholder={t('placeholder.idNumber', 'Identity / Passport Number')}
                  className="w-full px-3 py-2.5 border border-slate-700 bg-slate-900 text-white rounded-xl"
                />
                <input
                  type="text"
                  value={verifyForm.email}
                  onChange={e => setVerifyForm(f => ({ ...f, email: e.target.value }))}
                  placeholder={t('placeholder.email', 'Email Address')}
                  className="w-full px-3 py-2.5 border border-slate-700 bg-slate-900 text-white rounded-xl"
                />
                <button
                  onClick={runVerification}
                  disabled={verifying}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 transition"
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {t('btn.verify', 'Run Screening Engine')}
                </button>

                {verifyResult && (
                  <div
                    className={`p-4 rounded-xl border space-y-1.5 ${
                      verifyResult.verificationResult === 'CLEARED'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <p className="font-black text-sm uppercase">Status: {verifyResult.verificationResult}</p>
                    <p>Risk Score: {verifyResult.riskScore}/100 ({verifyResult.riskLevel})</p>
                    <p>Matching Database Hits: {verifyResult.hitsCount}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 text-right">
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  {t('btn.close', 'Close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
