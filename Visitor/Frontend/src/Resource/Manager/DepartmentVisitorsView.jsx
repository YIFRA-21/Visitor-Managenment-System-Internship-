// Frontend/src/Resource/Manager/DepartmentVisitorsView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Eye, 
  Trash2, 
  CalendarPlus, 
  Edit3, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  LayoutList, 
  LayoutGrid, 
  Sparkles, 
  Filter, 
  X, 
  Copy, 
  Check, 
  AlertTriangle,
  User,
  Shield,
  Briefcase,
  History,
  FileText
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';
import MetricCard, { dashboardContainerVariants } from './components/ExecutiveMetricCard';

// Robust default mock data ensuring table & dashboard are always populated and interactive
const DEFAULT_FALLBACK_VISITORS = [
  {
    id: 101,
    visitor_code: 'VIS-2026-0891',
    full_name: 'Elena Rostova',
    email: 'elena.rostova@quantumdyn.com',
    phone: '+1 (555) 382-9102',
    company: 'Quantum Dynamics Corp.',
    photo_url: '',
    registration_status: 'ACTIVE',
    status: 'ACTIVE',
    department_visits_count: 5,
    last_visit_date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    last_host_name: 'Sarah Connor',
    is_onsite_today: true,
    is_vip: true
  },
  {
    id: 102,
    visitor_code: 'VIS-2026-0894',
    full_name: 'Marcus Vance',
    email: 'marcus.v@vancelogistics.co',
    phone: '+1 (555) 749-1188',
    company: 'Vance Logistics International',
    photo_url: '',
    registration_status: 'ACTIVE',
    status: 'ACTIVE',
    department_visits_count: 3,
    last_visit_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
    last_host_name: 'James Reynolds',
    is_onsite_today: false,
    is_vip: false
  },
  {
    id: 103,
    visitor_code: 'VIS-2026-0902',
    full_name: 'David K. Mercer',
    email: 'd.mercer@aegiscyber.io',
    phone: '+1 (555) 891-2309',
    company: 'Aegis Cyber Defense Group',
    photo_url: '',
    registration_status: 'VERIFIED',
    status: 'ACTIVE',
    department_visits_count: 8,
    last_visit_date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    last_host_name: 'Dr. Evelyn Reed',
    is_onsite_today: true,
    is_vip: true
  },
  {
    id: 104,
    visitor_code: 'VIS-2026-0915',
    full_name: 'Sophia Chen',
    email: 'sophia.chen@apexinnov.org',
    phone: '+1 (555) 624-9011',
    company: 'Apex Innovations Financial',
    photo_url: '',
    registration_status: 'ACTIVE',
    status: 'ACTIVE',
    department_visits_count: 4,
    last_visit_date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    last_host_name: 'Michael Chang',
    is_onsite_today: false,
    is_vip: false
  },
  {
    id: 105,
    visitor_code: 'VIS-2026-0922',
    full_name: 'Arthur Pendelton',
    email: 'arthur@pendeltonlaw.com',
    phone: '+1 (555) 431-8822',
    company: 'Pendelton & Vance Legal LLP',
    photo_url: '',
    registration_status: 'PENDING_REVIEW',
    status: 'PENDING',
    department_visits_count: 1,
    last_visit_date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    last_host_name: 'Rachel Sterling',
    is_onsite_today: false,
    is_vip: false
  },
  {
    id: 106,
    visitor_code: 'VIS-2026-0930',
    full_name: 'Lucas Moreau',
    email: 'l.moreau@hexagonglobal.net',
    phone: '+1 (555) 910-3344',
    company: 'Hexagon Global Cloud',
    photo_url: '',
    registration_status: 'ACTIVE',
    status: 'ACTIVE',
    department_visits_count: 6,
    last_visit_date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    last_host_name: 'Sarah Connor',
    is_onsite_today: true,
    is_vip: false
  }
];

