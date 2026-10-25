import React, { useState, useEffect, useCallback } from 'react';
import {
    DoorOpen, Building2, Layers, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye,
    CheckCircle, XCircle, AlertTriangle, Users, Calendar, ShieldAlert, Monitor, Video,
    Wifi, Coffee, Check, X
} from 'lucide-react';
import locationService from '../../../../services/locationService';
import { useTheme } from '../../../../theme/ThemeContext';

const ROOM_TYPES = [
    { value: 'Conference Room', label: 'Conference Room', color: 'primary' },
    { value: 'Meeting Room', label: 'Meeting Room', color: 'info' },
    { value: 'Executive Office', label: 'Executive Office', color: 'purple' },
    { value: 'Workstation', label: 'Workstation / Desk', color: 'secondary' },
    { value: 'Interview Room', label: 'Interview Room', color: 'warning' },
    { value: 'Training Hall', label: 'Training Hall', color: 'success' },
    { value: 'Boardroom', label: 'Boardroom', color: 'danger' }
];

const STANDARD_AMENITIES = [
    'Video Conferencing', 'Display Monitor / TV', 'Projector Screen',
    'Whiteboard', 'Conference Phone', 'High-Speed Wi-Fi', 'Audio System'
];

export default function RoomManagement() {
    const { isDark } = useTheme();

    // Data states
    const [rooms, setRooms] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [bookableFilter, setBookableFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [currentRoom, setCurrentRoom] = useState(null);

    // Availability Checker Modal
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [checkingRoom, setCheckingRoom] = useState(null);
    const [checkStartTime, setCheckStartTime] = useState(new Date().toISOString().slice(0, 16));
    const [checkEndTime, setCheckEndTime] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
    const [availabilityResult, setAvailabilityResult] = useState(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        building_id: '',
        floor_id: '',
        department_id: '',
        room_name: '',
        room_code: '',
        room_type: 'Meeting Room',
        capacity: 8,
        is_bookable: 1,
        is_restricted: 0,
        amenities: [],
        description: '',
        is_active: 1
    });
    const [formFloors, setFormFloors] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

    // Load initial reference data
    useEffect(() => {
        loadReferenceData();
    }, []);

    const loadReferenceData = async () => {
        try {
            const bList = await locationService.getBuildings();
            setBuildings(bList.data || []);
            const depts = await locationService.getDepartments();
            setDepartments(depts);
        } catch (err) {
            console.error('Failed to load initial data:', err);
        }
    };

    // Load floors when building filter changes
    useEffect(() => {
        async function fetchFloors() {
            if (!selectedBuilding) {
                setFloors([]);
                setSelectedFloor('');
                return;
            }
            try {
                const res = await locationService.getFloors({ building_id: selectedBuilding });
                setFloors(res.data || []);
            } catch (err) {
                console.error('Failed to fetch floors:', err);
            }
        }
        fetchFloors();
    }, [selectedBuilding]);

    // Load floors for form modal when building changes in form
    useEffect(() => {
        async function fetchModalFloors() {
            if (!formData.building_id) {
                setFormFloors([]);
                return;
            }
            try {
                const res = await locationService.getFloors({ building_id: formData.building_id });
                setFormFloors(res.data || []);
            } catch (err) {
                console.error('Failed to fetch modal floors:', err);
            }
        }
        fetchModalFloors();
    }, [formData.building_id]);

    // Fetch rooms
    const fetchRooms = useCallback(async () => {
        try {
            setError(null);
            const params = {
                building_id: selectedBuilding || undefined,
                floor_id: selectedFloor || undefined,
                room_type: selectedType || undefined,
                is_bookable: bookableFilter !== '' ? bookableFilter : undefined,
                status: statusFilter || undefined,
                search: searchTerm.trim() || undefined
            };
            const res = await locationService.getRooms(params);
            setRooms(res.data || []);
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
            if (rooms.length === 0) {
                setError(err.response?.data?.message || 'Unable to load rooms from server.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedBuilding, selectedFloor, selectedType, bookableFilter, statusFilter, searchTerm, rooms.length]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchRooms();
    };

    // Open Create Modal
    const handleOpenCreate = () => {
        setModalMode('create');
        setCurrentRoom(null);
        setFormData({
            building_id: selectedBuilding || buildings[0]?.id || '',
            floor_id: selectedFloor || '',
            department_id: '',
            room_name: '',
            room_code: '',
            room_type: 'Meeting Room',
            capacity: 8,
            is_bookable: 1,
            is_restricted: 0,
            amenities: ['High-Speed Wi-Fi', 'Whiteboard'],
            description: '',
            is_active: 1
        });
        setFormErrors({});
        setShowModal(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (room) => {
        setModalMode('edit');
        setCurrentRoom(room);
        let parsedAmenities = [];
        try {
            if (Array.isArray(room.amenities)) {
                parsedAmenities = room.amenities;
            } else if (typeof room.amenities === 'string') {
                parsedAmenities = JSON.parse(room.amenities);
            }
        } catch (e) {
            parsedAmenities = [];
        }

        setFormData({
            building_id: room.building_id || '',
            floor_id: room.floor_id || '',
            department_id: room.department_id || '',
            room_name: room.room_name || '',
            room_code: room.room_code || '',
            room_type: room.room_type || 'Meeting Room',
            capacity: room.capacity || 8,
            is_bookable: room.is_bookable ? 1 : 0,
            is_restricted: room.is_restricted ? 1 : 0,
            amenities: parsedAmenities,
            description: room.description || '',
            is_active: room.is_active ? 1 : 0
        });
        setFormErrors({});
        setShowModal(true);
    };

    // Toggle Amenity Selection
    const toggleAmenity = (amenity) => {
        const exists = formData.amenities.includes(amenity);
        if (exists) {
            setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
        } else {
            setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
        }
    };

    // Validate Form
    const validateForm = () => {
        const errors = {};
        if (!formData.building_id) errors.building_id = 'Building is required';
        if (!formData.floor_id) errors.floor_id = 'Floor level is required';
        if (!formData.room_name.trim()) errors.room_name = 'Room name is required';
        if (!formData.room_code.trim()) errors.room_code = 'Room code is required';
        if (!formData.capacity || formData.capacity < 1) errors.capacity = 'Capacity must be at least 1';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit Form
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                amenities: JSON.stringify(formData.amenities)
            };
            if (modalMode === 'create') {
                await locationService.createRoom(payload);
                setSuccessMessage('Room registered successfully!');
            } else {
                await locationService.updateRoom(currentRoom.id, payload);
                setSuccessMessage('Room updated successfully!');
            }
            setShowModal(false);
            fetchRooms();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            console.error('Failed to save room:', err);
            setFormErrors({ submit: err.response?.data?.message || 'Failed to save room.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Open Availability Checker
    const handleOpenAvailability = (room) => {
        setCheckingRoom(room);
        setAvailabilityResult(null);
        setShowAvailabilityModal(true);
    };

    // Check Availability
    const checkAvailability = async () => {
        if (!checkingRoom) return;
        setCheckingAvailability(true);
        setAvailabilityResult(null);
        try {
            const res = await locationService.checkRoomAvailability(checkingRoom.id, checkStartTime, checkEndTime);
            setAvailabilityResult(res.data);
        } catch (err) {
            console.error('Availability check failed:', err);
            setAvailabilityResult({ available: false, error: 'Could not verify booking conflicts.' });
        } finally {
            setCheckingAvailability(false);
        }
    };

    // Delete confirmation
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteError(null);
        try {
            await locationService.deleteRoom(deleteTarget.id);
            setSuccessMessage(`Room "${deleteTarget.room_name}" deleted.`);
            setDeleteTarget(null);
            fetchRooms();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            console.error('Delete failed:', err);
            setDeleteError(err.response?.data?.message || 'Cannot delete room with existing appointments or bookings.');
        }
    };

    // KPI Metrics
    const totalRoomsCount = rooms.length;
    const activeRoomsCount = rooms.filter(r => r.is_active).length;
    const bookableRoomsCount = rooms.filter(r => r.is_bookable).length;
    const restrictedRoomsCount = rooms.filter(r => r.is_restricted).length;

    return (
        <div className={`p-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <DoorOpen className="text-warning" size={26} />
                        Meeting Room & Office Management
                    </h4>
                    <p className={`small mb-0 ${isDark ? 'text-slate-400' : 'text-muted'}`}>
                        Configure conference spaces, executive offices, bookable rooms, capacity limits, and equipment amenities.
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
                        className="btn btn-sm btn-warning text-dark fw-semibold d-flex align-items-center gap-1 shadow-sm"
                    >
                        <Plus size={16} />
                        Add Room
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
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Total Rooms</span>
                                <h3 className="fw-bold mb-0 mt-1">{totalRoomsCount}</h3>
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
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Active & Available</span>
                                <h3 className="fw-bold mb-0 mt-1 text-success">{activeRoomsCount}</h3>
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
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Visitor Bookable</span>
                                <h3 className="fw-bold mb-0 mt-1 text-info">{bookableRoomsCount}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-info bg-opacity-10 text-info">
                                <Calendar size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className={`card border-0 shadow-sm rounded-3 p-3 ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className={`text-uppercase small fw-bold ${isDark ? 'text-slate-400' : 'text-muted'}`}>Restricted Access</span>
                                <h3 className="fw-bold mb-0 mt-1 text-danger">{restrictedRoomsCount}</h3>
                            </div>
                            <div className="p-3 rounded-3 bg-danger bg-opacity-10 text-danger">
                                <ShieldAlert size={24} />
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
                                placeholder="Search room name, code..."
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
                            value={selectedBuilding}
                            onChange={(e) => setSelectedBuilding(e.target.value)}
                        >
                            <option value="">All Buildings</option>
                            {buildings.map(b => (
                                <option key={b.id} value={b.id}>{b.building_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-2">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={selectedFloor}
                            onChange={(e) => setSelectedFloor(e.target.value)}
                            disabled={!selectedBuilding}
                        >
                            <option value="">All Floors</option>
                            {floors.map(f => (
                                <option key={f.id} value={f.id}>Level {f.floor_number} - {f.floor_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-2">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="">All Room Types</option>
                            {ROOM_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-3">
                        <select
                            className={`form-select form-select-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                            value={bookableFilter}
                            onChange={(e) => setBookableFilter(e.target.value)}
                        >
                            <option value="">Bookability (Any)</option>
                            <option value="1">Bookable by Visitors</option>
                            <option value="0">Staff Only / Internal</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Room Table */}
            <div className={`card border-0 shadow-sm rounded-3 overflow-hidden ${isDark ? 'bg-dark border border-secondary border-opacity-25' : 'bg-white'}`}>
                <div className="table-responsive">
                    <table className={`table align-middle mb-0 ${isDark ? 'table-dark' : 'table-hover'}`}>
                        <thead className={isDark ? 'table-dark' : 'table-light'}>
                            <tr>
                                <th>Room Name & Code</th>
                                <th>Type</th>
                                <th>Physical Location</th>
                                <th className="text-center">Capacity</th>
                                <th>Policy & Booking</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5">
                                        <div className="spinner-border text-warning" role="status"></div>
                                        <p className="small text-muted mt-2">Loading meeting rooms & office inventory...</p>
                                    </td>
                                </tr>
                            ) : rooms.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5">
                                        <DoorOpen size={40} className="text-muted mb-2 opacity-50" />
                                        <h6 className="fw-bold mb-1">No Rooms Configured</h6>
                                        <p className="small text-muted mb-3">Add meeting rooms and office spaces mapped to your facility floors.</p>
                                        <button onClick={handleOpenCreate} className="btn btn-sm btn-warning text-dark fw-semibold">
                                            <Plus size={14} className="me-1" /> Add First Room
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                rooms.map(r => (
                                    <tr key={r.id}>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="p-2 rounded-2 bg-warning bg-opacity-10 text-warning">
                                                    <DoorOpen size={18} />
                                                </div>
                                                <div>
                                                    <span className="fw-semibold d-block">{r.room_name}</span>
                                                    <span className="badge bg-secondary bg-opacity-25 text-body font-monospace px-1 py-0.5 small">
                                                        {r.room_code || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
                                                {r.room_type || 'Meeting Room'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="small">
                                                <div className="d-flex align-items-center gap-1">
                                                    <Building2 size={13} className="text-primary" />
                                                    <span className="fw-medium">{r.building_name || 'Facility'}</span>
                                                </div>
                                                <div className="text-muted d-flex align-items-center gap-1">
                                                    <Layers size={13} className="text-info" />
                                                    <span>Level {r.floor_number ?? '0'}: {r.floor_name || 'Floor'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge bg-light text-dark border px-2 py-1">
                                                <Users size={12} className="me-1" />
                                                {r.capacity || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column gap-1">
                                                {r.is_bookable ? (
                                                    <span className="badge bg-success bg-opacity-10 text-success text-start" style={{ width: 'fit-content' }}>
                                                        <Check size={11} className="me-1" /> Bookable
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary bg-opacity-25 text-muted text-start" style={{ width: 'fit-content' }}>
                                                        Internal Only
                                                    </span>
                                                )}
                                                {r.is_restricted ? (
                                                    <span className="badge bg-danger bg-opacity-10 text-danger text-start" style={{ width: 'fit-content' }}>
                                                        <ShieldAlert size={11} className="me-1" /> Security Restricted
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td>
                                            {r.is_active ? (
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
                                                    onClick={() => handleOpenAvailability(r)}
                                                    className="btn btn-sm btn-ghost p-1 text-info"
                                                    title="Check Booking Availability"
                                                >
                                                    <Calendar size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(r)}
                                                    className="btn btn-sm btn-ghost p-1 text-secondary"
                                                    title="Edit Room"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(r)}
                                                    className="btn btn-sm btn-ghost p-1 text-danger"
                                                    title="Delete Room"
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
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className={`modal-content border-0 shadow ${isDark ? 'bg-dark text-white border border-secondary border-opacity-25' : 'bg-white'}`}>
                            <div className="modal-header border-bottom border-secondary border-opacity-25">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    <DoorOpen className="text-warning" size={20} />
                                    {modalMode === 'create' ? 'Register Meeting Room / Space' : `Edit Room: ${currentRoom?.room_name}`}
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
                                            <label className="form-label small fw-semibold">Building *</label>
                                            <select
                                                className={`form-select ${formErrors.building_id ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.building_id}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, building_id: e.target.value, floor_id: '' });
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
                                            <label className="form-label small fw-semibold">Floor Level *</label>
                                            <select
                                                className={`form-select ${formErrors.floor_id ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.floor_id}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, floor_id: e.target.value });
                                                    setFormErrors({ ...formErrors, floor_id: null });
                                                }}
                                                disabled={!formData.building_id}
                                            >
                                                <option value="">Select Floor Level</option>
                                                {formFloors.map(f => (
                                                    <option key={f.id} value={f.id}>Level {f.floor_number} - {f.floor_name}</option>
                                                ))}
                                            </select>
                                            {formErrors.floor_id && <div className="invalid-feedback">{formErrors.floor_id}</div>}
                                        </div>

                                        <div className="col-12 col-md-8">
                                            <label className="form-label small fw-semibold">Room Name *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${formErrors.room_name ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="e.g., Summit Boardroom, Synergy Pod 4"
                                                value={formData.room_name}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, room_name: e.target.value });
                                                    setFormErrors({ ...formErrors, room_name: null });
                                                }}
                                            />
                                            {formErrors.room_name && <div className="invalid-feedback">{formErrors.room_name}</div>}
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold">Room Code / Number *</label>
                                            <input
                                                type="text"
                                                className={`form-control font-monospace text-uppercase ${formErrors.room_code ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="e.g., RM-301, CONF-A"
                                                value={formData.room_code}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, room_code: e.target.value.toUpperCase() });
                                                    setFormErrors({ ...formErrors, room_code: null });
                                                }}
                                            />
                                            {formErrors.room_code && <div className="invalid-feedback">{formErrors.room_code}</div>}
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold">Room Type</label>
                                            <select
                                                className={`form-select ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.room_type}
                                                onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                                            >
                                                {ROOM_TYPES.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold">Seating Capacity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="500"
                                                className={`form-control ${formErrors.capacity ? 'is-invalid' : ''} ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.capacity}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 });
                                                    setFormErrors({ ...formErrors, capacity: null });
                                                }}
                                            />
                                            {formErrors.capacity && <div className="invalid-feedback">{formErrors.capacity}</div>}
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold">Managing Department</label>
                                            <select
                                                className={`form-select ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                value={formData.department_id}
                                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                            >
                                                <option value="">Shared / General</option>
                                                {departments.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name || d.department_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <div className="form-check form-switch pt-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="isBookableSwitch"
                                                    checked={!!formData.is_bookable}
                                                    onChange={(e) => setFormData({ ...formData, is_bookable: e.target.checked ? 1 : 0 })}
                                                />
                                                <label className="form-check-label small fw-semibold" htmlFor="isBookableSwitch">
                                                    Bookable for Appointments
                                                </label>
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <div className="form-check form-switch pt-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="isRestrictedSwitch"
                                                    checked={!!formData.is_restricted}
                                                    onChange={(e) => setFormData({ ...formData, is_restricted: e.target.checked ? 1 : 0 })}
                                                />
                                                <label className="form-check-label small fw-semibold text-danger" htmlFor="isRestrictedSwitch">
                                                    Security Restricted Zone
                                                </label>
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <div className="form-check form-switch pt-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="isActiveSwitch"
                                                    checked={!!formData.is_active}
                                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                                                />
                                                <label className="form-check-label small fw-semibold" htmlFor="isActiveSwitch">
                                                    Active / Online
                                                </label>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Room Amenities & Equipment</label>
                                            <div className="d-flex flex-wrap gap-2">
                                                {STANDARD_AMENITIES.map(amenity => {
                                                    const selected = formData.amenities.includes(amenity);
                                                    return (
                                                        <button
                                                            key={amenity}
                                                            type="button"
                                                            onClick={() => toggleAmenity(amenity)}
                                                            className={`btn btn-sm rounded-pill px-3 py-1 ${selected ? 'btn-primary' : isDark ? 'btn-outline-secondary text-slate-300' : 'btn-outline-secondary'}`}
                                                        >
                                                            {selected && <Check size={13} className="me-1" />}
                                                            {amenity}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Notes / Access Policy</label>
                                            <textarea
                                                rows="2"
                                                className={`form-control ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                                placeholder="Visitor escort requirements, badge tap points, network ports..."
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
                                    <button type="submit" className="btn btn-warning text-dark fw-semibold btn-sm" disabled={submitting}>
                                        {submitting ? 'Saving...' : modalMode === 'create' ? 'Register Room' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Room Availability Conflict Checker Modal */}
            {showAvailabilityModal && checkingRoom && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className={`modal-content border-0 shadow ${isDark ? 'bg-dark text-white border border-secondary border-opacity-25' : 'bg-white'}`}>
                            <div className="modal-header border-bottom border-secondary border-opacity-25">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    <Calendar className="text-info" size={20} />
                                    Check Booking Availability &mdash; {checkingRoom.room_name}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowAvailabilityModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="small text-muted mb-3">
                                    Simulate booking time windows to detect scheduling collisions against visitor appointments and room reservations.
                                </p>
                                <div className="row g-3 mb-3">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold">Start Time</label>
                                        <input
                                            type="datetime-local"
                                            className={`form-control form-control-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                            value={checkStartTime}
                                            onChange={(e) => setCheckStartTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold">End Time</label>
                                        <input
                                            type="datetime-local"
                                            className={`form-control form-control-sm ${isDark ? 'bg-dark border-secondary text-white' : ''}`}
                                            value={checkEndTime}
                                            onChange={(e) => setCheckEndTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={checkAvailability}
                                    className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                                    disabled={checkingAvailability}
                                >
                                    {checkingAvailability && <div className="spinner-border spinner-border-sm" role="status"></div>}
                                    Run Double-Booking Conflict Check
                                </button>

                                {availabilityResult && (
                                    <div className="mt-4">
                                        {availabilityResult.available ? (
                                            <div className="alert alert-success d-flex align-items-center gap-2 mb-0">
                                                <CheckCircle size={20} />
                                                <div>
                                                    <span className="fw-bold d-block">Room is 100% Available</span>
                                                    <span className="small">No appointments or room bookings overlap with this time slot.</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="alert alert-danger d-flex align-items-center gap-2 mb-0">
                                                <AlertTriangle size={20} />
                                                <div>
                                                    <span className="fw-bold d-block">Scheduling Conflict Detected!</span>
                                                    <span className="small">
                                                        {availabilityResult.conflicts?.length || 1} overlapping booking(s) found during this window.
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-top border-secondary border-opacity-25">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAvailabilityModal(false)}>
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
                                    Confirm Room Deletion
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
                                    Are you sure you want to delete room <strong>"{deleteTarget.room_name}"</strong> ({deleteTarget.room_code})?
                                </p>
                                <div className="p-3 rounded-2 bg-danger bg-opacity-10 text-danger small">
                                    <strong>Caution:</strong> Deletion will fail if appointments, visitor passes, or employee desks are linked to this room.
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
