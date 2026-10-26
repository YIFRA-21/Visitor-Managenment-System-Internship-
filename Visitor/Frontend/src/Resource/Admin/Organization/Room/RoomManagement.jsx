import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DoorOpen, Building2, Layers, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye,
    CheckCircle, XCircle, AlertTriangle, Users, Calendar, ShieldAlert, Monitor, Video,
    Wifi, Coffee, Check, X, Sparkles, LayoutGrid, List, ArrowRight, Shield, Clock,
    CheckSquare, Lock, SlidersHorizontal, TrendingUp, Activity, Compass, Power
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import locationService from '../../../../services/locationService';
import { useTheme } from '../../../../theme/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS & THEME SYSTEM (ADMIN DASHBOARD SPECIFICATION)
// ─────────────────────────────────────────────────────────────────────────────
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
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(120, 53, 15, 0.15) 55%, transparent 100%)',
        iconBg: 'rgba(245, 158, 11, 0.15)',
        iconBorder: 'rgba(245, 158, 11, 0.3)',
        iconColor: '#f59e0b',
    },
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 78, 59, 0.15) 55%, transparent 100%)',
        iconBg: 'rgba(16, 185, 129, 0.15)',
        iconBorder: 'rgba(16, 185, 129, 0.3)',
        iconColor: '#10b981',
    },
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 58, 138, 0.15) 55%, transparent 100%)',
        iconBg: 'rgba(59, 130, 246, 0.15)',
        iconBorder: 'rgba(59, 130, 246, 0.3)',
        iconColor: '#3b82f6',
    },
    rose: {
        barColor: '#f43f5e',
        hoverBarColor: '#fb7185',
        darkHoverBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(136, 19, 55, 0.15) 55%, transparent 100%)',
        iconBg: 'rgba(244, 63, 94, 0.15)',
        iconBorder: 'rgba(244, 63, 94, 0.3)',
        iconColor: '#f43f5e',
    }
};

