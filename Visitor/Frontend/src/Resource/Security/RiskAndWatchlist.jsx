import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  UserX,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  Radio,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  FileText
} from 'lucide-react';
import { securityApi, blacklistWatchlistApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import useResponseNavigation from '../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../modules/response/responseConfig';

export default function RiskAndWatchlist() {
  const { t } = useLanguage();
  const { toConfirmation } = useResponseNavigation();
  const { showNotification } = useNotification();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [form, setForm] = useState({ email: '', phone: '', reason: '', riskLevel: 'MEDIUM', visitorName: '' });

  const showToast = (message, type = 'success') => {
    showNotification(message, type);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await securityApi.watchlist();
      setWatchlist(res.data.data || res.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) return;
    try {
      await securityApi.addToWatchlist(form);
      setShowAddModal(false);
      setForm({ email: '', phone: '', reason: '', riskLevel: 'MEDIUM', visitorName: '' });
      showToast('Subject successfully flagged to security intelligence registry.', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleRemove = (id, name) => {
    toConfirmation({
      title: 'Remove Watchlist Record',
      message: `Are you sure you want to remove ${name || 'this record'} from the security watchlist?`,
      entityType: 'Watchlist Entry',
      entityName: name || `Record #${id}`,
      consequences: [
        'Security screening flags for this individual will be removed.',
        'Access gates will no longer automatically alert on this credential.'
      ],
      confirmLabel: 'Remove from Watchlist',
      confirmVariant: 'warning',
      apiEndpoint: `/security/watchlist/${id}`,
      apiMethod: 'DELETE',
      returnUrl: window.location.pathname + window.location.search,
      successConfig: {
        type: RESPONSE_TYPES.WATCHLIST_RESULT,
        title: 'Watchlist Record Removed',
        message: `${name || 'The subject'} was successfully removed from the security watchlist.`,
      }
    });
  };

  const handleElevateBlacklist = async (item) => {
    try {
      if (blacklistWatchlistApi?.updateRecord) {
        await blacklistWatchlistApi.updateRecord(item.id, { listType: 'BLACKLIST', riskLevel: 'HIGH', status: 'ACTIVE' });
      }
      setWatchlist(prev =>
        prev.map(x => (x.id === item.id ? { ...x, riskLevel: 'CRITICAL', listType: 'BLACKLIST' } : x))
      );
      showToast(`🛡️ ${item.visitorName || item.email || 'Subject'} elevated to ACTIVE BLACKLIST (Access Blocked).`, 'error');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleDesignateWatchlist = async (item) => {
    try {
      if (blacklistWatchlistApi?.updateRecord) {
        await blacklistWatchlistApi.updateRecord(item.id, { listType: 'WATCHLIST', riskLevel: 'MEDIUM', status: 'ACTIVE' });
      }
      setWatchlist(prev =>
        prev.map(x => (x.id === item.id ? { ...x, riskLevel: 'MEDIUM', listType: 'WATCHLIST' } : x))
      );
      showToast(`👁️ ${item.visitorName || item.email || 'Subject'} designated under ACTIVE WATCHLIST (Monitoring Active).`, 'warning');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const filtered = watchlist.filter(
    w =>
      !search ||
      (w.visitorName || w.email || w.phone || w.reason || '')
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const RiskBadge = ({ level }) => {
    const colors = {
      LOW: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    };
    return (
      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${colors[level] || colors.MEDIUM}`}>
        {level || 'MEDIUM'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-white p-4 md:p-6 lg:p-8 space-y-6 relative font-sans">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toast.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
            {toast.type === 'warning' && <Radio className="w-4 h-4 text-amber-400 animate-pulse" />}
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0d1627] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              Active Threat Telemetry
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-rose-500 shrink-0" />
              {t('security.watchlistHub', 'Watchlist & Threat Intelligence Hub')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {t('security.watchlistHubDesc', 'Perimeter screening, risk monitoring, and access restriction controls for flagged individuals')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold uppercase tracking-wide rounded-xl shadow-lg shadow-rose-600/30 transition"
            >
              <Plus className="h-4 w-4" /> {t('btn.addFlaggedVisitor', 'Add Flagged Subject')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-rose-400' : ''}`} /> {t('btn.refresh', 'Sync Directory')}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('placeholder.searchWatchlist', 'Search by name, email, phone, or incident reason...')}
            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-slate-500"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-bold">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Animated Table */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-gradient-to-r from-slate-900 via-[#0c1222] to-slate-900">
                <th className="px-5 py-4">{t('table.visitorContact', 'Visitor / Contact')}</th>
                <th className="px-4 py-4">{t('table.threatLevel', 'Threat Level')}</th>
                <th className="px-4 py-4">{t('table.reasonDetails', 'Incident Reason & Details')}</th>
                <th className="px-4 py-4">{t('table.dateAdded', 'Added Date')}</th>
                <th className="px-5 py-4 text-center">{t('table.actions', 'Action Hub')}</th>
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
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-rose-500 mx-auto mb-2" />
                    <span className="text-slate-400 font-bold text-xs">Loading threat directory...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    {t('empty.watchlist', 'No watchlist records found matching criteria.')}
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-slate-200">
                          {item.visitorName?.charAt(0) || item.email?.charAt(0) || 'V'}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-rose-400 transition-colors">
                            {item.visitorName || item.email || 'Anonymous Subject'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {item.phone || item.email || 'No direct contact'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <RiskBadge level={item.riskLevel} />
                    </td>

                    <td className="px-4 py-3.5 text-slate-300 max-w-md">
                      <p className="truncate font-medium">{item.reason}</p>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
                        {/* VIEW */}
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedItem(item);
                            setShowDetailsModal(true);
                          }}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 transition shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </motion.button>

                        {/* BLACKLIST */}
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleElevateBlacklist(item)}
                          title="Elevate to Blacklist (Perimeter Lockout)"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30 transition shadow-sm"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </motion.button>

                        {/* WATCHLIST */}
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDesignateWatchlist(item)}
                          title="Place under Watchlist (Continuous Surveillance)"
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-500/30 transition shadow-sm"
                        >
                          <Radio className="w-3.5 h-3.5" />
                        </motion.button>

                        {/* DELETE */}
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRemove(item.id, item.visitorName || item.email)}
                          title="Remove from Watchlist"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 border border-red-500/30 transition shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b101c] border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" /> Watchlist Subject Details
                </h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
                <p><span className="text-slate-400 uppercase font-bold">Subject Name:</span> <strong className="text-white">{selectedItem.visitorName || 'N/A'}</strong></p>
                <p><span className="text-slate-400 uppercase font-bold">Email:</span> <strong className="text-white">{selectedItem.email || 'N/A'}</strong></p>
                <p><span className="text-slate-400 uppercase font-bold">Phone:</span> <strong className="text-white">{selectedItem.phone || 'N/A'}</strong></p>
                <p><span className="text-slate-400 uppercase font-bold">Threat Level:</span> <RiskBadge level={selectedItem.riskLevel} /></p>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 uppercase font-bold block mb-1">Reason for Flag:</span>
                  <p className="text-slate-200 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800">{selectedItem.reason}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowDetailsModal(false)} className="px-5 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b101c] border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <UserX className="h-5 w-5 text-rose-500" /> {t('security.flagVisitorTitle', 'Flag Visitor to Watchlist')}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Visitor Full Name</label>
                  <input
                    type="text"
                    value={form.visitorName}
                    onChange={e => setForm(f => ({ ...f, visitorName: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {t('form.emailOrId', 'Visitor Email / Identifier')}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder={t('placeholder.email', 'visitor@example.com')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {t('form.phone', 'Phone Number')}
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder={t('placeholder.phone', '+251-9XX-XXX-XXX')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {t('form.threatLevel', 'Threat Level')}
                  </label>
                  <select
                    value={form.riskLevel}
                    onChange={e => setForm(f => ({ ...f, riskLevel: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl"
                  >
                    <option value="LOW">{t('risk.low', 'Low Risk')}</option>
                    <option value="MEDIUM">{t('risk.medium', 'Medium Risk')}</option>
                    <option value="HIGH">{t('risk.high', 'High Risk')}</option>
                    <option value="CRITICAL">{t('risk.critical', 'Critical Threat / Blacklist')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {t('form.reasonForFlagging', 'Reason for Flagging *')}
                  </label>
                  <textarea
                    value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    required
                    rows={3}
                    placeholder={t('placeholder.reasonForFlagging', 'Describe threat or security concern...')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                  >
                    {t('btn.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition"
                  >
                    {t('btn.flagVisitor', 'Flag Visitor')}
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
