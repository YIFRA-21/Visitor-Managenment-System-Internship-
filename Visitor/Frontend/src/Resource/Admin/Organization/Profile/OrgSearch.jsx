import { useState, useEffect, useCallback } from 'react';
import { Search, Building, ArrowLeft, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Edit, RotateCcw } from 'lucide-react';
import api from '../../../../services/api';
import OrganizationStatusBadge from './components/OrganizationStatusBadge';
import OrganizationFilterPanel from './components/OrganizationFilterPanel';
const EMPTY_FILTERS = {
    status: '', type: '', dateFrom: '', dateTo: '', registrationNumber: '',
};
export default function OrgSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
    const [hasSearched, setHasSearched] = useState(false);
    const performSearch = useCallback(async (page = 1) => {
        setLoading(true);
        setHasSearched(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim())
                params.append('name', searchQuery.trim());
            if (filters.status)
                params.append('status', filters.status);
            if (filters.type)
                params.append('type', filters.type);
            if (filters.registrationNumber)
                params.append('registrationNumber', filters.registrationNumber);
            if (filters.dateFrom)
                params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo)
                params.append('dateTo', filters.dateTo);
            params.append('page', String(page));
            params.append('limit', String(pagination.limit));
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);
            const res = await api.get(`/organizations/search?${params.toString()}`);
            setResults(res.data.data || []);
            setPagination(res.data.pagination || { page, limit: 10, totalCount: 0, totalPages: 0 });
        }
        catch {
            setResults([]);
        }
        finally {
            setLoading(false);
        }
    }, [searchQuery, filters, sortBy, sortOrder, pagination.limit]);
    // Debounced search on filter/sort changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (hasSearched || searchQuery.trim() || Object.values(filters).some(v => v)) {
                performSearch(1);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, filters, sortBy, sortOrder]);
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
        }
        else {
            setSortBy(column);
            setSortOrder('ASC');
        }
    };
    const handleNav = (view, orgId) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', view);
        if (orgId)
            params.set('orgId', String(orgId));
        window.location.search = `?${params.toString()}`;
    };
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
            });
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
            <Search className="text-blue-600 h-7 w-7"/>
            Search Organizations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 fw-semibold">
            Find organizations by name, code, registration number, or status.
          </p>
        </div>
        <button onClick={() => handleNav('organizations')} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs fw-bold px-3 py-2">
          <ArrowLeft className="h-4 w-4"/> Back to Directory
        </button>
      </div>

      {/* Search Bar */}
      <div className="org-search-bar mb-3">
        <div className="position-relative">
          <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4.5 w-4.5"/>
          <input type="text" className="form-control ps-5 text-xs fw-semibold" placeholder="Search by organization name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && performSearch(1)}/>
        </div>
      </div>

      {/* Filter Panel */}
      <OrganizationFilterPanel filters={filters} onFilterChange={setFilters} onClear={() => setFilters({ ...EMPTY_FILTERS })}/>

      {/* Results */}
      <div className="org-search-results mt-3">
        {loading ? (<div className="p-16 text-center">
            <div className="spinner-border text-primary" role="status"/>
            <p className="text-slate-400 text-xs fw-semibold mt-3">Searching...</p>
          </div>) : !hasSearched ? (<div className="p-16 text-center">
            <Search className="h-10 w-10 text-slate-600 mx-auto mb-3"/>
            <p className="text-slate-500 text-sm fw-bold">Enter a search term or apply filters</p>
            <p className="text-slate-400 text-xs fw-semibold mt-1">Results will appear here.</p>
          </div>) : results.length === 0 ? (<div className="p-16 text-center">
            <Building className="h-10 w-10 text-slate-600 mx-auto mb-3"/>
            <p className="text-slate-500 text-sm fw-bold">No organizations found</p>
            <p className="text-slate-400 text-xs fw-semibold mt-1">
              Try adjusting your search criteria or clearing filters.
            </p>
            <button onClick={() => { setSearchQuery(''); setFilters({ ...EMPTY_FILTERS }); }} className="btn btn-sm btn-outline-primary mt-3 d-flex align-items-center gap-1 mx-auto text-xs fw-bold">
              <RotateCcw className="h-3.5 w-3.5"/> Clear Search
            </button>
          </div>) : (<>
            {/* Results count */}
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <span className="text-xs text-slate-500 fw-semibold">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} results
              </span>
            </div>

            {/* Table */}
            <div className="table-responsive bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="table align-middle mb-0 text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-bottom border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] fw-bold">
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('name')}>
                      Organization {renderSortIcon('name')}
                    </th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('code')}>
                      Code {renderSortIcon('code')}
                    </th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('registration_number')}>
                      Reg. Number {renderSortIcon('registration_number')}
                    </th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('status')}>
                      Status {renderSortIcon('status')}
                    </th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('created_at')}>
                      Created {renderSortIcon('created_at')}
                    </th>
                    <th className="px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((org) => (<tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800 text-blue-600 d-flex align-items-center justify-content-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            {(org.logo_url || org.logoUrl) ? (<img src={org.logo_url || org.logoUrl} alt={org.name} className="h-full w-full object-contain p-0.5" onError={(e) => {
                        e.target.style.display = 'none';
                    }}/>) : (<Building className="h-4 w-4 text-blue-500"/>)}
                          </div>
                          <span className="fw-bold text-slate-900 dark:text-white">{org.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-primary-subtle text-primary font-monospace text-[9px] px-1.5 py-0.5 rounded">
                          {org.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 fw-semibold text-slate-600 dark:text-slate-300">
                        {org.registration_number || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <OrganizationStatusBadge status={org.status || 'ACTIVE'} size="sm"/>
                      </td>
                      <td className="px-4 py-3 fw-semibold text-slate-500 dark:text-slate-400">
                        {formatDate(org.created_at)}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button onClick={() => handleNav('org_details', org.id)} className="btn btn-sm btn-outline-secondary p-1.5" title="View Details">
                            <Eye className="h-4 w-4"/>
                          </button>
                          <button onClick={() => handleNav('org_edit', org.id)} className="btn btn-sm btn-outline-secondary p-1.5" title="Edit Profile">
                            <Edit className="h-4 w-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (<div className="org-search-pagination mt-3">
                <button className="btn btn-sm btn-outline-secondary" disabled={pagination.page <= 1} onClick={() => performSearch(pagination.page - 1)}>
                  <ChevronLeft className="h-4 w-4"/>
                </button>
                <div className="d-flex align-items-center gap-1">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (<button key={pageNum} className={`btn btn-sm ${pageNum === pagination.page ? 'btn-primary' : 'btn-outline-secondary'} text-xs fw-bold`} onClick={() => performSearch(pageNum)}>
                        {pageNum}
                      </button>);
                })}
                </div>
                <button className="btn btn-sm btn-outline-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => performSearch(pagination.page + 1)}>
                  <ChevronRight className="h-4 w-4"/>
                </button>
              </div>)}
          </>)}
      </div>
    </div>);
}
