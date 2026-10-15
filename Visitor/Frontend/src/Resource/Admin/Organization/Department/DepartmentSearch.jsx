import { useState, useEffect, useCallback } from 'react';
import { Search, Network, ArrowLeft, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Edit, RotateCcw, Filter, ChevronDown, ChevronUp, GitBranch } from 'lucide-react';
import api from '../../../../services/api';
import DepartmentStatusBadge from './components/DepartmentStatusBadge';
export default function DepartmentSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState('departmentName');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [hasSearched, setHasSearched] = useState(false);
    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterOrgId, setFilterOrgId] = useState('');
    const [filterBranchId, setFilterBranchId] = useState('');
    const activeFilterCount = [filterStatus, filterType, filterOrgId, filterBranchId].filter(Boolean).length;
    const performSearch = useCallback(async (page = 1) => {
        setLoading(true);
        setHasSearched(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim())
                params.append('name', searchQuery.trim());
            if (filterStatus)
                params.append('status', filterStatus);
            if (filterType)
                params.append('type', filterType);
            if (filterOrgId)
                params.append('organizationId', filterOrgId);
            if (filterBranchId)
                params.append('branchId', filterBranchId);
            params.append('page', String(page));
            params.append('limit', String(pagination.limit));
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);
            const res = await api.get(`/departments/search?${params.toString()}`);
            setResults(res.data.data || []);
            setPagination(res.data.pagination || { page, limit: 10, totalCount: 0, totalPages: 0 });
        }
        catch {
            setResults([]);
        }
        finally {
            setLoading(false);
        }
    }, [searchQuery, filterStatus, filterType, filterOrgId, filterBranchId, sortBy, sortOrder, pagination.limit]);
    useEffect(() => {
        const timer = setTimeout(() => {
            if (hasSearched || searchQuery.trim() || activeFilterCount > 0) {
                performSearch(1);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, filterStatus, filterType, filterOrgId, filterBranchId, sortBy, sortOrder]);
    const handleSort = (column) => {
        if (sortBy === column)
            setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
        else {
            setSortBy(column);
            setSortOrder('ASC');
        }
    };
    const handleNav = (view, deptId) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', view);
        if (deptId)
            params.set('deptId', String(deptId));
        window.location.search = `?${params.toString()}`;
    };
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        catch {
            return dateStr;
        }
    };
    const renderSortIcon = (column) => (<ArrowUpDown className={`h-3 w-3 ms-1 ${sortBy === column ? 'text-blue-500' : 'text-slate-400'}`}/>);
    return (<div className="org-search-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
            <Search className="text-indigo-600 h-7 w-7"/> Search Departments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 fw-semibold">
            Find departments by code, name, organization, branch, or category type.
          </p>
        </div>
        <button onClick={() => handleNav('departments_mgmt')} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs fw-bold px-3 py-2">
          <ArrowLeft className="h-4 w-4"/> Back to Directory
        </button>
      </div>

      {/* Search Input */}
      <div className="org-search-bar mb-3">
        <div className="position-relative">
          <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4.5 w-4.5"/>
          <input type="text" className="form-control ps-5 text-xs fw-semibold" placeholder="Search by department name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && performSearch(1)}/>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="org-filter-panel mb-3">
        <button className="org-filter-panel__toggle" onClick={() => setShowFilters(!showFilters)}>
          <div className="d-flex align-items-center gap-2 text-xs fw-bold">
            <Filter className="h-4 w-4"/> Filters
            {activeFilterCount > 0 && <span className="org-filter-panel__count">{activeFilterCount}</span>}
          </div>
          {showFilters ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
        </button>
        {showFilters && (<div className="org-filter-panel__body">
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label text-xxs font-bold uppercase text-slate-400">Status</label>
                <select className="form-select text-xs font-semibold" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-xxs font-bold uppercase text-slate-400">Type</label>
                <select className="form-select text-xs font-semibold" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="">All</option>
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
              <div className="col-12 col-md-3">
                <label className="form-label text-xxs font-bold uppercase text-slate-400">Organization ID</label>
                <input type="text" className="form-control text-xs font-semibold" placeholder="Org ID..." value={filterOrgId} onChange={(e) => setFilterOrgId(e.target.value)}/>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-xxs font-bold uppercase text-slate-400">Branch ID</label>
                <input type="text" className="form-control text-xs font-semibold" placeholder="Branch ID..." value={filterBranchId} onChange={(e) => setFilterBranchId(e.target.value)}/>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button onClick={() => { setFilterStatus(''); setFilterType(''); setFilterOrgId(''); setFilterBranchId(''); setSearchQuery(''); }} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 text-xs fw-bold">
                <RotateCcw className="h-3.5 w-3.5"/> Clear All
              </button>
            </div>
          </div>)}
      </div>

      {/* Results */}
      <div className="org-search-results">
        {loading ? (<div className="p-16 text-center"><div className="spinner-border text-primary" role="status"/><p className="text-slate-400 text-xs fw-semibold mt-3">Searching...</p></div>) : !hasSearched ? (<div className="p-16 text-center"><Search className="h-10 w-10 text-slate-600 mx-auto mb-3"/><p className="text-slate-500 text-sm fw-bold">Enter a search term or apply filters</p></div>) : results.length === 0 ? (<div className="p-16 text-center"><Network className="h-10 w-10 text-slate-600 mx-auto mb-3"/><p className="text-slate-500 text-sm fw-bold">No departments found</p><p className="text-slate-400 text-xs fw-semibold mt-1">Try adjusting your search criteria.</p></div>) : (<>
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <span className="text-xs text-slate-500 fw-semibold">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
              </span>
            </div>

            <div className="table-responsive bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="table align-middle mb-0 text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-bottom border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] fw-bold">
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('departmentName')}>Department {renderSortIcon('departmentName')}</th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('branchName')}>Branch {renderSortIcon('branchName')}</th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('departmentType')}>Type {renderSortIcon('departmentType')}</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 cursor-pointer text-center" onClick={() => handleSort('status')}>Status {renderSortIcon('status')}</th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('created_at')}>Created {renderSortIcon('created_at')}</th>
                    <th className="px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((d) => (<tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="h-8 w-8 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 d-flex align-items-center justify-content-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                            <Network className="h-4 w-4"/>
                          </div>
                          <div>
                            <span className="fw-bold text-slate-900 dark:text-white d-block">{d.departmentName}</span>
                            <span className="badge bg-primary-subtle text-primary font-monospace text-[9px] px-1.5 py-0.5 rounded">{d.departmentCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                          <GitBranch className="h-3 w-3 text-slate-400"/>
                          <span>{d.branchName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded">{d.departmentType || 'OTHER'}</span></td>
                      <td className="px-4 py-3 fw-semibold text-slate-600 dark:text-slate-300">{d.officeLocation || 'N/A'}</td>
                      <td className="px-4 py-3 text-center"><DepartmentStatusBadge status={d.status} size="sm"/></td>
                      <td className="px-4 py-3 fw-semibold text-slate-500">{formatDate(d.created_at)}</td>
                      <td className="px-4 py-3 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button onClick={() => handleNav('dept_details', d.id)} className="btn btn-sm btn-outline-secondary p-1.5" title="View"><Eye className="h-4 w-4"/></button>
                          <button onClick={() => handleNav('dept_edit', d.id)} className="btn btn-sm btn-outline-secondary p-1.5" title="Edit"><Edit className="h-4 w-4"/></button>
                        </div>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (<div className="org-search-pagination mt-3">
                <button className="btn btn-sm btn-outline-secondary" disabled={pagination.page <= 1} onClick={() => performSearch(pagination.page - 1)}><ChevronLeft className="h-4 w-4"/></button>
                <div className="d-flex align-items-center gap-1">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(pn => (<button key={pn} className={`btn btn-sm ${pn === pagination.page ? 'btn-primary' : 'btn-outline-secondary'} text-xs fw-bold`} onClick={() => performSearch(pn)}>{pn}</button>))}
                </div>
                <button className="btn btn-sm btn-outline-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => performSearch(pagination.page + 1)}><ChevronRight className="h-4 w-4"/></button>
              </div>)}
          </>)}
      </div>
    </div>);
}
