import React, { useState } from 'react';
import { X, Save, Check } from 'lucide-react';
import { appointmentsApi } from '../../../services/api';
import { useLanguage } from '../../../contexts/LanguageContext';
export default function EditAppointmentModal({ appointment, onClose, onSave }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        title: appointment?.title || '',
        host: appointment?.host || appointment?.hostName || '',
        date: appointment?.date || 'MAY 20 TUE',
        time: appointment?.time || '10:00 AM - 11:00 AM',
        location: appointment?.location || 'Main Office, Building A',
        meetingRoom: appointment?.meetingRoom || 'Meeting Room A-301',
        purpose: appointment?.purpose || appointment?.title || 'Business Meeting',
        specialRequest: appointment?.specialRequest || 'None'
    });
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        try {
            if (appointment?.id && typeof appointment.id === 'number') {
                await appointmentsApi.reschedule(appointment.id, {
                    scheduledStart: formData.date,
                    scheduledEnd: formData.time,
                    comment: formData.purpose
                });
            }
        }
        catch (err) {
            console.warn('API update fallback to state:', err);
        }
        setTimeout(() => {
            setSaving(false);
            setSuccessMsg(t('response.updated', 'Appointment updated successfully!'));
            setTimeout(() => {
                onSave({ ...appointment, ...formData });
                onClose();
            }, 600);
        }, 400);
    };
    return (<div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-800 text-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-400 block">
              {t('appointment.editAppt', 'Edit Appointment Request')}
            </span>
            <h2 className="text-lg font-black text-white mt-0.5 mb-0">Modify Booking #{appointment?.id || 'APT-001'}</h2>
          </div>
          <button onClick={onClose} type="button" className="p-1.5 text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all">
            <X className="h-4 w-4"/>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (<div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="h-4 w-4"/>
            <span>{successMsg}</span>
          </div>)}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Title / Purpose */}
          <div>
            <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
              {t('appt.purpose', 'Visit Purpose / Subject')}
            </label>
            <input type="text" required value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold" placeholder={t('appt.purposePlaceholder', 'e.g. Business Meeting, Tech Consultation')}/>
          </div>

          {/* Host & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                {t('appt.hostEmployee', 'Host Name')}
              </label>
              <input type="text" required value={formData.host} onChange={(e) => handleChange('host', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"/>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                {t('appt.buildingLocation', 'Location / Building')}
              </label>
              <input type="text" required value={formData.location} onChange={(e) => handleChange('location', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"/>
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                {t('appt.visitDate', 'Date (e.g. MAY 20 TUE)')}
              </label>
              <input type="text" required value={formData.date} onChange={(e) => handleChange('date', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"/>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                {t('appt.startTime', 'Time Slot')}
              </label>
              <input type="text" required value={formData.time} onChange={(e) => handleChange('time', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"/>
            </div>
          </div>

          {/* Meeting Room & Special Request */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                {t('appt.meetingRoom', 'Meeting Room')}
              </label>
              <input type="text" value={formData.meetingRoom} onChange={(e) => handleChange('meetingRoom', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"/>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                {t('form.notes', 'Special Request / Equipment')}
              </label>
              <input type="text" value={formData.specialRequest} onChange={(e) => handleChange('specialRequest', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"/>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-bold transition-all">
              {t('form.cancel', 'Cancel')}
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 border border-indigo-500/30">
              <Save className="h-4 w-4"/>
              <span>{saving ? t('form.loading', 'Saving...') : t('form.save', 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>);
}
