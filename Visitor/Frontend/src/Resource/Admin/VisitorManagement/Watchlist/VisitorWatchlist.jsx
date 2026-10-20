import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  Plus,
  Eye,
  Trash2,
  AlertTriangle,
  UserX,
  CheckCircle2,
  Radio,
  Lock,
  X
} from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import useResponseNavigation from '../../../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../../../modules/response/responseConfig';

export default function VisitorWatchlist() {
  const { t, tStatus } = useLanguage();
  const { toConfirmation } = useResponseNavigation();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [toast, setToast] = useState(null);

  const [watchlistEntries, setWatchlistEntries] = useState([
    {
      id: 1,
      name: 'Robert Smith',
      idNumber: 'PP-987654',
      reason: 'Previous security incident and altercation',
      severity: 'high',
      listType: 'WATCHLIST',
      addedBy: 'Admin Officer',
      addedOn: '2025-03-15',
      status: 'Active',
      photo: null
    },
    {
      id: 2,
      name: 'Jane Williams',
      idNumber: 'NID-456789',
      reason: 'Suspicious behavior reported around server room',
      severity: 'medium',
      listType: 'WATCHLIST',
      addedBy: 'Security Guard',
      addedOn: '2025-04-20',
      status: 'Active',
      photo: null
    },
    {
      id: 3,
      name: 'Mark Thompson',
      idNumber: 'DL-112233',
      reason: 'Blacklisted by executive management for industrial espionage',
      severity: 'critical',
      listType: 'BLACKLIST',
      addedBy: 'HR Manager',
      addedOn: '2025-01-10',
      status: 'Active',
      photo: null
    },
    {
      id: 4,
      name: 'Lisa Chen',
      idNumber: 'PP-334455',
      reason: 'Unauthorized access attempt to laboratory',
      severity: 'high',
      listType: 'WATCHLIST',
      addedBy: 'IT Security',
      addedOn: '2025-05-01',
      status: 'Resolved',
      photo: null
    }
  ]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleElevateBlacklist = (entry) => {
    setWatchlistEntries(prev =>
      prev.map(e => (e.id === entry.id ? { ...e, listType: 'BLACKLIST', severity: 'critical', status: 'Active' } : e))
    );
    showToast(`🛡️ ${entry.name} elevated to ACTIVE BLACKLIST. Turnstile lock engaged.`, 'error');
  };

  const handleDesignateWatchlist = (entry) => {
    setWatchlistEntries(prev =>
      prev.map(e => (e.id === entry.id ? { ...e, listType: 'WATCHLIST', severity: 'medium', status: 'Active' } : e))
    );
    showToast(`👁️ ${entry.name} placed under ACTIVE WATCHLIST. Surveillance team alerted.`, 'warning');
  };

  const handleResolveClearance = (entry) => {
    setWatchlistEntries(prev =>
      prev.map(e => (e.id === entry.id ? { ...e, status: 'Resolved' } : e))
    );
    showToast(`✅ Security clearance resolved for ${entry.name}.`, 'success');
  };

  const handleDelete = (id, name) => {
    toConfirmation({
      title: 'Remove from Watchlist',
      message: `Are you sure you want to permanently remove ${name} from the security watchlist?`,
      entityType: 'Watchlist Record',
      entityName: name,
      consequences: [
        'Security screening flags for this individual will be removed.',
        'Front-desk alerts will no longer be generated when this individual registers.'
      ],
      confirmLabel: 'Remove from Watchlist',
      confirmVariant: 'warning',
      apiEndpoint: `/security/watchlist/${id}`,
      apiMethod: 'DELETE',
      returnUrl: window.location.pathname + window.location.search,
      successConfig: {
        type: RESPONSE_TYPES.WATCHLIST_RESULT,
        title: 'Subject Removed from Watchlist',
        message: `${name} has been removed from the security watchlist.`,
      }
    });
  };

  const getSeverityBadge = (severity) => {
    const map = {
      critical: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    };
    return map[severity] || map.low;
  };

  const filtered = watchlistEntries.filter(e => {
    if (filterType !== 'all' && e.severity !== filterType) return false;
    if (
      search &&
      !e.name.toLowerCase().includes(search.toLowerCase()) &&
      !e.idNumber.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6 relative font-sans">
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Visitor Threat & Watchlist Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time surveillance & perimeter blacklist enforcement</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all">
            <Plus className="w-4 h-4" /> Add to Watchlist
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Flagged', value: watchlistEntries.length, icon: ShieldAlert, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
          { label: 'Blacklisted (Blocked)', value: watchlistEntries.filter(e => e.listType === 'BLACKLIST' || e.severity === 'critical').length, icon: Lock, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
          { label: 'High Risk Watch', value: watchlistEntries.filter(e => e.severity === 'high').length, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Cleared / Resolved', value: watchlistEntries.filter(e => e.status === 'Resolved').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
        ].map((stat, i) => (
          <div key={i} className="p-3.5 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`p-1.5 rounded-xl border ${stat.bg}`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID number, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#0a0f1d] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none font-semibold"
        >
          <option value="all">All Severity Levels</option>
          <option value="critical">Critical (Blacklist)</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </div>

      {/* Animated Table */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-[#0c1222] to-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                <th className="px-5 py-3.5 text-left">{t('table.visitor', 'Subject / Visitor')}</th>
                <th className="px-4 py-3.5 text-left">{t('table.identityNumber', 'ID Number')}</th>
                <th className="px-4 py-3.5 text-left">List Category</th>
                <th className="px-4 py-3.5 text-left">{t('table.reason', 'Flag Reason')}</th>
                <th className="px-4 py-3.5 text-left">{t('table.riskLevel', 'Severity')}</th>
                <th className="px-4 py-3.5 text-left">{t('table.createdDate', 'Indexed')}</th>
                <th className="px-4 py-3.5 text-left">{t('table.status', 'Status')}</th>
                <th className="px-5 py-3.5 text-center">{t('table.actions', 'Action Hub')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <AnimatePresence>
                {filtered.map((entry) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-white">
                          {entry.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-rose-400 transition-colors">{entry.name}</p>
                          <p className="text-[10px] text-slate-400">By {entry.addedBy}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300 font-bold">{entry.idNumber}</td>
                    <td className="px-4 py-3.5">
                      {entry.listType === 'BLACKLIST' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <Lock className="w-2.5 h-2.5" /> BLACKLIST
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Radio className="w-2.5 h-2.5" /> WATCHLIST
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 max-w-[200px] truncate">{entry.reason}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getSeverityBadge(entry.severity)}`}>
                        {entry.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">{entry.addedOn}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${entry.status === 'Active' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${entry.status === 'Active' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} />
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
                        {/* VIEW */}
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedEntry(entry)}
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 transition shadow-sm"
                          title="View Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </motion.button>

                        {/* BLACKLIST */}
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleElevateBlacklist(entry)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30 transition shadow-sm"
                          title="Elevate to Blacklist (Lockout)"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </motion.button>

                        {/* WATCHLIST */}
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDesignateWatchlist(entry)}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-500/30 transition shadow-sm"
                          title="Designate Watchlist (Monitoring)"
                        >
                          <Radio className="w-3.5 h-3.5" />
                        </motion.button>

                        {/* RESOLVE / CLEARANCE */}
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleResolveClearance(entry)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition shadow-sm"
                          title="Grant Clearance / Resolve Flag"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </motion.button>

                        {/* DELETE */}
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(entry.id, entry.name)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 border border-red-500/30 transition shadow-sm"
                          title="Remove Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30 text-rose-400" />
                    No watchlist entries match current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b101c] border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-cyan-400" /> Subject Intelligence Profile
                </h3>
                <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
                <p><span className="text-slate-400 font-bold uppercase">Subject:</span> <strong className="text-white">{selectedEntry.name}</strong></p>
                <p><span className="text-slate-400 font-bold uppercase">Identity Doc:</span> <strong className="text-white font-mono">{selectedEntry.idNumber}</strong></p>
                <p><span className="text-slate-400 font-bold uppercase">Classification:</span> <strong className="text-white">{selectedEntry.listType}</strong></p>
                <p><span className="text-slate-400 font-bold uppercase">Severity:</span> <strong className="text-amber-400">{selectedEntry.severity.toUpperCase()}</strong></p>
                <p><span className="text-slate-400 font-bold uppercase">Reported By:</span> <span className="text-slate-300">{selectedEntry.addedBy} on {selectedEntry.addedOn}</span></p>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-bold uppercase block mb-1">Reason:</span>
                  <p className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200">{selectedEntry.reason}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setSelectedEntry(null)} className="px-5 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