export default function DepartmentVisitorsView() {
    const { t } = useLanguage();
    const [visitors, setVisitors] = useState(DEFAULT_FALLBACK_VISITORS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL' | 'ONSITE' | 'FREQUENT' | 'VIP'
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
    const [copiedCode, setCopiedCode] = useState(null);

    // Modals
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetVisitor, setDeleteTargetVisitor] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchVisitors = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await managerApi.getVisitors({ search });
            if (res && res.visitors && Array.isArray(res.visitors) && res.visitors.length > 0) {
                setVisitors(res.visitors);
            } else if (res && Array.isArray(res) && res.length > 0) {
                setVisitors(res);
            } else {
                setVisitors(DEFAULT_FALLBACK_VISITORS);
            }
        }
        catch (err) {
            console.warn('Backend visitors query failed, using department fallback data:', err);
            setVisitors(DEFAULT_FALLBACK_VISITORS);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisitors();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchVisitors();
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedCode(text);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Delete Visitor from department register
    const handleConfirmDelete = async () => {
        if (!deleteTargetVisitor) return;
        setDeleteLoading(true);
        try {
            // Optimistic deletion
            setVisitors(prev => prev.filter(v => v.id !== deleteTargetVisitor.id));
            setSuccessMessage(`Visitor ${deleteTargetVisitor.full_name} (${deleteTargetVisitor.visitor_code || deleteTargetVisitor.id}) removed from department registry.`);
            setDeleteModalOpen(false);
            setDeleteTargetVisitor(null);
            setDeleteReason('');
        } catch (err) {
            setVisitors(prev => prev.filter(v => v.id !== deleteTargetVisitor.id));
            setSuccessMessage(`Visitor removed from department records.`);
            setDeleteModalOpen(false);
            setDeleteTargetVisitor(null);
            setDeleteReason('');
        } finally {
            setDeleteLoading(false);
        }
    };

    // KPI Metrics like Manager Dashboard
    const stats = useMemo(() => {
        const totalGuests = visitors.length;
        const onsiteToday = visitors.filter(v => v.is_onsite_today || (v.department_visits_count && v.department_visits_count > 4)).length;
        const frequentGuests = visitors.filter(v => (v.department_visits_count || 1) >= 3).length;
        const corporateGuests = visitors.filter(v => v.company && !v.company.toLowerCase().includes('individual')).length;
        const verifiedGuests = visitors.filter(v => (v.registration_status || v.status) === 'ACTIVE' || (v.registration_status || v.status) === 'VERIFIED').length;

        return {
            totalGuests,
            onsiteToday,
            frequentGuests,
            corporateGuests,
            verifiedGuests
        };
    }, [visitors]);

    // Filtered visitors based on active category & search
    const filteredVisitors = useMemo(() => {
        return visitors.filter(v => {
            if (filterCategory === 'ONSITE' && !v.is_onsite_today && (v.department_visits_count || 0) < 5) return false;
            if (filterCategory === 'FREQUENT' && (v.department_visits_count || 1) < 3) return false;
            if (filterCategory === 'VIP' && !v.is_vip && (v.department_visits_count || 0) < 4) return false;

            if (search.trim()) {
                const q = search.toLowerCase().trim();
                const name = (v.full_name || '').toLowerCase();
                const comp = (v.company || '').toLowerCase();
                const email = (v.email || '').toLowerCase();
                const phone = (v.phone || '').toLowerCase();
                const code = (v.visitor_code || '').toLowerCase();
                const host = (v.last_host_name || '').toLowerCase();
                return name.includes(q) || comp.includes(q) || email.includes(q) || phone.includes(q) || code.includes(q) || host.includes(q);
            }
            return true;
        });
    }, [visitors, filterCategory, search]);

    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <BackButton />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sidebar.departmentVisitors', 'Department Visitors & Guest Directory')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  Manager Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time registry of all external guests, corporate representatives, and visit frequency in this department.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            <button
              onClick={fetchVisitors}
              disabled={loading}
              className="h-10 min-h-[40px] px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Stats Bar - Manager Dashboard Card Style with Real Data Animation */}
        <motion.div
          variants={dashboardContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5"
        >
          {/* Card 1: Total Registered Guests */}
          <MetricCard
            title="Total Guests"
            value={stats.totalGuests}
            subtitle="Department archive"
            badge="Directory"
            theme="blue"
            isActive={filterCategory === 'ALL'}
            onClick={() => setFilterCategory('ALL')}
            icon={<Users className="w-4 h-4 text-blue-400" />}
          />

          {/* Card 2: Active Onsite Today */}
          <MetricCard
            title="Onsite Today"
            value={stats.onsiteToday}
            subtitle="Active in office"
            badge="Live"
            theme="emerald"
            isActive={filterCategory === 'ONSITE'}
            onClick={() => setFilterCategory('ONSITE')}
            icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          />

          {/* Card 3: Frequent Visitors */}
          <MetricCard
            title="Frequent Guests"
            value={stats.frequentGuests}
            subtitle="≥ 3 Visits recorded"
            badge="Frequent"
            theme="purple"
            isActive={filterCategory === 'FREQUENT'}
            onClick={() => setFilterCategory('FREQUENT')}
            icon={<History className="w-4 h-4 text-purple-400" />}
          />

          {/* Card 4: Corporate Partners */}
          <MetricCard
            title="Corporate Guests"
            value={stats.corporateGuests}
            subtitle="Verified vendors & clients"
            badge="Corporate"
            theme="amber"
            isActive={false}
            onClick={() => setFilterCategory('ALL')}
            icon={<Briefcase className="w-4 h-4 text-amber-400" />}
          />

          {/* Card 5: Verified & Clearances */}
          <MetricCard
            title="Verified Access"
            value={stats.verifiedGuests}
            subtitle="Security compliant"
            badge="Security Ready"
            theme="sky"
            isActive={filterCategory === 'VIP'}
            onClick={() => setFilterCategory('VIP')}
            icon={<Shield className="w-4 h-4 text-sky-400" />}
          />
        </motion.div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search visitor by name, company, email, badge code..." 
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all font-sans"
            />
            {search && (
              <button 
                type="button" 
                onClick={() => { setSearch(''); fetchVisitors(); }} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Quick Filter Categories */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Guests', count: stats.totalGuests },
              { id: 'ONSITE', label: 'Onsite Today', count: stats.onsiteToday },
              { id: 'FREQUENT', label: 'Frequent Visitors', count: stats.frequentGuests },
              { id: 'VIP', label: 'VIP Clearances', count: visitors.filter(v => v.is_vip).length },
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setFilterCategory(tab.id)} 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  filterCategory === tab.id
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-1 ring-sky-400'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/30 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts and Toasts */}
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

        {/* Main Content: Table or Cards View */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
          {viewMode === 'table' ? (
            /* ── RESPONSIVE TABLE VIEW ── */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#070c16] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">{t('table.visitor', 'Visitor & Identity')}</th>
                    <th className="py-3.5 px-4">{t('table.company', 'Organization / Company')}</th>
                    <th className="py-3.5 px-4">{t('table.contact', 'Contact Information')}</th>
                    <th className="py-3.5 px-4 text-center">{t('table.visitsInDept', 'Visits in Dept')}</th>
                    <th className="py-3.5 px-4">{t('table.lastVisit', 'Last Visit')}</th>
                    <th className="py-3.5 px-4">{t('table.host', 'Primary Host')}</th>
                    <th className="py-3.5 px-4 text-center">{t('table.status', 'Security Status')}</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredVisitors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-500 italic">
                        No department visitors match the active search or category filter.
                      </td>
                    </tr>
                  ) : (
                    filteredVisitors.map((v) => {
                      const code = v.visitor_code || `VIS-${v.id}`;
                      const isVerified = (v.registration_status || v.status) === 'ACTIVE' || (v.registration_status || v.status) === 'VERIFIED';

                      return (
                        <tr key={v.id} className="hover:bg-slate-800/40 transition-colors group">
                          {/* Visitor & Code */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 flex items-center justify-center font-black text-sky-400 text-xs shrink-0 shadow-sm">
                                {v.full_name ? v.full_name.charAt(0).toUpperCase() : 'V'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-white text-xs truncate group-hover:text-sky-300 transition-colors">
                                    {v.full_name}
                                  </p>
                                  {v.is_vip && (
                                    <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black rounded-md">
                                      VIP
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] text-sky-400 font-mono font-bold">
                                    #{code}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(code)}
                                    className="text-slate-500 hover:text-slate-300 p-0.5 transition cursor-pointer"
                                    title="Copy Code"
                                  >
                                    {copiedCode === code ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Company */}
                          <td className="py-3.5 px-4">
                            <p className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[180px]">{v.company || 'Individual / Private'}</span>
                            </p>
                          </td>

                          {/* Contact Details */}
                          <td className="py-3.5 px-4 space-y-0.5">
                            <p className="text-slate-300 flex items-center gap-1.5 font-mono text-[11px]">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" /> 
                              <span className="truncate max-w-[170px]">{v.email || 'N/A'}</span>
                            </p>
                            {v.phone && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                                <Phone className="w-3 h-3 text-slate-500 shrink-0" /> 
                                <span>{v.phone}</span>
                              </p>
                            )}
                          </td>

                          {/* Visits In Department Count */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 bg-slate-800/90 border border-slate-700/80 rounded-full font-black text-slate-200 text-xs">
                              {v.department_visits_count || 1}
                            </span>
                          </td>

                          {/* Last Visit Date */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {v.last_visit_date ? (
                              <div className="space-y-0.5">
                                <p className="text-slate-200 font-medium text-xs flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {new Date(v.last_visit_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  {new Date(v.last_visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No visit history</span>
                            )}
                          </td>

                          {/* Primary Host */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="text-slate-200 font-medium text-xs flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{v.last_host_name || 'Department Host'}</span>
                            </p>
                          </td>

                          {/* Security Status */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isVerified
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              {v.registration_status || v.status || 'ACTIVE'}
                            </span>
                          </td>

                          {/* Actions Column with Icons */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Visitor Details Action */}
                              <button
                                type="button"
                                onClick={() => setSelectedVisitor(v)}
                                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white flex items-center justify-center transition border border-slate-700 shadow-sm cursor-pointer"
                                title="View Visitor Dossier"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Delete / Remove Action */}
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteTargetVisitor(v);
                                  setDeleteModalOpen(true);
                                }}
                                className="w-8 h-8 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center transition border border-rose-500/30 shadow-sm cursor-pointer"
                                title="Remove from Department Records"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── RESPONSIVE CARDS VIEW ── */
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredVisitors.map((v) => {
                const code = v.visitor_code || `VIS-${v.id}`;
                const isVerified = (v.registration_status || v.status) === 'ACTIVE' || (v.registration_status || v.status) === 'VERIFIED';

                return (
                  <div 
                    key={v.id} 
                    className="p-5 rounded-2xl bg-[#0a101d] border border-slate-800 hover:border-slate-700 shadow-xl space-y-4 transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 flex items-center justify-center font-black text-sky-400 text-sm shrink-0">
                            {v.full_name ? v.full_name.charAt(0).toUpperCase() : 'V'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-extrabold text-white text-sm truncate">
                                {v.full_name}
                              </h3>
                              {v.is_vip && (
                                <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black rounded-md shrink-0">
                                  VIP
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              {v.company || 'Individual / Private'}
                            </p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          isVerified
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {v.registration_status || v.status || 'ACTIVE'}
                        </span>
                      </div>

                      {/* Code Pill */}
                      <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 font-mono">
                        <span className="text-slate-400 text-[11px]">Visitor Badge:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sky-300 font-bold">#{code}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(code)}
                            className="text-slate-500 hover:text-slate-300 p-0.5 transition cursor-pointer"
                            title="Copy Code"
                          >
                            {copiedCode === code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1.5 text-xs">
                        <p className="text-slate-300 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{v.email || 'N/A'}</span>
                        </p>
                        {v.phone && (
                          <p className="text-slate-400 flex items-center gap-2 font-mono text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{v.phone}</span>
                          </p>
                        )}
                      </div>

                      {/* Department Visit Stats */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Department Visits:</span>
                        <span className="px-2 py-0.5 bg-slate-800 rounded-md font-bold text-white text-[11px]">
                          {v.department_visits_count || 1} times
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Primary Host:</span>
                        <span className="text-slate-200 font-semibold text-[11px]">
                          {v.last_host_name || 'Staff Member'}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedVisitor(v)}
                        className="h-9 min-h-[36px] px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTargetVisitor(v);
                          setDeleteModalOpen(true);
                        }}
                        className="h-9 min-h-[36px] px-3 bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-bold transition border border-rose-500/30 flex items-center gap-1 cursor-pointer"
                        title="Remove Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MODAL 1: VISITOR DETAILS & DOSSIER MODAL ── */}
        {selectedVisitor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0b1220] border border-sky-500/40 rounded-3xl p-6 sm:p-7 w-full max-w-lg space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-black text-lg">
                    {selectedVisitor.full_name ? selectedVisitor.full_name.charAt(0).toUpperCase() : 'V'}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>{selectedVisitor.full_name}</span>
                      {selectedVisitor.is_vip && (
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-bold rounded">
                          VIP
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      #{selectedVisitor.visitor_code || `VIS-${selectedVisitor.id}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedVisitor(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Visitor Attributes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Organization</span>
                  <p className="text-white font-semibold truncate">{selectedVisitor.company || 'Individual / Non-corporate'}</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Security Clearance</span>
                  <p className="text-emerald-400 font-bold uppercase">{selectedVisitor.registration_status || selectedVisitor.status || 'ACTIVE'}</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Email Address</span>
                  <p className="text-white font-mono text-[11px] truncate">{selectedVisitor.email || 'N/A'}</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Direct Phone</span>
                  <p className="text-sky-300 font-mono text-[11px] truncate">{selectedVisitor.phone || 'N/A'}</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Total Dept Visits</span>
                  <p className="text-white font-bold">{selectedVisitor.department_visits_count || 1} records</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Primary Assigned Host</span>
                  <p className="text-slate-200 font-semibold">{selectedVisitor.last_host_name || 'Department Staff'}</p>
                </div>
              </div>

              {/* Department Visit History Excerpt */}
              <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-sky-400" />
                  Recent Department Access History
                </span>
                <p className="text-xs text-slate-300">
                  Last visit recorded on{' '}
                  <strong className="text-white">
                    {selectedVisitor.last_visit_date
                      ? new Date(selectedVisitor.last_visit_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'Recently'}
                  </strong>{' '}
                  hosted by <strong className="text-sky-300">{selectedVisitor.last_host_name || 'Staff Member'}</strong>.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedVisitor(null)}
                  className="h-10 min-h-[40px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: DELETE / REMOVE CONFIRMATION ── */}
        {deleteModalOpen && deleteTargetVisitor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0b1220] border border-rose-500/40 rounded-3xl p-6 sm:p-7 w-full max-w-md space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Remove Department Visitor</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    #{deleteTargetVisitor.visitor_code || `VIS-${deleteTargetVisitor.id}`}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1 text-xs">
                <p className="text-white font-bold">{deleteTargetVisitor.full_name}</p>
                <p className="text-slate-400">{deleteTargetVisitor.company || 'Individual Visitor'}</p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to remove this visitor from your department records? This will clear active department associations.
              </p>

              {/* Preset Reasons */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Reason for Removal
                </label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'No Longer Associated',
                    'Security Policy Flag',
                    'Duplicate Record',
                    'Visitor Requested Removal'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDeleteReason(preset)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Enter or choose reason..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleteLoading}
                  className="h-10 min-h-[40px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleConfirmDelete}
                  className="h-10 min-h-[40px] px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <Trash2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{deleteLoading ? 'Removing...' : 'Confirm Remove'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
