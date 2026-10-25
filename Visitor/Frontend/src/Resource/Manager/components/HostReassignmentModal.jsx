import React, { useState, useEffect } from 'react';
import { X, UserCheck, ArrowRight, Check, ShieldAlert } from 'lucide-react';
import { managerApi } from '../../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../theme/ThemeContext';

export const HostReassignmentModal = ({ isOpen, onClose, request, onSuccess, mode = 'assign' }) => {
    const { t } = useLanguage();
    const { isDark = true } = useTheme() || {};
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

    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200 ${
        isDark ? 'bg-black/90' : 'bg-slate-950/70'
      }`}>
        <div 
          className={`relative w-full max-w-2xl border rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[92vh] ${
            isDark 
              ? 'border-slate-700/80 text-white' 
              : 'border-slate-200 text-slate-900'
          }`}
          style={{
            backgroundColor: isDark ? '#0c1322' : '#ffffff',
            opacity: 1,
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
              <div className={`p-2.5 rounded-xl border ${mode === 'assign'
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'}`}>
                <UserCheck className="w-5 h-5"/>
              </div>
              <div>
                <h2 className={`text-lg font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {mode === 'assign' ? 'Assign Available Host & Route for Approval' : 'Reassign Department Host'}
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Appointment #{request.reference_code || request.appointment_number}
                </p>
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

          {/* Content Body - Solid Opaque */}
          <div 
            className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1"
            style={{
              backgroundColor: isDark ? '#0c1322' : '#ffffff',
              opacity: 1
            }}
          >
            {error && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0"/>
                <span>{error}</span>
              </div>
            )}

            {/* Current Request Summary Card */}
            <div 
              className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'border-slate-700/60' : 'border-slate-200'
              }`}
              style={{
                backgroundColor: isDark ? '#111a2e' : '#f8fafc',
                opacity: 1
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Visitor:</span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {request.visitor_name} ({request.visitor_company || 'Independent'})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Scheduled Time:</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                  {new Date(request.scheduled_start).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <div className={`flex items-center justify-between text-xs pt-2 border-t ${
                isDark ? 'border-slate-700/60' : 'border-slate-200'
              }`}>
                <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Host:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400 font-semibold">{request.host_name || 'Unassigned'}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    request.host_availability === 'AVAILABLE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {request.host_availability || 'UNAVAILABLE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Host Selection Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t('form.selectAltHost', 'Select Alternative Host')} ({altHosts.length} {t('form.available', 'Available in HR')})
                </label>
                {loading && <span className="text-xs text-indigo-400 animate-pulse">{t('form.loadingHosts', 'Loading hosts...')}</span>}
              </div>

              {altHosts.length === 0 && !loading ? (
                <div className={`p-6 text-center rounded-xl border border-dashed text-xs ${
                  isDark ? 'bg-[#0f182c] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-500'
                }`}>
                  {t('msg.noHostsFound', 'No other authorized hosts found in this department.')}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                  {altHosts.map((host) => {
                    const isSelected = selectedHostId === host.id;
                    const isAvail = host.availability_status === 'AVAILABLE';
                    return (
                      <div 
                        key={host.id} 
                        onClick={() => setSelectedHostId(host.id)} 
                        className={`relative p-3.5 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                            : isDark
                            ? 'border-slate-800 hover:border-slate-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        style={{
                          backgroundColor: isSelected 
                            ? (isDark ? '#18243e' : '#eef2ff') 
                            : (isDark ? '#111a2e' : '#f8fafc'),
                          opacity: 1
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{host.full_name}</p>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{host.position || 'Department Staff'}</p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                              <Check className="w-3 h-3"/>
                            </div>
                          )}
                        </div>

                        <div className={`flex items-center justify-between mt-3 pt-2 border-t text-[11px] ${
                          isDark ? 'border-slate-800/80' : 'border-slate-200'
                        }`}>
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isAvail
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {host.availability_status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reason or Instructions */}
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {mode === 'assign' ? t('form.instructions', 'Instructions / Note for Assigned Host (Optional)') : `${t('form.reason', 'Reason for Reassignment')} *`}
              </label>
              <textarea 
                rows={3} 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder={mode === 'assign' ? t('placeholder.notes', 'Add instructions or context for the assigned host employee...') : t('placeholder.reason', 'Explain why the host is being reassigned (recorded in audit trail)...')} 
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark 
                    ? 'border-slate-700 text-slate-100 placeholder-slate-500' 
                    : 'border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                style={{
                  backgroundColor: isDark ? '#080e1a' : '#f8fafc',
                  opacity: 1
                }}
              />
            </div>

            {/* Urgent Notification Checkbox */}
            <div 
              className={`flex items-center space-x-3 p-3 rounded-xl border ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
              style={{
                backgroundColor: isDark ? '#111a2e' : '#f8fafc',
                opacity: 1
              }}
            >
              <input 
                type="checkbox" 
                id="urgentNotif" 
                checked={urgentNotification} 
                onChange={(e) => setUrgentNotification(e.target.checked)} 
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="urgentNotif" className={`text-xs cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {mode === 'assign'
                  ? t('form.sendImmediateNotif', 'Send immediate dispatch notification (In-App, Email) to the assigned employee')
                  : t('form.sendMultiChannelDispatch', 'Send immediate multi-channel dispatch (Email, In-App) to new and previous host')}
              </label>
            </div>
          </div>

          {/* Footer - Solid Opaque */}
          <div 
            className={`flex items-center justify-between px-6 py-4 border-t ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
            style={{
              backgroundColor: isDark ? '#0f182c' : '#f8fafc',
              opacity: 1
            }}
          >
            <button 
              type="button" 
              onClick={onClose} 
              className={`px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('btn.cancel', 'Cancel')}
            </button>
            <button 
              type="button" 
              onClick={handleAction} 
              disabled={!selectedHostId || submitting} 
              className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {submitting ? (
                <span>{mode === 'assign' ? t('btn.assigning', 'Assigning...') : t('btn.reassigning', 'Reassigning...')}</span>
              ) : (
                <>
                  <span>{mode === 'assign' ? t('btn.assignHost', 'Assign & Forward to Host') : t('btn.confirmReassign', 'Confirm Reassignment')}</span>
                  <ArrowRight className="w-4 h-4"/>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
};

export default HostReassignmentModal;
