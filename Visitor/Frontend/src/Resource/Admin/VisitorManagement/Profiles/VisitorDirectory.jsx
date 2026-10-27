import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, User, Mail, Phone, Building2, ShieldCheck,
  ShieldAlert, ShieldX, ShieldQuestion, AlertTriangle, Archive, Loader2,
  Edit3, Trash2, Copy, Check, ExternalLink, QrCode, Sparkles, UserCheck
} from 'lucide-react';
import { visitorProfileApi } from '../../../../modules/visitor-management/api/visitorProfileApi';
import { resolvePhotoUrl } from '../../../../utils/photoUtils';

// Status badge color themes
const statusColors = {
  ACTIVE: { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' },
  INACTIVE: { bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400', dot: 'bg-slate-400' },
  SUSPENDED: { bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400', dot: 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]' },
  PENDING: { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' },
  BLACKLISTED: { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]' },
  ARCHIVED: { bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400', dot: 'bg-purple-400' }
};

const verificationBadges = {
  VERIFIED: {
    icon: <ShieldCheck size={13} className="text-emerald-400" />,
    style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    label: 'Verified'
  },
  PENDING: {
    icon: <ShieldQuestion size={13} className="text-amber-400" />,
    style: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    label: 'Pending'
  },
  UNVERIFIED: {
    icon: <ShieldAlert size={13} className="text-slate-400" />,
    style: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    label: 'Unverified'
  },
  REJECTED: {
    icon: <ShieldX size={13} className="text-rose-400" />,
    style: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    label: 'Rejected'
  }
};

const VisitorAvatar = ({ photoUrl, firstName, lastName, size = 'md' }) => {
  const [error, setError] = useState(false);
  const resolvedUrl = resolvePhotoUrl(photoUrl);
  const initials = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'VP';
  const sizeClasses = size === 'lg' ? 'w-14 h-14 text-sm' : size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs';

  if (resolvedUrl && !error) {
    return (
      <img
        src={resolvedUrl}
        alt=""
        onError={() => setError(true)}
        className={`${sizeClasses} rounded-2xl object-cover border border-indigo-500/30 shadow-md shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-2xl flex items-center justify-center font-black uppercase tracking-wider shrink-0 bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-900 text-indigo-300 border border-indigo-500/30 shadow-inner`}
    >
      {initials}
    </div>
  );
};

const VisitorDirectory = ({
  data = [],
  pagination = { page: 1, limit: 15, total: 0, totalPages: 0 },
  loading = false,
  viewMode = 'table',
  onViewProfile,
  onPageChange,
  onRefresh
}) => {
  const { page, total, totalPages } = pagination;
  const [visitorToDelete, setVisitorToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const confirmDeleteVisitor = async () => {
    if (!visitorToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await visitorProfileApi.deleteProfile(visitorToDelete.id);
      setVisitorToDelete(null);
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete visitor profile');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 rounded-2xl bg-[#070c16]/80 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <User className="w-5 h-5 text-indigo-400 absolute" />
        </div>
        <p className="text-sm font-bold text-white">Loading Visitor Directory...</p>
        <p className="text-xs text-slate-500 mt-1">Retrieving profile and biometric status records</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-24 rounded-2xl bg-[#070c16]/80 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <User size={30} />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Visitor Profiles Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
          No records match your active search or filter criteria. Try clearing filters or register a new visitor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((visitor, idx) => {
            const stColor = statusColors[visitor.status] || statusColors.PENDING;
            const vBadge = verificationBadges[visitor.id_verification_status] || verificationBadges.UNVERIFIED;

            return (
              <motion.div
                key={visitor.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                onClick={() => onViewProfile(visitor.id)}
                className="group relative rounded-2xl bg-gradient-to-br from-[#0c1322] via-[#090e1a] to-[#070b14] border border-slate-800/80 hover:border-indigo-500/50 p-5 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Status & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${stColor.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stColor.dot}`} />
                      {visitor.status || 'ACTIVE'}
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${vBadge.style}`}>
                      {vBadge.icon}
                      <span>{vBadge.label}</span>
                    </span>
                  </div>

                  {/* Main Identity Info */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <VisitorAvatar
                      photoUrl={visitor.photo_url}
                      firstName={visitor.first_name}
                      lastName={visitor.last_name}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                        {visitor.full_name}
                        {visitor.is_blacklisted && (
                          <AlertTriangle size={12} className="text-rose-500 shrink-0" title="Blacklisted profile" />
                        )}
                        {visitor.is_archived && (
                          <Archive size={12} className="text-purple-400 shrink-0" title="Archived" />
                        )}
                      </h4>

                      {/* Code with Copy */}
                      <div className="mt-1 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(e, visitor.visitor_code)}
                          className="font-mono text-[10px] text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 px-2 py-0.5 rounded-md border border-indigo-500/30 flex items-center gap-1 transition-colors"
                          title="Click to copy ID"
                        >
                          <span>{visitor.visitor_code || `VIS-${visitor.id}`}</span>
                          {copiedCode === visitor.visitor_code ? (
                            <Check size={10} className="text-emerald-400" />
                          ) : (
                            <Copy size={10} className="text-indigo-400" />
                          )}
                        </button>

                        {visitor.category && (
                          <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60 font-medium">
                            {visitor.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact & Company Details */}
                  <div className="space-y-1.5 py-3 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-2 text-slate-300 truncate">
                      <Building2 size={12} className="text-indigo-400 shrink-0" />
                      <span className="truncate text-[11px] font-medium">
                        {visitor.organization_name || visitor.company || 'Private Individual'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 truncate">
                      <Mail size={12} className="text-slate-500 shrink-0" />
                      <span className="truncate text-[11px]">{visitor.email || 'No email provided'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 truncate">
                      <Phone size={12} className="text-slate-500 shrink-0" />
                      <span className="truncate text-[11px] font-mono">{visitor.phone || 'No phone provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/60 mt-2">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Ref: {visitor.reference_number || 'N/A'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVisitorToDelete(visitor);
                        setDeleteError(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-900/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 transition-colors"
                      title="Delete Profile"
                    >
                      <Trash2 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProfile(visitor.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <span>Adjust</span>
                      <Edit3 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl bg-[#090e1a]/90 backdrop-blur-xl">
          {/* Header */}
          <div className="grid grid-cols-[2.2fr_1.5fr_1.4fr_1fr_1.1fr_0.9fr_1.1fr] gap-3 px-5 py-3.5 border-b border-slate-800 bg-[#070b14]/90 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>Visitor Profile</span>
            <span>Contact Information</span>
            <span>Organization / Unit</span>
            <span>Status</span>
            <span>ID Verification</span>
            <span>Category</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-800/50">
            {data.map((visitor, idx) => {
              const stColor = statusColors[visitor.status] || statusColors.PENDING;
              const vBadge = verificationBadges[visitor.id_verification_status] || verificationBadges.UNVERIFIED;

              return (
                <motion.div
                  key={visitor.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  onClick={() => onViewProfile(visitor.id)}
                  className="grid grid-cols-[2.2fr_1.5fr_1.4fr_1fr_1.1fr_0.9fr_1.1fr] gap-3 px-5 py-3.5 items-center hover:bg-indigo-950/20 hover:border-l-2 hover:border-l-indigo-500 transition-all cursor-pointer group"
                >
                  {/* Visitor Column */}
                  <div className="flex items-center gap-3 min-w-0">
                    <VisitorAvatar
                      photoUrl={visitor.photo_url}
                      firstName={visitor.first_name}
                      lastName={visitor.last_name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                        {visitor.full_name}
                        {visitor.is_blacklisted && (
                          <AlertTriangle size={11} className="text-rose-500 shrink-0" title="Blacklisted profile" />
                        )}
                        {visitor.is_archived && (
                          <Archive size={11} className="text-purple-400 shrink-0" title="Archived profile" />
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(e, visitor.visitor_code)}
                        className="text-[10px] text-slate-400 font-mono hover:text-indigo-300 flex items-center gap-1 transition-colors mt-0.5"
                        title="Click to copy ID"
                      >
                        <span>{visitor.visitor_code || `VIS-${visitor.id}`}</span>
                        {copiedCode === visitor.visitor_code ? (
                          <Check size={9} className="text-emerald-400" />
                        ) : (
                          <Copy size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-300 truncate flex items-center gap-1.5">
                      <Mail size={11} className="text-indigo-400/70 shrink-0" />
                      <span>{visitor.email || '—'}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5 flex items-center gap-1.5">
                      <Phone size={11} className="text-slate-600 shrink-0" />
                      <span>{visitor.phone || '—'}</span>
                    </p>
                  </div>

                  {/* Organization */}
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-300 truncate flex items-center gap-1.5">
                      <Building2 size={11} className="text-indigo-400/70 shrink-0" />
                      <span>{visitor.organization_name || visitor.company || 'Private'}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {visitor.branch_name || visitor.department_name || ''}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${stColor.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stColor.dot}`} />
                      {visitor.status || 'ACTIVE'}
                    </span>
                  </div>

                  {/* ID Verification */}
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${vBadge.style}`}>
                      {vBadge.icon}
                      <span>{vBadge.label}</span>
                    </span>
                  </div>

                  {/* Category */}
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                      {visitor.category || 'Standard'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="text-right flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProfile(visitor.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 transition-all shadow-sm"
                      title="Adjust Profile"
                    >
                      <Edit3 size={12} />
                      <span>Adjust</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVisitorToDelete(visitor);
                        setDeleteError(null);
                      }}
                      className="inline-flex items-center justify-center p-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 transition-all shadow-sm"
                      title="Delete Visitor"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PAGINATION BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-2 text-xs">
        <p className="text-slate-400 font-medium text-[11px]">
          Showing <span className="font-bold text-white">{((page - 1) * pagination.limit) + 1}</span> to{' '}
          <span className="font-bold text-white">{Math.min(page * pagination.limit, total)}</span> of{' '}
          <span className="font-bold text-indigo-400">{total}</span> total visitor profiles
        </p>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-sm"
          >
            <ChevronLeft size={14} />
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const pg = start + i;
            if (pg > totalPages) return null;
            return (
              <button
                key={pg}
                onClick={() => onPageChange(pg)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  pg === page
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {pg}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-sm"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── DELETE VISITOR CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {visitorToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
            onClick={() => setVisitorToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400 shrink-0 shadow-lg shadow-rose-500/10">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Delete Visitor Profile</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Permanently delete <span className="font-bold text-white">{visitorToDelete.full_name}</span> (
                    <span className="font-mono text-indigo-300">{visitorToDelete.visitor_code}</span>)?
                  </p>
                </div>
              </div>

              <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-2xl text-xs text-rose-200/90 space-y-1.5">
                <p className="font-bold text-rose-200 flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  <span>Permanent Cascade Deletion</span>
                </p>
                <p className="text-[11px] leading-relaxed text-rose-300/80">
                  This will securely delete the visitor profile and all associated appointments, documents, check-in history, access passes, and biometric verification data across the system.
                </p>
                {deleteError && (
                  <p className="text-[11px] text-red-400 font-bold mt-2 bg-red-950/70 p-2 rounded-xl border border-red-800/60">
                    {deleteError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVisitorToDelete(null)}
                  disabled={deleting}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteVisitor}
                  disabled={deleting}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisitorDirectory;
