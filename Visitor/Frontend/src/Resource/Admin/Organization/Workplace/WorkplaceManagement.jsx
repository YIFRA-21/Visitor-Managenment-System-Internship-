import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Building2, Layers, DoorOpen, Users, Search, Filter, RefreshCw,
    Edit, History, CheckCircle, AlertTriangle, Calendar, Clock, MapPin, Check,
    X, Shield, ArrowRight, UserCheck, Sparkles, LayoutGrid, List, SlidersHorizontal,
    TrendingUp, Activity, Compass, Laptop, Building
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie
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
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 58, 138, 0.15) 55%, transparent 100%)',
        iconBg: 'rgba(59, 130, 246, 0.15)',
        iconBorder: 'rgba(59, 130, 246, 0.3)',
        iconColor: '#3b82f6',
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
    indigo: {
        barColor: '#6366f1',
        hoverBarColor: '#818cf8',
        darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(49, 46, 129, 0.15) 55%, transparent 100%)',
        iconBg: 'rgba(99, 102, 241, 0.15)',
        iconBorder: 'rgba(99, 102, 241, 0.3)',
        iconColor: '#6366f1',
    }
};

function KpiCard({ title, value, subtitle, icon, theme = 'blue', onClick }) {
    const [hovered, setHovered] = useState(false);
    const styles = THEME_STYLES[theme] || THEME_STYLES.blue;

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

    // View layout: 'table' | 'grid'
    const [viewMode, setViewMode] = useState('table');

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
            if (assignments.length === 0) {
                setError(err.response?.data?.message || 'Unable to load employee workplace assignments.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterOrg, filterBranch, filterBuilding, filterDept, filterStatus, searchTerm, assignments.length]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAssignments();
    };

    // Cascading in assignment modal
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

    // Chart Data for Workplace Model Breakdown
    const workplaceChartData = useMemo(() => {
        return [
            { name: 'Permanent', count: stats.permanent || 0, fill: '#10b981' },
            { name: 'Flexible', count: stats.flexible || 0, fill: '#f59e0b' },
            { name: 'Remote', count: stats.remote || 0, fill: '#3b82f6' },
            { name: 'Temporary', count: stats.temporary || 0, fill: '#6366f1' }
        ];
    }, [stats]);

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
                        <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveWorkplace)"></path>
                        <defs>
                            <linearGradient id="topWaveWorkplace" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#1e1b4b" />
                                <stop offset="50%" stopColor="#312e81" />
                                <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* BOTTOM CURVED WAVE SVG ACCENT */}
                <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-80">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                        <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveWorkplace)"></path>
                        <defs>
                            <linearGradient id="bottomWaveWorkplace" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#4f46e5" />
                                <stop offset="50%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#1d4ed8" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 my-2">
                    <div className="space-y-2.5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-xs font-extrabold shadow-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </span>
                            <span>Personnel Hierarchy • Workplace Allocation Console</span>
                        </div>

                        <h1 className="!text-white text-2xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                            <span>Workplace Desks & Personnel Allocations</span>
                            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                        </h1>
                        <p className="!text-slate-300 text-sm max-w-2xl font-medium leading-relaxed">
                            Map staff members across organizational tiers (Branch &rarr; Building &rarr; Floor &rarr; Desk/Office) with real-time occupancy telemetry and audit trails.
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
                            <RefreshCw className={`w-4 h-4 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>{refreshing ? 'Syncing...' : 'Sync Workplace'}</span>
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

            {/* ── KPI METRICS SECTION ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Total Assigned Personnel"
                    value={stats.total_assigned || assignments.length}
                    subtitle="Active workplace desk placements"
                    icon={<Users size={22} />}
                    theme="blue"
                />
                <KpiCard
                    title="Permanent Dedicated Desks"
                    value={stats.permanent || 0}
                    subtitle="Fixed office and desk allocations"
                    icon={<Building2 size={22} />}
                    theme="emerald"
                />
                <KpiCard
                    title="Flexible & Hot Desks"
                    value={stats.flexible || 0}
                    subtitle="Shared agile seating stations"
                    icon={<MapPin size={22} />}
                    theme="amber"
                />
                <KpiCard
                    title="Remote & Floating Staff"
                    value={stats.remote || 0}
                    subtitle="Mobile personnel & hybrid status"
                    icon={<Laptop size={22} />}
                    theme="indigo"
                />
            </div>

            {/* ── DESK ALLOCATION MODEL ANALYTICS ── */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                Workplace Model Distribution
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Breakdown of physical seating allocations across Permanent, Flexible, Remote, and Temporary desks
                            </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-xs font-bold">
                            {assignments.length} Mapped Personnel
                        </span>
                    </div>

                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={workplaceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    {workplaceChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill || '#6366f1'} />
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
                                <Shield className="w-5 h-5 text-indigo-500" />
                                Allocation Telemetry
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-extrabold uppercase">
                                Synced
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            Physical security pass mapping, building check-in verification, and active office coordinates.
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Permanent Occupancy</span>
                                <span className="text-xs font-bold text-emerald-500">
                                    {stats.total_assigned > 0 ? Math.round(((stats.permanent || 0) / stats.total_assigned) * 100) : 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Flexible Ratio</span>
                                <span className="text-xs font-bold text-amber-500">
                                    {stats.total_assigned > 0 ? Math.round(((stats.flexible || 0) / stats.total_assigned) * 100) : 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Movement Audit Trail</span>
                                <span className="text-xs font-bold text-indigo-500">
                                    Active & Audited
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-medium">
                        Audited across corporate hierarchy
                    </div>
                </div>
            </motion.div>

            {/* ── FILTER & SEARCH BAR ── */}
            <motion.div
                variants={itemVariants}
                className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
            >
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="Search employee name, staff ID, department, or desk location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <select
                            className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={filterBuilding}
                            onChange={(e) => setFilterBuilding(e.target.value)}
                        >
                            <option value="">All Facilities</option>
                            {buildings.map(b => (
                                <option key={b.id} value={b.id}>{b.building_name}</option>
                            ))}
                        </select>

                        <select
                            className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Desk Models</option>
                            <option value="Permanent">Permanent</option>
                            <option value="Temporary">Temporary</option>
                            <option value="Flexible">Flexible / Hot-Desk</option>
                            <option value="Remote">Remote</option>
                        </select>

                        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                                title="Table View"
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                                title="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── WORKPLACE ASSIGNMENTS TABLE OR GRID ── */}
            {viewMode === 'table' ? (
                <motion.div
                    variants={itemVariants}
                    className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50">
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee</th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Department</th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Facility & Campus</th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Floor & Desk Location</th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Workplace Type</th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Effective Date</th>
                                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-16 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-500 font-semibold">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Loading workplace allocations...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : assignments.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-16 text-center">
                                            <div className="max-w-md mx-auto space-y-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                                    <Briefcase size={24} />
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Personnel Mappings Found</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    No employees match your current filter criteria.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    assignments.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center shrink-0 border border-indigo-500/20">
                                                        {(emp.first_name?.[0] || 'E') + (emp.last_name?.[0] || '')}
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-slate-900 dark:text-white">
                                                            {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">
                                                            {emp.job_title || 'Staff'} &bull; {emp.employee_number || `#${emp.id}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className="font-semibold text-slate-900 dark:text-white block">
                                                    {emp.department_name || 'General Enterprise'}
                                                </span>
                                                {emp.organization_name && (
                                                    <span className="text-[11px] text-slate-400">{emp.organization_name}</span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                                                    <Building2 size={13} className="text-blue-500" />
                                                    <span>{emp.building_name || 'Main Campus'}</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400">{emp.branch_name || 'Headquarters'}</div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">
                                                    <Layers size={13} className="text-cyan-500" />
                                                    <span>{emp.floor_name ? `${emp.floor_name} (L${emp.floor_number})` : `Floor ${emp.floor_number || 'N/A'}`}</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <DoorOpen size={12} className="text-amber-500" />
                                                    <span>{emp.room_name || `Desk ${emp.office_number || 'N/A'}`}</span>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                                                    emp.workplace_status === 'Permanent' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    emp.workplace_status === 'Flexible' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    emp.workplace_status === 'Remote' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        emp.workplace_status === 'Permanent' ? 'bg-emerald-500' :
                                                        emp.workplace_status === 'Flexible' ? 'bg-amber-500' :
                                                        emp.workplace_status === 'Remote' ? 'bg-blue-500' : 'bg-slate-400'
                                                    }`} />
                                                    {emp.workplace_status || 'Permanent'}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                                                <div>{emp.effective_start_date ? new Date(emp.effective_start_date).toLocaleDateString() : 'Active'}</div>
                                                {emp.effective_end_date && (
                                                    <div className="text-[10px] text-slate-400">until {new Date(emp.effective_end_date).toLocaleDateString()}</div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleOpenHistory(emp)}
                                                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors"
                                                        title="View Workplace Movement History"
                                                    >
                                                        <History size={15} />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleOpenAssign(emp)}
                                                        className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-colors"
                                                        title="Reassign Desk Location"
                                                    >
                                                        <Edit size={15} />
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
                /* Grid View */
                <motion.div
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    {assignments.map(emp => (
                        <motion.div
                            key={emp.id}
                            variants={itemVariants}
                            whileHover={{ y: -4 }}
                            className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center border border-indigo-500/20">
                                        {(emp.first_name?.[0] || 'E') + (emp.last_name?.[0] || '')}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        emp.workplace_status === 'Permanent' ? 'bg-emerald-500/10 text-emerald-500' :
                                        emp.workplace_status === 'Flexible' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-blue-500/10 text-blue-500'
                                    }`}>
                                        {emp.workplace_status || 'Permanent'}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                                    </h4>
                                    <span className="text-xs text-slate-400">
                                        {emp.job_title || 'Staff'} &bull; {emp.department_name || 'General'}
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Facility</span>
                                        <span className="font-semibold">{emp.building_name || 'Main Campus'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Level & Desk</span>
                                        <span className="font-bold text-indigo-500">
                                            {emp.floor_name || `L${emp.floor_number || 1}`} &bull; {emp.room_name || `Desk ${emp.office_number || 'N/A'}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => handleOpenHistory(emp)}
                                    className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                                >
                                    <History size={14} />
                                    <span>History Log</span>
                                </button>
                                <button
                                    onClick={() => handleOpenAssign(emp)}
                                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                                >
                                    <Edit size={13} />
                                    <span>Reassign</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* ── ASSIGN WORKPLACE MODAL ── */}
            <AnimatePresence>
                {showAssignModal && selectedEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Assign Workplace: {selectedEmployee.full_name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Map employee coordinates across facility levels and desks.
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitAssignment} className="p-6 space-y-4">
                                {formErrors.submit && (
                                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                                        {formErrors.submit}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Organization *</label>
                                        <select
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
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

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch / Campus *</label>
                                        <select
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
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

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Building Facility *</label>
                                        <select
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
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

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Level</label>
                                        <select
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
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

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room / Office / Desk</label>
                                        <select
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            value={assignForm.room_id}
                                            onChange={(e) => setAssignForm({ ...assignForm, room_id: e.target.value })}
                                            disabled={!assignForm.floor_id}
                                        >
                                            <option value="">Select Room / Zone</option>
                                            {modalRooms.map(r => (
                                                <option key={r.id} value={r.id}>{r.room_name} ({r.room_code})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Workplace Model</label>
                                        <select
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            value={assignForm.workplace_status}
                                            onChange={(e) => setAssignForm({ ...assignForm, workplace_status: e.target.value })}
                                        >
                                            <option value="Permanent">Permanent Dedicated Desk</option>
                                            <option value="Flexible">Flexible Hot-Desk</option>
                                            <option value="Temporary">Temporary Project Desk</option>
                                            <option value="Remote">Remote / Mobile Worker</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Effective Start Date *</label>
                                        <input
                                            type="date"
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            value={assignForm.effective_start_date}
                                            onChange={(e) => setAssignForm({ ...assignForm, effective_start_date: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assignment Note</label>
                                        <input
                                            type="text"
                                            className="w-full py-2.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            placeholder="e.g. Department expansion, floor relocation"
                                            value={assignForm.assignment_reason}
                                            onChange={(e) => setAssignForm({ ...assignForm, assignment_reason: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignModal(false)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                                    >
                                        {submitting ? 'Applying Assignment...' : 'Save & Audit Assignment'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── WORKPLACE HISTORY MODAL ── */}
            <AnimatePresence>
                {showHistoryModal && selectedEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <History className="text-blue-500" size={22} />
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            Workplace Movement Audit: {selectedEmployee.full_name}
                                        </h3>
                                        <p className="text-xs text-slate-400">Historical desk placements & transfers</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            {loadingHistory ? (
                                <div className="py-8 text-center text-xs text-slate-400">Loading historical records...</div>
                            ) : historyList.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    No historical movements recorded yet. Current assignment is initial placement.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                    {historyList.map((hist, idx) => (
                                        <div key={hist.id || idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="font-bold text-indigo-500">{hist.workplace_status || 'Assigned'}</span>
                                                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {new Date(hist.created_at || hist.effective_start_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                {hist.building_name || 'Facility'} &bull; {hist.floor_name || `Floor ${hist.floor_number}`} &bull; {hist.room_name || `Desk ${hist.office_number}`}
                                            </div>
                                            {hist.assignment_reason && (
                                                <div className="text-[11px] text-slate-400 mt-1 italic">
                                                    "{hist.assignment_reason}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
