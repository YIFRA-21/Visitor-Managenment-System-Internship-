import { useState, useEffect, useCallback } from 'react';
import { Search, Building2, GitBranch, Network, ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import api from '../../../../services/api';
import HierarchyFilterPanel from './components/HierarchyFilterPanel';
export default function HierarchySearch() {
    const [results, setResults] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ name: '', code: '', nodeType: 'ALL', status: 'ALL' });
    const fetchResults = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '10');
            if (filters.name)
                params.set('name', filters.name);
            if (filters.code)
                params.set('code', filters.code);
            if (filters.nodeType !== 'ALL')
                params.set('nodeType', filters.nodeType);
            if (filters.status !== 'ALL')
                params.set('status', filters.status);
            const res = await api.get(`/hierarchy/search?${params.toString()}`);
            setResults(res.data.data || []);
            setPagination(res.data.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 0 });
        }
        catch (err) {
            console.error(err);
            setResults([]);
        }
        finally {
            setLoading(false);
        }
    }, [filters]);
    useEffect(() => { fetchResults(1); }, [filters]);
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const resetFilters = () => {
        setFilters({ name: '', code: '', nodeType: 'ALL', status: 'ALL' });
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case 'ORGANIZATION': return <Building2 className="h-4 w-4 text-blue-500"/>;
            case 'BRANCH': return <GitBranch className="h-4 w-4 text-amber-500"/>;
            case 'DEPARTMENT': return <Network className="h-4 w-4 text-indigo-500"/>;
            default: return null;
        }
    };
    const getTypeBadge = (type) => {
        switch (type) {
            case 'ORGANIZATION': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200';
            case 'BRANCH': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200';
            case 'DEPARTMENT': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };
    return (<div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
          <Search className="text-purple-500 h-6 w-6"/> Hierarchy Search
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
          Multi-criteria search across all organizational units (Organizations, Branches, Departments).
        </p>
      </div>

      {/* Filter Panel */}
      <HierarchyFilterPanel filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters}/>

      {/* Results Table */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr>
                <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-3">ID</th>
                <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-3">Name</th>
                <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-3">Code</th>
                <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-3">Type</th>
                <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-3">Level</th>
                <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-3">Organization</th>
                <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr><td colSpan={7} className="text-center py-10 text-slate-400 font-semibold"><div className="spinner-border spinner-border-sm text-primary me-2"/>Searching...</td></tr>) : results.length === 0 ? (<tr><td colSpan={7} className="text-center py-10 text-slate-400 font-semibold">No hierarchy nodes match your search criteria.</td></tr>) : (results.map((node) => (<tr key={node.id} className="border-bottom dark:border-slate-800">
                    <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-300"><Hash className="h-3 w-3 inline me-1 text-slate-400"/>{node.numericId}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">{node.name}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-600 dark:text-slate-300">{node.code}</td>
                    <td className="px-4 py-3">
                      <span className={`badge border text-[10px] font-bold px-2 py-0.5 rounded d-flex align-items-center gap-1 w-fit ${getTypeBadge(node.nodeType)}`}>
                        {getTypeIcon(node.nodeType)} {node.nodeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">L{node.level}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{node.organizationName}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] font-bold px-2 py-0.5 rounded-full ${(node.status || '').toUpperCase() === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                        {(node.status || '').toUpperCase() === 'ACTIVE' ? <ShieldCheck className="h-3 w-3 inline me-0.5"/> : <ShieldAlert className="h-3 w-3 inline me-0.5"/>}
                        {node.status}
                      </span>
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (<div className="d-flex justify-content-between align-items-center px-4 py-3 border-top dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-xxs font-bold text-slate-400">
              Page {pagination.page} of {pagination.totalPages} • {pagination.totalCount} total results
            </span>
            <div className="d-flex gap-1">
              <button onClick={() => fetchResults(pagination.page - 1)} disabled={pagination.page <= 1} className="btn btn-outline-secondary btn-sm text-xxs font-bold px-2 py-1">
                <ChevronLeft className="h-3 w-3"/>
              </button>
              <button onClick={() => fetchResults(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="btn btn-outline-secondary btn-sm text-xxs font-bold px-2 py-1">
                <ChevronRight className="h-3 w-3"/>
              </button>
            </div>
          </div>)}
      </div>
    </div>);
}
