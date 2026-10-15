import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../../services/api';
export default function VisitorApprovals() {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppr, setSelectedAppr] = useState(null);
    const [comment, setComment] = useState('');
    const [actionType, setActionType] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);
    const fetchApprovals = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/appointments', { params: { status: 'PENDING' } });
            const rawList = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
            const mapped = rawList
                .filter((item) => {
                const s = (item.status || item.appointment_status || '').toUpperCase();
                return s.includes('PENDING');
            })
                .map((item) => ({
                id: item.id,
                referenceCode: item.reference_code || item.referenceCode || `REF-${item.id}`,
                visitorName: item.visitor_name || item.fullName || item.visitorName || 'Visitor',
                visitorEmail: item.email || item.visitorEmail || '—',
                company: item.company || item.organization || 'General',
                hostEmployee: item.host_name || item.hostEmployee || item.host || 'Staff',
                department: item.department_name || item.department || 'Main',
                purpose: item.purpose || 'Appointment Visit',
                scheduledTime: item.scheduled_start
                    ? `${new Date(item.scheduled_start).toLocaleDateString()} ${new Date(item.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : item.scheduled_time || 'Pending Schedule',
                submittedAt: item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent',
                securityClearance: item.security_status === 'FLAGGED' ? 'Flagged' : item.id_verified ? 'Passed' : 'Pending Review',
                idAttached: Boolean(item.id_image_url || item.document_id || item.id_verified),
            }));
            setApprovals(mapped);
        }
        catch (err) {
            console.error('Failed to fetch pending approvals:', err);
            setApprovals([]);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchApprovals();
    }, [fetchApprovals]);
    const handleActionSubmit = async () => {
        if (!selectedAppr || !actionType)
            return;
        setSubmitting(true);
        try {
            const endpoint = actionType === 'APPROVE'
                ? `/appointments/${selectedAppr.id}/approve`
                : `/appointments/${selectedAppr.id}/reject`;
            await api.patch(endpoint, { comment: comment.trim() || undefined });
            setApprovals((prev) => prev.filter((a) => a.id !== selectedAppr.id));
            setAlertMsg({
                text: `Successfully ${actionType === 'APPROVE' ? 'approved' : 'rejected'} clearance for ${selectedAppr.visitorName}.`,
                type: 'success',
            });
            setTimeout(() => setAlertMsg(null), 4000);
            setSelectedAppr(null);
            setActionType(null);
            setComment('');
        }
        catch (err) {
            console.error(`Failed to ${actionType} appointment:`, err);
            setAlertMsg({
                text: err?.response?.data?.error || `Failed to process ${actionType.toLowerCase()} action.`,
                type: 'error',
            });
            setTimeout(() => setAlertMsg(null), 5000);
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="vms-visitor-approvals space-y-6">
      {/* Alert Notification */}
      {alertMsg && (<div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${alertMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/80 border-rose-800 text-rose-200'}`}>
          <span>{alertMsg.text}</span>
          <button type="button" onClick={() => setAlertMsg(null)} className="text-white hover:opacity-75">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>)}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="bi bi-shield-check text-warning"></i> Visitor Access Approvals Queue
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review and clear incoming visitor appointment requests requiring administrative approval from the database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={fetchApprovals} disabled={loading} className="btn btn-outline-info text-xs flex items-center gap-2">
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Refresh
          </button>
          <span className="badge bg-warning text-dark font-bold px-3 py-1.5 text-xs">
            {approvals.length} Pending Clearances
          </span>
        </div>
      </div>

      {/* Approvals List Cards */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent mb-2"></div>
            <p className="text-xs">Checking database for pending clearance requests...</p>
          </div>) : approvals.length === 0 ? (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <i className="bi bi-check-circle-fill text-emerald-400 fs-1 block mb-3"></i>
            <h4 className="text-lg font-bold text-white mb-1">Queue Clear!</h4>
            <p className="text-xs">There are currently no pending visitor clearance requests in the database.</p>
          </div>) : (approvals.map((item) => (<div key={item.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg text-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-lg flex-shrink-0">
                    <i className="bi bi-person-fill-gear"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{item.visitorName}</h3>
                      <span className="font-mono text-xs text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                        {item.referenceCode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {item.company} &bull; <span className="text-slate-300">{item.visitorEmail}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-xs">
                      <div>
                        <span className="text-slate-500">Host Employee:</span>{' '}
                        <span className="font-medium text-slate-200">{item.hostEmployee}</span> ({item.department})
                      </div>
                      <div>
                        <span className="text-slate-500">Scheduled:</span>{' '}
                        <span className="font-medium text-slate-200">{item.scheduledTime}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Purpose:</span>{' '}
                        <span className="text-slate-300 italic">"{item.purpose}"</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <span className={`badge text-[10px] ${item.securityClearance === 'Passed'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : item.securityClearance === 'Flagged'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                      Security: {item.securityClearance}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button type="button" onClick={() => {
                setSelectedAppr(item);
                setActionType('APPROVE');
            }} className="btn btn-sm btn-success text-xs px-3 py-1.5 font-bold flex items-center gap-1.5 shadow-md">
                      <i className="bi bi-check-lg"></i> Approve
                    </button>
                    <button type="button" onClick={() => {
                setSelectedAppr(item);
                setActionType('REJECT');
            }} className="btn btn-sm btn-outline-danger text-xs px-3 py-1.5 font-bold flex items-center gap-1.5">
                      <i className="bi bi-x-lg"></i> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>)))}
      </div>

      {/* Approval Action Modal */}
      {selectedAppr && actionType && (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <i className={`bi ${actionType === 'APPROVE' ? 'bi-check-circle text-emerald-400' : 'bi-x-circle text-rose-400'}`}></i>
                {actionType === 'APPROVE' ? 'Approve Visitor Clearance' : 'Reject Visitor Clearance'}
              </h3>
              <button type="button" onClick={() => {
                setSelectedAppr(null);
                setActionType(null);
            }} className="text-slate-400 hover:text-white">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <p className="text-xs text-slate-300">
              You are about to <strong className={actionType === 'APPROVE' ? 'text-emerald-400' : 'text-rose-400'}>{actionType}</strong> access for{' '}
              <span className="text-white font-bold">{selectedAppr.visitorName}</span> ({selectedAppr.referenceCode}).
            </p>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Admin Comment / Instructions (Optional):</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add security notes, escort requirements, or rejection reason..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-h-[80px]"/>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" disabled={submitting} onClick={() => {
                setSelectedAppr(null);
                setActionType(null);
            }} className="btn btn-secondary text-xs px-4">
                Cancel
              </button>
              <button type="button" disabled={submitting} onClick={handleActionSubmit} className={`btn text-xs px-4 font-bold flex items-center gap-2 ${actionType === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}>
                {submitting && <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Confirm {actionType === 'APPROVE' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
