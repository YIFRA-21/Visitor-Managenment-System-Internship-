import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, AlertTriangle, Scan, ShieldAlert, UserX, Sparkles, Radio } from 'lucide-react';
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
    rose: {
        barColor: '#f43f5e',
        hoverBarColor: '#fb7185',
        darkHoverBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.35) 0%, rgba(136, 19, 55, 0.25) 55%, #0a0f1d 100%)',
        lightHoverBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(255, 228, 230, 0.95) 70%, #ffffff 100%)',
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
export default function SecurityDashboard() {
    const { t, tStatus, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const fetchStats = async (showSkeleton = false) => {
        if (showSkeleton)
            setLoading(true);
        try {
            const res = await api.get('/dashboard');
            setData(res.data);
            setError('');
        }
        catch (err) {
            console.error(err);
            setError('Failed to sync live security dashboard.');
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
    const stats = data?.stats || data?.data?.stats || {};
    const occupantsCount = stats.checkedInVisitors?.value ?? stats.totalVisitors?.value ?? 0;
    const blacklistedCount = stats.securityAlerts?.value ?? 0;
    const alertsCount = stats.notificationsCount?.value ?? stats.pendingApprovals?.value ?? 0;
    const incidentsCount = stats.auditEventsCount?.value ?? stats.securityAlerts?.value ?? 0;
    const overview = data?.appointmentsOverview || data?.data?.appointmentsOverview || { upcoming: 0, completed: 0, cancelled: 0, pending: 0, total: 0 };
    const pieData = [
        { name: 'On-Site', value: occupantsCount, color: '#3b82f6' },
        { name: 'Cleared', value: overview.completed, color: '#10b981' },
        { name: 'Flagged', value: blacklistedCount, color: '#f43f5e' },
        { name: 'Pending', value: overview.pending, color: '#f59e0b' }
    ];
    return (<div className="p-6 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO BANNER & WELCOME HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200/90 dark:border-slate-800 p-7 md:p-9 shadow-xl dark:shadow-2xl transition-colors">
        {/* TOP CURVED WAVE SVG ACCENT (Matching User Image) */}
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-90 dark:opacity-40">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveSecurity)"></path>
            <defs>
              <linearGradient id="topWaveSecurity" x1="0%" y1="0%" x2="100%" y2="0%">
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
            <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveSecurity)"></path>
            <defs>
              <linearGradient id="bottomWaveSecurity" x1="0%" y1="0%" x2="100%" y2="0%">
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-extrabold shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                {language === 'am' ? 'የደህንነት መቆጣጠሪያ ማዕከል • SOC ኮንሶል ንቁ' : 'Security Command Center • SOC Console Active'}
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                {language === 'am' ? 'የደህንነት እና መግቢያ ቁጥጥር ማዕከል' : (data?.welcomeMessage || 'Perimeter Security Console')}
                <Sparkles className="w-6 h-6 text-rose-500 dark:text-rose-400 animate-pulse"/>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl font-medium leading-relaxed">
                {t('securityDash.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-xs font-black text-emerald-700 dark:text-emerald-400 shadow-sm">
              <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse"/>
              <span className="uppercase tracking-widest">{language === 'am' ? 'የስጋት ደረጃ: ዝቅተኛ' : 'Threat Level: Low'}</span>
            </div>

            <a href="?view=security_scanner" className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98]">
              <Scan className="w-4 h-4"/>
              {language === 'am' ? 'የበር ስካነር SOC' : 'Gate Scanner SOC'}
            </a>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS (EMPLOYEE DASHBOARD SIGNATURE STYLE) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title={t('securityDash.activeOnsite')} value={occupantsCount} subtitle={language === 'am' ? 'በአሁኑ ሰዓት በቦታው ያሉ ጎብኚዎች' : 'Visitors currently on-site'} badge={<span className="text-xs text-blue-400 font-extrabold">{language === 'am' ? 'ንቁ' : 'Active'}</span>} icon={<Users className="w-5 h-5"/>} theme="blue" onClick={() => window.location.search = '?view=occupants_list'}/>

        <KpiCard title={t('securityDash.watchlistHits')} value={blacklistedCount} subtitle={language === 'am' ? 'የተከለከሉ እና የታገዱ መግቢያዎች' : 'Flagged & denied entries'} badge={<span className="text-xs text-rose-400 font-extrabold">{language === 'am' ? 'የታገዱ' : 'Denied'}</span>} icon={<UserX className="w-5 h-5"/>} theme="rose" onClick={() => window.location.search = '?view=blacklist_monitor'}/>

        <KpiCard title={language === 'am' ? 'ንቁ ማስጠንቀቂያዎች' : 'Active Alerts'} value={alertsCount} subtitle={language === 'am' ? 'የደህንነት ማስጠንቀቂያዎች' : 'Open security alerts'} badge={<span className="text-xs text-amber-400 font-extrabold">{language === 'am' ? 'ከፍተኛ ቅድሚያ' : 'High Priority'}</span>} icon={<AlertTriangle className="w-5 h-5"/>} theme="amber" onClick={() => window.location.search = '?view=security_notifications'}/>

        <KpiCard title={language === 'am' ? 'የተመዘገቡ ክስተቶች' : 'Incidents Logged'} value={incidentsCount} subtitle={language === 'am' ? 'የዛሬ የደህንነት ክስተቶች' : 'Security incidents today'} badge={<span className="text-xs text-purple-400 font-extrabold">{language === 'am' ? 'የተመዘገቡ' : 'Logged'}</span>} icon={<ShieldAlert className="w-5 h-5"/>} theme="purple" onClick={() => window.location.search = '?view=incidents_log'}/>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="lg:col-span-2 bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl relative overflow-hidden group">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#f43f5e',
            boxShadow: '0 0 12px rgba(244, 63, 94, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm shrink-0">
                <Scan className="h-5 w-5"/>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Gate Entry Traffic Trend
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Real-time gate scan rate monitoring</p>
              </div>
            </div>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
              <Radio className="w-4 h-4 animate-pulse text-rose-500"/> SOC Radar Active
            </span>
          </div>

          <div className="h-64 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.visitorTrend?.data || [
            { date: 'Mon', count: 28 },
            { date: 'Tue', count: 42 },
            { date: 'Wed', count: 35 },
            { date: 'Thu', count: 50 },
            { date: 'Fri', count: 38 },
            { date: 'Sat', count: 12 },
            { date: 'Sun', count: 5 },
        ]}>
                <defs>
                  <linearGradient id="colorSecurityTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#475569" tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}/>
                <YAxis stroke="#475569" tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}/>
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', color: '#f8fafc', fontSize: 11, borderRadius: 12 }}/>
                <Area type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorSecurityTrend)" dot={{ fill: '#f43f5e', r: 4 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Security Pie Chart */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
          <div style={{
            backgroundColor: '#10b981',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

          <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 flex items-center gap-3 relative z-10">
            <div className="w-9 h-11 rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
              <Shield className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                Security Clearance Status
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Gate scan distribution overview</p>
            </div>
          </div>

          <div className="flex justify-center items-center h-44 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{occupantsCount + blacklistedCount + alertsCount}</h3>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider block mt-1">Total Scans</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
            {pieData.map((d, i) => (<div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}/>
                <div className="truncate">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block truncate">{d.name}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{d.value}</span>
                </div>
              </div>))}
          </div>
        </motion.div>
      </div>
    </div>);
}
