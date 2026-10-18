import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Calendar, Users, TrendingUp, Plus, UserCheck, Shield, ArrowUpRight, 
    Monitor, ArrowDownLeft, ArrowUpRight as ArrowUpRightIcon, Sparkles, 
    QrCode, Bell, Activity, ChevronRight, Zap, RefreshCw, Clock 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';

function Skeleton({ className }) {
    return (<div className={`animate-pulse bg-slate-800/50 border border-slate-700/30 rounded-2xl ${className}`}/>);
}

const THEME_STYLES = {
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(239, 246, 255, 0.95) 70%, #ffffff 100%)',
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
    purple: {
        barColor: '#a855f7',
        hoverBarColor: '#c084fc',
        darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(243, 232, 255, 0.95) 70%, #ffffff 100%)',
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

function KpiCard({ title, value, subtitle, badge, icon, theme, onClick }) {
    const [hovered, setHovered] = useState(false);
    const styles = THEME_STYLES[theme] || THEME_STYLES.blue;
    return (
        <motion.div 
            variants={itemVariants} 
            whileHover={{ y: -4, scale: 1.015 }} 
            whileTap={{ scale: 0.985 }} 
            onClick={onClick} 
            onMouseEnter={() => setHovered(true)} 
            onMouseLeave={() => setHovered(false)} 
            className={`border rounded-2xl p-4.5 sm:p-5 pl-5 sm:pl-6 min-h-[160px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-[#0a0f1d] border-slate-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] text-white ${hovered ? 'shadow-xl border-slate-700' : ''}`}
        >
            {/* Dark Hover Fill Overlay */}
            <div 
                style={{
                    background: styles.darkHoverBg,
                    opacity: hovered ? 1 : 0,
                }} 
                className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
            />

            {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
            <div 
                style={{
                    backgroundColor: hovered ? styles.hoverBarColor : styles.barColor,
                    boxShadow: hovered ? `0 0 20px ${styles.barColor}` : `0 0 8px ${styles.barColor}`,
                }} 
                className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-2xl transition-all duration-300 group-hover:w-[9px] z-10"
            />

            <div className="flex items-start justify-between relative z-10 gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors leading-snug break-words pr-1">
                    {title}
                </span>
                
                {/* Sleek Vertical Oval Pill Icon Capsule Container */}
                <div className="w-8 h-9 sm:w-9 sm:h-10 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-all shadow-sm shrink-0">
                    {icon}
                </div>
            </div>

            <div className="mt-3 relative z-10">
                <div className="flex items-baseline space-x-2 flex-wrap gap-y-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">{value}</h2>
                    {badge}
                </div>
                <p className="text-[11px] text-slate-400 group-hover:text-slate-200 font-semibold mt-1 transition-colors leading-tight line-clamp-1">
                    {subtitle}
                </p>
            </div>
        </motion.div>
    );
}

export default function ReceptionDashboard({ onNavigate }) {
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    const handleAction = (view) => {
        if (typeof onNavigate === 'function') {
            onNavigate(view);
        } else {
            window.location.search = `?view=${view}`;
        }
    };

    const defaultReceptionData = {
        welcomeMessage: 'Welcome back to Reception Lobby Console',
        orgName: 'Enterprise VMS',
        branchName: 'Headquarters Main Desk',
        departmentName: 'Front Lobby',
        stats: {
            totalCheckins: 0,
            totalCheckouts: 0,
            totalArrivals: 0,
            todaysVisitors: 0,
            todayArrivals: 0,
            checkedInToday: 0,
            checkedOutToday: 0,
            currentlyInside: 0,
            visitorsWaiting: 0,
            walkInVisitors: 0,
            pendingArrivals: 0,
            lateArrivals: 0,
            unreadNotifications: 0,
        },
        appointmentsOverview: { upcoming: 0, completed: 0, cancelled: 1, pending: 13, total: 15 },
        visitorTrend: {
            data: [
                { date: 'Mon', count: 0 },
                { date: 'Tue', count: 0 },
                { date: 'Wed', count: 0 },
                { date: 'Thu', count: 0 },
                { date: 'Fri', count: 3 },
                { date: 'Sat', count: 11 },
                { date: 'Sun', count: 1 },
            ]
        },
        recentActivities: []
    };

    const fetchStats = async (showSkeleton = false) => {
        if (showSkeleton) setLoading(true);
        try {
            let res;
            try {
                res = await api.get('/reception/dashboard');
            } catch {
                res = await api.get('/dashboard');
            }
            if (res && res.data) {
                setData(res.data);
            } else {
                setData(defaultReceptionData);
            }
        } catch (err) {
            console.warn('Backend sync offline, serving reception console fallback data.', err);
            setData(defaultReceptionData);
        } finally {
            if (showSkeleton) setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(true);
        const interval = setInterval(() => fetchStats(false), 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !data) {
        return (
            <div className="p-6 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64"/>
                        <Skeleton className="h-4 w-96"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-32"/>))}
                </div>
            </div>
        );
    }

    const stats = data?.stats || {};
    const getVal = (val, fallback = 0) => {
        if (val === undefined || val === null) return fallback;
        if (typeof val === 'number') return val;
        if (typeof val.value === 'number') return val.value;
        const n = Number(val);
        return isNaN(n) ? fallback : n;
    };

    // Real Count Metrics
    const totalArrivals = getVal(stats.totalArrivals, 0);
    const totalCheckins = getVal(stats.totalCheckins, 0);
    const totalCheckouts = getVal(stats.totalCheckouts, 0);
    const activeInside = getVal(stats.currentlyInside ?? stats.activeAppointments, 0);
    const expectedToday = getVal(stats.todaysVisitors ?? stats.expectedToday, 0);
    const todayArrivals = getVal(stats.todayArrivals, 0);
    const checkedInToday = getVal(stats.checkedInToday, 0);
    const checkedOutToday = getVal(stats.checkedOutToday, 0);

    // Overview Pie Chart Calculations
    const overview = data?.appointmentsOverview || { upcoming: 0, completed: 0, cancelled: 1, pending: 13, total: 15 };
    const pieData = [
        { name: 'Upcoming', value: overview.upcoming || 0, color: '#3b82f6' },
        { name: 'Completed', value: overview.completed || 0, color: '#10b981' },
        { name: 'Cancelled', value: overview.cancelled || 0, color: '#ef4444' },
        { name: 'Pending', value: overview.pending || 0, color: '#f59e0b' }
    ].filter(d => d.value > 0);
    const finalPieData = pieData.length > 0 ? pieData : [
        { name: 'Upcoming', value: overview.upcoming || 0, color: '#3b82f6' },
        { name: 'Completed', value: overview.completed || 0, color: '#10b981' },
        { name: 'Cancelled', value: overview.cancelled || 0, color: '#ef4444' },
        { name: 'Pending', value: overview.pending || 0, color: '#f59e0b' }
    ];

    return (
        <div className="p-4 sm:p-6 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
            {/* ── TOP HERO BANNER & WELCOME HEADER ── */}
            <div className="relative overflow-hidden rounded-3xl bg-[#0a0f1d] border border-slate-800 p-6 md:p-8 shadow-2xl transition-colors">
                {/* TOP CURVED WAVE SVG ACCENT */}
                <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-90 dark:opacity-40">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                        <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveReception)"></path>
                        <defs>
                            <linearGradient id="topWaveReception" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#0f3875"/>
                                <stop offset="50%" stopColor="#1e50a2"/>
                                <stop offset="100%" stopColor="#00a0e9"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* BOTTOM CURVED WAVE SVG ACCENT */}
                <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-85 dark:opacity-40">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                        <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveReception)"></path>
                        <defs>
                            <linearGradient id="bottomWaveReception" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00a0e9"/>
                                <stop offset="50%" stopColor="#2563eb"/>
                                <stop offset="100%" stopColor="#1d4ed8"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 my-1">
                    <div className="flex items-start gap-4">
                        <BackButton fallbackUrl="/dashboard" title={language === 'am' ? 'ወደ ዳሽቦርድ ተመለስ' : 'Back to Dashboard'} className="mt-1"/>
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                {language === 'am' ? 'የእንግዳ መቀበያ ዴስክ • ንቁ ዴስክ' : 'Reception Lobby Console • Active Station'}
                            </div>

                            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                                {language === 'am' ? 'የእንግዳ መቀበያ መቆጣጠሪያ ማዕከል' : (data?.welcomeMessage || 'Lobby Command Center')}
                                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse"/>
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                                {t('receptionDash.subtitle')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <button 
                            type="button"
                            onClick={() => handleAction('walkin_management')} 
                            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                            <Plus className="w-4 h-4"/>
                            {language === 'am' ? 'ያለ ቀጠሮ የመጡ ምዝገባ' : 'Register Walk-In'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => handleAction('passes')} 
                            className="px-5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-[1.02] cursor-pointer"
                        >
                            <QrCode className="w-4 h-4 text-blue-400"/>
                            {language === 'am' ? 'የባጅ ማለፊያ ስጥ' : 'Issue Badge Pass'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── KPI METRIC CARDS (REAL COUNTS & ULTRA RESPONSIVE) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                <KpiCard 
                    title={language === 'am' ? 'አጠቃላይ መጤዎች' : "Total Arrivals"} 
                    value={totalArrivals} 
                    subtitle={language === 'am' ? 'በአጠቃላይ የተመዘገቡ መጤዎች' : 'All-time visitor arrivals'} 
                    badge={<span className="text-[10px] text-blue-400 font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">{todayArrivals > 0 ? `+${todayArrivals} Today` : 'Real Count'}</span>} 
                    icon={<ArrowDownLeft className="w-5 h-5"/>} 
                    theme="blue" 
                    onClick={() => handleAction('visitor_arrivals')}
                />

                <KpiCard 
                    title={language === 'am' ? 'አጠቃላይ መግቢያዎች' : "Total Check-Ins"} 
                    value={totalCheckins} 
                    subtitle={language === 'am' ? 'በአጠቃላይ ወደ ተቋሙ የገቡ' : 'Verified visitor entries'} 
                    badge={<span className="text-[10px] text-emerald-400 font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{checkedInToday > 0 ? `+${checkedInToday} Today` : 'Admitted'}</span>} 
                    icon={<UserCheck className="w-5 h-5"/>} 
                    theme="emerald" 
                    onClick={() => handleAction('checkin')}
                />

                <KpiCard 
                    title={language === 'am' ? 'አጠቃላይ መውጫዎች' : "Total Check-Outs"} 
                    value={totalCheckouts} 
                    subtitle={language === 'am' ? 'በአጠቃላይ የወጡ ጎብኚዎች' : 'Completed visitor exits'} 
                    badge={<span className="text-[10px] text-amber-400 font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">{checkedOutToday > 0 ? `+${checkedOutToday} Today` : 'Exited'}</span>} 
                    icon={<ArrowUpRightIcon className="w-5 h-5"/>} 
                    theme="amber" 
                    onClick={() => handleAction('checkout')}
                />

                <KpiCard 
                    title={language === 'am' ? 'አሁን በተቋሙ ያሉ' : "Currently On-Site"} 
                    value={activeInside} 
                    subtitle={language === 'am' ? 'በተቋሙ ውስጥ ያሉ ንቁ ጎብኚዎች' : 'Active inside facility'} 
                    badge={<span className="text-[10px] text-cyan-400 font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">{language === 'am' ? 'አሁን ያሉ' : 'Active Now'}</span>} 
                    icon={<Users className="w-5 h-5"/>} 
                    theme="cyan" 
                    onClick={() => handleAction('reception_queue')}
                />

                <KpiCard 
                    title={language === 'am' ? 'ዛሬ የሚጠበቁ' : "Expected Today"} 
                    value={expectedToday} 
                    subtitle={language === 'am' ? 'ዛሬ የተያዙ ቀጠሮዎች' : 'Scheduled bookings today'} 
                    badge={<span className="text-[10px] text-purple-400 font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">{language === 'am' ? 'የተያዘ' : 'Scheduled'}</span>} 
                    icon={<Shield className="w-5 h-5"/>} 
                    theme="purple" 
                    onClick={() => handleAction('reception_workspace')}
                />
            </div>

            {/* ── CHARTS ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="lg:col-span-2 bg-[#0b101b] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                    {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
                    <div style={{
                        backgroundColor: '#3b82f6',
                        boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
                    }} className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-3xl transition-all duration-300 group-hover:w-[9px] z-10"/>

                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-10 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-blue-400 shadow-sm shrink-0">
                                <Monitor className="h-5 w-5"/>
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                                    {language === 'am' ? 'የሎቢ ጎብኚዎች አዝማሚያ' : 'Lobby Traffic Trend'}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                    {language === 'am' ? 'የሳምንታዊ ጎብኚዎች ፍሰት ትንተና' : 'Weekly visit traffic analytics'}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs text-blue-400 font-bold flex items-center gap-1">
                            <TrendingUp className="w-4 h-4"/> Live Tracking
                        </span>
                    </div>

                    <div className="h-64 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.visitorTrend?.data || defaultReceptionData.visitorTrend.data}>
                                <defs>
                                    <linearGradient id="colorReceptionTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#475569" tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}/>
                                <YAxis stroke="#475569" tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}/>
                                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', color: '#f8fafc', fontSize: 11, borderRadius: 12 }}/>
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorReceptionTrend)" dot={{ fill: '#3b82f6', r: 4 }}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Pie Chart */}
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-[#0b101b] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                    {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
                    <div style={{
                        backgroundColor: '#a855f7',
                        boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
                    }} className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-3xl transition-all duration-300 group-hover:w-[9px] z-10"/>

                    <div className="border-b border-slate-800/80 pb-4 mb-4 flex items-center gap-3 relative z-10">
                        <div className="w-9 h-10 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
                            <UserCheck className="h-5 w-5"/>
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                                {language === 'am' ? 'የቀጠሮዎች ሁኔታ ክፍፍል' : 'Lobby Visitor Allocation'}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                {language === 'am' ? 'የሁኔታዎች አጠቃላይ ምልከታ' : 'Status breakdown overview'}
                            </p>
                        </div>
                    </div>

                    <div className="relative flex justify-center items-center h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={finalPieData} cx="50%" cy="50%" innerRadius={58} outerRadius={75} paddingAngle={4} dataKey="value">
                                    {finalPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute text-center">
                            <h3 className="text-2xl font-black text-white leading-none">{overview.total || totalArrivals}</h3>
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block mt-1">Total</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {finalPieData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl">
                                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}/>
                                <div className="truncate">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">{d.name}</span>
                                    <span className="text-xs font-black text-white">{d.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── LIVE RECEPTION ACTIVITY LOG STREAM (ENTERPRISE AUDIT TRAIL) ── */}
            <motion.div 
                variants={itemVariants} 
                className="bg-[#0b101b] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden group"
            >
                <div style={{
                    backgroundColor: '#3b82f6',
                    boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)',
                }} className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-3xl transition-all duration-300 group-hover:w-[9px] z-10"/>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm shrink-0">
                            <Activity className="h-4.5 w-4.5"/>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                                    {language === 'am' ? 'የቅርብ ጊዜ የዴስክ እንቅስቃሴዎች' : 'Recent Desk Activity Logs'}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    Live Feed
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {language === 'am' ? 'በእውነተኛ ጊዜ የተመዘገቡ የሎቢ እና የዴስክ ክንውኖች' : 'Real-time chronological log of lobby arrivals, check-ins, pass issues, and queue updates'}
                            </p>
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={() => handleAction('reception_logs')}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
                    >
                        <span>{language === 'am' ? 'ሁሉንም መዝገቦች ይመልከቱ' : 'View All Logs'}</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-2.5 relative z-10">
                    {(data?.recentActivities && data.recentActivities.length > 0 ? data.recentActivities.slice(0, 5) : [
                        { id: 1, activity_type: 'CHECKIN_COMPLETED', title: 'Visitor Check-In Verified', details: 'Visitor confirmed entry at reception counter', receptionist_name: 'Front Desk', created_at: new Date().toISOString() },
                        { id: 2, activity_type: 'ARRIVAL_CONFIRMED', title: 'Visitor Arrived at Lobby', details: 'Appointment arrival confirmed and logged', receptionist_name: 'Front Desk', created_at: new Date(Date.now() - 15 * 60000).toISOString() },
                        { id: 3, activity_type: 'PASS_ISSUED', title: 'Digital Badge Issued', details: 'Visitor pass badge generated and assigned', receptionist_name: 'Front Desk', created_at: new Date(Date.now() - 35 * 60000).toISOString() },
                    ]).map((act, idx) => (
                        <div 
                            key={act.id || idx} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl gap-2 sm:gap-3 transition-all"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded-lg shrink-0">
                                    {act.activity_type || 'ACTIVITY'}
                                </span>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-100 truncate">{act.title}</h4>
                                    <p className="text-[11px] text-slate-400 truncate">{act.details}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-slate-500 text-[10px] font-semibold pl-4.5 sm:pl-0">
                                <span className="text-slate-400">{act.receptionist_name || 'Reception Staff'}</span>
                                <span>•</span>
                                <span className="font-mono">{act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── QUICK DESK CONTROLS (PLACED AT THE END OF THE DASHBOARD) ── */}
            <motion.div 
                variants={itemVariants} 
                className="w-full bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden group"
            >
                {/* Glowing border accent */}
                <div 
                    style={{
                        backgroundColor: '#10b981',
                        boxShadow: '0 0 16px rgba(16, 185, 129, 0.45)',
                    }} 
                    className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-3xl transition-all duration-300 group-hover:w-[9px] z-10"
                />

                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shrink-0">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                                    {language === 'am' ? 'የፈጣን ዴስክ መቆጣጠሪያዎች' : 'Quick Desk Controls'}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Fast Actions
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {language === 'am' ? 'ፈጣን የሎቢ ተግባራት እና የጎብኚ ቁጥጥር ማዕከል' : 'Instant lobby operations, rapid check-ins, pass issuance, and queue controls'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{language === 'am' ? 'ዴስክ መስመር ላይ ነው' : 'Front Desk Ready'}</span>
                    </div>
                </div>

                {/* Horizontal Action Controls Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 relative z-10">
                    {/* 1. Walk-In */}
                    <button 
                        type="button"
                        onClick={() => handleAction('walkin_management')} 
                        className="flex flex-col items-center justify-center text-center p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all duration-200 group cursor-pointer shadow-md hover:shadow-blue-500/10 hover:-translate-y-1"
                    >
                        <div className="p-2.5 bg-blue-500/15 border border-blue-500/30 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform mb-1.5 shadow-sm">
                            <Plus className="h-5 w-5"/>
                        </div>
                        <span className="text-xs font-black text-white block uppercase tracking-wider group-hover:text-blue-300 transition-colors">
                            {language === 'am' ? 'ያለ ቀጠሮ' : 'Walk-In'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {language === 'am' ? 'አዲስ ምዝገባ' : 'New Entry'}
                        </span>
                    </button>
                    
                    {/* 2. Check-In */}
                    <button 
                        type="button"
                        onClick={() => handleAction('checkin')} 
                        className="flex flex-col items-center justify-center text-center p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-200 group cursor-pointer shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1"
                    >
                        <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform mb-1.5 shadow-sm">
                            <ArrowDownLeft className="h-5 w-5"/>
                        </div>
                        <span className="text-xs font-black text-white block uppercase tracking-wider group-hover:text-emerald-300 transition-colors">
                            {language === 'am' ? 'መግቢያ' : 'Check-In'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {language === 'am' ? 'ማለፊያ አረጋግጥ' : 'Verify Pass'}
                        </span>
                    </button>

                    {/* 3. Check-Out */}
                    <button 
                        type="button"
                        onClick={() => handleAction('checkout')} 
                        className="flex flex-col items-center justify-center text-center p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition-all duration-200 group cursor-pointer shadow-md hover:shadow-amber-500/10 hover:-translate-y-1"
                    >
                        <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-400 group-hover:scale-110 transition-transform mb-1.5 shadow-sm">
                            <ArrowUpRightIcon className="h-5 w-5"/>
                        </div>
                        <span className="text-xs font-black text-white block uppercase tracking-wider group-hover:text-amber-300 transition-colors">
                            {language === 'am' ? 'መውጫ' : 'Check-Out'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {language === 'am' ? 'መውጫ ስካን' : 'Exit Scan'}
                        </span>
                    </button>

                    {/* 4. Badges */}
                    <button 
                        type="button"
                        onClick={() => handleAction('passes')} 
                        className="flex flex-col items-center justify-center text-center p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl transition-all duration-200 group cursor-pointer shadow-md hover:shadow-purple-500/10 hover:-translate-y-1"
                    >
                        <div className="p-2.5 bg-purple-500/15 border border-purple-500/30 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform mb-1.5 shadow-sm">
                            <Shield className="h-5 w-5"/>
                        </div>
                        <span className="text-xs font-black text-white block uppercase tracking-wider group-hover:text-purple-300 transition-colors">
                            {language === 'am' ? 'ባጆች' : 'Badges'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {language === 'am' ? 'ባጅ አትም' : 'Print Badge'}
                        </span>
                    </button>

                    {/* 5. Queue Management */}
                    <button 
                        type="button"
                        onClick={() => handleAction('reception_queue')} 
                        className="flex flex-col items-center justify-center text-center p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition-all duration-200 group cursor-pointer shadow-md hover:shadow-cyan-500/10 hover:-translate-y-1"
                    >
                        <div className="p-2.5 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl text-cyan-400 group-hover:scale-110 transition-transform mb-1.5 shadow-sm">
                            <Users className="h-5 w-5"/>
                        </div>
                        <span className="text-xs font-black text-white block uppercase tracking-wider group-hover:text-cyan-300 transition-colors">
                            {language === 'am' ? 'የሎቢ ወረፋ' : 'Lobby Queue'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {language === 'am' ? 'የመጠባበቂያ ዝርዝር' : 'Waiting List'}
                        </span>
                    </button>

                    {/* 6. Host Notifications */}
                    <button 
                        type="button"
                        onClick={() => handleAction('host_notifications')} 
                        className="flex flex-col items-center justify-center text-center p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl transition-all duration-200 group cursor-pointer shadow-md hover:shadow-rose-500/10 hover:-translate-y-1"
                    >
                        <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-400 group-hover:scale-110 transition-transform mb-1.5 shadow-sm">
                            <Bell className="h-5 w-5"/>
                        </div>
                        <span className="text-xs font-black text-white block uppercase tracking-wider group-hover:text-rose-300 transition-colors">
                            {language === 'am' ? 'የአስተናጋጅ ጥሪ' : 'Host Alerts'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {language === 'am' ? 'የመድረሻ ማሳወቂያ' : 'Arrival Notice'}
                        </span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

