import React, { useState, useEffect } from 'react';
import { X, UserCheck, ArrowRight, Check, ShieldAlert } from 'lucide-react';
import { managerApi } from '../../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../../contexts/LanguageContext';
export const HostReassignmentModal = ({ isOpen, onClose, request, onSuccess, mode = 'assign' }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [altHosts, setAltHosts] = useState([]);
    const [selectedHostId, setSelectedHostId] = useState(null);
    const [reason, setReason] = useState('');
    const [urgentNotification, setUrgentNotification] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        if (isOpen && request) {
            loadAlternativeHosts();
            if (mode === 'assign') {
                setReason('Assigned by Department Manager. Please review visitor request and approve or respond.');
            }
            else {
                setReason(`Host ${request.host_name || 'employee'} is currently unavailable. Reassigning request to maintain SLA.`);
            }
            setSelectedHostId(request.host_employee_id || null);
            setError('');
        }
    }, [isOpen, request, mode]);
    const loadAlternativeHosts = async () => {
        setLoading(true);
        setError('');
        try {
            const hosts = await managerApi.getAlternativeHosts(mode === 'reassign' ? request?.host_employee_id : undefined);
            setAltHosts(hosts);
            // Auto-select first available host if none selected
            if (!selectedHostId) {
                const firstAvailable = hosts.find(h => h.availability_status === 'AVAILABLE') || hosts[0];
                if (firstAvailable) {
                    setSelectedHostId(firstAvailable.id);
                }
            }
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to load department hosts');
        }
        finally {
            setLoading(false);
        }
    };
    const handleAction = async () => {
        if (!request || !selectedHostId)
            return;
        if (mode === 'reassign' && !reason.trim()) {
            setError('Please provide a reason for reassigning this host.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            if (mode === 'assign') {
                await managerApi.assignHostAndRoute(request.id, {
                    hostEmployeeId: selectedHostId,
                    instructions: reason
                });
            }
            else {
                await managerApi.reassignHost(request.id, {
                    newHostEmployeeId: selectedHostId,
                    reason,
                    urgentNotification
                });
            }
            onSuccess();
            onClose();
        }
        catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Operation failed');
        }
        finally {
            setSubmitting(false);
        }
    };
    if (!isOpen || !request)
        return null;
    const selectedHost = altHosts.find(h => h.id === selectedHostId);
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#111827] to-[#0c1220] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${mode === 'assign'
            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
              <UserCheck className="w-5 h-5"/>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {mode === 'assign' ? 'Assign Available Host & Route for Approval' : 'Reassign Department Host'}
              </h2>
              <p className="text-xs text-slate-400">Appointment #{request.reference_code || request.appointment_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (<div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0"/>
              <span>{error}</span>
            </div>)}

          {/* Current Request Summary Card */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Visitor:</span>
              <span className="text-white font-semibold">{request.visitor_name} ({request.visitor_company || 'Independent'})</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Scheduled Time:</span>
              <span className="text-slate-200">
                {new Date(request.scheduled_start).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700/40">
              <span className="text-slate-400 font-medium">Current Host:</span>
              <div className="flex items-center space-x-2">
                <span className="text-amber-300 font-medium">{request.host_name || 'Unassigned'}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${request.host_availability === 'AVAILABLE'
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
                  {request.host_availability || 'UNAVAILABLE'}
                </span>
              </div>
            </div>
          </div>

          {/* Host Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t('form.selectAltHost', 'Select Alternative Host')} ({altHosts.length} {t('form.available', 'Available in HR')})
              </label>
              {loading && <span className="text-xs text-indigo-400 animate-pulse">{t('form.loadingHosts', 'Loading hosts...')}</span>}
            </div>

            {altHosts.length === 0 && !loading ? (<div className="p-6 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                {t('msg.noHostsFound', 'No other authorized hosts found in this department.')}
              </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {altHosts.map((host) => {
                const isSelected = selectedHostId === host.id;
                const isAvail = host.availability_status === 'AVAILABLE';
                return (<div key={host.id} onClick={() => setSelectedHostId(host.id)} className={`relative p-3.5 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{host.full_name}</p>
                          <p className="text-xs text-slate-400">{host.position || 'Department Staff'}</p>
                        </div>
                        {isSelected && (<div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                            <Check className="w-3 h-3"/>
                          </div>)}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[11px]">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isAvail
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'}`}>
                          {host.availability_status}
                        </span>
                      </div>
                    </div>);
            })}
              </div>)}
          </div>

          {/* Reason or Instructions */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {mode === 'assign' ? t('form.instructions', 'Instructions / Note for Assigned Host (Optional)') : `${t('form.reason', 'Reason for Reassignment')} *`}
            </label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={mode === 'assign' ? t('placeholder.notes', 'Add instructions or context for the assigned host employee...') : t('placeholder.reason', 'Explain why the host is being reassigned (recorded in audit trail)...')} className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>

          {/* Urgent Notification Checkbox */}
          <div className="flex items-center space-x-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
            <input type="checkbox" id="urgentNotif" checked={urgentNotification} onChange={(e) => setUrgentNotification(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"/>
            <label htmlFor="urgentNotif" className="text-xs text-slate-300 cursor-pointer">
              {mode === 'assign'
            ? t('form.sendImmediateNotif', 'Send immediate dispatch notification (In-App, Email) to the assigned employee')
            : t('form.sendMultiChannelDispatch', 'Send immediate multi-channel dispatch (Email, In-App) to new and previous host')}
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition">
            {t('btn.cancel', 'Cancel')}
          </button>
          <button type="button" onClick={handleAction} disabled={!selectedHostId || submitting} className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 transition-all">
            {submitting ? (<span>{mode === 'assign' ? t('btn.assigning', 'Assigning...') : t('btn.reassigning', 'Reassigning...')}</span>) : (<>
                <span>{mode === 'assign' ? t('btn.assignHost', 'Assign & Forward to Host') : t('btn.confirmReassign', 'Confirm Reassignment')}</span>
                <ArrowRight className="w-4 h-4"/>
              </>)}
          </button>
        </div>
      </div>
    </div>);
};
