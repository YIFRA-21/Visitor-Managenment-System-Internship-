import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Building, Mail, Phone, CheckCircle2, AlertCircle, FileText, UserCheck, History, Send } from 'lucide-react';
import { managerApi } from '../../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../theme/ThemeContext';
export const RequestDetailsModal = ({ isOpen, onClose, requestId, onReassignClick, onApproveSuccess, }) => {
    const { t } = useLanguage();
    const { isDark = true } = useTheme() || {};
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState(null);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    useEffect(() => {
        if (isOpen && requestId) {
            loadDetails();
            setShowRejectInput(false);
            setRejectReason('');
        }
    }, [isOpen, requestId]);
    const loadDetails = async () => {
        if (!requestId)
            return;
        setLoading(true);
        setError('');
        try {
            const data = await managerApi.getRequestDetails(requestId);
            setDetails(data);
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to load request details');
        }
        finally {
            setLoading(false);
        }
    };
    const handleForwardToHost = async () => {
        if (!requestId || !appt?.host_employee_id)
            return;
        setActionLoading(true);
        try {
            await managerApi.assignHostAndRoute(requestId, {
                hostEmployeeId: appt.host_employee_id,
                instructions: 'Forwarded by Department Manager for host approval'
            });
            if (onApproveSuccess)
                onApproveSuccess();
            onClose();
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to forward request to host');
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleDirectApprove = async () => {
        if (!requestId)
            return;
        setActionLoading(true);
        try {
            await managerApi.approveRequest(requestId, 'Approved directly by Department Manager');
            if (onApproveSuccess)
                onApproveSuccess();
            onClose();
        }
        catch (err) {
            setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to approve request');
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleReject = async () => {
        if (!requestId)
            return;
        if (!rejectReason.trim()) {
            setError('Please provide a reason for declining this request.');
            return;
        }
        setActionLoading(true);
        try {
            await managerApi.rejectRequest(requestId, rejectReason);
            if (onApproveSuccess)
                onApproveSuccess();
            onClose();
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to decline request');
        }
        finally {
            setActionLoading(false);
        }
    };
    if (!isOpen || !requestId)
        return null;
    const appt = details?.appointment;
    const approvals = details?.approvals || [];
    const isPending = appt?.approval_status === 'PENDING';
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200 ${
        isDark ? 'bg-black/90' : 'bg-slate-950/70'
      }`}>
        <div 
          className={`relative w-full max-w-3xl border rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[92vh] ${
            isDark ? 'border-slate-700/80 text-white' : 'border-slate-200 text-slate-900'
          }`}
          style={{
            backgroundColor: isDark ? '#0c1322' : '#ffffff',
            opacity: 1
          }}
        >
          {/* Header */}
          <div 
            className={`flex items-center justify-between px-6 py-5 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
            style={{
              backgroundColor: isDark ? '#0f182c' : '#f8fafc',
              opacity: 1
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-indigo-400">
                <FileText className="w-5 h-5"/>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className={`text-lg font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Visit Request Dossier
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${appt?.approval_status === 'APPROVED'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : appt?.approval_status === 'REJECTED'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                    {appt?.approval_status || 'LOADING'}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ref: #{appt?.reference_code || appt?.appointment_number || requestId}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className={`p-2 rounded-lg transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5"/>
            </button>
          </div>

          {/* Content Body */}
          <div 
            className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1"
            style={{
              backgroundColor: isDark ? '#0c1322' : '#ffffff',
              opacity: 1
            }}
          >
            {error && (<div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0"/>
                <span>{error}</span>
              </div>)}

            {loading ? (<div className="py-16 text-center text-slate-400 text-xs animate-pulse">
                Retrieving encrypted department appointment records...
              </div>) : appt ? (<>
                {/* Grid: Visitor Dossier & Host Dossier */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Visitor Info Card */}
                  <div 
                    className={`p-4 rounded-xl border space-y-3 ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                    style={{
                      backgroundColor: isDark ? '#111a2e' : '#f8fafc',
                      opacity: 1
                    }}
                  >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5"/> Visitor Dossier
                    </span>
                    <span className="text-[11px] text-slate-400">{appt.visitor_category || 'General Visitor'}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Full Name:</span>
                      <p className="text-sm font-semibold text-white mt-0.5">{appt.visitor_name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Building className="w-3.5 h-3.5 text-slate-400"/>
                      <span>{appt.visitor_company || 'Not Specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-400"/>
                      <span>{appt.visitor_email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400"/>
                      <span>{appt.visitor_phone || 'No phone provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Host Info Card */}
                <div 
                  className={`p-4 rounded-xl border space-y-3 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                  style={{
                    backgroundColor: isDark ? '#111a2e' : '#f8fafc',
                    opacity: 1
                  }}
                >
                  <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5"/> Assigned Host
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${appt.host_availability === 'AVAILABLE'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-rose-500/15 text-rose-400'}`}>
                      {appt.host_availability || 'UNAVAILABLE'}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Host Employee:</span>
                      <p className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{appt.host_name || 'Unassigned'}</p>
                    </div>
                    <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>{appt.host_position || 'Department Staff'}</div>
                    <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Mail className="w-3.5 h-3.5 text-slate-400"/>
                      <span>{appt.host_email || 'N/A'}</span>
                    </div>
                    {appt.office_location && (<div className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-[11px]`}>
                        Office: <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{appt.office_location}</span>
                      </div>)}
                  </div>
                </div>
              </div>

              {/* Appointment Schedule & Purpose Card */}
              <div 
                className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
                style={{
                  backgroundColor: isDark ? '#111a2e' : '#f8fafc',
                  opacity: 1
                }}
              >
                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b ${
                  isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'
                }`}>
                  <Calendar className="w-3.5 h-3.5"/> Appointment Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Scheduled Date & Time:</span>
                    <p className={`font-semibold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {new Date(appt.scheduled_start).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Priority Level:</span>
                    <p className={`font-semibold mt-1 uppercase tracking-wider text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {appt.priority || 'Normal'}
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Current Status:</span>
                    <p className={`font-semibold mt-1 uppercase text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {appt.appointment_status || appt.status || 'Pending'}
                    </p>
                  </div>
                </div>

                <div className={`pt-2 border-t text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Purpose of Visit:</span>
                  <p 
                    className={`mt-1 p-3 rounded-lg border ${
                      isDark ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-800'
                    }`}
                    style={{
                      backgroundColor: isDark ? '#080e1a' : '#ffffff',
                      opacity: 1
                    }}
                  >
                    {appt.purpose || 'No description provided.'}
                  </p>
                </div>

                {appt.remarks && (<div className="pt-2 text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>System Remarks & Reassignment History:</span>
                    <p 
                      className="text-amber-300 mt-1 p-3 rounded-lg border border-amber-500/20 text-[11px]"
                      style={{
                        backgroundColor: isDark ? '#080e1a' : '#fffbeb',
                        opacity: 1
                      }}
                    >
                      {appt.remarks}
                    </p>
                  </div>)}
              </div>

              {/* Approval Workflow Audit Trail */}
              <div 
                className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
                style={{
                  backgroundColor: isDark ? '#111a2e' : '#f8fafc',
                  opacity: 1
                }}
              >
                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b ${
                  isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'
                }`}>
                  <History className="w-3.5 h-3.5"/> Approval Chain & Decisions ({approvals.length})
                </span>

                {approvals.length === 0 ? (<p className="text-xs text-slate-500 italic py-2">No workflow records logged yet.</p>) : (<div className="space-y-2">
                    {approvals.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start justify-between p-2.5 rounded-lg border text-xs ${
                          isDark ? 'border-slate-800' : 'border-slate-200'
                        }`}
                        style={{
                          backgroundColor: isDark ? '#080e1a' : '#ffffff',
                          opacity: 1
                        }}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Level {step.approval_level}: {step.approver_name || 'Designated Approver'}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${step.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                        step.decision === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-amber-500/20 text-amber-400'}`}>
                              {step.decision}
                            </span>
                          </div>
                          {step.comments && (<p className="text-slate-400 text-[11px] mt-1 italic">"{step.comments}"</p>)}
                        </div>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {step.decided_at ? new Date(step.decided_at).toLocaleDateString() : 'Pending'}
                        </span>
                      </div>))}
                  </div>)}
              </div>

              {/* Reject Reason input box if toggled */}
              {showRejectInput && (
                <div 
                  className="p-4 border border-rose-500/30 rounded-xl space-y-3 animate-in fade-in"
                  style={{
                    backgroundColor: isDark ? '#111a2e' : '#fff1f2',
                    opacity: 1
                  }}
                >
                  <label className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                    {t('form.reason', 'Reason for Declining Visit Request')} <span className="text-rose-400">*</span>
                  </label>
                  <textarea 
                    rows={2} 
                    value={rejectReason} 
                    onChange={(e) => setRejectReason(e.target.value)} 
                    placeholder={t('placeholder.reason', 'Enter reason for visitor notification and audit log...')} 
                    className="w-full px-3.5 py-2 border border-rose-500/40 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    style={{
                      backgroundColor: isDark ? '#080e1a' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      opacity: 1
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowRejectInput(false)} className={`px-3 py-1.5 text-xs ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                      {t('btn.cancel', 'Cancel')}
                    </button>
                    <button onClick={handleReject} disabled={actionLoading} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase">
                      {t('btn.decline', 'Confirm Decline')}
                    </button>
                  </div>
                </div>
              )}
            </>) : null}
        </div>

        {/* Footer Actions */}
        <div 
          className={`flex items-center justify-between px-6 py-4 border-t ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
          style={{
            backgroundColor: isDark ? '#0f182c' : '#f8fafc',
            opacity: 1
          }}
        >
          <button type="button" onClick={onClose} className={`px-4 py-2 text-xs font-semibold transition ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}>
            {t('btn.close', 'Close Dossier')}
          </button>

          {isPending && (<div className="flex items-center space-x-2">
              {onReassignClick && (<button type="button" onClick={() => {
                    onClose();
                    onReassignClick(appt);
                }} className="px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold uppercase tracking-wider transition">
                  {appt?.host_employee_id ? t('btn.reassignHost', 'Reassign Available Host') : t('btn.assignHost', 'Assign Available Host')}
                </button>)}

              {!showRejectInput && (<button type="button" onClick={() => setShowRejectInput(true)} className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold uppercase tracking-wider transition">
                  {t('btn.decline', 'Decline')}
                </button>)}

              {appt?.host_employee_id && (<button type="button" onClick={handleForwardToHost} disabled={actionLoading} className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition" title="Forward to assigned host for their signoff">
                  <Send className="w-3.5 h-3.5"/>
                  <span>{t('btn.forwardToHost', 'Forward to Host')}</span>
                </button>)}

              <button type="button" onClick={handleDirectApprove} disabled={actionLoading} className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition">
                <CheckCircle2 className="w-4 h-4"/>
                <span>{t('btn.approve', 'Approve Request')}</span>
              </button>
            </div>)}
        </div>
      </div>
    </div>);
};
