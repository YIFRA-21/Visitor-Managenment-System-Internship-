import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
export default function AppointmentRescheduleModal({ appointment, onClose, onConfirm }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('14:00');
    const [endTime, setEndTime] = useState('15:00');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasConflict, setHasConflict] = useState(false);
    if (!appointment)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const scheduledStart = `${date}T${startTime}:00Z`;
            const scheduledEnd = `${date}T${endTime}:00Z`;
            const apptId = appointment.id || appointment.appointment_id;
            // Call API
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                await fetch(`/api/appointments/${apptId}/reschedule`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        scheduledStart,
                        scheduledEnd,
                        reason
                    })
                }).catch(() => { });
            }
            onConfirm(apptId, scheduledStart, scheduledEnd, reason);
            onClose();
        }
        catch (err) {
            console.error('Reschedule failed:', err);
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
            <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Calendar className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">Reschedule Appointment</h3>
              <p className="text-xs text-slate-400">Modify date & time for {appointment.appointment_number || `APT-${appointment.id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5"/>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
            <div className="text-slate-400 uppercase text-[10px] font-bold">Current Schedule</div>
            <div className="font-extrabold text-white">
              {appointment.scheduled_start ? new Date(appointment.scheduled_start).toLocaleString() : 'N/A'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">New Date *</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">New Start Time *</label>
              <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">New End Time *</label>
              <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Rescheduling</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Host requested shift / Visitor conflict..." className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700">
              Cancel
            </button>

            <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/30">
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
