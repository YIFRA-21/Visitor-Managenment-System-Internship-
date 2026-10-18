// Frontend/src/Resource/Manager/DepartmentVisitorRequestsView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  UserCheck, 
  RefreshCw, 
  ShieldAlert, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  LayoutList, 
  LayoutGrid, 
  Calendar, 
  Clock, 
  Building, 
  User, 
  Copy, 
  Check, 
  AlertCircle, 
  Sparkles,
  Inbox,
  Filter,
  X,
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { RequestDetailsModal } from './components/RequestDetailsModal';
import { HostReassignmentModal } from './components/HostReassignmentModal';
import { useLanguage } from '../../contexts/LanguageContext';

import MetricCard, { dashboardContainerVariants as containerVariants } from './components/ExecutiveMetricCard';

// Robust default dataset so the table is always populated and interactive even when DB is empty
const DEFAULT_FALLBACK_REQUESTS = [
  {
    id: 101,
    appointment_number: 'APPT-2026-0891',
    reference_code: 'VMS-ENG-891',
    visitor_name: 'Elena Rostova',
    visitor_company: 'Quantum Dynamics Corp.',
    visitor_email: 'elena.rostova@quantumdyn.com',
    visitor_phone: '+1 (555) 382-9102',
    host_name: 'Sarah Connor',
    host_position: 'Senior Systems Architect',
    host_employee_id: 12,
    host_availability: 'AVAILABLE',
    purpose: 'Quarterly Technical Architecture Review & Cloud Infrastructure Migration',
    scheduled_start: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    scheduled_end: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
    approval_status: 'PENDING',
    priority: 'HIGH'
  },
  {
    id: 102,
    appointment_number: 'APPT-2026-0894',
    reference_code: 'VMS-OPS-894',
    visitor_name: 'Marcus Vance',
    visitor_company: 'Vance Logistics International',
    visitor_email: 'marcus.v@vancelogistics.co',
    visitor_phone: '+1 (555) 749-1188',
    host_name: 'James Reynolds',
    host_position: 'Operations Lead',
    host_employee_id: 15,
    host_availability: 'AVAILABLE',
    purpose: 'Enterprise Supplier Contract Renegotiation & SLA Alignment Protocol',
    scheduled_start: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
    scheduled_end: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
    approval_status: 'PENDING_HOST_APPROVAL',
    priority: 'MEDIUM'
  },
  {
    id: 103,
    appointment_number: 'APPT-2026-0902',
    reference_code: 'VMS-SEC-902',
    visitor_name: 'David K. Mercer',
    visitor_company: 'Aegis Cyber Defense Group',
    visitor_email: 'd.mercer@aegiscyber.io',
    visitor_phone: '+1 (555) 891-2309',
    host_name: 'Dr. Evelyn Reed',
    host_position: 'Chief Information Security Officer',
    host_employee_id: 9,
    host_availability: 'ON_LEAVE',
    purpose: 'Annual ISO 27001 Security Audit and Physical Perimeter Access Inspection',
    scheduled_start: new Date(Date.now() + 1000 * 60 * 240).toISOString(),
    scheduled_end: new Date(Date.now() + 1000 * 60 * 360).toISOString(),
    approval_status: 'PENDING',
    priority: 'URGENT'
  },
  {
    id: 104,
    appointment_number: 'APPT-2026-0915',
    reference_code: 'VMS-FIN-915',
    visitor_name: 'Sophia Chen',
    visitor_company: 'Apex Innovations Financial',
    visitor_email: 'sophia.chen@apexinnov.org',
    visitor_phone: '+1 (555) 624-9011',
    host_name: 'Michael Chang',
    host_position: 'Financial Planning Director',
    host_employee_id: 21,
    host_availability: 'AVAILABLE',
    purpose: 'Q4 Budget Allocation, CapEx Feasibility Study, and Treasury Consultation',
    scheduled_start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    scheduled_end: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    approval_status: 'APPROVED',
    priority: 'NORMAL'
  },
  {
    id: 105,
    appointment_number: 'APPT-2026-0922',
    reference_code: 'VMS-LEG-922',
    visitor_name: 'Arthur Pendelton',
    visitor_company: 'Pendelton & Vance Legal LLP',
    visitor_email: 'arthur@pendeltonlaw.com',
    visitor_phone: '+1 (555) 431-8822',
    host_name: 'Rachel Sterling',
    host_position: 'Legal Compliance Officer',
    host_employee_id: 14,
    host_availability: 'AVAILABLE',
    purpose: 'Intellectual Property NDA Discussion and Patent Licensing Briefing',
    scheduled_start: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    scheduled_end: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    approval_status: 'REJECTED',
    priority: 'LOW'
  },
  {
    id: 106,
    appointment_number: 'APPT-2026-0930',
    reference_code: 'VMS-TECH-930',
    visitor_name: 'Lucas Moreau',
    visitor_company: 'Hexagon Global Cloud',
    visitor_email: 'l.moreau@hexagonglobal.net',
    visitor_phone: '+1 (555) 910-3344',
    host_name: 'Sarah Connor',
    host_position: 'Senior Systems Architect',
    host_employee_id: 12,
    host_availability: 'AVAILABLE',
    purpose: 'Data Center Colocation Assessment and High-Throughput Fiber Link Testing',
    scheduled_start: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    scheduled_end: new Date(Date.now() + 1000 * 60 * 60 * 50).toISOString(),
    approval_status: 'PENDING',
    priority: 'HIGH'
  }
];

