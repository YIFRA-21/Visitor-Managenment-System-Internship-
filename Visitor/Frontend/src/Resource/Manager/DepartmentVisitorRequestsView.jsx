// Frontend/src/Resource/Manager/DepartmentVisitorRequestsView.tsx
import React, { useState, useEffect } from 'react';
import { Search, UserCheck, RefreshCw, ShieldAlert } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { RequestDetailsModal } from './components/RequestDetailsModal';
import { HostReassignmentModal } from './components/HostReassignmentModal';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DepartmentVisitorRequestsView() {
    const { t } = useLanguage();
    const [requests, setRequests] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    // Modals
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [reassignTargetRequest, setReassignTargetRequest] = useState(null);
    const [modalMode, setModalMode] = useState('assign');
    const fetchRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await managerApi.getVisitorRequests({
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
                search
            });
            setRequests(res.requests);
            setTotal(res.total);
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch visitor requests');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchRequests();
    };
    const handleOpenReassign = (req) => {
        setReassignTargetRequest(req);
        setReassignModalOpen(true);
    };
    return (<div className="p-6 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {t('submenu.manager-requests', 'Visitor Requests & Workflow Approvals')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                Department Isolation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('managerDash.subtitle', 'Review visitor requests, verify assigned hosts, and reassign unavailable team members.')}
            </p>
          </div>
        </div>

        <button onClick={fetchRequests} disabled={loading} className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
          <span>{t('form.refresh', 'Refresh Requests')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search visitor, reference code, purpose..." className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filters */}
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'PENDING', label: 'Pending Manager Triage' },
            { id: 'PENDING_HOST_APPROVAL', label: 'Awaiting Host Approval' },
            { id: 'REASSIGNMENT_REQUIRED', label: 'Reassignment Needed' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' },
        ].map((tab) => (<button key={tab.id} onClick={() => setStatusFilter(tab.id)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}>
              {tab.label}
            </button>))}
        </div>
      </div>

      {error && (
        <CountdownAlert
          alert={{ type: 'error', message: error }}
          onClose={() => setError('')}
          duration={10}
        />
      )}

      {/* Requests Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (<div className="py-20 text-center text-slate-400 text-xs animate-pulse">
            Loading visitor requests...
          </div>) : requests.length === 0 ? (<div className="py-16 text-center text-slate-500 text-xs italic">
            No visitor requests match the active filter.
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">{t('table.visitor', 'Visitor & Company')}</th>
                  <th className="py-3.5 px-4">{t('table.host', 'Assigned Host')}</th>
                  <th className="py-3.5 px-4">{t('table.date', 'Scheduled Date')}</th>
                  <th className="py-3.5 px-4">{t('table.purpose', 'Purpose')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.status', 'Status')}</th>
                  <th className="py-3.5 px-4 text-right">{t('table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((req) => {
                const isHostUnavail = req.host_availability !== 'AVAILABLE';
                const isPending = req.approval_status === 'PENDING';
                return (<tr key={req.id} className="hover:bg-slate-850/40 transition">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-white">{req.visitor_name}</p>
                          <p className="text-[11px] text-slate-400">{req.visitor_company || 'Independent Visitor'}</p>
                          <span className="text-[10px] text-indigo-400 font-mono mt-0.5 block">
                            #{req.reference_code || req.appointment_number}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="text-slate-200 font-medium">{req.host_name || 'Unassigned'}</p>
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${isHostUnavail
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                              {req.host_availability || 'UNAVAILABLE'}
                            </span>
                            {isHostUnavail && isPending && (<span className="text-[9px] text-amber-400 font-bold animate-pulse">
                                Reassignment Needed
                              </span>)}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-slate-200 font-medium">
                          {new Date(req.scheduled_start).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                    })}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(req.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-300">
                        {req.purpose || 'General Visit'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.approval_status === 'APPROVED'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : req.approval_status === 'REJECTED'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : req.approval_status === 'PENDING_HOST_APPROVAL'
                                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                          {req.approval_status === 'PENDING_HOST_APPROVAL' ? 'Awaiting Host' : req.approval_status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isPending && isHostUnavail ? (<button onClick={() => {
                            setModalMode('reassign');
                            handleOpenReassign(req);
                        }} className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold transition">
                              Reassign
                            </button>) : isPending ? (<button onClick={() => {
                            setModalMode('assign');
                            handleOpenReassign(req);
                        }} className="px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5"/>
                              <span>Assign / Route</span>
                            </button>) : null}
                          <button onClick={() => setSelectedRequestId(req.id)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition">
                            Dossier
                          </button>
                        </div>
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>)}
      </div>

      {/* Modals */}
      <HostReassignmentModal isOpen={reassignModalOpen} onClose={() => setReassignModalOpen(false)} request={reassignTargetRequest} onSuccess={fetchRequests} mode={modalMode}/>

      <RequestDetailsModal isOpen={!!selectedRequestId} onClose={() => setSelectedRequestId(null)} requestId={selectedRequestId} onReassignClick={(req) => {
            setSelectedRequestId(null);
            setModalMode('assign');
            handleOpenReassign(req);
        }} onApproveSuccess={fetchRequests}/>
    </div>);
}
