import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
export default function RescheduleAppointmentModal({ appointment, onClose, onSubmit, isInline = false }) {
    const { t, tStatus } = useLanguage();
    const appt = appointment || {
        title: 'Visit to Tech Solutions Inc.',
        status: 'Approved',
        month: 'MAY',
        day: '20',
        weekDay: 'TUE',
        time: '10:00 AM - 11:00 AM',
        location: 'Main Office, Building A, 3rd Floor'
    };
    const [newDate, setNewDate] = useState(appt.date || '2025-05-25');
    const [newTime, setNewTime] = useState(appt.time || '10:00 AM - 11:00 AM');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        let formattedTime = newTime;
        if (newTime.includes(':') && !newTime.includes('M')) {
            const parts = newTime.split(':');
            let hours = parseInt(parts[0] || '10', 10);
            const minutes = parts[1] || '00';
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
        }
        setTimeout(() => {
            setSubmitting(false);
            onSubmit({ newDate, newTime: formattedTime, reason });
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
          <h3 className="text-base font-bold text-slate-100 mt-0.5">{t('appointment.rescheduleAppt', 'Reschedule Appointment')}</h3>
        </div>
      </div>

        {/* Selected Appointment Summary Box */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-indigo-950 border border-indigo-700/50 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-bold uppercase text-indigo-400">{appt.month || 'MAY'}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('appointment.selectNewDate', 'Select New Date')} <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-all">
                <span className="px-3 text-slate-400 border-r border-slate-800">
                  <i className="bi bi-calendar3 text-amber-400"></i>
                </span>
                <input type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-slate-900 text-white text-xs font-semibold px-3 py-2.5 focus:outline-none"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('appointment.selectNewTime', 'Select New Time')} <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-all">
                <span className="px-3 text-slate-400 border-r border-slate-800">
                  <i className="bi bi-clock text-indigo-400"></i>
                </span>
                <input type="time" required value={newTime.includes(':') ? (newTime.includes('M') ? (
        // Convert AM/PM string to 24h HH:mm for HTML time input if needed
        (() => {
            try {
                const parts = newTime.trim().split(' ')[0].split(':');
                let h = parseInt(parts[0], 10);
                const m = parts[1] || '00';
                if (newTime.includes('PM') && h < 12)
                    h += 12;
                if (newTime.includes('AM') && h === 12)
                    h = 0;
                return `${String(h).padStart(2, '0')}:${m}`;
            }
            catch (e) {
                return '10:00';
            }
        })()) : newTime.slice(0, 5)) : '10:00'} onChange={(e) => setNewTime(e.target.value)} className="w-full bg-slate-900 text-white text-xs font-semibold px-3 py-2.5 focus:outline-none [color-scheme:dark]"/>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('appointment.rescheduleReason', 'Reason for Reschedule (Optional)')}
            </label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('appt.notesPlaceholder', 'Enter reason for reschedule request...')} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"></textarea>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300 flex items-center gap-2">
            <i className="bi bi-info-circle text-indigo-400 shrink-0"></i>
            <span>{t('appt.portalSubtitle', 'Note: Your request will be sent to the host and department for approval.')}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-700/80 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5">
              <i className="bi bi-x-circle text-slate-400"></i>
              <span>{t('form.cancel', 'Cancel')}</span>
            </button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold tracking-wide transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 active:scale-95 flex items-center gap-2 border border-indigo-400/30">
              {submitting ? (<span className="spinner-border spinner-border-sm"></span>) : (<i className="bi bi-send-fill text-indigo-200"></i>)}
              <span>{t('form.submit', 'Submit Request')}</span>
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
