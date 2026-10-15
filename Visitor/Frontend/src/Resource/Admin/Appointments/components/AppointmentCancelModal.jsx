import React, { useState } from 'react';
import { X, AlertCircle, XCircle } from 'lucide-react';
export default function AppointmentCancelModal({ appointment, onClose, onConfirm }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    if (!appointment)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const apptId = appointment.id || appointment.appointment_id;
            // Call API
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                await fetch(`/api/appointments/${apptId}/cancel`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ reason })
                }).catch(() => { });
            }
            onConfirm(apptId, reason);
            onClose();
        }
        catch (err) {
            console.error('Cancellation failed:', err);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600/10 text-red-400 rounded-xl border border-red-500/20">
              <XCircle className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">Cancel Appointment</h3>
              <p className="text-xs text-slate-400">Cancel booking {appointment.appointment_number || `APT-${appointment.id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5"/>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5"/>
            <div>
              <span className="font-extrabold block">Warning</span>
              Cancelling this appointment will notify both the visitor and host employee immediately.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Cancellation *</label>
            <textarea required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide a detailed cancellation reason..." className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700">
              Keep Appointment
            </button>

            <button type="submit" disabled={loading} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-red-600/30">
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
