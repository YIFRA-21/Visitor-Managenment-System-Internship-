import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, Mail, Phone, Building2, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, AlertTriangle, Archive, Loader2, Edit3, Trash2 } from 'lucide-react';
import { visitorProfileApi } from '../../../../modules/visitor-management/api/visitorProfileApi';
import { resolvePhotoUrl } from '../../../../utils/photoUtils';
// Status badge colors
const statusColors = {
    ACTIVE: { bg: '#052e1620', text: '#22c55e', dot: '#22c55e' },
    INACTIVE: { bg: '#1e293b40', text: '#94a3b8', dot: '#94a3b8' },
    SUSPENDED: { bg: '#7c2d1220', text: '#f97316', dot: '#f97316' },
    PENDING: { bg: '#451a0320', text: '#f59e0b', dot: '#f59e0b' },
};
const verificationIcons = {
    VERIFIED: <ShieldCheck size={13} className="text-green-400"/>,
    PENDING: <ShieldQuestion size={13} className="text-amber-400"/>,
    UNVERIFIED: <ShieldAlert size={13} className="text-slate-500"/>,
    REJECTED: <ShieldX size={13} className="text-red-400"/>,
};
const VisitorAvatar = ({ photoUrl, firstName, lastName }) => {
    const [error, setError] = React.useState(false);
    const resolvedUrl = resolvePhotoUrl(photoUrl);
    const initials = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'VP';
    if (resolvedUrl && !error) {
        return (<img src={resolvedUrl} alt="" onError={() => setError(true)} className="w-8 h-8 rounded-full object-cover border border-indigo-500/30 flex-shrink-0"/>);
    }
    return (<div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-wider flex-shrink-0 bg-gradient-to-tr from-indigo-900 to-slate-800 text-indigo-300 border border-indigo-500/30">
      {initials}
    </div>);
};
const VisitorDirectory = ({ data, pagination, loading, onViewProfile, onPageChange, onRefresh }) => {
    const { page, total, totalPages } = pagination;
    const [visitorToDelete, setVisitorToDelete] = React.useState(null);
    const [deleting, setDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState(null);
    const confirmDeleteVisitor = async () => {
        if (!visitorToDelete)
            return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await visitorProfileApi.deleteProfile(visitorToDelete.id);
            setVisitorToDelete(null);
            onRefresh();
        }
        catch (err) {
            setDeleteError(err.response?.data?.message || err.message || 'Failed to delete visitor');
        }
        finally {
            setDeleting(false);
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-500" size={28}/>
        <span className="ml-3 text-sm text-slate-400">Loading visitor directory...</span>
      </div>);
    }
    if (data.length === 0) {
        return (<div className="text-center py-16">
        <User className="mx-auto text-slate-600 mb-3" size={40}/>
        <p className="text-sm text-slate-500 font-medium">No visitor profiles found</p>
        <p className="text-xs text-slate-600 mt-1">Try adjusting your search or filter criteria.</p>
      </div>);
    }
    return (<div>
      {/* Grid Table */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden" style={{ background: '#0b101b' }}>
        {/* Header */}
        <div className="grid grid-cols-[2.2fr_1.4fr_1.3fr_0.9fr_1fr_0.8fr_1.1fr] gap-0 px-4 py-2.5 border-b border-slate-800/60" style={{ background: '#080d17' }}>
          {['Visitor', 'Contact', 'Organization', 'Status', 'ID Verification', 'Category', 'Actions'].map((h) => (<span key={h} className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{h}</span>))}
        </div>

        {/* Rows */}
        {data.map((visitor, idx) => {
            const stColor = statusColors[visitor.status] || statusColors.PENDING;
            return (<motion.div key={visitor.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02, duration: 0.25 }} className="grid grid-cols-[2.2fr_1.4fr_1.3fr_0.9fr_1fr_0.8fr_1.1fr] gap-0 px-4 py-3 items-center border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors cursor-pointer group" onClick={() => onViewProfile(visitor.id)}>
              {/* Visitor Name & Code */}
              <div className="flex items-center gap-3 min-w-0">
                <VisitorAvatar photoUrl={visitor.photo_url} firstName={visitor.first_name} lastName={visitor.last_name}/>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                    {visitor.full_name}
                    {visitor.is_blacklisted && <AlertTriangle size={11} className="text-red-500 flex-shrink-0"/>}
                    {visitor.is_archived && <Archive size={11} className="text-purple-500 flex-shrink-0"/>}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{visitor.visitor_code}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="min-w-0">
                <p className="text-[11px] text-slate-300 truncate flex items-center gap-1">
                  <Mail size={10} className="text-slate-600 flex-shrink-0"/>
                  {visitor.email || '—'}
                </p>
                <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <Phone size={10} className="text-slate-600 flex-shrink-0"/>
                  {visitor.phone || '—'}
                </p>
              </div>

              {/* Organization */}
              <div className="min-w-0">
                <p className="text-[11px] text-slate-300 truncate flex items-center gap-1">
                  <Building2 size={10} className="text-slate-600 flex-shrink-0"/>
                  {visitor.organization_name || visitor.company || '—'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {visitor.branch_name || visitor.department_name || ''}
                </p>
              </div>

              {/* Status */}
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: stColor.bg, color: stColor.text }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: stColor.dot }}/>
                  {visitor.status}
                </span>
              </div>

              {/* ID Verification */}
              <div className="flex items-center gap-1">
                {verificationIcons[visitor.id_verification_status || 'UNVERIFIED']}
                <span className="text-[10px] font-medium text-slate-400">
                  {visitor.id_verification_status || 'N/A'}
                </span>
              </div>

              {/* Category */}
              <div>
                <span className="text-[11px] text-slate-400">{visitor.category || '—'}</span>
              </div>

              {/* Action */}
              <div className="text-right flex items-center justify-end gap-1.5">
                <button type="button" onClick={(e) => { e.stopPropagation(); onViewProfile(visitor.id); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 transition-all shadow-sm group-hover:bg-indigo-600 group-hover:text-white" title="Adjust Profile">
                  <Edit3 size={12}/>
                  <span>Adjust</span>
                </button>
                <button type="button" onClick={(e) => {
                    e.stopPropagation();
                    setVisitorToDelete(visitor);
                    setDeleteError(null);
                }} className="inline-flex items-center justify-center p-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 transition-all shadow-sm" title="Delete Visitor & All Records">
                  <Trash2 size={12}/>
                </button>
              </div>
            </motion.div>);
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-1">
        <p className="text-[10px] text-slate-600 font-medium">
          Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, total)} of {total} visitors
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="p-1.5 rounded-lg text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 transition-all">
            <ChevronLeft size={14}/>
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const pg = start + i;
            if (pg > totalPages)
                return null;
            return (<button key={pg} onClick={() => onPageChange(pg)} className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${pg === page
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50'}`}>
                {pg}
              </button>);
        })}
          <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 transition-all">
            <ChevronRight size={14}/>
          </button>
        </div>
      </div>

      {/* ── DELETE VISITOR CONFIRMATION MODAL ── */}
      {visitorToDelete && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setVisitorToDelete(null)}>
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
                <AlertTriangle size={24}/>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Delete Visitor</h3>
                <p className="text-xs text-slate-400">
                  Permanently delete <span className="font-semibold text-white">{visitorToDelete.full_name}</span> ({visitorToDelete.visitor_code})?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-300 space-y-1.5">
              <p className="font-semibold text-rose-200">Cascade Cleanup:</p>
              <p className="text-[11px] text-rose-200/80">
                This will delete the visitor profile and all associated documents, visit history, check-in records, appointments, passes, and verifications across the entire system.
              </p>
              {deleteError && (<p className="text-[11px] text-red-400 font-bold mt-1 bg-red-950/50 p-1.5 rounded border border-red-800/40">
                  {deleteError}
                </p>)}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setVisitorToDelete(null)} disabled={deleting} className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={confirmDeleteVisitor} disabled={deleting} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg transition-colors disabled:opacity-50">
                {deleting ? (<>
                    <Loader2 size={14} className="animate-spin"/>
                    <span>Deleting...</span>
                  </>) : (<>
                    <Trash2 size={14}/>
                    <span>Confirm Delete</span>
                  </>)}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
};
export default VisitorDirectory;
