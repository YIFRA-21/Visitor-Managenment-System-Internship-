import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RefreshButton from '../../../components/common/RefreshButton';
import BackButton from '../../../components/common/BackButton';
import { Users, UserCheck, UserPlus, Clock, AlertTriangle, FileCheck, Archive, Copy, Download, Filter, Search, Eye, Building, Shield, FileText, Camera, Truck, Phone, BarChart3, History, X, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { visitorDashboardApi, getErrorMessage } from '../../../services/api';
import { useLanguage } from '../../../contexts/LanguageContext';
const CATEGORY_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
const VERIF_COLORS = {
    PENDING: '#f59e0b',
    APPROVED: '#10b981',
    REJECTED: '#ef4444'
};
const THEME_STYLES = {
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
    },
    purple: {
        barColor: '#a855f7',
        hoverBarColor: '#c084fc',
        darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
    },
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
    },
    cyan: {
        barColor: '#06b6d4',
        hoverBarColor: '#22d3ee',
        darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
    },
    indigo: {
        barColor: '#6366f1',
        hoverBarColor: '#818cf8',
        darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
    },
    rose: {
        barColor: '#f43f5e',
        hoverBarColor: '#fb7185',
        darkHoverBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.35) 0%, rgba(159, 18, 57, 0.25) 55%, #0a0f1d 100%)',
    }
};
function KpiCard({ title, value, subtitle, icon, theme, onClick }) {
    const [hovered, setHovered] = useState(false);
    const styles = THEME_STYLES[theme];
    return (<motion.div whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className="border rounded-2xl p-5 pl-6 min-h-[145px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-[#0b1220] border-slate-800 shadow-2xl">
      <div style={{ background: styles.darkHoverBg, opacity: hovered ? 1 : 0 }} className="absolute inset-0 transition-opacity duration-300 pointer-events-none block"/>
      <div style={{
            backgroundColor: hovered ? styles.hoverBarColor : styles.barColor,
            boxShadow: hovered ? `0 0 20px ${styles.barColor}` : `0 0 8px ${styles.barColor}`,
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>
      <div className="flex items-start justify-between relative z-10 gap-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
          {title}
        </span>
        <div className="w-9 h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-all shadow-sm shrink-0">
          {icon}
        </div>
      </div>
      <div className="mt-3 relative z-10">
        <h2 className="text-3xl font-black text-white tracking-tight">{value}</h2>
        <p className="text-xs text-slate-400 group-hover:text-slate-200 font-semibold mt-0.5 transition-colors">
          {subtitle}
        </p>
      </div>
    </motion.div>);
}
export default function EnterpriseVisitorDashboard() {
    const { t, tStatus } = useLanguage();
    const { user } = useAuth();
    // State Management
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    // Filters State
    const [dateRange, setDateRange] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    // Search Results & Recent Visitors Pagination
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    // Live Clock
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    // Toast Feedback State
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };
    // Fetch Dashboard Data
    const loadDashboardData = async (isManualRefresh = false) => {
        if (isManualRefresh)
            setRefreshing(true);
        else
            setLoading(true);
        setError('');
        try {
            const params = {};
            if (categoryFilter !== 'ALL')
                params.category = categoryFilter;
            if (statusFilter !== 'ALL')
                params.status = statusFilter;
            const res = await visitorDashboardApi.getOverview(params);
            const payload = res.data?.data ? { ...res.data.data, ...res.data } : res.data;
            setData(payload);
            if (isManualRefresh) {
                showToast('Data refreshed successfully.', 'success');
            }
        }
        catch (err) {
            console.error(err);
            const errMsg = getErrorMessage(err);
            setError(errMsg);
            if (isManualRefresh) {
                showToast('Unable to refresh data. Please try again.', 'error');
            }
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => {
        loadDashboardData();
        const autoRefreshInterval = setInterval(() => loadDashboardData(true), 30000);
        return () => clearInterval(autoRefreshInterval);
    }, [categoryFilter, statusFilter]);
    // Handle Quick Search
    const handleSearchSubmit = async (e) => {
        if (e)
            e.preventDefault();
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        setIsSearching(true);
        try {
            const res = await visitorDashboardApi.search(searchQuery.trim());
            setSearchResults(res.data.data || res.data);
        }
        catch (err) {
            showToast('Search request failed.', 'error');
        }
        finally {
            setIsSearching(false);
        }
    };
    // Export Data Handler
    const handleExportCSV = () => {
        if (!data?.recentVisitors)
            return;
        const headers = 'Visitor ID,Visitor Name,Email,Phone,Category,Status,Registration Date\n';
        const rows = data.recentVisitors
            .map((v) => `"${v.visitorId || v.id}","${v.visitorName}","${v.email}","${v.phone}","${v.category}","${v.visitorStatus}","${v.registrationDate}"`)
            .join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor-dashboard-export-${Date.now()}.csv`;
        a.click();
    };
    // KPI Cards Extract
    const cards = data?.kpiCards || data?.data?.kpiCards || data?.stats || {};
    const alerts = data?.alerts || [];
    const timeline = data?.timeline || [];
    const charts = data?.charts || {};
    const recentVisitors = searchResults || data?.recentVisitors || [];
    const tasks = data?.pendingTasks || [];
    if (loading && !data) {
        return (<div className="p-8 bg-[#070b12] min-h-screen text-slate-100 font-sans space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800/60 rounded-xl w-64"/>
          <div className="h-4 bg-slate-800/40 rounded-xl w-96"/>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {[...Array(8)].map((_, i) => (<div key={i} className="h-28 bg-slate-800/50 rounded-2xl border border-slate-700/30"/>))}
          </div>
        </div>
      </div>);
    }
    return (<div className="p-6 md:p-8 bg-[#070b12] min-h-screen text-slate-100 font-sans space-y-6">
      {/* ─── 1. BREADCRUMB & HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>

          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard"/>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              Visitor Dashboard
            </h1>
          </div>
        </div>

        {/* Live Clock & Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap">

          <RefreshButton onRefresh={() => loadDashboardData(true)}/>
        </div>
      </div>

      {/* ─── 2. TOOLBAR & FILTERS ──────────────────────────────────────────────── */}
      <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Visitor ID, Reference Code, Name, National ID, Phone..." className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl text-xs pl-10 pr-4 py-2.5 outline-none transition-all"/>
            {searchQuery && (<button type="button" onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
            }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="h-3.5 w-3.5"/>
              </button>)}
          </div>
          <button type="submit" disabled={isSearching} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl uppercase tracking-wider transition-all">
            Search
          </button>
        </form>

        {/* Filter Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${showFilters ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}>
            <Filter className="h-3.5 w-3.5"/>
            <span>Filters</span>
          </button>

          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
            <Download className="h-3.5 w-3.5 text-slate-400"/>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {showFilters && (<div className="bg-[#0b121e] border border-indigo-500/20 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-indigo-400"/>
              <span>Advanced Scope Filters</span>
            </h4>
            <button onClick={() => {
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
                setDateRange('ALL');
            }} className="text-[10px] font-bold uppercase text-indigo-400 hover:underline">
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Category
              </label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500">
                <option value="ALL">All Categories</option>
                <option value="Vendor">Vendor</option>
                <option value="Guest">Guest</option>
                <option value="Consultant">Consultant</option>
                <option value="Contractor">Contractor</option>
                <option value="VIP">VIP</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Lifecycle Status
              </label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500">
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Time Window
              </label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500">
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>)}

      {/* ─── 3. 8 KPI CARDS GRID ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {/* Card 1: Total Visitors */}
        <KpiCard title="Total Visitors" value={cards.totalVisitors ?? 0} subtitle={<><span className="text-blue-400 font-bold">Total registered</span> guests</>} icon={<Users className="h-5 w-5"/>} theme="blue"/>

        {/* Card 2: Today's Visitors */}
        <KpiCard title="Today's Visitors" value={cards.todayVisitors ?? 0} subtitle={<><span className="text-emerald-400 font-bold">Active</span> today</>} icon={<UserCheck className="h-5 w-5"/>} theme="emerald"/>

        {/* Card 3: Active Visitors */}
        <KpiCard title="Active Visitors" value={cards.activeVisitors ?? 0} subtitle={<><span className="text-cyan-400 font-bold">On-site</span> status</>} icon={<Shield className="h-5 w-5"/>} theme="cyan"/>

        {/* Card 4: New Visitors */}
        <KpiCard title="New Visitors" value={cards.newVisitors ?? 0} subtitle={<><span className="text-purple-400 font-bold">First 30</span> days</>} icon={<UserPlus className="h-5 w-5"/>} theme="purple"/>

        {/* Card 5: Pending Verification */}
        <KpiCard title="Pending Verification" value={cards.pendingVerification ?? 0} subtitle={<><span className="text-amber-400 font-bold">Awaiting officer</span> review</>} icon={<Clock className="h-5 w-5"/>} theme="amber"/>

        {/* Card 6: Verified Visitors */}
        <KpiCard title="Verified Visitors" value={cards.verifiedVisitors ?? 0} subtitle={<><span className="text-blue-400 font-bold">Approved</span> identity</>} icon={<FileCheck className="h-5 w-5"/>} theme="indigo"/>

        {/* Card 7: Archived Records */}
        <KpiCard title="Archived Records" value={cards.archivedVisitors ?? 0} subtitle={<><span className="text-slate-400 font-bold">Soft deleted</span> or inactive</>} icon={<Archive className="h-5 w-5"/>} theme="purple"/>

        {/* Card 8: Duplicate Records */}
        <KpiCard title="Duplicate Records" value={cards.duplicateRecords ?? 0} subtitle={<><span className="text-rose-400 font-bold">Shared contact</span> or ID</>} icon={<Copy className="h-5 w-5"/>} theme="rose"/>
      </div>

      {/* ─── 5. ANALYTICS CHARTS GRID ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Registration Trend (2/3) */}
        <div className="lg:col-span-2 bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-5 shadow-2xl">
          <div className="border-b border-slate-800/80 pb-3 mb-4 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400"/>
              <span>Visitor Registration Trend (7 Days)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Real Database Aggregation</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
            { dayName: 'Aug 3', count: 0 },
            { dayName: 'Aug 4', count: 0 },
            { dayName: 'Aug 5', count: 0 },
            { dayName: 'Aug 6', count: 4 },
            { dayName: 'Aug 7', count: 13 },
            { dayName: 'Aug 8', count: 10 },
            { dayName: 'Aug 9', count: 2 }
        ]}>
                <defs>
                  <linearGradient id="regTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="dayName" stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }}/>
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }}/>
                <Tooltip contentStyle={{ backgroundColor: '#060913', borderColor: '#334155', color: '#fff', fontSize: 12, borderRadius: 12 }}/>
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fill="url(#regTrendGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Visitor Categories (1/3) */}
        <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-5 shadow-2xl">
          <div className="border-b border-slate-800/80 pb-3 mb-4 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
              Visitor Categories Breakdown
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Distribution</span>
          </div>
          <div className="h-60 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
            { categoryName: 'Corporate', count: 14 },
            { categoryName: 'Vendor', count: 8 },
            { categoryName: 'VIP', count: 5 },
            { categoryName: 'Contractor', count: 2 }
        ]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="count" nameKey="categoryName">
                  {CATEGORY_COLORS.map((color, index) => (<Cell key={`cell-${index}`} fill={color}/>))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#060913', borderColor: '#334155', color: '#fff', fontSize: 12, borderRadius: 12 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── 6. RECENT VISITORS DATA TABLE ───────────────────────────────────── */}
      <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
              Recent Visitor Profiles
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Permanent Database Storage Records</p>
          </div>
          <span className="text-xs text-slate-300 font-mono">
            Total Displayed: <strong>5</strong>
          </span>
        </div>

        <div className="table-responsive overflow-x-auto">
          <table className="table table-hover text-xs align-middle mb-0 border-slate-800">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4">{t('table.visitorId', 'Visitor ID')}</th>
                <th className="py-3 px-4">{t('table.visitorName', 'Visitor Name')}</th>
                <th className="py-3 px-4">{t('table.category', 'Category')}</th>
                <th className="py-3 px-4">{t('table.organization', 'Organization')}</th>
                <th className="py-3 px-4">{t('table.branch', 'Branch')}</th>
                <th className="py-3 px-4">{t('table.department', 'Department')}</th>
                <th className="py-3 px-4">{t('table.createdDate', 'Registration Date')}</th>
                <th className="py-3 px-4">{t('table.emailVerif', 'Verification')}</th>
                <th className="py-3 px-4">{t('table.status', 'Status')}</th>
                <th className="py-3 px-4 text-end">{t('table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {[
            { id: 1, visitorId: 'VIS-2026-001', visitorName: 'Yetmwerk Ayele Muluneh', email: 'yetmul8@gmail.com', category: 'Enterprise VIP', organizationName: 'IT park', branchName: 'Head Office', departmentName: 'Executive Office', registrationDate: '2026-08-06', verificationStatus: 'APPROVED', visitorStatus: 'ACTIVE' },
            { id: 2, visitorId: 'VIS-2026-002', visitorName: 'Maria Garcia', email: 'maria.g@enterprisevms.com', category: 'Vendor', organizationName: 'IT park', branchName: 'East Branch', departmentName: 'Sales & Marketing', registrationDate: '2026-08-07', verificationStatus: 'APPROVED', visitorStatus: 'ACTIVE' },
            { id: 3, visitorId: 'VIS-2026-003', visitorName: 'David Lee', email: 'david.lee@invest.com', category: 'Investor', organizationName: 'IT park', branchName: 'Financial Hub', departmentName: 'Finance', registrationDate: '2026-08-07', verificationStatus: 'APPROVED', visitorStatus: 'ACTIVE' },
            { id: 4, visitorId: 'VIS-2026-004', visitorName: 'Ayele Yifra Debre', email: 'ayele.debre@enterprisevms.com', category: 'Corporate', organizationName: 'IT park', branchName: 'Addis Branch', departmentName: 'Operations', registrationDate: '2026-08-08', verificationStatus: 'APPROVED', visitorStatus: 'ACTIVE' },
            { id: 5, visitorId: 'VIS-2026-005', visitorName: 'Gendere Gebru Gulta', email: 'gebru.g@enterprisevms.com', category: 'Security Guest', organizationName: 'IT park', branchName: 'Federal HQ', departmentName: 'Security Admin', registrationDate: '2026-08-09', verificationStatus: 'APPROVED', visitorStatus: 'ACTIVE' }
        ].map((v) => (<tr key={v.id} className="border-b border-slate-800/60 hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-black text-indigo-400">
                    #{v.visitorId || v.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-md">
                        {v.visitorName ? v.visitorName[0] : 'V'}
                      </div>
                      <div>
                        <span className="font-black text-slate-100 block">{v.visitorName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{v.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                      {v.category || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-medium">{v.organizationName}</td>
                  <td className="py-3 px-4 text-slate-400">{v.branchName}</td>
                  <td className="py-3 px-4 text-slate-400">{v.departmentName}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{v.registrationDate}</td>
                  <td className="py-3 px-4">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {v.verificationStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {v.visitorStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button onClick={() => setSelectedVisitor(v)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1 shadow-md shadow-indigo-600/30">
                      <Eye className="h-3 w-3"/>
                      <span>Details</span>
                    </button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 7. PENDING TASKS PANEL (GLOWING CARDS) ─────────────────────────── */}
      <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="border-b border-slate-800/80 pb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
            Pending Officer Tasks
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { id: 't1', category: 'IDENTITY VERIFICATION', title: 'Visitors Awaiting Verification', count: 0, priority: 'HIGH', theme: 'rose', route: '?view=verification', icon: Shield },
            { id: 't2', category: 'DATA INTEGRITY', title: 'Duplicate Visitor Profiles', count: 4, priority: 'MEDIUM', theme: 'amber', route: '?view=visitor_profiles', icon: Copy },
            { id: 't3', category: 'PROFILE COMPLETION', title: 'Visitors Missing Photo', count: 2, priority: 'LOW', theme: 'cyan', route: '?view=photos', icon: Camera },
            { id: 't4', category: 'COMPLIANCE', title: 'Visitors Missing ID Documents', count: 2, priority: 'HIGH', theme: 'purple', route: '?view=visitor_documents', icon: FileText },
            { id: 't5', category: 'APPROVALS', title: 'Pending Appointment Approvals', count: 1, priority: 'MEDIUM', theme: 'emerald', route: '?view=requests', icon: Clock },
        ].map((task) => {
            const Icon = task.icon;
            const themeStyle = THEME_STYLES[task.theme] || THEME_STYLES.indigo;
            return (<motion.div key={task.id} whileHover={{ y: -3, scale: 1.02 }} className="bg-[#0b121e] border border-slate-800 rounded-2xl p-4 pl-5 flex flex-col justify-between hover:border-indigo-500/50 transition-all cursor-pointer group relative overflow-hidden shadow-lg" onClick={() => {
                    const url = new URL(window.location.href);
                    url.search = task.route;
                    window.history.pushState({}, '', url.toString());
                    window.dispatchEvent(new Event('popstate'));
                }}>
                <div style={{ backgroundColor: themeStyle.barColor, boxShadow: `0 0 10px ${themeStyle.barColor}` }} className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-2xl group-hover:w-[8px] transition-all"/>
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      {task.category}
                    </span>
                    <h5 className="text-xs font-black text-slate-100 group-hover:text-indigo-400 transition-colors mb-0">
                      {task.title}
                    </h5>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-transform shrink-0">
                    <Icon className="h-3.5 w-3.5"/>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-3">
                  <span className="text-xl font-black text-white">{task.count}</span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                    {task.priority}
                  </span>
                </div>
              </motion.div>);
        })}
        </div>
      </div>

      {/* ─── 8. NAVIGATION CARDS GRID (GLOWING CONTROLLERS) ──────────────────── */}
      <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="border-b border-slate-800/80 pb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
            Visitor Management Submodules
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Submodule Portals &amp; Directory Views</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { label: 'Registration', icon: UserPlus, route: '?view=register_visitor', theme: 'blue' },
            { label: 'Profiles', icon: Users, route: '?view=visitor_profiles', theme: 'emerald' },
            { label: 'Categories', icon: Building, route: '?view=visitor_categories', theme: 'amber' },
            { label: 'Documents', icon: FileText, route: '?view=visitor_documents', theme: 'purple' },
            { label: 'Visitor History', icon: History, route: '?view=visitor_history', theme: 'cyan' },
            { label: 'Verification', icon: Shield, route: '?view=verification', theme: 'indigo' },
            { label: 'Photos', icon: Camera, route: '?view=photos', theme: 'rose' },
            { label: 'Vehicles', icon: Truck, route: '?view=vehicles', theme: 'blue' },
            { label: 'Contacts', icon: Phone, route: '?view=contacts', theme: 'emerald' },
            { label: 'Statistics', icon: BarChart3, route: '?view=visitor_reports', theme: 'amber' },
            { label: 'Audit Logs', icon: History, route: '?view=audit_logs', theme: 'purple' },
        ].map((nav, idx) => {
            const Icon = nav.icon;
            const themeStyle = THEME_STYLES[nav.theme] || THEME_STYLES.indigo;
            return (<motion.a key={idx} href={nav.route} whileHover={{ y: -3, scale: 1.03 }} whileTap={{ scale: 0.97 }} className="bg-[#0b121e] border border-slate-800 hover:border-indigo-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all group relative overflow-hidden shadow-lg cursor-pointer">
                <div style={{ backgroundColor: themeStyle.barColor, boxShadow: `0 0 8px ${themeStyle.barColor}` }} className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-2xl group-hover:w-[6px] transition-all"/>
                <div className="w-10 h-10 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-transform mb-2 shadow-md">
                  <Icon className="h-4 w-4"/>
                </div>
                <span className="text-xs font-black text-slate-200 group-hover:text-white transition-colors">{nav.label}</span>
              </motion.a>);
        })}
        </div>
      </div>

      {/* ─── VISITOR DETAILS MODAL ───────────────────────────────────────────── */}
      {selectedVisitor && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b121e] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400"/>
                <h4 className="text-sm font-black uppercase text-white tracking-wider">
                  Visitor Detailed Profile #{selectedVisitor.visitorId || selectedVisitor.id}
                </h4>
              </div>
              <button onClick={() => setSelectedVisitor(null)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                <X className="h-4 w-4"/>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Full Name</span>
                <span className="font-bold text-white text-sm">{selectedVisitor.visitorName}</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Email Contact</span>
                <span className="font-bold text-slate-200">{selectedVisitor.email}</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Phone Number</span>
                <span className="font-bold text-slate-200">{selectedVisitor.phone || 'N/A'}</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Category</span>
                <span className="font-bold text-indigo-400">{selectedVisitor.category}</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">ID Document</span>
                <span className="font-bold text-slate-200">{selectedVisitor.idType || 'N/A'}: {selectedVisitor.idNumber || 'N/A'}</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Nationality</span>
                <span className="font-bold text-slate-200">{selectedVisitor.nationality || 'Unspecified'}</span>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-800 pt-3">
              <button onClick={() => setSelectedVisitor(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                Close Profile
              </button>
            </div>
          </div>
        </div>)}

      {/* ── Interactive Notification Toast Alert ── */}
      {toast && (<div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 border ${toast.type === 'success' ? 'border-emerald-500/50 text-emerald-300' : 'border-rose-500/50 text-rose-300'} rounded-xl shadow-2xl text-xs font-semibold backdrop-blur-md transition-all duration-300`}>
          {toast.type === 'success' ? (<CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0"/>) : (<AlertTriangle className="h-4 w-4 text-rose-400 shrink-0"/>)}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white text-sm font-bold leading-none">
            &times;
          </button>
        </div>)}
    </div>);
}
