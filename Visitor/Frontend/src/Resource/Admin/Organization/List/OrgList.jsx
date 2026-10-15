import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit, Trash2, ShieldAlert, RotateCcw, Mail, Phone, Building, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../../services/api';
import OrganizationFilterPanel from '../Profile/components/OrganizationFilterPanel';
import OrganizationStatusBadge from '../Profile/components/OrganizationStatusBadge';
import ConfirmationDialog from '../Profile/components/ConfirmationDialog';
import RefreshButton from '../../../../components/common/RefreshButton';
import BackButton from '../../../../components/common/BackButton';
const EMPTY_FILTERS = {
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    registrationNumber: '',
};
function OrgLogoCell({ logoUrl, orgName }) {
    const [hasError, setHasError] = useState(false);
    const isValid = Boolean(logoUrl && typeof logoUrl === 'string' && logoUrl.trim().length > 0 && logoUrl !== 'null' && logoUrl !== 'undefined');
    return (<div className="h-10 w-10 rounded-lg bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 d-flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {isValid && !hasError ? (<img src={logoUrl} alt={`${orgName} logo`} className="h-full w-full object-contain p-0.5" onError={() => setHasError(true)} loading="lazy"/>) : (<Building className="h-5 w-5 text-blue-500"/>)}
    </div>);
}
export default function OrgList() {
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('ASC');
    // Pagination states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    // Archive confirmation state
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [archiving, setArchiving] = useState(false);
    const fetchOrgs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search.trim())
                params.append('name', search.trim());
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
            params.append('limit', String(limit));
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);
            const res = await api.get(`/organizations/search?${params.toString()}`);
            setOrgs(res.data.data || []);
            if (res.data.pagination) {
                setTotalCount(res.data.pagination.totalCount);
                setTotalPages(res.data.pagination.totalPages);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    }, [search, filters, page, limit, sortBy, sortOrder]);
    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
        }
        else {
            setSortBy(column);
            setSortOrder('ASC');
        }
        setPage(1); // reset to first page
    };
    const handleArchiveConfirm = async () => {
        if (!archiveTarget)
            return;
        setArchiving(true);
        try {
            await api.delete(`/organizations/${archiveTarget.id}`);
            setArchiveTarget(null);
            fetchOrgs();
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setArchiving(false);
        }
    };
    const handleNav = (viewKey, orgId) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewKey);
        if (orgId)
            params.set('orgId', String(orgId));
        window.location.search = `?${params.toString()}`;
    };
    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        }
        catch {
            return dateStr;
        }
    };
    const renderSortIcon = (column) => (<ArrowUpDown className={`h-3 w-3 ms-1 ${sortBy === column ? 'text-blue-500' : 'text-slate-400'}`}/>);
    return (<div className="space-y-6">
      {/* Confirmation Dialog for Deletion */}
      <ConfirmationDialog show={!!archiveTarget} title="Delete Organization" message={`Are you sure you want to delete "${archiveTarget?.name}"? All associated branches, departments, and operations will be soft-deleted and marked inactive.`} confirmLabel="Delete Organization" danger={true} loading={archiving} onConfirm={handleArchiveConfirm} onCancel={() => setArchiveTarget(null)}/>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin/dashboard"/>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Building className="text-blue-600 h-7 w-7"/> Organization Directory
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Directory of registered organizations, business registrations, and profile details.
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => handleNav('org_search')} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Search className="h-4.5 w-4.5"/> Advanced Search
          </button>
          <button onClick={() => handleNav('create_organization')} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Plus className="h-4.5 w-4.5"/> Register Organization
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="row g-3">
          <div className="col-12 col-md-9">
            <div className="position-relative">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4.5 w-4.5"/>
              <input type="text" className="form-control ps-5 text-xs font-semibold" placeholder="Quick search by name or code..." value={search} onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
        }}/>
            </div>
          </div>
          <div className="col-12 col-md-3 d-flex gap-2">
            <button onClick={() => {
            setFilters({ ...EMPTY_FILTERS });
            setSearch('');
            setPage(1);
        }} className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-1.5 text-xs font-bold">
              <RotateCcw className="h-4 w-4"/> Reset
            </button>
            <RefreshButton onRefresh={fetchOrgs} variant="primary" className="w-50"/>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        <OrganizationFilterPanel filters={filters} onFilterChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
        }} onClear={() => {
            setFilters({ ...EMPTY_FILTERS });
            setPage(1);
        }}/>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (<div className="p-20 text-center">
            <div className="spinner-border text-primary" role="status"/>
            <p className="text-slate-400 text-xs fw-semibold mt-3">Loading organizations...</p>
          </div>) : orgs.length === 0 ? (<div className="p-20 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs">
            No organizations registered matching criteria.
          </div>) : (<>
            <div className="table-responsive">
              <table className="table align-middle mb-0 text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-bottom border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('name')}>
                      Code / Name {renderSortIcon('name')}
                    </th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('registration_number')}>
                      Registration & Tax {renderSortIcon('registration_number')}
                    </th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Created Date</th>
                    <th className="px-4 py-3 cursor-pointer text-center" onClick={() => handleSort('status')}>
                      Status {renderSortIcon('status')}
                    </th>
                    <th className="px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orgs.map((org) => (<tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <OrgLogoCell logoUrl={org.logo_url} orgName={org.name}/>
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-0.5">
                              <p className="font-extrabold text-slate-900 dark:text-white mb-0">{org.name}</p>
                              <span className="badge bg-primary-subtle text-primary font-mono text-[9px] px-1.5 py-0.5 rounded">
                                {org.code}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">
                              {org.business_type || 'Standard Corp'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                        <p className="mb-0.5">Reg: {org.registration_number || 'N/A'}</p>
                        <p className="mb-0 text-[10px] text-slate-400">TIN: {org.tax_number || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-slate-600 dark:text-slate-300 font-semibold">
                          <div className="d-flex align-items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-slate-400"/>
                            <span>{org.email || 'N/A'}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400"/>
                            <span>{org.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">
                        {formatDate(org.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <OrganizationStatusBadge status={org.status} size="sm"/>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button onClick={() => handleNav('org_details', org.id)} className="btn btn-sm btn-outline-secondary p-1.5" title="View Profile Details">
                            <Eye className="h-4 w-4"/>
                          </button>
                          <button onClick={() => handleNav('org_edit', org.id)} className="btn btn-sm btn-outline-secondary p-1.5" title="Edit Profile">
                            <Edit className="h-4 w-4"/>
                          </button>
                          <button onClick={() => handleNav('org_status', org.id)} className="btn btn-sm btn-outline-warning p-1.5" title="Manage Status">
                            <ShieldAlert className="h-4 w-4"/>
                          </button>
                          <button onClick={() => setArchiveTarget(org)} className="btn btn-sm btn-outline-danger p-1.5" title="Delete Organization" aria-label="Delete Organization">
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (<div className="d-flex justify-content-between align-items-center p-3 border-top border-slate-200 dark:border-slate-800 text-xs">
                <div className="d-flex align-items-center gap-2 font-semibold text-slate-500 dark:text-slate-400">
                  <span>Show</span>
                  <select className="form-select form-select-sm text-xs font-semibold py-0.5 px-2" value={limit} onChange={(e) => {
                    setLimit(parseInt(e.target.value));
                    setPage(1);
                }}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>entries</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {totalCount} entries
                  </span>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-secondary p-1" disabled={page <= 1} onClick={() => setPage(prev => prev - 1)}>
                      <ChevronLeft className="h-4 w-4"/>
                    </button>
                    {Array.from({ length: totalPages }, (_, idx) => {
                    const pageNum = idx + 1;
                    return (<button key={pageNum} className={`btn btn-sm ${page === pageNum ? 'btn-primary' : 'btn-outline-secondary'} text-xs font-bold`} onClick={() => setPage(pageNum)}>
                          {pageNum}
                        </button>);
                })}
                    <button className="btn btn-sm btn-outline-secondary p-1" disabled={page >= totalPages} onClick={() => setPage(prev => prev + 1)}>
                      <ChevronRight className="h-4 w-4"/>
                    </button>
                  </div>
                </div>
              </div>)}
          </>)}
      </div>
    </div>);
}