function KpiCard({ title, value, subtitle, icon, theme = 'amber', onClick }) {
    const [hovered, setHovered] = useState(false);
    const styles = THEME_STYLES[theme] || THEME_STYLES.amber;

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

const ROOM_TYPES = [
    { value: 'Conference Room', label: 'Conference Room', color: '#3b82f6' },
    { value: 'Meeting Room', label: 'Meeting Room', color: '#06b6d4' },
    { value: 'Executive Office', label: 'Executive Office', color: '#a855f7' },
    { value: 'Workstation', label: 'Workstation / Desk', color: '#64748b' },
    { value: 'Interview Room', label: 'Interview Room', color: '#f59e0b' },
    { value: 'Training Hall', label: 'Training Hall', color: '#10b981' },
    { value: 'Boardroom', label: 'Boardroom', color: '#ef4444' }
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

    // View layout: 'table' | 'grid'
    const [viewMode, setViewMode] = useState('table');

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

    // Delete Target
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [togglingRoomId, setTogglingRoomId] = useState(null);

    // Initial reference data
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
                setError(err.response?.data?.message || 'Unable to load room inventory from server.');
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
            amenities: ['High-Speed Wi-Fi', 'Display Monitor / TV'],
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
            parsedAmenities = Array.isArray(room.amenities)
                ? room.amenities
                : typeof room.amenities === 'string'
                    ? JSON.parse(room.amenities)
                    : [];
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
                setSuccessMessage('Meeting space registered successfully!');
            } else {
                await locationService.updateRoom(currentRoom.id, payload);
                setSuccessMessage('Room specifications updated successfully!');
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

    // Toggle active / inactive status directly from action icon
    const handleToggleStatus = async (room) => {
        if (!room || togglingRoomId) return;
        const newStatus = room.is_active ? 0 : 1;
        const statusLabel = newStatus ? 'Active' : 'Inactive';
        setTogglingRoomId(room.id);
        try {
            await locationService.updateRoom(room.id, {
                ...room,
                is_active: newStatus
            });
            setRooms(prev => prev.map(item =>
                item.id === room.id ? { ...item, is_active: newStatus } : item
            ));
            setSuccessMessage(`Room "${room.room_name}" is now ${statusLabel}.`);
            setTimeout(() => setSuccessMessage(null), 3500);
        } catch (err) {
            console.error('Failed to toggle room status:', err);
            setError(err.response?.data?.message || 'Failed to update room status.');
            setTimeout(() => setError(null), 3500);
        } finally {
            setTogglingRoomId(null);
        }
    };

    // KPI Metrics
    const totalRoomsCount = rooms.length;
    const activeRoomsCount = rooms.filter(r => r.is_active).length;
    const bookableRoomsCount = rooms.filter(r => r.is_bookable).length;
    const restrictedRoomsCount = rooms.filter(r => r.is_restricted).length;

    // Room Type Chart Breakdown
    const typeChartData = useMemo(() => {
        const counts = {};
        ROOM_TYPES.forEach(t => { counts[t.value] = 0; });
        rooms.forEach(r => {
            const type = r.room_type || 'Meeting Room';
            counts[type] = (counts[type] || 0) + 1;
        });
        return ROOM_TYPES.map(t => ({
            name: t.label.split(' ')[0],
            count: counts[t.value] || 0,
            fill: t.color
        })).filter(d => d.count > 0 || rooms.length === 0);
    }, [rooms]);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 transition-colors"
        >
            {/* ── TOP HERO BANNER & WELCOME HEADER (ADMIN DASHBOARD STYLE) ── */}
            <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1527] via-[#111a33] to-[#0a1020] border border-slate-800 p-7 md:p-9 shadow-2xl transition-colors"
            >
                {/* TOP CURVED WAVE SVG ACCENT */}
                <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-80">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                        <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveRoom)"></path>
                        <defs>
                            <linearGradient id="topWaveRoom" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#78350f" />
                                <stop offset="50%" stopColor="#b45309" />
                                <stop offset="100%" stopColor="#f59e0b" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* BOTTOM CURVED WAVE SVG ACCENT */}
                <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-80">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                        <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveRoom)"></path>
                        <defs>
                            <linearGradient id="bottomWaveRoom" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="50%" stopColor="#d97706" />
                                <stop offset="100%" stopColor="#92400e" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 my-2">
                    <div className="space-y-2.5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-extrabold shadow-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                            </span>
                            <span>Meeting Infrastructure • Corporate Suites & Conference Pods</span>
                        </div>

                        <h1 className="!text-white text-2xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                            <span>Meeting Rooms & Executive Offices</span>
                            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                        </h1>
                        <p className="!text-slate-300 text-sm max-w-2xl font-medium leading-relaxed">
                            Supervise boardroom allocations, high-capacity presentation halls, smart AV equipment amenities, and visitor booking permissions.
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
                            <RefreshCw className={`w-4 h-4 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>{refreshing ? 'Syncing...' : 'Sync Rooms'}</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleOpenCreate}
                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 hover:from-amber-500 hover:to-orange-500 !text-white font-bold text-xs tracking-wide shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all cursor-pointer border-0"
                        >
                            <Plus className="w-4 h-4 text-white" />
                            <span className="!text-white font-bold">Register Meeting Space</span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* ── NOTIFICATION ALERTS ── */}
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

            {/* ── KPI METRICS SECTION (GLOWING CARDS) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Total Room Inventory"
                    value={totalRoomsCount}
                    subtitle="Meeting rooms, halls & offices"
                    icon={<DoorOpen size={22} />}
                    theme="amber"
                />
                <KpiCard
                    title="Operational & Ready"
                    value={activeRoomsCount}
                    subtitle={`${totalRoomsCount > 0 ? Math.round((activeRoomsCount / totalRoomsCount) * 100) : 100}% operational clearance`}
                    icon={<CheckCircle size={22} />}
                    theme="emerald"
                />
                <KpiCard
                    title="Visitor Bookable"
                    value={bookableRoomsCount}
                    subtitle="Designated for external guest visits"
                    icon={<Calendar size={22} />}
                    theme="blue"
                />
                <KpiCard
                    title="Security Restricted"
                    value={restrictedRoomsCount}
                    subtitle="Executive access badge required"
                    icon={<ShieldAlert size={22} />}
                    theme="rose"
                />
            </div>

            {/* ── ROOM INVENTORY & TYPE DISTRIBUTION (RECHARTS) ── */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                                Meeting Space Category Breakdown
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Volume and capacity distribution across conference, executive, and board spaces
                            </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold">
                            {rooms.length} Active Spaces
                        </span>
                    </div>

                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                                <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} />
                                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                        borderColor: isDark ? '#334155' : '#e2e8f0',
                                        borderRadius: '0.75rem',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                        color: isDark ? '#ffffff' : '#0f172a',
                                        fontSize: '12px'
                                    }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {typeChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill || '#f59e0b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-amber-500" />
                                Facility Readiness
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-extrabold uppercase">
                                Verified
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            Conference AV status, projector screens, Wi-Fi coverage, and booking policy integrity.
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">AV Equipped Rooms</span>
                                <span className="text-xs font-bold text-blue-500">
                                    {rooms.filter(r => r.amenities && (r.amenities.includes('Video') || r.amenities.includes('Display'))).length} Units
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Seating Allotment</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {rooms.reduce((acc, r) => acc + (parseInt(r.capacity, 10) || 0), 0)} Seats
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Security Clearance Rule</span>
                                <span className="text-xs font-bold text-amber-500">
                                    {restrictedRoomsCount > 0 ? 'Badge Required' : 'Standard'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-medium">
                        Smart calendar integration active
                    </div>
                </div>
            </motion.div>

            {/* ── FILTER & SEARCH CONTROLS ── */}
            <motion.div
                variants={itemVariants}
                className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
            >
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            placeholder="Search by room name, code, facility, or amenity..."
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
                            className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            value={selectedBuilding}
                            onChange={(e) => setSelectedBuilding(e.target.value)}
                        >
                            <option value="">All Buildings</option>
                            {buildings.map(b => (
                                <option key={b.id} value={b.id}>{b.building_name}</option>
                            ))}
                        </select>

                        <select
                            className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="">All Room Types</option>
                            {ROOM_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>

                        <select
                            className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            value={bookableFilter}
                            onChange={(e) => setBookableFilter(e.target.value)}
                        >
                            <option value="">All Bookability</option>
                            <option value="1">Visitor Bookable</option>
                            <option value="0">Staff Only</option>
                        </select>

                        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                                }`}
                                title="Table View"
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                                }`}
                                title="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── ROOM DATA TABLE OR GRID VIEW ── */}
            {viewMode === 'table' ? (
                <motion.div
                    variants={itemVariants}
                    className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50">
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Room Name & Code
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Type
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Location & Level
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                                        Capacity
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Policy & Access
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                                        Status
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-16 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-500 font-semibold">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Loading room inventory...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : rooms.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-16 text-center">
                                            <div className="max-w-md mx-auto space-y-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                                    <DoorOpen size={24} />
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Meeting Spaces Found</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    No rooms match your filter criteria. Register meeting rooms and offices mapped to facility floors.
                                                </p>
                                                <button
                                                    onClick={handleOpenCreate}
                                                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
                                                >
                                                    <Plus size={14} /> Add First Room
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    rooms.map((r) => (
                                        <tr
                                            key={r.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                                                        <DoorOpen size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-slate-900 dark:text-white">
                                                            {r.room_name}
                                                        </span>
                                                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                            {r.room_code || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 font-semibold text-[11px]">
                                                    {r.room_type || 'Meeting Room'}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                                                    <Building2 size={13} className="text-blue-500" />
                                                    <span>{r.building_name || 'Main Campus'}</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <Layers size={12} className="text-cyan-400" />
                                                    <span>Level {r.floor_number ?? '1'}: {r.floor_name || 'Floor'}</span>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                                                    <Users size={12} className="text-slate-400" />
                                                    {r.capacity || 'N/A'}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {r.is_bookable ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-semibold text-[10px]">
                                                            <Check size={10} /> Bookable
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px]">
                                                            Internal Only
                                                        </span>
                                                    )}
                                                    {r.is_restricted ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-semibold text-[10px]">
                                                            <ShieldAlert size={10} /> Restricted
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(r)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] transition-all hover:scale-105 cursor-pointer ${
                                                        r.is_active
                                                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
                                                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20'
                                                    }`}
                                                    title={`Room is ${r.is_active ? 'Active' : 'Inactive'} — Click to toggle status`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${r.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                    {r.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    {/* Active / Inactive Status Toggle Icon */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.12 }}
                                                        whileTap={{ scale: 0.92 }}
                                                        onClick={() => handleToggleStatus(r)}
                                                        disabled={togglingRoomId === r.id}
                                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                                            r.is_active
                                                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:border-emerald-500/50 shadow-sm'
                                                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30 hover:border-rose-500/50 shadow-sm'
                                                        }`}
                                                        title={r.is_active ? "Room Active — Click to Deactivate" : "Room Inactive — Click to Activate"}
                                                    >
                                                        {togglingRoomId === r.id ? (
                                                            <RefreshCw size={15} className="animate-spin" />
                                                        ) : (
                                                            <Power size={15} />
                                                        )}
                                                    </motion.button>

                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleOpenAvailability(r)}
                                                        className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 transition-colors cursor-pointer"
                                                        title="Check Calendar Availability"
                                                    >
                                                        <Calendar size={15} />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleOpenEdit(r)}
                                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                                        title="Edit Room Specifications"
                                                    >
                                                        <Edit size={15} />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setDeleteTarget(r)}
                                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                                                        title="Delete Room"
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
            ) : (
                /* Card Grid View */
                <motion.div
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    {rooms.map(r => (
                        <motion.div
                            key={r.id}
                            variants={itemVariants}
                            whileHover={{ y: -4 }}
                            className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        <DoorOpen size={24} />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                            {r.room_code || 'RM'}
                                        </span>
                                        {r.is_active ? (
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                        ) : (
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        {r.room_name}
                                    </h4>
                                    <span className="inline-block mt-1 text-xs font-semibold text-blue-500">
                                        {r.room_type || 'Meeting Space'}
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Campus Facility</span>
                                        <span className="font-semibold">{r.building_name || 'Main Campus'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Level Storey</span>
                                        <span className="font-bold text-cyan-500">Level {r.floor_number ?? '1'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Seating Capacity</span>
                                        <span className="font-bold text-amber-500">{r.capacity || 'N/A'} Seats</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => handleOpenAvailability(r)}
                                    className="text-xs font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                                >
                                    <Calendar size={14} />
                                    <span>Check Schedule</span>
                                </button>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenEdit(r)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(r)}
                                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* ── CREATE / EDIT MODAL ── */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        <DoorOpen size={20} />
                                    </div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        {modalMode === 'create' ? 'Register Meeting Space' : `Edit Room: ${currentRoom?.room_name}`}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Building *</label>
                                        <select
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
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
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Level *</label>
                                        <select
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            value={formData.floor_id}
                                            onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                                            disabled={!formData.building_id}
                                        >
                                            <option value="">Select Floor Level</option>
                                            {formFloors.map(f => (
                                                <option key={f.id} value={f.id}>Level {f.floor_number} - {f.floor_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room Name *</label>
                                        <input
                                            type="text"
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            placeholder="e.g. Apex Conference Hall"
                                            value={formData.room_name}
                                            onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room Code *</label>
                                        <input
                                            type="text"
                                            className="w-full py-2.5 px-3 rounded-xl text-xs font-mono uppercase bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            placeholder="RM-201"
                                            value={formData.room_code}
                                            onChange={(e) => setFormData({ ...formData, room_code: e.target.value.toUpperCase() })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room Type</label>
                                        <select
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            value={formData.room_type}
                                            onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                                        >
                                            {ROOM_TYPES.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Seating Capacity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 pt-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded text-amber-500 focus:ring-amber-500"
                                            checked={!!formData.is_bookable}
                                            onChange={(e) => setFormData({ ...formData, is_bookable: e.target.checked ? 1 : 0 })}
                                        />
                                        <span>Visitor Bookable</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-rose-500 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded text-rose-500 focus:ring-rose-500"
                                            checked={!!formData.is_restricted}
                                            onChange={(e) => setFormData({ ...formData, is_restricted: e.target.checked ? 1 : 0 })}
                                        />
                                        <span>Security Restricted</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded text-emerald-500 focus:ring-emerald-500"
                                            checked={!!formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                                        />
                                        <span>Active & Online</span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Amenities & Presentation Equipment
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {STANDARD_AMENITIES.map(amenity => {
                                            const selected = formData.amenities.includes(amenity);
                                            return (
                                                <button
                                                    key={amenity}
                                                    type="button"
                                                    onClick={() => toggleAmenity(amenity)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                        selected
                                                            ? 'bg-amber-500/15 border-amber-500 text-amber-500'
                                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {selected && <Check size={12} className="inline mr-1" />}
                                                    {amenity}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30"
                                    >
                                        {submitting ? 'Saving...' : modalMode === 'create' ? 'Register Space' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── AVAILABILITY CHECKER MODAL ── */}
            <AnimatePresence>
                {showAvailabilityModal && checkingRoom && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <Calendar className="text-cyan-500" size={22} />
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            Booking Checker: {checkingRoom.room_name}
                                        </h3>
                                        <p className="text-xs text-slate-400">Verify conflict schedule</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAvailabilityModal(false)} className="text-slate-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Start Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                        value={checkStartTime}
                                        onChange={(e) => setCheckStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target End Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                        value={checkEndTime}
                                        onChange={(e) => setCheckEndTime(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={checkAvailability}
                                    disabled={checkingAvailability}
                                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    {checkingAvailability ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar size={14} />}
                                    <span>{checkingAvailability ? 'Checking Conflicts...' : 'Verify Availability'}</span>
                                </button>

                                {availabilityResult && (
                                    <div className={`p-4 rounded-2xl text-xs font-bold ${
                                        availabilityResult.available
                                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                            : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                                    }`}>
                                        {availabilityResult.available ? (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle size={18} />
                                                <span>Room is Available! No schedule conflicts found for this slot.</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle size={18} />
                                                <span>Room Occupied or Conflict Detected for requested slot.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── DELETE MODAL ── */}
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
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Delete Meeting Space</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                Are you sure you want to delete room <strong>"{deleteTarget.room_name}"</strong> ({deleteTarget.room_code})?
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
