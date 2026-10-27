import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, QrCode, CheckCircle2, FileText, Bell, User as UserIcon, Plus, Search, MapPin, Sparkles, Copy, Check, Download, X } from 'lucide-react';
import { visitorPortalApi } from '../../services/api';
import QRCode from 'qrcode';
const THEME_STYLES = {
    indigo: {
        barColor: '#6366f1',
        hoverBarColor: '#818cf8',
        darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(224, 231, 255, 0.95) 70%, #ffffff 100%)',
    },
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(236, 253, 245, 0.95) 70%, #ffffff 100%)',
    },
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(239, 246, 255, 0.95) 70%, #ffffff 100%)',
    },
    purple: {
        barColor: '#a855f7',
        hoverBarColor: '#c084fc',
        darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(243, 232, 255, 0.95) 70%, #ffffff 100%)',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(254, 243, 199, 0.95) 70%, #ffffff 100%)',
    }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 260, damping: 20 }
    }
};
function KpiCard({ title, value, subtitle, badge, icon, theme, onClick }) {
    const [hovered, setHovered] = useState(false);
    const styles = THEME_STYLES[theme];
    return (<motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={`border rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 min-h-[140px] sm:min-h-[165px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-[#0a0f1d] border-slate-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] text-white ${hovered ? 'shadow-xl border-slate-700' : ''}`}>
      {/* Dark Hover Fill Overlay */}
      <div style={{
            background: styles.darkHoverBg,
            opacity: hovered ? 1 : 0,
        }} className="absolute inset-0 transition-opacity duration-300 pointer-events-none"/>

      {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
      <div style={{
            backgroundColor: hovered ? styles.hoverBarColor : styles.barColor,
            boxShadow: hovered ? `0 0 20px ${styles.barColor}` : `0 0 8px ${styles.barColor}`,
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

      <div className="flex items-start justify-between relative z-10 gap-2">
        <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
          {title}
        </span>
        
        {/* Sleek Vertical Oval Pill Icon Capsule Container */}
        <div className="w-8 h-10 sm:w-9 sm:h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-all shadow-sm shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 sm:mt-4 relative z-10">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{value}</h2>
          {badge}
        </div>
        <p className="text-xs text-slate-400 group-hover:text-slate-200 font-semibold mt-1 transition-colors">
          {subtitle}
        </p>
      </div>
    </motion.div>);
}
export default function VisitorDashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [activeApptTab, setActiveApptTab] = useState('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [copied, setCopied] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    // ── Helper to load current visitor's profile details ──
    const visitorProfile = useMemo(() => {
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
        try {
            const reg = sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
            if (reg) {
                const parsed = JSON.parse(reg);
                const rEmail = (parsed.email || '').toLowerCase();
                if (!rEmail || !authEmail || rEmail === authEmail) {
                    p = {
                        ...p,
                        full_name: parsed.visitorName || parsed.fullName || parsed.full_name || p.full_name,
                        email: parsed.email || p.email,
                        phone: parsed.phone || p.phone,
                        company: parsed.company || p.company,
                        department_name: parsed.department || parsed.departmentName || p.department_name,
                        visitor_code: parsed.historyCode || parsed.visitor_code || p.visitor_code,
                        reference_number: parsed.referenceNumber || parsed.reference_number || p.reference_number
                    };
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
    }, [user]);
    // Visitor Digital Pass details
    const visitorPass = useMemo(() => ({
        visitorName: visitorProfile.fullName,
        passId: visitorProfile.visitorCode,
        validOn: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Approved Visitor',
        qrPayload: `VISITOR:${visitorProfile.visitorCode}:${visitorProfile.fullName}:${visitorProfile.email}`,
        entryGate: 'Gate A - Main Entrance'
    }), [visitorProfile]);
    useEffect(() => {
        QRCode.toDataURL(visitorPass.qrPayload, { width: 250, margin: 2, color: { dark: '#020617', light: '#ffffff' } })
            .then((url) => setQrDataUrl(url))
            .catch(() => { });
    }, [visitorPass.qrPayload]);
    // Appointments List for THIS Visitor Only
    const [appointments, setAppointments] = useState([]);
    const [newRequests, setNewRequests] = useState([]);
    const [documentsCount, setDocumentsCount] = useState(0);
    // Load appointments belonging strictly to THIS logged-in visitor
    const loadVisitorData = async () => {
        let loaded = [];
        const currentEmail = (user?.email || '').toLowerCase();
        const currentUserId = user?.id;
        // Fetch documents count for this user
        try {
            const storageKey = `vms_visitor_docs_${currentEmail || 'default'}`;
            let localCount = 0;
            try {
                const localDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
                if (Array.isArray(localDocs))
                    localCount = localDocs.length;
            }
            catch (e) { }
            const docRes = await visitorPortalApi.getDocuments();
            const docsArr = Array.isArray(docRes.data) ? docRes.data : (docRes.data?.data || docRes.data?.documents || []);
            setDocumentsCount(Math.max(docsArr.length, localCount));
        }
        catch (e) {
            const storageKey = `vms_visitor_docs_${currentEmail || 'default'}`;
            try {
                const localDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
                setDocumentsCount(Array.isArray(localDocs) ? localDocs.length : 0);
            }
            catch (err) {
                setDocumentsCount(0);
            }
        }
        // 1. Fetch real backend appointments for this visitor
        try {
            const res = await visitorPortalApi.getAppointments();
            const data = res?.data;
            let records = [];
            let fetchedSuccessfully = false;
            if (Array.isArray(data)) {
                records = data;
                fetchedSuccessfully = true;
            }
            else if (data?.data && Array.isArray(data.data)) {
                records = data.data;
                fetchedSuccessfully = true;
            }
            else if (data?.appointments && Array.isArray(data.appointments)) {
                records = data.appointments;
                fetchedSuccessfully = true;
            }
            if (fetchedSuccessfully) {
                try {
                    localStorage.removeItem('vms_visitor_appointments');
                }
                catch (e) { }
                loaded = records.map((a) => {
                    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                    let dateObj = null;
                    if (a.scheduled_start) {
                        dateObj = new Date(a.scheduled_start);
                    }
                    const month = dateObj ? monthNames[dateObj.getMonth()] : monthNames[new Date().getMonth()];
                    const day = dateObj ? String(dateObj.getDate()).padStart(2, '0') : String(new Date().getDate()).padStart(2, '0');
                    const weekday = dateObj ? dayNames[dateObj.getDay()] : dayNames[new Date().getDay()];
                    const dateStr = `${month} ${day} ${weekday}`;
                    const rawStatus = (a.approval_status || a.appointment_status || a.status || 'PENDING').toString().toUpperCase();
                    let status = 'Pending';
                    if (['APPROVED', 'CONFIRMED', 'ACTIVE'].includes(rawStatus)) {
                        status = 'Approved';
                    }
                    else if (['REJECTED', 'DECLINED'].includes(rawStatus)) {
                        status = 'Rejected';
                    }
                    else if (['CANCELLED'].includes(rawStatus)) {
                        status = 'Cancelled';
                    }
                    else if (['COMPLETED', 'CHECKED_OUT'].includes(rawStatus)) {
                        status = 'Completed';
                    }
                    else {
                        status = 'Pending';
                    }
                    return {
                        id: a.id || a.appointment_code || a.reference_code,
                        title: a.purpose || a.title || '—',
                        host: a.hostName || a.host_name || a.host || '—',
                        hostDepartment: a.hostDepartment || a.department_name || '—',
                        hostAvatar: '',
                        dateStr,
                        month,
                        day,
                        weekday,
                        time: a.time || (a.scheduled_start ? `${new Date(a.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'),
                        location: a.location || '—',
                        room: a.roomName || a.room_name || a.room || '—',
                        purpose: a.purpose || '—',
                        status,
                        rawStatus,
                        tabCategory: status === 'Completed' ? 'completed' : status === 'Cancelled' ? 'cancelled' : 'upcoming'
                    };
                });
                setAppointments(loaded);
                return;
            }
        }
        catch (err) {
            console.warn('[VisitorDashboard] Backend appointments fetch note:', err?.message || err);
        }
        // Check local storage appointments matching current user only
        try {
            const localAppts = JSON.parse(localStorage.getItem('vms_visitor_appointments') || '[]');
            if (Array.isArray(localAppts)) {
                const userAppts = localAppts.filter((a) => {
                    const aEmail = (a.visitorEmail || a.visitor_email || '').toLowerCase();
                    return (currentEmail && aEmail === currentEmail) || a.visitorId === currentUserId;
                });
                if (userAppts.length > 0) {
                    setAppointments(userAppts);
                    return;
                }
            }
        }
        catch (e) { }
        setAppointments([]);
    };
    useEffect(() => {
        loadVisitorData();
    }, [user, visitorProfile]);
    // Visit History Data for THIS visitor
    const visitHistory = useMemo(() => {
        return appointments
            .filter(a => a.status === 'Completed' || a.status === 'Approved')
            .map((a, idx) => ({
            id: idx + 1,
            date: a.dateStr || a.date || '—',
            host: a.host ? `${a.host}${a.hostDepartment && a.hostDepartment !== '—' ? ` (${a.hostDepartment})` : ''}` : '—',
            location: a.location || '—',
            purpose: a.purpose || '—',
            status: a.status || 'Completed'
        }));
    }, [appointments]);
    // Notifications List relevant to THIS visitor
    const notifications = useMemo(() => [
        { id: 1, title: `Welcome to VMS Portal, ${visitorProfile.fullName}. Your visitor profile is active.`, time: 'Just now', type: 'info' }
    ], [visitorProfile]);
    // KPI Metrics calculation for THIS visitor only
    const metrics = useMemo(() => {
        const upcomingCount = appointments.filter(a => a.status === 'Approved' || a.status === 'Pending' || a.tabCategory === 'upcoming').length;
        const approvedPassesCount = appointments.filter(a => a.status === 'Approved' || a.rawStatus === 'APPROVED').length;
        const completedCount = appointments.filter(a => a.status === 'Completed' || a.tabCategory === 'completed').length;
        const notificationsCount = notifications.length;
        return { upcomingCount, approvedPassesCount, completedCount, documentsCount, notificationsCount };
    }, [appointments, notifications, documentsCount]);
    const handleCopyPassId = () => {
        navigator.clipboard.writeText(visitorPass.passId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => {
            const matchesSearch = searchQuery === '' ||
                (a.title && a.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (a.host && a.host.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (a.location && a.location.toLowerCase().includes(searchQuery.toLowerCase()));
            if (!matchesSearch)
                return false;
            if (activeApptTab === 'upcoming')
                return a.tabCategory === 'upcoming' || a.status === 'Approved' || a.status === 'Pending';
            if (activeApptTab === 'approved')
                return a.status === 'Approved';
            if (activeApptTab === 'completed')
                return a.status === 'Completed';
            if (activeApptTab === 'cancelled')
                return a.status === 'Cancelled';
            return true;
        });
    }, [appointments, activeApptTab, searchQuery]);
    const containerVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.08 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };
    return (<motion.div initial="hidden" animate="visible" variants={containerVariants} className="p-3 sm:p-5 md:p-8 bg-[#070b14] text-slate-100 min-h-screen space-y-5 sm:space-y-6 font-sans selection:bg-indigo-500 selection:text-white max-w-7xl mx-auto overflow-hidden">
      {/* ── TOP HERO BANNER & WELCOME HEADER ── */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0a0f1d] border border-slate-800 p-4 sm:p-6 md:p-8 shadow-2xl transition-colors">
        {/* TOP CURVED WAVE SVG ACCENT (Matching User Image) */}
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-90 dark:opacity-40">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveVisitor)"></path>
            <defs>
              <linearGradient id="topWaveVisitor" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f3875"/>
                <stop offset="50%" stopColor="#1e50a2"/>
                <stop offset="100%" stopColor="#00a0e9"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* BOTTOM CURVED WAVE SVG ACCENT (Matching User Image) */}
        <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-85 dark:opacity-40">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveVisitor)"></path>
            <defs>
              <linearGradient id="bottomWaveVisitor" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00a0e9"/>
                <stop offset="50%" stopColor="#2563eb"/>
                <stop offset="100%" stopColor="#1d4ed8"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Decorative background ambient glows */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none"/>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 my-1">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-extrabold shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              {t('visitorDash.digitalPassActive')}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center flex-wrap gap-2 sm:gap-3">
              <span>{t('visitorDash.welcomeBack')}, {visitorProfile.fullName}</span>
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-pulse shrink-0"/>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
              {t('visitorDash.heroDesc')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <button onClick={() => setSearchParams({ view: 'request_appointment' })} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto">
              <Plus className="w-4 h-4"/>
              {t('visitorDash.bookAppt')}
            </button>
            <button onClick={() => setQrModalOpen(true)} className="px-5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 backdrop-blur-md transition-all hover:scale-[1.02] shadow-none w-full sm:w-auto">
              <QrCode className="w-4 h-4 text-blue-400"/>
              {t('visitorDash.digitalPassQR')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── TOP KPI METRIC STAT CARDS (EMPLOYEE DASHBOARD SIGNATURE STYLE) ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title={t('dashboard.appointments')} value={metrics.upcomingCount} subtitle={t('visitorDash.appointmentsSubtitle')} badge={<span className="text-xs text-indigo-400 font-extrabold">Active</span>} icon={<Calendar className="w-5 h-5"/>} theme="indigo" onClick={() => setSearchParams({ view: 'my_appointments' })}/>

        <KpiCard title={t('visitorDash.approvedPasses')} value={metrics.approvedPassesCount} subtitle={t('visitorDash.approvedPassesSubtitle')} badge={<span className="text-xs text-emerald-400 font-extrabold">Verified</span>} icon={<CheckCircle2 className="w-5 h-5"/>} theme="emerald" onClick={() => setSearchParams({ view: 'my_appointments' })}/>

        <KpiCard title={t('visitorDash.totalVisits')} value={metrics.completedCount} subtitle={t('visitorDash.totalVisitsSubtitle')} badge={<span className="text-xs text-blue-400 font-extrabold">History</span>} icon={<Clock className="w-5 h-5"/>} theme="blue" onClick={() => setSearchParams({ view: 'visit_history' })}/>

        <KpiCard title={t('visitorDash.documents')} value={metrics.documentsCount} subtitle={t('visitorDash.documentsSubtitle')} badge={<span className="text-xs text-purple-400 font-extrabold font-mono">2 Files</span>} icon={<FileText className="w-5 h-5"/>} theme="purple" onClick={() => setSearchParams({ view: 'visitor_documents' })}/>

        <KpiCard title={t('visitorDash.alerts')} value={metrics.notificationsCount} subtitle={t('visitorDash.alertsSubtitle')} badge={<span className="text-xs text-amber-400 font-extrabold">Live</span>} icon={<Bell className="w-5 h-5"/>} theme="amber" onClick={() => setSearchParams({ view: 'visitor_notifications' })}/>
      </motion.div>

      {/* ── MAIN DASHBOARD GRID: BALANCED 2-ROW (2:1 RATIO) GRID ── */}
      <div className="space-y-6">
        {/* ROW 1: APPOINTMENTS (2 SPAN) & DIGITAL ENTRY PASS (1 SPAN) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MY SCHEDULED APPOINTMENTS (lg:col-span-2) */}
          <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="lg:col-span-2 bg-[#0b101b] border border-slate-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 relative overflow-hidden group flex flex-col justify-between">
            {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
            <div style={{
            backgroundColor: '#6366f1',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-3xl transition-all duration-300 group-hover:w-[10px] z-10"/>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 sm:pb-4 relative z-10">
              <div className="flex items-center gap-3">
                {/* Sleek Vertical Oval Pill Icon Capsule Container */}
                <div className="w-8 h-10 sm:w-9 sm:h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-indigo-400 shadow-sm shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5"/>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {t('visitorDash.myScheduledAppts')}
                  </h3>
                  <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5 font-medium">{t('visitorDash.apptsDesc')}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
                {['upcoming', 'approved', 'completed', 'cancelled'].map(tab => (<button key={tab} onClick={() => setActiveApptTab(tab)} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold capitalize transition-all whitespace-nowrap shrink-0 ${activeApptTab === tab
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'}`}>
                    {tab === 'upcoming' ? t('visitorDash.tabUpcoming') :
                tab === 'approved' ? t('visitorDash.tabApproved') :
                    tab === 'completed' ? t('visitorDash.tabCompleted') :
                        t('visitorDash.tabCancelled')}
                  </button>))}
              </div>
            </div>

            {/* Filter Search input */}
            <div className="relative z-10">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500"/>
              <input type="text" placeholder={t('visitorDash.searchAppts')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-medium"/>
            </div>

            {/* Appointments List Render */}
            {filteredAppointments.length === 0 ? (<div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-3 relative z-10 my-auto">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                  <Calendar className="w-6 h-6"/>
                </div>
                <div>
                  <p className="text-slate-200 font-bold text-xs">{t('visitorDash.noAppts')}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t('visitorDash.noApptsDesc')}</p>
                </div>
                <button onClick={() => setSearchParams({ view: 'request_appointment' })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5"/>
                  {t('visitorDash.bookApptNow')}
                </button>
              </div>) : (<div className="space-y-3 relative z-10 flex-1 overflow-y-auto max-h-[340px] pr-1">
                {filteredAppointments.map(appt => (<div key={appt.id} onClick={() => setSelectedAppt(appt)} className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-indigo-300 uppercase">{appt.month || 'AUG'}</span>
                        <span className="text-sm font-black text-white">{appt.day || '05'}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-xs group-hover:text-indigo-300 transition-colors">{appt.title}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {appt.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 font-medium">
                          <span className="flex items-center gap-1"><UserIcon size={12} className="text-indigo-400"/> {appt.host} ({appt.hostDepartment || 'HR'})</span>
                          <span className="flex items-center gap-1"><Clock size={12} className="text-indigo-400"/> {appt.time}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-indigo-400"/> {appt.location}</span>
                        </div>
                      </div>
                    </div>

                    <button onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAppt(appt);
                }} className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all self-end sm:self-center shrink-0">
                      View Details
                    </button>
                  </div>))}
              </div>)}
          </motion.div>

          {/* DIGITAL ENTRY PASS (lg:col-span-1) */}
          <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="lg:col-span-1 bg-[#0b101b] border border-slate-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden group flex flex-col justify-between">
            {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
            <div style={{
            backgroundColor: '#10b981',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-3xl transition-all duration-300 group-hover:w-[10px] z-10"/>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-10 sm:w-9 sm:h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5"/>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Digital Entry Pass</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Gate Pass Credential</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-center space-y-3 relative z-10">
              {qrDataUrl ? (<div className="p-2 bg-white rounded-2xl shadow-lg border border-slate-200">
                  <img src={qrDataUrl} alt="Visitor QR" className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-xl"/>
                </div>) : (<div className="w-32 h-32 sm:w-36 sm:h-36 bg-slate-800 rounded-2xl flex items-center justify-center">
                  <QrCode size={40} className="text-slate-600"/>
                </div>)}
              <div>
                <h4 className="font-extrabold text-white text-sm">{visitorPass.visitorName}</h4>
                <p className="text-[11px] font-mono text-indigo-400 font-bold mt-0.5">Code: {visitorPass.passId}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{visitorPass.entryGate}</p>
              </div>

              <div className="w-full pt-1 flex items-center gap-2">
                <button onClick={handleCopyPassId} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md">
                  {copied ? <Check size={14}/> : <Copy size={14}/>}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <button onClick={() => setQrModalOpen(true)} className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                  <Download size={14}/>
                  View
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ROW 2: ALERTS & NOTIFICATIONS (2 SPAN) & QUICK ACTIONS GUIDE (1 SPAN) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MY ALERTS & NOTIFICATIONS (lg:col-span-2) */}
          <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="lg:col-span-2 bg-[#0b101b] border border-slate-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
            <div style={{
            backgroundColor: '#f59e0b',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-3xl transition-all duration-300 group-hover:w-[10px] z-10"/>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-10 sm:w-9 sm:h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5"/>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">My Alerts &amp; Notifications</h3>
                  <p className="text-xs text-slate-400 font-medium">Real-time status updates &amp; appointment logs</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                Live Feed
              </span>
            </div>

            <div className="space-y-3 relative z-10 mt-3 flex-1">
              {notifications.map(n => (<div key={n.id} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-4 hover:border-amber-500/40 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <p className="text-slate-200 font-semibold leading-relaxed truncate">{n.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{n.time}</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0"/>
                </div>))}
            </div>
          </motion.div>

          {/* QUICK VISITOR ACTIONS (lg:col-span-1) */}
          <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="lg:col-span-1 bg-[#0b101b] border border-slate-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
            <div style={{
            backgroundColor: '#a855f7',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-3xl transition-all duration-300 group-hover:w-[10px] z-10"/>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
                  <Sparkles className="w-5 h-5"/>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Visitor Shortcuts</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Quick portal actions</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 mt-3 flex-1">
              <button onClick={() => setSearchParams({ view: 'request_appointment' })} className="p-3.5 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl flex flex-col items-start justify-between text-left group/btn transition-all">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover/btn:scale-110 transition-transform">
                  <Plus className="w-4 h-4"/>
                </div>
                <div className="mt-3">
                  <span className="text-xs font-bold text-white block">Book Visit</span>
                  <span className="text-[10px] text-slate-500 font-medium block">Schedule host</span>
                </div>
              </button>

              <button onClick={() => setSearchParams({ view: 'visitor_documents' })} className="p-3.5 bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-start justify-between text-left group/btn transition-all">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover/btn:scale-110 transition-transform">
                  <FileText className="w-4 h-4"/>
                </div>
                <div className="mt-3">
                  <span className="text-xs font-bold text-white block">Upload ID</span>
                  <span className="text-[10px] text-slate-500 font-medium block">Verification file</span>
                </div>
              </button>

              <button onClick={() => setQrModalOpen(true)} className="p-3.5 bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 rounded-2xl flex flex-col items-start justify-between text-left group/btn transition-all">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl group-hover/btn:scale-110 transition-transform">
                  <QrCode className="w-4 h-4"/>
                </div>
                <div className="mt-3">
                  <span className="text-xs font-bold text-white block">Digital Pass</span>
                  <span className="text-[10px] text-slate-500 font-medium block">Full QR view</span>
                </div>
              </button>

              <button onClick={() => setSearchParams({ view: 'visit_history' })} className="p-3.5 bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 rounded-2xl flex flex-col items-start justify-between text-left group/btn transition-all">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover/btn:scale-110 transition-transform">
                  <Clock className="w-4 h-4"/>
                </div>
                <div className="mt-3">
                  <span className="text-xs font-bold text-white block">Visit History</span>
                  <span className="text-[10px] text-slate-500 font-medium block">Past check-ins</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAppt && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0f172a] border border-slate-800 text-slate-100 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Appointment Details</h3>
              <button onClick={() => setSelectedAppt(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="space-y-3 text-xs">
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Title</span><span className="font-bold text-white">{selectedAppt.title}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Host &amp; Dept</span><span className="font-bold text-slate-200">{selectedAppt.host} ({selectedAppt.hostDepartment || 'HR'})</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Time &amp; Date</span><span className="font-bold text-slate-200">{selectedAppt.dateStr || selectedAppt.date} — {selectedAppt.time}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span><span className="font-bold text-slate-200">{selectedAppt.location}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span><span className="font-bold text-emerald-400">{selectedAppt.status}</span></div>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedAppt(null)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs">Close</button>
            </div>
          </div>
        </div>)}
    </motion.div>);
}
