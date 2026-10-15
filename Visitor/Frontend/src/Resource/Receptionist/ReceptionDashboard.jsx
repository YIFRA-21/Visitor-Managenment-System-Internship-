import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, TrendingUp, Plus, UserCheck, Shield, ArrowUpRight, Monitor, ArrowDownLeft, ArrowUpRight as ArrowUpRightIcon, Sparkles, QrCode, Bell } from 'lucide-react';
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
    const styles = THEME_STYLES[theme];
    return (<motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={`border rounded-2xl p-5 pl-6 min-h-[170px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-[#0a0f1d] border-slate-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] text-white ${hovered ? 'shadow-xl border-slate-700' : ''}`}>
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

      <div className="mt-4 relative z-10">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-3xl font-black text-white tracking-tight">{value}</h2>
          {badge}
        </div>
        <p className="text-xs text-slate-400 group-hover:text-slate-200 font-semibold mt-1 transition-colors">
          {subtitle}
        </p>
      </div>
    </motion.div>);
}
export default function ReceptionDashboard({ onNavigate }) {
    const { t, tStatus, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const defaultReceptionData = {
        welcomeMessage: 'Welcome back to Reception Lobby Console',
        orgName: 'Enterprise VMS',
        branchName: 'Headquarters Main Desk',
        departmentName: 'Front Lobby',
        stats: {
            todaysVisitors: { value: 34, change: '+18%' },
            activeAppointments: { value: 14, change: 'On-Site' },
            pendingApprovals: { value: 8, change: 'Checked Out' },
            expectedToday: { value: 42, change: 'Expected' },
        },
        appointmentsOverview: { upcoming: 18, completed: 20, cancelled: 2, pending: 4, total: 44 },
        visitorTrend: {
            data: [
                { date: 'Mon', count: 28 },
                { date: 'Tue', count: 42 },
                { date: 'Wed', count: 35 },
                { date: 'Thu', count: 50 },
                { date: 'Fri', count: 38 },
                { date: 'Sat', count: 12 },
                { date: 'Sun', count: 5 },
            ]
        },
        todaysSchedule: [
            { time: '09:00 AM', title: 'Executive Committee Briefing', visitorName: 'Robert Vance (IT Park)', status: 'Confirmed' },
            { time: '10:30 AM', title: 'System Security Audit', visitorName: 'Elena Rostova (IT Park)', status: 'Approved' },
            { time: '01:15 PM', title: 'Supplier Contract Review', visitorName: 'David Miller (IT Park)', status: 'Confirmed' },
            { time: '02:45 PM', title: 'Candidate Interview - Tech Lead', visitorName: 'Sophia Martinez (IT Park)', status: 'Pending' },
        ],
        systemAnnouncements: [
            { type: 'Info', title: 'Perimeter Gate 2 scanners operating normally after maintenance.', date: 'Today' },
            { type: 'Notice', title: 'VIP guest delegation arriving at 2:00 PM in Lobby A.', date: 'Today' },
            { type: 'Security', title: 'Badges must be clearly displayed by all visitors at all times.', date: 'Yesterday' }
        ]
    };
    const fetchStats = async (showSkeleton = false) => {
        if (showSkeleton)
            setLoading(true);
        try {
            let res;
            try {
                res = await api.get('/reception/dashboard');
            }
            catch {
                res = await api.get('/dashboard');
            }
            if (res && res.data) {
                setData(res.data);
            }
            else {
                setData(defaultReceptionData);
            }
            setError('');
        }
        catch (err) {
            console.warn('Backend sync offline, serving reception console fallback data.', err);
            setData(defaultReceptionData);
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
    if (loading && !data) {
        return (<div className="p-6 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64"/>
            <Skeleton className="h-4 w-96"/>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (<Skeleton key={i} className="h-32"/>))}
        </div>
      </div>);
    }
    const stats = data?.stats || {};
    const arrivalsCount = stats.todaysVisitors?.value ?? 0;
    const activeCount = stats.activeAppointments?.value ?? 0;
    const checkoutsCount = stats.pendingApprovals?.value ?? 0;
    const expectedCount = stats.expectedToday?.value ?? 0;
    // Overview Pie Chart Calculations
    const overview = data?.appointmentsOverview || { upcoming: 0, completed: 0, cancelled: 0, pending: 0, total: 0 };
    const pieData = [
        { name: 'Upcoming', value: overview.upcoming, color: '#3b82f6' },
        { name: 'Completed', value: overview.completed, color: '#10b981' },
        { name: 'Cancelled', value: overview.cancelled, color: '#ef4444' },
        { name: 'Pending', value: overview.pending, color: '#f59e0b' }
    ].filter(d => d.value > 0);
    const finalPieData = pieData.length > 0 ? pieData : [
        { name: 'Upcoming', value: overview.upcoming || 0, color: '#3b82f6' },
        { name: 'Completed', value: overview.completed || 0, color: '#10b981' },
        { name: 'Cancelled', value: overview.cancelled || 0, color: '#ef4444' },
        { name: 'Pending', value: overview.pending || 0, color: '#f59e0b' }
    ];
    return (<div className="p-6 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO BANNER & WELCOME HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0f1d] border border-slate-800 p-7 md:p-9 shadow-2xl transition-colors">
        {/* TOP CURVED WAVE SVG ACCENT (Matching User Image) */}
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

        {/* BOTTOM CURVED WAVE SVG ACCENT (Matching User Image) */}
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

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 my-2">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title={language === 'am' ? 'ወደ ዳሽቦርድ ተመለስ' : 'Back to Dashboard'} className="mt-1"/>
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                {language === 'am' ? 'የእንግዳ መቀበያ ዴስክ • ንቁ ዴስክ' : 'Reception Lobby Console • Active Desk'}
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                {language === 'am' ? 'የእንግዳ መቀበያ መቆጣጠሪያ ማዕከል' : (data?.welcomeMessage || 'Lobby Command Center')}
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse"/>
              </h1>
              <p className="text-slate-300 text-sm max-w-xl font-medium leading-relaxed">
                {t('receptionDash.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <a href="?view=walkin_management" className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98]">
              <Plus className="w-4 h-4"/>
              {language === 'am' ? 'ያለ ቀጠሮ የመጡ ምዝገባ' : 'Register Walk-In'}
            </a>
            <a href="?view=reception_passes" className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-[1.03] shadow-none">
              <QrCode className="w-4 h-4 text-blue-400"/>
              {language === 'am' ? 'የባጅ ማለፊያ ስጥ' : 'Issue Badge Pass'}
            </a>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS (EMPLOYEE DASHBOARD SIGNATURE STYLE) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title={language === 'am' ? 'የዛሬ መጤዎች' : "Today's Arrivals"} value={arrivalsCount} subtitle={language === 'am' ? 'የዛሬ የሎቢ መግቢያዎች' : 'Lobby check-in entries today'} badge={<span className="text-xs text-blue-400 font-extrabold">+18% vs avg</span>} icon={<ArrowDownLeft className="w-5 h-5"/>} theme="blue" onClick={() => window.location.search = '?view=visitor_arrivals'}/>

        <KpiCard title={t('dash.checkedIn')} value={activeCount} subtitle={language === 'am' ? 'በተቋሙ ውስጥ ያሉ ንቁ ጎብኚዎች' : 'Active visitors inside facility'} badge={<span className="text-xs text-emerald-400 font-extrabold">{language === 'am' ? 'አሁን ያሉ' : 'Active Now'}</span>} icon={<Users className="w-5 h-5"/>} theme="emerald" onClick={() => window.location.search = '?view=reception_queue'}/>

        <KpiCard title={language === 'am' ? 'የተጠናቀቁ መውጫዎች' : 'Completed Check-Outs'} value={checkoutsCount} subtitle={language === 'am' ? 'ዛሬ የወጡ ጎብኚዎች' : 'Checked out exits today'} badge={<span className="text-xs text-amber-400 font-extrabold">{language === 'am' ? 'የወጡ' : 'Exited'}</span>} icon={<ArrowUpRightIcon className="w-5 h-5"/>} theme="amber" onClick={() => window.location.search = '?view=reception_logs'}/>

        <KpiCard title={t('dash.expectedToday')} value={expectedCount} subtitle={language === 'am' ? 'ዛሬ የሚጠበቁ ቀጠሮዎች' : 'Expected bookings today'} badge={<span className="text-xs text-cyan-400 font-extrabold">{language === 'am' ? 'የተያዘ' : 'Scheduled'}</span>} icon={<Shield className="w-5 h-5"/>} theme="cyan" onClick={() => window.location.search = '?view=reception_workspace'}/>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="lg:col-span-2 bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#3b82f6',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-blue-400 shadow-sm shrink-0">
                <Monitor className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  Lobby Traffic Trend
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Weekly visit traffic analysis</p>
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
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#a855f7',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="border-b border-slate-800/80 pb-4 mb-4 flex items-center gap-3 relative z-10">
            <div className="w-9 h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
              <UserCheck className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Lobby Visitor Allocation
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Status breakdown overview</p>
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
              <h3 className="text-2xl font-black text-white leading-none">{overview.total || arrivalsCount}</h3>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block mt-1">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {finalPieData.map((d, i) => (<div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}/>
                <div className="truncate">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">{d.name}</span>
                  <span className="text-xs font-black text-white">{d.value}%</span>
                </div>
              </div>))}
          </div>
        </motion.div>
      </div>

      {/* ROW 3: SCHEDULES, QUICK ACTIONS & ANNOUNCEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#3b82f6',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="border-b border-slate-800/80 pb-4 mb-4 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-blue-400 shadow-sm shrink-0">
                <Calendar className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  Lobby Arrivals Today
                </h3>
              </div>
            </div>
            <span className="text-xs font-extrabold text-blue-400">Live</span>
          </div>

          <div className="space-y-3.5 flex-1 max-h-[300px] overflow-y-auto pr-1 relative z-10">
            {(data?.todaysSchedule || defaultReceptionData.todaysSchedule).map((s, i) => (<div key={i} className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex gap-3 items-center justify-between hover:border-blue-500/30 transition-all">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded-md">{s.time}</span>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${s.status === 'Confirmed' || s.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-slate-800 text-slate-400 border border-slate-700'}`}>{s.status}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-100 mt-2 mb-0 truncate">{s.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 mb-0 font-semibold truncate">Guest: {s.visitorName}</p>
                </div>
              </div>))}
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#10b981',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="border-b border-slate-800/80 pb-4 mb-4 flex items-center gap-3 relative z-10">
            <div className="w-9 h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <Plus className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Quick Desk Controls
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            <a href="?view=walkin_management" className="flex flex-col items-center justify-center text-center p-3.5 bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all group">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform mb-1.5">
                <Plus className="h-5 w-5"/>
              </div>
              <span className="text-xs font-black text-white block uppercase tracking-wider">Walk-in</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">New Entry</span>
            </a>
            
            <a href="?view=checkin" className="flex flex-col items-center justify-center text-center p-3.5 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all group">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform mb-1.5">
                <ArrowDownLeft className="h-5 w-5"/>
              </div>
              <span className="text-xs font-black text-white block uppercase tracking-wider">Check-in</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Verify Pass</span>
            </a>

            <a href="?view=checkout" className="flex flex-col items-center justify-center text-center p-3.5 bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition-all group">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform mb-1.5">
                <ArrowUpRightIcon className="h-5 w-5"/>
              </div>
              <span className="text-xs font-black text-white block uppercase tracking-wider">Check-out</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Exit Scan</span>
            </a>

            <a href="?view=passes" className="flex flex-col items-center justify-center text-center p-3.5 bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl transition-all group">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform mb-1.5">
                <Shield className="h-5 w-5"/>
              </div>
              <span className="text-xs font-black text-white block uppercase tracking-wider">Badges</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Print Badge</span>
            </a>
          </div>
        </motion.div>

        {/* System Announcements */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#f59e0b',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="border-b border-slate-800/80 pb-4 mb-4 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                <Bell className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  Desk Announcements
                </h3>
              </div>
            </div>
            <span className="text-xs font-extrabold text-blue-400 flex items-center gap-1 cursor-pointer">
              <span>View All</span>
              <ArrowUpRight className="h-3 w-3"/>
            </span>
          </div>

          <div className="space-y-3.5 flex-1 max-h-[300px] overflow-y-auto pr-1 relative z-10">
            {(data?.systemAnnouncements || defaultReceptionData.systemAnnouncements).map((a, i) => (<div key={i} className="flex gap-3 items-start border-b border-slate-800/50 pb-3.5 last:border-0 last:pb-0">
                <div className="mt-0.5 shrink-0">
                  <span className="badge text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{a.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 font-semibold mb-0 leading-normal">{a.title}</p>
                  <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">{a.date}</span>
                </div>
              </div>))}
          </div>
        </motion.div>
      </div>
    </div>);
}
