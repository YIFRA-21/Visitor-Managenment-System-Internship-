import { useEffect, useState } from 'react';
import { ArrowLeft, Shield, Power, CheckCircle, XCircle, AlertTriangle, Clock, User, FileText, AlertCircle, X } from 'lucide-react';
import api from '../../../../services/api';
import OrganizationStatusBadge from './components/OrganizationStatusBadge';
import ConfirmationDialog from './components/ConfirmationDialog';
export default function OrgStatusManagement() {
    const urlParams = new URLSearchParams(window.location.search);
    const orgId = urlParams.get('orgId') || '1';
    const [statusInfo, setStatusInfo] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [changing, setChanging] = useState(false);
    const [toast, setToast] = useState(null);
    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({ show: false, targetStatus: '', reason: '' });
    useEffect(() => {
        fetchData();
    }, [orgId]);
    const fetchData = async () => {
        setLoading(true);
        try {
            const [statusRes, historyRes] = await Promise.all([
                api.get(`/organizations/${orgId}/status`),
                api.get(`/organizations/${orgId}/status/history`),
            ]);
            setStatusInfo(statusRes.data);
            setHistory(historyRes.data?.history || []);
        }
        catch {
            showToast('error', 'Failed to load status information.');
        }
        finally {
            setLoading(false);
        }
    };
    const openConfirmDialog = (targetStatus) => {
        setConfirmDialog({ show: true, targetStatus, reason: '' });
    };
    const handleStatusChange = async () => {
        const { targetStatus, reason } = confirmDialog;
        setChanging(true);
        try {
            await api.patch(`/organizations/${orgId}/status`, {
                status: targetStatus,
                reason,
            });
            showToast('success', `Organization status changed to ${targetStatus}.`);
            setConfirmDialog({ show: false, targetStatus: '', reason: '' });
            fetchData();
        }
        catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to change status.';
            showToast('error', msg);
        }
        finally {
            setChanging(false);
        }
    };
    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };
    const handleNav = (view) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', view);
        window.location.search = `?${params.toString()}`;
    };
    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        }
        catch {
            return dateStr;
        }
    };
    const getStatusActionConfig = (target) => {
        switch (target) {
            case 'ACTIVE':
                return { label: 'Activate', icon: <CheckCircle className="h-4 w-4"/>, btnClass: 'btn-success', danger: false };
            case 'INACTIVE':
                return { label: 'Deactivate', icon: <XCircle className="h-4 w-4"/>, btnClass: 'btn-warning', danger: true };
            case 'SUSPENDED':
                return { label: 'Suspend', icon: <AlertTriangle className="h-4 w-4"/>, btnClass: 'btn-danger', danger: true };
            default:
                return { label: target, icon: <Power className="h-4 w-4"/>, btnClass: 'btn-secondary', danger: false };
        }
    };
    const parseValues = (jsonStr) => {
        if (!jsonStr)
            return {};
        try {
            return JSON.parse(jsonStr);
        }
        catch {
            return {};
        }
    };
    if (loading) {
        return (<div className="org-status-page">
        <div className="p-20 text-center">
          <div className="spinner-border text-primary" role="status"/>
          <p className="text-slate-400 text-xs fw-semibold mt-3">Loading status information...</p>
        </div>
      </div>);
    }
    return (<div className="org-status-page">
      {/* Toast */}
      {toast && (<div className={`org-toast org-toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="org-toast__close"><X className="h-3.5 w-3.5"/></button>
        </div>)}

      {/* Confirmation Dialog */}
      <ConfirmationDialog show={confirmDialog.show} title={`${getStatusActionConfig(confirmDialog.targetStatus).label} Organization`} message={`Are you sure you want to change the status of "${statusInfo?.name}" from ${statusInfo?.currentStatus} to ${confirmDialog.targetStatus}? This action will be logged in the audit trail.`} confirmLabel={getStatusActionConfig(confirmDialog.targetStatus).label} danger={getStatusActionConfig(confirmDialog.targetStatus).danger} loading={changing} onConfirm={handleStatusChange} onCancel={() => setConfirmDialog({ show: false, targetStatus: '', reason: '' })}/>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
            <Shield className="text-blue-600 h-7 w-7"/>
            Organization Status Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 fw-semibold">
            Manage activation status and view change history for {statusInfo?.name || 'organization'}.
          </p>
        </div>
        <button onClick={() => handleNav('org_details')} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs fw-bold px-3 py-2">
          <ArrowLeft className="h-4 w-4"/> Back to Details
        </button>
      </div>

      <div className="row g-4">
        {/* Current Status Card */}
        <div className="col-12 col-lg-5">
          <div className="org-status-card">
            <h3 className="org-status-card__title">Current Status</h3>

            <div className="org-status-card__current">
              <OrganizationStatusBadge status={statusInfo?.currentStatus || 'ACTIVE'} size="lg"/>
            </div>

            <div className="org-status-card__meta">
              <div className="d-flex align-items-center gap-2 text-xs text-slate-500 dark:text-slate-400 fw-semibold">
                <Clock className="h-3.5 w-3.5"/>
                <span>Last Updated: {formatDate(statusInfo?.lastUpdated || '')}</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-xs text-slate-500 dark:text-slate-400 fw-semibold mt-2">
                <User className="h-3.5 w-3.5"/>
                <span>Updated By: System Administrator</span>
              </div>
            </div>

            {/* Status Actions */}
            {statusInfo && statusInfo.allowedTransitions.length > 0 && (<div className="org-status-card__actions">
                <h4 className="text-xs fw-bold text-slate-500 dark:text-slate-400 text-uppercase tracking-wider mb-3">
                  Available Actions
                </h4>
                <div className="d-flex flex-wrap gap-2">
                  {statusInfo.allowedTransitions.map((target) => {
                const config = getStatusActionConfig(target);
                return (<button key={target} className={`btn btn-sm ${config.btnClass} d-flex align-items-center gap-1.5 text-xs fw-bold px-3 py-2`} onClick={() => openConfirmDialog(target)}>
                        {config.icon}
                        {config.label}
                      </button>);
            })}
                </div>
              </div>)}

            {/* Reason input for the dialog */}
            {confirmDialog.show && (<div className="mt-3">
                <label className="form-label text-xs fw-bold text-slate-500">Reason (optional)</label>
                <textarea className="form-control text-xs fw-semibold" rows={2} placeholder="Enter a reason for this status change..." value={confirmDialog.reason} onChange={(e) => setConfirmDialog(prev => ({ ...prev, reason: e.target.value }))}/>
              </div>)}
          </div>
        </div>

        {/* Status History */}
        <div className="col-12 col-lg-7">
          <div className="org-status-history">
            <h3 className="org-status-history__title d-flex align-items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-slate-400"/>
              Status Change History
            </h3>

            {history.length === 0 ? (<div className="text-center py-5">
                <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2"/>
                <p className="text-slate-500 text-xs fw-semibold">No status changes recorded yet.</p>
              </div>) : (<div className="org-status-timeline">
                {history.map((item, index) => {
                const newVals = parseValues(item.new_values);
                const oldVals = parseValues(item.old_values);
                const statusLabel = newVals.status || item.action.replace('ORGANIZATION_STATUS_', '');
                return (<div key={item.id || index} className="org-status-timeline__item">
                      <div className="org-status-timeline__dot">
                        <OrganizationStatusBadge status={statusLabel} size="sm"/>
                      </div>
                      <div className="org-status-timeline__content">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="text-xs fw-bold text-slate-900 dark:text-white">
                            {oldVals.status ? `${oldVals.status} → ${statusLabel}` : `Set to ${statusLabel}`}
                          </span>
                        </div>
                        {newVals.reason && (<p className="text-xs text-slate-500 dark:text-slate-400 fw-semibold mb-1">
                            Reason: {newVals.reason}
                          </p>)}
                        <div className="d-flex align-items-center gap-2 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3"/>
                          <span>{formatDate(item.created_at)}</span>
                          <span>•</span>
                          <User className="h-3 w-3"/>
                          <span>Admin (ID: {item.actor_id})</span>
                        </div>
                      </div>
                    </div>);
            })}
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
