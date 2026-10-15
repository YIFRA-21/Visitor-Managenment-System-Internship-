import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, CheckCircle, TrendingUp, Plus, UserCheck, Shield, ArrowUpRight, RefreshCw, MapPin, Megaphone, CheckSquare, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { employeePortalApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';
function Skeleton({ className }) {
    return (<div className={`animate-pulse bg-slate-800/50 border border-slate-700/30 rounded-2xl ${className}`}/>);
}
// Fallback weekly traffic trend data for high-resolution visual presentation
const DEFAULT_WEEKLY_TREND = [
    { date: 'Mon', count: 4 },
    { date: 'Tue', count: 7 },
    { date: 'Wed', count: 12 },
    { date: 'Thu', count: 9 },
    { date: 'Fri', count: 15 },
    { date: 'Sat', count: 3 },
    { date: 'Sun', count: 2 },
];
const THEME_STYLES = {
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        bg: '#0a0f1d',
        hoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
        borderColor: 'rgba(59, 130, 246, 0.25)',
        hoverBorderColor: 'rgba(59, 130, 246, 0.8)',
        shadow: '0 15px 40px -5px rgba(59, 130, 246, 0.45)',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(239, 246, 255, 0.95) 70%, #ffffff 100%)',
    },
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        bg: '#0a0f1d',
        hoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
        borderColor: 'rgba(16, 185, 129, 0.25)',
        hoverBorderColor: 'rgba(16, 185, 129, 0.8)',
        shadow: '0 15px 40px -5px rgba(16, 185, 129, 0.45)',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(236, 253, 245, 0.95) 70%, #ffffff 100%)',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        bg: '#0a0f1d',
        hoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
        borderColor: 'rgba(245, 158, 11, 0.25)',
        hoverBorderColor: 'rgba(245, 158, 11, 0.8)',
        shadow: '0 15px 40px -5px rgba(245, 158, 11, 0.45)',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(254, 243, 199, 0.95) 70%, #ffffff 100%)',
    },
    cyan: {
        barColor: '#06b6d4',
        hoverBarColor: '#22d3ee',
        bg: '#0a0f1d',
        hoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
        borderColor: 'rgba(6, 182, 212, 0.25)',
        hoverBorderColor: 'rgba(6, 182, 212, 0.8)',
        shadow: '0 15px 40px -5px rgba(6, 182, 212, 0.45)',
        darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(207, 250, 254, 0.95) 70%, #ffffff 100%)',
    },
    purple: {
        barColor: '#a855f7',
        hoverBarColor: '#c084fc',
        bg: '#0a0f1d',
        hoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
        borderColor: 'rgba(168, 85, 247, 0.25)',
        hoverBorderColor: 'rgba(168, 85, 247, 0.8)',
        shadow: '0 15px 40px -5px rgba(168, 85, 247, 0.45)',
        darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(243, 232, 255, 0.95) 70%, #ffffff 100%)',
    },
    indigo: {
        barColor: '#6366f1',
        hoverBarColor: '#818cf8',
        bg: '#0a0f1d',
        hoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
        borderColor: 'rgba(99, 102, 241, 0.25)',
        hoverBorderColor: 'rgba(99, 102, 241, 0.8)',
        shadow: '0 15px 40px -5px rgba(99, 102, 241, 0.45)',
        darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(224, 231, 255, 0.95) 70%, #ffffff 100%)',
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
    return (<motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={`border rounded-2xl p-5 pl-6 min-h-[170px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-white dark:bg-[#0a0f1d] border-slate-200 dark:border-slate-800 shadow-md dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] ${hovered ? 'shadow-xl' : ''}`}>
      {/* Dark Hover Fill Overlay */}
      <div style={{
            background: styles.darkHoverBg,
            opacity: hovered ? 1 : 0,
        }} className="absolute inset-0 transition-opacity duration-300 pointer-events-none hidden dark:block"/>
      {/* Light Hover Fill Overlay */}
      <div style={{
            background: styles.lightHoverBg,
            opacity: hovered ? 1 : 0,
        }} className="absolute inset-0 transition-opacity duration-300 pointer-events-none block dark:hidden"/>

      {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
      <div style={{
            backgroundColor: hovered ? styles.hoverBarColor : styles.barColor,
            boxShadow: hovered ? `0 0 20px ${styles.barColor}` : `0 0 8px ${styles.barColor}`,
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

      <div className="flex items-start justify-between relative z-10 gap-2">
        <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
          {title}
        </span>
        
        {/* Sleek Vertical Oval Pill Icon Capsule Container */}
        <div className="w-8 h-10 sm:w-9 sm:h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:scale-110 transition-all shadow-sm shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-4 relative z-10">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h2>
          {badge}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 font-semibold mt-1 transition-colors">
          {subtitle}
        </p>
      </div>
    </motion.div>);
}
export default function EmployeeDashboard() {
    const navigate = useNavigate();
    const { t, tStatus } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    // Hover states for larger cards
    const [trendHovered, setTrendHovered] = useState(false);
    const [overviewHovered, setOverviewHovered] = useState(false);
    const [meetingsHovered, setMeetingsHovered] = useState(false);
    const [actionsHovered, setActionsHovered] = useState(false);
    const [announcementsHovered, setAnnouncementsHovered] = useState(false);
    const fetchStats = async (showSkeleton = false) => {
        if (showSkeleton)
            setLoading(true);
        try {
            const [dashRes, reqsRes, visitorsRes] = await Promise.allSettled([
                employeePortalApi.getDashboard(),
                employeePortalApi.getVisitorRequests('ALL'),
                employeePortalApi.getMyVisitors(),
            ]);
            let payload = dashRes.status === 'fulfilled' ? (dashRes.value.data?.data ? { ...dashRes.value.data.data, ...dashRes.value.data } : dashRes.value.data) : {};
            const reqList = reqsRes.status === 'fulfilled' && Array.isArray(reqsRes.value.data) ? reqsRes.value.data : [];
            const visitorList = visitorsRes.status === 'fulfilled' && Array.isArray(visitorsRes.value.data) ? visitorsRes.value.data : [];
            const pendingReqsCount = reqList.filter((r) => {
                const s = (r.status || r.approval_status || 'PENDING').toUpperCase();
                return s === 'PENDING' || s === 'REQUESTED' || s === 'PENDING_APPROVAL' || s === 'UNAPPROVED';
            }).length;
            const activeOnsiteCount = reqList.filter((r) => {
                const s = (r.status || r.appointment_status || '').toUpperCase();
                return s === 'CHECKED_IN' || s === 'IN_PROGRESS';
            }).length;
            const expectedCount = reqList.filter((r) => {
                const s = (r.status || r.approval_status || '').toUpperCase();
                return s === 'APPROVED' || s === 'CONFIRMED';
            }).length;
            const totalRecordsCount = Math.max(reqList.length, visitorList.length, payload.stats?.todaysVisitors?.value || 0);
            // Merge real live metrics into stats payload
            payload = {
                welcomeMessage: payload.welcomeMessage || 'Welcome back to your Host Dashboard',
                ...payload,
                stats: {
                    todaysVisitors: { value: Math.max(payload.stats?.todaysVisitors?.value || 0, totalRecordsCount) },
                    activeAppointments: { value: Math.max(payload.stats?.activeAppointments?.value || 0, activeOnsiteCount) },
                    pendingApprovals: { value: Math.max(payload.stats?.pendingApprovals?.value || 0, pendingReqsCount) },
                    expectedToday: { value: Math.max(payload.stats?.expectedToday?.value || 0, expectedCount) },
                },
                appointmentsOverview: {
                    upcoming: Math.max(payload.appointmentsOverview?.upcoming || 0, expectedCount),
                    completed: payload.appointmentsOverview?.completed || 0,
                    cancelled: payload.appointmentsOverview?.cancelled || 0,
                    pending: Math.max(payload.appointmentsOverview?.pending || 0, pendingReqsCount),
                    total: Math.max(payload.appointmentsOverview?.total || 0, totalRecordsCount),
                },
            };
            setData(payload);
            setError('');
        }
        catch (err) {
            console.error(err);
            setError('');
        }
        finally {
            if (showSkeleton)
                setLoading(false);
        }
    };
    useEffect(() => {
        fetchStats(true);
        const interval = setInterval(() => fetchStats(false), 10000);
        return () => clearInterval(interval);
    }, []);
    const handleActionClick = (viewKey) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewKey);
        navigate(`?${params.toString()}`);
    };
    if (loading) {
        return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64"/>
            <Skeleton className="h-4 w-96"/>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (<Skeleton key={i} className="h-32"/>))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-72"/>
          <Skeleton className="h-72"/>
        </div>
      </div>);
    }
    const stats = data?.stats || data?.data?.stats || {};
    const totalHosted = stats.totalVisitors?.value ?? stats.todaysVisitors?.value ?? 0;
    const activeCount = stats.activeAppointments?.value ?? 0;
    const pendingCount = stats.pendingApprovals?.value ?? 0;
    const expectedCount = stats.expectedToday?.value ?? 0;
    // Overview Pie Chart Calculations
    const overview = data?.appointmentsOverview || data?.data?.appointmentsOverview || { upcoming: 0, completed: 0, cancelled: 0, pending: 0, total: 0 };
    const totalCount = overview.total ?? 0;
    const pieData = [
        { name: t('status.completed', 'Completed'), value: Number(overview.completed || 0), color: '#10b981' },
        { name: t('visitorDash.tabUpcoming', 'Upcoming'), value: Number(overview.upcoming || 0), color: '#3b82f6' },
        { name: t('status.pending', 'Pending'), value: Number(overview.pending || 0), color: '#f59e0b' },
        { name: t('status.cancelled', 'Cancelled'), value: Number(overview.cancelled || 0), color: '#ef4444' }
    ];
    const trendObj = data?.visitorTrend || data?.data?.visitorTrend || {};
    const trendChartData = Array.isArray(trendObj.data) && trendObj.data.length > 0
        ? trendObj.data
        : DEFAULT_WEEKLY_TREND;
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO BANNER & WELCOME HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200/90 dark:border-slate-800 p-7 md:p-9 shadow-xl dark:shadow-2xl transition-colors">
        {/* TOP CURVED WAVE SVG ACCENT (Matching User Image) */}
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-90 dark:opacity-40">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveEmployee)"></path>
            <defs>
              <linearGradient id="topWaveEmployee" x1="0%" y1="0%" x2="100%" y2="0%">
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
            <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveEmployee)"></path>
            <defs>
              <linearGradient id="bottomWaveEmployee" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00a0e9"/>
                <stop offset="50%" stopColor="#2563eb"/>
                <stop offset="100%" stopColor="#1d4ed8"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 my-2">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard"/>
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                {t('sidebar.staffPortal', 'Employee Portal • Access Console Active')}
              </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              {t('empDash.title', data?.welcomeMessage || 'Employee & Host Portal')}
              <Sparkles className="w-6 h-6 text-amber-500 dark:text-amber-400 animate-pulse"/>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl font-medium leading-relaxed">
              {t('empDash.subtitle', 'Manage host appointments, approve incoming visitor requests, send digital entry invitations, and track visitor logs.')}
            </p>
          </div>
        </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => handleActionClick('employee_create')} className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98]">
              <Plus className="w-4 h-4"/>
              {t('empDash.inviteVisitor', 'Invite Visitor')}
            </button>
            <button onClick={() => fetchStats(true)} className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500/60 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-[1.03] shadow-md dark:shadow-none">
              <RefreshCw className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${loading ? 'animate-spin' : ''}`}/>
              {t('form.refresh', 'Refresh Data')}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 4 TOP KPI SUMMARY CARDS WITH FULL COLOR FILL ON HOVER */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title={t('empDash.hostedToday', 'Hosted Today')} value={totalHosted} subtitle={t('card.summary', 'Total guest records today')} theme="blue" badge={<span className="text-xs font-bold text-emerald-400 flex items-center">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5"/> +12%
            </span>} icon={<Users className="h-5 w-5"/>} onClick={() => handleActionClick('employee_visitors')}/>

        <KpiCard title={t('empDash.guestsOnSite', 'Guests On-Site')} value={activeCount} subtitle={t('dash.liveStatus', 'Active checked-in sessions')} theme="emerald" badge={<span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-full uppercase animate-pulse">
              ● Live Lobby
            </span>} icon={<UserCheck className="h-5 w-5"/>} onClick={() => handleActionClick('employee_visitors')}/>

        <KpiCard title={t('empDash.decisionsRequired', 'Decisions Required')} value={pendingCount} subtitle={t('empDash.pendingApprovals', 'Pending visitor request reviews')} theme="amber" badge={<span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black rounded-full uppercase">
              Action Needed
            </span>} icon={<Clock className="h-5 w-5"/>} onClick={() => handleActionClick('employee_requests')}/>

        <KpiCard title={t('empDash.scheduledArrivals', 'Scheduled Arrivals')} value={expectedCount} subtitle={t('empDash.upcomingVisits', 'Confirmed guest arrivals')} theme="cyan" badge={<span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-black rounded-full uppercase">
              Expected
            </span>} icon={<Shield className="h-5 w-5"/>} onClick={() => handleActionClick('employee_appointments')}/>
      </div>

      {/* ========================================== */}
      {/* ANALYTICS CHARTS ROW                       */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Traffic Trend Chart — Indigo Hover & Solid Left Bar */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="lg:col-span-2 bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between relative overflow-hidden group transition-colors">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#6366f1',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                <TrendingUp className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {t('empDash.trafficTrend', 'My Host Visit Traffic Trend')}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{t('empDash.trafficSubtitle', 'Weekly guest arrival activity and volume breakdown.')}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-lg">
              {t('empDash.trafficTrend', 'This Week')}
            </span>
          </div>

          <div className="h-64 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="colorTrendMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 'bold' }}/>
                <YAxis stroke="#64748b" tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 'bold' }}/>
                <Tooltip contentStyle={{ backgroundColor: '#070b16', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: 12, fontWeight: 'bold' }}/>
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTrendMain)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#ffffff' }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Visitor Overview Doughnut Chart — Emerald Hover & Solid Left Bar */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between relative overflow-hidden group transition-colors">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#10b981',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>
          <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                <Users className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {t('empDash.visitorOverview', 'Visitor Overview')}
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{totalCount} {t('sidebar.visitor', 'Total Records')}</span>
          </div>

          <div className="flex justify-center items-center h-48 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={78} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{totalCount}</h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider block mt-1">{t('sidebar.visitor', 'Visitors')}</span>
            </div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-4 relative z-10">
            {pieData.map((d, i) => (<div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl relative overflow-hidden pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: d.color }}/>
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}/>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{d.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white ml-2">{d.value}</span>
              </div>))}
          </div>
        </motion.div>
      </div>

      {/* ========================================== */}
      {/* FULL WIDTH: MY MEETINGS TODAY              */}
      {/* ========================================== */}
      <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between relative overflow-hidden group transition-colors">
        {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
        <div style={{
            backgroundColor: '#3b82f6',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

        <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-5 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
              <Clock className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">{t('empDash.myMeetingsToday', 'My Meetings Today')}</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{t('empDash.meetingsSubtitle', 'Full daily host agenda and visitor appointment schedule.')}</p>
            </div>
          </div>

          <button onClick={() => handleActionClick('employee_calendar')} className="px-4 py-2 bg-blue-50 dark:bg-blue-600/15 hover:bg-blue-100 dark:hover:bg-blue-600/25 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5">
            <span>{t('empDash.viewCalendar', 'View Full Calendar')}</span>
            <ArrowUpRight className="h-4 w-4"/>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {(data?.todaysSchedule || []).length > 0 ? (data.todaysSchedule.map((s, i) => {
            const st = (s.status || '').toUpperCase();
            const itemStripe = st === 'CHECKED_IN' || st === 'ONSITE' ? '#10b981' : st === 'APPROVED' ? '#3b82f6' : '#f59e0b';
            return (<div key={i} onClick={() => handleActionClick('employee_appointments')} className="p-4 pl-5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 rounded-2xl transition-all duration-300 cursor-pointer space-y-3 shadow-md group/item flex flex-col justify-between relative overflow-hidden" style={{
                    borderLeft: `5px solid ${itemStripe}`,
                }}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20">
                        {s.time}
                      </span>
                      <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${st === 'CHECKED_IN' || st === 'ONSITE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 animate-pulse'
                    : st === 'APPROVED'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'}`}>
                        {tStatus(s.status || st)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover/item:text-blue-600 dark:group-hover/item:text-blue-300 transition-colors">
                      {s.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <div>
                      <span className="text-slate-900 dark:text-slate-200 font-bold block">{s.visitorName}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold block">{s.visitorCompany || 'Guest Visitor'}</span>
                    </div>

                    <div className="flex items-center text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-semibold text-[11px]">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500 mr-1"/>
                      {s.room || 'Lobby Executive Suite'}
                    </div>
                  </div>
                </div>);
        })) : (<div className="col-span-full text-center py-12 text-slate-400 font-bold text-xs">{t('card.noData', 'No meetings scheduled for today.')}</div>)}
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* BOTTOM ROW: QUICK ACTIONS & ANNOUNCEMENTS  */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Host Quick Actions Panel — Purple Theme */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between relative overflow-hidden group transition-colors">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#a855f7',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm shrink-0">
                <CheckSquare className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {t('empDash.quickActions', 'Host Quick Actions')}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 relative z-10">
            <button onClick={() => handleActionClick('employee_requests')} className="flex flex-col justify-between p-4 pl-5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 rounded-2xl transition-all duration-300 group/act text-left shadow-md relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-indigo-500 shadow-[0_0_10px_#6366f1]"/>
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 group-hover/act:bg-indigo-500/25 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover/act:scale-110 transition-transform">
                <Plus className="h-5 w-5"/>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover/act:text-indigo-600 dark:group-hover/act:text-indigo-200 transition-colors block">{t('empDash.inviteGuest', 'Invite Guest')}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover/act:text-slate-600 dark:group-hover/act:text-slate-300 font-medium transition-colors">{t('empDash.myRequests', 'New visitor request')}</span>
              </div>
            </button>

            <button onClick={() => handleActionClick('employee_calendar')} className="flex flex-col justify-between p-4 pl-5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 rounded-2xl transition-all duration-300 group/act text-left shadow-md relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-emerald-500 shadow-[0_0_10px_#10b981]"/>
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 group-hover/act:bg-emerald-500/25 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover/act:scale-110 transition-transform">
                <Calendar className="h-5 w-5"/>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover/act:text-emerald-600 dark:group-hover/act:text-emerald-200 transition-colors block">{t('empDash.myCalendar', 'My Calendar')}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover/act:text-slate-600 dark:group-hover/act:text-slate-300 font-medium transition-colors">{t('form.room', 'Schedule & rooms')}</span>
              </div>
            </button>

            <button onClick={() => handleActionClick('employee_requests')} className="flex flex-col justify-between p-4 pl-5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-2xl transition-all duration-300 group/act text-left shadow-md relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-amber-500 shadow-[0_0_10px_#f59e0b]"/>
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 group-hover/act:bg-amber-500/25 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover/act:scale-110 transition-transform">
                <CheckCircle className="h-5 w-5"/>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover/act:text-amber-600 dark:group-hover/act:text-amber-200 transition-colors block">{t('empDash.approveRequests', 'Approve Requests')}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover/act:text-slate-600 dark:group-hover/act:text-slate-300 font-medium transition-colors">{t('empDash.pendingApprovals', 'Review pending')} ({pendingCount})</span>
              </div>
            </button>

            <button onClick={() => handleActionClick('employee_visitors')} className="flex flex-col justify-between p-4 pl-5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 rounded-2xl transition-all duration-300 group/act text-left shadow-md relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-cyan-500 shadow-[0_0_10px_#06b6d4]"/>
              <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 group-hover/act:bg-cyan-500/25 rounded-xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover/act:scale-110 transition-transform">
                <Users className="h-5 w-5"/>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover/act:text-cyan-600 dark:group-hover/act:text-cyan-200 transition-colors block">{t('empDash.visitorDirectory', 'Visitor Directory')}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover/act:text-slate-600 dark:group-hover/act:text-slate-300 font-medium transition-colors">{t('card.recentVisits', 'View hosted guests')}</span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* System Announcements — Amber Theme */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between relative overflow-hidden group transition-colors">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#f59e0b',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm shrink-0">
                <Megaphone className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {t('empDash.announcements', 'System Announcements')}
                </h3>
              </div>
            </div>
            <button onClick={() => handleActionClick('employee_notifications?tab=announcements')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center space-x-1">
              <span>{t('card.viewDetails', 'View All')}</span>
              <ArrowUpRight className="h-3.5 w-3.5"/>
            </button>
          </div>

          <div className="space-y-3 flex-1 max-h-[320px] overflow-y-auto pr-1 relative z-10">
            {(data?.systemAnnouncements || []).map((a, i) => {
            const itemStripe = a.type === 'Important' ? '#f43f5e' : a.type === 'Update' ? '#10b981' : '#f59e0b';
            return (<div key={i} className="p-3.5 pl-5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all duration-200 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: itemStripe, boxShadow: `0 0 6px ${itemStripe}` }}/>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${a.type === 'Important'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : a.type === 'Update'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'}`}>
                      {a.type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{a.date}</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-normal">{a.title}</p>
                </div>);
        })}
          </div>
        </motion.div>
      </div>
    </div>);
}
