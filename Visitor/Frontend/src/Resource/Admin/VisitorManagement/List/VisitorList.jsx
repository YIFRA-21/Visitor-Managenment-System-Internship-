import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { visitorProfileApi } from '../../../../modules/visitor-management/api/visitorProfileApi';
import { useLanguage } from '../../../../contexts/LanguageContext';
export default function VisitorList() {
    const { t, tStatus } = useLanguage();
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const fetchVisitors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await visitorProfileApi.getDirectory({
                search: searchTerm.trim() || undefined,
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
                limit: 100,
            });
            if (res && Array.isArray(res.data)) {
                setVisitors(res.data);
            }
            else {
                setVisitors([]);
            }
        }
        catch (err) {
            console.error('Failed to load visitor directory:', err);
            setVisitors([]);
        }
        finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter]);
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVisitors();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchVisitors]);
    const filteredVisitors = useMemo(() => {
        return visitors.filter((v) => {
            const categoryMatch = typeFilter === 'ALL' || (v.category && v.category.toLowerCase() === typeFilter.toLowerCase());
            return categoryMatch;
        });
    }, [visitors, typeFilter]);
    const handleToggleBlacklist = async (vis) => {
        try {
            setActionLoadingId(vis.id);
            const newBlacklistStatus = !vis.is_blacklisted;
            await visitorProfileApi.toggleBlacklist(vis.id, newBlacklistStatus, newBlacklistStatus ? 'Administrative restriction' : 'Restriction removed');
            setVisitors((prev) => prev.map((item) => item.id === vis.id
                ? { ...item, is_blacklisted: newBlacklistStatus, status: newBlacklistStatus ? 'BLACKLISTED' : 'ACTIVE' }
                : item));
        }
        catch (err) {
            console.error('Failed to update blacklist status:', err);
        }
        finally {
            setActionLoadingId(null);
        }
    };
    const getStatusBadge = (status, isBlacklisted) => {
        if (isBlacklisted) {
            return <span className="badge bg-danger text-white">{t('status.blacklisted', 'Blacklisted')}</span>;
        }
        const norm = (status || '').toUpperCase();
        switch (norm) {
            case 'ACTIVE':
            case 'CHECKED-IN':
            case 'CHECKED_IN':
                return <span className="badge bg-success text-white">{t('status.checkedIn', 'Checked-In')}</span>;
            case 'PRE-REGISTERED':
            case 'PREREGISTERED':
            case 'REGISTERED':
                return <span className="badge bg-primary text-white">{t('status.preRegistered', 'Pre-Registered')}</span>;
            case 'CHECKED-OUT':
            case 'CHECKED_OUT':
            case 'COMPLETED':
                return <span className="badge bg-secondary text-white">{t('status.checkedOut', 'Checked-Out')}</span>;
            case 'PENDING':
            case 'PENDING_APPROVAL':
                return <span className="badge bg-warning text-dark">{t('status.pending', 'Pending')}</span>;
            case 'BLACKLISTED':
                return <span className="badge bg-danger text-white">{t('status.blacklisted', 'Blacklisted')}</span>;
            default:
                return <span className="badge bg-secondary">{tStatus(status) || status || 'Unknown'}</span>;
        }
    };
    return (<div className="vms-visitor-list space-y-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="bi bi-people-fill text-indigo-400"></i> {t('sidebar.visitorProfiles', 'Visitor Directory & Records')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('empDash.subtitle', 'Central repository of all registered, active, and past enterprise visitors from the database.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={fetchVisitors} disabled={loading} className="btn btn-outline-info text-xs flex items-center gap-2">
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> {t('form.refresh', 'Refresh')}
          </button>
          <button type="button" onClick={() => {
            if (visitors.length === 0)
                return;
            const csvData = visitors
                .map((v) => `${v.visitor_code || v.id},"${v.full_name || ''}","${v.email || ''}","${v.company || ''}","${v.status || ''}"`)
                .join('\n');
            const blob = new Blob([`ID,Name,Email,Company,Status\n${csvData}`], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `visitor-records-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
        }} disabled={visitors.length === 0} className="btn btn-outline-secondary text-xs flex items-center gap-2">
            <i className="bi bi-download"></i> {t('form.exportRecords', 'Export Records')}
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl">
        <div className="md:col-span-2 relative">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input type="text" placeholder={t('form.searchPlaceholder', 'Search visitor name, ID, email, or company...')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"/>
        </div>

        <div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            <option value="ALL">{t('status.all', 'All Statuses')}</option>
            <option value="ACTIVE">{t('status.checkedIn', 'Active / Checked-In')}</option>
            <option value="PRE-REGISTERED">{t('status.preRegistered', 'Pre-Registered')}</option>
            <option value="COMPLETED">{t('status.checkedOut', 'Checked-Out')}</option>
            <option value="PENDING">{t('status.pending', 'Pending')}</option>
            <option value="BLACKLISTED">{t('status.blacklisted', 'Blacklisted')}</option>
          </select>
        </div>

        <div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            <option value="ALL">{t('table.allTypes', 'All Visitor Types')}</option>
            <option value="VIP">VIP</option>
            <option value="Vendor">Vendor</option>
            <option value="Contractor">Contractor</option>
            <option value="Standard">Standard</option>
            <option value="Interviewee">Interviewee</option>
          </select>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-4">{t('table.visitorInfo', 'Visitor Info')}</th>
                <th className="p-4">{t('table.company', 'Company')}</th>
                <th className="p-4">{t('table.category', 'Category')}</th>
                <th className="p-4">{t('table.status', 'Status')}</th>
                <th className="p-4">{t('table.identity', 'Identity / NDA')}</th>
                <th className="p-4">{t('table.department', 'Department / Branch')}</th>
                <th className="p-4">{t('table.createdDate', 'Created Date')}</th>
                <th className="p-4 text-right">{t('table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (<tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mb-2"></div>
                    <p>{t('form.loading', 'Loading real visitor database records...')}</p>
                  </td>
                </tr>) : filteredVisitors.length === 0 ? (<tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <i className="bi bi-inbox fs-2 block mb-2 opacity-50"></i>
                    {t('table.noData', 'No visitor records found in the database.')}
                  </td>
                </tr>) : (filteredVisitors.map((vis) => {
            const initial = (vis.full_name || vis.first_name || 'V').charAt(0).toUpperCase();
            const isIdVerified = vis.id_verification_status === 'VERIFIED' || vis.id_verification_status === 'Approved';
            return (<tr key={vis.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/30 shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {vis.full_name || `${vis.first_name || ''} ${vis.last_name || ''}`}
                              <span className="text-[10px] text-slate-500 font-mono">({vis.visitor_code || `VIS-${vis.id}`})</span>
                            </div>
                            <div className="text-[11px] text-slate-400">{vis.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-300">{vis.company || '—'}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {vis.category || 'Standard'}
                        </span>
                      </td>
                      <td className="p-4">{getStatusBadge(vis.status, vis.is_blacklisted)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${isIdVerified ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`} title={isIdVerified ? 'Government ID Verified' : 'ID Not Verified'}>
                            ID: {isIdVerified ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        {vis.department_name || vis.branch_name || 'General'}
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {vis.created_at ? new Date(vis.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => setSelectedVisitor(vis)} className="btn btn-sm btn-outline-info text-xs p-1 px-2" title="View Details">
                            <i className="bi bi-eye"></i>
                          </button>

                          <button type="button" disabled={actionLoadingId === vis.id} onClick={() => handleToggleBlacklist(vis)} className={`btn btn-sm text-xs p-1 px-2 ${vis.is_blacklisted ? 'btn-outline-success' : 'btn-outline-danger'}`} title={vis.is_blacklisted ? 'Remove Blacklist' : 'Add to Blacklist'}>
                            <i className={`bi ${vis.is_blacklisted ? 'bi-shield-check' : 'bi-slash-circle'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>);
        }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visitor Detail Modal */}
      {selectedVisitor && (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <i className="bi bi-person-lines-fill text-indigo-400"></i> {t('card.details', 'Visitor Profile Details')}
              </h3>
              <button type="button" onClick={() => setSelectedVisitor(null)} className="text-slate-400 hover:text-white">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">{t('form.fullName', 'Full Name')}:</span>
                <span className="font-bold text-white">
                  {selectedVisitor.full_name || `${selectedVisitor.first_name || ''} ${selectedVisitor.last_name || ''}`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">{t('form.idNumber', 'Visitor Code')}:</span>
                <span className="font-mono text-indigo-400">
                  {selectedVisitor.visitor_code || `VIS-${selectedVisitor.id}`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">{t('card.summary', 'Reference')}:</span>
                <span className="font-mono text-slate-300">
                  {selectedVisitor.reference_number || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">{t('form.email', 'Email')}:</span>
                <span>{selectedVisitor.email || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">{t('form.phone', 'Phone')}:</span>
                <span>{selectedVisitor.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">{t('table.company', 'Company / Org')}:</span>
                <span>{selectedVisitor.company || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">{t('table.category', 'Visitor Category')}:</span>
                <span className="font-semibold">{selectedVisitor.category || 'Standard'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">{t('table.status', 'Current Status')}:</span>
                {getStatusBadge(selectedVisitor.status, selectedVisitor.is_blacklisted)}
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">{t('table.department', 'Department')}:</span>
                <span>{selectedVisitor.department_name || 'General'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">{t('table.createdDate', 'Registered At')}:</span>
                <span>{selectedVisitor.created_at ? new Date(selectedVisitor.created_at).toLocaleString() : '—'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="button" onClick={() => setSelectedVisitor(null)} className="btn btn-secondary text-xs px-4">
                {t('form.cancel', 'Close')}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
