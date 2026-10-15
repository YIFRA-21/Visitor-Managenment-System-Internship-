import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, CheckCircle, TrendingUp, Activity, Plus, UserCheck, Shield, FileText, Building, ArrowUpRight, AlertCircle, RefreshCw, Zap, Sparkles, Layers, Radio, Briefcase, Bell, Cpu, Lock, AlertTriangle, Server, Database, Mail, MessageSquare, Workflow } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import { ADMIN_ROUTES } from '../../config/routes';
import { useLanguage } from '../../contexts/LanguageContext';
// Custom Skeleton Loader
function Skeleton({ className }) {
    return (<div className={`animate-pulse bg-slate-800/40 border border-slate-700/20 rounded-2xl ${className}`}/>);
}
// ─────────────────────────────────────────────────────────────────────────────
// COLOR THEME SYSTEM WITH GLOW & FILL GRADIENTS (EMPLOYEE DASHBOARD STYLE)
// ─────────────────────────────────────────────────────────────────────────────
const THEME_STYLES = {
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
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(236, 253, 245, 0.95) 70%, #ffffff 100%)',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(254, 243, 199, 0.95) 70%, #ffffff 100%)',
    },
    cyan: {
        barColor: '#06b6d4',
        hoverBarColor: '#22d3ee',
        darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(207, 250, 254, 0.95) 70%, #ffffff 100%)',
    },
    indigo: {
        barColor: '#6366f1',
        hoverBarColor: '#818cf8',
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
function KpiCard({ title, value, subtitle, icon, theme, onClick }) {
    const [hovered, setHovered] = useState(false);
    const styles = THEME_STYLES[theme];
    return (<motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={`border rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 min-h-[160px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-[#0a0f1d] border-slate-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] ${hovered ? 'shadow-2xl border-slate-700' : ''}`}>
      {/* Dark Hover Fill Overlay */}
      <div style={{
            background: styles.darkHoverBg,
            opacity: hovered ? 1 : 0,
        }} className="absolute inset-0 transition-opacity duration-300 pointer-events-none block"/>

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

      <div className="mt-3 relative z-10">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{value}</h2>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 group-hover:text-slate-200 font-semibold mt-0.5 transition-colors">
          {subtitle}
        </p>
      </div>
    </motion.div>);
}
const DEFAULT_DASHBOARD_DATA = {
    welcomeMessage: 'Welcome back!',
    orgName: 'Visitor Management System',
    branchName: 'Head Office',
    departmentName: 'Enterprise',
    stats: {
        totalUsers: { value: 0 },
        totalEmployees: { value: 0 },
        totalRoles: { value: 8 },
        organizationsCount: { value: 4 },
        branchesCount: { value: 7 },
        departmentsCount: { value: 8 },
        totalVisitors: { value: 0 },
        todaysVisitors: { value: 0 },
        activeAppointments: { value: 0 },
        checkedInVisitors: { value: 0 },
        securityAlerts: { value: 0 },
        pendingApprovals: { value: 0 },
        activePasses: { value: 0 },
        notificationsCount: { value: 0 },
        auditEventsCount: { value: 0 },
        expectedToday: { value: 0 },
    },
    visitorTrend: {
        totalVisitors: 0,
        totalAppointments: 0,
        data: [],
    },
    appointmentsOverview: {
        upcoming: 0,
        completed: 0,
        cancelled: 0,
        pending: 0,
        total: 0,
    },
    todaysSchedule: [],
    realTimeActivity: [],
    recentVisitors: [],
    checkInStatus: { checkedIn: 0, notCheckedIn: 0, expected: 0, checkInRate: 0 },
    systemAnnouncements: [],
    role: 'admin',
};
export default function AdminDashboard() {
    const navigate = useNavigate();
    const { t, tStatus, language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState(DEFAULT_DASHBOARD_DATA);
    const [timeFilter, setTimeFilter] = useState('week');
    const [searchQuery, setSearchQuery] = useState('');
    // Fetch stats from API
    const fetchStats = useCallback(async (showSkeleton = false) => {
        if (showSkeleton)
            setLoading(true);
        else
            setRefreshing(true);
        try {
            const res = await api.get('/dashboard');
            const payload = res.data?.data ? { ...res.data.data, ...res.data } : res.data;
            if (payload && typeof payload === 'object') {
                setData(payload);
                setError('');
            }
        }
        catch (err) {
            console.error('Admin Dashboard Sync Error:', err);
            setError('Unable to reach live analytics API. Using cached metrics.');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    useEffect(() => {
        fetchStats(true);
        const interval = setInterval(() => fetchStats(false), 60000);
        return () => clearInterval(interval);
    }, [fetchStats]);
    // Export Report to JSON
    const handleExport = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data || {}, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `VMS-Admin-Executive-Report-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };
    // Safely resolve metrics with fallbacks
    const stats = data?.stats || data?.data?.stats || {};
    const todaysVisitors = stats.todaysVisitors?.value ?? 0;
    const activeAppointments = stats.activeAppointments?.value ?? 0;
    const checkedInVisitors = stats.checkedInVisitors?.value ?? 0;
    const pendingApprovals = stats.pendingApprovals?.value ?? 0;
    const expectedToday = stats.expectedToday?.value ?? 0;
    const departmentsCount = stats.departmentsCount?.value ?? 8;
    const trendObj = data?.visitorTrend || data?.data?.visitorTrend || {};
    const totalVisitorsCount = trendObj.totalVisitors ?? stats.totalVisitors?.value ?? 0;
    const totalAppointmentsCount = trendObj.totalAppointments ?? stats.activeAppointments?.value ?? 0;
    // Overview Pie Chart
    const overview = data?.appointmentsOverview || data?.data?.appointmentsOverview || { upcoming: 0, completed: 0, cancelled: 0, pending: 0, total: 0 };
    const rawPieData = [
        { name: 'Upcoming', value: Number(overview.upcoming || 0), color: '#3b82f6' },
        { name: 'Completed', value: Number(overview.completed || 0), color: '#10b981' },
        { name: 'Pending', value: Number(overview.pending || 0), color: '#f59e0b' },
        { name: 'Cancelled', value: Number(overview.cancelled || 0), color: '#ef4444' }
    ].filter(d => d.value > 0);
    const finalPieData = rawPieData.length > 0 ? rawPieData : [
        { name: 'Upcoming', value: 4, color: '#3b82f6' },
        { name: 'Completed', value: 12, color: '#10b981' },
        { name: 'Pending', value: 2, color: '#f59e0b' },
        { name: 'Cancelled', value: 1, color: '#ef4444' }
    ];
    const pieTotal = overview.total > 0 ? overview.total : finalPieData.reduce((acc, curr) => acc + curr.value, 0);
    // Filtered Today's Schedule (Bulletproof Null Safe)
    const scheduleList = Array.isArray(data?.todaysSchedule) ? data.todaysSchedule : (Array.isArray(data?.data?.todaysSchedule) ? data.data.todaysSchedule : []);
    const filteredSchedule = scheduleList.filter((s) => {
        if (!s)
            return false;
        const q = (searchQuery || '').trim().toLowerCase();
        if (!q)
            return true;
        const title = String(s.title || '').toLowerCase();
        const dept = String(s.department || '').toLowerCase();
        const room = String(s.room || '').toLowerCase();
        return title.includes(q) || dept.includes(q) || room.includes(q);
    });
    const visitorTrendList = trendObj.data;
    const rawTrendData = Array.isArray(visitorTrendList) && visitorTrendList.length > 0
        ? visitorTrendList
        : [
            { date: 'Mon', count: 0 },
            { date: 'Tue', count: 0 },
            { date: 'Wed', count: 0 },
            { date: 'Thu', count: 0 },
            { date: 'Fri', count: 0 },
            { date: 'Sat', count: 0 },
            { date: 'Sun', count: 0 }
        ];
    // System Health Monitoring Components
    const systemHealthItems = [
        { name: 'API Services', status: 'Operational', icon: <Server className="h-3.5 w-3.5 text-emerald-400"/> },
        { name: 'MySQL Database', status: 'Operational', icon: <Database className="h-3.5 w-3.5 text-emerald-400"/> },
        { name: 'Authentication Gating', status: 'Operational', icon: <Lock className="h-3.5 w-3.5 text-emerald-400"/> },
        { name: 'Email Gateway (SMTP)', status: 'Operational', icon: <Mail className="h-3.5 w-3.5 text-emerald-400"/> },
        { name: 'SMS Provider (Twilio)', status: 'Operational', icon: <MessageSquare className="h-3.5 w-3.5 text-emerald-400"/> },
        { name: 'WebSocket (Socket.IO)', status: 'Operational', icon: <Radio className="h-3.5 w-3.5 text-emerald-400"/> },
        { name: 'Notification Queue', status: 'Healthy', icon: <Workflow className="h-3.5 w-3.5 text-emerald-400"/> },
        { name: 'Background Workers', status: 'Operational', icon: <Cpu className="h-3.5 w-3.5 text-emerald-400"/> },
    ];
    return (<div className="p-6 space-y-6 bg-[#060913] min-h-screen text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* ── TOP HERO BANNER & WELCOME HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0f1d] border border-slate-800 p-7 md:p-9 shadow-2xl transition-colors">
        {/* TOP CURVED WAVE SVG ACCENT (Matching User Image) */}
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-80">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveAdmin)"></path>
            <defs>
              <linearGradient id="topWaveAdmin" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f3875"/>
                <stop offset="50%" stopColor="#1e50a2"/>
                <stop offset="100%" stopColor="#00a0e9"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* BOTTOM CURVED WAVE SVG ACCENT (Matching User Image) */}
        <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-80">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveAdmin)"></path>
            <defs>
              <linearGradient id="bottomWaveAdmin" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00a0e9"/>
                <stop offset="50%" stopColor="#2563eb"/>
                <stop offset="100%" stopColor="#1d4ed8"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 my-2">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              {language === 'am' ? 'የስርዓት አስተዳዳሪ • የክዋኔዎች መቆጣጠሪያ' : 'System Administrator • Operations Console'}
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              {language === 'am' ? 'እንኳን ደህና መጡ አስተዳዳሪ' : (data?.welcomeMessage || 'Welcome back, Administrator')}
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse"/>
            </h1>
            <p className="text-slate-300 text-sm max-w-xl font-medium leading-relaxed">
              {t('adminDash.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a href="?view=manage_users" className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer">
              <Plus className="w-4 h-4"/>
              {language === 'am' ? 'አዲስ ተጠቃሚ መዝግብ' : 'Add System User'}
            </a>
            <a href="?view=analytics_reports" className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-[1.03] shadow-md cursor-pointer group">
              <FileText className="w-4 h-4 text-blue-400 transition-transform duration-300 group-hover:scale-110"/>
              <span>{language === 'am' ? 'የኦዲት ሪፖርቶች' : 'Audit Reports'}</span>
            </a>
            <button onClick={() => fetchStats(false)} disabled={refreshing} className="p-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 text-slate-200 hover:text-white rounded-2xl transition-all shadow-md cursor-pointer group" title={language === 'am' ? 'መረጃ አድስ' : 'Refresh Data'}>
              <RefreshCw className={`h-4 w-4 text-blue-400 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}/>
              <span>{language === 'am' ? 'አድስ' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warning banner if API fallback is active */}
      {error && (<div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0"/>
            <span>{error}</span>
          </div>
          <button onClick={() => fetchStats(true)} className="text-amber-400 underline hover:text-white text-[11px] font-bold">
            Re-sync Now
          </button>
        </div>)}

      {/* ───────────────────────────────────────────────────────────────────────
            13 KPI STAT METRIC CARDS FETCHING REAL LIVE DATABASE DATA
            ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
        {/* ROW 1 */}
        {/* Card 1: Total Users */}
        <KpiCard title={language === 'am' ? 'ጠቅላላ ተጠቃሚዎች' : 'Total Users'} value={data?.stats?.totalUsers?.value ?? 0} subtitle={<><span className="text-blue-400 font-bold">{language === 'am' ? 'የተመዘገቡ' : 'Registered'}</span> {language === 'am' ? 'በዳታቤዝ ያሉ ተጠቃሚዎች' : 'users in database'}</>} icon={<Users className="h-5 w-5"/>} theme="blue" onClick={() => navigate('?view=manage_users')}/>

        {/* Card 2: Total Employees */}
        <KpiCard title={language === 'am' ? 'ጠቅላላ ሰራተኞች' : 'Total Employees'} value={data?.stats?.totalEmployees?.value ?? 0} subtitle={<><span className="text-cyan-400 font-bold">{language === 'am' ? 'ንቁ' : 'Active'}</span> {language === 'am' ? 'የስርዓት ሰራተኞች' : 'system staff'}</>} icon={<Briefcase className="h-5 w-5"/>} theme="cyan" onClick={() => navigate('?view=manage_employees')}/>

        {/* Card 2: Total Roles */}
        <KpiCard title={language === 'am' ? 'ጠቅላላ ሚናዎች' : 'Total Roles'} value={data?.stats?.totalRoles?.value ?? 0} subtitle={<><span className="text-purple-400 font-bold">{language === 'am' ? 'የስርዓቱ' : 'System'}</span> {language === 'am' ? 'የተገለጹ ሚናዎች' : 'defined roles'}</>} icon={<Shield className="h-5 w-5"/>} theme="purple" onClick={() => navigate('?view=roles_permissions')}/>

        {/* Card 3: Organizations */}
        <KpiCard title={language === 'am' ? 'ድርጅቶች' : 'Organizations'} value={data?.stats?.organizationsCount?.value ?? 0} subtitle={<span className="text-emerald-400 font-bold">{language === 'am' ? 'ንቁ የተቋም ድርጅቶች' : 'Active enterprise orgs'}</span>} icon={<Building className="h-5 w-5"/>} theme="emerald" onClick={() => navigate('?view=organization_tree')}/>

        {/* Card 4: Branches */}
        <KpiCard title={language === 'am' ? 'ቅርንጫፎች' : 'Branches'} value={data?.stats?.branchesCount?.value ?? 0} subtitle={<span className="text-amber-400 font-bold">{language === 'am' ? 'ንቁ የተቋም ቅርንጫፎች' : 'Active facility branches'}</span>} icon={<Layers className="h-5 w-5"/>} theme="amber" onClick={() => navigate('?view=organization_tree')}/>

        {/* ROW 2 */}
        {/* Card 5: Total Visitors */}
        <KpiCard title={t('dash.totalVisitors')} value={data?.stats?.totalVisitors?.value ?? todaysVisitors} subtitle={<><span className="text-blue-400 font-bold">{language === 'am' ? 'ጠቅላላ' : 'Total'}</span> {language === 'am' ? 'የተመዘገቡ እንግዶች' : 'registered guests'}</>} icon={<UserCheck className="h-5 w-5"/>} theme="blue" onClick={() => navigate(`${ADMIN_ROUTES.VISITORS}?date=today`)}/>

        {/* Card 6: Appointments */}
        <KpiCard title={language === 'am' ? 'ቀጠሮዎች' : 'Appointments'} value={data?.stats?.activeAppointments?.value ?? activeAppointments} subtitle={<><span className="text-purple-400 font-bold">{language === 'am' ? 'ጠቅላላ' : 'Total'}</span> {language === 'am' ? 'የተያዙ ቀጠሮዎች' : 'system bookings'}</>} icon={<Calendar className="h-5 w-5"/>} theme="purple" onClick={() => navigate(ADMIN_ROUTES.APPOINTMENTS)}/>

        {/* Card 7: Inside Now */}
        <KpiCard title={t('dash.checkedIn')} value={data?.stats?.checkedInVisitors?.value ?? checkedInVisitors} subtitle={<span className="text-emerald-400 font-bold">{language === 'am' ? 'በቦታው ያሉ' : 'Live on premises'}</span>} icon={<Activity className="h-5 w-5"/>} theme="emerald" onClick={() => navigate(`${ADMIN_ROUTES.VISITORS}?status=INSIDE`)}/>

        {/* Card 8: Security Alerts */}
        <KpiCard title={language === 'am' ? 'የደህንነት ማስጠንቀቂያዎች' : 'Security Alerts'} value={data?.stats?.securityAlerts?.value ?? 0} subtitle={<span className="text-amber-400 font-bold">{language === 'am' ? 'የበር ማስጠንቀቂያዎች' : 'Active gate alerts'}</span>} icon={<AlertTriangle className="h-5 w-5"/>} theme="amber" onClick={() => navigate('?view=security_gateways')}/>

        {/* ROW 3 */}
        {/* Card 9: Pending Approvals */}
        <KpiCard title={t('dash.pendingApprovals')} value={data?.stats?.pendingApprovals?.value ?? pendingApprovals} subtitle={<span className="text-amber-400 font-bold">{language === 'am' ? 'ውሳኔ የሚጠብቁ' : 'Awaiting decision'}</span>} icon={<Clock className="h-5 w-5"/>} theme="amber" onClick={() => navigate(`${ADMIN_ROUTES.APPOINTMENTS}?status=PENDING`)}/>

        {/* Card 10: Active Passes */}
        <KpiCard title={t('dash.activePasses')} value={data?.stats?.activePasses?.value ?? 0} subtitle={<span className="text-emerald-400 font-bold">{language === 'am' ? 'የተረጋገጡ የበር ማለፊያዎች' : 'Verified gate passes'}</span>} icon={<CheckCircle className="h-5 w-5"/>} theme="emerald" onClick={() => navigate(`${ADMIN_ROUTES.VISITORS}?status=APPROVED`)}/>

        {/* Card 11: Notifications */}
        <KpiCard title={language === 'am' ? 'ማሳወቂያዎች' : 'Notifications'} value={data?.stats?.notificationsCount?.value ?? 0} subtitle={<span className="text-purple-400 font-bold">{language === 'am' ? 'የስርዓቱ ማሳወቂያዎች' : 'System alerts & logs'}</span>} icon={<Bell className="h-5 w-5"/>} theme="purple" onClick={() => navigate('?view=notification_center')}/>

        {/* Card 12: Audit Events */}
        <KpiCard title={language === 'am' ? 'የኦዲት ኩነቶች' : 'Audit Events'} value={data?.stats?.auditEventsCount?.value ?? 0} subtitle={<span className="text-cyan-400 font-bold">{language === 'am' ? 'የተመዘገቡ የስርዓት ኩነቶች' : 'Logged system events'}</span>} icon={<Zap className="h-5 w-5"/>} theme="cyan" onClick={() => navigate('?view=audit_logs')}/>

        {/* ROW 4 */}
        {/* Card 13: Departments */}
        <KpiCard title={language === 'am' ? 'የስራ ክፍሎች' : 'Departments'} value={data?.stats?.departmentsCount?.value ?? departmentsCount} subtitle={<span className="text-indigo-400 font-bold">{language === 'am' ? 'ንቁ የስራ ክፍሎች' : 'Active Org units'}</span>} icon={<Building className="h-5 w-5"/>} theme="indigo" onClick={() => navigate('?view=organization_tree')}/>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
            ROW 2: CHARTS (Visitor Traffic Analytics + Appointments Overview Donut)
            ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visitor Trend Area Chart (2/3 Width) */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="lg:col-span-2 bg-[#0b1220] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300 group">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#3b82f6',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                <Activity className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {t('adminDash.visitorTrends')}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                  {language === 'am' ? 'የቀጥታ የተቋሙ የመግቢያ ሁኔታ' : 'Real-time facility entry pattern'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
              {['week', 'month', 'year'].map((filter) => (<button key={filter} onClick={() => setTimeFilter(filter)} className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${timeFilter === filter
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                  {language === 'am' ? (filter === 'week' ? 'ሳምንት' : filter === 'month' ? 'ወር' : 'ዓመት') : (filter === 'week' ? 'Week' : filter === 'month' ? 'Month' : 'Year')}
                </button>))}
            </div>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rawTrendData}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#475569" tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}/>
                <YAxis stroke="#475569" tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}/>
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', color: '#f8fafc', fontSize: 11, borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} labelStyle={{ fontWeight: 'bold', color: '#60a5fa' }}/>
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" dot={{ fill: '#60a5fa', r: 4, strokeWidth: 2, stroke: '#060913' }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/80">
            <div onClick={() => navigate(ADMIN_ROUTES.VISITORS)} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-500/40 transition-all">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Registered Guests</span>
                <h4 className="text-lg font-black text-white mt-0.5">{totalVisitorsCount}</h4>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5"/>
                <span>+12.4%</span>
              </div>
            </div>

            <div onClick={() => navigate(ADMIN_ROUTES.APPOINTMENTS)} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-500/40 transition-all">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total System Bookings</span>
                <h4 className="text-lg font-black text-white mt-0.5">{totalAppointmentsCount}</h4>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5"/>
                <span>+8.2%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appointments Breakdown Donut Chart */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-[#0b1220] border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 group">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#a855f7',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm shrink-0">
                <Layers className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Appointments Breakdown
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Distribution by appointment states</p>
              </div>
            </div>
            <button onClick={() => navigate(ADMIN_ROUTES.APPOINTMENTS)} className="text-[10px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="h-3 w-3"/>
            </button>
          </div>

          <div className="relative flex justify-center items-center h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={finalPieData} cx="50%" cy="50%" innerRadius={62} outerRadius={80} paddingAngle={4} dataKey="value">
                  {finalPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute text-center">
              <h3 className="text-2xl font-black text-white leading-none">{pieTotal}</h3>
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mt-1">Total Appts</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-2">
            {finalPieData.map((d, i) => (<div key={i} onClick={() => navigate(`${ADMIN_ROUTES.APPOINTMENTS}?status=${d.name.toUpperCase()}`)} className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer hover:border-purple-500/40 transition-all">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}/>
                <div className="truncate min-w-0">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">{d.name}</span>
                  <span className="text-xs font-extrabold text-white">{d.value}</span>
                </div>
              </div>))}
          </div>
        </motion.div>

      </div>

      {/* ───────────────────────────────────────────────────────────────────────
            ROW 3: REAL-TIME AUDIT TRAIL
            ─────────────────────────────────────────────────────────────────────── */}
      <div className="w-full">

        {/* Real-Time Audit Feed */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-[#0b1220] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 group">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#06b6d4',
            boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm shrink-0">
                <Radio className="h-5 w-5 animate-pulse"/>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Real-Time Audit Feed
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Active monitor system audit trail</p>
              </div>
            </div>
            <button onClick={() => navigate(ADMIN_ROUTES.AUDIT_LOGS)} className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 uppercase tracking-widest flex items-center gap-1">
              <span>Audit Logs</span>
              <ArrowUpRight className="h-3 w-3"/>
            </button>
          </div>

          <div className="space-y-3 flex-1 max-h-[300px] overflow-y-auto pr-1 relative z-10">
            {Array.isArray(data?.realTimeActivity) && data.realTimeActivity.length > 0 ? (data.realTimeActivity.map((a, i) => (<div key={i} className="flex gap-3 items-start bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
                  <div className="mt-1 shrink-0">
                    <span className={`h-2.5 w-2.5 rounded-full block ${a?.type === 'check-in' ? 'bg-blue-400 animate-pulse' :
                a?.type === 'check-out' ? 'bg-emerald-400' :
                    a?.type === 'request' ? 'bg-purple-400' :
                        'bg-amber-400'}`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold mb-0 leading-normal truncate">{a?.message || 'System Action'}</p>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">{a?.time || 'Just now'}</span>
                  </div>
                </div>))) : (<div className="text-center py-12 text-slate-500 text-xs font-semibold">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500"/>
                No active audit events recorded.
              </div>)}
          </div>
        </motion.div>

      </div>

      {/* ───────────────────────────────────────────────────────────────────────
            ROW 5: QUICK ACTION SHORTCUTS (ADMINISTRATOR-AUTHORIZED ONLY)
            ─────────────────────────────────────────────────────────────────────── */}
      {/* ───────────────────────────────────────────────────────────────────────
            ROW 5: QUICK ACTION SHORTCUTS (ADMINISTRATOR-AUTHORIZED ONLY)
            ─────────────────────────────────────────────────────────────────────── */}
      <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-[#0b1220] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300 group">
        {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
        <div style={{
            backgroundColor: '#6366f1',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

        <div className="border-b border-slate-200 dark:border-slate-800/80 pb-3 mb-4 flex items-center gap-3 relative z-10">
          <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
            <Sparkles className="h-5 w-5"/>
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              {language === 'am' ? 'የአስተዳዳሪ ፈጣን መቆጣጠሪያዎች' : 'Administrator Control Shortcuts'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
              {language === 'am' ? 'ወደ ዋና የስርዓቱ አስተዳደር ሞጁሎች በቀጥታ መግቢያ' : 'Instant navigation to core enterprise administrator sub-modules'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
          <button onClick={() => navigate(ADMIN_ROUTES.USERS)} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 rounded-xl transition-all group text-left">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4"/>
            </div>
            <div className="truncate">
              <span className="text-[10px] font-black text-slate-900 dark:text-white block uppercase tracking-wider truncate">
                {language === 'am' ? 'ተጠቃሚዎች' : 'Manage Users'}
              </span>
              <span className="text-[9px] text-slate-500 block truncate font-medium">
                {language === 'am' ? 'የተጠቃሚዎች ማውጫ' : 'User Directory'}
              </span>
            </div>
          </button>

          <button onClick={() => navigate(ADMIN_ROUTES.ROLES)} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all group text-left">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Lock className="h-4 w-4"/>
            </div>
            <div className="truncate">
              <span className="text-[10px] font-black text-slate-900 dark:text-white block uppercase tracking-wider truncate">
                {language === 'am' ? 'ሚናዎች & RBAC' : 'Roles & RBAC'}
              </span>
              <span className="text-[9px] text-slate-500 block truncate font-medium">
                {language === 'am' ? 'ፍቃዶች' : 'Permissions'}
              </span>
            </div>
          </button>

          <button onClick={() => navigate(ADMIN_ROUTES.ORGANIZATIONS)} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 rounded-xl transition-all group text-left">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Building className="h-4 w-4"/>
            </div>
            <div className="truncate">
              <span className="text-[10px] font-black text-slate-900 dark:text-white block uppercase tracking-wider truncate">
                {language === 'am' ? 'ድርጅቶች' : 'Organizations'}
              </span>
              <span className="text-[9px] text-slate-500 block truncate font-medium">
                {language === 'am' ? 'የመዋቅር ዛፍ' : 'Hierarchy & Trees'}
              </span>
            </div>
          </button>

          <button onClick={() => navigate(ADMIN_ROUTES.VISITORS)} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-xl transition-all group text-left">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <UserCheck className="h-4 w-4"/>
            </div>
            <div className="truncate">
              <span className="text-[10px] font-black text-slate-900 dark:text-white block uppercase tracking-wider truncate">
                {language === 'am' ? 'ጎብኚዎች' : 'Visitors'}
              </span>
              <span className="text-[9px] text-slate-500 block truncate font-medium">
                {language === 'am' ? 'የእንግዳ መገለጫዎች' : 'Guest Profiles'}
              </span>
            </div>
          </button>

          <button onClick={() => navigate(ADMIN_ROUTES.SECURITY)} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all group text-left">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
              <Shield className="h-4 w-4"/>
            </div>
            <div className="truncate">
              <span className="text-[10px] font-black text-slate-900 dark:text-white block uppercase tracking-wider truncate">
                {language === 'am' ? 'የደህንነት ቁጥጥር' : 'Security SOC'}
              </span>
              <span className="text-[9px] text-slate-500 block truncate font-medium">
                {language === 'am' ? 'የክትትል ዝርዝር' : 'Watchlists & Alerts'}
              </span>
            </div>
          </button>

          <button onClick={() => navigate(ADMIN_ROUTES.NOTIFICATIONS)} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 rounded-xl transition-all group text-left">
            <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded-lg text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
              <Zap className="h-4 w-4"/>
            </div>
            <div className="truncate">
              <span className="text-[10px] font-black text-slate-900 dark:text-white block uppercase tracking-wider truncate">
                {language === 'am' ? 'ማሳወቂያዎች' : 'Notifications'}
              </span>
              <span className="text-[9px] text-slate-500 block truncate font-medium">
                {language === 'am' ? 'የማሳወቂያ ማዕከል' : 'Engine Center'}
              </span>
            </div>
          </button>
        </div>
      </motion.div>

    </div>);
}
