import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Plus, RefreshCw, Search, Download, Eye, CheckCircle2, XCircle, AlertCircle, FileText, Users, BarChart2, RotateCcw, SlidersHorizontal, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import NewAppointmentWizardModal from './components/NewAppointmentWizardModal';
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import AppointmentApprovalModal from './components/AppointmentApprovalModal';
import AppointmentRescheduleModal from './components/AppointmentRescheduleModal';
import AppointmentCancelModal from './components/AppointmentCancelModal';
import AppointmentCalendarView from './components/AppointmentCalendarView';
export default function AppointmentManagementHome() {
    const [activeTab, setActiveTab] = useState('table');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('scheduled_start');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    // Toast
    const [toast, setToast] = useState(null);
    // Modal States
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [approvalModalState, setApprovalModalState] = useState({ open: false, appt: null, mode: 'approve' });
    const [rescheduleModalState, setRescheduleModalState] = useState({ open: false, appt: null });
    const [cancelModalState, setCancelModalState] = useState({ open: false, appt: null });
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    // Dynamically compute real-time KPI card counts from appointments array
    const stats = useMemo(() => {
        const total = appointments.length;
        const todayStr = new Date().toISOString().split('T')[0];
        let today = 0;
        let upcoming = 0;
        let pending = 0;
        let approved = 0;
        let completed = 0;
        let cancelled = 0;
        let noShow = 0;
        let rescheduled = 0;
        appointments.forEach(appt => {
            const st = (appt.appointment_status || appt.approval_status || '').toUpperCase();
            const apptDateStr = appt.scheduled_start ? appt.scheduled_start.split('T')[0] : '';
            if (apptDateStr === todayStr)
                today++;
            if (appt.scheduled_start && new Date(appt.scheduled_start) >= new Date(new Date().setHours(0, 0, 0, 0)))
                upcoming++;
            if (st === 'REQUESTED' || st === 'PENDING')
                pending++;
            else if (st === 'APPROVED' || st === 'CONFIRMED')
                approved++;
            else if (st === 'COMPLETED')
                completed++;
            else if (st === 'CANCELLED' || st === 'REJECTED')
                cancelled++;
            else if (st === 'NO_SHOW')
                noShow++;
            else if (st === 'RESCHEDULED')
                rescheduled++;
        });
        return { total, today, upcoming, pending, approved, completed, cancelled, noShow, rescheduled };
    }, [appointments]);
    // Load appointments from API (Visitor Categories quiet refresh pattern)
    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch('/api/appointments', { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setAppointments(data);
                }
            }
        }
        catch (err) {
            console.warn('[APPOINTMENTS] API fetch error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        setAppointments([
            {
                id: 1, appointment_number: 'APT-2026-0001', visitor_id: 'VIS-2026-000145',
                visitorName: 'John Smith', visitorCategory: 'General Visitor',
                hostName: 'Michael Johnson', department: 'Security & Operations', branch: 'Main HQ',
                roomName: 'Conference Room B', scheduled_start: '2026-07-06T10:00:00Z',
                scheduled_end: '2026-07-06T11:00:00Z', expected_duration_minutes: 60,
                purpose: 'Quarterly Security Clearance & Onsite Audit',
                approval_status: 'APPROVED', appointment_status: 'APPROVED',
                created_at: '2026-07-04T10:00:00Z', reference_code: 'REF-8145-2026'
            },
            {
                id: 2, appointment_number: 'APT-2026-0002', visitor_id: 'VIS-2026-000146',
                visitorName: 'Maria Garcia', visitorCategory: 'General Visitor',
                hostName: 'Michael Johnson', department: 'Security & Operations', branch: 'Main HQ',
                roomName: 'Meeting Room C', scheduled_start: '2026-07-06T14:00:00Z',
                scheduled_end: '2026-07-06T15:00:00Z', expected_duration_minutes: 60,
                purpose: 'Vendor Integration & Architecture Demo',
                approval_status: 'APPROVED', appointment_status: 'APPROVED',
                created_at: '2026-07-05T14:30:00Z', reference_code: 'REF-9012-2026'
            },
            {
                id: 3, appointment_number: 'APT-2026-0003', visitor_id: 'VIS-2026-000147',
                visitorName: 'David Lee', visitorCategory: 'General Visitor',
                hostName: 'Michael Johnson', department: 'Security & Operations', branch: 'Main HQ',
                roomName: 'Executive Suite', scheduled_start: '2026-07-07T09:00:00Z',
                scheduled_end: '2026-07-07T10:30:00Z', expected_duration_minutes: 90,
                purpose: 'Executive Board Discussion & Compliance',
                approval_status: 'REQUESTED', appointment_status: 'REQUESTED',
                created_at: '2026-07-05T08:00:00Z', reference_code: 'REF-3344-2026'
            }
        ]);
        fetchAppointments();
    }, []);
    // Filtered Appointments List
    const filteredAppointments = useMemo(() => {
        return appointments.filter(appt => {
            const matchSearch = !searchTerm ||
                (appt.appointment_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (appt.visitorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (appt.hostName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (appt.reference_code || '').toLowerCase().includes(searchTerm.toLowerCase());
            const st = (appt.appointment_status || appt.approval_status || '').toUpperCase();
            const matchStatus = !statusFilter || st === statusFilter;
            const matchDept = !deptFilter || (appt.department || '').toLowerCase().includes(deptFilter.toLowerCase());
            return matchSearch && matchStatus && matchDept;
        });
    }, [appointments, searchTerm, statusFilter, deptFilter]);
    const totalPages = Math.ceil(filteredAppointments.length / limit);
    const paginatedAppointments = filteredAppointments.slice((page - 1) * limit, page * limit);
    // Handlers
    const handleCreateSuccess = (newAppt) => {
        setAppointments(prev => [newAppt, ...prev]);
        showToast('Appointment created successfully.');
    };
    const handleApprovalConfirm = (apptId, decision, comments) => {
        setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, approval_status: decision, appointment_status: decision, remarks: comments || a.remarks } : a)));
        showToast(`Appointment ${decision.toLowerCase()} successfully.`);
    };
    const handleRescheduleConfirm = (apptId, newStart, newEnd, reason) => {
        setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, scheduled_start: newStart, scheduled_end: newEnd, appointment_status: 'RESCHEDULED', remarks: reason || a.remarks } : a)));
        showToast('Appointment rescheduled successfully.');
    };
    const handleCancelConfirm = (apptId, reason) => {
        setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, appointment_status: 'CANCELLED', remarks: reason || a.remarks } : a)));
        showToast('Appointment cancelled.');
    };
    const handleGeneratePass = (appt) => {
        const passData = {
            visitorName: appt.visitorName, visitorId: appt.visitor_id,
            referenceNo: appt.reference_code, visitorCategory: appt.visitorCategory,
            appointmentTitle: appt.purpose, appointmentId: appt.appointment_number,
            hostName: appt.hostName, hostDepartment: appt.department,
            location: `${appt.branch || 'Main HQ'}, Floor 3`,
            accessPoint: appt.roomName, purpose: appt.purpose,
            date: appt.scheduled_start ? new Date(appt.scheduled_start).toLocaleDateString() : '',
            time: '10:00 AM - 11:00 AM', status: appt.appointment_status || 'APPROVED'
        };
        try {
            sessionStorage.setItem('active_visitor_pass', JSON.stringify(passData));
        }
        catch (e) { }
        window.location.href = `?view=visitor_pass&id=${appt.id}`;
    };
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setDeptFilter('');
        setPage(1);
    };
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
    const handleExportCSV = () => {
        const headers = ['Appointment #', 'Visitor', 'Category', 'Host', 'Department', 'Room', 'Date', 'Status'];
        const rows = filteredAppointments.map(a => [
            a.appointment_number, a.visitorName, a.visitorCategory, a.hostName,
            a.department, a.roomName,
            a.scheduled_start ? new Date(a.scheduled_start).toLocaleDateString() : '',
            a.appointment_status
        ].map(v => `"${v}"`));
        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const a = document.createElement('a');
        a.href = encodeURI(csv);
        a.download = `Appointments_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    const getStatusBadge = (status) => {
        const st = (status || '').toUpperCase();
        if (st === 'APPROVED' || st === 'CONFIRMED')
            return <span className="badge bg-success text-uppercase" style={{ fontSize: '10px', fontWeight: 700 }}>Approved</span>;
        if (st === 'REQUESTED' || st === 'PENDING')
            return <span className="badge bg-warning text-dark text-uppercase" style={{ fontSize: '10px', fontWeight: 700 }}>Requested</span>;
        if (st === 'COMPLETED')
            return <span className="badge bg-info text-uppercase" style={{ fontSize: '10px', fontWeight: 700 }}>Completed</span>;
        if (st === 'REJECTED')
            return <span className="badge bg-danger text-uppercase" style={{ fontSize: '10px', fontWeight: 700 }}>Rejected</span>;
        if (st === 'CANCELLED')
            return <span className="badge bg-danger text-uppercase" style={{ fontSize: '10px', fontWeight: 700 }}>Cancelled</span>;
        if (st === 'RESCHEDULED')
            return <span className="badge bg-secondary text-uppercase" style={{ fontSize: '10px', fontWeight: 700 }}>Rescheduled</span>;
        return <span className="badge bg-secondary text-uppercase" style={{ fontSize: '10px', fontWeight: 700 }}>{st}</span>;
    };
    const activeFilterCount = [statusFilter, deptFilter].filter(Boolean).length;
    return (<div className="space-y-6">
      {/* Toast */}
      {toast && (<div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible d-flex align-items-center gap-2 text-xs fw-semibold py-2 fade show`} role="alert">
          {toast.message}
          <button type="button" className="btn-close btn-close-sm" onClick={() => setToast(null)}/>
        </div>)}

      {/* Header — Matching Visitor Categories header bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Appointment Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-semibold">
            Manage appointments, scheduling, conflict detection, host & room scheduling, and approval workflows.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button onClick={() => setIsWizardOpen(true)} className="btn btn-primary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <Plus className="h-4 w-4"/> New Appointment
          </button>
          <button onClick={fetchAppointments} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/> Refresh
          </button>
          <button onClick={handleExportCSV} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <Download className="h-3.5 w-3.5"/> Export List
          </button>
          <button onClick={clearFilters} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <RotateCcw className="h-3.5 w-3.5"/> Reset Filters
          </button>
        </div>
      </div>

      {/* Top KPI Summary Cards Row (Equal Width & Height, 3 per row for large text display) */}
      <div className="row g-3 align-items-stretch no-print">
        {[
            { icon: <Calendar className="h-6 w-6"/>, label: "Today's Appointments", value: stats.today, desc: 'Scheduled for today', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
            { icon: <Clock className="h-6 w-6"/>, label: 'Upcoming', value: stats.upcoming, desc: 'Future appointments', color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
            { icon: <AlertCircle className="h-6 w-6"/>, label: 'Pending Approval', value: stats.pending, desc: 'Awaiting host approval', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
            { icon: <CheckCircle2 className="h-6 w-6"/>, label: 'Approved', value: stats.approved, desc: `${Math.round((stats.approved / (stats.total || 1)) * 100)}% approval rate`, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { icon: <FileText className="h-6 w-6"/>, label: 'Completed', value: stats.completed, desc: 'Successfully completed', color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/20' },
            { icon: <XCircle className="h-6 w-6"/>, label: 'Cancelled', value: stats.cancelled, desc: 'Cancelled appointments', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
        ].map((kpi, i) => (<div key={i} className="col-12 col-sm-6 col-md-4 col-lg-4">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm d-flex align-items-center gap-3.5 h-100">
              <div className={`h-12 w-12 rounded-xl ${kpi.bg} ${kpi.color} d-flex align-items-center justify-content-center shrink-0 border`}>
                {kpi.icon}
              </div>
              <div className="flex-grow-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{kpi.label}</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{kpi.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{kpi.desc}</div>
              </div>
            </div>
          </div>))}
      </div>

      {/* Tab Navigation */}
      <div className="d-flex gap-2 no-print">
        {[
            { key: 'table', label: 'Appointments List' },
            { key: 'calendar', label: 'Calendar View' },
            { key: 'analytics', label: 'Analytics & Reports' },
        ].map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`btn text-xs font-bold px-3 py-2 ${activeTab === tab.key ? 'btn-primary' : 'btn-outline-secondary'}`}>
            {tab.label}
          </button>))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 no-print">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-3">
            <div className="position-relative">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4 w-4"/>
              <input type="text" className="form-control ps-5 text-xs font-semibold" placeholder="Search appointments..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
            </div>
          </div>
          <div className="col-12 col-sm-4 col-md-2">
            <select className="form-select text-xs font-semibold" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
              <option value="">Status: All</option>
              <option value="REQUESTED">Requested / Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
              <option value="RESCHEDULED">Rescheduled</option>
            </select>
          </div>
          <div className="col-12 col-sm-4 col-md-2">
            <select className="form-select text-xs font-semibold" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
              <option value="">Department: All</option>
              <option value="Security">Security & Operations</option>
              <option value="IT">IT Infrastructure</option>
              <option value="Executive">Executive Management</option>
            </select>
          </div>
          <div className="col-12 col-sm-4 col-md-2">
            <button onClick={() => setShowFilters(!showFilters)} className={`btn w-100 ${showFilters ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center justify-content-center gap-1.5 text-xs font-bold px-3 whitespace-nowrap`}>
              <SlidersHorizontal className="h-3.5 w-3.5"/>
              Advanced {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Advanced Filters Panel */}
      {showFilters && (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 no-print">
          <div className="d-flex align-items-center justify-content-between border-bottom border-slate-200 dark:border-slate-800 pb-2">
            <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-0 d-flex align-items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary"/> Advanced Filters & Sorting Options
            </h6>
            <button onClick={() => setShowFilters(false)} className="btn btn-sm btn-outline-secondary p-1 text-xs" title="Close">
              <X className="h-3.5 w-3.5"/>
            </button>
          </div>
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-md-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Sort By Field</label>
              <select className="form-select text-xs font-semibold" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
                <option value="scheduled_start">Scheduled Date</option>
                <option value="appointment_number">Appointment #</option>
                <option value="visitorName">Visitor Name</option>
                <option value="hostName">Host Employee</option>
                <option value="appointment_status">Status</option>
                <option value="created_at">Created Date</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Sort Direction</label>
              <select className="form-select text-xs font-semibold" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setPage(1); }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
                <option value="ASC">Ascending (A→Z)</option>
                <option value="DESC">Descending (Z→A)</option>
              </select>
            </div>
          </div>
        </div>)}

      {/* TAB: APPOINTMENTS TABLE LIST */}
      {activeTab === 'table' && (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(30,41,59,0.5)' }}>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3 border-bottom border-slate-700 cursor-pointer" onClick={() => handleSort('appointment_number')}>
                    Appointment # {sortBy === 'appointment_number' && (sortOrder === 'ASC' ? <ChevronUp className="h-3 w-3 d-inline"/> : <ChevronDown className="h-3 w-3 d-inline"/>)}
                  </th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3 border-bottom border-slate-700 cursor-pointer" onClick={() => handleSort('visitorName')}>
                    Visitor Name {sortBy === 'visitorName' && (sortOrder === 'ASC' ? <ChevronUp className="h-3 w-3 d-inline"/> : <ChevronDown className="h-3 w-3 d-inline"/>)}
                  </th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3 border-bottom border-slate-700">Category</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3 border-bottom border-slate-700">Host Employee</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3 border-bottom border-slate-700">Department</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3 border-bottom border-slate-700">Meeting Room</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3 border-bottom border-slate-700 cursor-pointer" onClick={() => handleSort('scheduled_start')}>
                    Scheduled Date & Time {sortBy === 'scheduled_start' && (sortOrder === 'ASC' ? <ChevronUp className="h-3 w-3 d-inline"/> : <ChevronDown className="h-3 w-3 d-inline"/>)}
                  </th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3 border-bottom border-slate-700">Status</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-3 px-3 border-bottom border-slate-700 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAppointments.length > 0 ? (paginatedAppointments.map(appt => (<tr key={appt.id} className="border-bottom border-slate-800" style={{ cursor: 'pointer' }}>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-200 text-xs">{appt.appointment_number}</div>
                        <div className="text-[9px] font-mono text-slate-500">{appt.reference_code}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-200 text-xs">{appt.visitorName}</div>
                        <div className="text-[10px] text-slate-500">{appt.visitor_id}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-xs">{appt.visitorCategory}</td>
                      <td className="py-2.5 px-3 text-slate-200 text-xs font-semibold">{appt.hostName}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-xs">{appt.department}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs font-bold" style={{ color: '#818cf8' }}>{appt.roomName}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-200 text-xs">
                          {appt.scheduled_start ? new Date(appt.scheduled_start).toLocaleDateString() : '-'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {appt.scheduled_start ? new Date(appt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">{getStatusBadge(appt.appointment_status)}</td>
                      <td className="py-2.5 px-3 text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <button onClick={() => { setSelectedAppointment(appt); setIsDetailsOpen(true); }} className="btn btn-sm btn-outline-secondary p-1" title="View Details">
                            <Eye className="h-3.5 w-3.5"/>
                          </button>

                          {(appt.appointment_status === 'REQUESTED' || appt.approval_status === 'PENDING') && (<>
                              <button onClick={() => setApprovalModalState({ open: true, appt, mode: 'approve' })} className="btn btn-sm btn-outline-success p-1" title="Approve">
                                <CheckCircle2 className="h-3.5 w-3.5"/>
                              </button>
                              <button onClick={() => setApprovalModalState({ open: true, appt, mode: 'reject' })} className="btn btn-sm btn-outline-danger p-1" title="Reject">
                                <XCircle className="h-3.5 w-3.5"/>
                              </button>
                            </>)}

                          <button onClick={() => setRescheduleModalState({ open: true, appt })} className="btn btn-sm btn-outline-secondary p-1" title="Reschedule">
                            <Clock className="h-3.5 w-3.5"/>
                          </button>
                        </div>
                      </td>
                    </tr>))) : (<tr>
                    <td colSpan={9} className="py-5 text-center text-slate-500 font-bold uppercase text-xs">
                      No appointments match current filters
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredAppointments.length > 0 && (<div className="d-flex align-items-center justify-content-between px-4 py-3 border-top border-slate-700">
              <div className="text-[11px] text-slate-400 font-semibold">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, filteredAppointments.length)} of {filteredAppointments.length} appointments
              </div>
              <div className="d-flex align-items-center gap-1">
                <button className="btn btn-sm btn-outline-secondary p-1" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4"/>
                </button>
                {Array.from({ length: totalPages }, (_, i) => (<button key={i} onClick={() => setPage(i + 1)} className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-outline-secondary'} px-2 text-xs font-bold`}>
                    {i + 1}
                  </button>))}
                <button className="btn btn-sm btn-outline-secondary p-1" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-4 w-4"/>
                </button>
              </div>
            </div>)}
        </div>)}

      {/* TAB: CALENDAR VIEW */}
      {activeTab === 'calendar' && (<AppointmentCalendarView appointments={appointments} onSelectAppointment={(appt) => { setSelectedAppointment(appt); setIsDetailsOpen(true); }} onRescheduleClick={(appt) => setRescheduleModalState({ open: true, appt })}/>)}

      {/* TAB: ANALYTICS & REPORTS */}
      {activeTab === 'analytics' && (<div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 d-flex align-items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary"/> Appointment Status Distribution
              </h6>
              <div className="space-y-3">
                {[
                { label: 'Approved', value: stats.approved, total: stats.total, color: '#10b981' },
                { label: 'Pending Approval', value: stats.pending, total: stats.total, color: '#f59e0b' },
                { label: 'Completed', value: stats.completed, total: stats.total, color: '#3b82f6' },
                { label: 'Cancelled / Rejected', value: stats.cancelled, total: stats.total, color: '#ef4444' },
            ].map((item, i) => {
                const pct = Math.round((item.value / (item.total || 1)) * 100);
                return (<div key={i}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: item.color }}>{item.label}</span>
                        <span className="text-xs font-bold text-slate-400">{item.value} ({pct}%)</span>
                      </div>
                      <div className="progress" style={{ height: '6px', backgroundColor: '#334155' }}>
                        <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: item.color }}/>
                      </div>
                    </div>);
            })}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 d-flex align-items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500"/> Meeting Room Utilization
              </h6>
              <div className="space-y-3">
                {[
                { room: 'Conference Room B', pct: 65, color: '#10b981' },
                { room: 'Meeting Room C', pct: 40, color: '#818cf8' },
                { room: 'Executive Suite', pct: 80, color: '#f59e0b' },
            ].map((item, i) => (<div key={i} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-lg p-3 d-flex justify-content-between align-items-center">
                    <span className="text-xs font-semibold text-slate-300">{item.room}</span>
                    <span className="text-xs font-bold" style={{ color: item.color }}>{item.pct}% Reserved</span>
                  </div>))}
              </div>
            </div>
          </div>
        </div>)}

      {/* MODALS */}
      {isWizardOpen && (<NewAppointmentWizardModal onClose={() => setIsWizardOpen(false)} onSuccess={handleCreateSuccess}/>)}

      {isDetailsOpen && selectedAppointment && (<AppointmentDetailsModal appointment={selectedAppointment} onClose={() => setIsDetailsOpen(false)} onApprove={(appt) => setApprovalModalState({ open: true, appt, mode: 'approve' })} onReject={(appt) => setApprovalModalState({ open: true, appt, mode: 'reject' })} onReschedule={(appt) => setRescheduleModalState({ open: true, appt })} onCancel={(appt) => setCancelModalState({ open: true, appt })}/>)}

      {approvalModalState.open && approvalModalState.appt && (<AppointmentApprovalModal appointment={approvalModalState.appt} mode={approvalModalState.mode} onClose={() => setApprovalModalState({ open: false, appt: null, mode: 'approve' })} onConfirm={handleApprovalConfirm}/>)}

      {rescheduleModalState.open && rescheduleModalState.appt && (<AppointmentRescheduleModal appointment={rescheduleModalState.appt} onClose={() => setRescheduleModalState({ open: false, appt: null })} onConfirm={handleRescheduleConfirm}/>)}

      {cancelModalState.open && cancelModalState.appt && (<AppointmentCancelModal appointment={cancelModalState.appt} onClose={() => setCancelModalState({ open: false, appt: null })} onConfirm={handleCancelConfirm}/>)}
    </div>);
}
