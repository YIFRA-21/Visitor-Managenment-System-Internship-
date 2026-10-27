import React, { useState, useEffect, useCallback, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, AlertTriangle, CheckCircle2, UserCheck, ShieldCheck,
  ShieldAlert, Clock, Plus, Download, LayoutGrid, List, Sparkles, X, Building2,
  ChevronRight, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { visitorProfileApi } from '../../../../modules/visitor-management/api/visitorProfileApi';
import VisitorDirectory from './VisitorDirectory';
import VisitorProfileDetails from './VisitorProfileDetails';
import RefreshButton from '../../../../components/common/RefreshButton';
import BackButton from '../../../../components/common/BackButton';

// ── Error Boundary for profile detail rendering ──
class ProfileErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ProfileErrorBoundary] Crash in profile detail:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 max-w-md text-center shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Profile View Encountered an Error</h3>
            <p className="text-xs text-slate-400 mb-4">The visitor profile details could not be rendered.</p>
            <p className="text-[10px] text-rose-400/80 font-mono mb-6 p-2 bg-slate-950 rounded-lg border border-slate-800 break-all">
              {this.state.error?.message}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.props.onBack}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-colors"
              >
                Back to Directory
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main Container ────────────────────────────────
const VisitorProfilesManagement = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('directory');
  const [selectedVisitorId, setSelectedVisitorId] = useState(null);
  const [directory, setDirectory] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // View mode: 'table' or 'grid' (persisted in localStorage)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('vms_visitor_profiles_view_mode') || 'table';
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('vms_visitor_profiles_view_mode', mode);
  };

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [archivedFilter, setArchivedFilter] = useState('false');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [sortBy, setSortBy] = useState('v.created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showFilters, setShowFilters] = useState(false);

  // Load directory & summary metrics
  const loadDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.allSettled([
        visitorProfileApi.getDirectory({
          page,
          limit,
          search,
          status: statusFilter,
          gender: genderFilter,
          idVerification: verificationFilter,
          isArchived: archivedFilter,
          sortBy,
          sortOrder
        }),
        visitorProfileApi.getStats()
      ]);

      if (data.status === 'fulfilled') {
        setDirectory(data.value);
      } else {
        setDirectory({ data: [], pagination: { page: 1, limit: 15, total: 0, totalPages: 0 } });
      }

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }
    } catch {
      setDirectory({ data: [], pagination: { page: 1, limit: 15, total: 0, totalPages: 0 } });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, genderFilter, verificationFilter, archivedFilter, sortBy, sortOrder, refreshKey]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const [res, statsData] = await Promise.allSettled([
        visitorProfileApi.getDirectory({
          page: 1,
          limit,
          search,
          status: statusFilter,
          gender: genderFilter,
          idVerification: verificationFilter,
          isArchived: archivedFilter,
          sortBy,
          sortOrder
        }),
        visitorProfileApi.getStats()
      ]);

      if (res.status === 'fulfilled') {
        setDirectory(res.value);
        setPage(1);
      }
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }
      showToast('Directory synchronized with latest server records.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Unable to refresh data. Please check connectivity.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenProfile = (visitorId) => {
    setSelectedVisitorId(visitorId);
    setActiveView('detail');
  };

  const handleBackToDirectory = () => {
    setActiveView('directory');
    setSelectedVisitorId(null);
    handleRefresh();
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  // Quick Filter Pills handler
  const handleQuickFilter = (type) => {
    setPage(1);
    if (type === 'ALL') {
      setStatusFilter('');
      setVerificationFilter('');
      setArchivedFilter('false');
    } else if (type === 'ACTIVE') {
      setStatusFilter('ACTIVE');
      setArchivedFilter('false');
    } else if (type === 'VERIFIED') {
      setVerificationFilter('VERIFIED');
      setArchivedFilter('false');
    } else if (type === 'PENDING') {
      setStatusFilter('PENDING');
      setArchivedFilter('false');
    } else if (type === 'ARCHIVED') {
      setStatusFilter('');
      setArchivedFilter('true');
    }
  };

  // Export current directory to CSV
  const handleExportCSV = () => {
    if (!directory?.data || directory.data.length === 0) {
      showToast('No records available to export.', 'error');
      return;
    }

    const headers = ['Visitor ID', 'Full Name', 'Email', 'Phone', 'Company', 'Status', 'Verification', 'Category', 'Reference No'];
    const rows = directory.data.map((v) => [
      `"${v.visitor_code || `VIS-${v.id}`}"`,
      `"${v.full_name || ''}"`,
      `"${v.email || ''}"`,
      `"${v.phone || ''}"`,
      `"${v.organization_name || v.company || ''}"`,
      `"${v.status || 'ACTIVE'}"`,
      `"${v.id_verification_status || 'UNVERIFIED'}"`,
      `"${v.category || 'Standard'}"`,
      `"${v.reference_number || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `visitor_directory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported current visitor directory to CSV.', 'success');
  };

  // Compute metric figures
  const totalProfilesCount = stats?.total_visitors ?? directory?.pagination?.total ?? 0;
  const activeProfilesCount = stats?.active_visitors ?? (directory?.data?.filter((v) => v.status === 'ACTIVE').length || 0);
  const verifiedProfilesCount = stats?.verified_visitors ?? (directory?.data?.filter((v) => v.id_verification_status === 'VERIFIED').length || 0);
  const flaggedProfilesCount = stats?.blacklisted_visitors ?? (directory?.data?.filter((v) => v.is_blacklisted).length || 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6" style={{ background: '#050913' }}>
      <AnimatePresence mode="wait">
        {activeView === 'directory' ? (
          <motion.div
            key="directory-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* ── HEADER TITLE & ACTION BUTTONS ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
              <div className="flex items-center gap-3.5">
                <BackButton fallbackUrl="/admin/dashboard" />
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10">
                      <Users size={22} />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <span>Visitor Profile Management</span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {totalProfilesCount} Profiles
                        </span>
                      </h1>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Comprehensive visitor directory, biometric verification clearance &amp; profile lifecycle
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
                  title="Export current view to CSV"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard?view=visitor_registration')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <Plus size={14} />
                  <span>Register Visitor</span>
                </button>

                <RefreshButton onRefresh={handleRefresh} />
              </div>
            </div>

            {/* ── 4 EXECUTIVE KPI METRICS CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {/* Card 1: Total Directory */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e172a] via-[#090f1d] to-[#070b16] border border-indigo-500/20 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Directory</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Users size={16} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {totalProfilesCount}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Sparkles size={11} className="text-indigo-400" />
                  <span>Registered visitor profiles</span>
                </p>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* Card 2: Active Visitors */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#061e14] via-[#081512] to-[#060e11] border border-emerald-500/20 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Active Profiles</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <UserCheck size={16} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                  {activeProfilesCount}
                </div>
                <p className="text-[11px] text-emerald-200/70 mt-1">
                  In good standing &amp; entry eligible
                </p>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* Card 3: Identity Verified */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#081a2e] via-[#091322] to-[#060b16] border border-cyan-500/20 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">ID &amp; Bio Verified</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
                  {verifiedProfilesCount}
                </div>
                <p className="text-[11px] text-cyan-200/70 mt-1">
                  Government document authenticated
                </p>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* Card 4: Flagged & Restrictions */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#220c15] via-[#160a12] to-[#0d060c] border border-rose-500/20 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">Restricted / Watchlist</span>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <ShieldAlert size={16} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
                  {flaggedProfilesCount}
                </div>
                <p className="text-[11px] text-rose-200/70 mt-1">
                  Security flagged or suspended
                </p>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              </div>
            </div>

            {/* ── SEARCH & SMART TOOLBAR ── */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a101f]/90 border border-slate-800/80 p-3 rounded-2xl shadow-xl backdrop-blur-xl">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[260px] max-w-lg">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                  <input
                    type="text"
                    placeholder="Search by visitor name, code, email, phone, company, branch..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700/60 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Quick Status Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                  {[
                    { key: 'ALL', label: 'All' },
                    { key: 'ACTIVE', label: 'Active' },
                    { key: 'VERIFIED', label: 'Verified' },
                    { key: 'PENDING', label: 'Pending' },
                    { key: 'ARCHIVED', label: 'Archived' }
                  ].map((chip) => {
                    const isSelected =
                      (chip.key === 'ALL' && !statusFilter && !verificationFilter && archivedFilter === 'false') ||
                      (chip.key === 'ACTIVE' && statusFilter === 'ACTIVE') ||
                      (chip.key === 'VERIFIED' && verificationFilter === 'VERIFIED') ||
                      (chip.key === 'PENDING' && statusFilter === 'PENDING') ||
                      (chip.key === 'ARCHIVED' && archivedFilter === 'true');

                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => handleQuickFilter(chip.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Side: View Mode & Filters Toggle */}
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle: Grid vs Table */}
                  <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleToggleViewMode('table')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Table View"
                    >
                      <List size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Card Grid View"
                    >
                      <LayoutGrid size={14} />
                    </button>
                  </div>

                  {/* Filter Accordion Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      showFilters
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Filter size={13} />
                    <span>Filters</span>
                  </button>
                </div>
              </div>

              {/* ── ADVANCED FILTERS ACCORDION ── */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#090e1a] border border-slate-800 shadow-xl">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Gender Classification
                        </label>
                        <select
                          value={genderFilter}
                          onChange={(e) => {
                            setGenderFilter(e.target.value);
                            setPage(1);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700/60 text-white outline-none focus:border-indigo-500"
                        >
                          <option value="">All Genders</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          ID Verification Status
                        </label>
                        <select
                          value={verificationFilter}
                          onChange={(e) => {
                            setVerificationFilter(e.target.value);
                            setPage(1);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700/60 text-white outline-none focus:border-indigo-500"
                        >
                          <option value="">All Verification States</option>
                          <option value="VERIFIED">Verified</option>
                          <option value="PENDING">Pending Review</option>
                          <option value="UNVERIFIED">Unverified</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Sort Criteria
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700/60 text-white outline-none focus:border-indigo-500"
                        >
                          <option value="v.created_at">Registration Date</option>
                          <option value="v.full_name">Visitor Full Name</option>
                          <option value="v.email">Email Address</option>
                          <option value="v.status">Lifecycle Status</option>
                          <option value="v.company">Organization / Company</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Sort Order
                        </label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700/60 text-white outline-none focus:border-indigo-500"
                        >
                          <option value="DESC">Newest First (Descending)</option>
                          <option value="ASC">Oldest First (Ascending)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── DIRECTORY DATA GRID / TABLE ── */}
            <VisitorDirectory
              data={directory?.data ?? []}
              pagination={directory?.pagination ?? { page: 1, limit: 15, total: 0, totalPages: 0 }}
              loading={loading}
              viewMode={viewMode}
              onViewProfile={handleOpenProfile}
              onPageChange={setPage}
              onRefresh={handleRefresh}
            />
          </motion.div>
        ) : (
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {selectedVisitorId && (
              <ProfileErrorBoundary onBack={handleBackToDirectory}>
                <VisitorProfileDetails visitorId={selectedVisitorId} onBack={handleBackToDirectory} />
              </ProfileErrorBoundary>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INTERACTIVE NOTIFICATION TOAST ALERT ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 border ${
              toast.type === 'success' ? 'border-emerald-500/50 text-emerald-300' : 'border-rose-500/50 text-rose-300'
            } rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-xl transition-all duration-300`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-white text-sm font-bold leading-none"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisitorProfilesManagement;
