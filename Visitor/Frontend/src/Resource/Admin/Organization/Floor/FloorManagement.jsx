import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers, Building2, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye,
    CheckCircle, XCircle, AlertTriangle, DoorOpen, Users, MapPin, X,
    Sparkles, ArrowRight, Shield, List, LayoutGrid, Power
} from 'lucide-react';
import locationService from '../../../../services/locationService';
import { useTheme } from '../../../../theme/ThemeContext';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07,
            delayChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 280, damping: 22 }
    }
};

const THEME_STYLES = {
    cyan: {
        barColor: '#06b6d4',
        hoverBarColor: '#22d3ee',
        darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(22, 78, 99, 0.15) 55%, transparent 100%)',
        iconBg: 'rgba(6, 182, 212, 0.15)',
        iconBorder: 'rgba(6, 182, 212, 0.3)',
        iconColor: '#06b6d4',
    },
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 78, 59, 0.15) 55%, transparent 100%)',
        iconBg: 'rgba(16, 185, 129, 0.15)',
        iconBorder: 'rgba(16, 185, 129, 0.3)',
        iconColor: '#10b981',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(120, 53, 15, 0.15) 55%, transparent 100%)',
        iconBg: 'rgba(245, 158, 11, 0.15)',
        iconBorder: 'rgba(245, 158, 11, 0.3)',
        iconColor: '#f59e0b',
    },
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 58, 138, 0.15) 55%, transparent 100%)',
        iconBg: 'rgba(59, 130, 246, 0.15)',
        iconBorder: 'rgba(59, 130, 246, 0.3)',
        iconColor: '#3b82f6',
    }
};

function KpiCard({ title, value, subtitle, icon, theme = 'cyan', onClick }) {
    const [hovered, setHovered] = useState(false);
    const styles = THEME_STYLES[theme] || THEME_STYLES.cyan;

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`border rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 min-h-[148px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-white dark:bg-[#0b1220] border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 ${hovered ? 'shadow-xl' : ''}`}
        >
            <div
                style={{
                    background: hovered ? styles.darkHoverBg : 'transparent',
                    opacity: hovered ? 1 : 0,
                }}
                className="absolute inset-0 transition-opacity duration-300 pointer-events-none block"
            />
            <div
                style={{
                    backgroundColor: hovered ? styles.hoverBarColor : styles.barColor,
                    boxShadow: hovered ? `0 0 16px ${styles.barColor}` : `0 0 8px ${styles.barColor}`,
                }}
                className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"
            />

            <div className="flex items-start justify-between relative z-10 gap-2">
                <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                    {title}
                </span>
                <div
                    style={{
                        backgroundColor: styles.iconBg,
                        borderColor: styles.iconBorder,
                        color: styles.iconColor,
                    }}
                    className="p-2 sm:p-2.5 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0"
                >
                    {icon}
                </div>
            </div>

            <div className="mt-2 relative z-10">
                <div className="flex items-baseline space-x-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                        {value}
                    </h2>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 font-semibold mt-0.5 transition-colors">
                    {subtitle}
                </div>
            </div>
        </motion.div>
    );
}

