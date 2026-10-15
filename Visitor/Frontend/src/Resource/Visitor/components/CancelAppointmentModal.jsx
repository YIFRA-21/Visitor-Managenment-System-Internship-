import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
export default function CancelAppointmentModal({ appointment, onClose, onConfirmCancel, isInline = false }) {
    const { t, tStatus } = useLanguage();
    const [reason, setReason] = useState('Schedule Conflict');
    const [comments, setComments] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const appt = appointment || {
        title: 'Visit to Tech Solutions Inc.',
        status: 'Approved',
        month: 'MAY',
        day: '20',
        weekDay: 'TUE',
        time: '10:00 AM - 11:00 AM',
        location: 'Main Office, Building A, 3rd Floor'
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        setCancelling(true);
        setTimeout(() => {
            setCancelling(false);
            onConfirmCancel({ reason, comments });
            onClose();
        }, 400);
    };
    const content = (<div className="bg-[#0f172a] border border-slate-800 text-slate-100 rounded-2xl p-6 w-full shadow-2xl space-y-5 font-sans text-xs">
      {/* Header Breadcrumb & Close */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button type="button" onClick={onClose} title={t('form.back', 'Back to List')} className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 rounded-xl border border-slate-700/80 transition-all shadow-md active:scale-95 shrink-0">
          <i className="bi bi-arrow-left text-lg"></i>
        </button>

        <div>
          <h3 className="text-base font-bold text-slate-100 mt-0.5">{t('appointment.cancelAppt', 'Cancel Appointment')}</h3>
        </div>
      </div>

        {/* Selected Appointment Summary Box */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-rose-950 border border-rose-800/50 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-bold uppercase text-rose-400">{appt.month || 'MAY'}</span>
            <span className="text-lg font-black text-slate-100 leading-none">{appt.day || '20'}</span>
            <span className="text-[8px] text-slate-500">{appt.weekDay || 'TUE'}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-100 text-xs">{appt.title}</h4>
              <span className="badge bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px]">{tStatus(appt.status) || 'Approved'}</span>
            </div>
            <div className="text-[11px] text-slate-400"><i className="bi bi-briefcase text-indigo-400 me-1"></i> {t('appt.purpose', 'Visit Purpose')}</div>
            <div className="text-[11px] text-slate-400"><i className="bi bi-clock me-1"></i> {appt.time}</div>
            <div className="text-[11px] text-slate-500"><i className="bi bi-geo-alt me-1"></i> {appt.location}</div>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('appointment.cancelReason', 'Reason for Cancellation')} <span className="text-rose-400">*</span></label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
              <option value="Schedule Conflict">Schedule Conflict</option>
              <option value="Personal Urgency">Personal Urgency</option>
              <option value="Host Requested Cancel">Host Requested Cancellation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.notes', 'Additional Comments (Optional)')}</label>
            <textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder={t('appt.notesPlaceholder', 'Enter additional comments...')} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"></textarea>
          </div>

          {/* Warning Banner */}
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-[11px] text-rose-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-400">
              <i className="bi bi-exclamation-triangle-fill"></i> Warning:
            </div>
            <div>{t('response.confirmDelete', 'This action cannot be undone. You will need to create a new appointment if needed in the future.')}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-700/80 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5">
              <i className="bi bi-arrow-left text-slate-400"></i>
              <span>{t('appointment.keepAppt', 'Keep Appointment')}</span>
            </button>
            <button type="submit" disabled={cancelling} className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold tracking-wide transition-all shadow-lg shadow-rose-600/30 hover:shadow-rose-500/50 active:scale-95 flex items-center gap-2 border border-rose-400/30">
              {cancelling ? (<span className="spinner-border spinner-border-sm"></span>) : (<i className="bi bi-x-circle-fill text-rose-200"></i>)}
              <span>{t('appointment.cancelAppt', 'Cancel Appointment')}</span>
            </button>
          </div>
        </form>
      </div>);
    if (isInline) {
        return content;
    }
    return createPortal(<div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="max-w-lg w-full">
        {content}
      </div>
    </div>, document.body);
}
