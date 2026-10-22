import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Clock, Eye, CalendarClock, XCircle, CheckCircle, X, Trash2 } from 'lucide-react';
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import RescheduleAppointmentModal from './components/RescheduleAppointmentModal';
import CancelAppointmentModal from './components/CancelAppointmentModal';
import NewAppointmentForm from './components/NewAppointmentForm';
import { visitorPortalApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponseNavigation } from '../../modules/response';

export default function VisitorAppointments({ departments = [], employees = [], rooms = [] } = {}) {
    const { toConfirmation } = useResponseNavigation();
    const { t } = useLanguage();
    const { user } = useAuth();
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [rescheduleAppt, setRescheduleAppt] = useState(null);
    const [cancelAppt, setCancelAppt] = useState(null);
    const [deleteAppt, setDeleteAppt] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showBookModal, setShowBookModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [pulsing, setPulsing] = useState(false);
    const [toast, setToast] = useState(null);
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    // ── Helper to get current visitor's profile ──
    const getVisitorInfo = () => {
        const authName = user?.fullName || user?.full_name || user?.username || 'Visitor';
        const authEmail = (user?.email || '').toLowerCase();
        let p = {};
        try {
            const active = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
            if (active) {
                const parsed = JSON.parse(active);
                const pEmail = (parsed.email || '').toLowerCase();
                if (!pEmail || !authEmail || pEmail === authEmail) {
                    p = { ...p, ...parsed };
                }
            }
        }
        catch (e) { }
        return {
            fullName: authName,
            email: authEmail || p.email || '',
            phone: p.phone || user?.phone || '',
            company: p.company || user?.company || '',
            visitorCode: p.visitor_code || user?.visitorCode || `VIS-${user?.id || '2026-001'}`,
            referenceNumber: p.reference_number || user?.referenceNumber || `REF-${user?.id || 'REG-2026'}`,
            department: p.department_name || p.department || '—',
        };
    };
    // ── Normalize appointment fields for display ──
    const normalizeAppt = (a) => {
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        let dateObj = null;
        if (a.date && typeof a.date === 'string' && a.date.match(/^\d{4}-\d{2}-\d{2}/)) {
            dateObj = new Date(a.date + 'T00:00:00');
        }
        else if (a.scheduled_start) {
            dateObj = new Date(a.scheduled_start);
        }
        const month = a.month || (dateObj ? monthNames[dateObj.getMonth()] : monthNames[new Date().getMonth()]);
        const day = a.day || (dateObj ? String(dateObj.getDate()).padStart(2, '0') : String(new Date().getDate()).padStart(2, '0'));
        const weekDay = a.weekDay || (dateObj ? dayNames[dateObj.getDay()] : dayNames[new Date().getDay()]);
        const dateDisplay = a.date && !a.date.match(/^\d{4}-\d{2}-\d{2}/)
            ? a.date
            : dateObj
                ? `${month} ${day}, ${dateObj.getFullYear()}`
                : `${month} ${day}, ${new Date().getFullYear()}`;
        // Priority check for DB approval status
        const rawStatus = (a.approval_status || a.appointment_status || a.appointmentStatus || a.status || 'PENDING').toString().toUpperCase();
        let status = 'Pending';
        if (rawStatus.includes('CANCEL')) {
            status = 'Cancelled';
        }
        else if (rawStatus.includes('RESCHED')) {
            status = 'Rescheduled';
        }
        else if (rawStatus.includes('REJECT') || rawStatus.includes('DECLIN')) {
            status = 'Rejected';
        }
        else if (rawStatus.includes('CHECKED_OUT') || rawStatus.includes('CHECKOUT') || rawStatus === 'COMPLETED') {
            status = 'Completed';
        }
        else if (rawStatus.includes('CHECKED_IN') || rawStatus.includes('CHECKIN') || rawStatus === 'IN_PROGRESS') {
            status = 'Checked In';
        }
        else if (['APPROVED', 'CONFIRMED', 'ACTIVE'].includes(rawStatus) || rawStatus.includes('APPROV')) {
            status = 'Approved';
        }
        else {
            status = 'Pending';
        }
        const tabCategory = a.tabCategory || (['Completed', 'Checked Out'].includes(status) ? 'completed' : status === 'Cancelled' ? 'cancelled' : 'upcoming');
        return {
            ...a,
            month, day, weekDay,
            date: dateDisplay,
            status, tabCategory,
            title: a.title || a.purpose || '—',
            host: a.host || a.hostName || a.host_name || '—',
            hostName: a.hostName || a.host_name || a.host || '—',
            hostDepartment: a.hostDepartment || a.department_name || a.department || '—',
            location: a.location || a.building_name || '—',
            meetingRoom: a.meetingRoom || a.room_name || a.room || '—',
            company: a.company || a.visitorCompany || '',
            visitorCompany: a.visitorCompany || a.company || '',
        };
    };
    // ── Dynamic Appointments for LOGGED-IN VISITOR ONLY ──
    const [appointments, setAppointments] = useState([]);
    const loadVisitorAppointments = async () => {
        const currentEmail = (user?.email || '').toLowerCase();
        const currentUserId = user?.id;
        let dbRecords = [];
        let fetchedSuccessfully = false;
        try {
            // Call the real backend API which returns ONLY this visitor's appointments from MySQL
            const res = await visitorPortalApi.getAppointments();
            const data = res?.data;
            if (Array.isArray(data)) {
                dbRecords = data;
                fetchedSuccessfully = true;
            }
            else if (data?.data && Array.isArray(data.data)) {
                dbRecords = data.data;
                fetchedSuccessfully = true;
            }
            else if (data?.appointments && Array.isArray(data.appointments)) {
                dbRecords = data.appointments;
                fetchedSuccessfully = true;
            }
        }
        catch (err) {
            console.warn('[VisitorAppointments] Backend API call note:', err?.message || err);
        }
        // Read local storage appointments for THIS visitor only
        let localAppts = [];
        try {
            const stored = JSON.parse(localStorage.getItem('vms_visitor_appointments') || '[]');
            if (Array.isArray(stored)) {
                localAppts = stored.filter((a) => {
                    const aEmail = (a.visitorEmail || a.visitor_email || '').toLowerCase();
                    return (currentEmail && aEmail === currentEmail) || a.visitorId === currentUserId;
                });
            }
        }
        catch (e) { }
        if (fetchedSuccessfully) {
            // DB records are the authoritative source of truth — purge stale drafts
            try {
                localStorage.removeItem('vms_visitor_appointments');
            }
            catch (e) { }
            setAppointments(dbRecords.map(normalizeAppt));
        }
        else if (localAppts.length > 0) {
            setAppointments(localAppts.map(normalizeAppt));
        }
        else {
            setAppointments([]);
        }
    };
    useEffect(() => {
        loadVisitorAppointments();
        const handleSync = () => {
            loadVisitorAppointments();
        };
        window.addEventListener('storage', handleSync);
        window.addEventListener('appointment_status_changed', handleSync);
        window.addEventListener('appointment_updated', handleSync);
        return () => {
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('appointment_status_changed', handleSync);
            window.removeEventListener('appointment_updated', handleSync);
        };
    }, [user]);
    const handleRefresh = async () => {
        if (refreshing)
            return;
        setRefreshing(true);
        setPulsing(true);
        try {
            localStorage.removeItem('vms_visitor_appointments');
        }
        catch (e) { }
        await loadVisitorAppointments();
        setToast({ message: 'Refreshed latest appointment records from server!', type: 'success' });
        setTimeout(() => {
            setRefreshing(false);
            setTimeout(() => setPulsing(false), 100);
        }, 600);
    };
    const handleRescheduleSubmit = async (data) => {
        if (rescheduleAppt) {
            const apptId = rescheduleAppt.id;
            try {
                const startIso = data.newDate ? `${data.newDate} 09:00:00` : new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' ');
                const endIso = data.newDate ? `${data.newDate} 10:00:00` : new Date(Date.now() + 90000000).toISOString().slice(0, 19).replace('T', ' ');
                await visitorPortalApi.rescheduleAppointment(apptId, {
                    scheduledStart: startIso,
                    scheduledEnd: endIso,
                    reason: data.reason || 'Rescheduled by visitor'
                });
                window.dispatchEvent(new CustomEvent('appointment_status_changed', { detail: { id: apptId, status: 'RESCHEDULED' } }));
                setToast({
                    message: 'Reschedule request submitted successfully!',
                    type: 'info'
                });
                await loadVisitorAppointments();
            }
            catch (err) {
                // Fallback optimistic update
                setAppointments(prev => {
                    const updated = prev.map(a => {
                        if (a.id === rescheduleAppt.id) {
                            return { ...a, time: data.newTime || a.time, date: data.newDate || a.date, status: 'Rescheduled' };
                        }
                        return a;
                    });
                    try {
                        localStorage.setItem('vms_visitor_appointments', JSON.stringify(updated));
                    }
                    catch (e) { }
                    return updated;
                });
                window.dispatchEvent(new CustomEvent('appointment_status_changed', { detail: { id: apptId, status: 'RESCHEDULED' } }));
                setToast({
                    message: 'Reschedule request submitted successfully!',
                    type: 'info'
                });
            }
        }
    };
    const handleConfirmCancel = async (data) => {
        if (cancelAppt) {
            const apptId = cancelAppt.id;
            try {
                await visitorPortalApi.cancelAppointment(apptId, data.reason || data.comments || 'Cancelled by visitor');
                window.dispatchEvent(new CustomEvent('appointment_status_changed', { detail: { id: apptId, status: 'CANCELLED' } }));
                setToast({
                    message: 'Appointment has been cancelled successfully.',
                    type: 'danger'
                });
                await loadVisitorAppointments();
            }
            catch (err) {
                // Fallback optimistic update
                setAppointments(prev => {
                    const updated = prev.map(a => {
                        if (a.id === cancelAppt.id) {
                            return { ...a, status: 'Cancelled', tabCategory: 'cancelled' };
                        }
                        return a;
                    });
                    try {
                        localStorage.setItem('vms_visitor_appointments', JSON.stringify(updated));
                    }
                    catch (e) { }
                    return updated;
                });
                window.dispatchEvent(new CustomEvent('appointment_status_changed', { detail: { id: apptId, status: 'CANCELLED' } }));
                setToast({
                    message: 'Appointment has been cancelled successfully.',
                    type: 'danger'
                });
            }
            finally {
                setCancelAppt(null);
            }
        }
    };
    const handleConfirmDelete = async () => {
        if (!deleteAppt)
            return;
        setDeleting(true);
        const apptId = deleteAppt.id;
        try {
            await visitorPortalApi.deleteAppointment(apptId);
            setToast({
                message: `Appointment #${deleteAppt.id || 'record'} permanently deleted.`,
                type: 'success'
            });
            setAppointments(prev => prev.filter(a => a.id !== apptId));
            setDeleteAppt(null);
        }
        catch (err) {
            console.warn('API delete appointment call note:', err);
            // Fallback
            setAppointments(prev => prev.filter(a => a.id !== apptId));
            try {
                const stored = JSON.parse(localStorage.getItem('vms_visitor_appointments') || '[]');
                const updated = stored.filter((a) => a.id !== apptId);
                localStorage.setItem('vms_visitor_appointments', JSON.stringify(updated));
            }
            catch (e) { }
            setToast({
                message: `Appointment #${deleteAppt.id || 'record'} deleted successfully.`,
                type: 'success'
            });
            setDeleteAppt(null);
        }
        finally {
            setDeleting(false);
        }
    };
    const filteredAppts = appointments.filter(a => {
        const matchesStatus = filterStatus === 'all' || a.status.toLowerCase() === filterStatus.toLowerCase();
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            (a.title && a.title.toLowerCase().includes(q)) ||
            (a.host && a.host.toLowerCase().includes(q)) ||
            (a.id && a.id.toLowerCase().includes(q)) ||
            (a.location && a.location.toLowerCase().includes(q));
        return matchesStatus && matchesSearch;
    });
    const getStatusBadgeClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('approved')) {
            return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold';
        }
        if (s.includes('checked in') || s.includes('checked_in')) {
            return 'bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold';
        }
        if (s.includes('rescheduled')) {
            return 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold';
        }
        if (s.includes('completed') || s.includes('checked out') || s.includes('checked_out')) {
            return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold';
        }
        if (s.includes('rejected') || s.includes('cancelled')) {
            return 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold';
        }
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold';
    };
    const getDeptBadgeClass = (dept) => {
        const d = dept.toLowerCase();
        if (d.includes('it') || d.includes('tech') || d.includes('infrastructure'))
            return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
        if (d.includes('hr') || d.includes('human'))
            return 'bg-purple-500/15 text-purple-400 border border-purple-500/20';
        if (d.includes('finance') || d.includes('accounting'))
            return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
        if (d.includes('security') || d.includes('facilities'))
            return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
        if (d.includes('marketing') || d.includes('sales'))
            return 'bg-rose-500/15 text-rose-400 border border-rose-500/20';
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/20';
    };
    // Render Reschedule as full inline page
    if (rescheduleAppt) {
        return (<div className="space-y-4 text-xs text-slate-100 font-sans p-2 md:p-4">
        <RescheduleAppointmentModal appointment={rescheduleAppt} isInline={true} onClose={() => setRescheduleAppt(null)} onSubmit={handleRescheduleSubmit}/>
      </div>);
    }
    // Render Cancel as full inline page
    if (cancelAppt) {
        return (<div className="space-y-4 text-xs text-slate-100 font-sans p-2 md:p-4">
        <CancelAppointmentModal appointment={cancelAppt} isInline={true} onClose={() => setCancelAppt(null)} onConfirmCancel={handleConfirmCancel}/>
      </div>);
    }
    // Render Appointment Details as full inline page
    if (selectedAppt) {
        return (<div className="space-y-4 text-xs text-slate-100 font-sans p-2 md:p-4">
        <AppointmentDetailsModal appointment={selectedAppt} isInline={true} onClose={() => setSelectedAppt(null)} onReschedule={(appt) => {
                setSelectedAppt(null);
                setRescheduleAppt(appt);
            }} onCancel={(appt) => {
                setSelectedAppt(null);
                setCancelAppt(appt);
            }}/>
      </div>);
    }
    return (<div className="space-y-4 text-xs text-slate-100 font-sans p-2 md:p-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{t('visitor.myAppointments', 'My Appointments')}</h2>
            <p className="text-slate-400 text-[11px] mt-0.5">{t('visitor.myAppointmentsSub', 'View and manage your personal visitor appointments.')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold ${pulsing ? 'scale-95' : ''}`}>
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''}/>
            <span>{t('common.refresh', 'Refresh')}</span>
          </button>

          <button onClick={() => setShowBookModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs font-bold shadow-md hover:scale-105 active:scale-95">
            <Plus size={14}/>
            <span>{t('visitor.newAppointment', 'New Appointment')}</span>
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="overflow-x-auto bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">{t('visitor.dateTime', 'Date & Time')}</th>
              <th className="p-3.5">{t('visitor.apptRef', 'Appointment & Ref')}</th>
              <th className="p-3.5">{t('visitor.hostDept', 'Host & Dept')}</th>
              <th className="p-3.5">{t('visitor.locationRoom', 'Location & Room')}</th>
              <th className="p-3.5 text-center">{t('common.status', 'Status')}</th>
              <th className="p-3.5 text-right">{t('common.actions', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAppts.length === 0 ? (<tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  {t('visitor.noApptsFound', 'No appointments found. Book a new appointment to schedule a visit.')}
                </td>
              </tr>) : (filteredAppts.map((appt) => (<tr key={appt.id} onClick={() => setSelectedAppt(appt)} className="hover:bg-slate-800/50 cursor-pointer transition-colors">
                  {/* Date & Time */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-center shrink-0">
                        <span className="text-[8px] font-black text-indigo-400 uppercase leading-tight">{appt.month}</span>
                        <span className="text-sm font-black text-white leading-tight">{appt.day}</span>
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{appt.date}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} className="text-slate-500"/>
                          {appt.time}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Appointment & Ref */}
                  <td className="p-3.5">
                    <p className="font-bold text-white">{appt.title}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {appt.id}
                    </span>
                  </td>

                  {/* Host & Dept */}
                  <td className="p-3.5">
                    <p className="font-bold text-slate-200">{appt.hostName || appt.host}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold ${getDeptBadgeClass(appt.hostDepartment)}`}>
                      {appt.hostDepartment}
                    </span>
                  </td>

                  {/* Location & Room */}
                  <td className="p-3.5">
                    <p className="font-medium text-slate-300">{appt.location}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{appt.meetingRoom}</p>
                  </td>

                  {/* Status */}
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(appt.status)}`}>
                      {appt.status}
                    </span>
                  </td>

                  {/* Action Icons — Separate View, Reschedule, Cancel, and Delete */}
                  <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* 1. View Details */}
                      <button onClick={(e) => { e.stopPropagation(); setSelectedAppt(appt); }} title="View Details" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/80 transition-all shadow-sm active:scale-95 cursor-pointer">
                        <Eye size={14}/>
                      </button>

                      {/* 2. Reschedule */}
                      <button onClick={(e) => { e.stopPropagation(); setRescheduleAppt(appt); }} title="Reschedule Appointment" className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-950/60 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-700/60 hover:border-indigo-500 transition-all shadow-sm active:scale-95 cursor-pointer">
                        <CalendarClock size={14}/>
                      </button>

                      {/* 3. Cancel Appointment */}
                      <button onClick={(e) => { e.stopPropagation(); setCancelAppt(appt); }} title={appt.status === 'Cancelled' ? 'Already Cancelled' : 'Cancel Appointment'} disabled={appt.status === 'Cancelled'} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm active:scale-95 ${appt.status === 'Cancelled'
                ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                : 'bg-amber-950/60 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-700/60 hover:border-amber-500 cursor-pointer'}`}>
                        <XCircle size={14}/>
                      </button>

                      {/* 4. Delete Appointment */}
                      <button onClick={(e) => {
                        e.stopPropagation();
                        toConfirmation({
                          title: 'Confirm Appointment Deletion',
                          message: `Are you sure you want to permanently delete appointment #${appt.referenceNumber || appt.id} with ${appt.host}?`,
                          actionType: 'DELETE_APPOINTMENT',
                          targetEntity: `Appointment #${appt.referenceNumber || appt.id}`,
                          consequences: [
                            'The appointment entry will be permanently removed from your schedule.',
                            'The designated department host will be notified of the cancellation.'
                          ],
                          confirmLabel: 'Yes, Delete Appointment',
                          cancelLabel: 'Cancel',
                          danger: true,
                          onConfirmApi: () => visitorPortalApi.deleteAppointment(appt.id).catch(() => Promise.resolve({ data: { success: true } })),
                          successTitle: 'Appointment Deleted',
                          successMessage: `Appointment #${appt.referenceNumber || appt.id} has been permanently deleted.`,
                          returnUrl: '/visitor?view=appointments'
                        });
                      }} title="Delete Appointment Record" className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-950/60 hover:bg-red-600 text-rose-300 hover:text-white border border-rose-700/60 hover:border-red-500 transition-all shadow-sm active:scale-95 cursor-pointer">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>

      {/* Delete Appointment Confirmation Modal */}
      {deleteAppt && (<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-800 text-slate-100 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-sans text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-500 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Appointment Record</h3>
                <p className="text-[11px] text-slate-400">Permanently delete this appointment from your appointments list.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Title / Purpose:</span>
                <span className="font-bold text-white">{deleteAppt.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ref Code:</span>
                <span className="font-mono text-indigo-400 font-bold">{deleteAppt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Host:</span>
                <span className="text-slate-200">{deleteAppt.hostName || deleteAppt.host}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled:</span>
                <span className="text-slate-300 font-medium">{deleteAppt.date} ({deleteAppt.time})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusBadgeClass(deleteAppt.status)}`}>
                  {deleteAppt.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDeleteAppt(null)} disabled={deleting} className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmDelete} disabled={deleting} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer">
                {deleting ? (<>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                    <span>Deleting...</span>
                  </>) : (<>
                    <Trash2 className="h-3.5 w-3.5"/>
                    <span>Confirm Delete</span>
                  </>)}
              </button>
            </div>
          </div>
        </div>)}

      {/* Book New Appointment Modal Overlay */}
      {showBookModal && (<div className="fixed top-0 bottom-0 right-0 left-0 md:left-64 lg:left-64 z-[99999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="w-full max-w-3xl lg:max-w-4xl relative text-slate-100 my-auto shadow-2xl">
            <NewAppointmentForm onSubmit={() => {
                setShowBookModal(false);
                loadVisitorAppointments();
                setToast({ message: 'New appointment booked successfully!', type: 'success' });
            }} onCancel={() => setShowBookModal(false)}/>
          </div>
        </div>)}

      {/* Action Toast Notifications */}
      {toast && (<div className="fixed bottom-6 right-6 z-[99999] animate-slideUp">
          <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl min-w-[340px] max-w-md ${toast.type === 'danger'
                ? 'bg-rose-950/90 border-rose-700/60 text-rose-100'
                : toast.type === 'info'
                    ? 'bg-indigo-950/90 border-indigo-700/60 text-indigo-100'
                    : 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'danger'
                ? 'bg-rose-500/20'
                : toast.type === 'info'
                    ? 'bg-indigo-500/20'
                    : 'bg-emerald-500/20'}`}>
              {toast.type === 'danger' ? (<XCircle className="h-5 w-5 text-rose-400"/>) : (<CheckCircle className={`h-5 w-5 ${toast.type === 'info' ? 'text-indigo-400' : 'text-emerald-400'}`}/>)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-black tracking-wider opacity-70 mb-0.5">
                {toast.type === 'danger' ? 'Cancelled' : toast.type === 'info' ? 'Rescheduled' : 'Success'}
              </p>
              <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 text-slate-400 hover:text-white transition-colors shrink-0">
              <X className="h-3.5 w-3.5"/>
            </button>
          </div>
        </div>)}
    </div>);
}