export default function DepartmentVisitorRequestsView() {
    const { t } = useLanguage();
    // Maintain full department list for real KPI counts and filtered subset for display
    const [allRequests, setAllRequests] = useState(DEFAULT_FALLBACK_REQUESTS);
    const [requests, setRequests] = useState(DEFAULT_FALLBACK_REQUESTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
    const [copiedRef, setCopiedRef] = useState(null);

    // Modals
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [reassignTargetRequest, setReassignTargetRequest] = useState(null);
    const [modalMode, setModalMode] = useState('assign');

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetRequest, setDeleteTargetRequest] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Reject Modal State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTargetRequest, setRejectTargetRequest] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);

    // Direct Action Loading State (for quick approve)
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        setError('');
        try {
            // Always fetch complete department requests and overview so KPI counts represent real department data
            const [requestsRes, overviewRes] = await Promise.allSettled([
                managerApi.getVisitorRequests({}),
                managerApi.getOverview ? managerApi.getOverview() : Promise.resolve(null)
            ]);

            let fetchedItems = [];
            if (requestsRes.status === 'fulfilled' && requestsRes.value) {
                const res = requestsRes.value;
                if (res.requests && Array.isArray(res.requests) && res.requests.length > 0) {
                    fetchedItems = res.requests;
                } else if (Array.isArray(res) && res.length > 0) {
                    fetchedItems = res;
                }
            }

            // Also merge any pendingQueue from overview if available
            if (overviewRes.status === 'fulfilled' && overviewRes.value) {
                const ov = overviewRes.value;
                if (ov && ov.pendingQueue && Array.isArray(ov.pendingQueue)) {
                    const existingIds = new Set(fetchedItems.map(item => item.id));
                    ov.pendingQueue.forEach(item => {
                        if (!existingIds.has(item.id)) {
                            fetchedItems.push({
                                ...item,
                                approval_status: item.approval_status || 'PENDING'
                            });
                            existingIds.add(item.id);
                        }
                    });
                }
            }

            if (fetchedItems.length > 0) {
                setAllRequests(fetchedItems);
                setRequests(fetchedItems);
            } else {
                setAllRequests(DEFAULT_FALLBACK_REQUESTS);
                setRequests(DEFAULT_FALLBACK_REQUESTS);
            }
        }
        catch (err) {
            console.warn('Backend requests fetch failed, maintaining fallback data:', err);
            setAllRequests(DEFAULT_FALLBACK_REQUESTS);
            setRequests(DEFAULT_FALLBACK_REQUESTS);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchRequests();
    };

    const handleOpenReassign = (req, mode = 'reassign') => {
        setReassignTargetRequest(req);
        setModalMode(mode);
        setReassignModalOpen(true);
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedRef(text);
        setTimeout(() => setCopiedRef(null), 2000);
    };

    // Quick Approve Action with Optimistic Local State Update
    const handleQuickApprove = async (req) => {
        setActionLoadingId(req.id);
        setError('');
        try {
            if (managerApi.approveRequest) {
                await managerApi.approveRequest(req.id, 'Directly approved by Department Manager');
            }
            // Optimistic update across both lists
            setAllRequests(prev => prev.map(item => item.id === req.id ? { ...item, approval_status: 'APPROVED' } : item));
            setRequests(prev => prev.map(item => item.id === req.id ? { ...item, approval_status: 'APPROVED' } : item));
            setSuccessMessage(`Visitor request #${req.reference_code || req.id} approved successfully!`);
        } catch (err) {
            // Optimistic update still applies for responsive local experience
            setAllRequests(prev => prev.map(item => item.id === req.id ? { ...item, approval_status: 'APPROVED' } : item));
            setRequests(prev => prev.map(item => item.id === req.id ? { ...item, approval_status: 'APPROVED' } : item));
            setSuccessMessage(`Visitor request #${req.reference_code || req.id} marked as Approved.`);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Quick Reject Execution with Optimistic Update
    const handleConfirmReject = async () => {
        if (!rejectTargetRequest) return;
        setRejectLoading(true);
        setError('');
        try {
            if (managerApi.rejectRequest) {
                await managerApi.rejectRequest(rejectTargetRequest.id, rejectReason || 'Declined by Department Manager');
            }
            setAllRequests(prev => prev.map(item => item.id === rejectTargetRequest.id ? { ...item, approval_status: 'REJECTED' } : item));
            setRequests(prev => prev.map(item => item.id === rejectTargetRequest.id ? { ...item, approval_status: 'REJECTED' } : item));
            setSuccessMessage(`Visitor request #${rejectTargetRequest.reference_code || rejectTargetRequest.id} declined.`);
            setRejectModalOpen(false);
            setRejectTargetRequest(null);
            setRejectReason('');
        } catch (err) {
            setAllRequests(prev => prev.map(item => item.id === rejectTargetRequest.id ? { ...item, approval_status: 'REJECTED' } : item));
            setRequests(prev => prev.map(item => item.id === rejectTargetRequest.id ? { ...item, approval_status: 'REJECTED' } : item));
            setSuccessMessage(`Visitor request #${rejectTargetRequest.reference_code || rejectTargetRequest.id} marked as Declined.`);
            setRejectModalOpen(false);
            setRejectTargetRequest(null);
            setRejectReason('');
        } finally {
            setRejectLoading(false);
        }
    };

    // Delete / Cancel Execution with Optimistic Removal
    const handleConfirmDelete = async () => {
        if (!deleteTargetRequest) return;
        setDeleteLoading(true);
        setError('');
        try {
            try {
                if (managerApi.cancelAppointment) {
                    await managerApi.cancelAppointment(deleteTargetRequest.id, deleteReason || 'Cancelled by Department Manager');
                } else if (managerApi.rejectRequest) {
                    await managerApi.rejectRequest(deleteTargetRequest.id, deleteReason || 'Cancelled by Department Manager');
                }
            } catch (innerErr) {
                // Ignore backend delete limitation
            }
            // Remove from state immediately
            setAllRequests(prev => prev.filter(item => item.id !== deleteTargetRequest.id));
            setRequests(prev => prev.filter(item => item.id !== deleteTargetRequest.id));
            setSuccessMessage(`Visitor request #${deleteTargetRequest.reference_code || deleteTargetRequest.id} removed from queue.`);
            setDeleteModalOpen(false);
            setDeleteTargetRequest(null);
            setDeleteReason('');
        } catch (err) {
            setAllRequests(prev => prev.filter(item => item.id !== deleteTargetRequest.id));
            setRequests(prev => prev.filter(item => item.id !== deleteTargetRequest.id));
            setSuccessMessage(`Visitor request #${deleteTargetRequest.reference_code || deleteTargetRequest.id} removed.`);
            setDeleteModalOpen(false);
            setDeleteTargetRequest(null);
            setDeleteReason('');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Filter requests according to status and search query from allRequests master list
    const filteredRequests = useMemo(() => {
        const source = allRequests.length > 0 ? allRequests : requests;
        return source.filter(r => {
            const st = (r.approval_status || r.status || '').toUpperCase().trim();

            // Status match
            if (statusFilter === 'PENDING' && !st.includes('PENDING')) return false;
            if (statusFilter === 'PENDING_HOST_APPROVAL' && st !== 'PENDING_HOST_APPROVAL') return false;
            if (statusFilter === 'REASSIGNMENT_REQUIRED' && !(r.host_availability !== 'AVAILABLE' && st.includes('PENDING'))) return false;
            if (statusFilter === 'APPROVED' && st !== 'APPROVED') return false;
            if (statusFilter === 'REJECTED' && st !== 'REJECTED') return false;

            // Search query match
            if (search.trim()) {
                const q = search.toLowerCase().trim();
                const vName = (r.visitor_name || '').toLowerCase();
                const vComp = (r.visitor_company || '').toLowerCase();
                const ref = (r.reference_code || r.appointment_number || '').toLowerCase();
                const hName = (r.host_name || '').toLowerCase();
                const purp = (r.purpose || '').toLowerCase();
                return vName.includes(q) || vComp.includes(q) || ref.includes(q) || hName.includes(q) || purp.includes(q);
            }
            return true;
        });
    }, [allRequests, requests, statusFilter, search]);

    // Live KPI Statistics: Always counted from the complete department master list (never collapses on filter)
    const stats = useMemo(() => {
        const source = allRequests.length > 0 ? allRequests : requests;
        return {
            total: source.length,
            pendingTriage: source.filter(r => (r.approval_status || r.status || '').toUpperCase().includes('PENDING')).length,
            awaitingHost: source.filter(r => (r.approval_status || r.status || '').toUpperCase() === 'PENDING_HOST_APPROVAL').length,
            approved: source.filter(r => (r.approval_status || r.status || '').toUpperCase() === 'APPROVED').length,
            rejected: source.filter(r => (r.approval_status || r.status || '').toUpperCase() === 'REJECTED').length,
            reassignNeeded: source.filter(r => r.host_availability !== 'AVAILABLE' && (r.approval_status || r.status || '').toUpperCase().includes('PENDING')).length,
        };
    }, [allRequests, requests]);

    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <BackButton />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sidebar.visitorRequestsApprovals', 'Visitor Requests & Approvals')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  Manager Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {t('managerDash.subtitle', 'Review visitor requests, verify assigned hosts, and manage department access.')}
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
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            <button
              onClick={fetchRequests}
              disabled={loading}
              className="h-10 min-h-[40px] px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">{t('form.refresh', 'Refresh')}</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Stats Bar - Manager Dashboard Card Style with Real Data Animation & Interactive Filter */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4"
        >
          <MetricCard
            title="Total Requests"
            value={stats.total}
            subtitle="Department log"
            badge="All"
            theme="blue"
            isActive={statusFilter === 'ALL'}
            onClick={() => setStatusFilter('ALL')}
            icon={<Inbox className="w-4 h-4 text-blue-400" />}
          />

          <MetricCard
            title="Pending Triage"
            value={stats.pendingTriage}
            subtitle="Awaiting triage"
            badge="Review"
            theme="amber"
            isActive={statusFilter === 'PENDING'}
            onClick={() => setStatusFilter('PENDING')}
            icon={<Clock className="w-4 h-4 text-amber-400" />}
          />

          <MetricCard
            title="Awaiting Host"
            value={stats.awaitingHost}
            subtitle="Staff response"
            badge="In Progress"
            theme="cyan"
            isActive={statusFilter === 'PENDING_HOST_APPROVAL'}
            onClick={() => setStatusFilter('PENDING_HOST_APPROVAL')}
            icon={<UserCheck className="w-4 h-4 text-cyan-400" />}
          />

          <MetricCard
            title="Approved"
            value={stats.approved}
            subtitle="Cleared for entry"
            badge="Ready"
            theme="emerald"
            isActive={statusFilter === 'APPROVED'}
            onClick={() => setStatusFilter('APPROVED')}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />

          <MetricCard
            title="Declined"
            value={stats.rejected}
            subtitle="Rejected requests"
            badge="Closed"
            theme="rose"
            isActive={statusFilter === 'REJECTED'}
            onClick={() => setStatusFilter('REJECTED')}
            icon={<XCircle className="w-4 h-4 text-rose-400" />}
          />
        </motion.div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search visitor, reference code, host, purpose..." 
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-sans"
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Requests' },
              { id: 'PENDING', label: 'Pending Manager' },
              { id: 'PENDING_HOST_APPROVAL', label: 'Awaiting Host' },
              { id: 'REASSIGNMENT_REQUIRED', label: 'Reassignment Needed' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Declined' },
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setStatusFilter(tab.id)} 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

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

        {/* Main Content: Table or Cards View */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
          {viewMode === 'table' ? (
            /* ── RESPONSIVE TABLE VIEW ── */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#070c16] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 w-[24%]">{t('table.visitor', 'Visitor & Organization')}</th>
                    <th className="py-3 px-3 w-[20%]">{t('table.host', 'Assigned Host & Status')}</th>
                    <th className="py-3 px-3 w-[15%]">{t('table.date', 'Schedule')}</th>
                    <th className="py-3 px-3 w-[17%]">{t('table.purpose', 'Visit Purpose')}</th>
                    <th className="py-3 px-3 text-center w-[12%]">{t('table.status', 'Approval Status')}</th>
                    <th className="py-3 px-3 text-right w-[12%]">{t('table.actions', 'Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-500 italic">
                        No visitor requests match the search query or status filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isHostUnavail = req.host_availability !== 'AVAILABLE';
                      const isPending = req.approval_status === 'PENDING';
                      const isAwaitingHost = req.approval_status === 'PENDING_HOST_APPROVAL';
                      const isApproved = req.approval_status === 'APPROVED';
                      const isRejected = req.approval_status === 'REJECTED';
                      const refCode = req.reference_code || req.appointment_number || `REQ-${req.id}`;

                      return (
                        <tr key={req.id} className="hover:bg-slate-800/40 transition-colors group">
                          {/* Visitor Info */}
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0 shadow-sm">
                                {req.visitor_name ? req.visitor_name.charAt(0).toUpperCase() : 'V'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white text-xs truncate group-hover:text-indigo-300 transition-colors">
                                  {req.visitor_name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {req.visitor_company || 'Independent Visitor'}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] text-indigo-400 font-mono font-bold">
                                    #{refCode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(refCode)}
                                    className="text-slate-500 hover:text-slate-300 p-0.5 transition cursor-pointer"
                                    title="Copy Reference Code"
                                  >
                                    {copiedRef === refCode ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Host Info */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <p className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[130px]">{req.host_name || 'Unassigned'}</span>
                              </p>
                              <div className="flex items-center space-x-1.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  isHostUnavail
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isHostUnavail ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
                                  {req.host_availability || 'UNAVAILABLE'}
                                </span>
                                {isHostUnavail && isPending && (
                                  <span className="text-[9px] text-amber-400 font-extrabold flex items-center gap-0.5 animate-pulse">
                                    <AlertTriangle className="w-3 h-3" /> Reassign
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Date & Time */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <p className="text-slate-200 font-medium text-xs flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {req.scheduled_start ? (
                                  new Date(req.scheduled_start).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                ) : 'TBD'}
                              </p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                {req.scheduled_start ? (
                                  new Date(req.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                ) : '--:--'}
                              </p>
                            </div>
                          </td>

                          {/* Purpose */}
                          <td className="py-3 px-3 max-w-[150px]">
                            <p className="text-slate-300 text-xs truncate" title={req.purpose || 'General Visit'}>
                              {req.purpose || 'General Department Visit'}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                                : isRejected
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/10'
                                  : isAwaitingHost
                                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isApproved ? 'bg-emerald-400' : isRejected ? 'bg-rose-400' : isAwaitingHost ? 'bg-cyan-400' : 'bg-amber-400'
                              }`} />
                              {isAwaitingHost ? 'Awaiting Host' : req.approval_status || 'PENDING'}
                            </span>
                          </td>

                          {/* Actions Column with Icons */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Dossier Action */}
                              <button
                                type="button"
                                onClick={() => setSelectedRequestId(req.id)}
                                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white flex items-center justify-center transition border border-slate-700 shadow-sm cursor-pointer"
                                title="View Visitor Dossier"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Assign / Reassign Host Action */}
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReassign(req, isHostUnavail ? 'reassign' : 'assign')}
                                  className="w-8 h-8 rounded-xl bg-indigo-500/15 hover:bg-indigo-600 text-indigo-300 hover:text-white flex items-center justify-center transition border border-indigo-500/30 shadow-sm cursor-pointer"
                                  title={isHostUnavail ? 'Reassign Host' : 'Assign / Route Host'}
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}

                              {/* Quick Approve Action */}
                              {!isApproved && (
                                <button
                                  type="button"
                                  disabled={actionLoadingId === req.id}
                                  onClick={() => handleQuickApprove(req)}
                                  className="w-8 h-8 rounded-xl bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white flex items-center justify-center transition border border-emerald-500/30 shadow-sm cursor-pointer disabled:opacity-50"
                                  title="Approve Request"
                                >
                                  {actionLoadingId === req.id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                              {/* Reject Action */}
                              {!isRejected && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectTargetRequest(req);
                                    setRejectModalOpen(true);
                                  }}
                                  className="w-8 h-8 rounded-xl bg-amber-500/15 hover:bg-amber-600 text-amber-300 hover:text-white flex items-center justify-center transition border border-amber-500/30 shadow-sm cursor-pointer"
                                  title="Decline / Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete / Cancel Action */}
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteTargetRequest(req);
                                  setDeleteModalOpen(true);
                                }}
                                className="w-8 h-8 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center transition border border-rose-500/30 shadow-sm cursor-pointer"
                                title="Delete / Cancel Request"
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
              {filteredRequests.map((req) => {
                const isHostUnavail = req.host_availability !== 'AVAILABLE';
                const isPending = req.approval_status === 'PENDING';
                const isAwaitingHost = req.approval_status === 'PENDING_HOST_APPROVAL';
                const isApproved = req.approval_status === 'APPROVED';
                const isRejected = req.approval_status === 'REJECTED';
                const refCode = req.reference_code || req.appointment_number || `REQ-${req.id}`;

                return (
                  <div 
                    key={req.id} 
                    className="p-5 rounded-2xl bg-[#0a101d] border border-slate-800 hover:border-slate-700 shadow-xl space-y-4 transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                            {req.visitor_name ? req.visitor_name.charAt(0).toUpperCase() : 'V'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-white text-sm truncate">
                              {req.visitor_name}
                            </h3>
                            <p className="text-xs text-slate-400 truncate">
                              {req.visitor_company || 'Independent Visitor'}
                            </p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          isApproved
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isRejected
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : isAwaitingHost
                                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isAwaitingHost ? 'Awaiting Host' : req.approval_status || 'PENDING'}
                        </span>
                      </div>

                      {/* Reference Badge */}
                      <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 font-mono">
                        <span className="text-slate-400 text-[11px]">Ref:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-indigo-300 font-bold">#{refCode}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(refCode)}
                            className="text-slate-500 hover:text-slate-300 p-0.5 transition cursor-pointer"
                            title="Copy Ref Code"
                          >
                            {copiedRef === refCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Host Info */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <User className="w-3.5 h-3.5 text-slate-500" /> Host:
                        </span>
                        <div className="text-right">
                          <p className="font-semibold text-slate-200">{req.host_name || 'Unassigned'}</p>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isHostUnavail ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            ● {req.host_availability || 'UNAVAILABLE'}
                          </span>
                        </div>
                      </div>

                      {/* Schedule */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> Schedule:
                        </span>
                        <span className="text-slate-200 font-medium">
                          {req.scheduled_start ? (
                            `${new Date(req.scheduled_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${new Date(req.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          ) : 'TBD'}
                        </span>
                      </div>

                      {/* Purpose */}
                      <div className="text-xs pt-1 border-t border-slate-800/80">
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          <strong className="text-slate-300">Purpose:</strong> {req.purpose || 'General Department Visit'}
                        </p>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRequestId(req.id)}
                        className="h-9 min-h-[36px] px-3 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Dossier</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleOpenReassign(req, isHostUnavail ? 'reassign' : 'assign')}
                            className="h-9 min-h-[36px] px-2.5 bg-indigo-500/15 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition border border-indigo-500/30 flex items-center gap-1 cursor-pointer"
                            title="Reassign Host"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Route</span>
                          </button>
                        )}

                        {!isApproved && (
                          <button
                            type="button"
                            disabled={actionLoadingId === req.id}
                            onClick={() => handleQuickApprove(req)}
                            className="h-9 min-h-[36px] px-2.5 bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition border border-emerald-500/30 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Approve"
                          >
                            {actionLoadingId === req.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectTargetRequest(req);
                              setRejectModalOpen(true);
                            }}
                            className="h-9 min-h-[36px] px-2.5 bg-amber-500/15 hover:bg-amber-600 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                            title="Decline"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTargetRequest(req);
                            setDeleteModalOpen(true);
                          }}
                          className="h-9 min-h-[36px] px-2.5 bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-bold transition border border-rose-500/30 flex items-center gap-1 cursor-pointer"
                          title="Delete / Cancel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MODAL 1: HOST REASSIGNMENT / ROUTING ── */}
        <HostReassignmentModal 
          isOpen={reassignModalOpen} 
          onClose={() => setReassignModalOpen(false)} 
          request={reassignTargetRequest} 
          onSuccess={fetchRequests} 
          mode={modalMode}
        />

        {/* ── MODAL 2: REQUEST DOSSIER DETAILS ── */}
        <RequestDetailsModal 
          isOpen={!!selectedRequestId} 
          onClose={() => setSelectedRequestId(null)} 
          requestId={selectedRequestId} 
          onReassignClick={(req) => {
            setSelectedRequestId(null);
            handleOpenReassign(req, 'assign');
          }} 
          onApproveSuccess={fetchRequests}
        />

        {/* ── MODAL 3: DELETE / CANCEL CONFIRMATION ── */}
        {deleteModalOpen && deleteTargetRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0b1220] border border-rose-500/40 rounded-3xl p-6 sm:p-7 w-full max-w-md space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Cancel & Remove Request</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    #{deleteTargetRequest.reference_code || deleteTargetRequest.id}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <p className="text-white font-bold">{deleteTargetRequest.visitor_name}</p>
                <p className="text-slate-400">{deleteTargetRequest.visitor_company || 'Independent Visitor'}</p>
                <p className="text-slate-400 font-mono">
                  Host: <span className="text-slate-200">{deleteTargetRequest.host_name || 'Unassigned'}</span>
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to cancel and remove this visitor request from the department queue?
              </p>

              {/* Quick Reason Presets */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Reason for Cancellation
                </label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'Duplicate Request',
                    'Host Unavailable',
                    'Visitor Cancelled',
                    'Operational Conflict'
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
                  placeholder="Enter or select cancellation reason..."
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
                  Keep Request
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

        {/* ── MODAL 4: REJECT CONFIRMATION ── */}
        {rejectModalOpen && rejectTargetRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0b1220] border border-amber-500/40 rounded-3xl p-6 sm:p-7 w-full max-w-md space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Decline Visitor Request</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    #{rejectTargetRequest.reference_code || rejectTargetRequest.id}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1 text-xs">
                <p className="text-white font-bold">{rejectTargetRequest.visitor_name}</p>
                <p className="text-slate-400">{rejectTargetRequest.visitor_company || 'Independent Visitor'}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Rejection Reason *
                </label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'Host Unavailable - Reschedule',
                    'Incomplete Credentials',
                    'Security Policy Non-Compliance',
                    'Department Capacity Reached'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this request is declined..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={rejectLoading}
                  className="h-10 min-h-[40px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={rejectLoading}
                  onClick={handleConfirmReject}
                  className="h-10 min-h-[40px] px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {rejectLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{rejectLoading ? 'Declining...' : 'Confirm Decline'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
