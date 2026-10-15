import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import api from '../../../../services/api';
export default function CalendarSearch({ onNotify }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    // Filters
    const [name, setName] = useState('');
    const [type, setType] = useState('ALL');
    const [status, setStatus] = useState('ALL');
    const [page, setPage] = useState(1);
    const fetchResults = async () => {
        setLoading(true);
        try {
            const res = await api.get('/calendar/holidays', {
                params: {
                    organizationId: 1,
                    type: type === 'ALL' ? undefined : type,
                    status: status === 'ALL' ? undefined : status
                }
            });
            // Client-side filter for name
            let filtered = res.data || [];
            if (name) {
                filtered = filtered.filter((h) => h.name.toLowerCase().includes(name.toLowerCase()));
            }
            setResults(filtered);
        }
        catch {
            onNotify('Failed to query calendar database.', 'danger');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchResults();
    }, [type, status]);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchResults();
    };
    // Simple slice pagination
    const perPage = 5;
    const totalPages = Math.ceil(results.length / perPage) || 1;
    const paginatedResults = results.slice((page - 1) * perPage, page * perPage);
    return (<div className="space-y-4">
      {/* Search Filters Bar */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
          <div className="col-12 col-md-4">
            <label className="form-label text-xxs font-bold uppercase text-slate-400">Search Holiday / Closure Name</label>
            <div className="input-group">
              <input type="text" className="form-control text-xs font-semibold" placeholder="e.g. Christmas, Flood..." value={name} onChange={(e) => setName(e.target.value)}/>
              <button type="submit" className="btn btn-primary btn-sm">
                <Search className="h-4 w-4"/>
              </button>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label text-xxs font-bold uppercase text-slate-400">Exemption Category</label>
            <select className="form-select text-xs font-semibold" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
              <option value="ALL">All Categories</option>
              <option value="PUBLIC">Public Holiday</option>
              <option value="ORGANIZATION">Organization Holiday</option>
              <option value="BRANCH">Branch Override Closure</option>
              <option value="EMERGENCY">Emergency Closure</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label text-xxs font-bold uppercase text-slate-400">Operational Status</label>
            <select className="form-select text-xs font-semibold" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Closures</option>
              <option value="INACTIVE">Archived / Inactive</option>
            </select>
          </div>

          <div className="col-12 col-md-2 d-flex align-items-end pt-md-4">
            <button type="button" onClick={fetchResults} className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-2 font-bold">
              <SlidersHorizontal className="h-4 w-4"/> Refine
            </button>
          </div>
        </form>
      </div>

      {/* Grid Table Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        {loading ? (<div className="p-16 text-center">
            <div className="spinner-border text-primary" role="status"/>
            <p className="text-slate-400 text-xs fw-semibold mt-3">Searching calendar database...</p>
          </div>) : paginatedResults.length === 0 ? (<div className="p-16 text-center text-slate-400 font-semibold text-xs">
            No calendar entries match the specified filter keys.
          </div>) : (<>
            <div className="table-responsive">
              <table className="table align-middle text-xs mb-0">
                <thead>
                  <tr className="text-slate-500 uppercase font-bold text-[9px]">
                    <th>Date Mapped</th>
                    <th>Entry Description</th>
                    <th>Closure Category</th>
                    <th>Scope Settings</th>
                    <th>Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-350">
                  {paginatedResults.map((r) => (<tr key={r.id}>
                      <td className="font-extrabold text-slate-900 dark:text-white py-3">
                        {new Date(r.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                      </td>
                      <td>{r.name}</td>
                      <td>
                        <span className={`badge ${r.type === 'PUBLIC' ? 'bg-primary-subtle text-primary' :
                    r.type === 'ORGANIZATION' ? 'bg-purple-subtle text-purple' :
                        r.type === 'BRANCH' ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'} text-[9px] uppercase px-2 py-0.5 rounded font-bold`}>
                          {r.type}
                        </span>
                      </td>
                      <td>{r.appliesTo === 'ALL' ? 'Organization Wide' : `Branch ID: ${r.branchId}`}</td>
                      <td>
                        <span className={`badge ${r.status === 'ACTIVE' ? 'bg-success-subtle text-success' : 'bg-slate-200 text-slate-500'} text-[9px] uppercase px-2 py-0.5 rounded font-bold`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="d-flex justify-content-between align-items-center border-top pt-4 dark:border-slate-800">
              <span className="text-[10px] text-slate-550 dark:text-slate-400 font-bold">
                Showing page {page} of {totalPages} ({results.length} total entries)
              </span>
              <div className="d-flex gap-1">
                <button onClick={() => setPage(Math.max(page - 1, 1))} disabled={page === 1} className="btn btn-xs btn-outline-secondary p-1">
                  <ChevronLeft className="h-4 w-4"/>
                </button>
                <button onClick={() => setPage(Math.min(page + 1, totalPages))} disabled={page === totalPages} className="btn btn-xs btn-outline-secondary p-1">
                  <ChevronRight className="h-4 w-4"/>
                </button>
              </div>
            </div>
          </>)}
      </div>
    </div>);
}
