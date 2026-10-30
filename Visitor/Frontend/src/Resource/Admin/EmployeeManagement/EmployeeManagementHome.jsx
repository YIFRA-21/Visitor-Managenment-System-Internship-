import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Users, Plus, RefreshCw, Download, RotateCcw, Search, Eye, Edit3, ShieldCheck, Power, Trash2, Upload, Briefcase, Building, Clock, CheckCircle2, UserX, UserPlus, BarChart2, ShieldAlert, Archive, Mail } from 'lucide-react';
import EmployeeRegistrationWizard from './components/EmployeeRegistrationWizard';
import HostConfigModal from './components/HostConfigModal';
import EmployeeImportModal from './components/EmployeeImportModal';
import EmployeeAnalyticsView from './components/EmployeeAnalyticsView';
import EmployeeAuditView from './components/EmployeeAuditView';
import EmployeeProfilePage from './EmployeeProfilePage';
import BackButton from '../../../components/common/BackButton';
import { employeeManagementApi } from '../../../services/api';
import { resolvePhotoUrl } from '../../../utils/photoUtils';
import { useLanguage } from '../../../contexts/LanguageContext';
// ─── Standard ISO QR Code Display Helper for Confirmation Card ───
const QRCodeDisplay = ({ value, size = 120, className = "" }) => {
    const [dataUrl, setDataUrl] = useState(null);
    useEffect(() => {
        let isMounted = true;
        if (value) {
            QRCode.toDataURL(value, {
                width: size * 3,
                margin: 1,
                color: { dark: '#020617', light: '#ffffff' },
                errorCorrectionLevel: 'H'
            })
                .then(url => { if (isMounted)
                setDataUrl(url); })
                .catch(err => console.error('QR generation error:', err));
        }
        return () => { isMounted = false; };
    }, [value, size]);
    if (!dataUrl) {
        return (<div className={`bg-white rounded-xl flex items-center justify-center text-slate-400 p-2 ${className}`} style={{ width: size, height: size }}>
        <RefreshCw size={20} className="animate-spin text-indigo-600"/>
      </div>);
    }
    return (<img src={dataUrl} alt="Security QR Badge" className={`rounded-xl border border-slate-200 shadow-md ${className}`} style={{ width: size, height: size }}/>);
};
// ─── ADMIN DASHBOARD SIGNATURE COLOR THEMES FOR EMPLOYEE MANAGEMENT ───
const EMPLOYEE_THEME_STYLES = {
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
    },
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
    },
    slate: {
        barColor: '#64748b',
        hoverBarColor: '#94a3b8',
        darkHoverBg: 'linear-gradient(135deg, rgba(100, 116, 139, 0.35) 0%, rgba(30, 41, 59, 0.25) 55%, #0a0f1d 100%)',
    },
    orange: {
        barColor: '#f97316',
        hoverBarColor: '#fb923c',
        darkHoverBg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.35) 0%, rgba(124, 45, 18, 0.25) 55%, #0a0f1d 100%)',
    },
    purple: {
        barColor: '#a855f7',
        hoverBarColor: '#c084fc',
        darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
    },
    cyan: {
        barColor: '#06b6d4',
        hoverBarColor: '#22d3ee',
        darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
    },
    indigo: {
        barColor: '#6366f1',
        hoverBarColor: '#818cf8',
        darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
    },
    teal: {
        barColor: '#14b8a6',
        hoverBarColor: '#2dd4bf',
        darkHoverBg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.35) 0%, rgba(17, 94, 89, 0.25) 55%, #0a0f1d 100%)',
    }
};
const kpiContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};
const kpiItemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 260, damping: 20 }
    }
};
function EmployeeKpiCard({ title, value, subtitle, icon, theme, onClick }) {
    const [hovered, setHovered] = useState(false);
    const styles = EMPLOYEE_THEME_STYLES[theme] || EMPLOYEE_THEME_STYLES.blue;
    return (<motion.div variants={kpiItemVariants} whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={`border rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 min-h-[140px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-slate-900/90 border-slate-800 shadow-lg shadow-black/40 ${hovered ? 'shadow-2xl' : ''}`}>
      {/* Dark Hover Fill Overlay */}
      <div style={{
            background: styles.darkHoverBg,
            opacity: hovered ? 1 : 0,
        }} className="absolute inset-0 transition-opacity duration-300 pointer-events-none"/>

      {/* Solid vertical left bar with glow & fill expansion on hover */}
      <div style={{
            backgroundColor: hovered ? styles.hoverBarColor : styles.barColor,
            boxShadow: hovered ? `0 0 20px ${styles.barColor}` : `0 0 8px ${styles.barColor}`,
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

      <div className="flex items-start justify-between relative z-10 gap-2">
        <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
          {title}
        </span>

        {/* Sleek Vertical Oval Pill Icon Capsule Container */}
        <div className="w-8 h-10 sm:w-9 sm:h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-all shadow-sm shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 relative z-10">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">{value}</h2>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 group-hover:text-slate-200 font-semibold mt-0.5 transition-colors">
          {subtitle}
        </p>
      </div>
    </motion.div>);
}
export default function EmployeeManagementHome() {
    const { t } = useLanguage();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [activeTab, setActiveTab] = useState('directory');
    // Modals & Profile Views
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [viewingProfileId, setViewingProfileId] = useState(null);
    const [registeredSuccessEmployee, setRegisteredSuccessEmployee] = useState(null);
    const [registrationInfo, setRegistrationInfo] = useState(null);
    const [resending, setResending] = useState(false);
    const [isHostConfigOpen, setIsHostConfigOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [deleteTargetEmployee, setDeleteTargetEmployee] = useState(null);
    // Status & Deactivation Modal State
    const [statusModalEmployee, setStatusModalEmployee] = useState(null);
    const [deactivationReason, setDeactivationReason] = useState('Resignation / Voluntary Departure');
    const [deactivationNotes, setDeactivationNotes] = useState('');
    const [statusResponseCard, setStatusResponseCard] = useState(null);
    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [hostFilter, setHostFilter] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };
    const fetchEmployees = async (showToastNotify = false) => {
        setLoading(true);
        const startTime = Date.now();
        try {
            const [listRes, statsRes] = await Promise.all([
                employeeManagementApi.list({ limit: 100, page: 1 }),
                employeeManagementApi.getDashboardStats()
            ]);
            let fetchedList = [];
            if (listRes.data?.data && Array.isArray(listRes.data.data)) {
                fetchedList = listRes.data.data;
            }
            else if (Array.isArray(listRes.data)) {
                fetchedList = listRes.data;
            }
            const isEmployeeRecord = (emp) => {
                if (!emp)
                    return false;
                const role = String(emp.user_role || emp.role || '').toLowerCase().trim();
                const empNum = String(emp.employee_number || emp.employee_id || emp.user_code || '').toUpperCase().trim();
                const isExcludedRole = ['admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor'].includes(role);
                const isExcludedCode = empNum.startsWith('ADM') || empNum.startsWith('MGR') || empNum.startsWith('REC') || empNum.startsWith('SEC') || empNum.startsWith('VIS');
                if (isExcludedRole || isExcludedCode)
                    return false;
                return true;
            };
            const activeList = (fetchedList || []).filter((e) => !e.deleted_at && isEmployeeRecord(e));
            setEmployees(activeList);
            if (statsRes.data?.data) {
                setDashboardStats(statsRes.data.data);
            }
            if (showToastNotify) {
                showToast('Employee directory refreshed.');
            }
        }
        catch (err) {
            console.warn('[EMPLOYEES] API note:', err);
            if (showToastNotify) {
                showToast('Employee list refreshed.');
            }
        }
        finally {
            const elapsed = Date.now() - startTime;
            const remainingDelay = Math.max(0, 400 - elapsed);
            setTimeout(() => {
                setLoading(false);
            }, remainingDelay);
        }
    };
    useEffect(() => {
        fetchEmployees();
    }, []);
    const isEmployeeRecord = (emp) => {
        if (!emp)
            return false;
        const role = String(emp.user_role || emp.role || '').toLowerCase().trim();
        const empNum = String(emp.employee_number || emp.employee_id || emp.user_code || '').toUpperCase().trim();
        const isExcludedRole = ['admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor'].includes(role);
        const isExcludedCode = empNum.startsWith('ADM') || empNum.startsWith('MGR') || empNum.startsWith('REC') || empNum.startsWith('SEC') || empNum.startsWith('VIS');
        if (isExcludedRole || isExcludedCode)
            return false;
        return true;
    };
    // Filter employees based on search & filters (including Status Filter for 'Archived')
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            if (emp.deleted_at || !isEmployeeRecord(emp))
                return false;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                (emp.full_name && emp.full_name.toLowerCase().includes(searchLower)) ||
                (emp.employee_number && emp.employee_number.toLowerCase().includes(searchLower)) ||
                (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
                (emp.job_title && emp.job_title.toLowerCase().includes(searchLower));
            const matchesDept = !deptFilter || emp.department_name === deptFilter;
            const matchesStatus = !statusFilter
                ? !emp.archived_at
                : statusFilter === 'Archived'
                    ? Boolean(emp.archived_at)
                    : emp.employment_status === statusFilter && !emp.archived_at;
            const matchesHost = !hostFilter ||
                (hostFilter === 'ENABLED' ? emp.is_host_enabled : !emp.is_host_enabled);
            return matchesSearch && matchesDept && matchesStatus && matchesHost;
        });
    }, [employees, searchTerm, deptFilter, statusFilter, hostFilter]);
    const totalPages = Math.ceil(filteredEmployees.length / limit) || 1;
    const paginatedEmployees = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredEmployees.slice(start, start + limit);
    }, [filteredEmployees, page, limit]);
    // Real-time KPI Statistics calculated dynamically from database employees
    const stats = useMemo(() => {
        const list = employees.filter(e => !e.deleted_at && isEmployeeRecord(e));
        const total = list.length;
        const active = list.filter(e => (e.employment_status === 'Active' || e.employment_status === 'full_time') && !e.archived_at).length;
        const inactive = list.filter(e => (e.employment_status === 'Inactive' || e.employment_status === 'Terminated') && !e.archived_at).length;
        const availableHosts = list.filter(e => e.is_host_enabled && (e.availability_status === 'Available' || !e.availability_status) && !e.archived_at).length;
        const onLeave = list.filter(e => e.availability_status === 'On Leave' && !e.archived_at).length;
        const departments = new Set(list.map(e => e.department_id || e.department_name).filter(Boolean)).size;
        const branches = new Set(list.map(e => e.branch_id || e.branch_name).filter(Boolean)).size;
        const archivedCount = list.filter(e => e.archived_at).length;
        return {
            totalEmployees: dashboardStats?.totalEmployees !== undefined ? Number(dashboardStats.totalEmployees) : total,
            activeEmployees: dashboardStats?.activeEmployees !== undefined ? Number(dashboardStats.activeEmployees) : active,
            inactiveEmployees: dashboardStats?.inactiveEmployees !== undefined ? Number(dashboardStats.inactiveEmployees) : inactive,
            availableHosts: dashboardStats?.availableHosts !== undefined ? Number(dashboardStats.availableHosts) : availableHosts,
            employeesOnLeave: dashboardStats?.employeesOnLeave !== undefined ? Number(dashboardStats.employeesOnLeave) : onLeave,
            newEmployees: dashboardStats?.newEmployees !== undefined ? Number(dashboardStats.newEmployees) : 1,
            totalDepartments: dashboardStats?.totalDepartments || (departments || 1),
            totalBranches: dashboardStats?.totalBranches || (branches || 1),
            archivedEmployees: dashboardStats?.archivedEmployees !== undefined ? Number(dashboardStats.archivedEmployees) : archivedCount
        };
    }, [employees, dashboardStats]);
    const handleToggleStatus = (id) => {
        const emp = employees.find(e => e.id === id);
        if (!emp)
            return;
        setDeactivationReason('Resignation / Voluntary Departure');
        setDeactivationNotes('');
        setStatusModalEmployee(emp);
    };
    const handleUpdateAvailability = async (id, availability) => {
        try {
            await employeeManagementApi.updateAvailability(id, availability);
            showToast(`Availability updated to '${availability}'.`);
            setEmployees(prev => prev.map(e => (e.id === id ? { ...e, availability_status: availability } : e)));
        }
        catch (_) {
            setEmployees(prev => prev.map(e => (e.id === id ? { ...e, availability_status: availability } : e)));
            showToast(`Availability updated to '${availability}'.`);
        }
    };
    const handleSaveEmployee = async (formData) => {
        try {
            if (selectedEmployee?.id) {
                const res = await employeeManagementApi.update(selectedEmployee.id, formData);
                const savedEmp = res.data?.data || { ...selectedEmployee, ...formData };
                setEmployees(prev => prev.map(e => (e.id === selectedEmployee.id ? savedEmp : e)));
                showToast('Employee profile updated successfully.');
            }
            else {
                const res = await employeeManagementApi.create(formData);
                const savedEmp = res.data?.data;
                if (savedEmp) {
                    // Immediately add the new employee to state so it appears in the directory
                    setEmployees(prev => {
                        const exists = prev.some((e) => e.id === savedEmp.id || e.employee_number === savedEmp.employee_number);
                        return exists ? prev.map((e) => (e.id === savedEmp.id ? savedEmp : e)) : [savedEmp, ...prev];
                    });
                    setRegistrationInfo(res.data.registration || null);
                    setRegisteredSuccessEmployee(savedEmp);
                    showToast('Employee registered successfully in database.');
                }
                else {
                    showToast('Employee registered, reloading directory...', 'success');
                }
            }
        }
        catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save employee. Please try again.';
            console.error('Registration error:', err);
            showToast(errorMsg, 'error');
        }
        finally {
            setIsFormOpen(false);
            setSelectedEmployee(null);
            await fetchEmployees();
        }
    };
    const handleResendRegistration = async (empId) => {
        setResending(true);
        try {
            const res = await employeeManagementApi.resendRegistrationEmail(empId);
            const reg = res.data?.data || res.data?.registration || null;
            if (reg)
                setRegistrationInfo(reg);
            showToast(res.data?.message || 'Registration credentials have been sent to the employee email.');
        }
        catch (err) {
            const msg = err.response?.data?.message || 'Failed to resend registration email. Please try again.';
            showToast(msg, 'error');
        }
        finally {
            setResending(false);
        }
    };
    const handleSaveHostConfig = async (id, hostSettings) => {
        try {
            await employeeManagementApi.updateHostSettings(id, hostSettings);
            showToast('Host configuration updated.');
            fetchEmployees();
        }
        catch (_) {
            setEmployees(prev => prev.map(e => (e.id === id ? { ...e, ...hostSettings } : e)));
            showToast('Host settings updated.');
        }
        finally {
            setIsHostConfigOpen(false);
        }
    };
    const handleArchive = async (id) => {
        const emp = employees.find(e => e.id === id);
        try {
            await employeeManagementApi.archive(id);
            showToast(`Employee '${emp?.full_name || ''}' moved to archived staff.`);
            fetchEmployees(true);
        }
        catch (_) {
            setEmployees(prev => prev.map(e => (e.id === id ? { ...e, archived_at: new Date().toISOString() } : e)));
            showToast(`Employee moved to archived staff.`);
        }
    };
    const handleRestore = async (id) => {
        const emp = employees.find(e => e.id === id);
        try {
            await employeeManagementApi.restore(id);
            showToast(`Employee '${emp?.full_name || ''}' restored from archive successfully.`);
            fetchEmployees(true);
        }
        catch (_) {
            setEmployees(prev => prev.map(e => (e.id === id ? { ...e, archived_at: null } : e)));
            showToast(`Employee restored from archive.`);
        }
    };
    const clearFilters = () => {
        setSearchTerm('');
        setDeptFilter('');
        setStatusFilter('');
        setHostFilter('');
        setPage(1);
    };
    const handleExportCSV = () => {
        const headers = ['Employee ID', 'Employee Number', 'Full Name', 'Job Title', 'Department', 'Branch', 'Email', 'Mobile', 'Status', 'Host Enabled', 'Availability'];
        const rows = filteredEmployees.map(e => [
            e.id,
            e.employee_number,
            `"${e.full_name}"`,
            `"${e.job_title}"`,
            `"${e.department_name || '-'}"`,
            `"${e.branch_name || '-'}"`,
            e.email,
            e.mobile_number || '-',
            e.employment_status,
            e.is_host_enabled ? 'Yes' : 'No',
            e.availability_status || 'Available'
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `employee_directory_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Employee Directory CSV exported.');
    };
    // Full Profile Page View Mode
    if (viewingProfileId) {
        return (<motion.div key="managed-profile-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
        <EmployeeProfilePage employeeId={viewingProfileId} onBack={() => {
                setViewingProfileId(null);
                fetchEmployees(true);
            }}/>
      </motion.div>);
    }
    // Registration Wizard View Mode
    if (isFormOpen) {
        return (<EmployeeRegistrationWizard employee={selectedEmployee} existingEmployees={employees} onClose={() => { setIsFormOpen(false); setSelectedEmployee(null); }} onSave={handleSaveEmployee}/>);
    }
    return (<div className="space-y-6">
      {/* Toast Notification */}
      {toast && (<div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'} shadow-lg mb-0 font-semibold text-xs`}>
            {toast.message}
          </div>
        </div>)}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard" title="Back to Dashboard"/>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t('empMgmt.title', 'Employee Management')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Staff Operations
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {t('empMgmt.subtitle', 'Manage employee directories, office locations, emergency contacts, host permissions, visitor limits, and availability.')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setSelectedEmployee(null); setIsFormOpen(true); }} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-1.5 text-xs transition-all no-print">
            <Plus className="h-4 w-4"/> {t('empMgmt.addEmployee', 'Add Employee')}
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsImportOpen(true)} className="border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all no-print">
            <Upload className="h-3.5 w-3.5"/> {t('form.import', 'Import')}
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => fetchEmployees(true)} disabled={loading} className="border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all no-print">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`}/>
            {loading ? t('form.loading', 'Refreshing...') : t('form.refresh', 'Refresh')}
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExportCSV} className="border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all no-print">
            <Download className="h-3.5 w-3.5"/> {t('form.export', 'Export List')}
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={clearFilters} className="border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all no-print">
            <RotateCcw className="h-3.5 w-3.5"/> {t('form.reset', 'Reset Filters')}
          </motion.button>
        </div>
      </div>

      {/* Top 8 KPI Summary Cards Row */}
      <motion.div variants={kpiContainerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 no-print">
        <EmployeeKpiCard title="Total Employees" value={loading ? '...' : stats.totalEmployees} subtitle="Registered staff" icon={<Users className="w-5 h-5 text-blue-400"/>} theme="blue" onClick={clearFilters}/>
        <EmployeeKpiCard title="Active Employees" value={loading ? '...' : stats.activeEmployees} subtitle="Active employment" icon={<CheckCircle2 className="w-5 h-5 text-emerald-400"/>} theme="emerald" onClick={() => { setStatusFilter('Active'); setPage(1); }}/>
        <EmployeeKpiCard title="Inactive Employees" value={loading ? '...' : stats.inactiveEmployees} subtitle="Deactivated staff" icon={<UserX className="w-5 h-5 text-slate-400"/>} theme="slate" onClick={() => { setStatusFilter('Inactive'); setPage(1); }}/>
        <EmployeeKpiCard title="Available Hosts" value={loading ? '...' : stats.availableHosts} subtitle="Hosts ready for visitors" icon={<ShieldCheck className="w-5 h-5 text-indigo-400"/>} theme="indigo" onClick={() => { setActiveTab('hosts'); setPage(1); }}/>
        <EmployeeKpiCard title="On Leave" value={loading ? '...' : stats.employeesOnLeave} subtitle="Staff on leave" icon={<Clock className="w-5 h-5 text-amber-400"/>} theme="amber" onClick={() => { setStatusFilter('On Leave'); setPage(1); }}/>
        <EmployeeKpiCard title="New Onboarded" value={loading ? '...' : stats.newEmployees} subtitle="Joined this month" icon={<UserPlus className="w-5 h-5 text-purple-400"/>} theme="purple" onClick={() => { setSearchTerm(''); setDeptFilter(''); setPage(1); }}/>
        <EmployeeKpiCard title="Departments" value={loading ? '...' : stats.totalDepartments} subtitle="Unique departments" icon={<Briefcase className="w-5 h-5 text-teal-400"/>} theme="teal" onClick={() => { setActiveTab('directory'); setPage(1); }}/>
        <EmployeeKpiCard title="Branches" value={loading ? '...' : stats.totalBranches} subtitle="Branch locations" icon={<Building className="w-5 h-5 text-cyan-400"/>} theme="cyan" onClick={() => { setActiveTab('directory'); setPage(1); }}/>
      </motion.div>

      {/* Main Module Tabs Switcher */}
      <div className="flex gap-2 no-print flex-wrap bg-slate-900/90 border border-slate-800/80 p-1.5 rounded-2xl shadow-xl backdrop-blur-md">
        {[
            { key: 'directory', label: 'Employee Directory', icon: <Users className="h-4 w-4"/> },
            { key: 'hosts', label: 'Host Management', icon: <ShieldCheck className="h-4 w-4"/> },
            { key: 'analytics', label: 'Reports & Analytics', icon: <BarChart2 className="h-4 w-4"/> },
            { key: 'audit', label: 'Audit & Activity', icon: <ShieldAlert className="h-4 w-4"/> }
        ].map(tab => {
            const isActive = activeTab === tab.key;
            return (<motion.button key={tab.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setActiveTab(tab.key); setPage(1); }} className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
              {tab.icon} {tab.label}
            </motion.button>);
        })}
      </div>

      {/* TAB CONTENT 1: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && (<EmployeeAnalyticsView stats={stats} onRefresh={() => fetchEmployees(true)}/>)}

      {/* TAB CONTENT 2: AUDIT & ACTIVITY LOGS */}
      {activeTab === 'audit' && (<EmployeeAuditView />)}

      {/* TAB CONTENT 3: DIRECTORY & HOSTS DATA TABLE */}
      {(activeTab === 'directory' || activeTab === 'hosts') && (<div className="space-y-4">

          {/* Filter Bar */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md no-print">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-5 relative">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="text" placeholder="Search by ID, number, name, email, job title..." className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 outline-none transition-all" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}/>
              </div>

              <div className="md:col-span-3">
                <select className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl text-xs font-semibold text-slate-200 outline-none transition-all" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
                  <option value="">All Departments</option>
                  <option value="Executive Office">Executive Office</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl text-xs font-semibold text-slate-200 outline-none transition-all" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived Staff</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl text-xs font-semibold text-slate-200 outline-none transition-all" value={hostFilter} onChange={(e) => { setHostFilter(e.target.value); setPage(1); }}>
                  <option value="">All Host Statuses</option>
                  <option value="ENABLED">Host Enabled Only</option>
                  <option value="DISABLED">Host Disabled Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Directory Grid / Table */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {activeTab === 'hosts' ? (<tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">{t('table.employeeId', 'Employee ID')}</th>
                      <th className="py-3 px-4">{t('table.hostName', 'Host Name')}</th>
                      <th className="py-3 px-4">{t('table.department', 'Department')}</th>
                      <th className="py-3 px-4">{t('table.hostStatus', 'Host Status')}</th>
                      <th className="py-3 px-4">{t('table.dailyQuota', 'Daily Quota')}</th>
                      <th className="py-3 px-4">{t('table.concurrentCap', 'Concurrent Cap')}</th>
                      <th className="py-3 px-4">{t('table.defaultMeetingRoom', 'Default Meeting Room')}</th>
                      <th className="py-3 px-4">{t('table.approvalRole', 'Approval Role')}</th>
                      <th className="py-3 px-4 text-end">{t('table.actions', 'Host Quota Actions')}</th>
                    </tr>) : (<tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">{t('table.employeeId', 'Employee ID')}</th>
                      <th className="py-3 px-4">{t('table.name', 'Full Name')}</th>
                      <th className="py-3 px-4">{t('table.jobTitle', 'Job Title')}</th>
                      <th className="py-3 px-4">{t('table.department', 'Department')}</th>
                      <th className="py-3 px-4">{t('table.contact', 'Contact')}</th>
                      <th className="py-3 px-4">{t('table.employment', 'Employment')}</th>
                      <th className="py-3 px-4">{t('table.hostStatus', 'Host Status')}</th>
                      <th className="py-3 px-4">{t('table.availability', 'Availability')}</th>
                      <th className="py-3 px-4 text-end">{t('table.actions', 'Actions')}</th>
                    </tr>)}
                </thead>
                <tbody>
                  {loading ? (Array.from({ length: 5 }).map((_, i) => (<tr key={`skel-${i}`} className="border-b border-slate-800/60">
                        {Array.from({ length: 9 }).map((__, ci) => (<td key={ci} className="py-3.5 px-4">
                            <div className="rounded h-3 bg-slate-800 animate-pulse" style={{
                        width: `${55 + Math.random() * 40}%`,
                        opacity: 0.6 - i * 0.08
                    }}/>
                          </td>))}
                      </tr>))) : paginatedEmployees.length > 0 ? (paginatedEmployees.map(emp => (<tr key={emp.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-bold text-indigo-400">{emp.employee_number}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {emp.photo_url ? (<img src={resolvePhotoUrl(emp.photo_url)} alt={emp.full_name} className="h-8 w-8 rounded-full object-cover border border-indigo-500/30 shrink-0"/>) : (<div className="h-8 w-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 font-bold text-xs">
                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                              </div>)}
                            <div>
                              <div className="font-bold text-slate-200 text-xs">{emp.full_name}</div>
                              <div className="text-[10px] text-slate-400">{emp.email}</div>
                            </div>
                          </div>
                        </td>

                        {activeTab !== 'hosts' ? (<>
                            <td className="py-3 px-4 font-semibold text-slate-200 text-xs">{emp.job_title || 'Staff'}</td>
                            <td className="py-3 px-4 text-slate-300 text-xs font-semibold">{emp.department_name || 'Operations'}</td>
                            <td className="py-3 px-4 text-slate-300 font-mono text-xs">{emp.mobile_number || emp.office_phone || '-'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${Boolean(emp.archived_at)
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : emp.employment_status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                {Boolean(emp.archived_at) ? 'Archived' : emp.employment_status || 'Active'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${emp.is_host_enabled
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                {emp.is_host_enabled ? 'Host Enabled' : 'Host Disabled'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <select className="bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs font-semibold py-1 px-2 text-slate-200 outline-none" value={emp.availability_status || 'Available'} onChange={(e) => handleUpdateAvailability(emp.id, e.target.value)} style={{ minWidth: '110px' }}>
                                <option value="Available">Available</option>
                                <option value="In Meeting">In Meeting</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Busy">Busy</option>
                                <option value="Working From Home">WFH</option>
                                <option value="Out of Office">Out of Office</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-end">
                              <div className="flex items-center justify-end gap-1.5">
                                {Boolean(emp.archived_at) || statusFilter === 'Archived' ? (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleRestore(emp.id)} className="border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all" title="Restore Employee from Archive">
                                    <RotateCcw className="h-3.5 w-3.5"/> Restore
                                  </motion.button>) : (<>
                                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => setViewingProfileId(emp.id)} className="p-1.5 rounded-lg border border-slate-700/60 hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-400 hover:text-blue-300 transition-all" title="Open Full Profile Page">
                                      <Eye className="h-3.5 w-3.5"/>
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => { setSelectedEmployee(emp); setIsFormOpen(true); }} className="p-1.5 rounded-lg border border-slate-700/60 hover:border-slate-500/50 hover:bg-slate-700/30 text-slate-400 hover:text-slate-200 transition-all" title="Edit Employee">
                                      <Edit3 className="h-3.5 w-3.5"/>
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => { setSelectedEmployee(emp); setIsHostConfigOpen(true); }} className="p-1.5 rounded-lg border border-slate-700/60 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-300 transition-all" title="Host Settings">
                                      <ShieldCheck className="h-3.5 w-3.5"/>
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => handleToggleStatus(emp.id)} className={`p-1.5 rounded-lg border transition-all ${emp.employment_status === 'Active'
                            ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                            : 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'}`} title={emp.employment_status === 'Active' ? 'Deactivate' : 'Activate'}>
                                      <Power className="h-3.5 w-3.5"/>
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => handleResendRegistration(emp.id)} className="p-1.5 rounded-lg border border-slate-700/60 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 transition-all" title="Resend Registration Credentials">
                                      <Mail className="h-3.5 w-3.5"/>
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => handleArchive(emp.id)} className="p-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all" title="Archive Employee">
                                      <Archive className="h-3.5 w-3.5"/>
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => setDeleteTargetEmployee(emp)} className="p-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all" title="Delete Employee">
                                      <Trash2 className="h-3.5 w-3.5"/>
                                    </motion.button>
                                  </>)}
                              </div>
                            </td>
                          </>) : (<>
                            <td className="py-3 px-4 text-slate-300 text-xs font-semibold">{emp.department_name || 'Operations'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${emp.is_host_enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                {emp.is_host_enabled ? 'ENABLED' : 'DISABLED'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-white text-xs">{emp.max_visitors_per_day || 10} visitors/day</td>
                            <td className="py-3 px-4 font-bold text-white text-xs">{emp.max_concurrent_visitors || 3} concurrent</td>
                            <td className="py-3 px-4 font-semibold text-indigo-400 text-xs">{emp.default_room_name || 'Conference Room B'}</td>
                            <td className="py-3 px-4 text-slate-300 text-xs font-semibold">{emp.default_approval_role || 'Host'}</td>
                            <td className="py-3 px-4 text-end">
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setSelectedEmployee(emp); setIsHostConfigOpen(true); }} className="border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition-all">
                                <ShieldCheck className="h-3.5 w-3.5"/> Configure Quotas
                              </motion.button>
                            </td>
                          </>)}
                      </tr>))) : (<tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400 text-xs font-bold">
                        {statusFilter === 'Archived' ? 'No archived employee records found.' : 'No employee records found matching search criteria.'}
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-3 no-print">
            <div className="text-xs font-semibold text-slate-400">
              Showing <span className="text-white font-bold">{filteredEmployees.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="text-white font-bold">{Math.min(page * limit, filteredEmployees.length)}</span> of <span className="text-white font-bold">{filteredEmployees.length}</span> employees
            </div>

            <div className="flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800/80 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                Previous
              </motion.button>
              <span className="text-xs font-bold text-slate-400 px-2 font-mono">Page {page} of {totalPages}</span>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800/80 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                Next
              </motion.button>
            </div>
          </div>
        </div>)}

      {/* ── STATUS CHANGE / DEACTIVATION REASON MODAL CARD ── */}
      {statusModalEmployee && (<div className="modal d-block bg-black/80 backdrop-blur-md" tabIndex={-1} style={{ zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-slate-900 border border-amber-500/40 text-white rounded-3xl p-6 shadow-2xl overflow-hidden relative" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <button onClick={() => setStatusModalEmployee(null)} className="btn-close btn-close-white absolute top-4 right-4" style={{ filter: 'invert(1) grayscale(100%) brightness(200%)' }}/>

              <div className="d-flex align-items-center gap-3 mb-4">
                <div className={`h-12 w-12 rounded-2xl ${statusModalEmployee.employment_status === 'Active' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'} d-flex align-items-center justify-center shrink-0`}>
                  <Power size={24}/>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white mb-0" style={{ color: '#ffffff' }}>
                    {statusModalEmployee.employment_status === 'Active' ? 'Deactivate Employee Record?' : 'Reactivate Employee Record?'}
                  </h3>
                  <span className={`text-xs font-semibold ${statusModalEmployee.employment_status === 'Active' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {statusModalEmployee.employment_status === 'Active' ? 'Account status change & host access revocation' : 'Re-enable account & host privileges'}
                  </span>
                </div>
              </div>

              {/* Employee Summary Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 mb-4 text-xs" style={{ backgroundColor: '#090d16', color: '#e2e8f0' }}>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Employee ID:</span>
                  <span className="font-mono text-indigo-400 font-bold">{statusModalEmployee.employee_number}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-white" style={{ color: '#ffffff' }}>{statusModalEmployee.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Current Status:</span>
                  <span className={`badge ${statusModalEmployee.employment_status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                    {statusModalEmployee.employment_status || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-300">{statusModalEmployee.department_name || 'Operations'}</span>
                </div>
              </div>

              {/* Deactivation Reason Form (Shown when deactivating) */}
              {statusModalEmployee.employment_status === 'Active' ? (<div className="space-y-3 mb-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 block">
                      Deactivation Reason *
                    </label>
                    <select className="form-select text-xs font-semibold" value={deactivationReason} onChange={(e) => setDeactivationReason(e.target.value)} style={{ backgroundColor: '#090d16', color: '#f8fafc', borderColor: '#334155' }}>
                      <option value="Resignation / Voluntary Departure">Resignation / Voluntary Departure</option>
                      <option value="Contract Expiration / End of Term">Contract Expiration / End of Term</option>
                      <option value="Performance & Policy Review">Performance & Policy Review</option>
                      <option value="Temporary Suspension / Investigation">Temporary Suspension / Investigation</option>
                      <option value="Extended Medical Leave">Extended Medical Leave</option>
                      <option value="Position Reduction / Layoff">Position Reduction / Layoff</option>
                      <option value="Other / Administrative Action">Other / Administrative Action</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 block">
                      Additional Notes / Details (Optional)
                    </label>
                    <textarea rows={2} className="form-control text-xs font-semibold" placeholder="Enter optional comments or audit notes..." value={deactivationNotes} onChange={(e) => setDeactivationNotes(e.target.value)} style={{ backgroundColor: '#090d16', color: '#f8fafc', borderColor: '#334155' }}/>
                  </div>
                </div>) : (<p className="text-xs text-slate-300 mb-4 leading-relaxed font-medium">
                  Reactivating this employee will restore their system permissions and enable host authorization for visitor check-ins.
                </p>)}

              <div className="d-flex justify-content-end gap-2.5">
                <button type="button" onClick={() => setStatusModalEmployee(null)} className="btn btn-sm text-xs font-bold px-4 py-2 rounded-xl text-slate-200 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={async () => {
                const targetEmp = statusModalEmployee;
                const isDeactivating = targetEmp.employment_status === 'Active';
                const newStatus = isDeactivating ? 'Inactive' : 'Active';
                const reasonText = isDeactivating ? `${deactivationReason}${deactivationNotes ? ` - ${deactivationNotes}` : ''}` : 'Reactivated';
                setStatusModalEmployee(null);
                try {
                    await employeeManagementApi.setStatus(targetEmp.id, newStatus, reasonText);
                    const updatedEmp = { ...targetEmp, employment_status: newStatus, is_host_enabled: newStatus === 'Active' };
                    setEmployees(prev => prev.map(e => (e.id === targetEmp.id ? updatedEmp : e)));
                    setStatusResponseCard({ employee: updatedEmp, oldStatus: targetEmp.employment_status, newStatus, reason: reasonText });
                    fetchEmployees();
                }
                catch (_) {
                    const updatedEmp = { ...targetEmp, employment_status: newStatus, is_host_enabled: newStatus === 'Active' };
                    setEmployees(prev => prev.map(e => (e.id === targetEmp.id ? updatedEmp : e)));
                    setStatusResponseCard({ employee: updatedEmp, oldStatus: targetEmp.employment_status, newStatus, reason: reasonText });
                }
            }} className={`btn btn-sm text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg ${statusModalEmployee.employment_status === 'Active' ? 'btn-warning bg-amber-600 hover:bg-amber-500 text-white' : 'btn-success bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                  <Power size={14}/> {statusModalEmployee.employment_status === 'Active' ? 'Confirm Deactivation' : 'Confirm Activation'}
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* ── STATUS CHANGE RESPONSE CARD MODAL ── */}
      {statusResponseCard && (<div className="modal d-block bg-black/80 backdrop-blur-md" tabIndex={-1} style={{ zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-slate-900 border border-slate-700 text-white rounded-3xl p-6 shadow-2xl overflow-hidden text-center relative" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <button onClick={() => setStatusResponseCard(null)} className="btn-close btn-close-white absolute top-4 right-4" style={{ filter: 'invert(1) grayscale(100%) brightness(200%)' }}/>

              <div className={`h-16 w-16 ${statusResponseCard.newStatus === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'} border rounded-full d-inline-flex items-center justify-center mb-3 shadow-lg`}>
                {statusResponseCard.newStatus === 'Active' ? <CheckCircle2 size={36}/> : <Power size={36}/>}
              </div>

              <h2 className="text-xl font-black text-white mb-1" style={{ color: '#ffffff' }}>
                {statusResponseCard.newStatus === 'Active' ? 'Employee Activated' : 'Employee Deactivated'}
              </h2>
              <p className="text-xs text-slate-300 mb-4 font-medium">
                {statusResponseCard.newStatus === 'Active'
                ? 'Employee account is active and host permissions are enabled.'
                : 'Employee account has been deactivated and host permissions revoked.'}
              </p>

              {/* Status Summary Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-start text-xs space-y-2 mb-4" style={{ backgroundColor: '#090d16', color: '#e2e8f0' }}>
                <div className="d-flex justify-content-between items-center py-1 border-bottom border-slate-800">
                  <span className="text-slate-400">Employee ID:</span>
                  <span className="font-mono text-indigo-400 font-bold">{statusResponseCard.employee.employee_number}</span>
                </div>
                <div className="d-flex justify-content-between items-center py-1 border-bottom border-slate-800">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-white" style={{ color: '#ffffff' }}>{statusResponseCard.employee.full_name}</span>
                </div>
                <div className="d-flex justify-content-between items-center py-1 border-bottom border-slate-800">
                  <span className="text-slate-400">Updated Status:</span>
                  <span className={`badge ${statusResponseCard.newStatus === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'} text-xs`}>
                    {statusResponseCard.newStatus}
                  </span>
                </div>
                {statusResponseCard.newStatus !== 'Active' && statusResponseCard.reason && (<div className="d-flex justify-content-between items-center py-1 border-bottom border-slate-800">
                    <span className="text-slate-400">Deactivation Reason:</span>
                    <span className="font-semibold text-amber-300">{statusResponseCard.reason}</span>
                  </div>)}
                <div className="d-flex justify-content-between items-center py-1">
                  <span className="text-slate-400">Updated Timestamp:</span>
                  <span className="font-mono text-slate-300">{new Date().toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons with Direct Toggle Action */}
              <div className="d-flex justify-content-center gap-2.5">
                <button type="button" onClick={() => setStatusResponseCard(null)} className="btn btn-sm text-xs font-bold px-4 py-2 rounded-xl text-slate-200 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">
                  Close
                </button>
                {statusResponseCard.newStatus !== 'Active' ? (<button type="button" onClick={async () => {
                    const empId = statusResponseCard.employee.id;
                    setStatusResponseCard(null);
                    try {
                        await employeeManagementApi.setStatus(empId, 'Active', 'Reactivated from response card');
                        setEmployees(prev => prev.map(e => (e.id === empId ? { ...e, employment_status: 'Active', is_host_enabled: true } : e)));
                        showToast(`Employee '${statusResponseCard.employee.full_name}' activated successfully.`);
                        fetchEmployees();
                    }
                    catch (_) {
                        setEmployees(prev => prev.map(e => (e.id === empId ? { ...e, employment_status: 'Active', is_host_enabled: true } : e)));
                        showToast(`Employee activated.`);
                    }
                }} className="btn btn-emerald btn-sm text-xs font-bold px-4 py-2 rounded-xl d-flex align-items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg">
                    <Power size={14}/> Activate Employee Now
                  </button>) : (<button type="button" onClick={() => {
                    const empId = statusResponseCard.employee.id;
                    setStatusResponseCard(null);
                    setViewingProfileId(empId);
                }} className="btn btn-primary btn-sm text-xs font-bold px-4 py-2 rounded-xl d-flex align-items-center gap-1.5">
                    <Eye size={14}/> View Full Profile
                  </button>)}
              </div>
            </div>
          </div>
        </div>)}

      {/* ── CARD-STYLE DELETE CONFIRMATION MODAL ── */}
      {deleteTargetEmployee && (<div className="modal d-block bg-black/80 backdrop-blur-md" tabIndex={-1} style={{ zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-slate-900 border border-rose-500/40 text-white rounded-3xl p-6 shadow-2xl overflow-hidden relative" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <button onClick={() => setDeleteTargetEmployee(null)} className="btn-close btn-close-white absolute top-4 right-4" style={{ filter: 'invert(1) grayscale(100%) brightness(200%)' }}/>

              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 d-flex align-items-center justify-center shrink-0">
                  <Trash2 size={24}/>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white mb-0" style={{ color: '#ffffff' }}>Delete Employee Record?</h3>
                  <span className="text-xs text-rose-400 font-semibold">Action requires confirmation</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 mb-4 text-xs" style={{ backgroundColor: '#090d16', color: '#e2e8f0' }}>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Employee Number:</span>
                  <span className="font-mono text-indigo-400 font-bold">{deleteTargetEmployee.employee_number}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-white" style={{ color: '#ffffff' }}>{deleteTargetEmployee.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Job Title:</span>
                  <span className="font-semibold text-white" style={{ color: '#ffffff' }}>{deleteTargetEmployee.job_title || 'Staff'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-300">{deleteTargetEmployee.department_name || 'Operations'}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-4 leading-relaxed font-medium">
                Are you sure you want to soft delete this employee record? Deleting will revoke host permissions, deactivate portal access, and move their profile to system archives.
              </p>

              <div className="d-flex justify-content-end gap-2.5">
                <button type="button" onClick={() => setDeleteTargetEmployee(null)} className="btn btn-sm text-xs font-bold px-4 py-2 rounded-xl text-slate-200 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={async () => {
                const emp = deleteTargetEmployee;
                if (!emp)
                    return;
                const empId = emp.id ?? emp.employee_id ?? emp.employee_number;
                const empNumber = emp.employee_number;
                setDeleteTargetEmployee(null);
                // Optimistically remove employee immediately from table
                setEmployees(prev => prev.filter(e => e.id !== emp.id && e.employee_number !== empNumber));
                // Optimistically update KPI dashboard counts immediately
                setDashboardStats((prev) => {
                    if (!prev)
                        return null;
                    const wasActive = emp.employment_status === 'Active' || emp.employment_status === 'full_time';
                    const wasAvailableHost = emp.is_host_enabled && emp.availability_status === 'Available';
                    const wasOnLeave = emp.availability_status === 'On Leave';
                    return {
                        ...prev,
                        totalEmployees: Math.max(0, (Number(prev.totalEmployees) || 1) - 1),
                        activeEmployees: wasActive ? Math.max(0, (Number(prev.activeEmployees) || 1) - 1) : prev.activeEmployees,
                        availableHosts: wasAvailableHost ? Math.max(0, (Number(prev.availableHosts) || 1) - 1) : prev.availableHosts,
                        employeesOnLeave: wasOnLeave ? Math.max(0, (Number(prev.employeesOnLeave) || 1) - 1) : prev.employeesOnLeave
                    };
                });
                try {
                    await employeeManagementApi.delete(empId);
                    showToast(`Employee '${emp.full_name}' deleted successfully.`);
                }
                catch (err) {
                    console.error('[DELETE] Failed to delete employee:', err);
                    showToast(err.response?.data?.message || 'Failed to delete employee. Please try again.', 'error');
                    await fetchEmployees(false);
                    return;
                }
                await fetchEmployees(false);
            }} className="btn btn-danger btn-sm text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg bg-rose-600 hover:bg-rose-500 text-white">
                  <Trash2 size={14}/> Confirm Soft Delete
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* REGISTRATION RESPONSE SUCCESS CARD MODAL */}
      {registeredSuccessEmployee && (<div className="modal d-block bg-black/80 backdrop-blur-md" tabIndex={-1} style={{ zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-slate-900 border border-emerald-500/40 text-white rounded-3xl p-6 shadow-2xl overflow-hidden text-center relative" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <button onClick={() => setRegisteredSuccessEmployee(null)} className="btn-close btn-close-white absolute top-4 right-4" style={{ filter: 'invert(1) grayscale(100%) brightness(200%)' }}/>

              <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full d-inline-flex items-center justify-center mb-3 shadow-lg">
                <CheckCircle2 size={36}/>
              </div>

              <h2 className="text-xl font-black text-white mb-1" style={{ color: '#ffffff' }}>Registration Complete!</h2>
              <p className="text-xs text-slate-300 mb-4 font-medium">
                Employee record has been successfully registered and active in MySQL database.
              </p>

              {/* Account Credentials Status */}
              {registrationInfo && (<div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/20 text-start text-xs space-y-2 mb-4" style={{ backgroundColor: '#090d16', color: '#e2e8f0' }}>
                  <div className="d-flex justify-content-between items-center py-1 border-bottom border-slate-800">
                    <span className="text-slate-400">Registered Email:</span>
                    <span className="font-semibold text-white break-all text-start" style={{ color: '#ffffff' }}>{registrationInfo.email || '-'}</span>
                  </div>
                  {registrationInfo.userCode && (
                    <div className="d-flex justify-content-between items-center py-1 border-bottom border-slate-800">
                      <span className="text-slate-400">User ID / Code:</span>
                      <span className="font-mono text-indigo-400 font-bold">{registrationInfo.userCode}</span>
                    </div>
                  )}
                  {registrationInfo.temporaryPassword && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 my-2">
                      <div className="d-flex justify-content-between items-center">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                          Initial Login Password
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(registrationInfo.temporaryPassword);
                            showToast('Temporary password copied to clipboard!');
                          }}
                          className="btn btn-sm btn-outline-warning text-[11px] font-bold py-0.5 px-2.5 rounded-lg"
                        >
                          Copy Password
                        </button>
                      </div>
                      <div className="font-mono text-sm text-white font-black tracking-wider text-center bg-slate-900 py-1.5 rounded-lg border border-amber-500/20 select-all">
                        {registrationInfo.temporaryPassword}
                      </div>
                    </div>
                  )}
                  <div className="d-flex justify-content-between items-center py-1">
                    <span className="text-slate-400">Registration Email:</span>
                    <span className={`badge text-xs ${registrationInfo.emailStatus === 'SENT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                      {registrationInfo.emailStatus === 'SENT' ? 'Delivered to Inbox' : 'Dispatched / Available On-Screen'}
                    </span>
                  </div>
                  {registrationInfo.emailStatus !== 'SENT' && (<div className="d-flex justify-content-between items-center pt-1 border-top border-slate-800">
                      <span className="text-slate-400">Resend Credentials:</span>
                      <button type="button" disabled={resending} onClick={() => handleResendRegistration(registeredSuccessEmployee.id)} className="btn btn-sm btn-outline-emerald text-xs font-bold px-3 py-1 d-flex align-items-center gap-1.5">
                        <Mail size={13}/>
                        {resending ? 'Resending...' : 'Resend Email'}
                      </button>
                    </div>)}
                </div>)}

              {/* Employee Summary Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-start text-xs space-y-2 mb-4" style={{ backgroundColor: '#090d16', color: '#e2e8f0' }}>
                <div className="d-flex justify-content-between items-center py-1 border-bottom border-slate-800">
                  <span className="text-slate-400">Employee ID:</span>
                  <span className="font-mono text-indigo-400 font-bold">{registeredSuccessEmployee.employee_number}</span>
                </div>
                <div className="d-flex justify-content-between items-center py-1 border-bottom border-slate-800">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-white" style={{ color: '#ffffff' }}>{registeredSuccessEmployee.full_name}</span>
                </div>
                <div className="d-flex justify-content-between items-center py-1 border-bottom border-slate-800">
                  <span className="text-slate-400">Job Title:</span>
                  <span className="font-semibold text-white" style={{ color: '#ffffff' }}>{registeredSuccessEmployee.job_title || 'Staff'}</span>
                </div>
                <div className="d-flex justify-content-between items-center py-1 border-bottom border-slate-800">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-300">{registeredSuccessEmployee.department_name || 'Operations'}</span>
                </div>
                <div className="d-flex justify-content-between items-center py-1">
                  <span className="text-slate-400">Employment Status:</span>
                  <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                    {registeredSuccessEmployee.employment_status || 'Active'}
                  </span>
                </div>
              </div>

              {/* Security QR Pass Preview */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 d-inline-flex flex-column align-items-center mb-4" style={{ backgroundColor: '#090d16' }}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Security QR Badge Pass</span>
                <QRCodeDisplay value={`EMPLOYEE:${registeredSuccessEmployee.employee_number}:${registeredSuccessEmployee.full_name}`} size={130}/>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-center gap-2">
                <button type="button" onClick={() => setRegisteredSuccessEmployee(null)} className="btn btn-sm text-xs font-bold px-4 py-2 rounded-xl text-slate-200 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">
                  Close
                </button>
                <button type="button" onClick={() => {
                const empId = registeredSuccessEmployee.id;
                setRegisteredSuccessEmployee(null);
                setViewingProfileId(empId);
            }} className="btn btn-primary btn-sm text-xs font-bold px-4 py-2 rounded-xl d-flex align-items-center gap-1.5">
                  <Eye size={14}/> View Full Profile
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* Host Settings Modal */}
      {isHostConfigOpen && selectedEmployee && (<HostConfigModal employee={selectedEmployee} onClose={() => { setIsHostConfigOpen(false); setSelectedEmployee(null); }} onSave={handleSaveHostConfig}/>)}

      {/* Import Modal */}
      {isImportOpen && (<EmployeeImportModal onClose={() => setIsImportOpen(false)} onImportSuccess={() => { setIsImportOpen(false); fetchEmployees(true); }}/>)}
    </div>);
}
