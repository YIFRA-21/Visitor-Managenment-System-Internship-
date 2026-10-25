import React, { useState, useEffect, useCallback } from 'react';
import {
    Layers, Building2, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye,
    CheckCircle, XCircle, AlertTriangle, DoorOpen, Users, MapPin, X
} from 'lucide-react';
import locationService from '../../../../services/locationService';
import { useTheme } from '../../../../theme/ThemeContext';

export default function FloorManagement() {
    const { isDark } = useTheme();

    // Data states
    const [floors, setFloors] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrg, setSelectedOrg] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [currentFloor, setCurrentFloor] = useState(null);
    const [showRoomsDrawer, setShowRoomsDrawer] = useState(false);
    const [roomsOnFloor, setRoomsOnFloor] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        building_id: '',
        floor_number: 1,
        floor_name: '',
        floor_code: '',
        capacity: 50,
        description: '',
        is_active: 1
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

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
        } catch (err) {
            console.error('Failed to load initial data:', err);
        }
    };

    // Load branches when organization changes
    useEffect(() => {
        async function fetchBranches() {
            try {
                const bList = await locationService.getBranches(selectedOrg || undefined);
                setBranches(bList);
            } catch (err) {
                console.error('Failed to load branches:', err);
            }
        }
        fetchBranches();
    }, [selectedOrg]);

    // Fetch floors
    const fetchFloors = useCallback(async () => {
        try {
            setError(null);
            const params = {
                building_id: selectedBuilding || undefined,
                status: statusFilter || undefined,
                search: searchTerm.trim() || undefined
            };
            const res = await locationService.getFloors(params);
            setFloors(res.data || []);
        } catch (err) {
            console.error('Failed to fetch floors:', err);
            if (floors.length === 0) {
                setError(err.response?.data?.message || 'Unable to load floors from server.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedBuilding, statusFilter, searchTerm, floors.length]);

    useEffect(() => {
        fetchFloors();
    }, [fetchFloors]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchFloors();
    };

    // Open Create Modal
    const handleOpenCreate = () => {
        setModalMode('create');
        setCurrentFloor(null);
        setFormData({
            building_id: selectedBuilding || buildings[0]?.id || '',
            floor_number: 1,
            floor_name: '',
            floor_code: '',
            capacity: 50,
            description: '',
            is_active: 1
        });
        setFormErrors({});
        setShowModal(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (floor) => {
        setModalMode('edit');
        setCurrentFloor(floor);
        setFormData({
            building_id: floor.building_id || '',
            floor_number: floor.floor_number ?? 1,
            floor_name: floor.floor_name || '',
            floor_code: floor.floor_code || '',
            capacity: floor.capacity || 50,
            description: floor.description || '',
            is_active: floor.is_active ? 1 : 0
        });
        setFormErrors({});
        setShowModal(true);
    };

    // Open Rooms Drawer
    const handleOpenRooms = async (floor) => {
        setCurrentFloor(floor);
        setShowRoomsDrawer(true);
        setLoadingRooms(true);
        try {
            const res = await locationService.getRooms({ floor_id: floor.id });
            setRoomsOnFloor(res.data || []);
        } catch (err) {
            console.error('Failed to fetch rooms for floor:', err);
        } finally {
            setLoadingRooms(false);
        }
    };

    // Validate Form
    const validateForm = () => {
        const errors = {};
        if (!formData.building_id) errors.building_id = 'Building is required';
        if (formData.floor_number === undefined || formData.floor_number === '') errors.floor_number = 'Floor number is required';
        if (!formData.floor_name.trim()) errors.floor_name = 'Floor name is required';
        if (!formData.floor_code.trim()) errors.floor_code = 'Floor code is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit Form
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            if (modalMode === 'create') {
                await locationService.createFloor(formData);
                setSuccessMessage('Floor created successfully!');
            } else {
                await locationService.updateFloor(currentFloor.id, formData);
                setSuccessMessage('Floor updated successfully!');
            }
            setShowModal(false);
            fetchFloors();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            console.error('Failed to save floor:', err);
            setFormErrors({ submit: err.response?.data?.message || 'Failed to save floor.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Delete confirmation
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteError(null);
        try {
            await locationService.deleteFloor(deleteTarget.id);
            setSuccessMessage(`Floor "${deleteTarget.floor_name}" deleted successfully.`);
            setDeleteTarget(null);
            fetchFloors();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            console.error('Delete failed:', err);
            setDeleteError(err.response?.data?.message || 'Cannot delete floor with assigned rooms or employees.');
        }
    };

    // KPI Metrics
    const totalFloors = floors.length;
    const activeFloors = floors.filter(f => f.is_active).length;
    const totalCapacity = floors.reduce((acc, f) => acc + (parseInt(f.capacity, 10) || 0), 0);
    const totalRooms = floors.reduce((acc, f) => acc + (parseInt(f.room_count, 10) || 0), 0);

    return (
        <div className={`p-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <Layers className="text-info" size={26} />
                        Floor & Level Management
                    </h4>
                    <p className={`small mb-0 ${isDark ? 'text-slate-400' : 'text-muted'}`}>
                        Configure building vertical architecture, floor capacities, zones, and security perimeters.
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
                    <button
                        onClick={handleOpenCreate}
                        className="btn btn-sm btn-info text-white d-flex align-items-center gap-1 shadow-sm"
                    >
                        <Plus size={16} />
                        Add Floor
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
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Total Floors</span>
                                <h3 className="fw-bold mb-0 mt-1">{totalFloors}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-info bg-opacity-10 text-info">
                                <Layers size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className={`card border-0 shadow-sm rounded-3 p-3 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Active Levels</span>
                                <h3 className="fw-bold mb-0 mt-1 text-success">{activeFloors}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-success bg-opacity-10 text-success">
                                <CheckCircle size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className={`card border-0 shadow-sm rounded-3 p-3 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Rooms Installed</span>
                                <h3 className="fw-bold mb-0 mt-1 text-warning">{totalRooms}</h3>
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
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Total Max Capacity</span>
                                <h3 className="fw-bold mb-0 mt-1 text-primary">{totalCapacity}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-primary bg-opacity-10 text-primary">
                                <Users size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={`card border-0 shadow-sm rounded-3 p-3 mb-4 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-4">
                        <div className="input-group input-group-sm">
                            <span className={`input-group-text ${isDark ? 'bg-secondary bg-opacity-25 border-secondary text-slate-300' : ''}`}>
                                <Search size={15} />
                            </span>
                            <input
                                type="text"
                                className={`form-control ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                placeholder="Search floor name, code, level..."
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

                    <div className="col-6 col-md-4">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={selectedBuilding}
                            onChange={(e) => setSelectedBuilding(e.target.value)}
                        >
                            <option value="">All Buildings</option>
                            {buildings.map(b => (
                                <option key={b.id} value={b.id}>{b.building_name} ({b.building_code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-4">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="1">Active Only</option>
                            <option value="0">Inactive Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Floor Table */}
            <div className={`card border-0 shadow-sm rounded-3 overflow-hidden ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                <div className="table-responsive">
                    <table className={`table align-middle mb-0 ${isDark ? 'table-dark' : 'table-hover'}`}>
                        <thead className={isDark ? 'table-dark' : 'table-light'}>
                            <tr>
                                <th>Level</th>
                                <th>Floor Name</th>
                                <th>Code</th>
                                <th>Facility / Building</th>
                                <th className="text-center">Capacity</th>
                                <th className="text-center">Rooms</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <div className="spinner-border text-info" role="status"></div>
                                        <p className="small text-muted mt-2">Loading floor directory...</p>
                                    </td>
                                </tr>
                            ) : floors.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <Layers size={40} className="text-muted mb-2 opacity-50" />
                                        <h6 className="fw-bold mb-1">No Floors Configured</h6>
                                        <p className="small text-muted mb-3">Add floor levels to your buildings to map meeting rooms and desks.</p>
                                        <button onClick={handleOpenCreate} className="btn btn-sm btn-info text-white">
                                            <Plus size={14} className="me-1" /> Add Floor
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                floors.map(f => (
                                    <tr key={f.id}>
                                        <td>
                                            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold font-monospace px-2 py-1">
                                                L{f.floor_number}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="fw-semibold">{f.floor_name}</div>
                                            {f.description && (
                                                <div className="small text-muted text-truncate" style={{ maxWidth: '220px' }}>
                                                    {f.description}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className="badge bg-secondary bg-opacity-25 text-body font-monospace px-2 py-1">
                                                {f.floor_code}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-1 small">
                                                <Building2 size={14} className="text-primary" />
                                                <span className="fw-medium">{f.building_name || 'N/A'}</span>
                                            </div>
                                            {f.branch_name && (
                                                <div className="small text-muted">{f.branch_name}</div>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <span className="badge bg-light text-dark border px-2 py-1">
                                                {f.capacity || 'N/A'} people
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                onClick={() => handleOpenRooms(f)}
                                                className="btn btn-sm btn-link text-warning text-decoration-none fw-bold p-0"
                                            >
                                                {f.room_count || 0} Rooms
                                            </button>
                                        </td>
                                        <td>
                                            {f.is_active ? (
                                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-end">
                                            <div className="d-flex align-items-center justify-content-end gap-1">
                                                <button
                                                    onClick={() => handleOpenRooms(f)}
                                                    className="btn btn-sm btn-ghost p-1 text-warning"
                                                    title="View Rooms on this Floor"
                                                >
                                                    <DoorOpen size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(f)}
                                                    className="btn btn-sm btn-ghost p-1 text-secondary"
                                                    title="Edit Floor"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(f)}
                                                    className="btn btn-sm btn-ghost p-1 text-danger"
                                                    title="Delete Floor"
                                                >
                                                    <Trash2 size={16} />
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

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className={`modal-content border-0 shadow ${isDark ? 'bg-dark text-white border border-secondary border-opacity-25' : 'bg-white'}`}>
                            <div className="modal-header border-bottom border-secondary border-opacity-25">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    <Layers className="text-info" size={20} />
                                    {modalMode === 'create' ? 'Add Building Floor' : `Edit Floor: ${currentFloor?.floor_name}`}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmitForm}>
                                <div className="modal-body p-4">
                                    {formErrors.submit && (
                                        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                                            <AlertTriangle size={16} />
                                            <div>{formErrors.submit}</div>
                                        </div>
                                    )}

                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Building / Facility *</label>
                                            <select
                                                className={`form-select ${formErrors.building_id ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.building_id}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, building_id: e.target.value });
                                                    setFormErrors({ ...formErrors, building_id: null });
                                                }}
                                            >
                                                <option value="">Select Building</option>
                                                {buildings.map(b => (
                                                    <option key={b.id} value={b.id}>{b.building_name} ({b.building_code})</option>
                                                ))}
                                            </select>
                                            {formErrors.building_id && <div className="invalid-feedback">{formErrors.building_id}</div>}
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Floor Level Number *</label>
                                            <input
                                                type="number"
                                                className={`form-control ${formErrors.floor_number ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="0 for Ground, 1 for 1st..."
                                                value={formData.floor_number}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, floor_number: parseInt(e.target.value, 10) });
                                                    setFormErrors({ ...formErrors, floor_number: null });
                                                }}
                                            />
                                            {formErrors.floor_number && <div className="invalid-feedback">{formErrors.floor_number}</div>}
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Floor Code *</label>
                                            <input
                                                type="text"
                                                className={`form-control font-monospace text-uppercase ${formErrors.floor_code ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="e.g., FL-01, G-00"
                                                value={formData.floor_code}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, floor_code: e.target.value.toUpperCase() });
                                                    setFormErrors({ ...formErrors, floor_code: null });
                                                }}
                                            />
                                            {formErrors.floor_code && <div className="invalid-feedback">{formErrors.floor_code}</div>}
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Floor Name / Label *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${formErrors.floor_name ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="e.g., Ground Floor Lobby, Executive Suite, 3rd Floor Engineering"
                                                value={formData.floor_name}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, floor_name: e.target.value });
                                                    setFormErrors({ ...formErrors, floor_name: null });
                                                }}
                                            />
                                            {formErrors.floor_name && <div className="invalid-feedback">{formErrors.floor_name}</div>}
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Maximum Capacity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className={`form-control ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.capacity}
                                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })}
                                            />
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Operational Status</label>
                                            <select
                                                className={`form-select ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value, 10) })}
                                            >
                                                <option value="1">Active</option>
                                                <option value="0">Inactive / Maintenance</option>
                                            </select>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Description / Notes</label>
                                            <textarea
                                                rows="2"
                                                className={`form-control ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="Zone restrictions, emergency exits, access control gates..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top border-secondary border-opacity-25">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-info text-white btn-sm" disabled={submitting}>
                                        {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Floor' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Floor Rooms Drawer */}
            {showRoomsDrawer && currentFloor && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className={`modal-content border-0 shadow ${isDark ? 'bg-dark text-white border border-secondary border-opacity-25' : 'bg-white'}`}>
                            <div className="modal-header border-bottom border-secondary border-opacity-25">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    <DoorOpen className="text-warning" size={20} />
                                    Rooms on Level {currentFloor.floor_number} &mdash; {currentFloor.floor_name}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowRoomsDrawer(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {loadingRooms ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
                                        <span className="ms-2 small text-muted">Loading rooms on this floor...</span>
                                    </div>
                                ) : roomsOnFloor.length === 0 ? (
                                    <div className="text-center py-4 border border-dashed rounded-3">
                                        <DoorOpen size={30} className="text-muted opacity-50 mb-2" />
                                        <p className="small text-muted mb-0">No rooms or offices currently assigned to this floor.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm align-middle">
                                            <thead>
                                                <tr>
                                                    <th>Room Name</th>
                                                    <th>Code</th>
                                                    <th>Type</th>
                                                    <th className="text-center">Capacity</th>
                                                    <th>Bookable</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {roomsOnFloor.map(rm => (
                                                    <tr key={rm.id}>
                                                        <td className="fw-semibold">{rm.room_name}</td>
                                                        <td><span className="badge bg-secondary font-monospace">{rm.room_code || 'N/A'}</span></td>
                                                        <td><span className="badge bg-info bg-opacity-10 text-info">{rm.room_type || 'Meeting'}</span></td>
                                                        <td className="text-center">{rm.capacity || 'N/A'}</td>
                                                        <td>{rm.is_bookable ? <span className="text-success small fw-bold">Yes</span> : <span className="text-muted small">No</span>}</td>
                                                        <td>{rm.is_active ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Inactive</span>}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-top border-secondary border-opacity-25">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRoomsDrawer(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className={`modal-content border-0 shadow ${isDark ? 'bg-dark text-white border border-secondary border-opacity-25' : 'bg-white'}`}>
                            <div className="modal-header border-bottom border-secondary border-opacity-25">
                                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                                    <AlertTriangle size={20} />
                                    Confirm Floor Deletion
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {deleteError && (
                                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                                        <AlertTriangle size={16} />
                                        <div>{deleteError}</div>
                                    </div>
                                )}
                                <p className="mb-2">
                                    Are you sure you want to delete floor <strong>"{deleteTarget.floor_name}"</strong> (Level {deleteTarget.floor_number})?
                                </p>
                                <div className="p-3 rounded-2 bg-danger bg-opacity-10 text-danger small">
                                    <strong>Dependency Restriction:</strong> Floors with active meeting rooms or employee workplace assignments cannot be deleted.
                                </div>
                            </div>
                            <div className="modal-footer border-top border-secondary border-opacity-25">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-danger btn-sm" onClick={confirmDelete}>
                                    Confirm Deletion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
