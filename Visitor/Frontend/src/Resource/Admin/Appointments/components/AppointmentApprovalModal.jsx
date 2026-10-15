import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
export default function AppointmentApprovalModal({ appointment, mode, onClose, onConfirm }) {
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    if (!appointment)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const decision = mode === 'approve' ? 'APPROVED' : 'REJECTED';
            const apptId = appointment.id || appointment.appointment_id;
            // Call API
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                await fetch(`/api/appointments/${apptId}/${mode}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ comment: comments })
                }).catch(() => { });
            }
            onConfirm(apptId, decision, comments);
            onClose();
        }
        catch (err) {
            console.error('Approval submission failed:', err);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl border ${mode === 'approve' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 'bg-red-600/10 text-red-400 border-red-500/20'}`}>
              <ShieldCheck className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {mode === 'approve' ? 'Approve Appointment' : 'Reject Appointment'}
              </h3>
              <p className="text-xs text-slate-400">Record multi-tier approval decision for {appointment.appointment_number || `APT-${appointment.id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5"/>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Visitor:</span>
              <span className="font-extrabold text-white">{appointment.visitorName || 'Visitor'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Host:</span>
              <span className="font-bold text-slate-200">{appointment.hostName || 'Host Employee'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Scheduled Time:</span>
              <span className="font-bold text-indigo-300">
                {appointment.scheduled_start ? new Date(appointment.scheduled_start).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Approval Comments & Remarks {mode === 'reject' ? '*' : '(Optional)'}
            </label>
            <textarea required={mode === 'reject'} rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder={mode === 'approve' ? 'e.g. Approved. Visitor authorized for Building A access.' : 'e.g. Rejected due to scheduling conflict or security policy.'} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="font-extrabold text-slate-300 uppercase text-[10px]">Approval Workflow Information</div>
            <p>Upon submission, status updates automatically and system notification is dispatched to visitor and host.</p>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700">
              Cancel
            </button>

            <button type="submit" disabled={loading} className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition-colors shadow-lg ${mode === 'approve'
            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
            : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'}`}>
              {loading ? 'Processing...' : mode === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
