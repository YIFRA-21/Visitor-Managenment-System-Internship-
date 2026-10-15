import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, RefreshCw, Download, Printer, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight, X, LayoutGrid, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import visitorHistoryApi from '../../../../modules/visitor-history/api/visitorHistoryApi';
import VisitorHistoryTable from './components/VisitorHistoryTable';
export default function VisitorHistoryManagement() {
    const [, setSearchParams] = useSearchParams();
    const [histories, setHistories] = useState([]);
    const [stats, setStats] = useState({
        totalCompleted: 0,
        visitsToday: 0,
        visitsThisMonth: 0,
        avgDurationMinutes: 0,
        verifiedPercentage: 100,
        repeatVisitorsCount: 0
    });
    const [loading, setLoading] = useState(true);
    // Pagination & Sorting
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('completed_date');
    const [sortOrder, setSortOrder] = useState('DESC');
    // Selected history for side drawer panel
    const [selectedHistory, setSelectedHistory] = useState(null);
    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    // Column Visibility Modal state
    const [showColVis, setShowColVis] = useState(false);
    // Edit Metadata Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [saving, setSaving] = useState(false);
    // Delete Target state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    const fetchHistoryData = useCallback(async () => {
        setLoading(true);
        try {
            const [histRes, statRes] = await Promise.all([
                visitorHistoryApi.getAll({
                    search: search.trim() || undefined,
                    startDate: filterStartDate || undefined,
                    endDate: filterEndDate || undefined,
                    departmentId: filterDepartment || undefined,
                    visitorCategory: filterCategory || undefined,
                    visitStatus: filterStatus || undefined,
                    page,
                    limit,
                    sortBy,
                    sortOrder
                }),
                visitorHistoryApi.getStats()
            ]);
            const fetchedList = Array.isArray(histRes.data) ? histRes.data : [];
            setHistories(fetchedList);
            if (histRes.pagination) {
                setTotalCount(histRes.pagination.total || fetchedList.length);
                setTotalPages(histRes.pagination.totalPages || 1);
            }
            else {
                setTotalCount(fetchedList.length);
                setTotalPages(1);
            }
            if (statRes.data) {
                setStats(statRes.data);
            }
            else {
                setStats({
                    totalCompleted: fetchedList.length,
                    visitsToday: 0,
                    visitsThisMonth: 0,
                    avgDurationMinutes: 0,
                    verifiedPercentage: 100,
                    repeatVisitorsCount: 0
                });
            }
            if (fetchedList.length > 0) {
                setSelectedHistory(prev => {
                    if (prev && fetchedList.some((h) => h.id === prev.id))
                        return prev;
                    return fetchedList[0];
                });
            }
            else {
                setSelectedHistory(null);
            }
        }
        catch (err) {
            console.error('Fetch history error:', err);
            setHistories([]);
            setTotalCount(0);
            setTotalPages(1);
            setStats({
                totalCompleted: 0,
                visitsToday: 0,
                visitsThisMonth: 0,
                avgDurationMinutes: 0,
                verifiedPercentage: 100,
                repeatVisitorsCount: 0
            });
            setSelectedHistory(null);
        }
        finally {
            setLoading(false);
        }
    }, [search, filterStartDate, filterEndDate, filterDepartment, filterCategory, filterStatus, page, limit, sortBy, sortOrder]);
    useEffect(() => {
        fetchHistoryData();
    }, [fetchHistoryData]);
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
        }
        else {
            setSortBy(column);
            setSortOrder('DESC');
        }
        setPage(1);
    };
    const handleClearFilters = () => {
        setSearch('');
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterDepartment('');
        setFilterCategory('');
        setFilterStatus('');
        setPage(1);
        showToast('Filters reset successfully.');
    };
    const handleAddVisitor = () => {
        setSearchParams({ view: 'register_visitor' });
    };
    const handleViewStandaloneDetails = (item) => {
        try {
            sessionStorage.setItem('history_return_view', '?view=visitor_history');
        }
        catch (e) { }
        setSearchParams({ view: 'visitor_history_details', id: String(item.id), from: 'visitor_history' });
    };
    const handleOpenEdit = (item) => {
        setEditTarget(item);
        setEditFormData({
            visitor_name: item.visitor_name,
            visitor_company: item.visitor_company,
            visitor_category: item.visitor_category,
            host_employee_name: item.host_employee_name,
            department_name: item.department_name,
            visit_purpose: item.visit_purpose,
            visit_status: item.visit_status
        });
        setShowEditModal(true);
    };
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editTarget)
            return;
        setSaving(true);
        try {
            await visitorHistoryApi.updateMetadata(editTarget.id, editFormData);
            showToast('History metadata corrected successfully.');
            setShowEditModal(false);
            fetchHistoryData();
        }
        catch (err) {
            showToast(err.response?.data?.message || 'Update failed.', 'error');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteConfirm = async () => {
        if (!deleteTarget)
            return;
        setDeleting(true);
        try {
            await visitorHistoryApi.delete(deleteTarget.id);
            showToast('Visitor history record soft-deleted successfully.');
            const deletedId = deleteTarget.id;
            setDeleteTarget(null);
            setHistories(prev => prev.filter(h => h.id !== deletedId));
            setTotalCount(prev => Math.max(0, prev - 1));
            fetchHistoryData();
        }
        catch (err) {
            console.error('Delete history error:', err);
            showToast(err.response?.data?.message || 'Delete failed.', 'error');
        }
        finally {
            setDeleting(false);
        }
    };
    const handleExportCSV = () => {
        if (histories.length === 0) {
            showToast('No history records available to export.', 'error');
            return;
        }
        const headers = ['History Code', 'Reference No', 'Visitor Name', 'Category', 'Company', 'Host Employee', 'Department', 'Appointment No', 'Purpose', 'Check-In', 'Check-Out', 'Duration (min)', 'Status'];
        const csvRows = [headers.join(',')];
        histories.forEach(h => {
            const row = [
                `"${h.history_code}"`,
                `"${h.reference_number}"`,
                `"${h.visitor_name}"`,
                `"${h.visitor_category || ''}"`,
                `"${h.visitor_company || ''}"`,
                `"${h.host_employee_name || ''}"`,
                `"${h.department_name || ''}"`,
                `"${h.appointment_number || ''}"`,
                `"${h.visit_purpose || ''}"`,
                `"${h.checkin_time || ''}"`,
                `"${h.checkout_time || ''}"`,
                `"${h.visit_duration_minutes || 0}"`,
                `"${h.visit_status}"`
            ];
            csvRows.push(row.join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `visitor_history_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Exported Visitor History to Excel/CSV.');
    };
    const handlePrintList = () => {
        window.print();
    };
    return (<div className="space-y-5 text-slate-100">
      {/* Toast */}
      {toast && (<div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible d-flex align-items-center gap-2 text-xs fw-semibold py-2 fade show`} role="alert">
          {toast.message}
          <button type="button" className="btn-close btn-close-sm" onClick={() => setToast(null)}/>
        </div>)}

      {/* Header — Matching Category Management header bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Dashboard &gt; Visitor Management &gt; <span className="text-slate-200">Visitor History</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Visitor History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-semibold">
            Permanent historical records &amp; audit tracking of all completed visitor visits.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button onClick={handleAddVisitor} className="btn btn-primary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <Plus className="h-4 w-4"/> Add Visitor
          </button>
          <button onClick={fetchHistoryData} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <RefreshCw className="h-3.5 w-3.5"/> Refresh
          </button>
          <button onClick={handleExportCSV} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <Download className="h-3.5 w-3.5"/> Export Excel
          </button>
          <button onClick={handlePrintList} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <Printer className="h-3.5 w-3.5"/> Print List
          </button>
          <button onClick={handleClearFilters} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <RotateCcw className="h-3.5 w-3.5"/> Reset Filters
          </button>
        </div>
      </div>



      {/* Main Search & Filter Bar — Matching Visitor Category Management bar */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 shadow-xl no-print">
        <div className="row g-3 align-items-center">
          {/* Search Input */}
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4 w-4"/>
              <input type="text" className="form-control ps-5 text-xs font-semibold" placeholder="Search name, ID, reference, host, appointment..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-12 col-sm-6 col-md-2">
            <select className="form-select text-xs font-semibold" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
              <option value="">Status: All</option>
              <option value="Completed">Completed</option>
              <option value="Early Check-Out">Early Check-Out</option>
              <option value="Overstayed">Overstayed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="col-12 col-sm-6 col-md-3">
            <select className="form-select text-xs font-semibold" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
              <option value="">Category: All</option>
              <option value="General Visitor">General Visitor</option>
              <option value="Contractor / Vendor">Contractor / Vendor</option>
              <option value="VIP / Executive">VIP / Executive</option>
              <option value="Official Auditor">Official Auditor</option>
              <option value="Interview Candidate">Interview Candidate</option>
            </select>
          </div>

          {/* Advanced Filter Toggle Button */}
          <div className="col-12 col-md-2">
            <button onClick={() => setShowFilters(!showFilters)} className={`btn w-100 ${showFilters ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center justify-content-center gap-1.5 text-xs font-bold px-3 py-2 whitespace-nowrap`}>
              <SlidersHorizontal className="h-3.5 w-3.5"/>
              Advanced
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Advanced Search & Date Filter Panel */}
      {showFilters && (<div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 no-print">
          <div className="d-flex align-items-center justify-content-between border-bottom border-slate-200 dark:border-slate-800 pb-2">
            <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-0 d-flex align-items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary"/> Advanced Search &amp; Date Range Filters
            </h6>
            <button onClick={() => setShowFilters(false)} className="btn btn-sm btn-outline-secondary p-1 text-xs" title="Close advanced filters">
              <X className="h-3.5 w-3.5"/>
            </button>
          </div>

          <div className="row g-3">
            {/* Start Date */}
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label text-[11px] font-bold text-slate-400 mb-1">From Date</label>
              <input type="date" className="form-control text-xs font-semibold" value={filterStartDate} onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
            </div>

            {/* End Date */}
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label text-[11px] font-bold text-slate-400 mb-1">To Date</label>
              <input type="date" className="form-control text-xs font-semibold" value={filterEndDate} onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
            </div>

            {/* Department Filter */}
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label text-[11px] font-bold text-slate-400 mb-1">Department</label>
              <select className="form-select text-xs font-semibold" value={filterDepartment} onChange={(e) => { setFilterDepartment(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
                <option value="">Department: All</option>
                <option value="Security & Operations">Security &amp; Operations</option>
                <option value="Finance & Compliance">Finance &amp; Compliance</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing & PR">Marketing &amp; PR</option>
                <option value="Corporate Strategy">Corporate Strategy</option>
              </select>
            </div>

            {/* Reset Action */}
            <div className="col-12 col-sm-6 col-md-3 d-flex align-items-end">
              <button onClick={handleClearFilters} className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1.5 text-xs font-bold py-2">
                <RotateCcw className="h-3.5 w-3.5"/> Clear Filters
              </button>
            </div>
          </div>
        </div>)}

      {/* Main Section: Data Table (Full Page Width) */}
      <div className="row g-4">
        {/* Table Column - Always Full Width (col-12) */}
        <div className="col-12">
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (<div className="p-20 text-center">
                <div className="spinner-border text-primary" role="status"/>
                <p className="text-slate-400 text-xs fw-semibold mt-3">Loading visitor history records...</p>
              </div>) : histories.length === 0 ? (<div className="p-20 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs">
                <LayoutGrid className="h-10 w-10 text-slate-300 mx-auto mb-3"/>
                <p className="fw-bold text-sm">No visitor history records found</p>
                <p className="text-slate-400 mt-1">Try adjusting your search criteria or date filters.</p>
              </div>) : (<>
                <VisitorHistoryTable histories={histories} selectedHistoryId={selectedHistory?.id} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} onSelectRow={handleViewStandaloneDetails} onView={handleViewStandaloneDetails} onViewStandalone={handleViewStandaloneDetails} onEdit={handleOpenEdit} onDelete={(h) => setDeleteTarget(h)} onPrintRow={handlePrintList}/>

                {/* Pagination Bar — Matching Category Management footer */}
                <div className="d-flex flex-wrap justify-content-between align-items-center p-3 border-top border-slate-200 dark:border-slate-800 text-xs gap-3">
                  <div className="d-flex align-items-center gap-2 font-semibold text-slate-500 dark:text-slate-400">
                    <span>
                      Showing {totalCount > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, totalCount)} of {totalCount} entries
                    </span>
                  </div>

                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="text-slate-400 font-semibold text-[11px]">Per Page:</span>
                      <select className="form-select form-select-sm text-xs font-semibold py-1 px-2.5 rounded-lg" value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
                        <option value={5}>5 / page</option>
                        <option value={10}>10 / page</option>
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                      </select>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                      <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-2.5 py-1 text-xs font-bold" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                        <ChevronLeft className="h-3.5 w-3.5"/> Prev
                      </button>

                      {Array.from({ length: Math.max(1, Math.min(totalPages || 1, 5)) }, (_, i) => i + 1).map(pn => (<button key={pn} className={`btn btn-sm ${page === pn ? 'btn-primary' : 'btn-outline-secondary'} text-xs font-bold px-2.5 py-1`} onClick={() => setPage(pn)}>
                          {pn}
                        </button>))}

                      <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-2.5 py-1 text-xs font-bold" disabled={page >= (totalPages || 1)} onClick={() => setPage(p => p + 1)}>
                        Next <ChevronRight className="h-3.5 w-3.5"/>
                      </button>
                    </div>
                  </div>
                </div>
              </>)}
          </div>
        </div>
      </div>

      {/* EDIT METADATA MODAL */}
      {showEditModal && editTarget && (<div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-slate-900 border border-slate-800 text-slate-200">
              <div className="modal-header border-b border-slate-800">
                <h5 className="modal-title font-bold text-white text-sm">Correct History Metadata: {editTarget.history_code}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}/>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body space-y-3 text-xs">
                  <div>
                    <label className="form-label font-bold">Visitor Name</label>
                    <input type="text" className="form-control text-xs font-semibold" value={editFormData.visitor_name || ''} onChange={(e) => setEditFormData({ ...editFormData, visitor_name: e.target.value })} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>
                  <div>
                    <label className="form-label font-bold">Company / Organization</label>
                    <input type="text" className="form-control text-xs font-semibold" value={editFormData.visitor_company || ''} onChange={(e) => setEditFormData({ ...editFormData, visitor_company: e.target.value })} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>
                  <div>
                    <label className="form-label font-bold">Host Employee</label>
                    <input type="text" className="form-control text-xs font-semibold" value={editFormData.host_employee_name || ''} onChange={(e) => setEditFormData({ ...editFormData, host_employee_name: e.target.value })} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>
                  <div>
                    <label className="form-label font-bold">Department</label>
                    <input type="text" className="form-control text-xs font-semibold" value={editFormData.department_name || ''} onChange={(e) => setEditFormData({ ...editFormData, department_name: e.target.value })} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>
                </div>
                <div className="modal-footer border-t border-slate-800">
                  <button type="button" className="btn btn-outline-secondary btn-sm font-bold" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm font-bold" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Correction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>)}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 text-slate-200 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5"/>
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-0.5">Delete Visitor History Record</h4>
                <p className="text-xs text-slate-400 mb-0 font-medium">Confirm record deletion</p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Record Code:</span>
                <span className="font-mono font-bold text-indigo-400">{deleteTarget.history_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Visitor:</span>
                <span className="font-semibold text-white">{deleteTarget.visitor_name}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to soft delete history record <strong>{deleteTarget.history_code}</strong> for visitor <strong>{deleteTarget.visitor_name}</strong>? This action soft-deletes the record from active view.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-all">
                Cancel
              </button>
              <button type="button" disabled={deleting} onClick={handleDeleteConfirm} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/25">
                {deleting ? (<>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin"/>
                    <span>Deleting...</span>
                  </>) : (<>
                    <Trash2 className="w-3.5 h-3.5"/>
                    <span>Delete Record</span>
                  </>)}
              </button>
            </div>
          </div>
        </div>, document.body)}
    </div>);
}