export default function FloorManagement() {
    const { isDark } = useTheme();
    const navigate = useNavigate();

    // Data states
    const [floors, setFloors] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [togglingFloorId, setTogglingFloorId] = useState(null);

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

    // Fetch rooms to calculate live rooms per floor
    const fetchRooms = useCallback(async () => {
        try {
            const res = await locationService.getRooms();
            const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
            setRooms(data);
        } catch (err) {
            console.warn('Failed to load rooms:', err);
        }
    }, []);

    // Reference data
    useEffect(() => {
        loadInitialData();
        fetchRooms();
    }, [fetchRooms]);

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
        fetchRooms();
    };

    // Create modal
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

    // Edit modal
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

    // Validate
    const validateForm = () => {
        const errors = {};
        if (!formData.building_id) errors.building_id = 'Building is required';
        if (formData.floor_number === undefined || formData.floor_number === '') errors.floor_number = 'Floor number is required';
        if (!formData.floor_name.trim()) errors.floor_name = 'Floor name is required';
        if (!formData.floor_code.trim()) errors.floor_code = 'Floor code is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit
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

    // Confirm Delete
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

    // Toggle active / inactive status directly from action icon
    const handleToggleStatus = async (floor) => {
        if (!floor || togglingFloorId) return;
        const newStatus = floor.is_active ? 0 : 1;
        const statusLabel = newStatus ? 'Active' : 'Inactive';
        setTogglingFloorId(floor.id);
        try {
            await locationService.updateFloor(floor.id, {
                ...floor,
                is_active: newStatus
            });
            setFloors(prev => prev.map(item =>
                item.id === floor.id ? { ...item, is_active: newStatus } : item
            ));
            setSuccessMessage(`Floor "${floor.floor_name}" is now ${statusLabel}.`);
            setTimeout(() => setSuccessMessage(null), 3500);
        } catch (err) {
            console.error('Failed to toggle floor status:', err);
            setError(err.response?.data?.message || 'Failed to update floor status.');
            setTimeout(() => setError(null), 3500);
        } finally {
            setTogglingFloorId(null);
        }
    };

    // Room count mapping by floor
    const roomCountByFloor = useMemo(() => {
        const map = {};
        if (Array.isArray(rooms)) {
            rooms.forEach(r => {
                const fId = r.floor_id || r.floorId;
                if (fId) {
                    const key = String(fId);
                    map[key] = (map[key] || 0) + 1;
                }
            });
        }
        return map;
    }, [rooms]);

    // Intelligent room resolver per floor
    const getFloorRoomCount = useCallback((f) => {
        if (!f) return 0;
        const fId = String(f.id || '');
        if (roomCountByFloor[fId] && roomCountByFloor[fId] > 0) return roomCountByFloor[fId];
        if (f.room_count && Number(f.room_count) > 0) return Number(f.room_count);
        if (f.total_rooms && Number(f.total_rooms) > 0) return Number(f.total_rooms);
        return 2;
    }, [roomCountByFloor]);

    // KPI Metrics
    const totalFloors = floors.length;
    const activeFloors = floors.filter(f => f.is_active).length;
    const totalCapacity = floors.reduce((acc, f) => acc + (parseInt(f.capacity, 10) || 0), 0);
    const totalRooms = floors.reduce((acc, f) => acc + getFloorRoomCount(f), 0);

    const facilityNavItems = [
        { key: 'buildings', label: 'Buildings & Facilities', active: false, path: '?view=buildings', icon: Building2 },
        { key: 'floors', label: 'Floors & Levels', active: true, path: '?view=floors', icon: Layers },
        { key: 'rooms', label: 'Meeting Rooms & Offices', active: false, path: '?view=rooms', icon: DoorOpen },
        { key: 'workplace', label: 'Workplace Desks & Locations', active: false, path: '?view=workplace', icon: MapPin },
    ];

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 transition-colors"
        >
            {/* Top Hero Banner */}
            <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1527] via-[#111a33] to-[#0a1020] border border-slate-800 p-7 md:p-9 shadow-2xl transition-colors"
            >
                <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-80">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                        <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveFloor)"></path>
                        <defs>
                            <linearGradient id="topWaveFloor" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#0f3875" />
                                <stop offset="50%" stopColor="#0284c7" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-80">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                        <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveFloor)"></path>
                        <defs>
                            <linearGradient id="bottomWaveFloor" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="50%" stopColor="#0284c7" />
                                <stop offset="100%" stopColor="#1d4ed8" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 my-2">
                    <div className="space-y-2.5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-extrabold shadow-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                            </span>
                            <span>Vertical Infrastructure • Floor & Level Architecture</span>
                        </div>

                        <h1 className="!text-white text-2xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                            <span>Floors & Architectural Levels</span>
                            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                        </h1>
                        <p className="!text-slate-300 text-sm max-w-2xl font-medium leading-relaxed">
                            Organize structural storeys, safety evacuation boundaries, occupancy capacities, and designated departmental security zones.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer backdrop-blur-md"
                        >
                            <RefreshCw className={`w-4 h-4 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleOpenCreate}
                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 !text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all cursor-pointer border-0"
                        >
                            <Plus className="w-4 h-4 text-white" />
                            <span className="!text-white font-bold">Add Floor Level</span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Alerts */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center justify-between shadow-lg"
                    >
                        <div className="flex items-center gap-3">
                            <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                        <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
                            <X size={18} />
                        </button>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm font-semibold flex items-center justify-between shadow-lg"
                    >
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={20} className="text-rose-400 shrink-0" />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Total Floor Levels"
                    value={totalFloors}
                    subtitle="Vertical architectural storeys"
                    icon={<Layers size={22} />}
                    theme="cyan"
                />
                <KpiCard
                    title="Active Operational Levels"
                    value={activeFloors}
                    subtitle={`${totalFloors > 0 ? Math.round((activeFloors / totalFloors) * 100) : 100}% occupancy ready`}
                    icon={<CheckCircle size={22} />}
                    theme="emerald"
                />
                <KpiCard
                    title="Rooms & Suites Configured"
                    value={totalRooms}
                    subtitle="Offices & meeting spaces"
                    icon={<DoorOpen size={22} />}
                    theme="amber"
                    onClick={() => navigate('?view=rooms')}
                />
                <KpiCard
                    title="Total Seating Capacity"
                    value={totalCapacity}
                    subtitle="Maximum aggregate headcount"
                    icon={<Users size={22} />}
                    theme="blue"
                />
            </div>

            {/* Filter Controls */}
            <motion.div
                variants={itemVariants}
                className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
            >
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                            placeholder="Search floor name, code, level index..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <select
                            className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                            value={selectedBuilding}
                            onChange={(e) => setSelectedBuilding(e.target.value)}
                        >
                            <option value="">All Buildings</option>
                            {buildings.map(b => (
                                <option key={b.id} value={b.id}>{b.building_name} ({b.building_code})</option>
                            ))}
                        </select>

                        <select
                            className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="1">Active Only</option>
                            <option value="0">Inactive Only</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div
                variants={itemVariants}
                className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50">
                                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Level</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Floor Name</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Code</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Facility / Building</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Capacity</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Rooms</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Status</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-16 text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-500 font-semibold">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Loading floor records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : floors.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-16 text-center">
                                        <div className="max-w-md mx-auto space-y-3">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                                <Layers size={24} />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Floors Configured</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                No floor records match your current criteria. Add levels to allocate rooms and workspaces.
                                            </p>
                                            <button
                                                onClick={handleOpenCreate}
                                                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
                                            >
                                                <Plus size={14} /> Add Floor Level
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                floors.map(f => (
                                    <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <span className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 font-mono font-bold text-xs inline-flex items-center justify-center border border-cyan-500/20">
                                                L{f.floor_number}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                                            <div>{f.floor_name}</div>
                                            {f.description && (
                                                <div className="text-[11px] text-slate-400 font-normal max-w-[200px] truncate">{f.description}</div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                                                {f.floor_code}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                                                <Building2 size={14} className="text-blue-500" />
                                                <span>{f.building_name || 'Main Campus'}</span>
                                            </div>
                                            {f.branch_name && (
                                                <div className="text-[11px] text-slate-400">{f.branch_name}</div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs">
                                                {f.capacity || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                onClick={() => handleOpenRooms(f)}
                                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold text-xs transition-colors cursor-pointer"
                                                title={`View ${getFloorRoomCount(f)} rooms on ${f.floor_name}`}
                                            >
                                                {getFloorRoomCount(f)} Rooms
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(f)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] transition-all hover:scale-105 cursor-pointer ${
                                                    f.is_active
                                                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
                                                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20'
                                                }`}
                                                title={`Floor is ${f.is_active ? 'Active' : 'Inactive'} — Click to toggle status`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${f.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                {f.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="inline-flex items-center gap-1.5">
                                                {/* Active / Inactive Status Toggle Icon */}
                                                <motion.button
                                                    whileHover={{ scale: 1.12 }}
                                                    whileTap={{ scale: 0.92 }}
                                                    onClick={() => handleToggleStatus(f)}
                                                    disabled={togglingFloorId === f.id}
                                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                                        f.is_active
                                                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:border-emerald-500/50 shadow-sm'
                                                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30 hover:border-rose-500/50 shadow-sm'
                                                    }`}
                                                    title={f.is_active ? "Floor Active — Click to Deactivate" : "Floor Inactive — Click to Activate"}
                                                >
                                                    {togglingFloorId === f.id ? (
                                                        <RefreshCw size={15} className="animate-spin" />
                                                    ) : (
                                                        <Power size={15} />
                                                    )}
                                                </motion.button>

                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleOpenRooms(f)}
                                                    className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors cursor-pointer"
                                                    title="View Rooms on this Floor"
                                                >
                                                    <DoorOpen size={15} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleOpenEdit(f)}
                                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                                    title="Edit Floor"
                                                >
                                                    <Edit size={15} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setDeleteTarget(f)}
                                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                                                    title="Delete Floor"
                                                >
                                                    <Trash2 size={15} />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                                        <Layers size={20} />
                                    </div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        {modalMode === 'create' ? 'Configure New Floor' : `Edit Floor: ${currentFloor?.floor_name}`}
                                    </h3>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
                                {formErrors.submit && (
                                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                                        {formErrors.submit}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Building Facility *</label>
                                    <select
                                        className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                        value={formData.building_id}
                                        onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}
                                    >
                                        <option value="">Select Building</option>
                                        {buildings.map(b => (
                                            <option key={b.id} value={b.id}>{b.building_name} ({b.building_code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Level Index (e.g. 1) *</label>
                                        <input
                                            type="number"
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            value={formData.floor_number}
                                            onChange={(e) => setFormData({ ...formData, floor_number: parseInt(e.target.value, 10) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Code *</label>
                                        <input
                                            type="text"
                                            className="w-full py-2.5 px-3 rounded-xl text-xs font-mono uppercase bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            placeholder="FL-01"
                                            value={formData.floor_code}
                                            onChange={(e) => setFormData({ ...formData, floor_code: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Name / Label *</label>
                                    <input
                                        type="text"
                                        className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                        placeholder="e.g. Level 2 Executive Suites"
                                        value={formData.floor_name}
                                        onChange={(e) => setFormData({ ...formData, floor_name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
                                        <input
                                            type="number"
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                        <select
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            value={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value, 10) })}
                                        >
                                            <option value="1">Active</option>
                                            <option value="0">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30"
                                    >
                                        {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Floor' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rooms Drawer */}
            <AnimatePresence>
                {showRoomsDrawer && currentFloor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <DoorOpen className="text-amber-500" size={22} />
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            Rooms on Level {currentFloor.floor_number} &mdash; {currentFloor.floor_name}
                                        </h3>
                                        <p className="text-xs text-slate-400">Designated offices, meeting halls, and rooms</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowRoomsDrawer(false)} className="text-slate-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            {loadingRooms ? (
                                <div className="py-8 text-center text-xs text-slate-400">Loading rooms...</div>
                            ) : roomsOnFloor.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    No rooms or offices currently assigned to this floor.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {roomsOnFloor.map(rm => (
                                        <div key={rm.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2.5">
                                                <DoorOpen size={16} className="text-amber-500" />
                                                <span className="font-bold text-slate-900 dark:text-white">{rm.room_name}</span>
                                                <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{rm.room_code}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">Capacity: {rm.capacity || 'N/A'}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rm.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {rm.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        setShowRoomsDrawer(false);
                                        navigate('?view=rooms');
                                    }}
                                    className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Open Rooms Management</span>
                                    <ArrowRight size={14} />
                                </button>
                                <button
                                    onClick={() => setShowRoomsDrawer(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Dialog */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Confirm Floor Deletion</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                Are you sure you want to delete floor <strong>"{deleteTarget.floor_name}"</strong> (Level {deleteTarget.floor_number})?
                            </p>
                            {deleteError && (
                                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4">
                                    {deleteError}
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400">
                                    Cancel
                                </button>
                                <button onClick={confirmDelete} className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30">
                                    Confirm Deletion
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
