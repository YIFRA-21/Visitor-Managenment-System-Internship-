import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, GitBranch, RotateCcw, RefreshCw, Download, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../../../services/api';
import BranchTable from './components/BranchTable';
import ConfirmationDialog from '../Profile/components/ConfirmationDialog';
export default function BranchList() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('branchName');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    // Archive confirmation
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [archiving, setArchiving] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    // Track INACTIVE organization names to exclude branches from INACTIVE orgs
    const [inactiveOrgNames, setInactiveOrgNames] = useState(new Set());
    const activeFilterCount = [filterStatus, filterType, filterCity, filterCountry].filter(Boolean).length;
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
    const fetchBranches = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search.trim())
                params.append('name', search.trim());
            if (filterStatus)
                params.append('status', filterStatus);
            if (filterType)
                params.append('type', filterType);
            if (filterCity)
                params.append('city', filterCity);
            if (filterCountry)
                params.append('country', filterCountry);
            params.append('page', String(page));
            params.append('limit', String(limit));
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);
            const res = await api.get(`/branches/search?${params.toString()}`);
            const allBranches = res.data.data || [];
            // Exclude branches explicitly belonging to INACTIVE organizations
            const filteredBranches = inactiveOrgNames.size > 0
                ? allBranches.filter(b => {
                    const orgName = (b.organizationName || '').trim();
                    return !orgName || !inactiveOrgNames.has(orgName);
                })
                : allBranches;
            setBranches(filteredBranches);
            if (res.data.pagination) {
                // Adjust count to reflect filtered results
                const removed = allBranches.length - filteredBranches.length;
                setTotalCount(Math.max(0, res.data.pagination.totalCount - removed));
                setTotalPages(res.data.pagination.totalPages);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    }, [search, filterStatus, filterType, filterCity, filterCountry, page, limit, sortBy, sortOrder, inactiveOrgNames]);
    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
        }
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
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            await api.delete(`/branches/${archiveTarget.id}`);
            const deletedName = archiveTarget.branchName;
            setArchiveTarget(null);
            setSuccessMessage(`Branch "${deletedName}" was deleted successfully.`);
            fetchBranches();
            setTimeout(() => setSuccessMessage(null), 4000);
        }
        catch (err) {
            console.error(err);
            setErrorMessage(err?.response?.data?.message || 'Failed to delete branch. Please try again.');
        }
        finally {
            setArchiving(false);
        }
    };
    const clearFilters = () => {
        setFilterStatus('');
        setFilterType('');
        setFilterCity('');
        setFilterCountry('');
        setSearch('');
        setPage(1);
    };
    const handleNav = (viewKey, branchId) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewKey);
        if (branchId)
            params.set('branchId', String(branchId));
        else
            params.delete('branchId');
        window.location.search = `?${params.toString()}`;
    };
    return (<div className="space-y-6">
      {/* Delete Confirmation */}
      <ConfirmationDialog show={!!archiveTarget} title="Delete Branch" message={`Are you sure you want to delete "${archiveTarget?.branchName}"? This branch and its associations will be removed.`} confirmLabel="Delete Branch" danger={true} loading={archiving} onConfirm={handleArchiveConfirm} onCancel={() => {
            setArchiveTarget(null);
            setErrorMessage(null);
        }}/>

      {/* Notifications */}
      {successMessage && (<div className="alert alert-success d-flex align-items-center justify-content-between p-3 rounded-lg text-xs font-semibold mb-3">
          <span>{successMessage}</span>
          <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}/>
        </div>)}
      {errorMessage && (<div className="alert alert-danger d-flex align-items-center justify-content-between p-3 rounded-lg text-xs font-semibold mb-3">
          <span>{errorMessage}</span>
          <button type="button" className="btn-close" onClick={() => setErrorMessage(null)}/>
        </div>)}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
            <GitBranch className="text-blue-600 h-7 w-7"/> Branch Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Corporate physical locations, campuses, and office sites across all organizations.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => handleNav('branch_search')} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Search className="h-4 w-4"/> Advanced Search
          </button>
          <button onClick={() => handleNav('branch_statistics')} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Download className="h-4 w-4"/> Statistics
          </button>
          <button onClick={() => handleNav('branch_create')} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Plus className="h-4 w-4"/> Register Branch
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="row g-3">
          <div className="col-12 col-md-8">
            <div className="position-relative">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4.5 w-4.5"/>
              <input type="text" className="form-control ps-5 text-xs font-semibold" placeholder="Quick search by branch name or code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}/>
            </div>
          </div>
          <div className="col-12 col-md-4 d-flex gap-2">
            <button onClick={clearFilters} className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-1.5 text-xs font-bold">
              <RotateCcw className="h-4 w-4"/> Reset
            </button>
            <button onClick={fetchBranches} className="btn btn-primary w-50 d-flex align-items-center justify-content-center gap-1.5 text-xs font-bold">
              <RefreshCw className="h-4 w-4"/> Refresh
            </button>
          </div>
        </div>

        {/* Collapsible Filters */}
        <div className="org-filter-panel">
          <button className="org-filter-panel__toggle" onClick={() => setShowFilters(!showFilters)}>
            <div className="d-flex align-items-center gap-2 text-xs fw-bold">
              <Filter className="h-4 w-4"/> Advanced Filters
              {activeFilterCount > 0 && (<span className="org-filter-panel__count">{activeFilterCount}</span>)}
            </div>
            {showFilters ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
          </button>

          {showFilters && (<div className="org-filter-panel__body">
              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label className="form-label text-xxs font-bold uppercase text-slate-400">Status</label>
                  <select className="form-select text-xs font-semibold" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label text-xxs font-bold uppercase text-slate-400">Branch Type</label>
                  <select className="form-select text-xs font-semibold" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
                    <option value="">All Types</option>
                    <option value="HEADQUARTERS">Headquarters</option>
                    <option value="OFFICE">Office</option>
                    <option value="CAMPUS">Campus</option>
                    <option value="RETAIL">Retail</option>
                    <option value="WAREHOUSE">Warehouse</option>
                  </select>
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label text-xxs font-bold uppercase text-slate-400">City</label>
                  <input type="text" className="form-control text-xs font-semibold" placeholder="Filter by city..." value={filterCity} onChange={(e) => { setFilterCity(e.target.value); setPage(1); }}/>
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label text-xxs font-bold uppercase text-slate-400">Country</label>
                  <input type="text" className="form-control text-xs font-semibold" placeholder="Filter by country..." value={filterCountry} onChange={(e) => { setFilterCountry(e.target.value); setPage(1); }}/>
                </div>
              </div>
            </div>)}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (<div className="p-20 text-center">
            <div className="spinner-border text-primary" role="status"/>
            <p className="text-slate-400 text-xs fw-semibold mt-3">Loading branches...</p>
          </div>) : branches.length === 0 ? (<div className="p-20 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs">
            <GitBranch className="h-10 w-10 text-slate-300 mx-auto mb-3"/>
            <p className="fw-bold text-sm">No branch locations found</p>
            <p className="text-slate-400 mt-1">Try adjusting your search criteria or clearing filters.</p>
          </div>) : (<>
            <BranchTable branches={branches} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} onView={(id) => handleNav('branch_details', id)} onEdit={(id) => handleNav('branch_edit', id)} onStatus={(id) => handleNav('branch_status', id)} onDelete={(b) => setArchiveTarget(b)}/>

            {/* Pagination */}
            {totalPages > 1 && (<div className="d-flex justify-content-between align-items-center p-3 border-top border-slate-200 dark:border-slate-800 text-xs">
                <div className="d-flex align-items-center gap-2 font-semibold text-slate-500">
                  <span>Show</span>
                  <select className="form-select form-select-sm text-xs font-semibold py-0.5 px-2" value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                  <span>entries</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="font-semibold text-slate-500">
                    {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {totalCount}
                  </span>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-secondary p-1" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4"/>
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pn => (<button key={pn} className={`btn btn-sm ${page === pn ? 'btn-primary' : 'btn-outline-secondary'} text-xs font-bold`} onClick={() => setPage(pn)}>
                        {pn}
                      </button>))}
                    <button className="btn btn-sm btn-outline-secondary p-1" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4"/>
                    </button>
                  </div>
                </div>
              </div>)}
          </>)}
      </div>
    </div>);
}
