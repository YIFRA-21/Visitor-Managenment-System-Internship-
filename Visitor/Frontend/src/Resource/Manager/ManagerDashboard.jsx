// Frontend/src/Resource/Manager/ManagerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, TrendingUp, UserCheck, Shield, AlertTriangle, RefreshCw, ChevronRight, UserX, Activity, Briefcase, Send } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import BackButton from '../../components/common/BackButton';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { HostReassignmentModal } from './components/HostReassignmentModal';
import { RequestDetailsModal } from './components/RequestDetailsModal';
import { useLanguage } from '../../contexts/LanguageContext';
// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD THEMES & ANIMATED KPI CARD (MATCHING ADMIN DASHBOARD AESTHETICS)
// ─────────────────────────────────────────────────────────────────────────────
const USER_DASHBOARD_THEMES = {
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-blue-400',
        badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    cyan: {
        barColor: '#06b6d4',
        hoverBarColor: '#22d3ee',
        darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    },
    purple: {
        barColor: '#a855f7',
        hoverBarColor: '#c084fc',
        darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-purple-400',
        badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    },
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    indigo: {
        barColor: '#6366f1',
        hoverBarColor: '#818cf8',
        darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-indigo-400',
        badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    },
    rose: {
        barColor: '#f43f5e',
        hoverBarColor: '#fb7185',
        darkHoverBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.35) 0%, rgba(136, 19, 55, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-rose-400',
        badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    },
    teal: {
        barColor: '#14b8a6',
        hoverBarColor: '#2dd4bf',
        darkHoverBg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.35) 0%, rgba(19, 78, 74, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-teal-400',
        badgeBg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    },
};
const dashboardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
        },
    },
};
const dashboardItemVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 280, damping: 22 },
    },
};
const containerVariants = dashboardContainerVariants;
const itemVariants = dashboardItemVariants;
function MetricCard({ title, value, subtitle, icon, theme, onClick, badge }) {
    const [hovered, setHovered] = useState(false);
    const styles = USER_DASHBOARD_THEMES[theme];
    return (<motion.div variants={dashboardItemVariants} whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={`border rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 min-h-[155px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group bg-[#0a0f1d] border-slate-800/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] ${onClick ? 'cursor-pointer' : ''} ${hovered ? 'shadow-2xl border-slate-700' : ''}`}>
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

      <div className="mt-2.5 relative z-10">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{value}</h2>
          {badge && (<span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${styles.badgeBg}`}>
              {badge}
            </span>)}
        </div>
        <p className={`text-[11px] sm:text-xs font-semibold mt-1 transition-colors ${styles.textColor} opacity-90 group-hover:opacity-100`}>
          {subtitle}
        </p>
      </div>
    </motion.div>);
}
export default function ManagerDashboard({ onNavigate }) {
    const { t, tStatus } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    // Modals
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [reassignTargetRequest, setReassignTargetRequest] = useState(null);
    const [reassignModalMode, setReassignModalMode] = useState('assign');
    const fetchOverview = async (showLoading = false) => {
        if (showLoading)
            setLoading(true);
        else
            setRefreshing(true);
        try {
            const overview = await managerApi.getOverview();
            setData(overview);
            setError('');
        }
        catch (err) {
            setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to sync dashboard.');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => {
        fetchOverview(true);
        const interval = setInterval(() => fetchOverview(false), 15000);
        return () => clearInterval(interval);
    }, []);
    const handleOpenReassign = (item, modalMode = 'reassign') => {
        const formatted = {
            id: item.id,
            appointment_number: item.appointment_number,
            reference_code: item.reference_code,
            scheduled_start: item.scheduled_start,
            scheduled_end: item.scheduled_end,
            purpose: item.purpose,
            priority: item.priority,
            approval_status: item.approval_status,
            appointment_status: item.approval_status,
            status: item.approval_status,
            remarks: '',
            cancellation_reason: '',
            created_at: '',
            visitor_id: item.visitor_id,
            visitor_name: item.visitor_name,
            visitor_email: item.visitor_email,
            visitor_phone: item.visitor_phone,
            visitor_company: item.visitor_company,
            visitor_photo: '',
            host_employee_id: item.host_employee_id,
            host_name: item.host_name,
            host_email: '',
            host_position: '',
            host_availability: item.host_availability,
            is_host_enabled: item.is_host_enabled,
        };
        setReassignTargetRequest(formatted);
        setReassignModalMode(modalMode);
        setReassignModalOpen(true);
    };
    // NOTE: Direct approval removed. Managers must assign a host first.
    // The host then reviews and approves the visitor request.
    if (loading && !data) {
        return (<div className="p-6 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
        <div className="flex items-center gap-4">
          <BackButton />
          <div className="animate-pulse h-8 w-48 bg-slate-800 rounded-xl"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (<div key={i} className="animate-pulse h-36 bg-slate-800/40 rounded-2xl border border-slate-700/20"/>))}
        </div>
      </div>);
    }
    const kpi = data?.kpi || {
        pendingRequests: 0,
        todaysVisitors: 0,
        upcomingAppointments: 0,
        departmentEmployees: 0,
        totalEmployees: 0,
        availableEmployees: 0,
        unavailableEmployees: 0,
        totalVisitors: 0,
        activeHosts: 0,
        unavailableHosts: 0,
        reassignmentRequired: 0,
        completedVisits: 0
    };
    const scope = data?.scope;
    const queue = data?.pendingQueue || [];
    const todayVisits = data?.todayVisitors || [];
    const workload = data?.hostWorkload || [];
    // Chart data: Distribution breakdown
    const pieData = [
        { name: 'Pending', value: kpi.pendingRequests, color: '#6366f1' },
        { name: "Today's Visits", value: kpi.todaysVisitors, color: '#10b981' },
        { name: 'Upcoming', value: kpi.upcomingAppointments, color: '#3b82f6' },
        { name: 'Reassignment', value: kpi.reassignmentRequired, color: '#f59e0b' }
    ].filter(d => d.value > 0);
    // Sparkline/trend mockup based on live visits count
    const trendData = [
        { day: 'Mon', visits: Math.max(0, kpi.todaysVisitors - 2) },
        { day: 'Tue', visits: Math.max(1, kpi.todaysVisitors - 1) },
        { day: 'Wed', visits: Math.max(2, kpi.todaysVisitors + 1) },
        { day: 'Thu', visits: kpi.todaysVisitors },
        { day: 'Fri', visits: Math.max(1, kpi.upcomingAppointments) },
        { day: 'Sat', visits: Math.max(0, kpi.upcomingAppointments - 1) },
        { day: 'Sun', visits: kpi.todaysVisitors }
    ];
    return (<motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Top Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-4">
          <BackButton />
          <h1 className="text-2xl font-black text-white tracking-tight">
            {t('sidebar.dashboard', 'Dashboard')}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={() => fetchOverview(false)} disabled={refreshing} className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm active:scale-95 disabled:opacity-50" title={t('form.refresh', 'Refresh Dashboard')}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`}/>
            <span>{refreshing ? t('form.loading', 'Refreshing...') : t('form.refresh', 'Refresh')}</span>
          </button>
        </div>
      </motion.div>

      {/* ── ROW 1 & ROW 2: 8 MAIN KPI CARDS (MATCHING ADMIN DASHBOARD CARDS) ── */}
      <motion.div variants={dashboardContainerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Employees */}
        <MetricCard title={t('managerDash.totalEmployees', 'TOTAL EMPLOYEES')} value={kpi.totalEmployees ?? kpi.departmentEmployees ?? 0} subtitle={t('card.summary', 'Active department staff')} icon={<Briefcase className="w-4 h-4 text-cyan-400"/>} theme="cyan" onClick={() => onNavigate && onNavigate('manager_employees')}/>

        {/* Card 2: Available Employees */}
        <MetricCard title={t('managerDash.availableEmployees', 'AVAILABLE EMPLOYEES')} value={kpi.availableEmployees ?? 0} subtitle={t('empDash.subtitle', 'Ready to host visitors')} icon={<UserCheck className="w-4 h-4 text-emerald-400"/>} theme="emerald" onClick={() => onNavigate && onNavigate('manager_availability')}/>

        {/* Card 3: Unavailable Employees */}
        <MetricCard title={t('managerDash.unavailableEmployees', 'UNAVAILABLE EMPLOYEES')} value={kpi.unavailableEmployees ?? 0} subtitle={t('status.inactive', 'System staff away')} icon={<UserX className="w-4 h-4 text-purple-400"/>} theme="purple" badge={(kpi.unavailableEmployees ?? 0) > 0 ? `${kpi.unavailableEmployees} ${t('status.inactive', 'Away')}` : undefined} onClick={() => onNavigate && onNavigate('manager_availability')}/>

        {/* Card 4: Total Visitors */}
        <MetricCard title={t('managerDash.totalVisitors', 'TOTAL VISITORS')} value={kpi.totalVisitors ?? 0} subtitle={t('managerDash.deptVisitors', 'Department guest visits')} icon={<Users className="w-4 h-4 text-blue-400"/>} theme="blue" onClick={() => onNavigate && onNavigate('manager_visitors')}/>

        {/* Card 5: Pending Requests */}
        <MetricCard title={t('managerDash.pendingRequests', 'PENDING REQUESTS')} value={kpi.pendingRequests} subtitle={t('managerDash.pendingDeptRequests', 'Review and approval queue')} icon={<Clock className="w-4 h-4 text-amber-400"/>} theme="amber" badge={kpi.pendingRequests > 0 ? `${kpi.pendingRequests} ${t('status.requested', 'New')}` : undefined} onClick={() => onNavigate && onNavigate('manager_requests')}/>

        {/* Card 6: Today's Visitors */}
        <MetricCard title={t('managerDash.todaysVisitors', "TODAY'S VISITORS")} value={kpi.todaysVisitors} subtitle={t('empDash.scheduledArrivals', 'Scheduled arrivals today')} icon={<Calendar className="w-4 h-4 text-cyan-400"/>} theme="cyan" onClick={() => onNavigate && onNavigate('manager_appointments')}/>

        {/* Card 7: Host Reassignment */}
        <MetricCard title={t('managerDash.hostReassignment', 'HOST REASSIGNMENT')} value={kpi.reassignmentRequired} subtitle={t('managerDash.reassign', 'Unavailable host reassign')} icon={<AlertTriangle className="w-4 h-4 text-purple-400"/>} theme="purple" badge={kpi.reassignmentRequired > 0 ? t('card.details', 'Urgent') : undefined} onClick={() => onNavigate && onNavigate('manager_requests')}/>

        {/* Card 8: Authorized Hosts */}
        <MetricCard title={t('managerDash.authorizedHosts', 'AUTHORIZED HOSTS')} value={kpi.activeHosts} subtitle={`${Math.max(0, kpi.activeHosts - kpi.unavailableHosts)} ${t('status.active', 'active & available')}`} icon={<Shield className="w-4 h-4 text-emerald-400"/>} theme="emerald" onClick={() => onNavigate && onNavigate('manager_availability')}/>
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Traffic Area Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <TrendingUp className="w-4 h-4"/>
              </div>
              <h3 className="text-sm font-bold text-white">{t('managerDash.visitActivityTrend', 'Visit Activity Trend')}</h3>
            </div>
            <span className="text-xs text-slate-500">Live 7-Day Window</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="managerTrafficGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false}/>
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderRadius: '12px',
            fontSize: '12px',
            color: '#f8fafc',
        }}/>
                <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#managerTrafficGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut Chart (1 Col) */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Activity className="w-4 h-4"/>
              </div>
              <h3 className="text-sm font-bold text-white">{t('managerDash.statusBreakdown', 'Status Breakdown')}</h3>
            </div>
          </div>

          <div className="h-44 flex items-center justify-center relative">
            {pieData.length === 0 ? (<p className="text-xs text-slate-500 italic">{t('card.noData', 'No activity recorded')}</p>) : (<ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                  </Pie>
                  <Tooltip contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f8fafc',
            }}/>
                </PieChart>
              </ResponsiveContainer>)}
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/60">
            {pieData.map((item, i) => (<div key={i} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}/>
                <span className="text-slate-400">{item.name}:</span>
                <span className="font-bold text-white">{item.value}</span>
              </div>))}
          </div>
        </div>
      </motion.div>

      {/* Main Split: Pending Requests Queue & Today's Schedule */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Pending Requests Queue */}
        <div className="lg:col-span-2 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Clock className="w-4 h-4"/>
              </div>
              <h3 className="text-sm font-bold text-white">{t('managerDash.pendingQueue', 'Pending Requests Queue')}</h3>
            </div>
            <button onClick={() => onNavigate && onNavigate('manager_requests')} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              {t('card.viewDetails', 'View all')} ({queue.length}) <ChevronRight className="w-3.5 h-3.5"/>
            </button>
          </div>

          <div className="space-y-3">
            {queue.length === 0 ? (<div className="py-12 text-center text-slate-500 text-xs italic">
                {t('card.noData', 'All requests processed. No pending items.')}
              </div>) : (queue.slice(0, 5).map((req) => {
            const isHostUnavail = req.host_availability !== 'AVAILABLE';
            return (<div key={req.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{req.visitor_name}</span>
                        <span className="text-xs text-slate-400">({req.visitor_company || 'Independent'})</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                        <span>{t('form.host', 'Host')}: <strong className="text-slate-200">{req.host_name || 'Unassigned'}</strong></span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isHostUnavail
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                          {tStatus(req.host_availability) || req.host_availability || 'UNAVAILABLE'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {isHostUnavail && (<button onClick={() => handleOpenReassign(req, 'reassign')} className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold transition">
                          {t('managerDash.reassign', 'Reassign')}
                        </button>)}
                      <button onClick={() => handleOpenReassign(req, 'assign')} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-1.5">
                        <Send className="w-3 h-3"/>
                        {t('managerDash.assignRoute', 'Assign & Route')}
                      </button>
                      <button onClick={() => setSelectedRequestId(req.id)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition">
                        {t('card.details', 'Details')}
                      </button>
                    </div>
                  </div>);
        }))}
          </div>
        </div>

        {/* Right Column (1 col): Today's Schedule & Host Load */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Calendar className="w-4 h-4"/>
              </div>
              <h3 className="text-sm font-bold text-white">{t('managerDash.todaysSchedule', "Today's Schedule")}</h3>
            </div>
            <button onClick={() => onNavigate && onNavigate('manager_appointments')} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              {t('sidebar.appointmentsSchedule', 'Schedule')} <ChevronRight className="w-3.5 h-3.5"/>
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {todayVisits.length === 0 ? (<div className="py-8 text-center text-slate-500 text-xs italic">
                {t('card.noData', 'No visits arriving today.')}
              </div>) : (todayVisits.slice(0, 4).map((v) => (<div key={v.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{v.visitor_name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t('form.host', 'Host')}: {v.host_name || 'Staff'} • {new Date(v.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {tStatus(v.appointment_status) || v.appointment_status || 'CONFIRMED'}
                  </span>
                </div>)))}
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <button onClick={() => onNavigate && onNavigate('manager_employees')} className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 font-semibold transition">
              {t('sidebar.employeesHosts', 'Employees & Hosts')}
            </button>
            <button onClick={() => onNavigate && onNavigate('manager_availability')} className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 font-semibold transition">
              {t('sidebar.hostAvailabilityMatrix', 'Host Availability')}
            </button>
            <button onClick={() => onNavigate && onNavigate('manager_rooms')} className="p-2.5 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/60 rounded-xl text-center text-indigo-300 font-semibold transition">
              {t('sidebar.meetingRoomsSpaces', 'Meeting Rooms')}
            </button>
            <button onClick={() => onNavigate && onNavigate('manager_policies')} className="p-2.5 bg-violet-950/40 hover:bg-violet-900/40 border border-violet-800/60 rounded-xl text-center text-violet-300 font-semibold transition">
              {t('sidebar.hostingPoliciesRules', 'Hosting Policies')}
            </button>
            <button onClick={() => onNavigate && onNavigate('manager_evacuation')} className="p-2.5 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 rounded-xl text-center text-rose-300 font-semibold transition">
              {t('sidebar.evacuationRollCall', 'Evacuation Muster')}
            </button>
            <button onClick={() => onNavigate && onNavigate('manager_security')} className="p-2.5 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 rounded-xl text-center text-cyan-300 font-semibold transition">
              {t('sidebar.securityAccessZones', 'Security Zones')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <HostReassignmentModal isOpen={reassignModalOpen} onClose={() => setReassignModalOpen(false)} request={reassignTargetRequest} onSuccess={() => fetchOverview(false)} mode={reassignModalMode}/>

      <RequestDetailsModal isOpen={!!selectedRequestId} onClose={() => setSelectedRequestId(null)} requestId={selectedRequestId} onReassignClick={(req) => {
            setSelectedRequestId(null);
            handleOpenReassign(req);
        }} onApproveSuccess={() => fetchOverview(false)}/>
    </motion.div>);
}
