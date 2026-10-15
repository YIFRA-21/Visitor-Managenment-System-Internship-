import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Network, RotateCcw, RefreshCw, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../../../services/api';
import DepartmentTable from './components/DepartmentTable';
import ConfirmationDialog from '../Profile/components/ConfirmationDialog';
export default function DepartmentList() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterOrgId, setFilterOrgId] = useState('');
    const [filterBranchId, setFilterBranchId] = useState('');
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [archiving, setArchiving] = useState(false);
    // Track INACTIVE organization names to exclude departments from INACTIVE orgs
    const [inactiveOrgNames, setInactiveOrgNames] = useState(new Set());
    const activeFilterCount = [filterStatus, filterType, filterOrgId, filterBranchId].filter(Boolean).length;
    // On mount: fetch all organizations to identify INACTIVE ones
    useEffect(() => {
        async function loadOrgStatuses() {
            try {
                const res = await api.get('/organizations/public');
                const orgList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                const inactiveNames = new Set();
                orgList.forEach((org) => {
                    if ((org.status || '').toUpperCase() === 'INACTIVE') {
                        if (org.name)
                            inactiveNames.add(org.name.trim());
                        if (org.organization_name)
                            inactiveNames.add(org.organization_name.trim());
                    }
                });
                setInactiveOrgNames(inactiveNames);
            }
            catch (err) {
                console.warn('Could not fetch organizations for filtering:', err);
            }
        }
        loadOrgStatuses();
    }, []);
    const fetchDepartments = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search.trim())
                params.append('name', search.trim());
            if (filterStatus)
                params.append('status', filterStatus);
            if (filterType)
                params.append('type', filterType);
            if (filterOrgId)
                params.append('organizationId', filterOrgId);
            if (filterBranchId)
                params.append('branchId', filterBranchId);
            params.append('page', String(page));
            params.append('limit', String(limit));
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);
            const res = await api.get(`/departments/search?${params.toString()}`);
            const allDepts = res.data.data || [];
            // Exclude departments explicitly belonging to INACTIVE organizations
            const filteredDepts = inactiveOrgNames.size > 0
                ? allDepts.filter((d) => {
                    const orgName = (d.organizationName || d.organization_name || '').trim();
                    return !orgName || !inactiveOrgNames.has(orgName);
                })
                : allDepts;
            setDepartments(filteredDepts);
            if (res.data.pagination) {
                const removed = allDepts.length - filteredDepts.length;
                setTotalCount(Math.max(0, res.data.pagination.totalCount - removed));
                setTotalPages(res.data.pagination.totalPages);
            }
        }
        catch {
            setDepartments([]);
        }
        finally {
            setLoading(false);
        }
    }, [search, filterStatus, filterType, filterOrgId, filterBranchId, page, limit, sortBy, sortOrder, inactiveOrgNames]);
    useEffect(() => { fetchDepartments(); }, [fetchDepartments]);
    const handleSort = (column) => {
        if (sortBy === column)
            setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
        else {
            setSortBy(column);
            setSortOrder('ASC');
        }
        setPage(1);
    };
    const handleArchiveConfirm = async () => {
        if (!archiveTarget)
            return;
        setArchiving(true);
        try {
            await api.delete(`/departments/${archiveTarget.id}`);
            setArchiveTarget(null);
            fetchDepartments();
        }
        catch { /* handled */ }
        finally {
            setArchiving(false);
        }
    };
    const clearFilters = () => {
        setFilterStatus('');
        setFilterType('');
        setFilterOrgId('');
        setFilterBranchId('');
        setSearch('');
        setPage(1);
    };
    const handleNav = (viewKey, deptId) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewKey);
        if (deptId)
            params.set('deptId', String(deptId));
        else
            params.delete('deptId');
        window.location.search = `?${params.toString()}`;
    };
    const handleToggleStatus = async (dept) => {
        try {
            const nextStatus = (dept.status || '').toUpperCase() === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
            await api.patch(`/departments/${dept.id}/status`, {
                status: nextStatus,
                reason: `Status changed to ${nextStatus}`,
            });
            fetchDepartments();
        }
        catch (err) {
            console.error('Failed to toggle department status:', err);
        }
    };
    return (<div className="space-y-6">
      <ConfirmationDialog show={!!archiveTarget} title="Delete Department" message={`Are you sure you want to delete "${archiveTarget?.departmentName}"? This department will be removed from active operations.`} confirmLabel="Delete Department" danger={true} loading={archiving} onConfirm={handleArchiveConfirm} onCancel={() => setArchiveTarget(null)}/>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
            <Network className="text-indigo-600 h-7 w-7"/> Department Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Corporate divisions, operational units, and organizational departments.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button onClick={() => handleNav('dept_search')} className="btn btn-outline-secondary btn-sm text-xs font-semibold d-flex align-items-center gap-1.5 py-2 px-3">
            <Search className="h-4 w-4"/> Advanced Search
          </button>
          <button onClick={() => handleNav('dept_stats')} className="btn btn-outline-secondary btn-sm text-xs font-semibold d-flex align-items-center gap-1.5 py-2 px-3">
            <RotateCcw className="h-4 w-4"/> Statistics
          </button>
          <button onClick={() => handleNav('dept_create')} className="btn btn-primary btn-sm text-xs font-bold d-flex align-items-center gap-1.5 py-2 px-3 shadow">
            <Plus className="h-4 w-4"/> Create Department
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {/* Search & Filters Bar */}
        <div className="p-4 border-bottom border-slate-200 dark:border-slate-800 space-y-3">
          <div className="d-flex gap-2">
            <div className="position-relative flex-grow-1">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 h-4 w-4 text-slate-400"/>
              <input type="text" className="form-control form-control-sm ps-5 text-xs font-semibold" placeholder="Quick search by department name or code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}/>
            </div>
            <button onClick={() => setShowFilters(prev => !prev)} className={`btn btn-sm d-flex align-items-center gap-1.5 text-xs font-semibold ${activeFilterCount > 0 ? 'btn-primary' : 'btn-outline-secondary'}`}>
              <Filter className="h-4 w-4"/> Advanced Filters {activeFilterCount > 0 && <span className="badge bg-white text-primary rounded-pill ms-1">{activeFilterCount}</span>}
              {showFilters ? <ChevronUp className="h-3.5 w-3.5"/> : <ChevronDown className="h-3.5 w-3.5"/>}
            </button>
            {activeFilterCount > 0 && (<button onClick={clearFilters} className="btn btn-sm btn-outline-secondary text-xs font-semibold d-flex align-items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5"/> Reset
              </button>)}
            <button onClick={fetchDepartments} className="btn btn-sm btn-outline-primary text-xs font-semibold d-flex align-items-center gap-1">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/> Refresh
            </button>
          </div>

          {/* Expandable Filter Panel */}
          {showFilters && (<div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="row g-3">
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label font-bold text-xxs uppercase text-slate-400">Status</label>
                  <select className="form-select form-select-sm text-xs font-semibold" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label font-bold text-xxs uppercase text-slate-400">Type</label>
                  <select className="form-select form-select-sm text-xs font-semibold" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
                    <option value="">All Types</option>
                    <option value="ADMINISTRATIVE">Administrative</option>
                    <option value="TECHNICAL">Technical</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="SUPPORT">Support</option>
                    <option value="FINANCE">Finance</option>
                    <option value="HR">HR</option>
                    <option value="LEGAL">Legal</option>
                    <option value="EXECUTIVE">Executive</option>
                  </select>
                </div>
              </div>
            </div>)}
        </div>

        {/* Table / Loading / Empty */}
        {loading ? (<div className="p-12 text-center">
            <div className="spinner-border text-primary spinner-border-sm" role="status"/>
            <p className="text-slate-400 text-xs font-semibold mt-2">Loading departments...</p>
          </div>) : departments.length === 0 ? (<div className="p-12 text-center">
            <Network className="h-10 w-10 text-slate-300 mx-auto mb-3"/>
            <h5 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">No departments found</h5>
            <p className="text-slate-400 text-xs mt-1 font-semibold">Try adjusting your search criteria or clearing filters.</p>
          </div>) : (<>
            <DepartmentTable departments={departments} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} onView={(id) => handleNav('dept_details', id)} onEdit={(id) => handleNav('dept_edit', id)} onStatus={(id) => handleNav('dept_status', id)} onToggleStatus={handleToggleStatus} onDelete={(dept) => setArchiveTarget(dept)}/>
            {totalPages > 1 && (<div className="d-flex justify-content-between align-items-center p-3 border-top border-slate-200 dark:border-slate-800 text-xs">
                <div className="d-flex align-items-center gap-2 font-semibold text-slate-500">
                  <span>Show</span>
                  <select className="form-select form-select-sm text-xs font-semibold py-0.5 px-2" value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}>
                    <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option>
                  </select>
                  <span>entries</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="font-semibold text-slate-500">{((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {totalCount}</span>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-secondary p-1" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4"/></button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pn => (<button key={pn} className={`btn btn-sm ${page === pn ? 'btn-primary' : 'btn-outline-secondary'} text-xs font-bold`} onClick={() => setPage(pn)}>{pn}</button>))}
                    <button className="btn btn-sm btn-outline-secondary p-1" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4"/></button>
                  </div>
                </div>
              </div>)}
          </>)}
      </div>
    </div>);
}
