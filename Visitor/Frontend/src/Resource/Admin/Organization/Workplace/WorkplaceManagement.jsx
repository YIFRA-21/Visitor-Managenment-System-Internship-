import React, { useState, useEffect, useCallback } from 'react';
import {
    Briefcase, Building2, Layers, DoorOpen, Users, Search, Filter, RefreshCw,
    Edit, History, CheckCircle, AlertTriangle, Calendar, Clock, MapPin, Check,
    X, Shield, ArrowRight, UserCheck
} from 'lucide-react';
import locationService from '../../../../services/locationService';
import { useTheme } from '../../../../theme/ThemeContext';

export default function WorkplaceManagement() {
    const { isDark } = useTheme();

    // Data states
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({ total_assigned: 0, permanent: 0, temporary: 0, remote: 0, flexible: 0 });
    const [organizations, setOrganizations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOrg, setFilterOrg] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterBuilding, setFilterBuilding] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Modals
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Assignment Form State
    const [modalBranches, setModalBranches] = useState([]);
    const [modalBuildings, setModalBuildings] = useState([]);
    const [modalFloors, setModalFloors] = useState([]);
    const [modalRooms, setModalRooms] = useState([]);

    const [assignForm, setAssignForm] = useState({
        employee_id: '',
        organization_id: '',
        branch_id: '',
        building_id: '',
        floor_id: '',
        room_id: '',
        floor_number: '',
        office_number: '',
        workplace_status: 'Permanent',
        effective_start_date: new Date().toISOString().split('T')[0],
        effective_end_date: '',
        assignment_reason: 'Standard Workplace Assignment'
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Load initial reference data
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const orgs = await locationService.getOrganizations();
            setOrganizations(orgs);
            const bList = await locationService.getBuildings();
            setBuildings(bList.data || []);
            const depts = await locationService.getDepartments();
            setDepartments(depts);
            const statRes = await locationService.getWorkplaceStats();
            if (statRes.data) setStats(statRes.data);
        } catch (err) {
            console.error('Failed to load workplace reference data:', err);
        }
    };

    // Load branches when filterOrg changes
    useEffect(() => {
        async function fetchBranches() {
            try {
                const bList = await locationService.getBranches(filterOrg || undefined);
                setBranches(bList);
            } catch (err) {
                console.error('Failed to load branches:', err);
            }
        }
        fetchBranches();
    }, [filterOrg]);

    // Fetch assignments
    const fetchAssignments = useCallback(async () => {
        try {
            setError(null);
            const params = {
                organization_id: filterOrg || undefined,
                branch_id: filterBranch || undefined,
                building_id: filterBuilding || undefined,
                department_id: filterDept || undefined,
                status: filterStatus || undefined,
                search: searchTerm.trim() || undefined
            };
            const res = await locationService.getWorkplaceAssignments(params);
            setAssignments(res.data || []);
        } catch (err) {
            console.error('Failed to load workplace assignments:', err);
            setError(err.response?.data?.message || 'Failed to load employee workplace assignments.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterOrg, filterBranch, filterBuilding, filterDept, filterStatus, searchTerm]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAssignments();
    };

    // Cascading in assignment modal: Organization -> Branch -> Building -> Floor -> Room
    useEffect(() => {
        async function fetchModalBranches() {
            if (!assignForm.organization_id) {
                setModalBranches([]);
                return;
            }
            try {
                const bList = await locationService.getBranches(assignForm.organization_id);
                setModalBranches(bList);
            } catch (err) {
                console.error(err);
            }
        }
        fetchModalBranches();
    }, [assignForm.organization_id]);

    useEffect(() => {
        async function fetchModalBuildings() {
            if (!assignForm.branch_id) {
                setModalBuildings([]);
                return;
            }
            try {
                const res = await locationService.getBuildings({ branch_id: assignForm.branch_id });
                setModalBuildings(res.data || []);
            } catch (err) {
                console.error(err);
            }
        }
        fetchModalBuildings();
    }, [assignForm.branch_id]);

    useEffect(() => {
        async function fetchModalFloors() {
            if (!assignForm.building_id) {
                setModalFloors([]);
                return;
            }
            try {
                const res = await locationService.getFloors({ building_id: assignForm.building_id });
                setModalFloors(res.data || []);
            } catch (err) {
                console.error(err);
            }
        }
        fetchModalFloors();
    }, [assignForm.building_id]);

    useEffect(() => {
        async function fetchModalRooms() {
            if (!assignForm.floor_id) {
                setModalRooms([]);
                return;
            }
            try {
                const res = await locationService.getRooms({ floor_id: assignForm.floor_id });
                setModalRooms(res.data || []);
            } catch (err) {
                console.error(err);
            }
        }
        fetchModalRooms();
    }, [assignForm.floor_id]);

    // Open Assign Modal for an employee
    const handleOpenAssign = (emp) => {
        setSelectedEmployee(emp);
        setAssignForm({
            employee_id: emp.id,
            organization_id: emp.organization_id || organizations[0]?.id || '',
            branch_id: emp.branch_id || '',
            building_id: emp.building_id || '',
            floor_id: emp.floor_id || '',
            room_id: emp.room_id || '',
            floor_number: emp.floor_number || '',
            office_number: emp.office_number || '',
            workplace_status: emp.workplace_status || 'Permanent',
            effective_start_date: new Date().toISOString().split('T')[0],
            effective_end_date: '',
            assignment_reason: 'Desk Reassignment & Location Update'
        });
        setFormErrors({});
        setShowAssignModal(true);
    };

    // Open History Modal for an employee
    const handleOpenHistory = async (emp) => {
        setSelectedEmployee(emp);
        setShowHistoryModal(true);
        setLoadingHistory(true);
        try {
            const res = await locationService.getEmployeeWorkplaceHistory(emp.id);
            setHistoryList(res.data || []);
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Validate and submit assignment
    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!assignForm.organization_id) errors.organization_id = 'Organization is required';
        if (!assignForm.branch_id) errors.branch_id = 'Branch is required';
        if (!assignForm.building_id) errors.building_id = 'Building is required';
        if (!assignForm.effective_start_date) errors.effective_start_date = 'Effective start date is required';
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setSubmitting(true);
        try {
            // Find selected floor and room details to auto-populate floor_number / office_number
            const selectedFloorObj = modalFloors.find(f => String(f.id) === String(assignForm.floor_id));
            const selectedRoomObj = modalRooms.find(r => String(r.id) === String(assignForm.room_id));

            const payload = {
                ...assignForm,
                floor_number: selectedFloorObj ? String(selectedFloorObj.floor_number) : assignForm.floor_number,
                office_number: selectedRoomObj ? (selectedRoomObj.room_code || selectedRoomObj.room_name) : assignForm.office_number
            };

            await locationService.assignEmployeeWorkplace(payload);
            setSuccessMessage(`Workplace successfully assigned for ${selectedEmployee?.full_name || 'employee'}!`);
            setShowAssignModal(false);
            fetchAssignments();
            const statRes = await locationService.getWorkplaceStats();
            if (statRes.data) setStats(statRes.data);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            console.error('Assignment failed:', err);
            setFormErrors({ submit: err.response?.data?.message || 'Failed to update employee workplace assignment.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`p-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <Briefcase className="text-primary" size={26} />
                        Employee Workplace & Location Assignment
                    </h4>
                    <p className={`small mb-0 ${isDark ? 'text-slate-400' : 'text-muted'}`}>
                        Map personnel to enterprise physical hierarchy (Organization &rarr; Branch &rarr; Building &rarr; Floor &rarr; Desk/Office) with complete audit history.
                    </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className={`btn btn-sm ${isDark ? 'btn-outline-secondary text-white' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
                        disabled={refreshing}
                    >
                        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Notification Alerts */}
            {successMessage && (
                <div className="alert alert-success d-flex align-items-center gap-2 alert-dismissible fade show mb-4" role="alert">
                    <CheckCircle size={18} />
                    <div>{successMessage}</div>
                    <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
                </div>
            )}

            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 alert-dismissible fade show mb-4" role="alert">
                    <AlertTriangle size={18} />
                    <div>{error}</div>
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className={`card border-0 shadow-sm rounded-3 p-3 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Total Assigned</span>
                                <h3 className="fw-bold mb-0 mt-1">{stats.total_assigned || assignments.length}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-primary bg-opacity-10 text-primary">
                                <Users size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className={`card border-0 shadow-sm rounded-3 p-3 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Permanent Desks</span>
                                <h3 className="fw-bold mb-0 mt-1 text-success">{stats.permanent || 0}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-success bg-opacity-10 text-success">
                                <Building2 size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className={`card border-0 shadow-sm rounded-3 p-3 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Flexible / Hot Desks</span>
                                <h3 className="fw-bold mb-0 mt-1 text-warning">{stats.flexible || 0}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-warning bg-opacity-10 text-warning">
                                <DoorOpen size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className={`card border-0 shadow-sm rounded-3 p-3 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Remote / Floating</span>
                                <h3 className="fw-bold mb-0 mt-1 text-info">{stats.remote || 0}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-info bg-opacity-10 text-info">
                                <UserCheck size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={`card border-0 shadow-sm rounded-3 p-3 mb-4 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-3">
                        <div className="input-group input-group-sm">
                            <span className={`input-group-text ${isDark ? 'bg-secondary bg-opacity-25 border-secondary text-slate-300' : ''}`}>
                                <Search size={15} />
                            </span>
                            <input
                                type="text"
                                className={`form-control ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                placeholder="Search employee name, number, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-6 col-md-2">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={filterOrg}
                            onChange={(e) => { setFilterOrg(e.target.value); setFilterBranch(''); }}
                        >
                            <option value="">All Organizations</option>
                            {organizations.map(o => (
                                <option key={o.id} value={o.id}>{o.name || o.organization_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-2">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={filterBranch}
                            onChange={(e) => setFilterBranch(e.target.value)}
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-2">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={filterBuilding}
                            onChange={(e) => setFilterBuilding(e.target.value)}
                        >
                            <option value="">All Buildings</option>
                            {buildings.map(b => (
                                <option key={b.id} value={b.id}>{b.building_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-3">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Workplace Types</option>
                            <option value="Permanent">Permanent</option>
                            <option value="Temporary">Temporary</option>
                            <option value="Remote">Remote</option>
                            <option value="Flexible">Flexible / Hot-Desk</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Assignments Table */}
            <div className={`card border-0 shadow-sm rounded-3 overflow-hidden ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                <div className="table-responsive">
                    <table className={`table align-middle mb-0 ${isDark ? 'table-dark' : 'table-hover'}`}>
                        <thead className={isDark ? 'table-dark' : 'table-light'}>
                            <tr>
                                <th>Employee</th>
                                <th>Department</th>
                                <th>Branch & Facility</th>
                                <th>Floor & Desk</th>
                                <th>Workplace Type</th>
                                <th>Effective Period</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="small text-muted mt-2">Loading workplace assignments...</p>
                                    </td>
                                </tr>
                            ) : assignments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5">
                                        <Users size={40} className="text-muted mb-2 opacity-50" />
                                        <h6 className="fw-bold mb-1">No Workplace Assignments Found</h6>
                                        <p className="small text-muted mb-0">Try adjusting your filters or search keywords.</p>
                                    </td>
                                </tr>
                            ) : (
                                assignments.map(emp => (
                                    <tr key={emp.id}>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                                                    {(emp.first_name?.[0] || 'E') + (emp.last_name?.[0] || '')}
                                                </div>
                                                <div>
                                                    <span className="fw-semibold d-block">{emp.full_name || `${emp.first_name} ${emp.last_name}`}</span>
                                                    <span className="small text-muted">{emp.job_title || 'Staff'} &bull; {emp.employee_number || `#${emp.id}`}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="fw-medium">{emp.department_name || 'General'}</span>
                                            {emp.organization_name && (
                                                <span className="small text-muted d-block">{emp.organization_name}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="small">
                                                <div className="fw-semibold">{emp.branch_name || 'Main Branch'}</div>
                                                <div className="text-muted d-flex align-items-center gap-1">
                                                    <Building2 size={13} className="text-primary" />
                                                    <span>{emp.building_name || 'Main Facility'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="small">
                                                <div className="d-flex align-items-center gap-1">
                                                    <Layers size={13} className="text-info" />
                                                    <span>{emp.floor_name ? `${emp.floor_name} (L${emp.floor_number})` : `Floor ${emp.floor_number || 'N/A'}`}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-1 text-muted">
                                                    <DoorOpen size={13} className="text-warning" />
                                                    <span>{emp.room_name || `Desk/Office ${emp.office_number || 'N/A'}`}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge px-2 py-1 ${
                                                emp.workplace_status === 'Permanent' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' :
                                                emp.workplace_status === 'Flexible' ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25' :
                                                emp.workplace_status === 'Remote' ? 'bg-info bg-opacity-10 text-info border border-info border-opacity-25' :
                                                'bg-secondary bg-opacity-10 text-secondary'
                                            }`}>
                                                {emp.workplace_status || 'Permanent'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="small">
                                                <span>{emp.effective_start_date ? new Date(emp.effective_start_date).toLocaleDateString() : 'Active'}</span>
                                                {emp.effective_end_date && (
                                                    <span className="text-muted d-block">to {new Date(emp.effective_end_date).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-end">
                                            <div className="d-flex align-items-center justify-content-end gap-1">
                                                <button
                                                    onClick={() => handleOpenHistory(emp)}
                                                    className="btn btn-sm btn-ghost p-1 text-info"
                                                    title="View Workplace Assignment History"
                                                >
                                                    <History size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenAssign(emp)}
                                                    className="btn btn-sm btn-ghost p-1 text-primary"
                                                    title="Reassign Workplace Location"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Workplace Assignment Modal */}
            {showAssignModal && selectedEmployee && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className={`modal-content border-0 shadow ${isDark ? 'bg-dark text-white border border-secondary border-opacity-25' : 'bg-white'}`}>
                            <div className="modal-header border-bottom border-secondary border-opacity-25">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    <Briefcase className="text-primary" size={20} />
                                    Assign Workplace Location &mdash; {selectedEmployee.full_name}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmitAssignment}>
                                <div className="modal-body p-4">
                                    {formErrors.submit && (
                                        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                                            <AlertTriangle size={16} />
                                            <div>{formErrors.submit}</div>
                                        </div>
                                    )}

                                    {/* Employee Summary Banner */}
                                    <div className="p-3 rounded-3 bg-secondary bg-opacity-10 mb-3 d-flex align-items-center justify-content-between">
                                        <div>
                                            <span className="fw-bold d-block">{selectedEmployee.full_name}</span>
                                            <span className="small text-muted">{selectedEmployee.job_title} &bull; {selectedEmployee.email}</span>
                                        </div>
                                        <span className="badge bg-primary">{selectedEmployee.department_name || 'Staff'}</span>
                                    </div>

                                    <div className="row g-3">
                                        {/* Physical Hierarchy Cascading Selectors */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">1. Organization *</label>
                                            <select
                                                className={`form-select ${formErrors.organization_id ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={assignForm.organization_id}
                                                onChange={(e) => setAssignForm({
                                                    ...assignForm,
                                                    organization_id: e.target.value,
                                                    branch_id: '',
                                                    building_id: '',
                                                    floor_id: '',
                                                    room_id: ''
                                                })}
                                            >
                                                <option value="">Select Organization</option>
                                                {organizations.map(o => (
                                                    <option key={o.id} value={o.id}>{o.name || o.organization_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">2. Branch / Campus *</label>
                                            <select
                                                className={`form-select ${formErrors.branch_id ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={assignForm.branch_id}
                                                onChange={(e) => setAssignForm({
                                                    ...assignForm,
                                                    branch_id: e.target.value,
                                                    building_id: '',
                                                    floor_id: '',
                                                    room_id: ''
                                                })}
                                                disabled={!assignForm.organization_id}
                                            >
                                                <option value="">Select Branch</option>
                                                {modalBranches.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">3. Building / Facility *</label>
                                            <select
                                                className={`form-select ${formErrors.building_id ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={assignForm.building_id}
                                                onChange={(e) => setAssignForm({
                                                    ...assignForm,
                                                    building_id: e.target.value,
                                                    floor_id: '',
                                                    room_id: ''
                                                })}
                                                disabled={!assignForm.branch_id}
                                            >
                                                <option value="">Select Facility</option>
                                                {modalBuildings.map(b => (
                                                    <option key={b.id} value={b.id}>{b.building_name} ({b.building_code})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">4. Floor Level</label>
                                            <select
                                                className={`form-select ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={assignForm.floor_id}
                                                onChange={(e) => setAssignForm({
                                                    ...assignForm,
                                                    floor_id: e.target.value,
                                                    room_id: ''
                                                })}
                                                disabled={!assignForm.building_id}
                                            >
                                                <option value="">Select Floor</option>
                                                {modalFloors.map(f => (
                                                    <option key={f.id} value={f.id}>Level {f.floor_number} - {f.floor_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">5. Room / Office / Zone</label>
                                            <select
                                                className={`form-select ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={assignForm.room_id}
                                                onChange={(e) => setAssignForm({ ...assignForm, room_id: e.target.value })}
                                                disabled={!assignForm.floor_id}
                                            >
                                                <option value="">Select Room / Office</option>
                                                {modalRooms.map(r => (
                                                    <option key={r.id} value={r.id}>{r.room_name} ({r.room_code})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Workplace Status Type</label>
                                            <select
                                                className={`form-select ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={assignForm.workplace_status}
                                                onChange={(e) => setAssignForm({ ...assignForm, workplace_status: e.target.value })}
                                            >
                                                <option value="Permanent">Permanent Dedicated Desk</option>
                                                <option value="Temporary">Temporary Project Desk</option>
                                                <option value="Flexible">Flexible Hot-Desk</option>
                                                <option value="Remote">Remote / Mobile Worker</option>
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Effective Start Date *</label>
                                            <input
                                                type="date"
                                                className={`form-control ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={assignForm.effective_start_date}
                                                onChange={(e) => setAssignForm({ ...assignForm, effective_start_date: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Effective End Date (Optional)</label>
                                            <input
                                                type="date"
                                                className={`form-control ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={assignForm.effective_end_date}
                                                onChange={(e) => setAssignForm({ ...assignForm, effective_end_date: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Assignment Reason / Audit Note</label>
                                            <input
                                                type="text"
                                                className={`form-control ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="e.g., Department relocation, promotion to managerial office, project reassignment"
                                                value={assignForm.assignment_reason}
                                                onChange={(e) => setAssignForm({ ...assignForm, assignment_reason: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top border-secondary border-opacity-25">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAssignModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                        {submitting ? 'Applying Assignment...' : 'Save & Audit Assignment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Workplace History Audit Modal */}
            {showHistoryModal && selectedEmployee && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className={`modal-content border-0 shadow ${isDark ? 'bg-dark text-white border border-secondary border-opacity-25' : 'bg-white'}`}>
                            <div className="modal-header border-bottom border-secondary border-opacity-25">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    <History className="text-info" size={20} />
                                    Workplace Location Audit Trail &mdash; {selectedEmployee.full_name}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowHistoryModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {loadingHistory ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-info" role="status"></div>
                                        <p className="small text-muted mt-2">Loading historical workplace movements...</p>
                                    </div>
                                ) : historyList.length === 0 ? (
                                    <div className="text-center py-4 border border-dashed rounded-3">
                                        <History size={30} className="text-muted opacity-50 mb-2" />
                                        <p className="small text-muted mb-0">No historical reassignments recorded yet. Current assignment is initial placement.</p>
                                    </div>
                                ) : (
                                    <div className="timeline-container">
                                        {historyList.map((hist, index) => (
                                            <div key={hist.id || index} className="p-3 mb-3 rounded-3 border border-secondary border-opacity-25 bg-secondary bg-opacity-10">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="badge bg-primary">{hist.workplace_status || 'Assigned'}</span>
                                                    <span className="small text-muted d-flex align-items-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(hist.created_at || hist.effective_start_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2 text-sm mb-2">
                                                    <span className="fw-semibold">{hist.building_name || 'Building'}</span>
                                                    <span className="text-muted">&bull;</span>
                                                    <span>{hist.floor_name || `Floor ${hist.floor_number}`}</span>
                                                    <span className="text-muted">&bull;</span>
                                                    <span className="text-warning fw-semibold">{hist.room_name || `Desk ${hist.office_number}`}</span>
                                                </div>
                                                {hist.assignment_reason && (
                                                    <div className="small text-muted fst-italic">
                                                        "{hist.assignment_reason}"
                                                    </div>
                                                )}
                                                {hist.assigned_by_name && (
                                                    <div className="small text-muted mt-1">
                                                        Audited by: {hist.assigned_by_name}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-top border-secondary border-opacity-25">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowHistoryModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
