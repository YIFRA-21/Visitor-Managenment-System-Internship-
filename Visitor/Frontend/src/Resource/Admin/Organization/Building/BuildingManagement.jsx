import React, { useState, useEffect, useCallback } from 'react';
import {
    Building2, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye,
    CheckCircle, XCircle, AlertTriangle, Layers, DoorOpen, MapPin,
    ArrowUpDown, ChevronRight, X, Info
} from 'lucide-react';
import locationService from '../../../../services/locationService';
import { useTheme } from '../../../../theme/ThemeContext';

export default function BuildingManagement() {
    const { isDark } = useTheme();

    // Data states
    const [buildings, setBuildings] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrg, setSelectedOrg] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Pagination & Sorting
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [sortBy, setSortBy] = useState('building_name');
    const [sortOrder, setSortOrder] = useState('ASC');

    // Modals & Drawers
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [currentBuilding, setCurrentBuilding] = useState(null);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);
    const [selectedBuildingDetails, setSelectedBuildingDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        organization_id: '',
        branch_id: '',
        building_name: '',
        building_code: '',
        total_floors: 1,
        address: '',
        description: '',
        is_active: 1
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Delete / Deactivate dialog
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

    // Load initial reference data
    useEffect(() => {
        loadReferenceData();
    }, []);

    const loadReferenceData = async () => {
        try {
            const orgs = await locationService.getOrganizations();
            setOrganizations(orgs);
        } catch (err) {
            console.error('Failed to load organizations:', err);
        }
    };

    // Load branches when organization changes in filters or form
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

    // Fetch buildings list
    const fetchBuildings = useCallback(async () => {
        try {
            setError(null);
            const params = {
                organization_id: selectedOrg || undefined,
                branch_id: selectedBranch || undefined,
                status: statusFilter || undefined,
                search: searchTerm.trim() || undefined
            };
            const res = await locationService.getBuildings(params);
            const data = res.data || [];
            setBuildings(data);
        } catch (err) {
            console.error('Failed to fetch buildings:', err);
            setError(err.response?.data?.message || 'Failed to fetch buildings from server.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedOrg, selectedBranch, statusFilter, searchTerm]);

    useEffect(() => {
        fetchBuildings();
    }, [fetchBuildings]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchBuildings();
    };

    // Handle Open Create Modal
    const handleOpenCreate = () => {
        setModalMode('create');
        setCurrentBuilding(null);
        setFormData({
            organization_id: organizations[0]?.id || '',
            branch_id: branches[0]?.id || '',
            building_name: '',
            building_code: '',
            total_floors: 1,
            address: '',
            description: '',
            is_active: 1
        });
        setFormErrors({});
        setShowModal(true);
    };

    // Handle Open Edit Modal
    const handleOpenEdit = (building) => {
        setModalMode('edit');
        setCurrentBuilding(building);
        setFormData({
            organization_id: building.organization_id || '',
            branch_id: building.branch_id || '',
            building_name: building.building_name || '',
            building_code: building.building_code || '',
            total_floors: building.total_floors || 1,
            address: building.address || '',
            description: building.description || '',
            is_active: building.is_active ? 1 : 0
        });
        setFormErrors({});
        setShowModal(true);
    };

    // Handle Open Detail Drawer
    const handleOpenDetails = async (building) => {
        setCurrentBuilding(building);
        setShowDetailDrawer(true);
        setLoadingDetails(true);
        try {
            const stats = await locationService.getBuildingStats(building.id);
            setSelectedBuildingDetails(stats.data);
        } catch (err) {
            console.error('Failed to load building stats:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Form Validation
    const validateForm = () => {
        const errors = {};
        if (!formData.organization_id) errors.organization_id = 'Organization is required';
        if (!formData.branch_id) errors.branch_id = 'Branch is required';
        if (!formData.building_name.trim()) errors.building_name = 'Building Name is required';
        if (!formData.building_code.trim()) errors.building_code = 'Building Code is required';
        if (!formData.total_floors || formData.total_floors < 1) errors.total_floors = 'Must have at least 1 floor';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit Create or Edit
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            if (modalMode === 'create') {
                await locationService.createBuilding(formData);
                setSuccessMessage('Building created successfully!');
            } else {
                await locationService.updateBuilding(currentBuilding.id, formData);
                setSuccessMessage('Building updated successfully!');
            }
            setShowModal(false);
            fetchBuildings();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            console.error('Failed to save building:', err);
            setFormErrors({ submit: err.response?.data?.message || 'Failed to save building.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete or Deactivate
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteError(null);
        try {
            await locationService.deleteBuilding(deleteTarget.id);
            setSuccessMessage(`Building "${deleteTarget.building_name}" deleted successfully.`);
            setDeleteTarget(null);
            fetchBuildings();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            console.error('Delete failed:', err);
            setDeleteError(err.response?.data?.message || 'Cannot delete building with active floors or rooms.');
        }
    };

    // Quick Stats Calculation
    const totalBuildings = buildings.length;
    const activeBuildings = buildings.filter(b => b.is_active).length;
    const totalFloorsCount = buildings.reduce((acc, b) => acc + (parseInt(b.floor_count, 10) || parseInt(b.total_floors, 10) || 0), 0);
    const totalRoomsCount = buildings.reduce((acc, b) => acc + (parseInt(b.room_count, 10) || 0), 0);

    return (
        <div className={`p-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {/* Page Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <Building2 className="text-primary" size={26} />
                        Building & Campus Management
                    </h4>
                    <p className={`small mb-0 ${isDark ? 'text-slate-400' : 'text-muted'}`}>
                        Manage enterprise facilities, campus structures, floors, and workplace infrastructure.
                    </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className={`btn btn-sm ${isDark ? 'btn-outline-secondary text-white' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
                        disabled={refreshing}
                        title="Refresh Data"
                    >
                        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm"
                    >
                        <Plus size={16} />
                        Add Building
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

            {/* Metric KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className={`card border-0 shadow-sm rounded-3 p-3 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Total Buildings</span>
                                <h3 className="fw-bold mb-0 mt-1">{totalBuildings}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-primary bg-opacity-10 text-primary">
                                <Building2 size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className={`card border-0 shadow-sm rounded-3 p-3 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Active Buildings</span>
                                <h3 className="fw-bold mb-0 mt-1 text-success">{activeBuildings}</h3>
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
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Managed Floors</span>
                                <h3 className="fw-bold mb-0 mt-1 text-info">{totalFloorsCount}</h3>
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
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Meeting & Work Rooms</span>
                                <h3 className="fw-bold mb-0 mt-1 text-warning">{totalRoomsCount}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-warning bg-opacity-10 text-warning">
                                <DoorOpen size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
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
                                placeholder="Search building name, code, address..."
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

                    <div className="col-6 col-md-3">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={selectedOrg}
                            onChange={(e) => { setSelectedOrg(e.target.value); setSelectedBranch(''); }}
                        >
                            <option value="">All Organizations</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.name || org.organization_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-3">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-2">
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

            {/* Building Data Table */}
            <div className={`card border-0 shadow-sm rounded-3 overflow-hidden ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                <div className="table-responsive">
                    <table className={`table align-middle mb-0 ${isDark ? 'table-dark' : 'table-hover'}`}>
                        <thead className={isDark ? 'table-dark' : 'table-light'}>
                            <tr>
                                <th style={{ minWidth: '180px' }}>Building Name</th>
                                <th>Code</th>
                                <th>Organization & Branch</th>
                                <th>Address</th>
                                <th className="text-center">Floors</th>
                                <th className="text-center">Rooms</th>
                                <th>Status</th>
                                <th className="text-end" style={{ minWidth: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="small text-muted mt-2">Loading buildings...</p>
                                    </td>
                                </tr>
                            ) : buildings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <Building2 size={40} className="text-muted mb-2 opacity-50" />
                                        <h6 className="fw-bold mb-1">No Buildings Found</h6>
                                        <p className="small text-muted mb-3">No buildings match your current filters or none have been added yet.</p>
                                        <button onClick={handleOpenCreate} className="btn btn-sm btn-primary">
                                            <Plus size={14} className="me-1" /> Add First Building
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                buildings.map((b) => (
                                    <tr key={b.id}>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="p-2 rounded-2 bg-primary bg-opacity-10 text-primary">
                                                    <Building2 size={18} />
                                                </div>
                                                <div>
                                                    <span className="fw-semibold d-block text-truncate" style={{ maxWidth: '220px' }}>
                                                        {b.building_name}
                                                    </span>
                                                    {b.description && (
                                                        <span className="small text-muted text-truncate d-block" style={{ maxWidth: '220px' }}>
                                                            {b.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-secondary bg-opacity-25 text-body font-monospace px-2 py-1">
                                                {b.building_code}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="small">
                                                <span className="fw-medium">{b.branch_name || 'N/A'}</span>
                                                {b.organization_name && (
                                                    <span className="text-muted d-block">{b.organization_name}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="small text-muted d-flex align-items-center gap-1">
                                                <MapPin size={13} className="shrink-0" />
                                                <span className="text-truncate" style={{ maxWidth: '200px' }}>
                                                    {b.address || 'No address specified'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge bg-info bg-opacity-10 text-info fw-bold px-2 py-1">
                                                {b.floor_count || b.total_floors || 0}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge bg-warning bg-opacity-10 text-warning fw-bold px-2 py-1">
                                                {b.room_count || 0}
                                            </span>
                                        </td>
                                        <td>
                                            {b.is_active ? (
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
                                                    onClick={() => handleOpenDetails(b)}
                                                    className="btn btn-sm btn-ghost p-1 text-primary"
                                                    title="View Details & Floors"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(b)}
                                                    className="btn btn-sm btn-ghost p-1 text-secondary"
                                                    title="Edit Building"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(b)}
                                                    className="btn btn-sm btn-ghost p-1 text-danger"
                                                    title="Delete Building"
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

            {/* Create / Edit Building Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className={`modal-content border-0 shadow ${isDark ? 'bg-dark text-white border border-secondary border-opacity-25' : 'bg-white'}`}>
                            <div className="modal-header border-bottom border-secondary border-opacity-25">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    <Building2 className="text-primary" size={20} />
                                    {modalMode === 'create' ? 'Add New Facility / Building' : `Edit Building: ${currentBuilding?.building_name}`}
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
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Organization *</label>
                                            <select
                                                className={`form-select ${formErrors.organization_id ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.organization_id}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, organization_id: e.target.value });
                                                    setFormErrors({ ...formErrors, organization_id: null });
                                                }}
                                            >
                                                <option value="">Select Organization</option>
                                                {organizations.map(org => (
                                                    <option key={org.id} value={org.id}>{org.name || org.organization_name}</option>
                                                ))}
                                            </select>
                                            {formErrors.organization_id && <div className="invalid-feedback">{formErrors.organization_id}</div>}
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Branch / Campus *</label>
                                            <select
                                                className={`form-select ${formErrors.branch_id ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.branch_id}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, branch_id: e.target.value });
                                                    setFormErrors({ ...formErrors, branch_id: null });
                                                }}
                                            >
                                                <option value="">Select Branch</option>
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                                                ))}
                                            </select>
                                            {formErrors.branch_id && <div className="invalid-feedback">{formErrors.branch_id}</div>}
                                        </div>

                                        <div className="col-12 col-md-8">
                                            <label className="form-label small fw-semibold">Building Name *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${formErrors.building_name ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="e.g., Silicon Tower, Block A, Headquarters"
                                                value={formData.building_name}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, building_name: e.target.value });
                                                    setFormErrors({ ...formErrors, building_name: null });
                                                }}
                                            />
                                            {formErrors.building_name && <div className="invalid-feedback">{formErrors.building_name}</div>}
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold">Building Code *</label>
                                            <input
                                                type="text"
                                                className={`form-control font-monospace text-uppercase ${formErrors.building_code ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="e.g., BLD-01"
                                                value={formData.building_code}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, building_code: e.target.value.toUpperCase() });
                                                    setFormErrors({ ...formErrors, building_code: null });
                                                }}
                                            />
                                            {formErrors.building_code && <div className="invalid-feedback">{formErrors.building_code}</div>}
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Total Floors *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="150"
                                                className={`form-control ${formErrors.total_floors ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.total_floors}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, total_floors: parseInt(e.target.value, 10) || 1 });
                                                    setFormErrors({ ...formErrors, total_floors: null });
                                                }}
                                            />
                                            {formErrors.total_floors && <div className="invalid-feedback">{formErrors.total_floors}</div>}
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Operational Status</label>
                                            <select
                                                className={`form-select ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value, 10) })}
                                            >
                                                <option value="1">Active & Accessible</option>
                                                <option value="0">Inactive / Under Renovation</option>
                                            </select>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Full Physical Address</label>
                                            <input
                                                type="text"
                                                className={`form-control ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="Street address, block number, campus zone"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Description / Security Notes</label>
                                            <textarea
                                                rows="2"
                                                className={`form-control ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="Access instructions, security clearance level, badge requirements..."
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
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                        {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Facility' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Building Details & Floors Modal */}
            {showDetailDrawer && currentBuilding && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className={`modal-content border-0 shadow ${isDark ? 'bg-dark text-white border border-secondary border-opacity-25' : 'bg-white'}`}>
                            <div className="modal-header border-bottom border-secondary border-opacity-25">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    <Building2 className="text-primary" size={20} />
                                    {currentBuilding.building_name} &mdash; Details & Structure
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowDetailDrawer(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3 bg-secondary bg-opacity-10">
                                            <span className="small text-muted d-block">Facility Code</span>
                                            <span className="fw-bold font-monospace">{currentBuilding.building_code}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3 bg-secondary bg-opacity-10">
                                            <span className="small text-muted d-block">Branch / Campus</span>
                                            <span className="fw-bold">{currentBuilding.branch_name || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3 bg-secondary bg-opacity-10">
                                            <span className="small text-muted d-block">Floors Capacity</span>
                                            <span className="fw-bold text-info">{currentBuilding.total_floors} Floors</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3 bg-secondary bg-opacity-10">
                                            <span className="small text-muted d-block">Status</span>
                                            <span className={currentBuilding.is_active ? 'badge bg-success' : 'badge bg-danger'}>
                                                {currentBuilding.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="p-3 rounded-3 bg-secondary bg-opacity-10">
                                            <span className="small text-muted d-block">Address</span>
                                            <span>{currentBuilding.address || 'No physical address configured.'}</span>
                                        </div>
                                    </div>
                                </div>

                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                    <Layers className="text-info" size={18} />
                                    Floors in this Facility
                                </h6>

                                {loadingDetails ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                        <span className="ms-2 small text-muted">Loading floors...</span>
                                    </div>
                                ) : selectedBuildingDetails?.floors && selectedBuildingDetails.floors.length > 0 ? (
                                    <div className="list-group">
                                        {selectedBuildingDetails.floors.map(fl => (
                                            <div key={fl.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span className="fw-bold me-2">Level {fl.floor_number}:</span>
                                                    <span>{fl.floor_name || `Floor ${fl.floor_number}`}</span>
                                                    {fl.floor_code && <span className="badge bg-secondary ms-2">{fl.floor_code}</span>}
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-light text-dark">Capacity: {fl.capacity || 'N/A'}</span>
                                                    <span className={fl.is_active ? 'badge bg-success' : 'badge bg-secondary'}>
                                                        {fl.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3 text-center border border-dashed rounded-3">
                                        <p className="small text-muted mb-0">No floor records explicitly configured under this building.</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-top border-secondary border-opacity-25">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDetailDrawer(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteTarget && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className={`modal-content border-0 shadow ${isDark ? 'bg-dark text-white border border-secondary border-opacity-25' : 'bg-white'}`}>
                            <div className="modal-header border-bottom border-secondary border-opacity-25">
                                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                                    <AlertTriangle size={20} />
                                    Confirm Facility Deletion
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
                                    Are you sure you want to delete building <strong>"{deleteTarget.building_name}"</strong> ({deleteTarget.building_code})?
                                </p>
                                <div className="p-3 rounded-2 bg-danger bg-opacity-10 text-danger small">
                                    <strong>Caution:</strong> Buildings cannot be deleted if they currently contain registered floors, meeting rooms, or active employee workplace assignments.
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
