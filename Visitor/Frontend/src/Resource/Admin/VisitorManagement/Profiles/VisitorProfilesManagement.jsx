import React, { useState, useEffect, useCallback, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
            return (<div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-8 max-w-md text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Profile Failed to Load</h3>
            <p className="text-xs text-slate-400 mb-4">The visitor profile view encountered an error.</p>
            <p className="text-[10px] text-rose-400/70 font-mono mb-4 break-all">{this.state.error?.message}</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={this.props.onBack} className="px-4 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                Back to Directory
              </button>
              <button onClick={() => this.setState({ hasError: false, error: null })} className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                Try Again
              </button>
            </div>
          </div>
        </div>);
        }
        return this.props.children;
    }
}
// ─── Main Container ────────────────────────────────
const VisitorProfilesManagement = () => {
    const [activeView, setActiveView] = useState('directory');
    const [selectedVisitorId, setSelectedVisitorId] = useState(null);
    const [directory, setDirectory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
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
    // Load directory
    const loadDirectory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await visitorProfileApi.getDirectory({
                page, limit, search, status: statusFilter, gender: genderFilter,
                idVerification: verificationFilter, isArchived: archivedFilter,
                sortBy, sortOrder
            });
            setDirectory(data);
        }
        catch {
            setDirectory({ data: [], pagination: { page: 1, limit: 15, total: 0, totalPages: 0 } });
        }
        finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, genderFilter, verificationFilter, archivedFilter, sortBy, sortOrder, refreshKey]);
    useEffect(() => { loadDirectory(); }, [loadDirectory]);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };
    const handleRefresh = async () => {
        if (refreshing)
            return;
        setRefreshing(true);
        try {
            const res = await visitorProfileApi.getDirectory({
                page: 1, limit, search, status: statusFilter, gender: genderFilter,
                idVerification: verificationFilter, isArchived: archivedFilter,
                sortBy, sortOrder
            });
            setDirectory(res);
            setPage(1);
            showToast('Data refreshed successfully.', 'success');
        }
        catch (err) {
            console.error(err);
            showToast('Unable to refresh data. Please try again.', 'error');
        }
        finally {
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
    return (<div className="min-h-screen" style={{ background: '#060a13' }}>
        <AnimatePresence mode="wait">
          {activeView === 'directory' ? (<motion.div key="directory-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {/* ── Header ── */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <BackButton fallbackUrl="/admin/dashboard"/>
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                      <Users className="text-indigo-400" size={22}/>
                      Visitor Profile Management
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Comprehensive visitor directory &amp; profile lifecycle management</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshButton onRefresh={handleRefresh}/>
                </div>
              </div>

            {/* ── Search & Filters Bar ── */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/>
                <input type="text" placeholder="Search by name, code, email, phone, company..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-900/80 border border-slate-700/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none"/>
              </div>

              {/* Toggle Filters */}
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${showFilters ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white'}`}>
                <Filter size={13}/>
                Filters
              </button>

              {/* Status Filter */}
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-xs rounded-lg bg-slate-900/80 border border-slate-700/50 text-white outline-none focus:border-indigo-500">
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </select>

              {/* Archive toggle */}
              <select value={archivedFilter} onChange={(e) => { setArchivedFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-xs rounded-lg bg-slate-900/80 border border-slate-700/50 text-white outline-none focus:border-indigo-500">
                <option value="false">Active Records</option>
                <option value="true">Archived</option>
                <option value="">All</option>
              </select>
            </div>

            {/* ── Advanced Filters Panel ── */}
            <AnimatePresence>
              {showFilters && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden mb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-700/30">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Gender</label>
                      <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }} className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800/80 border border-slate-700/50 text-white outline-none focus:border-indigo-500">
                        <option value="">All</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">ID Verification</label>
                      <select value={verificationFilter} onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }} className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800/80 border border-slate-700/50 text-white outline-none focus:border-indigo-500">
                        <option value="">All</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="PENDING">Pending</option>
                        <option value="UNVERIFIED">Unverified</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Sort By</label>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800/80 border border-slate-700/50 text-white outline-none focus:border-indigo-500">
                        <option value="v.created_at">Registration Date</option>
                        <option value="v.full_name">Name</option>
                        <option value="v.email">Email</option>
                        <option value="v.status">Status</option>
                        <option value="v.company">Company</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Order</label>
                      <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800/80 border border-slate-700/50 text-white outline-none focus:border-indigo-500">
                        <option value="DESC">Newest First</option>
                        <option value="ASC">Oldest First</option>
                      </select>
                    </div>
                  </div>
                </motion.div>)}
            </AnimatePresence>

            {/* ── Directory Data Grid ── */}
            <VisitorDirectory data={directory?.data ?? []} pagination={directory?.pagination ?? { page: 1, limit: 15, total: 0, totalPages: 0 }} loading={loading} onViewProfile={handleOpenProfile} onPageChange={setPage} onRefresh={handleRefresh}/>
          </motion.div>) : (<motion.div key="detail-view" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>

            {selectedVisitorId && (<ProfileErrorBoundary onBack={handleBackToDirectory}>
                <VisitorProfileDetails visitorId={selectedVisitorId} onBack={handleBackToDirectory}/>
              </ProfileErrorBoundary>)}
          </motion.div>)}
      </AnimatePresence>
      {/* ── Interactive Notification Toast Alert ── */}
      {toast && (<div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 border ${toast.type === 'success' ? 'border-emerald-500/50 text-emerald-300' : 'border-rose-500/50 text-rose-300'} rounded-xl shadow-2xl text-xs font-semibold backdrop-blur-md transition-all duration-300`}>
          {toast.type === 'success' ? (<CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0"/>) : (<AlertTriangle className="h-4 w-4 text-rose-400 shrink-0"/>)}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white text-sm font-bold leading-none">
            &times;
          </button>
        </div>)}
    </div>);
};
export default VisitorProfilesManagement;
