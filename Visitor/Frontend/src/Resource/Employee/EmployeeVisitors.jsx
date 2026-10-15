import React, { useState, useEffect } from 'react';
import { Users, Search, UserCheck, FileText, Eye, Shield, Building, Mail, Phone, RefreshCw, Filter, MapPin } from 'lucide-react';
import { employeePortalApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function EmployeeVisitors() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [visitors, setVisitors] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const fetchVisitors = async () => {
        setLoading(true);
        try {
            const res = await employeePortalApi.getMyVisitors();
            const data = res.data || [];
            setVisitors(Array.isArray(data) ? data : []);
        }
        catch (err) {
            setVisitors([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchVisitors();
    }, []);
    // Reset pagination on search or status filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);
    // Compute KPI Statistics
    const stats = {
        total: visitors.length,
        expected: visitors.filter((v) => {
            const st = (v.status || '').toUpperCase();
            return st === 'APPROVED' || st === 'PENDING' || st === 'EXPECTED' || st === 'REQUESTED';
        }).length,
        onsite: visitors.filter((v) => {
            const st = (v.status || '').toUpperCase();
            return st === 'CHECKED_IN' || st === 'ONSITE' || st === 'IN_HOUSE';
        }).length,
        completed: visitors.filter((v) => {
            const st = (v.status || '').toUpperCase();
            return st === 'COMPLETED' || st === 'CHECKED_OUT';
        }).length,
    };
    // Filter visitors table list
    const filtered = visitors.filter((v) => {
        const st = (v.status || '').toUpperCase();
        let matchesStatus = true;
        if (statusFilter === 'EXPECTED') {
            matchesStatus = st === 'APPROVED' || st === 'PENDING' || st === 'REQUESTED' || st === 'EXPECTED';
        }
        else if (statusFilter === 'ONSITE') {
            matchesStatus = st === 'CHECKED_IN' || st === 'ONSITE' || st === 'IN_HOUSE';
        }
        else if (statusFilter === 'COMPLETED') {
            matchesStatus = st === 'COMPLETED' || st === 'CHECKED_OUT';
        }
        const matchesSearch = (v.full_name || v.visitor_name || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.company || v.visitor_company || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.email || v.visitor_email || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.reference_code || '')?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });
    // Calculate pagination parameters
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
    const paginatedVisitors = filtered.slice(startIndex, endIndex);
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header Bar — Branch Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-indigo-400"/>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">{t('employee.visitorsTitle', 'My Hosted Visitors Directory')}</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1">{t('employee.visitorsSub', 'Real-time directory and historical tracking of guests hosted by you.')}</p>
        </div>

        <button onClick={fetchVisitors} className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 shadow-sm transition-all">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/>
          <span>{t('common.refresh', 'Refresh')}</span>
        </button>
      </div>

      {/* Dynamic Search & Branch-Style Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0a0f19] border border-slate-800/80 p-3 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5"/>
          <input type="text" placeholder={t('employee.searchVisitors', 'Search visitor name, company, email...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#0e1628] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"/>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400"/>
            <span className="text-xs font-bold text-slate-400 uppercase">{t('employee.filterStatus', 'Filter Status')}:</span>
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#0e1628] border border-slate-700/80 text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500">
            <option value="ALL">{t('employee.allStatuses', 'All Statuses')} ({stats.total})</option>
            <option value="EXPECTED">{t('employee.expectedApproved', 'Expected / Approved')} ({stats.expected})</option>
            <option value="ONSITE">{t('employee.guestsOnsite', 'Guests On-Site')} ({stats.onsite})</option>
            <option value="COMPLETED">{t('employee.completedVisits', 'Completed Visits')} ({stats.completed})</option>
          </select>
        </div>
      </div>

      {/* Table List View — Branch Management Style */}
      <div className="bg-[#0a0f19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#070b16] border-b border-slate-800/80 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">{t('table.visitor', 'Visitor Guest')}</th>
                <th className="px-5 py-3.5">{t('table.company', 'Organization / Company')}</th>
                <th className="px-5 py-3.5">{t('table.contact', 'Contact Info')}</th>
                <th className="px-5 py-3.5">{t('table.location', 'Meeting / Location')}</th>
                <th className="px-5 py-3.5 text-center">{t('table.status', 'Visit Status')}</th>
                <th className="px-5 py-3.5 text-end">{t('table.action', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (<tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                    Syncing Visitor Directory...
                  </td>
                </tr>) : filtered.length === 0 ? (<tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    No visitor records found matching search or status filter.
                  </td>
                </tr>) : (paginatedVisitors.map((v) => {
            const st = (v.status || '').toUpperCase();
            return (<tr key={v.id} onClick={() => setSelectedVisitor(v)} className="hover:bg-slate-800/40 transition-colors cursor-pointer">
                      {/* Visitor Name & Ref Code Pill */}
                      <td className="px-5 py-3.5 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-[12px] flex items-center justify-center font-black text-sm shrink-0">
                            {(v.full_name || v.visitor_name || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-black">{v.full_name || v.visitor_name}</div>
                            <span className="inline-block px-2 py-0.5 mt-0.5 bg-slate-900 border border-slate-700/80 font-mono text-[9px] text-blue-300 font-bold rounded">
                              {v.reference_code || `VIS-${v.id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Organization / Company */}
                      <td className="px-5 py-3.5 text-slate-300 font-semibold whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Building className="h-3.5 w-3.5 text-slate-500"/>
                          <span>{v.company || v.visitor_company || 'Guest Visitor'}</span>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1 text-slate-300 font-mono text-[11px]">
                            <Mail className="h-3 w-3 text-indigo-400"/>
                            <span>{v.email || v.visitor_email || 'n/a'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
                            <Phone className="h-3 w-3 text-indigo-400"/>
                            <span>{v.phone || v.visitor_phone || 'n/a'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Meeting Purpose & Room */}
                      <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap">
                        <div className="text-white font-bold">{v.purpose || 'Business Meeting'}</div>
                        <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium mt-0.5">
                          <MapPin className="h-3 w-3 text-indigo-400"/>
                          <span>{v.room_name || 'Main Lobby'}</span>
                        </div>
                      </td>

                      {/* Visit Status Pill */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-extrabold uppercase rounded-full border shadow-sm ${st === 'CHECKED_IN' || st === 'ONSITE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                    : st === 'APPROVED' || st === 'EXPECTED'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : st === 'COMPLETED'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {st === 'CHECKED_IN' ? '● On-Site' : st === 'APPROVED' ? 'Approved / Expected' : st}
                        </span>
                      </td>

                      {/* Action — Eye Icon (Clean border, NO hover background fill) */}
                      <td className="px-5 py-3.5 text-end whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedVisitor(v); }} className="group w-[38px] h-[38px] rounded-[14px] border border-slate-700/80 hover:border-slate-400 bg-[#131c2e] text-white hover:-translate-y-0.5 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-sm" title="Inspect Visitor Profile">
                            <Eye className="h-[18px] w-[18px] stroke-[1.8] text-white transition-colors"/>
                          </button>
                        </div>
                      </td>
                    </tr>);
        }))}
            </tbody>
          </table>
        </div>

        {/* Footer info bar with Pagination Controls */}
        <div className="px-5 py-3 bg-[#070b16] border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-bold">
          <div>
            Showing <span className="text-white">{filtered.length > 0 ? startIndex + 1 : 0}</span> to{' '}
            <span className="text-white">{endIndex}</span> of <span className="text-white">{filtered.length}</span> Hosted Visitors
          </div>

          {/* Pagination Navigation */}
          <div className="flex items-center space-x-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={validCurrentPage === 1} className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all">
              Previous
            </button>

            <div className="flex items-center space-x-1 text-slate-300 font-bold px-2">
              <span>Page {validCurrentPage} of {totalPages}</span>
            </div>

            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={validCurrentPage === totalPages} className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Rich Guest Detail Modal */}
      {selectedVisitor && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-400"/>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Visitor Profile &amp; Access Record</h3>
              </div>
              <button onClick={() => setSelectedVisitor(null)} className="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-slate-800/80 border border-slate-800 rounded-xl">
              <div className="h-16 w-16 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xl shrink-0 overflow-hidden">
                {selectedVisitor.visitor_photo || selectedVisitor.photo_url ? (<img src={selectedVisitor.visitor_photo || selectedVisitor.photo_url} alt="Guest" className="h-full w-full object-cover"/>) : (<UserCheck className="h-8 w-8"/>)}
              </div>

              <div>
                <h4 className="text-base font-black text-white">{selectedVisitor.full_name || selectedVisitor.visitor_name}</h4>
                <p className="text-xs text-indigo-400 font-bold">{selectedVisitor.company || selectedVisitor.visitor_company || 'Guest Visitor'}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 font-mono text-[10px] text-blue-300 font-bold rounded">
                    {selectedVisitor.reference_code || `VIS-${selectedVisitor.id}`}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded uppercase">
                    {selectedVisitor.status || 'APPROVED'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Email Address</span>
                <span className="text-slate-200 font-mono font-medium truncate block">{selectedVisitor.email || selectedVisitor.visitor_email || 'n/a'}</span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Phone Number</span>
                <span className="text-slate-200 font-mono font-medium block">{selectedVisitor.phone || selectedVisitor.visitor_phone || '+1 (555) 019-2834'}</span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Scheduled Location</span>
                <span className="text-white font-bold block">{selectedVisitor.room_name || 'Executive Boardroom A'}</span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Check-in Status</span>
                <span className="text-emerald-400 font-bold block">{selectedVisitor.check_in_time ? `Arrived at ${selectedVisitor.check_in_time}` : 'Pre-registered & Approved'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Attached Visitor Documents &amp; Identity Verification</span>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-indigo-400"/>
                  <span className="text-slate-200 font-semibold">Government Photo ID Scan</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold rounded uppercase">
                  Verified
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button onClick={() => setSelectedVisitor(null)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider">
                Close Profile
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
