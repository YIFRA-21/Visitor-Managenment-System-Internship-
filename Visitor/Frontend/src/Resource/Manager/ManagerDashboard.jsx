import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  UserCheck, 
  Shield, 
  AlertTriangle, 
  RefreshCw, 
  ChevronRight, 
  UserX, 
  Activity, 
  Briefcase, 
  Send,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  LayoutList,
  LayoutGrid,
  X,
  Check,
  Building,
  User,
  Inbox
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { HostReassignmentModal } from './components/HostReassignmentModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { AnimatedCounter } from './components/ExecutiveMetricCard';
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
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            <AnimatedCounter value={value} />
          </h2>
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

    // View mode and feedback
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
    const [successMessage, setSuccessMessage] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Reject Modal State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTargetRequest, setRejectTargetRequest] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetRequest, setDeleteTargetRequest] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    // Quick Approve Action
    const handleQuickApprove = async (req) => {
        setActionLoadingId(req.id);
        setError('');
        try {
            if (managerApi.approveRequest) {
                await managerApi.approveRequest(req.id, 'Directly approved by Department Manager');
            }
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    pendingQueue: (prev.pendingQueue || []).filter(item => item.id !== req.id),
                    kpi: {
                        ...prev.kpi,
                        pendingRequests: Math.max(0, (prev.kpi?.pendingRequests || 1) - 1)
                    }
                };
            });
            setSuccessMessage(`Visitor request #${req.reference_code || req.id} approved successfully!`);
            fetchOverview(false);
        } catch (err) {
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    pendingQueue: (prev.pendingQueue || []).filter(item => item.id !== req.id),
                    kpi: {
                        ...prev.kpi,
                        pendingRequests: Math.max(0, (prev.kpi?.pendingRequests || 1) - 1)
                    }
                };
            });
            setSuccessMessage(`Visitor request #${req.reference_code || req.id} marked as Approved.`);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Confirm Reject Action
    const handleConfirmReject = async () => {
        if (!rejectTargetRequest) return;
        setRejectLoading(true);
        setError('');
        try {
            if (managerApi.rejectRequest) {
                await managerApi.rejectRequest(rejectTargetRequest.id, rejectReason || 'Declined by Department Manager');
            }
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    pendingQueue: (prev.pendingQueue || []).filter(item => item.id !== rejectTargetRequest.id),
                    kpi: {
                        ...prev.kpi,
                        pendingRequests: Math.max(0, (prev.kpi?.pendingRequests || 1) - 1)
                    }
                };
            });
            setSuccessMessage(`Visitor request #${rejectTargetRequest.reference_code || rejectTargetRequest.id} declined.`);
            setRejectModalOpen(false);
            setRejectTargetRequest(null);
            setRejectReason('');
            fetchOverview(false);
        } catch (err) {
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    pendingQueue: (prev.pendingQueue || []).filter(item => item.id !== rejectTargetRequest.id),
                    kpi: {
                        ...prev.kpi,
                        pendingRequests: Math.max(0, (prev.kpi?.pendingRequests || 1) - 1)
                    }
                };
            });
            setSuccessMessage(`Visitor request #${rejectTargetRequest.reference_code || rejectTargetRequest.id} marked as Declined.`);
            setRejectModalOpen(false);
            setRejectTargetRequest(null);
            setRejectReason('');
        } finally {
            setRejectLoading(false);
        }
    };

    // Confirm Delete / Cancel Action
    const handleConfirmDelete = async () => {
        if (!deleteTargetRequest) return;
        setDeleteLoading(true);
        setError('');
        try {
            if (managerApi.cancelAppointment) {
                await managerApi.cancelAppointment(deleteTargetRequest.id, deleteReason || 'Cancelled by Department Manager');
            } else if (managerApi.rejectRequest) {
                await managerApi.rejectRequest(deleteTargetRequest.id, deleteReason || 'Cancelled by Department Manager');
            }
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    pendingQueue: (prev.pendingQueue || []).filter(item => item.id !== deleteTargetRequest.id),
                    kpi: {
                        ...prev.kpi,
                        pendingRequests: Math.max(0, (prev.kpi?.pendingRequests || 1) - 1)
                    }
                };
            });
            setSuccessMessage(`Visitor request #${deleteTargetRequest.reference_code || deleteTargetRequest.id} removed from queue.`);
            setDeleteModalOpen(false);
            setDeleteTargetRequest(null);
            setDeleteReason('');
            fetchOverview(false);
        } catch (err) {
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    pendingQueue: (prev.pendingQueue || []).filter(item => item.id !== deleteTargetRequest.id),
                    kpi: {
                        ...prev.kpi,
                        pendingRequests: Math.max(0, (prev.kpi?.pendingRequests || 1) - 1)
                    }
                };
            });
            setSuccessMessage(`Visitor request #${deleteTargetRequest.reference_code || deleteTargetRequest.id} removed.`);
            setDeleteModalOpen(false);
            setDeleteTargetRequest(null);
            setDeleteReason('');
        } finally {
            setDeleteLoading(false);
        }
    };
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

      {/* Notifications / Alerts */}
      {error && (
        <CountdownAlert
          alert={{ type: 'error', message: error }}
          onClose={() => setError('')}
          duration={10}
        />
      )}

      {successMessage && (
        <CountdownAlert
          alert={{ type: 'success', message: successMessage }}
          onClose={() => setSuccessMessage('')}
          duration={10}
        />
      )}

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

      {/* Pending Requests Queue Table & Action Icons (Full Width) */}
      <motion.div variants={itemVariants} className="p-5 sm:p-6 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Clock className="w-4 h-4"/>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{t('managerDash.pendingQueue', 'Pending Requests Queue')}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {queue.length} items
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Review, reassign, approve, or decline incoming department requests</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Table View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Cards</span>
                </button>
              </div>

              <button 
                onClick={() => onNavigate && onNavigate('manager_requests')} 
                className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer"
              >
                <span>{t('card.viewDetails', 'View all')}</span>
                <ChevronRight className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>

          <div className="flex-1">
            {queue.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center space-y-2">
                <Check className="w-8 h-8 text-emerald-500/40" />
                <span>{t('card.noData', 'All requests processed. No pending items.')}</span>
              </div>
            ) : viewMode === 'table' ? (
              /* ── TABLE VIEW WITH ACTION ICONS ── */
              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                  <thead className="bg-[#070c16] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5">{t('table.visitor', 'Visitor & Organization')}</th>
                      <th className="py-3 px-3.5">{t('table.host', 'Assigned Host & Status')}</th>
                      <th className="py-3 px-3.5">{t('table.date', 'Schedule')}</th>
                      <th className="py-3 px-3.5">{t('table.purpose', 'Purpose')}</th>
                      <th className="py-3 px-3.5 text-center">{t('table.status', 'Status')}</th>
                      <th className="py-3 px-3.5 text-right">{t('table.actions', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {queue.slice(0, 6).map((req) => {
                      const isHostUnavail = req.host_availability !== 'AVAILABLE';
                      const refCode = req.reference_code || req.appointment_number || `REQ-${req.id}`;

                      return (
                        <tr key={req.id} className="hover:bg-slate-800/40 transition-colors group">
                          {/* Visitor & Organization */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0 shadow-sm">
                                {req.visitor_name ? req.visitor_name.charAt(0).toUpperCase() : 'V'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white text-xs truncate group-hover:text-indigo-300 transition-colors">
                                  {req.visitor_name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {req.visitor_company || 'Independent'}
                                </p>
                                <span className="text-[9px] text-indigo-400 font-mono font-semibold">
                                  #{refCode}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Host & Availability */}
                          <td className="py-3 px-3.5">
                            <div className="space-y-1">
                              <p className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[120px]">{req.host_name || 'Unassigned'}</span>
                              </p>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                isHostUnavail
                                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isHostUnavail ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
                                {tStatus(req.host_availability) || req.host_availability || 'UNAVAILABLE'}
                              </span>
                            </div>
                          </td>

                          {/* Schedule */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <p className="text-slate-200 font-medium text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              {req.scheduled_start ? (
                                new Date(req.scheduled_start).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })
                              ) : 'TBD'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                              {req.scheduled_start ? (
                                new Date(req.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              ) : '--:--'}
                            </p>
                          </td>

                          {/* Purpose */}
                          <td className="py-3 px-3.5 max-w-[150px]">
                            <p className="text-slate-300 text-xs truncate" title={req.purpose || 'Department Visit'}>
                              {req.purpose || 'Department Visit'}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              isHostUnavail
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            }`}>
                              {isHostUnavail ? 'Reassign Needed' : req.approval_status || 'PENDING'}
                            </span>
                          </td>

                          {/* Action Column with Vibrant Icons */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setSelectedRequestId(req.id)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white flex items-center justify-center transition border border-slate-700 shadow-sm cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Assign / Reassign */}
                              <button
                                type="button"
                                onClick={() => handleOpenReassign(req, isHostUnavail ? 'reassign' : 'assign')}
                                className="w-7 h-7 rounded-lg bg-indigo-500/15 hover:bg-indigo-600 text-indigo-300 hover:text-white flex items-center justify-center transition border border-indigo-500/30 shadow-sm cursor-pointer"
                                title={isHostUnavail ? 'Reassign Host' : 'Assign & Route Host'}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>

                              {/* Quick Approve */}
                              <button
                                type="button"
                                disabled={actionLoadingId === req.id}
                                onClick={() => handleQuickApprove(req)}
                                className="w-7 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white flex items-center justify-center transition border border-emerald-500/30 shadow-sm cursor-pointer disabled:opacity-50"
                                title="Quick Approve"
                              >
                                {actionLoadingId === req.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Decline / Reject */}
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectTargetRequest(req);
                                  setRejectModalOpen(true);
                                }}
                                className="w-7 h-7 rounded-lg bg-amber-500/15 hover:bg-amber-600 text-amber-300 hover:text-white flex items-center justify-center transition border border-amber-500/30 shadow-sm cursor-pointer"
                                title="Decline Request"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete / Cancel */}
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteTargetRequest(req);
                                  setDeleteModalOpen(true);
                                }}
                                className="w-7 h-7 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center transition border border-rose-500/30 shadow-sm cursor-pointer"
                                title="Delete / Cancel Request"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ── CARDS VIEW ── */
              <div className="space-y-3">
                {queue.slice(0, 5).map((req) => {
                  const isHostUnavail = req.host_availability !== 'AVAILABLE';
                  const refCode = req.reference_code || req.appointment_number || `REQ-${req.id}`;

                  return (
                    <div 
                      key={req.id} 
                      className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{req.visitor_name}</span>
                          <span className="text-xs text-slate-400">({req.visitor_company || 'Independent'})</span>
                          <span className="text-[10px] text-indigo-400 font-mono font-semibold">#{refCode}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                          <span>{t('form.host', 'Host')}: <strong className="text-slate-200">{req.host_name || 'Unassigned'}</strong></span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHostUnavail
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {tStatus(req.host_availability) || req.host_availability || 'UNAVAILABLE'}
                          </span>
                          {req.purpose && (
                            <span className="text-slate-500 italic max-w-xs truncate">
                              "{req.purpose}"
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Icons */}
                      <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setSelectedRequestId(req.id)}
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white flex items-center justify-center transition border border-slate-700 cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReassign(req, isHostUnavail ? 'reassign' : 'assign')}
                          className="w-8 h-8 rounded-lg bg-indigo-500/15 hover:bg-indigo-600 text-indigo-300 hover:text-white flex items-center justify-center transition border border-indigo-500/30 cursor-pointer"
                          title={isHostUnavail ? 'Reassign Host' : 'Assign & Route Host'}
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleQuickApprove(req)}
                          className="w-8 h-8 rounded-lg bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white flex items-center justify-center transition border border-emerald-500/30 disabled:opacity-50 cursor-pointer"
                          title="Quick Approve"
                        >
                          {actionLoadingId === req.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTargetRequest(req);
                            setRejectModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg bg-amber-500/15 hover:bg-amber-600 text-amber-300 hover:text-white flex items-center justify-center transition border border-amber-500/30 cursor-pointer"
                          title="Decline"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTargetRequest(req);
                            setDeleteModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center transition border border-rose-500/30 cursor-pointer"
                          title="Delete / Cancel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </motion.div>

      {/* Secondary Split: Today's Schedule (2 cols) & Department Shortcuts (1 col) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Calendar className="w-4 h-4"/>
              </div>
              <h3 className="text-sm font-bold text-white">{t('managerDash.todaysSchedule', "Today's Schedule")}</h3>
            </div>
            <button onClick={() => onNavigate && onNavigate('manager_appointments')} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer">
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
        </div>

        {/* Department Shortcuts (1 col) */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-bold text-white">{t('managerDash.quickOperations', 'Department Shortcuts')}</h3>
          </div>
          <div className="space-y-2.5 flex-1">
            <button onClick={() => onNavigate && onNavigate('manager_employees')} className="w-full p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-slate-300 font-semibold transition cursor-pointer flex items-center justify-between text-xs">
              <span>{t('sidebar.employeesHosts', 'Employees & Hosts')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <button onClick={() => onNavigate && onNavigate('manager_availability')} className="w-full p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-slate-300 font-semibold transition cursor-pointer flex items-center justify-between text-xs">
              <span>{t('sidebar.hostAvailabilityMatrix', 'Host Availability')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <button onClick={() => onNavigate && onNavigate('manager_rooms')} className="w-full p-3 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/60 rounded-xl text-left text-indigo-300 font-semibold transition cursor-pointer flex items-center justify-between text-xs">
              <span>{t('sidebar.meetingRoomsSpaces', 'Meeting Rooms & Spaces')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
            <button onClick={() => onNavigate && onNavigate('manager_reports')} className="w-full p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-slate-300 font-semibold transition cursor-pointer flex items-center justify-between text-xs">
              <span>{t('sidebar.departmentReports', 'Department Reports')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
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

      {/* Reject Modal */}
      {rejectModalOpen && rejectTargetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b101b] border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <XCircle className="w-5 h-5 text-amber-400" />
                <span>Decline Visitor Request</span>
              </div>
              <button 
                onClick={() => setRejectModalOpen(false)} 
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              You are about to decline the request for <strong className="text-white">{rejectTargetRequest.visitor_name}</strong> (#{rejectTargetRequest.reference_code || rejectTargetRequest.id}).
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Decline Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this request is declined..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectLoading}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {rejectLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Confirm Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deleteTargetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b101b] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <span>Remove Visitor Request</span>
              </div>
              <button 
                onClick={() => setDeleteModalOpen(false)} 
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to remove the visitor request for <strong className="text-white">{deleteTargetRequest.visitor_name}</strong>? This action cannot be undone.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Cancellation Reason
              </label>
              <textarea
                rows={2}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Host schedule conflict or cancelled by visitor..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>);
}
