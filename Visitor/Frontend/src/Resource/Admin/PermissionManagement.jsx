import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Key, Shield, ShieldAlert, ShieldCheck, Lock, Unlock, Users, CheckCircle2, XCircle, Plus, Search, Download, Upload, RefreshCw, FileText, Layers, AlertTriangle, Copy, Sliders, Database, Eye, Activity, Sparkles, Zap, ArrowRight, X, FileSpreadsheet, UserCheck, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../services/api';
import FieldError from '../../components/common/FieldError';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { useLanguage } from '../../contexts/LanguageContext';
// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD SIGNATURE COLOR PALETTE FOR PERMISSION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
const PERM_THEME_STYLES = {
    indigo: {
        barColor: '#6366f1',
        hoverBarColor: '#818cf8',
        darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
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
    cyan: {
        barColor: '#06b6d4',
        hoverBarColor: '#22d3ee',
        darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
    },
    purple: {
        barColor: '#a855f7',
        hoverBarColor: '#c084fc',
        darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
    },
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
    },
    orange: {
        barColor: '#f97316',
        hoverBarColor: '#fb923c',
        darkHoverBg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.35) 0%, rgba(124, 45, 18, 0.25) 55%, #0a0f1d 100%)',
    },
    rose: {
        barColor: '#f43f5e',
        hoverBarColor: '#fb7185',
        darkHoverBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.35) 0%, rgba(136, 19, 55, 0.25) 55%, #0a0f1d 100%)',
    },
    teal: {
        barColor: '#14b8a6',
        hoverBarColor: '#2dd4bf',
        darkHoverBg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.35) 0%, rgba(19, 78, 74, 0.25) 55%, #0a0f1d 100%)',
    },
    fuchsia: {
        barColor: '#d946ef',
        hoverBarColor: '#e879f9',
        darkHoverBg: 'linear-gradient(135deg, rgba(217, 70, 239, 0.35) 0%, rgba(112, 26, 117, 0.25) 55%, #0a0f1d 100%)',
    },
};
function AdminPermissionKpiCard({ title, value, icon, theme, onClick }) {
    const [hovered, setHovered] = useState(false);
    const styles = PERM_THEME_STYLES[theme] || PERM_THEME_STYLES.indigo;
    return (<motion.div whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className="border rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 min-h-[120px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-slate-900/90 border-slate-800 shadow-lg shadow-black/40">
      <div style={{
            background: styles.darkHoverBg,
            opacity: hovered ? 1 : 0,
        }} className="absolute inset-0 transition-opacity duration-300 pointer-events-none"/>

      <div style={{
            backgroundColor: hovered ? styles.hoverBarColor : styles.barColor,
            boxShadow: hovered ? `0 0 20px ${styles.barColor}` : `0 0 8px ${styles.barColor}`,
        }} className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"/>

      <div className="flex items-start justify-between relative z-10 gap-2">
        <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
          {title}
        </span>
        <div className="w-8 h-10 sm:w-9 sm:h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-all shadow-sm shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 relative z-10">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">{value}</h2>
        </div>
      </div>
    </motion.div>);
}
export default function PermissionManagement({ initialSubView = 'dashboard' }) {
    const { t, language } = useLanguage();
    const isAm = language === 'am';
    // Navigation Sub-View State
    const [activeSubView, setActiveSubView] = useState(initialSubView);
    const [alert, setAlert] = useState(null);
    // Statistics State
    const [stats, setStats] = useState({
        totalPermissions: 0,
        activePermissions: 0,
        inactivePermissions: 0,
        systemPermissions: 0,
        customPermissions: 0,
        assignedPermissions: 0,
        unusedPermissions: 0,
        highRiskPermissions: 0,
        criticalPermissions: 0,
        permissionGroups: 0,
        modules: 0,
        resources: 0,
        actions: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);
    // All Permissions Table State
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModule, setSelectedModule] = useState('ALL');
    const [selectedRisk, setSelectedRisk] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [selectedScope, setSelectedScope] = useState('ALL');
    const [usageFilter, setUsageFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [sortBy, setSortBy] = useState('permission_name');
    const [sortOrder, setSortOrder] = useState('ASC');
    // Inspector & Details Modal State
    const [selectedPermissionId, setSelectedPermissionId] = useState(null);
    const [permissionDetails, setPermissionDetails] = useState(null);
    const [detailsTab, setDetailsTab] = useState('overview');
    const [detailsLoading, setDetailsLoading] = useState(false);
    // Matrix State
    const [matrixData, setMatrixData] = useState({ roles: [], modules: [], assignments: [] });
    const [matrixAssignments, setMatrixAssignments] = useState(new Set());
    const [matrixLoading, setMatrixLoading] = useState(false);
    // Wizard / Create Form State
    const [wizardStep, setWizardStep] = useState(1);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [permErrors, setPermErrors] = useState({});
    const [createForm, setCreateForm] = useState({
        permission_code: '',
        permission_name: '',
        module: 'VISITOR',
        resource: 'VISITOR_RECORD',
        action: 'VIEW',
        scope_type: 'ORGANIZATION',
        permission_type: 'CUSTOM',
        risk_level: 'LOW',
        is_sensitive: false,
        requires_approval: false,
        requires_audit: true,
        description: ''
    });
    // Real System Roles & Toggle Matrix State
    const [rolesList, setRolesList] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [roleSearchQuery, setRoleSearchQuery] = useState('');
    const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);
    const [roleAssignedPermIds, setRoleAssignedPermIds] = useState([]);
    const [rolePermsLoading, setRolePermsLoading] = useState(false);
    const [rolePermSearch, setRolePermSearch] = useState('');
    const [allSystemPermissions, setAllSystemPermissions] = useState([]);
    // Simulator Test State
    const [simUserId, setSimUserId] = useState('1');
    const [simPermissionCode, setSimPermissionCode] = useState('VISITOR.VISITOR.CHECK_IN');
    const [simResult, setSimResult] = useState(null);
    // Import State
    const [importText, setImportText] = useState('');
    const [importing, setImporting] = useState(false);
    // ── Helper Error Extractor ────────────────────────────────────────────────
    const extractErrorMsg = (err, fallback = 'Operation failed') => {
        if (!err)
            return fallback;
        return err.response?.data?.message || err.message || fallback;
    };
    // ── Fetch Real Roles ──────────────────────────────────────────────────────
    const fetchRoles = useCallback(async () => {
        setRolesLoading(true);
        try {
            const res = await api.get('/roles');
            if (res.data?.data) {
                setRolesList(res.data.data);
            }
        }
        catch (err) {
            console.error('Failed to fetch roles:', err);
        }
        finally {
            setRolesLoading(false);
        }
    }, []);
    const openRolePermissionsModal = async (role) => {
        setSelectedRoleForPermissions(role);
        setRolePermsLoading(true);
        setRolePermSearch('');
        try {
            const [permRes, allRes] = await Promise.all([
                api.get(`/roles/${role.id}/permissions`),
                api.get('/permissions?limit=500')
            ]);
            const assignedList = permRes.data?.data || [];
            const assignedIds = assignedList.map((p) => p.id);
            setRoleAssignedPermIds(assignedIds);
            if (allRes.data?.data) {
                setAllSystemPermissions(allRes.data.data);
            }
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Failed to fetch role permissions') });
        }
        finally {
            setRolePermsLoading(false);
        }
    };
    const handleTogglePermissionForRole = async (permissionId) => {
        if (!selectedRoleForPermissions)
            return;
        const isCurrentlyAssigned = roleAssignedPermIds.includes(permissionId);
        const newAssignedIds = isCurrentlyAssigned
            ? roleAssignedPermIds.filter(id => id !== permissionId)
            : [...roleAssignedPermIds, permissionId];
        setRoleAssignedPermIds(newAssignedIds);
        try {
            await api.put(`/roles/${selectedRoleForPermissions.id}/permissions`, {
                permissionIds: newAssignedIds
            });
            setAlert({
                type: 'success',
                message: `Permission ${isCurrentlyAssigned ? 'revoked from' : 'assigned to'} role '${selectedRoleForPermissions.role_name}'`
            });
            fetchRoles();
            fetchStats();
        }
        catch (err) {
            setRoleAssignedPermIds(roleAssignedPermIds);
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Failed to update role permission') });
        }
    };
    const handleToggleAllInModule = async (moduleName, enable) => {
        if (!selectedRoleForPermissions)
            return;
        const modulePermIds = allSystemPermissions
            .filter((p) => p.module === moduleName)
            .map((p) => p.id);
        let newAssignedIds;
        if (enable) {
            newAssignedIds = Array.from(new Set([...roleAssignedPermIds, ...modulePermIds]));
        }
        else {
            newAssignedIds = roleAssignedPermIds.filter(id => !modulePermIds.includes(id));
        }
        setRoleAssignedPermIds(newAssignedIds);
        try {
            await api.put(`/roles/${selectedRoleForPermissions.id}/permissions`, {
                permissionIds: newAssignedIds
            });
            setAlert({
                type: 'success',
                message: `${enable ? 'Assigned' : 'Revoked'} all ${moduleName} permissions for '${selectedRoleForPermissions.role_name}'`
            });
            fetchRoles();
            fetchStats();
        }
        catch (err) {
            setRoleAssignedPermIds(roleAssignedPermIds);
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Failed to update module permissions') });
        }
    };
    // ── Load Real Statistics ──────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await api.get('/permissions/statistics');
            if (res.data?.data) {
                setStats(res.data.data);
            }
        }
        catch (err) {
            console.error('Failed to load stats:', err);
        }
        finally {
            setStatsLoading(false);
        }
    }, []);
    // ── Fetch Permissions Data Table ──────────────────────────────────────────
    const fetchPermissions = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: pageSize,
                search: searchQuery,
                module: selectedModule,
                risk_level: selectedRisk,
                status: selectedStatus,
                scope_type: selectedScope,
                usage: usageFilter,
                sortBy,
                sortOrder
            };
            const res = await api.get('/permissions', { params });
            if (res.data?.data) {
                setPermissions(res.data.data);
                if (res.data.pagination) {
                    setTotalCount(res.data.pagination.total || 0);
                    setTotalPages(res.data.pagination.totalPages || 1);
                }
            }
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Failed to fetch permissions list') });
        }
        finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchQuery, selectedModule, selectedRisk, selectedStatus, selectedScope, usageFilter, sortBy, sortOrder]);
    // ── Fetch Permission Details ──────────────────────────────────────────────
    const fetchPermissionDetails = async (id) => {
        setSelectedPermissionId(id);
        setDetailsLoading(true);
        try {
            const res = await api.get(`/permissions/${id}`);
            if (res.data?.data) {
                setPermissionDetails(res.data.data);
            }
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Failed to load permission details') });
        }
        finally {
            setDetailsLoading(false);
        }
    };
    // ── Fetch Permission Matrix ───────────────────────────────────────────────
    const fetchMatrix = useCallback(async () => {
        setMatrixLoading(true);
        try {
            const res = await api.get('/permissions/matrix');
            if (res.data?.data) {
                setMatrixData(res.data.data);
                const setMap = new Set();
                (res.data.data.assignments || []).forEach((a) => {
                    setMap.add(`${a.role_id}_${a.permission_id}`);
                });
                setMatrixAssignments(setMap);
            }
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Failed to fetch permission matrix') });
        }
        finally {
            setMatrixLoading(false);
        }
    }, []);
    useEffect(() => {
        if (initialSubView) {
            setActiveSubView(initialSubView);
            setSelectedPermissionId(null);
        }
    }, [initialSubView]);
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);
    useEffect(() => {
        if (activeSubView === 'permissions_list' || activeSubView === 'dashboard' || activeSubView === 'risk_analysis' || activeSubView === 'import_export') {
            fetchPermissions();
        }
    }, [activeSubView, fetchPermissions]);
    useEffect(() => {
        if (activeSubView === 'matrix') {
            fetchMatrix();
        }
    }, [activeSubView, fetchMatrix]);
    useEffect(() => {
        if (activeSubView === 'groups') {
            fetchRoles();
        }
    }, [activeSubView, fetchRoles]);
    // ── Auto Code Generator for Step 1 Wizard ──────────────────────────────────
    const handleAutoCodeGenerate = (mod, res, act) => {
        const cleanMod = (mod || 'VISITOR').toUpperCase().replace(/[^A_Z0-9]/g, '_');
        const cleanRes = (res || cleanMod).toUpperCase().replace(/[^A_Z0-9]/g, '_');
        const cleanAct = (act || 'VIEW').toUpperCase().replace(/[^A_Z0-9]/g, '_');
        return `${cleanMod}.${cleanRes}.${cleanAct}`;
    };
    // ── Toggle Matrix Cell Assignment ─────────────────────────────────────────
    const toggleMatrixCell = (roleId, permId) => {
        const key = `${roleId}_${permId}`;
        setMatrixAssignments(prev => {
            const next = new Set(prev);
            if (next.has(key))
                next.delete(key);
            else
                next.add(key);
            return next;
        });
    };
    // ── Save Matrix Changes ────────────────────────────────────────────────────
    const handleSaveMatrix = async () => {
        setFormSubmitting(true);
        try {
            const assignmentsList = [];
            matrixAssignments.forEach(key => {
                const [rId, pId] = key.split('_');
                assignmentsList.push({ role_id: parseInt(rId, 10), permission_id: parseInt(pId, 10) });
            });
            await api.post('/permissions/matrix', { assignments: assignmentsList });
            setAlert({ type: 'success', message: 'Permission matrix updated and RBAC cache cleared.' });
            fetchMatrix();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Failed to save matrix assignments') });
        }
        finally {
            setFormSubmitting(false);
        }
    };
    // ── Submit Create Permission Form ──────────────────────────────────────────
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        const nameErr = !createForm.permission_name?.trim() ? 'Permission Name is required.' : null;
        const resErr = !createForm.resource?.trim() ? 'Resource Name is required.' : null;
        if (nameErr || resErr) {
            setPermErrors({
                permission_name: nameErr,
                resource: resErr,
            });
            setTimeout(() => {
                const invalidElem = document.querySelector('[data-invalid="true"], [aria-invalid="true"]');
                if (invalidElem) {
                    invalidElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (typeof invalidElem.focus === 'function')
                        invalidElem.focus();
                }
            }, 50);
            return;
        }
        setFormSubmitting(true);
        try {
            const payload = {
                ...createForm,
                permission_code: createForm.permission_code || handleAutoCodeGenerate(createForm.module, createForm.resource, createForm.action)
            };
            await api.post('/permissions', payload);
            setAlert({ type: 'success', message: `Permission '${payload.permission_code}' created successfully.` });
            setWizardStep(1);
            setPermErrors({});
            setCreateForm({
                permission_code: '',
                permission_name: '',
                module: 'VISITOR',
                resource: 'VISITOR_RECORD',
                action: 'VIEW',
                scope_type: 'ORGANIZATION',
                permission_type: 'CUSTOM',
                risk_level: 'LOW',
                is_sensitive: false,
                requires_approval: false,
                requires_audit: true,
                description: ''
            });
            fetchStats();
            setActiveSubView('permissions_list');
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Failed to create permission') });
        }
        finally {
            setFormSubmitting(false);
        }
    };
    // ── Status Actions (Activate, Deactivate, Archive, Clone) ──────────────────
    const handleStatusChange = async (id, action) => {
        try {
            await api.post(`/permissions/${id}/${action}`);
            setAlert({ type: 'success', message: `Permission status updated to ${action.toUpperCase()}` });
            fetchPermissions();
            fetchStats();
            if (selectedPermissionId === id)
                fetchPermissionDetails(id);
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Status action failed') });
        }
    };
    const handleClonePermission = async (id, currentCode) => {
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        const newCode = `${currentCode}_CLONE_${uniqueSuffix}`;
        try {
            await api.post(`/permissions/${id}/clone`, { newCode, newName: `${currentCode} (Clone ${uniqueSuffix})` });
            setAlert({ type: 'success', message: `Permission successfully cloned as '${newCode}'` });
            fetchPermissions();
            fetchStats();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Failed to clone permission') });
        }
    };
    // ── Run Simulator Test ─────────────────────────────────────────────────────
    const handleRunSimulator = async () => {
        try {
            const res = await api.post('/permissions/authorize-test', {
                userId: parseInt(simUserId, 10),
                permissionCode: simPermissionCode
            });
            if (res.data?.data) {
                setSimResult(res.data.data);
            }
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Simulation failed') });
        }
    };
    // ── Export Permissions CSV ─────────────────────────────────────────────────
    const handleExport = async () => {
        try {
            const res = await api.get('/permissions/export');
            if (res.data?.data) {
                const rows = res.data.data;
                const csvContent = 'data:text/csv;charset=utf-8,' +
                    ['Permission Code,Name,Module,Resource,Action,Scope,Risk,Status,Roles Count,Created Date']
                        .concat(rows.map((r) => `"${r.permission_code}","${r.permission_name}","${r.module}","${r.resource}","${r.action}","${r.scope_type}","${r.risk_level}","${r.status}",${r.role_count},"${r.created_at}"`))
                        .join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `permissions_export_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setAlert({ type: 'success', message: 'Permissions dataset exported to CSV successfully.' });
            }
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMsg(err, 'Export failed') });
        }
    };
    return (<div className="p-6 bg-slate-950 text-slate-100 min-h-screen font-sans space-y-6">
      
      {/* ── Top Title & Global Navigation ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton onClick={activeSubView !== 'dashboard' ? () => setActiveSubView('dashboard') : undefined} fallbackUrl="/admin/dashboard"/>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-indigo-500"/>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">{t('permMgmt.title', 'Permission Management')}</h1>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {t('permMgmt.subtitle', 'Centralized Access Control Architecture & Fine-Grained Authorization Policy Engine')}
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button onClick={() => { fetchStats(); fetchPermissions(); }} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition" title={isAm ? "መረጃዎችን በሙሉ አድስ" : "Refresh All Real Datasets"}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/> {isAm ? 'አድስ' : t('form.refresh', 'Refresh')}
          </button>

          <button onClick={handleExport} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition">
            <Download className="w-3.5 h-3.5"/> {isAm ? 'CSV ላክ' : 'Export CSV'}
          </button>

          <button onClick={() => setActiveSubView('create_permission')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition">
            <Plus className="w-4 h-4"/> {isAm ? 'ፈቃድ ፍጠር' : 'Create Permission'}
          </button>
        </div>
      </div>

      {/* Alert Banner with 10s Decreasing Loading & Pause on Hover */}
      <CountdownAlert
        alert={alert}
        onClose={() => setAlert(null)}
        duration={10}
      />

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. SUB-VIEW: DASHBOARD                                                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'dashboard' && (<div className="space-y-6">
          
          {/* Admin KPI Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AdminPermissionKpiCard title="Total Permissions" value={statsLoading ? '...' : stats.totalPermissions} subtitle="All cataloged policies" icon={<Key className="w-5 h-5 text-indigo-400"/>} theme="indigo" onClick={() => { setSelectedStatus('ALL'); setUsageFilter('ALL'); setActiveSubView('permissions_list'); }}/>
            <AdminPermissionKpiCard title="Active Privileges" value={statsLoading ? '...' : stats.activePermissions} subtitle="Callable & enabled" icon={<CheckCircle2 className="w-5 h-5 text-emerald-400"/>} theme="emerald" onClick={() => { setSelectedStatus('ACTIVE'); setActiveSubView('permissions_list'); }}/>
            <AdminPermissionKpiCard title="Inactive Privileges" value={statsLoading ? '...' : stats.inactivePermissions} subtitle="Locked or deactivated" icon={<XCircle className="w-5 h-5 text-slate-400"/>} theme="slate" onClick={() => { setSelectedStatus('INACTIVE'); setActiveSubView('permissions_list'); }}/>
            <AdminPermissionKpiCard title="System Protected" value={statsLoading ? '...' : stats.systemPermissions} subtitle="Immutable core security" icon={<Shield className="w-5 h-5 text-cyan-400"/>} theme="cyan" onClick={() => { setActiveSubView('permissions_list'); }}/>
            <AdminPermissionKpiCard title="Custom Defined" value={statsLoading ? '...' : stats.customPermissions} subtitle="Tenant-created policies" icon={<Sparkles className="w-5 h-5 text-purple-400"/>} theme="purple" onClick={() => { setActiveSubView('permissions_list'); }}/>
            <AdminPermissionKpiCard title="Assigned Privileges" value={statsLoading ? '...' : stats.assignedPermissions} subtitle="Mapped to active roles" icon={<UserCheck className="w-5 h-5 text-blue-400"/>} theme="blue" onClick={() => { setUsageFilter('assigned'); setActiveSubView('permissions_list'); }}/>
            <AdminPermissionKpiCard title="Unused Privileges" value={statsLoading ? '...' : stats.unusedPermissions} subtitle="Zero role mappings" icon={<AlertCircle className="w-5 h-5 text-amber-400"/>} theme="amber" onClick={() => { setUsageFilter('unused'); setActiveSubView('permissions_list'); }}/>
            <AdminPermissionKpiCard title="High Risk Actions" value={statsLoading ? '...' : stats.highRiskPermissions} subtitle="Elevated mutations" icon={<ShieldAlert className="w-5 h-5 text-orange-400"/>} theme="orange" onClick={() => { setSelectedRisk('HIGH'); setActiveSubView('permissions_list'); }}/>
            <AdminPermissionKpiCard title="Critical Security" value={statsLoading ? '...' : stats.criticalPermissions} subtitle="Root & role mutation" icon={<AlertTriangle className="w-5 h-5 text-rose-400"/>} theme="rose" onClick={() => { setSelectedRisk('CRITICAL'); setActiveSubView('permissions_list'); }}/>
            <AdminPermissionKpiCard title="Permission Groups" value={statsLoading ? '...' : stats.permissionGroups} subtitle="Functional policy bundles" icon={<Layers className="w-5 h-5 text-teal-400"/>} theme="teal" onClick={() => { setActiveSubView('groups'); }}/>
            <AdminPermissionKpiCard title="Active Modules" value={statsLoading ? '...' : stats.modules} subtitle="Integrated services" icon={<Database className="w-5 h-5 text-cyan-400"/>} theme="cyan" onClick={() => { setActiveSubView('permissions_list'); }}/>
            <AdminPermissionKpiCard title="Scoped Resources" value={statsLoading ? '...' : stats.resources} subtitle="Targeted data entities" icon={<FileText className="w-5 h-5 text-fuchsia-400"/>} theme="fuchsia" onClick={() => { setActiveSubView('permissions_list'); }}/>
          </div>

          {/* Admin Analytics & Governance Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Module Distribution */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-blue-500 to-transparent"/>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400"/> Module Distribution
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-full font-mono">
                  8 Modules
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Core domain subsystems governed by current policy permissions.
              </p>
              <div className="space-y-2.5 pt-1">
                {[
                { mod: 'VISITOR', count: '14 perms', pct: 85, color: 'bg-indigo-500' },
                { mod: 'APPOINTMENT', count: '10 perms', pct: 65, color: 'bg-blue-500' },
                { mod: 'SECURITY', count: '18 perms', pct: 95, color: 'bg-rose-500' },
                { mod: 'USER', count: '12 perms', pct: 75, color: 'bg-emerald-500' },
                { mod: 'ROLE', count: '8 perms', pct: 50, color: 'bg-purple-500' },
                { mod: 'PERMISSION', count: '9 perms', pct: 60, color: 'bg-cyan-500' },
                { mod: 'AUDIT', count: '6 perms', pct: 40, color: 'bg-amber-500' },
                { mod: 'NOTIFICATION', count: '5 perms', pct: 35, color: 'bg-teal-500' },
            ].map((item) => (<div key={item.mod} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.color}`}/>
                        {item.mod}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px] font-semibold">{item.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.pct}%` }}/>
                    </div>
                  </div>))}
              </div>
            </div>

            {/* 2. Risk Level Breakdown */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 via-rose-500 to-transparent"/>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-orange-400"/> Risk Level Breakdown
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 bg-orange-950/60 border border-orange-800/60 px-2 py-0.5 rounded-full font-mono">
                  Enforced
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Security tiers governing permission execution and audit logging.
              </p>
              <div className="space-y-3 pt-1">
                {[
                { level: 'CRITICAL', desc: 'Role / Permission / System Mutation', bg: 'bg-rose-500', barBg: '#f43f5e', count: stats.criticalPermissions, badge: 'MFA Enforced' },
                { level: 'HIGH', desc: 'Delete / Blacklist / Sensitive Exports', bg: 'bg-orange-500', barBg: '#f97316', count: stats.highRiskPermissions, badge: 'Audit Required' },
                { level: 'MEDIUM', desc: 'Create / Update / Approve Actions', bg: 'bg-amber-500', barBg: '#f59e0b', count: '14 Active', badge: 'Standard Guard' },
                { level: 'LOW', desc: 'Standard Read & View Access', bg: 'bg-emerald-500', barBg: '#10b981', count: '28 Active', badge: 'Public Policy' }
            ].map(r => (<div key={r.level} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 hover:border-slate-700 transition space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="flex items-center gap-2 text-slate-200">
                        <span className={`w-2.5 h-2.5 rounded-full ${r.bg} shadow-sm`}/>
                        {r.level} RISK
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                        {r.badge}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 text-[10px]">{r.desc}</span>
                      <span className="font-mono font-bold text-white shrink-0 ml-2">{r.count}</span>
                    </div>
                  </div>))}
              </div>
            </div>

            {/* 3. Quick Authorization Actions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-emerald-500 to-transparent"/>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400"/> Enterprise Authorization Actions
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
                  Engine Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Launch interactive policy matrix, author custom rules, or run live token simulations.
              </p>
              <div className="space-y-3 pt-1">
                <button onClick={() => setActiveSubView('matrix')} className="w-full text-left p-3.5 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/50 hover:border-indigo-600 rounded-xl flex items-center justify-between text-xs font-bold text-indigo-300 transition group/btn">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center text-indigo-300 group-hover/btn:scale-110 transition-transform">
                      <Layers className="w-4 h-4"/>
                    </div>
                    <div>
                      <div className="font-black text-white">Open Permission Matrix</div>
                      <div className="text-[10px] text-indigo-400 font-normal">Cross-module role vs privilege grid</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-400 group-hover/btn:translate-x-1 transition-transform"/>
                </button>

                <button onClick={() => setActiveSubView('create_permission')} className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-800/70 border border-slate-800 hover:border-emerald-600/50 rounded-xl flex items-center justify-between text-xs font-bold text-slate-300 transition group/btn">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 group-hover/btn:scale-110 transition-transform">
                      <Plus className="w-4 h-4"/>
                    </div>
                    <div>
                      <div className="font-black text-white">Create Custom Permission</div>
                      <div className="text-[10px] text-slate-400 font-normal">Define atomic resource actions</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover/btn:translate-x-1 group-hover/btn:text-emerald-400 transition-all"/>
                </button>

                <button onClick={() => setActiveSubView('simulator')} className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-800/70 border border-slate-800 hover:border-amber-600/50 rounded-xl flex items-center justify-between text-xs font-bold text-slate-300 transition group/btn">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 group-hover/btn:scale-110 transition-transform">
                      <Zap className="w-4 h-4"/>
                    </div>
                    <div>
                      <div className="font-black text-white">Authorization Simulator</div>
                      <div className="text-[10px] text-slate-400 font-normal">Verify policy tokens & scopes in realtime</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover/btn:translate-x-1 group-hover/btn:text-amber-400 transition-all"/>
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. SUB-VIEW: ALL PERMISSIONS DATA TABLE                                    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {(activeSubView === 'permissions_list' || activeSubView === 'dashboard') && (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          
          {/* Controls Header & Search Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400"/>
              <input type="text" placeholder="Search permission code, name, module, resource..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"/>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select value={selectedModule} onChange={(e) => { setSelectedModule(e.target.value); setCurrentPage(1); }} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500">
                <option value="ALL">Module: All</option>
                <option value="VISITOR">VISITOR</option>
                <option value="APPOINTMENT">APPOINTMENT</option>
                <option value="SECURITY">SECURITY</option>
                <option value="USER">USER</option>
                <option value="ROLE">ROLE</option>
                <option value="PERMISSION">PERMISSION</option>
                <option value="AUDIT">AUDIT</option>
                <option value="NOTIFICATION">NOTIFICATION</option>
              </select>

              <select value={selectedRisk} onChange={(e) => { setSelectedRisk(e.target.value); setCurrentPage(1); }} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500">
                <option value="ALL">Risk: All</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500">
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>

              <select value={usageFilter} onChange={(e) => { setUsageFilter(e.target.value); setCurrentPage(1); }} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500">
                <option value="ALL">Usage: All</option>
                <option value="assigned">Assigned</option>
                <option value="unused">Unused</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">{t('table.permissionCode', 'Permission Code')}</th>
                  <th className="p-3">{t('table.name', 'Name')}</th>
                  <th className="p-3">{t('permMgmt.module', 'Module')}</th>
                  <th className="p-3">{t('permMgmt.action', 'Action')}</th>
                  <th className="p-3">{t('table.scope', 'Scope')}</th>
                  <th className="p-3">{t('table.risk', 'Risk')}</th>
                  <th className="p-3">{t('table.status', 'Status')}</th>
                  <th className="p-3">{t('table.roles', 'Roles')}</th>
                  <th className="p-3">{t('table.users', 'Users')}</th>
                  <th className="p-3">Ver</th>
                  <th className="p-3 text-right">{t('table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {loading ? (<tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400"/>
                      Loading permissions database...
                    </td>
                  </tr>) : permissions.length === 0 ? (<tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      No permissions match the current filters.
                    </td>
                  </tr>) : (permissions.map((perm) => (<tr key={perm.id} className="hover:bg-slate-950/40 transition">
                      <td className="p-3 font-mono font-bold text-indigo-300">
                        {perm.permission_code}
                      </td>
                      <td className="p-3 font-bold text-slate-200">{perm.permission_name}</td>
                      <td className="p-3 text-slate-400 font-bold">{perm.module}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300">
                          {perm.action || 'VIEW'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-950/60 text-blue-300 border border-blue-800/40">
                          {perm.scope_type || 'ORGANIZATION'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${perm.risk_level === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    perm.risk_level === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                        perm.risk_level === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                          {perm.risk_level || 'LOW'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${perm.status === 'ACTIVE' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {perm.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{perm.role_count || 0}</td>
                      <td className="p-3 font-mono text-slate-300">{perm.user_count || 0}</td>
                      <td className="p-3 font-mono text-slate-400">v{perm.version || 1}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => fetchPermissionDetails(perm.id)} className="p-1.5 hover:bg-indigo-600/20 text-indigo-400 rounded-lg transition" title="View Permission Inspector">
                            <Eye className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={() => handleClonePermission(perm.id, perm.permission_code)} className="p-1.5 hover:bg-purple-600/20 text-purple-400 rounded-lg transition" title="Clone Permission">
                            <Copy className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={() => handleStatusChange(perm.id, perm.status === 'ACTIVE' ? 'deactivate' : 'activate')} className={`p-1.5 rounded-lg transition ${perm.status === 'ACTIVE' ? 'hover:bg-amber-600/20 text-amber-400' : 'hover:bg-emerald-600/20 text-emerald-400'}`} title={perm.status === 'ACTIVE' ? 'Deactivate Permission' : 'Activate Permission'}>
                            {perm.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5"/> : <Unlock className="w-3.5 h-3.5"/>}
                          </button>
                        </div>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
            <div>
              Showing {permissions.length} of {totalCount} permissions
            </div>
            <div className="flex items-center gap-2">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-40 font-bold hover:bg-slate-800">
                Previous
              </button>
              <span className="font-mono font-bold text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-40 font-bold hover:bg-slate-800">
                Next
              </button>
            </div>
          </div>
        </div>)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. SUB-VIEW: PERMISSION MATRIX WORKSPACE                                    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'matrix' && (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400"/> Enterprise Permission Matrix
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Bulk role-permission assignment grid with real-time RBAC cache invalidation
              </p>
            </div>
            <button onClick={handleSaveMatrix} disabled={formSubmitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50">
              <CheckCircle2 className="w-4 h-4"/> Save Matrix Assignments
            </button>
          </div>

          {matrixLoading ? (<div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400"/>
              Loading permission matrix matrix grid...
            </div>) : (<div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[600px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-300 uppercase font-black text-[10px] border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 bg-slate-950 min-w-[240px] sticky left-0 z-20">Module / Permission Code</th>
                    {matrixData.roles.map(r => (<th key={r.id} className="p-3 text-center min-w-[110px] bg-slate-950">
                        <div className="font-extrabold text-indigo-300">{r.role_name}</div>
                        <div className="text-[9px] text-slate-500 font-mono uppercase">{r.scope_type}</div>
                      </th>))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {matrixData.modules.map(modGroup => (<React.Fragment key={modGroup.module_name}>
                      <tr className="bg-slate-950/80">
                        <td colSpan={matrixData.roles.length + 1} className="p-2.5 font-black uppercase text-[11px] text-indigo-400 tracking-wider">
                          Module: {modGroup.module_name} ({modGroup.permissions.length} perms)
                        </td>
                      </tr>
                      {modGroup.permissions.map((p) => (<tr key={p.id} className="hover:bg-slate-950/40">
                          <td className="p-2.5 font-mono text-slate-200 font-bold bg-slate-900 sticky left-0 z-10 border-r border-slate-800">
                            {p.permission_code}
                          </td>
                          {matrixData.roles.map(r => {
                            const isAssigned = matrixAssignments.has(`${r.id}_${p.id}`);
                            return (<td key={r.id} className="p-2.5 text-center">
                                <button type="button" role="switch" aria-checked={isAssigned} onClick={() => toggleMatrixCell(r.id, p.id)} className="inline-flex items-center justify-center p-1 rounded-xl transition-all duration-200 group focus:outline-none hover:bg-slate-800/80 cursor-pointer" title={`${isAssigned ? 'Active (Click to revoke)' : 'Inactive (Click to grant)'}: ${p.permission_code} for ${r.role_name}`}>
                                  {isAssigned ? (<ToggleRight className="w-7 h-7 text-indigo-400 group-hover:text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.7)] group-hover:scale-110 transition-all duration-200"/>) : (<ToggleLeft className="w-7 h-7 text-slate-600 group-hover:text-slate-400 group-hover:scale-110 transition-all duration-200"/>)}
                                </button>
                              </td>);
                        })}
                        </tr>))}
                    </React.Fragment>))}
                </tbody>
              </table>
            </div>)}
        </div>)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. SUB-VIEW: CREATE PERMISSION WIZARD                                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'create_permission' && (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400"/> {isAm ? 'ብጁ ፈቃድ መፍጠሪያ ረዳት' : 'Create Custom Permission Wizard'}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {isAm ? 'MODULE.RESOURCE.ACTION የስም አወቃቀር በመከተል አዲስ የድርጅት ፍቃድ ኮድ ይግለጹ' : 'Define a new enterprise authorization code following MODULE.RESOURCE.ACTION naming architecture'}
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            {[
                { num: 1, label: 'Basic Info', amLabel: 'መሰረታዊ መረጃ' },
                { num: 2, label: 'Scope', amLabel: 'ወሰን' },
                { num: 3, label: 'Security & Risk', amLabel: 'ደህንነት እና ስጋት' },
                { num: 4, label: 'Review & Submit', amLabel: 'ገምግም እና አስገባ' }
            ].map(s => (<button key={s.num} onClick={() => setWizardStep(s.num)} className={`flex items-center gap-2 text-xs font-bold uppercase ${wizardStep === s.num ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1' : 'text-slate-500'}`}>
                <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${wizardStep === s.num ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{s.num}</span>
                {isAm ? s.amLabel : s.label}
              </button>))}
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {wizardStep === 1 && (<div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">{isAm ? 'ሞጁል *' : 'Module *'}</label>
                  <input type="text" value={createForm.module} onChange={(e) => setCreateForm({ ...createForm, module: e.target.value.toUpperCase() })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono" placeholder="VISITOR, APPOINTMENT, SECURITY..."/>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">{isAm ? 'ሀብት *' : 'Resource *'}</label>
                  <input type="text" name="resource" required value={createForm.resource} data-invalid={Boolean(permErrors.resource)} aria-invalid={Boolean(permErrors.resource)} onChange={(e) => {
                    setCreateForm({ ...createForm, resource: e.target.value.toUpperCase() });
                    if (permErrors.resource)
                        setPermErrors((prev) => ({ ...prev, resource: null }));
                }} className={`w-full bg-slate-950 rounded-xl px-3 py-2 text-white font-mono transition-all ${permErrors.resource
                    ? 'border-2 border-rose-500 bg-rose-950/20 animate-shake'
                    : 'border border-slate-800'}`} placeholder="VISITOR_RECORD, APPOINTMENT_REQUEST..."/>
                  <FieldError error={permErrors.resource}/>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">{isAm ? 'ድርጊት *' : 'Action *'}</label>
                  <select value={createForm.action} onChange={(e) => setCreateForm({ ...createForm, action: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold">
                    {['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'CHECK_IN', 'CHECK_OUT', 'APPROVE', 'REJECT', 'GENERATE', 'EXPORT'].map(a => (<option key={a} value={a}>{a}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">{isAm ? 'የፈቃድ ኮድ (ራስ-ሰር) *' : 'Permission Code (Auto-Generated) *'}</label>
                  <input type="text" value={createForm.permission_code || handleAutoCodeGenerate(createForm.module, createForm.resource, createForm.action)} onChange={(e) => setCreateForm({ ...createForm, permission_code: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-indigo-300 font-mono font-bold"/>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">{isAm ? 'የፈቃድ ስም *' : 'Permission Name *'}</label>
                  <input type="text" name="permission_name" required value={createForm.permission_name} data-invalid={Boolean(permErrors.permission_name)} aria-invalid={Boolean(permErrors.permission_name)} onChange={(e) => {
                    setCreateForm({ ...createForm, permission_name: e.target.value });
                    if (permErrors.permission_name)
                        setPermErrors((prev) => ({ ...prev, permission_name: null }));
                }} className={`w-full bg-slate-950 rounded-xl px-3 py-2 text-white font-bold transition-all ${permErrors.permission_name
                    ? 'border-2 border-rose-500 bg-rose-950/20 animate-shake'
                    : 'border border-slate-800'}`} placeholder={isAm ? "ምሳሌ፡ ጎብኚዎችን በመግቢያ ላይ ማስገባት" : "e.g. Check In Visitors At Gate"}/>
                  <FieldError error={permErrors.permission_name}/>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">{isAm ? 'ገለጻ' : 'Description'}</label>
                  <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300"/>
                </div>
              </div>)}

            {wizardStep === 2 && (<div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-2">{isAm ? 'የዒላማ ወሰን ደረጃ ይምረጡ' : 'Select Target Scope Level'}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                    { type: 'SYSTEM', desc: 'Full System-Wide Global Access', amDesc: 'ሙሉ ስርዓት-ሰፊ ዓለም አቀፍ ተደራሽነት' },
                    { type: 'ORGANIZATION', desc: 'Organization Level Boundary', amDesc: 'የድርጅት ደረጃ ድንበር' },
                    { type: 'BRANCH', desc: 'Specific Branch Facility Only', amDesc: 'የተወሰነ ቅርንጫፍ ብቻ' },
                    { type: 'DEPARTMENT', desc: 'Department Level Isolation', amDesc: 'የክፍል ደረጃ ማግለል' },
                    { type: 'SELF', desc: 'Strict Self-Ownership Scope (e.g. Visitor A data)', amDesc: 'ጥብቅ ራስ-ባለቤትነት (ምሳሌ፡ ጎብኚ ሀ መረጃ)' },
                    { type: 'RESOURCE', desc: 'Assigned Resource Ownership', amDesc: 'የተመደበ ሀብት ባለቤትነት' }
                ].map(s => (<button type="button" key={s.type} onClick={() => setCreateForm({ ...createForm, scope_type: s.type })} className={`p-3 rounded-xl border text-left transition ${createForm.scope_type === s.type
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                        <div className="font-extrabold">{s.type}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{isAm ? s.amDesc : s.desc}</div>
                      </button>))}
                  </div>
                </div>
              </div>)}

            {wizardStep === 3 && (<div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">{isAm ? 'የአደጋ ደረጃ' : 'Risk Level'}</label>
                  <select value={createForm.risk_level} onChange={(e) => setCreateForm({ ...createForm, risk_level: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold">
                    <option value="LOW">{isAm ? 'ዝቅተኛ' : 'LOW'}</option>
                    <option value="MEDIUM">{isAm ? 'መካከለኛ' : 'MEDIUM'}</option>
                    <option value="HIGH">{isAm ? 'ከፍተኛ' : 'HIGH'}</option>
                    <option value="CRITICAL">{isAm ? 'ወሳኝ' : 'CRITICAL'}</option>
                  </select>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div onClick={() => setCreateForm({ ...createForm, is_sensitive: !createForm.is_sensitive })} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
                    <div>
                      <span className="font-bold text-slate-300 text-xs">{isAm ? 'እንደ ስሱ ፈቃድ ምልክት አድርግ' : 'Mark as Sensitive Permission'}</span>
                      <p className="text-[10px] text-slate-500">{isAm ? 'የአስተዳዳሪ ክትትል እና ከፍተኛ MFA ይጠይቃል' : 'Requires Admin Oversight & Elevated MFA'}</p>
                    </div>
                    {createForm.is_sensitive ? (<ToggleRight className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"/>) : (<ToggleLeft className="w-7 h-7 text-slate-600"/>)}
                  </div>

                  <div onClick={() => setCreateForm({ ...createForm, requires_approval: !createForm.requires_approval })} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
                    <div>
                      <span className="font-bold text-slate-300 text-xs">{isAm ? 'የማጽደቅ ሂደት ይጠይቃል' : 'Requires Approval Workflow'}</span>
                      <p className="text-[10px] text-slate-500">{isAm ? 'ከመፈጸም በፊት መገምገም እና መጽደቅ አለበት' : 'Must be reviewed and approved prior to runtime execution'}</p>
                    </div>
                    {createForm.requires_approval ? (<ToggleRight className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"/>) : (<ToggleLeft className="w-7 h-7 text-slate-600"/>)}
                  </div>

                  <div onClick={() => setCreateForm({ ...createForm, requires_audit: !createForm.requires_audit })} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
                    <div>
                      <span className="font-bold text-slate-300 text-xs">{isAm ? 'የምዝገባ ክስተቶችን በራስ-ሰር መዝግብ' : 'Log Audit Events Automatically'}</span>
                      <p className="text-[10px] text-slate-500">{isAm ? 'ማደናቀፍ የማይቻል የተገዢነት ምዝግብ ማስታወሻዎችን ያመነጫል' : 'Emit tamper-resistant compliance audit entries'}</p>
                    </div>
                    {createForm.requires_audit ? (<ToggleRight className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"/>) : (<ToggleLeft className="w-7 h-7 text-slate-600"/>)}
                  </div>
                </div>
              </div>)}

            {wizardStep === 4 && (<div className="space-y-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="font-black uppercase text-indigo-400">{isAm ? 'የፈቃድ ትርጉም ገምግም' : 'Review Permission Definition'}</h4>
                <div className="grid grid-cols-2 gap-3 text-slate-300 font-mono">
                  <div>{isAm ? 'ኮድ:' : 'Code:'} <span className="text-white font-bold">{createForm.permission_code || handleAutoCodeGenerate(createForm.module, createForm.resource, createForm.action)}</span></div>
                  <div>{isAm ? 'ስም:' : 'Name:'} <span className="text-white font-bold">{createForm.permission_name || 'N/A'}</span></div>
                  <div>{isAm ? 'ሞጁል:' : 'Module:'} <span className="text-white">{createForm.module}</span></div>
                  <div>{isAm ? 'ወሰን:' : 'Scope:'} <span className="text-blue-400">{createForm.scope_type}</span></div>
                  <div>{isAm ? 'ስጋት:' : 'Risk:'} <span className="text-orange-400">{createForm.risk_level}</span></div>
                </div>
              </div>)}

            {/* Stepper Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button type="button" disabled={wizardStep <= 1} onClick={() => setWizardStep(prev => prev - 1)} className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold disabled:opacity-40">
                {isAm ? 'ቀዳሚ ደረጃ' : 'Previous Step'}
              </button>
              {wizardStep < 4 ? (<button type="button" onClick={() => setWizardStep(prev => prev + 1)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider">
                  {isAm ? 'ቀጣይ ደረጃ →' : 'Next Step →'}
                </button>) : (<button type="submit" disabled={formSubmitting} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-600/30 disabled:opacity-50">
                  {formSubmitting ? (isAm ? 'በመፍጠር ላይ...' : 'Creating...') : (isAm ? 'አረጋግጥ እና ፈቃድ ፍጠር' : 'Confirm & Create Permission')}
                </button>)}
            </div>
          </form>
        </div>)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 5. SUB-VIEW: REAL SYSTEM ROLES & PERMISSIONS MANAGEMENT                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'groups' && (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400"/> {isAm ? 'የድርጅት ሥርዓት ሚናዎች እና ፈቃዶች' : 'Enterprise System Roles & Permissions'}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {isAm ? 'ማንኛውንም ሚና ካርድ ጠቅ ያድርጉ የፈቃድ ምድቦችን ON/OFF መቀያየሪያ ስዊቾችን በመጠቀም ለማዋቀር' : 'Click any role card to configure permission assignments using interactive ON/OFF toggle switches'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input type="text" value={roleSearchQuery} onChange={(e) => setRoleSearchQuery(e.target.value)} placeholder={isAm ? 'ሚናዎችን በስም ወይም ኮድ ይፈልጉ...' : 'Search roles by name or code...'} className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 w-64"/>
              </div>
              <button onClick={fetchRoles} className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${rolesLoading ? 'animate-spin' : ''}`}/> {isAm ? 'አድስ' : 'Refresh'}
              </button>
            </div>
          </div>

          {rolesLoading ? (<div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
              {isAm ? 'የድርጅት ሥርዓት ሚናዎች በመጫን ላይ...' : 'Loading enterprise system roles...'}
            </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rolesList
                    .filter((r) => !roleSearchQuery ||
                    (r.role_name || '').toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
                    (r.role_code || '').toLowerCase().includes(roleSearchQuery.toLowerCase()))
                    .map((role) => (<div key={role.id} onClick={() => openRolePermissionsModal(role)} className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/80 p-5 rounded-2xl cursor-pointer transition-all duration-300 group flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 relative overflow-hidden space-y-4">
                    {/* Top Accent Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

                    {/* Row 1: Top Bar with Shield Icon & Risk Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-600/30 group-hover:scale-105 transition">
                        <Shield className="w-5 h-5 text-indigo-400"/>
                      </div>

                      <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full border font-mono tracking-wider ${role.risk_level === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                        role.risk_level === 'HIGH' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                            'bg-emerald-950 text-emerald-300 border-emerald-800'}`}>
                        {role.risk_level || 'LOW'} RISK
                      </span>
                    </div>

                    {/* Row 2: Role Title & Code (UN-SQUEEZED, FULL WIDTH) */}
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition tracking-tight leading-snug">
                        {role.role_name}
                      </h3>
                      <span className="font-mono text-xs text-indigo-400 font-bold block mt-1">
                        {role.role_code}
                      </span>
                    </div>

                    {/* Row 3: Description */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {role.description || 'Enterprise system role defining access scope and permissions.'}
                    </p>

                    {/* Row 4: Metrics Bar (Clear Pill Badges) */}
                    <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                      <span className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-indigo-300 font-bold rounded-xl flex items-center justify-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-400 shrink-0"/>
                        <span className="text-white font-extrabold">{role.permission_count || 0}</span> Perms
                      </span>

                      <span className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-400 shrink-0"/>
                        <span className="text-slate-200">{role.user_count || 0} Users</span>
                      </span>
                    </div>

                    {/* Row 5: Action Button (Clean Medium Button, No Text Overflow!) */}
                    <div className="pt-2">
                      <button onClick={(e) => {
                        e.stopPropagation();
                        openRolePermissionsModal(role);
                    }} className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all duration-200 group-hover:shadow-indigo-500/50">
                        <Sliders className="w-4 h-4"/> {isAm ? 'ፈቃዶችን አርትዕ' : 'Edit Permissions'}
                      </button>
                    </div>
                  </div>))}
            </div>)}
        </div>)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 6. SUB-VIEW: AUTHORIZATION SIMULATOR TEST                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'simulator' && (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-black uppercase text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400"/> Centralized Authorization Engine Simulator
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Live rule execution test of authorize(user, permissionCode, scope) backend logic
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Target User ID</label>
              <input type="text" value={simUserId} onChange={(e) => setSimUserId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"/>
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Permission Code to Evaluate</label>
              <input type="text" value={simPermissionCode} onChange={(e) => setSimPermissionCode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-indigo-300 font-mono font-bold"/>
            </div>

            <button onClick={handleRunSimulator} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition">
              Run Authorization Test
            </button>

            {simResult && (<div className={`p-4 rounded-xl border space-y-2 ${simResult.authorized ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-rose-950/80 border-rose-800 text-rose-300'}`}>
                <div className="flex items-center gap-2 text-sm font-black uppercase">
                  {simResult.authorized ? <CheckCircle2 className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                  Decision: {simResult.authorized ? 'AUTHORIZED ✓' : 'DENIED ✕'}
                </div>
                <div className="text-xs font-mono">Reason: {simResult.reason}</div>
              </div>)}
          </div>
        </div>)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 7. SUB-VIEW: RISK ANALYTICS                                               */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'risk_analysis' && (<div className="space-y-5">
          {/* Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400"/>
              </div>
              <div>
                <h2 className="text-base font-black uppercase text-white tracking-tight">Risk Analytics Dashboard</h2>
                <p className="text-xs text-slate-400">Security posture analysis across all permissions and role assignments</p>
              </div>
            </div>
          </div>

          {/* Risk Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
                { label: 'Critical Permissions', value: stats.criticalPermissions || 0, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-950', border: 'border-rose-800' },
                { label: 'High Risk Permissions', value: stats.highRiskPermissions || 0, icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-950', border: 'border-amber-800' },
                { label: 'Unused Permissions', value: stats.unusedPermissions || 0, icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-950', border: 'border-orange-800' },
                { label: 'System Permissions', value: stats.systemPermissions || 0, icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-950', border: 'border-cyan-800' },
            ].map((card) => (<div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <card.icon className={`w-6 h-6 ${card.color}`}/>
                  <span className={`text-3xl font-black font-mono ${card.color}`}>{card.value}</span>
                </div>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">{card.label}</p>
              </div>))}
          </div>

          {/* Risk Distribution Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800">
              <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400"/> Permission Risk Distribution by Module
              </h3>
            </div>
            <div className="p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <th className="pb-3 px-3">Module</th>
                    <th className="pb-3 px-3 text-center">Total</th>
                    <th className="pb-3 px-3 text-center">Low Risk</th>
                    <th className="pb-3 px-3 text-center">Medium Risk</th>
                    <th className="pb-3 px-3 text-center">High Risk</th>
                    <th className="pb-3 px-3 text-center">Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permissions.reduce((acc, p) => {
                const mod = p.module || 'GENERAL';
                if (!acc[mod])
                    acc[mod] = { total: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
                acc[mod].total++;
                acc[mod][p.risk_level || 'LOW']++;
                return acc;
            }, {})).map(([mod, counts]) => (<tr key={mod} className="border-b border-slate-800/50 hover:bg-slate-950/50">
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-indigo-400"/> {mod}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">{counts.total}</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">{counts.LOW || 0}</td>
                      <td className="py-3 px-3 text-center font-mono text-amber-400 font-bold">{counts.MEDIUM || 0}</td>
                      <td className="py-3 px-3 text-center font-mono text-orange-400 font-bold">{counts.HIGH || 0}</td>
                      <td className="py-3 px-3 text-center font-mono text-rose-400 font-bold">{counts.CRITICAL || 0}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>

          {/* High Risk Permissions List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800">
              <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400"/> High & Critical Risk Permissions
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {permissions
                .filter((p) => p.risk_level === 'HIGH' || p.risk_level === 'CRITICAL')
                .map((p) => (<div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full border font-mono ${p.risk_level === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-amber-950 text-amber-300 border-amber-800'}`}>
                        {p.risk_level}
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-indigo-300 block truncate">{p.permission_code}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{p.permission_name}</span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-[10px] font-mono font-bold">
                      {p.module}
                    </span>
                  </div>))}
              {permissions.filter((p) => p.risk_level === 'HIGH' || p.risk_level === 'CRITICAL').length === 0 && (<div className="text-center py-8 text-slate-400 font-mono text-xs">
                  <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 mb-2"/>
                  No high or critical risk permissions found. Great security posture!
                </div>)}
            </div>
          </div>
        </div>)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 8. SUB-VIEW: IMPORT / EXPORT                                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'import_export' && (<div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-teal-400"/>
              </div>
              <div>
                <h2 className="text-base font-black uppercase text-white tracking-tight">Import & Export Permissions</h2>
                <p className="text-xs text-slate-400">Bulk data migration tools for permission configurations</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Export Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Download className="w-6 h-6 text-emerald-400"/>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Export Permissions</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download all permission configurations as a CSV file. Includes permission codes, modules, risk levels, descriptions, and role assignments.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <span className="text-slate-400">Total permissions to export:</span>
                  <span className="font-mono font-bold text-white">{stats.totalPermissions || 0}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <span className="text-slate-400">Export format:</span>
                  <span className="font-mono font-bold text-emerald-400">CSV (UTF-8)</span>
                </div>
              </div>
              <button onClick={handleExport} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition">
                <Download className="w-4 h-4"/> Export CSV File
              </button>
            </div>

            {/* Import Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Upload className="w-6 h-6 text-indigo-400"/>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Import Permissions</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload a CSV file to bulk-import permission configurations. Must follow the standard column format: permission_code, permission_name, module, resource, action, risk_level.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <span className="text-slate-400">Accepted formats:</span>
                  <span className="font-mono font-bold text-indigo-400">.csv, .xlsx</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <span className="text-slate-400">Max file size:</span>
                  <span className="font-mono font-bold text-amber-400">10 MB</span>
                </div>
              </div>
              <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition">
                <Upload className="w-4 h-4"/> Upload CSV File
              </button>
            </div>
          </div>
        </div>)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 9. SUB-VIEW: PERMISSION DETAILS INSPECTOR MODAL                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {selectedPermissionId && createPortal(<div className="fixed top-0 bottom-0 right-0 left-0 md:left-[260px] z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPermissionId(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400"/>
                  <h3 className="text-base font-black text-white font-mono">
                    {permissionDetails?.permission_code || 'Loading...'}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md">
                    {permissionDetails?.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{permissionDetails?.permission_name}</p>
              </div>
              <button onClick={() => setSelectedPermissionId(null)} className="text-slate-400 hover:text-white p-2">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {detailsLoading ? (<div className="p-8 text-center text-slate-400">Loading details...</div>) : permissionDetails && (<div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
                    <div>Module: <span className="text-white font-bold">{permissionDetails.module}</span></div>
                    <div>Resource: <span className="text-white">{permissionDetails.resource}</span></div>
                    <div>Action: <span className="text-indigo-400 font-bold">{permissionDetails.action}</span></div>
                    <div>Scope: <span className="text-blue-400 font-bold">{permissionDetails.scope_type}</span></div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-300 uppercase mb-2">Assigned Roles ({permissionDetails.roles?.length || 0})</h4>
                    <div className="flex flex-wrap gap-2">
                      {(permissionDetails.roles || []).map((r) => (<span key={r.id} className="px-3 py-1 bg-slate-950 border border-slate-800 text-indigo-300 font-bold rounded-lg">
                          {r.role_name} ({r.role_code})
                        </span>))}
                    </div>
                  </div>
                </div>)}
            </div>
          </div>
        </div>, document.body)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 8. SUB-VIEW: ROLE PERMISSION TOGGLE ASSIGNMENT MODAL                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {selectedRoleForPermissions && createPortal(<div className="fixed top-0 bottom-0 right-0 left-0 md:left-[260px] z-40 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6" onClick={() => setSelectedRoleForPermissions(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-indigo-400"/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      {selectedRoleForPermissions.role_name}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md">
                      {selectedRoleForPermissions.role_code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle switches ON or OFF to grant or revoke specific granular permissions for this role
                  </p>
                </div>
              </div>

              <button onClick={() => setSelectedRoleForPermissions(null)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 transition">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Filter Toolbar inside Modal */}
            <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input type="text" value={rolePermSearch} onChange={(e) => setRolePermSearch(e.target.value)} placeholder="Filter permissions by code, name, or description..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono"/>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-xl font-bold">
                  {roleAssignedPermIds.length} Active / {allSystemPermissions.length} Total Permissions
                </span>
              </div>
            </div>

            {/* Modal Body: Grouped Permissions in 3-Column Grid */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
              {rolePermsLoading ? (<div className="p-12 text-center text-slate-400 font-bold animate-pulse">
                  Loading role permissions matrix...
                </div>) : (Object.entries(allSystemPermissions
                .filter((p) => !rolePermSearch ||
                (p.permission_code || '').toLowerCase().includes(rolePermSearch.toLowerCase()) ||
                (p.permission_name || '').toLowerCase().includes(rolePermSearch.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(rolePermSearch.toLowerCase()))
                .reduce((acc, p) => {
                const mod = p.module || 'GENERAL';
                if (!acc[mod])
                    acc[mod] = [];
                acc[mod].push(p);
                return acc;
            }, {})).map(([moduleName, modulePerms]) => {
                const assignedInModuleCount = modulePerms.filter((p) => roleAssignedPermIds.includes(p.id)).length;
                const allAssignedInModule = assignedInModuleCount === modulePerms.length && modulePerms.length > 0;
                return (<div key={moduleName} className="bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
                      {/* Module Header Bar */}
                      <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-indigo-400"/>
                          <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                            {moduleName} MODULE
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-indigo-300 rounded-md">
                            {assignedInModuleCount} / {modulePerms.length} Enabled
                          </span>
                        </div>

                        <button type="button" onClick={() => handleToggleAllInModule(moduleName, !allAssignedInModule)} className="px-2.5 py-0.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition">
                          {allAssignedInModule ? 'Disable All' : 'Enable All'}
                        </button>
                      </div>

                      {/* Permissions List 3-Column Grid */}
                      <div className="p-2.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {modulePerms.map((perm) => {
                        const isAssigned = roleAssignedPermIds.includes(perm.id);
                        return (<div key={perm.id} onClick={() => handleTogglePermissionForRole(perm.id)} className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${isAssigned
                                ? 'bg-indigo-950/40 border-indigo-600/50 shadow-sm'
                                : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 text-slate-400'}`}>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-mono text-xs font-bold truncate ${isAssigned ? 'text-indigo-300' : 'text-slate-300'}`} title={perm.permission_code}>
                                    {perm.permission_code}
                                  </span>
                                  {perm.risk_level === 'HIGH' && (<span className="shrink-0 px-1 py-0.2 text-[8px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800 rounded">
                                      HIGH
                                    </span>)}
                                </div>
                                <p className="text-[10px] text-slate-400 truncate" title={perm.permission_name}>{perm.permission_name}</p>
                              </div>

                              {/* Enterprise Interactive Toggle Switch */}
                              <div className={`shrink-0 w-9 h-5 rounded-full transition-colors duration-200 ease-in-out p-0.5 flex items-center ${isAssigned ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'}`}>
                                <div className="w-4 h-4 rounded-full bg-white shadow transform transition-transform"/>
                              </div>
                            </div>);
                    })}
                      </div>
                    </div>);
            }))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="text-slate-400 font-mono text-[11px]">
                Changes persist automatically to database on toggle.
              </div>
              <button onClick={() => setSelectedRoleForPermissions(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition">
                Done / Close
              </button>
            </div>
          </div>
        </div>, document.body)}

    </div>);
}
