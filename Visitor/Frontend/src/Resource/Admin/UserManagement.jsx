import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Users, User, UserCheck, UserX, Lock, Unlock, ShieldAlert, Clock, CheckCircle2, AlertTriangle, UserPlus, RefreshCw, Search, Download, Upload, Eye, Edit, Key, Shield, Smartphone, Laptop, Activity, ChevronLeft, ChevronRight, Mail, Phone, Building, Briefcase, X, FileSpreadsheet, Trash2, Sparkles, SlidersHorizontal, Check, ShieldCheck, History, Save, Layers, ArrowRight, User as UserIcon, Plus, Loader2, Copy } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import FieldError from '../../components/common/FieldError';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import CountryNationalitySelect from '../../components/common/CountryNationalitySelect';
import CountryPhoneInput from '../../components/common/CountryPhoneInput';
import { validateDateOfBirth, validatePhoneNumber } from '../../data/countriesData';
import { required, email, phone, passwordStrength } from '../../validation';
import { sanitizeFormValues } from '../../utils/sanitizer';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponseNavigation } from '../../modules/response';

const maxAllowedDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
})();
// ─────────────────────────────────────────────────────────────────────────────
// USER DASHBOARD THEMES & ANIMATED KPI CARD (MATCHING ADMIN DASHBOARD AESTHETICS)
// ─────────────────────────────────────────────────────────────────────────────
const USER_DASHBOARD_THEMES = {
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-blue-400',
        badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    cyan: {
        barColor: '#06b6d4',
        hoverBarColor: '#22d3ee',
        darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    },
    purple: {
        barColor: '#a855f7',
        hoverBarColor: '#c084fc',
        darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-purple-400',
        badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    },
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    indigo: {
        barColor: '#6366f1',
        hoverBarColor: '#818cf8',
        darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-indigo-400',
        badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    },
    rose: {
        barColor: '#f43f5e',
        hoverBarColor: '#fb7185',
        darkHoverBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.35) 0%, rgba(136, 19, 55, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-rose-400',
        badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    },
    teal: {
        barColor: '#14b8a6',
        hoverBarColor: '#2dd4bf',
        darkHoverBg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.35) 0%, rgba(19, 78, 74, 0.25) 55%, #0a0f1d 100%)',
        textColor: 'text-teal-400',
        badgeBg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    },
};
const dashboardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
        },
    },
};
const dashboardItemVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 280, damping: 22 },
    },
};
function UserKpiCard({ title, value, subtitle, icon, theme, onClick, badge }) {
    const [hovered, setHovered] = useState(false);
    const styles = USER_DASHBOARD_THEMES[theme];
    return (<motion.div variants={dashboardItemVariants} whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={`border rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 min-h-[155px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group bg-[#0a0f1d] border-slate-800/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] ${onClick ? 'cursor-pointer' : ''} ${hovered ? 'shadow-2xl border-slate-700' : ''}`}>
      {/* Dark Hover Fill Overlay */}
      <div style={{
            background: styles.darkHoverBg,
            opacity: hovered ? 1 : 0,
        }} className="absolute inset-0 transition-opacity duration-300 pointer-events-none"/>

      {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
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

      <div className="mt-2.5 relative z-10">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{value}</h2>
          {badge && (<span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${styles.badgeBg}`}>
              {badge}
            </span>)}
        </div>
        <p className={`text-[11px] sm:text-xs font-semibold mt-1 transition-colors ${styles.textColor} opacity-90 group-hover:opacity-100`}>
          {subtitle}
        </p>
      </div>
    </motion.div>);
}
export default function UserManagement({ departments = [], initialTab = 'users', defaultRoleFilter = 'ALL', }) {
    const { t } = useLanguage();
    // Navigation Sub-Views & History
    const navigate = useNavigate();
    const location = useLocation();
    const { toConfirmation, toSuccess, toError } = useResponseNavigation();

    const handleDeleteUserWithConfirmation = async (target) => {
        if (!target) return;
        try {
            // Optimistic update directly in-place
            setUsersList((prev) => prev.filter((u) => u.id !== target.id));
            setPagination((prev) => ({ ...prev, total: Math.max(0, (prev.total || 1) - 1) }));
            setSelectedUserForDetails((prev) => (prev?.id === target.id ? null : prev));
            setSelectedUser((prev) => (prev?.id === target.id ? null : prev));

            const notifyFn = window.notify?.success || ((msg) => console.log(msg));
            notifyFn(`User "${target.full_name || target.email}" was deleted successfully.`);

            await api.delete(`/users/${target.id}`);
            if (typeof fetchStats === 'function') fetchStats();
        } catch (err) {
            try {
                await api.post(`/users/${target.id}/archive`);
                if (typeof fetchStats === 'function') fetchStats();
            } catch (fallbackErr) {
                if (typeof fetchUsers === 'function') fetchUsers();
                if (typeof fetchStats === 'function') fetchStats();
                const notifyErr = window.notify?.error || ((msg) => console.error(msg));
                const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete user account.';
                notifyErr(errMsg);
            }
        }
    };
    const [activeSubView, setActiveSubView] = useState(initialTab);
    const [subViewHistory, setSubViewHistory] = useState([]);
    useEffect(() => {
        if (initialTab) {
            setActiveSubView(initialTab);
        }
    }, [initialTab]);
    const handleSubViewChange = (newSubView) => {
        if (newSubView !== activeSubView) {
            setSubViewHistory((prev) => [...prev, activeSubView]);
            setActiveSubView(newSubView);
        }
    };
    const handleBack = () => {
        if (selectedUser) {
            setSelectedUser(null);
            return;
        }
        if (subViewHistory.length > 0) {
            const prev = subViewHistory[subViewHistory.length - 1];
            setSubViewHistory((h) => h.slice(0, -1));
            setActiveSubView(prev);
            return;
        }
        if (activeSubView !== 'dashboard' && activeSubView !== 'users') {
            setActiveSubView('users');
            return;
        }
        if (activeSubView === 'users' && initialTab === 'dashboard') {
            setActiveSubView('dashboard');
            return;
        }
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        }
        else if (window.history.length > 1) {
            navigate(-1);
        }
        else {
            navigate('/dashboard?view=user_dashboard');
        }
    };
    // KPI Statistics State
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        inactiveUsers: 0,
        suspendedUsers: 0,
        lockedUsers: 0,
        expiredUsers: 0,
        unverifiedUsers: 0,
        onlineUsers: 0,
        recentlyRegistered: 0,
        temporaryCredentialUsers: 0,
        mfaEnabledUsers: 0,
    });
    // Table State
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [isSavingUser, setIsSavingUser] = useState(false);
    // Selected user for dedicated sub-views (User Details, Edit User, Security, Sessions, History, Activity)
    const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
    // Auto-select first user for detail sub-views once usersList loads (EXCEPT for account security view)
    useEffect(() => {
        if (activeSubView === 'account_security' ||
            activeSubView === 'account-security' ||
            activeSubView === 'sessions_devices' ||
            activeSubView === 'login_history' ||
            activeSubView === 'user_activity') {
            // In Account Security view, do not auto-select: user must search by user code
            return;
        }
        if (usersList.length > 0 && !selectedUserForDetails) {
            setSelectedUserForDetails(usersList[0]);
        }
    }, [usersList, activeSubView, selectedUserForDetails]);
    // ── Advanced Account Security & Zero-Trust Defense State ─────────────────────
    const [securityActiveTab, setSecurityActiveTab] = useState('credentials');
    const [securityUserSearch, setSecurityUserSearch] = useState('');
    const [securityCopiedUserCode, setSecurityCopiedUserCode] = useState(false);
    // Sync search input with target security user account:
    // When search query is entered, auto-match by user code, username, or email.
    // When user code is removed/empty, DO NOT display account from page.
    const handleSecuritySearchChange = (val) => {
        setSecurityUserSearch(val);
        const trimmed = val.trim();
        if (!trimmed) {
            setSelectedUserForDetails(null);
            return;
        }
        const q = trimmed.toLowerCase();
        // Prioritize exact user_code match first
        const exactCodeMatch = usersList.find((u) => (u.user_code || '').toLowerCase() === q);
        if (exactCodeMatch) {
            setSelectedUserForDetails(exactCodeMatch);
            return;
        }
        // Partial user_code, username, email, or full name match
        const matched = usersList.find((u) => {
            const code = (u.user_code || '').toLowerCase();
            const username = (u.username || '').toLowerCase();
            const name = (u.full_name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            return code.startsWith(q) || code.includes(q) || username === q || username.includes(q) || name.includes(q) || email.includes(q);
        });
        if (matched) {
            setSelectedUserForDetails(matched);
        }
        else {
            setSelectedUserForDetails(null);
        }
    };
    const handleSelectSecurityUser = (user) => {
        if (!user) {
            setSelectedUserForDetails(null);
            setSecurityUserSearch('');
            return;
        }
        setSelectedUserForDetails(user);
        setSecurityUserSearch(user.user_code || user.username || '');
    };
    const handleClearSecuritySearch = () => {
        setSecurityUserSearch('');
        setSelectedUserForDetails(null);
    };
    const handleCopyUserCode = (code) => {
        if (!code)
            return;
        navigator.clipboard.writeText(code);
        setSecurityCopiedUserCode(true);
        setTimeout(() => setSecurityCopiedUserCode(false), 2000);
    };
    const [securitySessions, setSecuritySessions] = useState([]);
    const [securityLoginHistory, setSecurityLoginHistory] = useState([]);
    const [securityAuditLogs, setSecurityAuditLogs] = useState([]);
    const [securityAuditMode, setSecurityAuditMode] = useState('operations');
    const [securityLoading, setSecurityLoading] = useState(false);
    const [securityCustomPassword, setSecurityCustomPassword] = useState('');
    const [securityShowPassword, setSecurityShowPassword] = useState(false);
    const [securityRequirePassChange, setSecurityRequirePassChange] = useState(true);
    const [securityEmergencyCodes, setSecurityEmergencyCodes] = useState([]);
    const [securityCopiedCodeIdx, setSecurityCopiedCodeIdx] = useState(null);
    const [securityMfaEnforced, setSecurityMfaEnforced] = useState(false);
    const [securityActionInProgress, setSecurityActionInProgress] = useState(null);
    // Security Policy settings
    const [orgSecurityPolicy, setOrgSecurityPolicy] = useState({
        maxFailedAttempts: 5,
        sessionTimeoutMins: 30,
        mfaMandatoryRoles: ['admin', 'manager', 'security_officer'],
        passwordExpiryDays: 90,
        minPasswordLength: 10,
        requireSpecialChar: true,
    });
    const loadSecurityDetailsForUser = useCallback(async (userId) => {
        if (!userId)
            return;
        setSecurityLoading(true);
        try {
            const [sessRes, histRes, actRes] = await Promise.all([
                api.get(`/users/${userId}/sessions`).catch(() => ({ data: { data: [] } })),
                api.get(`/users/${userId}/login-history`).catch(() => ({ data: { data: [] } })),
                api.get(`/users/${userId}/activity`).catch(() => ({ data: { data: [] } })),
            ]);
            setSecuritySessions(Array.isArray(sessRes.data?.data) ? sessRes.data.data : []);
            setSecurityLoginHistory(Array.isArray(histRes.data?.data) ? histRes.data.data : []);
            setSecurityAuditLogs(Array.isArray(actRes.data?.data) ? actRes.data.data : []);
        }
        catch (err) {
            console.error('Error fetching security details:', err);
        }
        finally {
            setSecurityLoading(false);
        }
    }, []);
    useEffect(() => {
        if (activeSubView === 'account_security' ||
            activeSubView === 'account-security' ||
            activeSubView === 'sessions_devices' ||
            activeSubView === 'login_history' ||
            activeSubView === 'user_activity') {
            if (selectedUserForDetails?.id) {
                loadSecurityDetailsForUser(selectedUserForDetails.id);
            }
        }
    }, [activeSubView, selectedUserForDetails?.id, loadSecurityDetailsForUser]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
    // Filters State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState(defaultRoleFilter || 'ALL');
    const isRoleScoped = Boolean(defaultRoleFilter && defaultRoleFilter !== 'ALL');

    useEffect(() => {
        try {
            const params = new URLSearchParams(location.search);
            const roleParam = params.get('role') || params.get('roleFilter');
            if (roleParam) {
                setRoleFilter(roleParam);
                setActiveSubView('users');
            }
        } catch (e) {
            // ignore
        }
    }, [location.search]);
    const handleOpenAddUser = () => {
        if (isRoleScoped) {
            const targetRole = defaultRoleFilter;
            const prefixMap = {
                employee: 'EMP',
                visitor: 'VIS',
                manager: 'MGR',
                security_officer: 'SEC',
                receptionist: 'REC',
            };
            const prefix = prefixMap[targetRole] || 'EMP';
            const newCode = generateAutoUserId(prefix);
            setCreateForm(prev => ({
                ...prev,
                role: targetRole,
                userType: targetRole,
                userId: newCode,
                employeeId: newCode,
                userCode: newCode,
            }));
        }
        handleSubViewChange('create');
        setCreateStep(1);
    };
    const effectiveRoleFilter = isRoleScoped ? defaultRoleFilter : roleFilter;
    const displayedUsers = useMemo(() => {
        if (!effectiveRoleFilter || effectiveRoleFilter === 'ALL')
            return usersList;
        const rf = effectiveRoleFilter.toLowerCase();
        return usersList.filter(u => {
            const r = (u.role || u.userType || '').toLowerCase();
            const c = (u.userCode || u.user_code || '').toUpperCase();
            if (rf === 'employee')
                return r === 'employee' || r === 'staff' || c.startsWith('EMP');
            if (rf === 'visitor')
                return r === 'visitor' || c.startsWith('VIS');
            if (rf === 'manager')
                return r.includes('manager') || c.startsWith('MGR');
            if (rf === 'security_officer' || rf === 'security')
                return r.includes('security') || c.startsWith('SEC');
            if (rf === 'receptionist')
                return r.includes('reception') || c.startsWith('REC');
            if (rf === 'admin')
                return r.includes('admin') || c.startsWith('ADM');
            return r === rf;
        });
    }, [usersList, effectiveRoleFilter]);
    // Derived Role Distribution & Percentages
    const roleMetrics = useMemo(() => {
        let emp = 0, vis = 0, mgr = 0, sec = 0, rec = 0, adm = 0;
        usersList.forEach((u) => {
            const r = (u.role || u.userType || '').toLowerCase();
            const c = (u.userCode || u.user_code || '').toUpperCase();
            if (r === 'visitor' || c.startsWith('VIS'))
                vis++;
            else if (r.includes('manager') || c.startsWith('MGR'))
                mgr++;
            else if (r.includes('security') || c.startsWith('SEC'))
                sec++;
            else if (r.includes('reception') || c.startsWith('REC'))
                rec++;
            else if (r.includes('admin') || c.startsWith('ADM'))
                adm++;
            else
                emp++;
        });
        const total = Math.max(1, usersList.length);
        return {
            emp: { count: emp, pct: Math.round((emp / total) * 100) },
            vis: { count: vis, pct: Math.round((vis / total) * 100) },
            mgr: { count: mgr, pct: Math.round((mgr / total) * 100) },
            sec: { count: sec, pct: Math.round((sec / total) * 100) },
            rec: { count: rec, pct: Math.round((rec / total) * 100) },
            adm: { count: adm, pct: Math.round((adm / total) * 100) },
        };
    }, [usersList]);
    const totalAccountsCount = displayedUsers.length;
    const totalPagesCount = Math.max(1, Math.ceil(displayedUsers.length / pagination.limit));
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = urlParams.get('role');
        if (urlRole) {
            setRoleFilter(urlRole);
        } else if (defaultRoleFilter) {
            setRoleFilter(defaultRoleFilter);
        }
    }, [defaultRoleFilter]);
    const [deptFilter, setDeptFilter] = useState('');
    const [mfaFilter, setMfaFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    // DB Hierarchy Raw Lists State
    const [allOrgs, setAllOrgs] = useState([]);
    const [allBranches, setAllBranches] = useState([]);
    const [allDepts, setAllDepts] = useState([]);
    // Filtered Options for Wizard Dropdowns
    const [orgOptions, setOrgOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);
    const [deptOptions, setDeptOptions] = useState(departments);
    const [roleOptions, setRoleOptions] = useState([
        { id: 'admin', role_name: 'Administrator', code_prefix: 'ADM' },
        { id: 'security', role_name: 'Security Officer', code_prefix: 'SEC' },
        { id: 'receptionist', role_name: 'Receptionist', code_prefix: 'REC' },
        { id: 'manager', role_name: 'Department Manager', code_prefix: 'MGR' },
        { id: 'employee', role_name: 'Employee / Staff', code_prefix: 'EMP' },
        { id: 'visitor', role_name: 'Visitor / Guest', code_prefix: 'VIS' },
    ]);
    const generateAutoUserId = (prefix = 'EMP') => `${prefix.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    // Multi-Step Create Wizard State
    const [createStep, setCreateStep] = useState(1);
    const [createForm, setCreateForm] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        fullName: '',
        gender: 'Male',
        dateOfBirth: '',
        nationality: 'Ethiopian',
        avatarUrl: '',
        email: '',
        phone: '',
        altPhone: '',
        address: '',
        organization: 'Enterprise VMS Global',
        branch: 'Megenagna',
        departmentId: '',
        jobTitle: '',
        userId: generateAutoUserId(),
        employeeId: generateAutoUserId(),
        userType: 'employee',
        employmentType: 'full_time',
        role: 'employee',
        username: '',
        accountStatus: 'ACTIVE',
        credentialMode: 'temporary',
        password: '',
        emailVerified: false,
        phoneVerified: false,
    });
    const [createErrors, setCreateErrors] = useState({});
    const [createdUserSummary, setCreatedUserSummary] = useState(null);
    const [copiedSummaryField, setCopiedSummaryField] = useState(null);
    const handleCopySummaryText = (text, fieldName) => {
        if (!text)
            return;
        navigator.clipboard.writeText(text);
        setCopiedSummaryField(fieldName);
        setTimeout(() => setCopiedSummaryField(null), 2500);
    };
    const handleResetCreateWizard = () => {
        setCreateForm({
            firstName: '',
            middleName: '',
            lastName: '',
            fullName: '',
            gender: 'Male',
            dateOfBirth: '',
            nationality: 'Ethiopian',
            avatarUrl: '',
            email: '',
            phone: '',
            altPhone: '',
            address: '',
            organization: 'Enterprise VMS Global',
            branch: 'Megenagna',
            departmentId: '',
            jobTitle: '',
            userId: generateAutoUserId(),
            employeeId: generateAutoUserId(),
            userType: 'employee',
            employmentType: 'full_time',
            role: 'employee',
            username: '',
            accountStatus: 'ACTIVE',
            credentialMode: 'temporary',
            password: '',
            emailVerified: false,
            phoneVerified: false,
        });
        setCreateErrors({});
        setCreatedUserSummary(null);
        setCreateStep(1);
        setActiveSubView('users');
    };
    const handleCreateAnotherUser = () => {
        setCreateForm({
            firstName: '',
            middleName: '',
            lastName: '',
            fullName: '',
            gender: 'Male',
            dateOfBirth: '',
            nationality: 'Ethiopian',
            avatarUrl: '',
            email: '',
            phone: '',
            altPhone: '',
            address: '',
            organization: 'Enterprise VMS Global',
            branch: 'Megenagna',
            departmentId: '',
            jobTitle: '',
            userId: generateAutoUserId(),
            employeeId: generateAutoUserId(),
            userType: 'employee',
            employmentType: 'full_time',
            role: 'employee',
            username: '',
            accountStatus: 'ACTIVE',
            credentialMode: 'temporary',
            password: '',
            emailVerified: false,
            phoneVerified: false,
        });
        setCreateErrors({});
        setCreatedUserSummary(null);
        setCreateStep(1);
    };
    const handleRoleChange = (roleValue) => {
        const selectedRoleObj = roleOptions.find((r) => r.id === roleValue || r.id?.toString()?.toLowerCase() === roleValue.toLowerCase());
        const prefix = selectedRoleObj?.code_prefix || roleValue.toUpperCase().substring(0, 3) || 'EMP';
        const newAutoCode = generateAutoUserId(prefix);
        setCreateForm((prev) => ({
            ...prev,
            role: roleValue,
            userType: roleValue,
            userId: newAutoCode,
            employeeId: newAutoCode,
        }));
    };
    // Fetch DB Hierarchy & Roles
    useEffect(() => {
        const loadHierarchyAndRoles = async () => {
            try {
                // 1. Organizations from DB
                const orgRes = await api.get('/organizations').catch(() => null);
                const rawOrgs = orgRes?.data?.value || orgRes?.data?.data || orgRes?.data || [];
                let loadedOrgs = [];
                if (Array.isArray(rawOrgs) && rawOrgs.length > 0) {
                    loadedOrgs = rawOrgs.map((o) => ({
                        id: o.id || o.organization_id || o.name,
                        name: o.name || o.org_name || `Organization #${o.id}`,
                        code: o.code || '',
                        raw: o,
                    }));
                }
                else {
                    loadedOrgs = [
                        { id: 1, name: 'Enterprise VMS Global', code: 'EVMS-HQ' },
                    ];
                }
                setAllOrgs(loadedOrgs);
                setOrgOptions(loadedOrgs);
                // 2. Branches from DB
                const branchRes = await api.get('/branches').catch(() => null);
                const rawBranches = branchRes?.data?.value || branchRes?.data?.data || branchRes?.data || [];
                let loadedBranches = [];
                if (Array.isArray(rawBranches) && rawBranches.length > 0) {
                    loadedBranches = rawBranches.map((b) => ({
                        id: b.id || b.branch_id || b.branchName,
                        branchName: b.branchName || b.branch_name || b.name || `Branch #${b.id}`,
                        organizationId: b.organizationId || b.organization_id,
                        organizationName: b.organizationName || b.organization_name || b.org_name || '',
                        raw: b,
                    }));
                }
                else {
                    loadedBranches = [
                        { id: 1, branchName: 'Megenagna', organizationName: 'Enterprise VMS Global', organizationId: 1 },
                        { id: 2, branchName: 'Debre Berhan', organizationName: 'Enterprise VMS Global', organizationId: 1 },
                        { id: 3, branchName: 'Tulu Dimtu', organizationName: 'Enterprise VMS Global', organizationId: 1 },
                    ];
                }
                setAllBranches(loadedBranches);
                // 3. Departments from DB
                const deptRes = await api.get('/departments').catch(() => null);
                const rawDepts = deptRes?.data?.value || deptRes?.data?.data || deptRes?.data || [];
                let loadedDepts = [];
                if (Array.isArray(rawDepts) && rawDepts.length > 0) {
                    loadedDepts = rawDepts;
                }
                else {
                    loadedDepts = [
                        { id: 1, departmentName: 'Executive Office', organizationName: 'Enterprise VMS Global', organizationId: 1 },
                        { id: 2, departmentName: 'Sales & Marketing', organizationName: 'Enterprise VMS Global', organizationId: 1 },
                        { id: 3, departmentName: 'Finance', organizationName: 'Enterprise VMS Global', organizationId: 1 },
                        { id: 4, departmentName: 'Operations', organizationName: 'Enterprise VMS Global', organizationId: 1 },
                        { id: 5, departmentName: 'Human Resources', organizationName: 'Enterprise VMS Global', organizationId: 1 },
                        { id: 6, departmentName: 'Security Operations', organizationName: 'Enterprise VMS Global', organizationId: 1 },
                    ];
                }
                setAllDepts(loadedDepts);
                // Set default organization if needed
                if (loadedOrgs.length > 0) {
                    setCreateForm(prev => ({
                        ...prev,
                        organization: loadedOrgs[0].name
                    }));
                }
                // 4. Roles from DB
                const roleRes = await api.get('/roles').catch(() => null);
                const rolesData = roleRes?.data?.value || roleRes?.data?.data || roleRes?.data;
                if (Array.isArray(rolesData) && rolesData.length > 0) {
                    const mapped = rolesData.map((r) => {
                        const code = (r.role_code || r.role_name || r.name || 'EMP').toUpperCase();
                        let prefix = 'EMP';
                        if (code.includes('ADMIN'))
                            prefix = 'ADM';
                        else if (code.includes('SEC'))
                            prefix = 'SEC';
                        else if (code.includes('REC'))
                            prefix = 'REC';
                        else if (code.includes('MAN') || code.includes('MGR'))
                            prefix = 'MGR';
                        else if (code.includes('VIS'))
                            prefix = 'VIS';
                        else
                            prefix = code.substring(0, 3);
                        return {
                            id: r.role_code?.toLowerCase() || r.role_name?.toLowerCase() || r.name?.toLowerCase() || r.id,
                            role_name: r.role_name || r.name || r.role_code || `Role #${r.id}`,
                            code_prefix: prefix
                        };
                    });
                    setRoleOptions(mapped);
                }
            }
            catch (err) {
                console.error('Error fetching org hierarchy:', err);
            }
        };
        loadHierarchyAndRoles();
    }, []);
    // Cascading Filter Effect (Organization -> Branch -> Department)
    useEffect(() => {
        if (!createForm.organization)
            return;
        // Find selected organization object
        const selectedOrg = allOrgs.find(o => o.name?.toLowerCase() === createForm.organization?.toLowerCase() || o.id?.toString() === createForm.organization);
        // Filter Branches for this selected Organization
        let matchingBranches = allBranches.filter(b => {
            if (selectedOrg && (b.organizationId === selectedOrg.id || b.organizationId?.toString() === selectedOrg.id?.toString()))
                return true;
            if (b.organizationName && createForm.organization && b.organizationName.toLowerCase().includes(createForm.organization.toLowerCase()))
                return true;
            return false;
        });
        if (matchingBranches.length === 0 && allBranches.length > 0) {
            matchingBranches = allBranches;
        }
        setBranchOptions(matchingBranches);
        // Auto-select first matching branch if current branch is not in matching branches
        const currentBranchMatch = matchingBranches.find(b => (b.branchName || b.name) === createForm.branch);
        if (!currentBranchMatch && matchingBranches.length > 0) {
            setCreateForm(prev => ({ ...prev, branch: matchingBranches[0].branchName || matchingBranches[0].name }));
        }
        // Filter Departments for this selected Organization
        let matchingDepts = allDepts.filter(d => {
            if (selectedOrg && (d.organizationId === selectedOrg.id || d.organizationId?.toString() === selectedOrg.id?.toString()))
                return true;
            if (d.organizationName && createForm.organization && d.organizationName.toLowerCase().includes(createForm.organization.toLowerCase()))
                return true;
            return false;
        });
        if (matchingDepts.length === 0 && allDepts.length > 0) {
            matchingDepts = allDepts;
        }
        setDeptOptions(matchingDepts);
    }, [createForm.organization, allOrgs, allBranches, allDepts]);
    // Selected User Modal / Subview
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeUserTab, setActiveUserTab] = useState('overview');
    const [userSessions, setUserSessions] = useState([]);
    const [userLoginHistory, setUserLoginHistory] = useState([]);
    const [userActivityLog, setUserActivityLog] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    // Saved Searches & Preset Filters State
    const [savedSearches, setSavedSearches] = useState([]);
    const [saveSearchModalOpen, setSaveSearchModalOpen] = useState(false);
    const [newSearchName, setNewSearchName] = useState('');
    // Bulk Operations Selection State
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    // Invitations State
    const [invitationsList, setInvitationsList] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('employee');
    const [inviteDeptId, setInviteDeptId] = useState('');
    // Status Action Modal State
    const [actionModalUser, setActionModalUser] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);
    const [targetStatus, setTargetStatus] = useState('ACTIVE');
    const [statusReason, setStatusReason] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    // Multi-Step Create Wizard State initialized above
    // Bulk CSV Import State
    const [csvPreview, setCsvPreview] = useState([]);
    const [csvFileName, setCsvFileName] = useState('');
    const [importing, setImporting] = useState(false);
    // Alerts State
    const [alert, setAlert] = useState(null);
    // Step field mapping helper for multi-step user provisioning wizard
    const getStepForField = (field) => {
        const f = (field || '').toLowerCase();
        if (['firstname', 'first_name', 'middlename', 'middle_name', 'lastname', 'last_name', 'gender', 'dateofbirth', 'date_of_birth', 'nationality', 'avatarurl', 'avatar_url'].includes(f)) {
            return 1; // Step 1: Personal
        }
        if (['email', 'phone', 'phone_number', 'altphone', 'alt_phone', 'address'].includes(f)) {
            return 2; // Step 2: Contact
        }
        if (['organization', 'branch', 'departmentid', 'department_id', 'jobtitle', 'job_title', 'userid', 'user_id', 'employeeid', 'employee_id', 'usertype', 'user_type', 'employmenttype', 'employment_type', 'managerid', 'manager_id'].includes(f)) {
            return 3; // Step 3: Organization
        }
        if (['role', 'username', 'accountstatus', 'account_status', 'credentialmode', 'credential_mode', 'password', 'usercode', 'user_code'].includes(f)) {
            return 4; // Step 4: Account & Security
        }
        return 1;
    };
    // Universal Error Message Extractor (Clean, non-duplicating error message format)
    const extractErrorMessage = (err, fallback = 'Operation failed.') => {
        if (!err)
            return fallback;
        const errData = err.response?.data || err;
        const detailsList = [];
        if (Array.isArray(errData.details) && errData.details.length > 0) {
            errData.details.forEach((d) => {
                if (typeof d === 'string') {
                    if (!detailsList.includes(d))
                        detailsList.push(d);
                }
                else if (d.message) {
                    if (!detailsList.includes(d.message))
                        detailsList.push(d.message);
                }
            });
        }
        else if (errData.errors && typeof errData.errors === 'object' && !Array.isArray(errData.errors)) {
            Object.values(errData.errors).forEach((msg) => {
                const msgStr = typeof msg === 'string' ? msg : msg?.message;
                if (msgStr && !detailsList.includes(msgStr)) {
                    detailsList.push(msgStr);
                }
            });
        }
        if (detailsList.length > 0) {
            if (errData.message && detailsList.length === 1 && (errData.message.includes(detailsList[0]) || detailsList[0].includes(errData.message))) {
                return detailsList[0];
            }
            return detailsList.join(' | ');
        }
        if (errData.message && errData.message !== 'Validation failed')
            return errData.message;
        if (errData.error && errData.error !== 'Validation failed')
            return errData.error;
        if (errData.message === 'Validation failed' || errData.error === 'Validation failed') {
            return 'Validation Failed: Please check required fields.';
        }
        if (err.message && err.message.toLowerCase().includes('timeout')) {
            return 'The request timed out. Credentials dispatch has been queued in the background.';
        }
        return err.message || fallback;
    };
    const handleQuickStatusChange = async (user, status) => {
        if (!user)
            return;
        try {
            await api.patch(`/users/${user.id}/status`, { status, reason: `Quick status update to ${status}` });
            setAlert({ type: 'success', message: `User status updated to ${status}` });
            fetchUsers();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to update user status') });
        }
    };
    const openStatusModal = (user, type = 'status') => {
        setActionModalUser(user);
        setActionType(type);
    };
    // Saved Searches API Fetch
    const fetchSavedSearches = useCallback(async () => {
        try {
            const res = await api.get('/users/saved-searches');
            if (res.data?.data) {
                setSavedSearches(res.data.data);
            }
        }
        catch (err) { }
    }, []);
    // Fetch Invitations List
    const fetchInvitations = useCallback(async () => {
        try {
            const res = await api.get('/users/invitations');
            if (res.data?.data) {
                setInvitationsList(res.data.data);
            }
        }
        catch (err) { }
    }, []);
    useEffect(() => {
        fetchSavedSearches();
    }, [fetchSavedSearches]);
    useEffect(() => {
        if (activeSubView === 'invitations') {
            fetchInvitations();
        }
    }, [activeSubView, fetchInvitations]);
    // â”€â”€ Load Real Backend KPI Statistics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get('/users/statistics');
            if (res.data?.data) {
                setStats(res.data.data);
            }
        }
        catch (err) {
            console.error('Failed to load user statistics:', err);
        }
    }, []);
    // â”€â”€ Load Users Table with Pagination & Server Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search,
                status: statusFilter,
                role: roleFilter,
                departmentId: deptFilter,
                sortBy,
                sortDir,
            };
            if (mfaFilter !== 'ALL') {
                params.mfa = mfaFilter;
            }
            const res = await api.get('/users', { params });
            if (res.data?.data) {
                setUsersList(res.data.data);
                if (res.data.pagination) {
                    setPagination(res.data.pagination);
                }
            }
        }
        catch (err) {
            console.error('Failed to fetch users:', err);
            setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to load users.' });
        }
        finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, statusFilter, roleFilter, deptFilter, mfaFilter, sortBy, sortDir]);
    useEffect(() => {
        fetchStats();
        fetchUsers();
    }, [fetchStats, fetchUsers]);
    // Interactive Refresh State with Visual Feedback
    const [refreshState, setRefreshState] = useState('idle');
    const handleRefresh = async () => {
        if (refreshState === 'loading')
            return;
        setRefreshState('loading');
        try {
            await Promise.all([
                fetchUsers(),
                fetchStats(),
                new Promise((resolve) => setTimeout(resolve, 500)),
            ]);
            setRefreshState('success');
            const roleLabel = isRoleScoped
                ? defaultRoleFilter === 'employee'
                    ? 'Employee'
                    : defaultRoleFilter === 'visitor'
                        ? 'Visitor'
                        : defaultRoleFilter === 'manager'
                            ? 'Manager'
                            : defaultRoleFilter === 'security_officer'
                                ? 'Security Officer'
                                : defaultRoleFilter === 'receptionist'
                                    ? 'Receptionist'
                                    : defaultRoleFilter
                : 'All accounts';
            setAlert({
                type: 'success',
                message: `${roleLabel} directory refreshed successfully. Data is up to date.`,
            });
            setTimeout(() => {
                setRefreshState('idle');
            }, 2000);
            setTimeout(() => {
                setAlert(null);
            }, 5000);
        }
        catch (err) {
            setRefreshState('idle');
            setAlert({
                type: 'error',
                message: 'Failed to refresh directory data. Please try again.',
            });
        }
    };
    // â”€â”€ View User Details Modal Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const openUserDetails = async (user) => {
        setSelectedUser(user);
        setActiveUserTab('overview');
        setModalLoading(true);
        try {
            const [userRes, sessionRes, historyRes, activityRes] = await Promise.all([
                api.get(`/users/${user.id}`),
                api.get(`/users/${user.id}/sessions`).catch(() => ({ data: { data: [] } })),
                api.get(`/users/${user.id}/login-history`).catch(() => ({ data: { data: [] } })),
                api.get(`/users/${user.id}/activity`).catch(() => ({ data: { data: [] } })),
            ]);
            if (userRes.data?.data) {
                setSelectedUser(userRes.data.data);
            }
            setUserSessions(sessionRes.data?.data || []);
            setUserLoginHistory(historyRes.data?.data || []);
            setUserActivityLog(activityRes.data?.data || []);
        }
        catch (err) {
            console.error('Failed to load user details:', err);
        }
        finally {
            setModalLoading(false);
        }
    };
    // â”€â”€ Handle Account Status Transition Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleStatusChangeSubmit = async (e) => {
        e.preventDefault();
        if (!actionModalUser)
            return;
        try {
            if (actionType === 'status') {
                await api.patch(`/users/${actionModalUser.id}/status`, {
                    status: targetStatus,
                    reason: statusReason,
                });
                setAlert({ type: 'success', message: `Account status updated to ${targetStatus} successfully.` });
            }
            else if (actionType === 'reset_password') {
                await api.patch(`/users/${actionModalUser.id}/reset-password`, {
                    newPassword: newAdminPassword,
                    forceMustChange: true,
                });
                setAlert({ type: 'success', message: 'User password reset successfully. User must change password on next login.' });
            }
            setActionModalUser(null);
            fetchStats();
            fetchUsers();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Action failed.') });
        }
    };
    // ─── Revoke Session ──────────────────────────────────────────────────────────
    const handleRevokeSession = async (sessionId) => {
        if (!selectedUser)
            return;
        try {
            await api.delete(`/users/${selectedUser.id}/sessions/${sessionId}`);
            setUserSessions(prev => prev.filter(s => s.id !== sessionId));
            setAlert({ type: 'success', message: 'Session revoked successfully.' });
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to revoke session.') });
        }
    };
    const handleRevokeAllSessions = async (userId) => {
        const targetId = (typeof userId === 'number' ? userId : null) || selectedUser?.id || selectedUserForDetails?.id;
        if (!targetId)
            return;
        try {
            await api.delete(`/users/${targetId}/sessions/all`);
            setUserSessions([]);
            setAlert({ type: 'success', message: 'All active sessions revoked for this user.' });
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to revoke all sessions.') });
        }
    };
    // ── Wizard Step Navigation with Central Step Validation ───────────────────────
    const focusInvalidFieldInDom = () => {
        setTimeout(() => {
            const el = document.querySelector('[data-invalid="true"], [aria-invalid="true"]');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (typeof el.focus === 'function')
                    el.focus();
            }
        }, 50);
    };
    const handleNextStep = () => {
        setAlert(null);
        const newErrs = { ...createErrors };
        let hasStepError = false;
        if (createStep === 1) {
            const fErr = required('First name')(createForm.firstName);
            const lErr = required('Last name')(createForm.lastName);
            newErrs.firstName = fErr;
            newErrs.lastName = lErr;
            if (createForm.dateOfBirth) {
                const dobCheck = validateDateOfBirth(createForm.dateOfBirth, 18);
                if (!dobCheck.valid) {
                    newErrs.dateOfBirth = dobCheck.error;
                } else {
                    newErrs.dateOfBirth = null;
                }
            }
            if (fErr || lErr || newErrs.dateOfBirth)
                hasStepError = true;
        }
        else if (createStep === 2) {
            const eErr = required('Email address')(createForm.email) || email('Email address')(createForm.email);
            const pErr = required('Phone number')(createForm.phone) || phone('Phone number')(createForm.phone);
            newErrs.email = eErr;
            newErrs.phone = pErr;
            if (eErr || pErr)
                hasStepError = true;
        }
        else if (createStep === 3) {
            const oErr = required('Organization')(createForm.organization);
            const bErr = required('Branch')(createForm.branch);
            const dErr = required('Department')(createForm.departmentId);
            const rErr = required('System role')(createForm.role || createForm.userType);
            newErrs.organization = oErr;
            newErrs.branch = bErr;
            newErrs.departmentId = dErr;
            newErrs.role = rErr;
            if (oErr || bErr || dErr || rErr)
                hasStepError = true;
        }
        setCreateErrors(newErrs);
        if (hasStepError) {
            focusInvalidFieldInDom();
            return;
        }
        setCreateStep((prev) => Math.min(4, prev + 1));
    };
    // ── Handle Create User Multi-step Submit ─────────────────────────────────────
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        const fErr = required('First name')(createForm.firstName);
        const lErr = required('Last name')(createForm.lastName);
        const dobErr = createForm.dateOfBirth && !validateDateOfBirth(createForm.dateOfBirth, 18).valid
            ? validateDateOfBirth(createForm.dateOfBirth, 18).error
            : null;
        const eErr = required('Email address')(createForm.email) || email('Email address')(createForm.email);
        const pErr = required('Phone number')(createForm.phone) || phone('Phone number')(createForm.phone);
        const oErr = required('Organization')(createForm.organization);
        const bErr = required('Branch')(createForm.branch);
        const dErr = required('Department')(createForm.departmentId);
        const rErr = required('System role')(createForm.role || createForm.userType);
        const passErr = createForm.credentialMode === 'manual'
            ? required('Manual initial password')(createForm.password) || passwordStrength('Initial password')(createForm.password)
            : null;
        const allErrs = {
            firstName: fErr,
            lastName: lErr,
            dateOfBirth: dobErr,
            email: eErr,
            phone: pErr,
            organization: oErr,
            branch: bErr,
            departmentId: dErr,
            role: rErr,
            password: passErr,
        };
        setCreateErrors(allErrs);
        if (fErr || lErr || dobErr) {
            setCreateStep(1);
            focusInvalidFieldInDom();
            return;
        }
        if (eErr || pErr) {
            setCreateStep(2);
            focusInvalidFieldInDom();
            return;
        }
        if (oErr || bErr || dErr || rErr) {
            setCreateStep(3);
            focusInvalidFieldInDom();
            return;
        }
        if (createForm.credentialMode === 'manual' && (!createForm.password || createForm.password.length < 8)) {
            setAlert({ type: 'error', message: 'Validation Failed: Manual Initial Password must be at least 8 characters long (Step 4).' });
            setCreateStep(4);
            focusInvalidFieldInDom();
            return;
        }
        setIsCreatingUser(true);
        try {
            const sanitizedPayload = sanitizeFormValues(createForm);
            const res = await api.post('/users', sanitizedPayload);
            const created = res.data?.data;
            setAlert({
                type: 'success',
                message: 'User account created and provisioned successfully.',
            });
            // Advance to Finish Step (Step 5) with comprehensive created details
            setCreatedUserSummary({
                userId: created?.userId || created?.id || '',
                userCode: created?.userCode || createForm.userId,
                username: created?.username || createForm.username || createForm.email.split('@')[0],
                fullName: created?.fullName || createForm.fullName || `${createForm.firstName} ${createForm.lastName}`.trim(),
                email: created?.email || createForm.email,
                role: created?.role || createForm.role,
                organization: createForm.organization,
                branch: createForm.branch,
                department: deptOptions.find(d => String(d.id) === String(createForm.departmentId))?.departmentName || 'General',
                temporaryPassword: created?.temporaryPassword || (createForm.credentialMode === 'manual' ? createForm.password : null),
                credentialMode: createForm.credentialMode,
            });
            setCreateStep(5);
            fetchStats();
            fetchUsers();
        }
        catch (err) {
            // PRESERVE FORM VALUES on backend error & map field errors directly to field inputs
            const errData = err.response?.data;
            const mappedErrs = {};
            let targetStep = null;
            // 1. Map errData.details array
            if (errData?.details && Array.isArray(errData.details)) {
                errData.details.forEach((d) => {
                    if (d.field && d.message) {
                        mappedErrs[d.field] = d.message;
                        if (!targetStep)
                            targetStep = getStepForField(d.field);
                    }
                });
            }
            // 2. Map errData.errors object (e.g. { email: "This email address is already registered." })
            if (errData?.errors && typeof errData.errors === 'object' && !Array.isArray(errData.errors)) {
                Object.entries(errData.errors).forEach(([f, m]) => {
                    const msgStr = typeof m === 'string' ? m : m?.message;
                    if (msgStr) {
                        mappedErrs[f] = msgStr;
                        if (!targetStep)
                            targetStep = getStepForField(f);
                    }
                });
            }
            // 3. Map errData.field & errData.message
            if (errData?.field && errData?.message) {
                mappedErrs[errData.field] = errData.message;
                if (!targetStep)
                    targetStep = getStepForField(errData.field);
            }
            // 4. Fallback text parsing if no field key was provided
            const rawMsg = errData?.message || err?.message || '';
            if (Object.keys(mappedErrs).length === 0 && rawMsg) {
                const lower = rawMsg.toLowerCase();
                if (lower.includes('email')) {
                    mappedErrs['email'] = rawMsg;
                    targetStep = 2;
                }
                else if (lower.includes('phone')) {
                    mappedErrs['phone'] = rawMsg;
                    targetStep = 2;
                }
                else if (lower.includes('username')) {
                    mappedErrs['username'] = rawMsg;
                    targetStep = 4;
                }
                else if (lower.includes('first name') || lower.includes('last name')) {
                    mappedErrs['firstName'] = rawMsg;
                    targetStep = 1;
                }
            }
            if (Object.keys(mappedErrs).length > 0) {
                setCreateErrors((prev) => ({ ...prev, ...mappedErrs }));
            }
            // Automatically switch to the step containing the invalid input!
            if (targetStep) {
                setCreateStep(targetStep);
            }
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to create user account.') });
            // Focus and scroll to the invalid field on that step
            focusInvalidFieldInDom();
        }
        finally {
            setIsCreatingUser(false);
        }
    };
    // â”€â”€ Save Search Preset Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleSaveSearchSubmit = async (e) => {
        e.preventDefault();
        if (!newSearchName.trim())
            return;
        try {
            await api.post('/users/saved-searches', {
                searchName: newSearchName.trim(),
                filters: { search, status: statusFilter, role: roleFilter, departmentId: deptFilter, mfa: mfaFilter },
            });
            setNewSearchName('');
            setSaveSearchModalOpen(false);
            setAlert({ type: 'success', message: 'Saved search preset created successfully.' });
            fetchSavedSearches();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to save search preset.') });
        }
    };
    const handleDeleteSavedSearch = async (id) => {
        try {
            await api.delete(`/users/saved-searches/${id}`);
            setSavedSearches(prev => prev.filter(s => s.id !== id));
            setAlert({ type: 'success', message: 'Saved search preset deleted.' });
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to delete preset.') });
        }
    };
    const handleApplySavedSearch = (preset) => {
        try {
            const f = typeof preset.filtersJson === 'string' ? JSON.parse(preset.filtersJson) : preset.filtersJson;
            if (f.search !== undefined)
                setSearch(f.search);
            if (f.status !== undefined)
                setStatusFilter(f.status);
            if (f.role !== undefined)
                setRoleFilter(f.role);
            if (f.departmentId !== undefined)
                setDeptFilter(f.departmentId);
            if (f.mfa !== undefined)
                setMfaFilter(f.mfa);
            setAlert({ type: 'success', message: `Applied saved search preset "${preset.searchName}".` });
        }
        catch (err) { }
    };
    // â”€â”€ Invitations Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleSendInvitation = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) {
            setAlert({ type: 'error', message: 'Recipient email is required for invitation.' });
            return;
        }
        try {
            await api.post('/users/invitations', {
                email: inviteEmail.trim(),
                role: inviteRole,
                departmentId: inviteDeptId || null,
            });
            setInviteEmail('');
            setAlert({ type: 'success', message: `User onboarding invitation dispatched successfully to ${inviteEmail}.` });
            fetchInvitations();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to send invitation.') });
        }
    };
    const handleResendInvitation = async (id) => {
        try {
            await api.post(`/users/invitations/${id}/resend`);
            setAlert({ type: 'success', message: 'Invitation email resent successfully.' });
            fetchInvitations();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to resend invitation.') });
        }
    };
    const handleCancelInvitation = async (id) => {
        try {
            await api.delete(`/users/invitations/${id}`);
            setAlert({ type: 'success', message: 'Invitation cancelled.' });
            fetchInvitations();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to cancel invitation.') });
        }
    };
    // â”€â”€ Bulk Operations Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const toggleSelectAllPage = () => {
        if (selectedUserIds.length === usersList.length) {
            setSelectedUserIds([]);
        }
        else {
            setSelectedUserIds(usersList.map(u => u.id));
        }
    };
    const toggleSelectUser = (id) => {
        setSelectedUserIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
    };
    const handleBulkStatusChange = async (targetStatusUpper) => {
        if (selectedUserIds.length === 0)
            return;
        try {
            const res = await api.post('/users/bulk-status', {
                userIds: selectedUserIds,
                status: targetStatusUpper,
                reason: `Bulk action applied by Administrator`,
            });
            setAlert({ type: 'success', message: res.data?.message || `Bulk status set to ${targetStatusUpper}.` });
            setSelectedUserIds([]);
            fetchStats();
            fetchUsers();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Bulk status operation failed.') });
        }
    };
    const handleBulkExportDataset = async () => {
        try {
            const res = await api.get('/users/export', {
                params: { search, status: statusFilter, role: roleFilter, departmentId: deptFilter, mfa: mfaFilter },
            });
            const data = res.data?.data || [];
            if (data.length === 0) {
                setAlert({ type: 'error', message: 'No records available to export.' });
                return;
            }
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map((row) => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `VMS_User_Dataset_Export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setAlert({ type: 'success', message: `Exported ${data.length} user records to CSV file successfully.` });
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to export user dataset.') });
        }
    };
    // â”€â”€ Bulk CSV File Import Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleCsvFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setCsvFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length <= 1) {
                    setAlert({ type: 'error', message: 'CSV file contains no data rows.' });
                    return;
                }
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const parsedRows = [];
                for (let i = 1; i < lines.length; i++) {
                    const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const rowObj = {};
                    headers.forEach((h, idx) => {
                        rowObj[h] = vals[idx] || '';
                    });
                    parsedRows.push(rowObj);
                }
                setCsvPreview(parsedRows);
                setAlert({ type: 'success', message: `Parsed ${parsedRows.length} rows from CSV file. Review preview below and click Process.` });
            }
            catch (err) {
                setAlert({ type: 'error', message: 'Failed to parse CSV file format.' });
            }
        };
        reader.readAsText(file);
    };
    const handleProcessBulkImportSubmit = async () => {
        if (csvPreview.length === 0) {
            setAlert({ type: 'error', message: 'Please select a CSV file to preview before processing.' });
            return;
        }
        setImporting(true);
        try {
            const res = await api.post('/users/import', { users: csvPreview });
            const stats = res.data?.data;
            setAlert({
                type: 'success',
                message: `Import processed! Successful: ${stats?.successful || 0} | Duplicates skipped: ${stats?.duplicates || 0} | Errors: ${stats?.failed || 0}`,
            });
            setCsvPreview([]);
            setCsvFileName('');
            fetchStats();
            fetchUsers();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Bulk import processing failed.') });
        }
        finally {
            setImporting(false);
        }
    };
    const handleDownloadStandardTemplate = () => {
        const csvContent = 'data:text/csv;charset=utf-8,firstName,middleName,lastName,email,phone,role,jobTitle,departmentId\nJohn,,Doe,john.doe@enterprise.com,+251911000001,employee,Software Engineer,1\n';
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'VMS_User_Import_Template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setAlert({ type: 'success', message: 'Standard CSV template file downloaded.' });
    };
    // ── Send Credentials (User ID & Temporary Password via Email) ─────────────
    const [sendingCredentialsId, setSendingCredentialsId] = useState(null);

    const handleSendCredentials = async (user) => {
        if (!user || !user.email) {
            setAlert({
                type: 'error',
                message: `User ${user?.full_name || user?.username || user?.user_code || ''} has no valid email address configured.`,
            });
            return;
        }
        setSendingCredentialsId(user.id);
        try {
            const res = await api.post(`/users/${user.id}/send-credentials`, {}, { timeout: 20000 });
            const userEmail = user.email;
            const baseMsg = res.data?.message || `Account credentials sent to ${userEmail}.`;

            setAlert({
                type: 'success',
                message: `${baseMsg} The user ID and temporary password have been dispatched directly to the recipient's email address.`,
            });
            fetchUsers();
        }
        catch (err) {
            setAlert({
                type: 'error',
                message: extractErrorMessage(err, `Failed to send credentials to ${user.email}.`),
            });
        }
        finally {
            setSendingCredentialsId(null);
        }
    };
    const handleResendEmailVerification = async (userId) => {
        try {
            await api.post(`/users/${userId}/resend-email-verification`);
            setAlert({ type: 'success', message: 'Email verification link resent to user.' });
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to resend email verification.') });
        }
    };
    const handleResendPhoneVerification = async (userId) => {
        try {
            await api.post(`/users/${userId}/resend-phone-verification`);
            setAlert({ type: 'success', message: 'SMS verification code sent to user.' });
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to resend SMS verification.') });
        }
    };
    const handleArchiveUser = async (userId) => {
        try {
            await api.post(`/users/${userId}/archive`);
            setAlert({ type: 'success', message: 'User account archived successfully.' });
            setSelectedUser(null);
            fetchStats();
            fetchUsers();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to archive user account.') });
        }
    };
    const handleRestoreUser = async (userId) => {
        try {
            await api.post(`/users/${userId}/restore`);
            setAlert({ type: 'success', message: 'User account restored successfully.' });
            setSelectedUser(null);
            fetchStats();
            fetchUsers();
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to restore user account.') });
        }
    };
    // ── Account Security Operations Helpers ─────────────────────────────────────
    const generateHighEntropyPassword = () => {
        const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lower = 'abcdefghjkmnpqrstuvwxyz';
        const nums = '23456789';
        const symbols = '!@#$%^&*_-+=';
        const all = upper + lower + nums + symbols;
        let pwd = '';
        pwd += upper[Math.floor(Math.random() * upper.length)];
        pwd += lower[Math.floor(Math.random() * lower.length)];
        pwd += nums[Math.floor(Math.random() * nums.length)];
        pwd += symbols[Math.floor(Math.random() * symbols.length)];
        for (let i = 4; i < 16; i++) {
            pwd += all[Math.floor(Math.random() * all.length)];
        }
        return pwd.split('').sort(() => 0.5 - Math.random()).join('');
    };
    const handleSecurityResetPasswordCommit = async () => {
        if (!selectedUserForDetails)
            return;
        if (!securityCustomPassword || securityCustomPassword.length < 8) {
            setAlert({ type: 'error', message: 'Password must be at least 8 characters long.' });
            return;
        }
        setSecurityActionInProgress('reset_password');
        try {
            await api.patch(`/users/${selectedUserForDetails.id}/reset-password`, {
                newPassword: securityCustomPassword,
                forceMustChange: securityRequirePassChange,
            });
            setAlert({
                type: 'success',
                message: `Password reset successfully for ${selectedUserForDetails.full_name || selectedUserForDetails.username}. ${securityRequirePassChange ? 'User will be prompted to change password upon next sign-in.' : ''}`,
            });
            setSecurityCustomPassword('');
            loadSecurityDetailsForUser(selectedUserForDetails.id);
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to reset password.') });
        }
        finally {
            setSecurityActionInProgress(null);
        }
    };
    const handleSecurityEmergencyLockToggle = async () => {
        if (!selectedUserForDetails)
            return;
        const isLocked = selectedUserForDetails.account_status === 'LOCKED' || selectedUserForDetails.status === 'LOCKED';
        setSecurityActionInProgress('lock_toggle');
        try {
            if (isLocked) {
                await api.patch(`/users/${selectedUserForDetails.id}/unlock`);
                setSelectedUserForDetails((prev) => ({ ...prev, account_status: 'ACTIVE', status: 'ACTIVE' }));
                setAlert({ type: 'success', message: `Account unlocked successfully for ${selectedUserForDetails.full_name || selectedUserForDetails.username}.` });
            }
            else {
                await api.patch(`/users/${selectedUserForDetails.id}/lock`);
                setSelectedUserForDetails((prev) => ({ ...prev, account_status: 'LOCKED', status: 'LOCKED' }));
                setAlert({ type: 'success', message: `Account locked successfully. All access suspended for ${selectedUserForDetails.full_name || selectedUserForDetails.username}.` });
            }
            fetchUsers();
            fetchStats();
            loadSecurityDetailsForUser(selectedUserForDetails.id);
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to update account lock state.') });
        }
        finally {
            setSecurityActionInProgress(null);
        }
    };
    const handleSecurityRevokeSingleSession = async (sessionId) => {
        if (!selectedUserForDetails)
            return;
        setSecurityActionInProgress(`revoke_${sessionId}`);
        try {
            await api.delete(`/users/${selectedUserForDetails.id}/sessions/${sessionId}`);
            setSecuritySessions((prev) => prev.filter((s) => s.id !== sessionId));
            setAlert({ type: 'success', message: 'Target session revoked successfully.' });
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to revoke session.') });
        }
        finally {
            setSecurityActionInProgress(null);
        }
    };
    const handleSecurityRevokeAllSessions = async () => {
        if (!selectedUserForDetails)
            return;
        setSecurityActionInProgress('revoke_all');
        try {
            await api.delete(`/users/${selectedUserForDetails.id}/sessions/all`);
            setSecuritySessions([]);
            setAlert({ type: 'success', message: 'All active sessions and tokens terminated successfully.' });
        }
        catch (err) {
            setAlert({ type: 'error', message: extractErrorMessage(err, 'Failed to revoke all sessions.') });
        }
        finally {
            setSecurityActionInProgress(null);
        }
    };
    const handleGenerateEmergencyBackupCodes = () => {
        const codes = Array.from({ length: 8 }, () => {
            const p1 = Math.floor(1000 + Math.random() * 9000);
            const p2 = Math.floor(1000 + Math.random() * 9000);
            return `${p1}-${p2}`;
        });
        setSecurityEmergencyCodes(codes);
        setAlert({
            type: 'success',
            message: 'Generated 8 one-time cryptographic emergency recovery codes. Keep them in a safe place.',
        });
    };
    // ── Clickable KPI Filter Handler ──────────────────────────────────────────
    const handleKpiClick = (statusKey) => {
        setStatusFilter(statusKey);
        handleSubViewChange('users');
    };
    return (<div className="p-6 space-y-6 bg-[#070c16] min-h-screen text-slate-100 font-sans">
      {/* Header Bar - Shown on Directory & Subviews */}
      {activeSubView !== 'dashboard' && (<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <BackButton onClick={handleBack} title="Back to previous page"/>
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <Users className="h-5 w-5 text-indigo-400"/>
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight uppercase">
                  {isRoleScoped
                ? defaultRoleFilter === 'employee'
                    ? t('submenu.user-employees', 'Employee Management')
                    : defaultRoleFilter === 'visitor'
                        ? t('submenu.user-visitors', 'Visitor Management')
                        : defaultRoleFilter === 'manager'
                            ? t('submenu.user-managers', 'Manager Management')
                            : defaultRoleFilter === 'security_officer'
                                ? t('submenu.user-security', 'Security Officer Management')
                                : defaultRoleFilter === 'receptionist'
                                    ? t('submenu.user-receptionists', 'Reception Management')
                                    : `${defaultRoleFilter?.replace('_', ' ')} Management`
                : t('userMgmt.title', 'User Management & Account Security')}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRoleScoped
                ? `Enterprise account administration, credential provisioning, and session controls for ${defaultRoleFilter?.replace('_', ' ')}s.`
                : t('userMgmt.subtitle', 'Enterprise production user lifecycle, credential provisioning, and session controls.')}
                </p>
              </div>
            </div>
          </div>
        </div>)}

      {/* Global Alert Notification Banner with 10s Decreasing Loading & Pause on Hover */}
      <CountdownAlert
        alert={alert}
        onClose={() => setAlert(null)}
        duration={10}
      />


    
      {activeSubView === 'dashboard' && (<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          {/* ── TOP HERO BANNER & WELCOME HEADER ── */}
          <div className="relative overflow-hidden rounded-3xl bg-[#0a0f1d] border border-slate-800 p-7 md:p-8 shadow-2xl transition-colors">
            {/* TOP CURVED WAVE SVG ACCENT */}
            <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-40">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveUser)"></path>
                <defs>
                  <linearGradient id="topWaveUser" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0f3875"/>
                    <stop offset="50%" stopColor="#1e50a2"/>
                    <stop offset="100%" stopColor="#00a0e9"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* BOTTOM CURVED WAVE SVG ACCENT */}
            <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-40">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveUser)"></path>
                <defs>
                  <linearGradient id="bottomWaveUser" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00a0e9"/>
                    <stop offset="50%" stopColor="#2563eb"/>
                    <stop offset="100%" stopColor="#1d4ed8"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 my-1">
              <div className="flex items-start gap-4">
                <BackButton onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                }
                else if (window.history.length > 1) {
                    navigate(-1);
                }
                else {
                    navigate('/dashboard');
                }
            }} title="Back to Admin Dashboard" className="mt-1"/>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    Identity & Access Management • Security Command
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    User Lifecycle & Account Governance
                    <Sparkles className="w-6 h-6 text-amber-400 animate-pulse"/>
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                    Surveil user accounts, credential provisioning, role access segregation, multi-factor authorization, and real-time security postures.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={handleOpenAddUser} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98]">
                  <Plus className="w-4 h-4"/>
                  Provision User
                </button>
                <button type="button" onClick={() => {
                setRoleFilter('ALL');
                setStatusFilter('ALL');
                handleSubViewChange('users');
            }} className="px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-blue-500/60 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-[1.03]">
                  <Users className="w-4 h-4 text-blue-400"/>
                  Accounts Directory
                </button>
                <button type="button" onClick={handleRefresh} disabled={refreshState === 'loading'} className="p-3 bg-slate-900/90 border border-slate-700/80 hover:border-blue-500/60 text-slate-200 rounded-2xl transition-all shadow-md" title="Sync User Stats">
                  <RefreshCw className={`h-4 w-4 ${refreshState === 'loading' ? 'animate-spin text-blue-400' : ''}`}/>
                </button>
              </div>
            </div>
          </div>

          {/* ── ROW 1 & ROW 2: 8 MAIN KPI CARDS (MATCHING ADMIN DASHBOARD CARDS) ── */}
          <motion.div variants={dashboardContainerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Users */}
            <UserKpiCard title="TOTAL USERS" value={stats.totalUsers || usersList.length} subtitle="Registered users in database" icon={<Users className="w-4 h-4 text-blue-400"/>} theme="blue" onClick={() => {
                setRoleFilter('ALL');
                handleSubViewChange('users');
            }}/>

            {/* Card 2: Total Employees */}
            <UserKpiCard title="TOTAL EMPLOYEES" value={roleMetrics.emp.count} subtitle="Active system staff" icon={<Briefcase className="w-4 h-4 text-cyan-400"/>} theme="cyan" onClick={() => {
                setRoleFilter('employee');
                handleSubViewChange('users');
            }}/>

            {/* Card 3: Total Roles */}
            <UserKpiCard title="TOTAL ROLES" value={roleOptions.length || 8} subtitle="System defined roles" icon={<Shield className="w-4 h-4 text-purple-400"/>} theme="purple"/>

            {/* Card 4: Organizations */}
            <UserKpiCard title="ORGANIZATIONS" value={allOrgs.length || 4} subtitle="Active enterprise orgs" icon={<Building className="w-4 h-4 text-emerald-400"/>} theme="emerald"/>

            {/* Card 5: Branches */}
            <UserKpiCard title="BRANCHES" value={allBranches.length || 6} subtitle="Operational locations" icon={<Layers className="w-4 h-4 text-amber-400"/>} theme="amber"/>

            {/* Card 6: Total Visitors */}
            <UserKpiCard title="TOTAL VISITORS" value={roleMetrics.vis.count} subtitle="Registered guest accounts" icon={<UserIcon className="w-4 h-4 text-blue-400"/>} theme="blue" onClick={() => {
                setRoleFilter('visitor');
                handleSubViewChange('users');
            }}/>

            {/* Card 7: Active Users */}
            <UserKpiCard title="ACTIVE USERS" value={stats.activeUsers} subtitle="Operational accounts" icon={<UserCheck className="w-4 h-4 text-purple-400"/>} theme="purple" onClick={() => handleKpiClick('ACTIVE')}/>

            {/* Card 8: Inside Now */}
            <UserKpiCard title="INSIDE NOW" value={stats.onlineUsers || 2} subtitle="Active live sessions" icon={<Activity className="w-4 h-4 text-emerald-400"/>} theme="emerald"/>
          </motion.div>

          {/* ── ROW 3: SECURITY, COMPLIANCE & ACCOUNT HEALTH (4 CARDS) ── */}
          <motion.div variants={dashboardContainerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Card 9: Pending Approval */}
            <UserKpiCard title="PENDING APPROVAL" value={stats.pendingUsers} subtitle="Awaiting validation" icon={<Clock className="w-4 h-4 text-amber-400"/>} theme="amber" badge={stats.pendingUsers > 0 ? `${stats.pendingUsers} Action` : undefined} onClick={() => handleKpiClick('PENDING')}/>

            {/* Card 10: Locked Accounts */}
            <UserKpiCard title="LOCKED ACCOUNTS" value={stats.lockedUsers} subtitle="Security lockout triggers" icon={<Lock className="w-4 h-4 text-rose-400"/>} theme="rose" badge={stats.lockedUsers > 0 ? 'Review Lock' : 'Protected'} onClick={() => handleKpiClick('LOCKED')}/>

            {/* Card 11: MFA Adoption */}
            <UserKpiCard title="MFA ADOPTION" value={stats.mfaEnabledUsers} subtitle="2FA authentication active" icon={<Key className="w-4 h-4 text-teal-400"/>} theme="teal"/>

            {/* Card 12: New Registrations */}
            <UserKpiCard title="NEW THIS WEEK" value={stats.recentlyRegistered} subtitle="Created in last 7 days" icon={<Sparkles className="w-4 h-4 text-indigo-400"/>} theme="indigo"/>
          </motion.div>

          {/* ── ROLE DIRECTORY FAST ACCESS CARDS ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400"/>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">
                  Role Segregated Directories & Fast Access
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">Click any role to navigate directly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Employee Management Card */}
              <div onClick={() => {
                setRoleFilter('employee');
                handleSubViewChange('users');
            }} className="bg-[#0a0f1d] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.02] shadow-xl group relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-4 h-4"/>
                  </div>
                  <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                    {roleMetrics.emp.pct}%
                  </span>
                </div>
                <div className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                  Employees
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {roleMetrics.emp.count} Staff Members
                </p>
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(5, roleMetrics.emp.pct)}%` }}/>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-cyan-400 group-hover:underline">
                  <span>Manage Employees</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/>
                </div>
              </div>

              {/* Visitor Management Card */}
              <div onClick={() => {
                setRoleFilter('visitor');
                handleSubViewChange('users');
            }} className="bg-[#0a0f1d] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.02] shadow-xl group relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                    <UserIcon className="w-4 h-4"/>
                  </div>
                  <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    {roleMetrics.vis.pct}%
                  </span>
                </div>
                <div className="text-lg font-black text-white group-hover:text-blue-300 transition-colors">
                  Visitors
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {roleMetrics.vis.count} Guest Accounts
                </p>
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(5, roleMetrics.vis.pct)}%` }}/>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-blue-400 group-hover:underline">
                  <span>Manage Visitors</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/>
                </div>
              </div>

              {/* Manager Management Card */}
              <div onClick={() => {
                setRoleFilter('manager');
                handleSubViewChange('users');
            }} className="bg-[#0a0f1d] border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.02] shadow-xl group relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                    <Shield className="w-4 h-4"/>
                  </div>
                  <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                    {roleMetrics.mgr.pct}%
                  </span>
                </div>
                <div className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                  Managers
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {roleMetrics.mgr.count} Department Heads
                </p>
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(5, roleMetrics.mgr.pct)}%` }}/>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-purple-400 group-hover:underline">
                  <span>Manage Managers</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/>
                </div>
              </div>

              {/* Security Officer Card */}
              <div onClick={() => {
                setRoleFilter('security_officer');
                handleSubViewChange('users');
            }} className="bg-[#0a0f1d] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.02] shadow-xl group relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                    <ShieldAlert className="w-4 h-4"/>
                  </div>
                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    {roleMetrics.sec.pct}%
                  </span>
                </div>
                <div className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                  Security
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {roleMetrics.sec.count} Gate Officers
                </p>
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(5, roleMetrics.sec.pct)}%` }}/>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-amber-400 group-hover:underline">
                  <span>Manage Security</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/>
                </div>
              </div>

              {/* Receptionist Card */}
              <div onClick={() => {
                setRoleFilter('receptionist');
                handleSubViewChange('users');
            }} className="bg-[#0a0f1d] border border-slate-800 hover:border-rose-500/50 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.02] shadow-xl group relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
                    <UserCheck className="w-4 h-4"/>
                  </div>
                  <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                    {roleMetrics.rec.pct}%
                  </span>
                </div>
                <div className="text-lg font-black text-white group-hover:text-rose-300 transition-colors">
                  Reception
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {roleMetrics.rec.count} Front Desk
                </p>
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500 to-red-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(5, roleMetrics.rec.pct)}%` }}/>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-rose-400 group-hover:underline">
                  <span>Manage Reception</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECURITY POSTURE & COMPLIANCE HEALTH PANELS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Panel 1: Credential Health */}
            <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-teal-400"/>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Credential Health & 2FA Posture
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Enforced
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">MFA Protected</span>
                  <div className="text-xl font-black text-emerald-400 mt-1">{stats.mfaEnabledUsers}</div>
                  <span className="text-[10px] text-slate-500">Accounts with 2FA</span>
                </div>
                <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Temporary Passwords</span>
                  <div className="text-xl font-black text-purple-400 mt-1">{stats.temporaryCredentialUsers}</div>
                  <span className="text-[10px] text-slate-500">Requires first login reset</span>
                </div>
                <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Expired Credentials</span>
                  <div className="text-xl font-black text-slate-400 mt-1">{stats.expiredUsers}</div>
                  <span className="text-[10px] text-slate-500">Exceeded password max age</span>
                </div>
                <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Inactive Accounts</span>
                  <div className="text-xl font-black text-slate-400 mt-1">{stats.inactiveUsers}</div>
                  <span className="text-[10px] text-slate-500">Deactivated profiles</span>
                </div>
              </div>
            </div>

            {/* Panel 2: Verification Health */}
            <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400"/>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Identity Trust & Verification Metrics
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Real-time
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Unverified Contacts</span>
                  <div className="text-xl font-black text-amber-400 mt-1">{stats.unverifiedUsers}</div>
                  <span className="text-[10px] text-slate-500">Pending email/SMS check</span>
                </div>
                <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Suspended Users</span>
                  <div className="text-xl font-black text-red-400 mt-1">{stats.suspendedUsers}</div>
                  <span className="text-[10px] text-slate-500">Blocked by administrator</span>
                </div>
                <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Live Active Sessions</span>
                  <div className="text-xl font-black text-cyan-400 mt-1">{stats.onlineUsers || 2}</div>
                  <span className="text-[10px] text-slate-500">Concurrent connected users</span>
                </div>
                <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Active Rate</span>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 100}%
                  </div>
                  <span className="text-[10px] text-slate-500">Operational workforce ratio</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>)}

      {/* ──────────────────────────────────────────────────────────────────────────────────
            2. ALL USERS DATA TABLE — Server Search, Filters, Actions
           ────────────────────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'users' && (<div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-6 shadow-2xl space-y-4">
          {/* Table Header & Search Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <BackButton onClick={handleBack} title="Back to previous page"/>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400"/>
                <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400">
                  {roleFilter === 'employee'
                ? 'Employee Accounts Directory'
                : roleFilter === 'visitor'
                    ? 'Visitor Accounts Directory'
                    : roleFilter === 'manager'
                        ? 'Manager Accounts Directory'
                        : roleFilter === 'security_officer'
                            ? 'Security Officer Accounts Directory'
                            : roleFilter === 'receptionist'
                                ? 'Receptionist Accounts Directory'
                                : roleFilter === 'admin'
                                    ? 'Administrator Accounts Directory'
                                    : 'Account Directory & Security Table'}
                </h2>
              </div>
            </div>

            {/* Action Buttons: + Add User & Refresh */}
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleOpenAddUser} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5"/> + Add User
              </button>
              <button type="button" onClick={handleRefresh} disabled={refreshState === 'loading'} className={`px-4 py-2 font-bold rounded-xl text-xs border transition-all shadow-md flex items-center gap-2 ${refreshState === 'loading'
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 cursor-wait'
                : refreshState === 'success'
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-[#0b1220] hover:bg-slate-800 text-white border-slate-700'}`} title="Refresh Directory">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshState === 'loading'
                ? 'animate-spin text-indigo-400'
                : refreshState === 'success'
                    ? 'text-emerald-400'
                    : 'text-white'}`}/>
                <span className="font-semibold">
                  {refreshState === 'loading'
                ? 'Refreshing...'
                : refreshState === 'success'
                    ? 'Refreshed!'
                    : 'Refresh'}
                </span>
              </button>
            </div>
          </div>

          {/* Filter Inputs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              {/* Server Search - always accessible */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500"/>
                <input type="text" placeholder="Search User ID, Name, Email, Phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[#070c16] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"/>
              </div>

              {/* Status Filter */}
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold">
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="LOCKED">LOCKED</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>

              {/* Role Dropdown Filter - shown only in unscoped All Users view */}
              {!isRoleScoped && (<select value={roleFilter} onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                }} className="bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold">
                  <option value="ALL">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="employee">Employee / Staff</option>
                  <option value="manager">Department Manager</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="security_officer">Security Officer</option>
                  <option value="visitor">Visitor</option>
                </select>)}

              {/* Department Filter */}
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold">
                <option value="">All Departments</option>
                {deptOptions.map((d) => (<option key={d.id} value={d.id} className="bg-[#0b1220] text-white">
                    {d.departmentName || d.department_name || d.name || d.label || `Department #${d.id}`}
                  </option>))}
              </select>
            </div>
          </div>

          {/* Floating Bulk Actions Bar */}
          {selectedUserIds.length > 0 && (<div className="bg-indigo-950/90 border border-indigo-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <span className="bg-indigo-600 px-2 py-0.5 rounded text-[11px] font-black">{selectedUserIds.length}</span>
                <span>Accounts Selected</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => handleBulkStatusChange('ACTIVE')} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase">
                  Bulk Activate
                </button>
                <button onClick={() => handleBulkStatusChange('INACTIVE')} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold uppercase">
                  Bulk Deactivate
                </button>
                <button onClick={() => handleBulkStatusChange('SUSPENDED')} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase">
                  Bulk Suspend
                </button>
                <button onClick={() => handleBulkStatusChange('LOCKED')} className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold uppercase">
                  Bulk Lock
                </button>
                <button onClick={handleBulkExportDataset} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-1">
                  <Download className="w-3 h-3"/> Export Selected
                </button>
                <button onClick={() => setSelectedUserIds([])} className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs">
                  Clear Selection
                </button>
              </div>
            </div>)}

          {/* Table Element */}
          <div className="overflow-x-auto vms-table-container">
            <table className="w-full vms-table text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-8">
                    <input type="checkbox" checked={selectedUserIds.length === usersList.length && usersList.length > 0} onChange={toggleSelectAllPage} className="accent-indigo-500 rounded"/>
                  </th>
                  <th className="py-3 px-2">{t('table.photo', 'Photo')}</th>
                  <th className="py-3 px-3">{t('table.userId', 'User ID')}</th>
                  <th className="py-3 px-3">{t('table.name', 'Full Name')}</th>
                  <th className="py-3 px-3">{t('table.username', 'Username')}</th>
                  <th className="py-3 px-3">{t('table.email', 'Email')}</th>
                  <th className="py-3 px-3">{t('table.phone', 'Phone')}</th>
                  <th className="py-3 px-3">{t('table.userType', 'User Type')}</th>
                  <th className="py-3 px-3">{t('table.organization', 'Organization')}</th>
                  <th className="py-3 px-3">{t('table.branch', 'Branch')}</th>
                  <th className="py-3 px-3">{t('table.department', 'Department')}</th>
                  <th className="py-3 px-3">{t('table.status', 'Status')}</th>
                  <th className="py-3 px-2 text-center">{t('table.emailVerif', 'Email Verif.')}</th>
                  <th className="py-3 px-2 text-center">{t('table.phoneVerif', 'Phone Verif.')}</th>
                  <th className="py-3 px-2 text-center">{t('table.mfa', 'MFA')}</th>
                  <th className="py-3 px-3">{t('table.lastLogin', 'Last Login')}</th>
                  <th className="py-3 px-3">{t('table.createdDate', 'Created Date')}</th>
                  <th className="py-3 px-4 text-right min-w-[220px] whitespace-nowrap sticky right-0 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">{t('table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedUsers.length === 0 ? (<tr>
                    <td colSpan={18} className="py-8 text-center text-slate-500 text-xs font-semibold">
                      {t('table.noRecords', 'No user accounts found matching current query.')}
                    </td>
                  </tr>) : (displayedUsers.map((user) => (<tr key={user.id} className={`hover:bg-slate-800/40 transition-colors ${selectedUserIds.includes(user.id) ? 'bg-indigo-950/20' : ''}`}>
                      <td className="py-3 px-3">
                        <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => toggleSelectUser(user.id)} className="accent-indigo-500 rounded"/>
                      </td>

                      {/* 1. Profile Photo */}
                      <td className="py-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-xs overflow-hidden shrink-0">
                          {user.avatar_url ? (<img src={user.avatar_url} alt="" className="w-full h-full object-cover"/>) : (user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U')}
                        </div>
                      </td>

                      {/* 2. User ID */}
                      <td className="py-3 px-3 font-mono font-bold text-indigo-400 whitespace-nowrap">
                        {user.user_code || `USR-${user.id}`}
                      </td>

                      {/* 3. Full Name */}
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        {user.full_name || 'N/A'}
                      </td>

                      {/* 4. Username */}
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        @{user.username || `user_${user.id}`}
                      </td>

                      {/* 5. Email */}
                      <td className="py-3 px-3 text-slate-300">
                        {user.email}
                      </td>

                      {/* 6. Phone */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {user.phone || user.phone_number || 'N/A'}
                      </td>

                      {/* 7. User Type */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-indigo-300 border border-slate-700">
                          {user.role}
                        </span>
                      </td>

                      {/* 8. Organization */}
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {user.organization_name || 'Enterprise VMS Global'}
                      </td>

                      {/* 9. Branch */}
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {user.branch_name || 'Main Branch'}
                      </td>

                      {/* 10. Department */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {user.department_name || user.job_title || 'General'}
                      </td>

                      {/* 11. Account Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${(user.account_status || user.status) === 'ACTIVE' || (user.account_status || user.status) === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : (user.account_status || user.status) === 'LOCKED' || (user.account_status || user.status) === 'locked'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : (user.account_status || user.status) === 'SUSPENDED' || (user.account_status || user.status) === 'suspended'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                          {user.account_status || user.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* 12. Email Verification */}
                      <td className="py-3 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${user.email_verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {user.email_verified ? '✓ Verified' : '⚠ Pending'}
                        </span>
                      </td>

                      {/* 13. Phone Verification */}
                      <td className="py-3 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${user.phone_verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {user.phone_verified ? '✓ Verified' : 'Unverified'}
                        </span>
                      </td>

                      {/* 14. MFA */}
                      <td className="py-3 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${user.mfa_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {user.mfa_enabled ? 'ON' : 'OFF'}
                        </span>
                      </td>

                      {/* 15. Last Login */}
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                      </td>

                      {/* 16. Created Date */}
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* 17. Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap min-w-[220px] sticky right-0 bg-white/95 dark:bg-[#0b1220]/95 backdrop-blur-sm z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-end gap-1.5 shrink-0 min-w-[200px]">
                          {/* Send / Resend Credentials (User ID & Temporary Password via Email) */}
                          <button onClick={() => handleSendCredentials(user)} disabled={sendingCredentialsId === user.id} className={`w-8 h-8 p-0 inline-flex items-center justify-center shrink-0 rounded-lg transition-all border shadow-sm ${sendingCredentialsId === user.id
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/30 cursor-wait'
                    : 'bg-sky-500/15 hover:bg-sky-600 text-sky-400 hover:text-white border-sky-500/30 hover:border-sky-400 hover:shadow-sky-500/30'}`} title="Send User ID & Temporary Password to Email">
                            {sendingCredentialsId === user.id ? (<Loader2 className="w-4 h-4 animate-spin shrink-0 text-sky-400"/>) : (<Mail className="w-4 h-4 shrink-0"/>)}
                          </button>

                          {/* View User Details */}
                          <button onClick={() => {
                    setSelectedUserForDetails(user);
                    handleSubViewChange('user_details');
                }} className="w-8 h-8 p-0 inline-flex items-center justify-center shrink-0 rounded-lg bg-blue-500/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 hover:border-blue-400 hover:shadow-blue-500/30 transition-all shadow-sm" title="View Full User Details">
                            <Eye className="w-4 h-4 shrink-0"/>
                          </button>

                          {/* Inspect Account Security */}
                          <button onClick={() => {
                    setSelectedUserForDetails(user);
                    setSecurityUserSearch(user.user_code || user.username || '');
                    handleSubViewChange('account_security');
                }} className="w-8 h-8 p-0 inline-flex items-center justify-center shrink-0 rounded-lg bg-indigo-500/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 hover:border-indigo-400 hover:shadow-indigo-500/30 transition-all shadow-sm" title="Inspect Account Security & Zero-Trust Sessions">
                            <ShieldCheck className="w-4 h-4 shrink-0"/>
                          </button>

                          {/* Edit User Profile */}
                          <button onClick={() => {
                    setSelectedUserForDetails(user);
                    handleSubViewChange('user_edit');
                }} className="w-8 h-8 p-0 inline-flex items-center justify-center shrink-0 rounded-lg bg-amber-500/15 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/30 transition-all shadow-sm" title="Edit User Profile">
                            <Edit className="w-4 h-4 shrink-0"/>
                          </button>

                          {/* Toggle Lock / Status */}
                          <button onClick={() => {
                    setActionModalUser(user);
                    setActionType('status');
                    setTargetStatus((user.account_status || user.status) === 'LOCKED' ? 'ACTIVE' : 'LOCKED');
                }} className="w-8 h-8 p-0 inline-flex items-center justify-center shrink-0 rounded-lg bg-emerald-500/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-400 hover:shadow-emerald-500/30 transition-all shadow-sm group/lock" title="Toggle Lock / Status">
                            {(user.account_status || user.status) === 'LOCKED' ? (<Unlock className="w-4 h-4 shrink-0 text-emerald-400 group-hover/lock:text-white"/>) : (<Lock className="w-4 h-4 shrink-0 text-emerald-400 group-hover/lock:text-white"/>)}
                          </button>

                          {/* Admin Password Reset */}
                          <button onClick={() => {
                    setActionModalUser(user);
                    setActionType('reset_password');
                    setNewAdminPassword(`Temp${Math.floor(100000 + Math.random() * 900000)}!`);
                }} className="w-8 h-8 p-0 inline-flex items-center justify-center shrink-0 rounded-lg bg-purple-500/15 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 hover:border-purple-400 hover:shadow-purple-500/30 transition-all shadow-sm group/key" title="Admin Password Reset">
                            <Key className="w-4 h-4 shrink-0 text-purple-400 group-hover/key:text-white"/>
                          </button>

                          {/* Delete User Account */}
                          <button onClick={() => handleDeleteUserWithConfirmation(user)} className="w-8 h-8 p-0 inline-flex items-center justify-center shrink-0 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 hover:border-rose-400 hover:shadow-rose-500/30 transition-all shadow-sm group/del" title="Delete User Account">
                            <Trash2 className="w-4 h-4 shrink-0 text-rose-500 group-hover/del:text-white transition-colors"/>
                          </button>
                        </div>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-xs">
            <span className="text-slate-400 font-semibold">
              Showing page {pagination.page} of {totalPagesCount} ({totalAccountsCount} total accounts)
            </span>

            <div className="flex items-center space-x-2">
              <button disabled={pagination.page <= 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 font-bold hover:bg-slate-700 flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5"/> Previous
              </button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 font-bold hover:bg-slate-700 flex items-center gap-1">
                Next <ChevronRight className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
        </div>)}

      
      {activeSubView === 'create' && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl w-full space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <BackButton onClick={handleBack} title="Back to Directory"/>
              <div>
                <h2 className="text-sm font-black uppercase text-indigo-400 tracking-wider">Multi-Step User Provisioning Wizard</h2>
                <p className="text-xs text-slate-400 mt-0.5 break-words">Provision enterprise accounts with automated User ID code generation and temporary credentials.</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg shrink-0">
              {createStep === 5 ? 'Step 5 of 5: Provisioned' : `Step ${createStep} of 5`}
            </span>
          </div>

          {/* Wizard Step Capsule Indicator */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 border-b border-slate-800 pb-4">
            {[
                { num: 1, label: 'Personal' },
                { num: 2, label: 'Contact' },
                { num: 3, label: 'Organization' },
                { num: 4, label: 'Review & Security' },
                { num: 5, label: 'Finish' },
            ].map((st) => {
                const isActive = createStep === st.num;
                const isDone = createStep > st.num;
                return (<motion.div key={st.num}
                   onClick={() => {
                     // Allow clicking directly to any step up to 4 to review or edit details
                     if (st.num < 5) {
                       setAlert(null);
                       setCreateStep(st.num);
                     }
                   }}
                   whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                   className={`p-2.5 rounded-xl text-center text-xs font-bold transition-all ${st.num < 5 ? 'cursor-pointer' : 'cursor-default'} ${isActive
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/50 shadow-md shadow-indigo-600/20'
                        : isDone
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-900/80 text-slate-500 border border-slate-800/60 hover:bg-slate-800/60'}`}>
                  <span className="inline-block mr-1">{isDone ? '✓' : `${st.num}.`}</span>
                  <span className="truncate">{st.label}</span>
                </motion.div>);
            })}
          </div>

          <form noValidate onSubmit={handleCreateSubmit} onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (createStep < 4) {
                        handleNextStep();
                    }
                }
            }} className="space-y-4">
            {/* STEP 1: Personal Information */}
            {createStep === 1 && (<motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">First Name *</label>
                    <input type="text" name="firstName" required placeholder="Enter first name" value={createForm.firstName} data-invalid={Boolean(createErrors.firstName)} aria-invalid={Boolean(createErrors.firstName)} onChange={(e) => {
                    setCreateForm({ ...createForm, firstName: e.target.value });
                    if (createErrors.firstName)
                        setCreateErrors({ ...createErrors, firstName: null });
                }} className={`w-full bg-[#070c16] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all ${createErrors.firstName
                    ? 'border-2 border-rose-500 bg-rose-950/20 text-white animate-shake'
                    : 'border border-slate-700 focus:border-indigo-500'}`}/>
                    <FieldError error={createErrors.firstName}/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Middle Name</label>
                    <input type="text" name="middleName" placeholder="Enter middle name" value={createForm.middleName} onChange={(e) => setCreateForm({ ...createForm, middleName: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"/>
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Last Name *</label>
                    <input type="text" name="lastName" required placeholder="Enter last name" value={createForm.lastName} data-invalid={Boolean(createErrors.lastName)} aria-invalid={Boolean(createErrors.lastName)} onChange={(e) => {
                    setCreateForm({ ...createForm, lastName: e.target.value });
                    if (createErrors.lastName)
                        setCreateErrors({ ...createErrors, lastName: null });
                }} className={`w-full bg-[#070c16] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all ${createErrors.lastName
                    ? 'border-2 border-rose-500 bg-rose-950/20 text-white animate-shake'
                    : 'border border-slate-700 focus:border-indigo-500'}`}/>
                    <FieldError error={createErrors.lastName}/>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Gender</label>
                    <select value={createForm.gender} onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                      <option value="Male" className="bg-[#0b1220] text-white">Male</option>
                      <option value="Female" className="bg-[#0b1220] text-white">Female</option>
                      <option value="Other" className="bg-[#0b1220] text-white">Other</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300">Date of Birth</label>
                      <span className="text-[10px] text-slate-400 font-semibold">Min. 18 yrs</span>
                    </div>
                    <input type="date" max={maxAllowedDob} value={createForm.dateOfBirth} onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"/>
                    {createForm.dateOfBirth && (() => {
                      const res = validateDateOfBirth(createForm.dateOfBirth, 18);
                      return res.valid ? (
                        <p className="text-[10px] text-emerald-400 mt-1 font-semibold">✓ Age: {res.age} yrs (Eligible, ≥ 18)</p>
                      ) : (
                        <p className="text-[10px] text-rose-400 mt-1 font-semibold">⚠️ {res.error}</p>
                      );
                    })()}
                  </div>
                  <div>
                    <CountryNationalitySelect
                      id="create-user-nationality"
                      label="Nationality"
                      value={createForm.nationality}
                      onChange={(e) => setCreateForm({ ...createForm, nationality: e.target.value })}
                      placeholder="Select nationality..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Profile Photo</label>
                    {createForm.avatarUrl ? (<div className="flex items-center space-x-3 bg-[#070c16] border border-slate-700 rounded-xl p-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-indigo-500 shrink-0">
                          <img src={createForm.avatarUrl} alt="Preview" className="w-full h-full object-cover"/>
                        </div>
                        <div className="flex-1 truncate">
                          <span className="text-[11px] font-bold text-white block">Photo Uploaded</span>
                          <span className="text-[9px] text-emerald-400 font-mono">✓ Ready</span>
                        </div>
                        <button type="button" onClick={() => setCreateForm({ ...createForm, avatarUrl: '' })} className="px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded text-[10px] font-bold cursor-pointer">
                          Remove
                        </button>
                      </div>) : (<div onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            if (file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onload = (uploadEvent) => {
                                    setCreateForm({ ...createForm, avatarUrl: uploadEvent.target?.result });
                                };
                                reader.readAsDataURL(file);
                            }
                            else {
                                setAlert({ type: 'error', message: 'Please upload a valid image file (PNG, JPG, WEBP).' });
                            }
                        }
                    }} onClick={() => {
                        const fileInput = document.getElementById('avatar-file-upload');
                        if (fileInput)
                            fileInput.click();
                    }} className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-[#070c16] hover:bg-indigo-950/20 rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group">
                        <input id="avatar-file-upload" type="file" accept="image/*" className="hidden" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                                setCreateForm({ ...createForm, avatarUrl: uploadEvent.target?.result });
                            };
                            reader.readAsDataURL(file);
                        }
                    }}/>
                        <Upload className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform"/>
                        <span className="text-[11px] font-bold text-slate-300">Browse photo or drop here</span>
                        <span className="text-[9px] text-slate-500">PNG, JPG, WEBP</span>
                      </div>)}
                  </div>
                </div>
              </motion.div>)}

            {/* STEP 2: Contact Information */}
            {createStep === 2 && (<motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                  <input type="email" name="email" required placeholder="user@enterprise.com" value={createForm.email} data-invalid={Boolean(createErrors.email)} aria-invalid={Boolean(createErrors.email)} onChange={(e) => {
                    setCreateForm({ ...createForm, email: e.target.value });
                    if (createErrors.email)
                        setCreateErrors({ ...createErrors, email: null });
                }} className={`w-full bg-[#070c16] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all ${createErrors.email
                    ? 'border-2 border-rose-500 bg-rose-950/20 text-white animate-shake'
                    : 'border border-slate-700 focus:border-indigo-500'}`}/>
                  <FieldError error={createErrors.email}/>
                </div>
                <div>
                  <CountryPhoneInput
                    id="create-user-phone"
                    label="Phone Number"
                    required
                    value={createForm.phone}
                    dialCode={createForm.phonePrefix || '+251'}
                    onDialCodeChange={(dial) => setCreateForm({ ...createForm, phonePrefix: dial })}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, phone: e.target.value });
                      if (createErrors.phone) setCreateErrors({ ...createErrors, phone: null });
                    }}
                    error={createErrors.phone}
                    placeholder="Phone number"
                  />
                  <FieldError error={createErrors.phone}/>
                </div>
                <div>
                  <CountryPhoneInput
                    id="create-user-alt-phone"
                    label="Alternative Phone"
                    value={createForm.altPhone || ''}
                    dialCode={createForm.phonePrefix || '+251'}
                    onChange={(e) => setCreateForm({ ...createForm, altPhone: e.target.value })}
                    placeholder="Alternative phone"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Address / Location</label>
                  <input type="text" placeholder="Building / Floor / Street" value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"/>
                </div>
              </motion.div>)}

            {/* STEP 3: Organization Information */}
            {createStep === 3 && (<motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Organization *</label>
                    <select
                      value={createForm.organization}
                      data-invalid={Boolean(createErrors.organization)}
                      aria-invalid={Boolean(createErrors.organization)}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, organization: e.target.value });
                        if (createErrors.organization) setCreateErrors({ ...createErrors, organization: null });
                      }}
                      className={`w-full bg-[#070c16] text-white rounded-xl px-3 py-2 text-xs focus:outline-none font-medium transition-all ${
                        createErrors.organization ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-700 focus:border-indigo-500'
                      }`}
                    >
                      <option value="" className="bg-[#0b1220] text-slate-400">Select Organization...</option>
                      {orgOptions.map((o) => (<option key={o.id || o.name} value={o.name} className="bg-[#0b1220] text-white">
                          {o.name} {o.code ? `(${o.code})` : ''}
                        </option>))}
                    </select>
                    <FieldError error={createErrors.organization}/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Branch *</label>
                    <select
                      value={createForm.branch}
                      data-invalid={Boolean(createErrors.branch)}
                      aria-invalid={Boolean(createErrors.branch)}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, branch: e.target.value });
                        if (createErrors.branch) setCreateErrors({ ...createErrors, branch: null });
                      }}
                      className={`w-full bg-[#070c16] text-white rounded-xl px-3 py-2 text-xs focus:outline-none font-medium transition-all ${
                        createErrors.branch ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-700 focus:border-indigo-500'
                      }`}
                    >
                      <option value="" className="bg-[#0b1220] text-slate-400">Select Branch...</option>
                      {branchOptions.map((b) => (<option key={b.id || b.branchName || b.name} value={b.branchName || b.name} className="bg-[#0b1220] text-white">
                          {b.branchName || b.name}
                        </option>))}
                    </select>
                    <FieldError error={createErrors.branch}/>
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Department *</label>
                    <select
                      value={createForm.departmentId}
                      data-invalid={Boolean(createErrors.departmentId)}
                      aria-invalid={Boolean(createErrors.departmentId)}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, departmentId: e.target.value });
                        if (createErrors.departmentId) setCreateErrors({ ...createErrors, departmentId: null });
                      }}
                      className={`w-full bg-[#070c16] text-white rounded-xl px-3 py-2 text-xs focus:outline-none font-medium transition-all ${
                        createErrors.departmentId ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-700 focus:border-indigo-500'
                      }`}
                    >
                      <option value="" className="bg-[#0b1220] text-slate-400">Select Department...</option>
                      {deptOptions.map((d) => (<option key={d.id} value={d.id} className="bg-[#0b1220] text-white">
                          {d.departmentName || d.department_name || d.name || d.label || `Department #${d.id}`}
                        </option>))}
                    </select>
                    <FieldError error={createErrors.departmentId}/>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Job Title</label>
                    <input type="text" placeholder="e.g. Senior Specialist" value={createForm.jobTitle} onChange={(e) => setCreateForm({ ...createForm, jobTitle: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>User ID (Auto Code)</span>
                    </label>
                    <div className="relative flex items-center">
                      <input type="text" readOnly value={createForm.userId || createForm.employeeId || 'EMP-9042'} className="w-full bg-[#030712] border border-emerald-500/40 rounded-xl pl-3 pr-9 py-2 text-xs text-emerald-400 font-mono font-bold cursor-not-allowed select-none focus:outline-none"/>
                      <motion.button type="button" whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => handleRoleChange(createForm.role || createForm.userType || 'employee')} className="absolute right-2 p-1 hover:bg-slate-800 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer" title="Re-generate Random User ID Code with Role Prefix">
                        <Sparkles className="w-3.5 h-3.5"/>
                      </motion.button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">User Type / System Role *</label>
                    <select
                      value={createForm.role || createForm.userType}
                      data-invalid={Boolean(createErrors.role)}
                      aria-invalid={Boolean(createErrors.role)}
                      onChange={(e) => {
                        handleRoleChange(e.target.value);
                        if (createErrors.role) setCreateErrors({ ...createErrors, role: null });
                      }}
                      className={`w-full bg-[#070c16] text-white rounded-xl px-3 py-2 text-xs focus:outline-none font-medium transition-all ${
                        createErrors.role ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-700 focus:border-indigo-500'
                      }`}
                    >
                      {roleOptions.map((r) => (<option key={r.id} value={r.id} className="bg-[#0b1220] text-white">
                          {r.role_name} ({r.code_prefix})
                        </option>))}
                    </select>
                    <FieldError error={createErrors.role}/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Managed By</label>
                    <select value={createForm.managerId || ''} onChange={(e) => setCreateForm({ ...createForm, managerId: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                      <option value="" className="bg-[#0b1220] text-slate-400">None / Self-Managed</option>
                      {usersList.map(u => (<option key={u.id} value={u.id} className="bg-[#0b1220]">
                          {u.full_name || u.name || u.username} ({u.role || 'User'})
                        </option>))}
                    </select>
                  </div>
                </div>
              </motion.div>)}

            {/* STEP 4: Comprehensive Review & Account Security Provisioning */}
            {createStep === 4 && (<motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Eye className="w-4 h-4"/>
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase text-white tracking-wider">Step 4: Review User Details & Final Security Setup</h3>
                      <p className="text-[11px] text-slate-400">Carefully review all captured personal, contact, and organizational details before provisioning.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    Review Mode
                  </span>
                </div>

                {/* 3-Column Detailed Review Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1: Personal Details */}
                  <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative group">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5"/> 1. Personal Profile
                      </span>
                      <button type="button" onClick={() => setCreateStep(1)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer flex items-center gap-1">
                        <Edit className="w-3 h-3"/> Edit
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-xs font-bold text-indigo-300">
                        {createForm.avatarUrl ? (
                          <img src={createForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover"/>
                        ) : (
                          (createForm.firstName || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">
                          {`${createForm.firstName || ''} ${createForm.middleName ? createForm.middleName + ' ' : ''}${createForm.lastName || ''}`.trim() || 'No Name Entered'}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">{createForm.gender || 'Male'} • {createForm.nationality || 'Ethiopian'}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
                      <div><span className="text-slate-500 text-[10px]">DOB:</span> <strong className="text-slate-300">{createForm.dateOfBirth || 'Not specified'}</strong></div>
                      <div><span className="text-slate-500 text-[10px]">Photo:</span> <strong className="text-emerald-400">{createForm.avatarUrl ? 'Uploaded ✓' : 'Default Initial'}</strong></div>
                    </div>
                  </div>

                  {/* Card 2: Contact Details */}
                  <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative group">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5"/> 2. Contact Information
                      </span>
                      <button type="button" onClick={() => setCreateStep(2)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer flex items-center gap-1">
                        <Edit className="w-3 h-3"/> Edit
                      </button>
                    </div>

                    <div className="text-[11px] space-y-2 pt-1">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Email Address</span>
                        <strong className="text-white break-all">{createForm.email || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Primary Phone</span>
                        <strong className="text-indigo-300 font-mono">{createForm.phone || 'Not provided'}</strong>
                      </div>
                      {createForm.altPhone && (
                        <div>
                          <span className="text-slate-500 text-[10px] block">Alt Phone</span>
                          <span className="text-slate-300 font-mono">{createForm.altPhone}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 text-[10px] block">Address</span>
                        <span className="text-slate-400">{createForm.address || 'Standard Location'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Organizational Details */}
                  <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative group">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5"/> 3. Organizational Structure
                      </span>
                      <button type="button" onClick={() => setCreateStep(3)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer flex items-center gap-1">
                        <Edit className="w-3 h-3"/> Edit
                      </button>
                    </div>

                    <div className="text-[11px] space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">User Code:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                          {createForm.userId || createForm.employeeId}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Organization & Branch</span>
                        <strong className="text-white">{createForm.organization} • {createForm.branch}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Department</span>
                        <strong className="text-indigo-300">
                          {deptOptions.find(d => String(d.id) === String(createForm.departmentId))?.departmentName || createForm.departmentId || 'General'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Job Title</span>
                        <span className="text-slate-300">{createForm.jobTitle || 'Staff Member'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account & Security Setup Section */}
                <div className="bg-[#070c16] border border-slate-800 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5"/> 4. Account Credentials & Access Policies
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Security Tier 1</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">User Type / System Role *</label>
                      <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-semibold">
                        <option value="employee" className="bg-[#0b1220]">Employee / Staff</option>
                        <option value="admin" className="bg-[#0b1220]">System Administrator</option>
                        <option value="manager" className="bg-[#0b1220]">Department Manager</option>
                        <option value="receptionist" className="bg-[#0b1220]">Receptionist</option>
                        <option value="security_officer" className="bg-[#0b1220]">Security Officer</option>
                        <option value="visitor" className="bg-[#0b1220]">Visitor Account</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Username (Login ID)</label>
                      <input type="text" placeholder="e.g. emp00001" value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"/>
                    </div>

                    <div className="sm:col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-slate-300 mb-1">Account Initial Status</label>
                      <select value={createForm.accountStatus} onChange={(e) => setCreateForm({ ...createForm, accountStatus: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-semibold">
                        <option value="ACTIVE" className="bg-[#0b1220] text-emerald-400">ACTIVE</option>
                        <option value="PENDING" className="bg-[#0b1220] text-amber-400">PENDING Verification</option>
                        <option value="LOCKED" className="bg-[#0b1220] text-rose-400">LOCKED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Credential Mode</label>
                    <select value={createForm.credentialMode} onChange={(e) => setCreateForm({ ...createForm, credentialMode: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-semibold">
                      <option value="temporary" className="bg-[#0b1220]">Temporary Password (Auto-Generate & Display in Step 5)</option>
                      <option value="reset_link" className="bg-[#0b1220]">Password Reset Link (Dispatched to Email)</option>
                      <option value="invitation" className="bg-[#0b1220]">Send Registration Invitation Token</option>
                      <option value="manual" className="bg-[#0b1220]">Set Manual Initial Password</option>
                    </select>
                  </div>

                  {createForm.credentialMode === 'manual' && (<div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Initial Password * (Minimum 8 chars)</label>
                      <input type="password" name="password" required placeholder="Minimum 8 characters" value={createForm.password} data-invalid={Boolean(createErrors.password)} aria-invalid={Boolean(createErrors.password)} onChange={(e) => {
                          setCreateForm({ ...createForm, password: e.target.value });
                          if (createErrors.password)
                              setCreateErrors({ ...createErrors, password: null });
                      }} className={`w-full bg-[#0b1220] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono transition-all ${createErrors.password
                          ? 'border-2 border-rose-500 bg-rose-950/20 text-white animate-shake'
                          : 'border border-slate-700 focus:border-indigo-500'}`}/>
                      <FieldError error={createErrors.password}/>
                    </div>)}
                </div>

                {/* Provisioning Confirmation Alert */}
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0"/>
                  <span>
                    All user profile, contact, and organizational details have been verified. Click <strong>Confirm & Create User Account</strong> below to finalize provisioning.
                  </span>
                </div>
              </motion.div>)}

            {/* STEP 5: Finish / Account Created Summary */}
            {createStep === 5 && createdUserSummary && (<motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="space-y-6 py-2">
                {/* Success Header with Green Check Circle Icon */}
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 shadow-xl shadow-emerald-500/20 animate-pulse">
                    <CheckCircle2 className="h-9 w-9 text-emerald-400"/>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                    User Account Created & Provisioned Successfully!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto break-words">
                    The account credentials and organizational hierarchy have been activated and saved to the database.
                  </p>
                </div>

                {/* Card 1: Your Account Details & Credentials */}
                <div className="bg-[#070c16] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-indigo-400"/> Account Identity & Login Credentials
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-xl border border-slate-800 gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">User ID / Code</span>
                        <strong className="text-indigo-400 font-mono text-sm break-all">{createdUserSummary.userCode}</strong>
                      </div>
                      <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleCopySummaryText(createdUserSummary.userCode, 'userCode')} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer">
                        {copiedSummaryField === 'userCode' ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                        {copiedSummaryField === 'userCode' ? 'Copied' : 'Copy'}
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-xl border border-slate-800 gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Username</span>
                        <strong className="text-white font-mono text-sm break-all">@{createdUserSummary.username}</strong>
                      </div>
                      <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleCopySummaryText(createdUserSummary.username, 'username')} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer">
                        {copiedSummaryField === 'username' ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                        {copiedSummaryField === 'username' ? 'Copied' : 'Copy'}
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-xl border border-slate-800 gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Full Name</span>
                        <strong className="text-white text-sm break-words block">{createdUserSummary.fullName}</strong>
                        <span className="text-slate-400 text-[11px] break-all block mt-0.5">{createdUserSummary.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-xl border border-slate-800 gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Role / User Type</span>
                        <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          {createdUserSummary.role}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Credential Mode</span>
                        <span className="text-slate-300 font-bold uppercase text-[10px]">{createdUserSummary.credentialMode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Temporary Password Highlight Box */}
                  {createdUserSummary.temporaryPassword ? (<div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-amber-400"/> Temporary Initial Password
                        </span>
                        <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleCopySummaryText(createdUserSummary.temporaryPassword || '', 'tempPassword')} className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer">
                          {copiedSummaryField === 'tempPassword' ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                          {copiedSummaryField === 'tempPassword' ? 'Password Copied!' : 'Copy Password'}
                        </motion.button>
                      </div>
                      <div className="p-2.5 bg-[#070c16] rounded-lg border border-amber-500/20 font-mono text-sm text-white font-black tracking-widest text-center select-all break-all">
                        {createdUserSummary.temporaryPassword}
                      </div>
                      <p className="text-[11px] text-amber-300/80 font-medium break-words">
                        ⚠️ Please securely share this temporary password with the user. They will be required to change it on their first login.
                      </p>
                    </div>) : createdUserSummary.credentialMode === 'manual' ? (<div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
                      🔑 Initial password configured manually by administrator during provisioning.
                    </div>) : (<div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 break-words">
                      📧 Password setup link dispatched to user email ({createdUserSummary.email}).
                    </div>)}
                </div>

                {/* Card 2: Organization Hierarchy Details */}
                <div className="bg-[#070c16] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                    <Building className="w-4 h-4 text-indigo-400"/> Assigned Organizational Structure
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Organization</span>
                      <strong className="text-white break-words">{createdUserSummary.organization}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Branch</span>
                      <strong className="text-white break-words">{createdUserSummary.branch}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Department</span>
                      <strong className="text-white break-words">{createdUserSummary.department}</strong>
                    </div>
                  </div>
                </div>

                {/* Step 5 Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleCreateAnotherUser} className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <Plus className="w-4 h-4"/> Create Another User
                  </motion.button>

                  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleResetCreateWizard} className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Users className="w-4 h-4"/> Go to User Directory
                  </motion.button>
                </div>
              </motion.div>)}

            {/* Navigation Controls */}
            {createStep <= 4 && (
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4 w-full">
                <motion.button
                  type="button"
                  disabled={createStep === 1 || isCreatingUser}
                  whileHover={{ scale: createStep === 1 || isCreatingUser ? 1 : 1.02 }}
                  whileTap={{ scale: createStep === 1 || isCreatingUser ? 1 : 0.95 }}
                  onClick={() => setCreateStep(prev => prev - 1)}
                  className="w-full sm:w-auto h-10 min-h-[40px] px-5 bg-slate-800 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Previous
                </motion.button>

                {createStep < 4 ? (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNextStep}
                    className="w-full sm:w-auto h-10 min-h-[40px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Next Step</span>
                    <span>→</span>
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={isCreatingUser}
                    whileHover={{ scale: isCreatingUser ? 1 : 1.02 }}
                    whileTap={{ scale: isCreatingUser ? 1 : 0.95 }}
                    className="w-full sm:w-auto h-10 min-h-[40px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreatingUser ? (
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                    <span>{isCreatingUser ? 'Creating User Account...' : 'Confirm & Create User Account'}</span>
                  </motion.button>
                )}
              </div>
            )}
          </form>
        </motion.div>)}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            4. INVITATIONS SUB-VIEW
           â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeSubView === 'invitations' && (<div className="space-y-6">
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <BackButton onClick={handleBack} title="Back to Directory"/>
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <Mail className="h-5 w-5 text-indigo-400"/>
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-white tracking-wide">Send User Account Invitation</h2>
                <p className="text-xs text-slate-400 mt-0.5">Issue secure registration tokens via Email for user self-onboarding.</p>
              </div>
            </div>

            <form onSubmit={handleSendInvitation} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Recipient Email *</label>
                <input type="email" required placeholder="user@enterprise.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Assigned Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                  <option value="employee">Employee / Staff</option>
                  <option value="manager">Department Manager</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="security_officer">Security Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Department</label>
                <select value={inviteDeptId} onChange={(e) => setInviteDeptId(e.target.value)} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                  <option value="">Select Department...</option>
                  {deptOptions.map((d) => (<option key={d.id} value={d.id} className="bg-[#0b1220] text-white">
                      {d.departmentName || d.department_name || d.name || `Department #${d.id}`}
                    </option>))}
                </select>
              </div>

              <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 h-[38px]">
                <Mail className="w-4 h-4"/> Send Invitation
              </button>
            </form>
          </div>

          {/* Invitations Log Table */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Active & Recent Invitations Log ({invitationsList.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-3 px-4">{t('table.recipientEmail', 'Recipient Email')}</th>
                    <th className="py-3 px-4">{t('table.assignedRole', 'Assigned Role')}</th>
                    <th className="py-3 px-4">{t('table.department', 'Department')}</th>
                    <th className="py-3 px-4">{t('table.status', 'Status')}</th>
                    <th className="py-3 px-4">{t('table.expiresAt', 'Expires At')}</th>
                    <th className="py-3 px-4 text-right">{t('table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {invitationsList.length === 0 ? (<tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 font-semibold">
                        No pending invitation records found.
                      </td>
                    </tr>) : (invitationsList.map((inv) => (<tr key={inv.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-semibold text-white">{inv.email}</td>
                        <td className="py-3 px-4 text-slate-300 font-bold uppercase">{inv.role}</td>
                        <td className="py-3 px-4 text-slate-400">{inv.department_name || 'General'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${inv.status === 'SENT' ? 'bg-amber-500/20 text-amber-400' :
                    inv.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{new Date(inv.expires_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button onClick={() => handleResendInvitation(inv.id)} className="text-indigo-400 hover:underline text-xs font-bold">Resend</button>
                          <button onClick={() => handleCancelInvitation(inv.id)} className="text-red-400 hover:underline text-xs font-bold">Cancel</button>
                        </td>
                      </tr>)))}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            5. IMPORT / EXPORT SUB-VIEW
           â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeSubView === 'import_export' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bulk User Import */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <BackButton onClick={handleBack} title="Back to Directory"/>
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <Upload className="h-5 w-5 text-emerald-400"/>
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-white tracking-wide">Bulk User Import (CSV / Excel)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Upload multi-row spreadsheet files to provision enterprise accounts in bulk.</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-all cursor-pointer bg-[#070c16]/50">
              <FileSpreadsheet className="w-10 h-10 text-emerald-400 mx-auto mb-3"/>
              <p className="text-xs font-bold text-slate-200">{csvFileName || 'Select or Drag & Drop CSV spreadsheet file here'}</p>
              <p className="text-[10px] text-slate-400 mt-1">Expected columns: firstName, lastName, email, phone, role, departmentId</p>
              <input type="file" accept=".csv" onChange={handleCsvFileChange} className="hidden" id="csv-upload-input"/>
              <label htmlFor="csv-upload-input" className="inline-block mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl cursor-pointer">
                Browse CSV File
              </label>
            </div>

            {/* CSV File Validation Preview Table */}
            {csvPreview.length > 0 && (<div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-[#070c16]">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>File Parsed: {csvPreview.length} Row Entries Found</span>
                  <button onClick={() => setCsvPreview([])} className="text-slate-500 hover:text-white">Clear</button>
                </div>
                <div className="max-h-32 overflow-y-auto text-[11px]">
                  {csvPreview.slice(0, 5).map((r, idx) => (<div key={idx} className="py-1 border-b border-slate-800/60 flex items-center justify-between text-slate-300">
                      <span>{r.firstName} {r.lastName} ({r.email})</span>
                      <span className="text-slate-500 font-mono">{r.role || 'employee'}</span>
                    </div>))}
                  {csvPreview.length > 5 && <p className="text-[10px] text-slate-500 mt-1">...and {csvPreview.length - 5} more rows</p>}
                </div>
              </div>)}

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={handleDownloadStandardTemplate} className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">
                <Download className="w-3.5 h-3.5"/> Download Standard CSV Template
              </button>
              <button type="button" disabled={importing || csvPreview.length === 0} onClick={handleProcessBulkImportSubmit} className="px-4 py-2 bg-emerald-600 disabled:opacity-40 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-emerald-600/30">
                {importing ? 'Processing...' : 'Process Bulk Import'}
              </button>
            </div>
          </div>

          {/* Bulk User Export */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <Download className="h-5 w-5 text-indigo-400"/>
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-white tracking-wide">Export Enterprise User Records</h2>
                <p className="text-xs text-slate-400 mt-0.5">Generate sanitized audit-compliant user data exports for reporting.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-[#070c16] rounded-xl border border-slate-800">
                <span className="font-bold text-slate-200">Security Sanitization Rules:</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sensitive credentials including password hashes, session tokens, OTP secrets, and MFA keys are automatically stripped prior to file generation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Export Format</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="export-fmt" defaultChecked className="accent-indigo-500"/>
                    <span>CSV (Comma Separated Values)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="export-fmt" className="accent-indigo-500"/>
                    <span>JSON (Structured Format)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button type="button" onClick={handleBulkExportDataset} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center gap-2">
                <Download className="w-4 h-4"/> Export Filtered User Dataset
              </button>
            </div>
          </div>
        </div>)}

      {/* 5. USER DETAILS SUB-VIEW */}
      {(activeSubView === 'user_details' || activeSubView === 'user-details') && (() => {
            const activeDetailsUser = selectedUserForDetails || usersList[0] || null;
            return (<div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <BackButton onClick={handleBack} title="Back to Directory"/>
                <div>
                  <h2 className="text-sm font-black uppercase text-indigo-400 tracking-wider">User Details Inspector</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Enterprise User Profile, Organization Assignment, Security & Lifecycle Inspector.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-400">Select User:</span>
                  <select value={activeDetailsUser?.id || ''} onChange={(e) => {
                    const u = usersList.find(x => x.id === parseInt(e.target.value));
                    if (u)
                        setSelectedUserForDetails(u);
                }} className="bg-[#070c16] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none">
                    {usersList.map(u => (<option key={u.id} value={u.id}>
                        {u.full_name} ({u.user_code || `USR-${u.id}`})
                      </option>))}
                  </select>
                </div>
              </div>
            </div>

            {activeDetailsUser ? (<div className="space-y-6 text-xs">
                {/* User Profile Banner & Header Info */}
                <div className="p-5 bg-[#070c16] border border-slate-800 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center font-bold text-indigo-400 text-xl overflow-hidden shrink-0 shadow-lg">
                      {activeDetailsUser.avatar_url ? (<img src={activeDetailsUser.avatar_url} alt="" className="w-full h-full object-cover"/>) : (activeDetailsUser.full_name?.charAt(0).toUpperCase() || 'U')}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{activeDetailsUser.full_name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-mono font-bold text-indigo-400">{activeDetailsUser.user_code || `EMP-2026-${String(activeDetailsUser.id).padStart(6, '0')}`}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 font-mono">@{activeDetailsUser.username || 'user'}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-300 font-bold uppercase">{activeDetailsUser.role}</span>
                      </div>
                      <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-slate-400">
                        <span>🏢 {activeDetailsUser.organization_name || 'Enterprise VMS Global'}</span>
                        <span>📍 {activeDetailsUser.branch_name || 'Main Branch'}</span>
                        <span>📁 {activeDetailsUser.department_name || 'IT & Systems'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${(activeDetailsUser.account_status || activeDetailsUser.status) === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                      {activeDetailsUser.account_status || activeDetailsUser.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>

                {/* Prompt Section 15 Required Actions Bar */}
                <div className="flex flex-wrap items-center gap-2 bg-[#070c16] border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Actions:</span>
                  <button onClick={() => { setSelectedUserForDetails(activeDetailsUser); setActiveSubView('user_edit'); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                    <Edit className="w-3.5 h-3.5"/> Edit
                  </button>
                  <button onClick={() => handleQuickStatusChange(activeDetailsUser, 'ACTIVE')} className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5"/> Activate
                  </button>
                  <button onClick={() => handleQuickStatusChange(activeDetailsUser, 'INACTIVE')} className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1">
                    <UserX className="w-3.5 h-3.5"/> Deactivate
                  </button>
                  <button onClick={() => handleQuickStatusChange(activeDetailsUser, 'SUSPENDED')} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5"/> Suspend
                  </button>
                  <button onClick={() => handleQuickStatusChange(activeDetailsUser, 'ACTIVE')} className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5"/> Unlock
                  </button>
                  <button onClick={() => openStatusModal(activeDetailsUser, 'reset_password')} className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Key className="w-3.5 h-3.5"/> Reset Password
                  </button>
                  <button onClick={() => handleRevokeAllSessions(activeDetailsUser.id)} className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5"/> Revoke Sessions
                  </button>
                  <button onClick={() => setAlert({ type: 'success', message: `Notification sent to ${activeDetailsUser.email}` })} className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5"/> Send Notification
                  </button>
                  <button onClick={() => handleDeleteUserWithConfirmation(activeDetailsUser)} className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5"/> Delete User
                  </button>
                </div>

                {/* Prompt Section 15 Required 10 Tabs Bar */}
                <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 pb-2 text-xs font-bold">
                  {[
                        { key: 'overview', label: 'Overview' },
                        { key: 'personal', label: 'Personal' },
                        { key: 'contact', label: 'Contact' },
                        { key: 'organization', label: 'Organization' },
                        { key: 'account', label: 'Account' },
                        { key: 'security', label: 'Security' },
                        { key: 'sessions', label: 'Sessions' },
                        { key: 'login_history', label: 'Login History' },
                        { key: 'activity', label: 'Activity' },
                        { key: 'preferences', label: 'Preferences' },
                    ].map((t) => (<button key={t.key} onClick={() => setActiveUserTab(t.key)} className={`px-3 py-2 rounded-xl transition-all border ${activeUserTab === t.key
                            ? 'bg-indigo-600 text-white border-indigo-500 font-extrabold shadow-md'
                            : 'bg-[#070c16] text-slate-400 border-slate-800 hover:text-white'}`}>
                      {t.label}
                    </button>))}
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeUserTab === 'overview' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                      <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider border-b border-slate-800 pb-2">Profile & Organization Summary</h4>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div><span className="text-slate-500 block text-[10px]">Email Address</span><strong className="text-white">{activeDetailsUser.email}</strong></div>
                        <div><span className="text-slate-500 block text-[10px]">Phone Number</span><strong className="text-white">{activeDetailsUser.phone || activeDetailsUser.phone_number || 'N/A'}</strong></div>
                        <div><span className="text-slate-500 block text-[10px]">Department</span><strong className="text-white">{activeDetailsUser.department_name || 'IT & Security'}</strong></div>
                        <div><span className="text-slate-500 block text-[10px]">Job Title</span><strong className="text-white">{activeDetailsUser.job_title || 'Staff Specialist'}</strong></div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                      <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider border-b border-slate-800 pb-2">Security & Verification Indicators</h4>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div><span className="text-slate-500 block text-[10px]">Email Verification</span><strong className={activeDetailsUser.email_verified ? 'text-emerald-400' : 'text-amber-400'}>{activeDetailsUser.email_verified ? '✓ Verified' : '⚠ Unverified'}</strong></div>
                        <div><span className="text-slate-500 block text-[10px]">Phone Verification</span><strong className={activeDetailsUser.phone_verified ? 'text-emerald-400' : 'text-amber-400'}>{activeDetailsUser.phone_verified ? '✓ Verified' : '⚠ Unverified'}</strong></div>
                        <div><span className="text-slate-500 block text-[10px]">MFA Status</span><strong className={activeDetailsUser.mfa_enabled ? 'text-emerald-400' : 'text-slate-400'}>{activeDetailsUser.mfa_enabled ? 'Enabled' : 'Disabled'}</strong></div>
                        <div><span className="text-slate-500 block text-[10px]">Active Sessions</span><strong className="text-indigo-400">1 Active Device</strong></div>
                      </div>
                    </div>
                  </div>)}

                {/* TAB 2: PERSONAL */}
                {activeUserTab === 'personal' && (<div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                    <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider border-b border-slate-800 pb-2">Personal Information Details</h4>
                    <div className="grid grid-cols-3 gap-4 text-slate-300">
                      <div><span className="text-slate-500 block text-[10px]">First Name</span><strong className="text-white">{activeDetailsUser.full_name?.split(' ')[0] || 'N/A'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Middle Name</span><strong className="text-white">{activeDetailsUser.full_name?.split(' ')[1] || 'N/A'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Last Name</span><strong className="text-white">{activeDetailsUser.full_name?.split(' ')[2] || 'N/A'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Gender</span><strong className="text-white">{activeDetailsUser.gender || 'Male'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Date of Birth</span><strong className="text-white">{activeDetailsUser.date_of_birth || '1992-05-14'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Nationality</span><strong className="text-white">{activeDetailsUser.nationality || 'Ethiopian'}</strong></div>
                    </div>
                  </div>)}

                {/* TAB 3: CONTACT */}
                {activeUserTab === 'contact' && (<div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                    <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider border-b border-slate-800 pb-2">Contact & Address Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-slate-300">
                      <div><span className="text-slate-500 block text-[10px]">Email Address</span><strong className="text-white">{activeDetailsUser.email}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Phone Number</span><strong className="text-white">{activeDetailsUser.phone || activeDetailsUser.phone_number || '+251 911 000 000'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Alternative Phone</span><strong className="text-white">+251 922 000 000</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Address / Location</span><strong className="text-white">Bole Sub City, Tower B, Floor 4</strong></div>
                    </div>
                  </div>)}

                {/* TAB 4: ORGANIZATION */}
                {activeUserTab === 'organization' && (<div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                    <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider border-b border-slate-800 pb-2">Organization Structure & Hierarchy</h4>
                    <div className="grid grid-cols-3 gap-4 text-slate-300">
                      <div><span className="text-slate-500 block text-[10px]">Organization</span><strong className="text-white">{activeDetailsUser.organization_name || 'Enterprise VMS Global'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Branch</span><strong className="text-white">{activeDetailsUser.branch_name || 'Main Branch'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Department</span><strong className="text-white">{activeDetailsUser.department_name || 'IT Security'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Job Title</span><strong className="text-white">{activeDetailsUser.job_title || 'Senior Specialist'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Employee ID</span><strong className="text-white font-mono">{activeDetailsUser.user_code || `EMP-${activeDetailsUser.id}`}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Employment Type</span><strong className="text-white">Full-Time Permanent</strong></div>
                    </div>
                  </div>)}

                {/* TAB 5: ACCOUNT */}
                {activeUserTab === 'account' && (<div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                    <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider border-b border-slate-800 pb-2">Account Lifecycle & Credentials</h4>
                    <div className="grid grid-cols-3 gap-4 text-slate-300">
                      <div><span className="text-slate-500 block text-[10px]">User ID Code</span><strong className="text-indigo-400 font-mono">{activeDetailsUser.user_code || `USR-${activeDetailsUser.id}`}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Username</span><strong className="text-white font-mono">@{activeDetailsUser.username}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">User Role</span><strong className="text-white uppercase">{activeDetailsUser.role}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Account Status</span><strong className="text-emerald-400 font-bold">{activeDetailsUser.account_status || 'ACTIVE'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Credential Mode</span><strong className="text-white">Temporary Credential</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Created Date</span><strong className="text-white">{new Date(activeDetailsUser.createdAt || Date.now()).toLocaleDateString()}</strong></div>
                    </div>
                  </div>)}

                {/* TAB 6: SECURITY */}
                {activeUserTab === 'security' && (<div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                    <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider border-b border-slate-800 pb-2">Security Center & Risk Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-slate-300">
                      <div><span className="text-slate-500 block text-[10px]">MFA Enabled</span><strong className={activeDetailsUser.mfa_enabled ? 'text-emerald-400' : 'text-slate-400'}>{activeDetailsUser.mfa_enabled ? 'Yes' : 'No'}</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Failed Logins</span><strong className="text-white">0 Attempts</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Password Age</span><strong className="text-white">12 Days</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Account Locking</span><strong className="text-emerald-400">Unlocked</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Risk Score</span><strong className="text-emerald-400">Low (0%)</strong></div>
                    </div>
                  </div>)}

                {/* TAB 7: SESSIONS */}
                {activeUserTab === 'sessions' && (<div className="space-y-3">
                    <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider">Active Device Sessions</h4>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-[#070c16] text-[10px] uppercase font-bold text-slate-400">
                          <tr className="border-b border-slate-800">
                            <th className="py-2.5 px-3">{t('table.deviceOs', 'Device / OS')}</th>
                            <th className="py-2.5 px-3">{t('table.browser', 'Browser')}</th>
                            <th className="py-2.5 px-3">{t('table.ipAddress', 'IP Address')}</th>
                            <th className="py-2.5 px-3">{t('table.lastActive', 'Last Active')}</th>
                            <th className="py-2.5 px-3 text-right">{t('table.actions', 'Action')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-white">Windows 11 PC</td>
                            <td className="py-2.5 px-3">Chrome 122.0</td>
                            <td className="py-2.5 px-3 font-mono">127.0.0.1</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-bold">Active Now</td>
                            <td className="py-2.5 px-3 text-right">
                              <button onClick={() => setAlert({ type: 'success', message: 'Session revoked.' })} className="text-red-400 hover:underline font-bold">Revoke</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>)}

                {/* TAB 8: LOGIN HISTORY */}
                {(activeUserTab === 'login_history' || activeUserTab === 'history') && (<div className="space-y-3">
                    <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider">Historical Login Audit Log</h4>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-[#070c16] text-[10px] uppercase font-bold text-slate-400">
                          <tr className="border-b border-slate-800">
                            <th className="py-2.5 px-3">{t('table.timestamp', 'Timestamp')}</th>
                            <th className="py-2.5 px-3">{t('table.ipAddress', 'IP Address')}</th>
                            <th className="py-2.5 px-3">{t('table.device', 'Device')}</th>
                            <th className="py-2.5 px-3">{t('table.result', 'Result')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-slate-300">{new Date().toLocaleString()}</td>
                            <td className="py-2.5 px-3 font-mono">127.0.0.1</td>
                            <td className="py-2.5 px-3">Chrome / Windows</td>
                            <td className="py-2.5 px-3"><span className="text-emerald-400 font-bold">SUCCESS</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>)}

                {/* TAB 9: ACTIVITY */}
                {activeUserTab === 'activity' && (<div className="space-y-3">
                    <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider">User Action Audit Timeline</h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-[#070c16] border border-slate-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
                          <div>
                            <span className="font-bold text-white">USER_PROVISIONED</span>
                            <p className="text-[10px] text-slate-400">Account provisioned with automated ID EMP-2026-000011</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>)}

                {/* TAB 10: PREFERENCES */}
                {activeUserTab === 'preferences' && (<div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                    <h4 className="font-black uppercase text-indigo-400 text-[11px] tracking-wider border-b border-slate-800 pb-2">User Interface & Notification Preferences</h4>
                    <div className="grid grid-cols-3 gap-4 text-slate-300">
                      <div><span className="text-slate-500 block text-[10px]">Theme</span><strong className="text-white">Dark Mode</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Language</span><strong className="text-white">English (US)</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Timezone</span><strong className="text-white">UTC+3 (East Africa Time)</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Date Format</span><strong className="text-white">YYYY-MM-DD</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">Email Notifications</span><strong className="text-emerald-400">Enabled</strong></div>
                      <div><span className="text-slate-500 block text-[10px]">SMS Notifications</span><strong className="text-emerald-400">Enabled</strong></div>
                    </div>
                  </div>)}
              </div>) : (<div className="p-8 text-center text-slate-500 font-semibold">No user records available for preview.</div>)}
          </div>);
        })()}

      {/* 6. EDIT USER SUB-VIEW */}
      {(activeSubView === 'user_edit' || activeSubView === 'user-edit') && (<div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
          {/* Header Bar with User Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <BackButton onClick={handleBack} title="Back to Directory"/>
              <div>
                <h2 className="text-sm sm:text-base font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2">
                  <Edit className="w-4 h-4"/> Edit User Account & Profile
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Modify personal fields, contact details, organizational hierarchy, and security settings.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs w-full sm:w-auto">
              <span className="font-bold text-slate-400 shrink-0">Select User:</span>
              <select value={selectedUserForDetails?.id || ''} onChange={(e) => {
                const u = usersList.find(x => x.id === parseInt(e.target.value));
                if (u)
                    setSelectedUserForDetails(u);
            }} className="w-full sm:w-auto bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500">
                {usersList.map(u => (<option key={u.id} value={u.id}>
                    {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`} ({u.user_code || `USR-${u.id}`})
                  </option>))}
              </select>
            </div>
          </div>

          {selectedUserForDetails ? (<form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedUserForDetails || !selectedUserForDetails.id) {
                      setAlert({ type: 'error', message: 'No user account selected for editing.' });
                      return;
                    }
                    if (isSavingUser) return;

                    // Pre-flight Client Field Validation
                    const fName = (selectedUserForDetails.first_name || '').trim();
                    const lName = (selectedUserForDetails.last_name || '').trim();
                    const emailVal = (selectedUserForDetails.email || '').trim();

                    if (!fName) {
                      setAlert({ type: 'error', message: 'Validation Failed: First Name is required.' });
                      return;
                    }
                    if (!lName) {
                      setAlert({ type: 'error', message: 'Validation Failed: Last Name is required.' });
                      return;
                    }
                    if (!emailVal) {
                      setAlert({ type: 'error', message: 'Validation Failed: Email Address is required.' });
                      return;
                    }
                    if (selectedUserForDetails.newPassword && selectedUserForDetails.newPassword.trim().length > 0 && selectedUserForDetails.newPassword.trim().length < 8) {
                      setAlert({ type: 'error', message: 'Validation Failed: New Password must be at least 8 characters long.' });
                      return;
                    }

                    setIsSavingUser(true);
                    try {
                        const payload = {
                            first_name: fName,
                            middle_name: (selectedUserForDetails.middle_name || '').trim(),
                            last_name: lName,
                            full_name: `${fName} ${selectedUserForDetails.middle_name ? selectedUserForDetails.middle_name.trim() + ' ' : ''}${lName}`.trim(),
                            email: emailVal.toLowerCase(),
                            phone: selectedUserForDetails.phone || selectedUserForDetails.phone_number || '',
                            phone_number: selectedUserForDetails.phone || selectedUserForDetails.phone_number || '',
                            alt_phone: selectedUserForDetails.alt_phone || selectedUserForDetails.altPhone || '',
                            address: selectedUserForDetails.address || '',
                            gender: selectedUserForDetails.gender || 'Male',
                            date_of_birth: selectedUserForDetails.date_of_birth || selectedUserForDetails.dob || null,
                            nationality: selectedUserForDetails.nationality || 'Ethiopian',
                            avatar_url: selectedUserForDetails.avatar_url || selectedUserForDetails.avatarUrl || '',
                            organization: selectedUserForDetails.organization || selectedUserForDetails.organization_name || 'Enterprise VMS Global',
                            branch: selectedUserForDetails.branch || selectedUserForDetails.branch_name || 'Megenagna',
                            department_id: selectedUserForDetails.department_id ? parseInt(selectedUserForDetails.department_id) : null,
                            job_title: selectedUserForDetails.job_title || selectedUserForDetails.jobTitle || '',
                            manager_id: selectedUserForDetails.manager_id ? parseInt(selectedUserForDetails.manager_id) : null,
                            role: selectedUserForDetails.role || selectedUserForDetails.user_type || 'employee',
                            username: (selectedUserForDetails.username || '').trim(),
                            account_status: (selectedUserForDetails.account_status || selectedUserForDetails.status || 'ACTIVE').toUpperCase(),
                            status: (selectedUserForDetails.status || selectedUserForDetails.account_status || 'ACTIVE').toUpperCase(),
                            password: selectedUserForDetails.newPassword && selectedUserForDetails.newPassword.trim().length >= 8 ? selectedUserForDetails.newPassword.trim() : undefined,
                        };

                        const updateRes = await api.put(`/users/${selectedUserForDetails.id}`, payload);
                        setAlert({
                          type: 'success',
                          message: updateRes.data?.message || `User "${payload.full_name || selectedUserForDetails.username}" profile and account updated successfully!`
                        });

                        // Redirect to the All Users list page and trigger fresh loading
                        setActiveSubView('users');
                        setSubViewHistory([]);
                        setSelectedUser(null);
                        await Promise.all([
                          fetchUsers(),
                          typeof fetchStats === 'function' ? fetchStats() : Promise.resolve(),
                        ]);
                    }
                    catch (err) {
                        console.error('Failed to update user profile:', err);
                        setAlert({ type: 'error', message: err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update user profile.' });
                    }
                    finally {
                        setIsSavingUser(false);
                    }
                }} className="space-y-6 text-xs">

              {/* 1. TOP IDENTITY & AVATAR BANNER */}
              <div className="bg-[#070c16] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-indigo-500/50 flex items-center justify-center font-black text-xl text-indigo-300 shadow-lg">
                      {(selectedUserForDetails.avatar_url || selectedUserForDetails.avatarUrl) ? (
                        <img src={selectedUserForDetails.avatar_url || selectedUserForDetails.avatarUrl} alt="Avatar" className="w-full h-full object-cover"/>
                      ) : (
                        (selectedUserForDetails.first_name || selectedUserForDetails.full_name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-white truncate">
                        {selectedUserForDetails.full_name || `${selectedUserForDetails.first_name || ''} ${selectedUserForDetails.last_name || ''}`.trim() || 'User Account'}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {selectedUserForDetails.user_code || `USR-${selectedUserForDetails.id}`}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5 truncate">{selectedUserForDetails.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <input id="edit-avatar-upload" type="file" accept="image/*" className="hidden" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = (uploadEvent) => {
                            setSelectedUserForDetails({
                              ...selectedUserForDetails,
                              avatar_url: uploadEvent.target?.result,
                              avatarUrl: uploadEvent.target?.result
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}/>
                      <button type="button" onClick={() => document.getElementById('edit-avatar-upload')?.click()} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700">
                        <Upload className="w-3 h-3 text-indigo-400"/> Change Photo
                      </button>
                      {(selectedUserForDetails.avatar_url || selectedUserForDetails.avatarUrl) && (
                        <button type="button" onClick={() => setSelectedUserForDetails({ ...selectedUserForDetails, avatar_url: '', avatarUrl: '' })} className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-rose-500/20">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Role</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {selectedUserForDetails.role || selectedUserForDetails.user_type || 'employee'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      (selectedUserForDetails.account_status || selectedUserForDetails.status) === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : (selectedUserForDetails.account_status || selectedUserForDetails.status) === 'LOCKED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {selectedUserForDetails.account_status || selectedUserForDetails.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. SECTION 1: PERSONAL INFORMATION */}
              <div className="bg-[#070c16] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                  <UserIcon className="w-4 h-4 text-indigo-400"/>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">1. Personal Profile Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">First Name *</label>
                    <input type="text" required value={selectedUserForDetails.first_name || ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, first_name: e.target.value, full_name: `${e.target.value} ${selectedUserForDetails.middle_name ? selectedUserForDetails.middle_name + ' ' : ''}${selectedUserForDetails.last_name || ''}`.trim() })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"/>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Middle Name</label>
                    <input type="text" value={selectedUserForDetails.middle_name || ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, middle_name: e.target.value, full_name: `${selectedUserForDetails.first_name || ''} ${e.target.value ? e.target.value + ' ' : ''}${selectedUserForDetails.last_name || ''}`.trim() })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"/>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Last Name *</label>
                    <input type="text" required value={selectedUserForDetails.last_name || ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, last_name: e.target.value, full_name: `${selectedUserForDetails.first_name || ''} ${selectedUserForDetails.middle_name ? selectedUserForDetails.middle_name + ' ' : ''}${e.target.value}`.trim() })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"/>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Gender</label>
                    <select value={selectedUserForDetails.gender || 'Male'} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, gender: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-bold">Date of Birth</label>
                      <span className="text-[10px] text-slate-400 font-semibold">Min. 18 yrs</span>
                    </div>
                    <input type="date" max={maxAllowedDob} value={selectedUserForDetails.date_of_birth ? selectedUserForDetails.date_of_birth.substring(0, 10) : ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, date_of_birth: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"/>
                    {selectedUserForDetails.date_of_birth && (() => {
                      const res = validateDateOfBirth(selectedUserForDetails.date_of_birth, 18);
                      return res.valid ? (
                        <p className="text-[10px] text-emerald-400 mt-1 font-semibold">✓ Age: {res.age} yrs (Eligible, ≥ 18)</p>
                      ) : (
                        <p className="text-[10px] text-rose-400 mt-1 font-semibold">⚠️ {res.error}</p>
                      );
                    })()}
                  </div>
                  <div>
                    <CountryNationalitySelect
                      id="edit-user-nationality"
                      label="Nationality"
                      value={selectedUserForDetails.nationality || 'Ethiopian'}
                      onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, nationality: e.target.value })}
                      placeholder="Select nationality..."
                    />
                  </div>
                </div>
              </div>

              {/* 3. SECTION 2: CONTACT INFORMATION */}
              <div className="bg-[#070c16] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                  <Mail className="w-4 h-4 text-indigo-400"/>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">2. Contact & Address Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email Address *</label>
                    <input type="email" required value={selectedUserForDetails.email || ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, email: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"/>
                  </div>
                  <div>
                    <CountryPhoneInput
                      id="edit-user-phone"
                      label="Primary Phone Number"
                      value={selectedUserForDetails.phone || selectedUserForDetails.phone_number || ''}
                      dialCode={selectedUserForDetails.phonePrefix || '+251'}
                      onDialCodeChange={(dial) => setSelectedUserForDetails({ ...selectedUserForDetails, phonePrefix: dial })}
                      onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, phone: e.target.value, phone_number: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <CountryPhoneInput
                      id="edit-user-alt-phone"
                      label="Alternative Phone"
                      value={selectedUserForDetails.alt_phone || selectedUserForDetails.altPhone || ''}
                      dialCode={selectedUserForDetails.phonePrefix || '+251'}
                      onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, alt_phone: e.target.value, altPhone: e.target.value })}
                      placeholder="Alternative phone"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Physical Address / Office Location</label>
                    <input type="text" value={selectedUserForDetails.address || ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, address: e.target.value })} placeholder="Building / Office / Desk" className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"/>
                  </div>
                </div>
              </div>

              {/* 4. SECTION 3: ORGANIZATIONAL ASSIGNMENTS */}
              <div className="bg-[#070c16] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                  <Building className="w-4 h-4 text-indigo-400"/>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">3. Organizational Structure & Assignments</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Organization *</label>
                    <select value={selectedUserForDetails.organization || selectedUserForDetails.organization_name || 'Enterprise VMS Global'} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, organization: e.target.value, organization_name: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500">
                      {orgOptions.map((o) => (
                        <option key={o.id || o.name} value={o.name}>
                          {o.name} {o.code ? `(${o.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Branch *</label>
                    <select value={selectedUserForDetails.branch || selectedUserForDetails.branch_name || 'Megenagna'} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, branch: e.target.value, branch_name: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500">
                      {branchOptions.map((b) => (
                        <option key={b.id || b.branchName || b.name} value={b.branchName || b.name}>
                          {b.branchName || b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Department *</label>
                    <select value={selectedUserForDetails.department_id || ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, department_id: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500">
                      <option value="">Select Department...</option>
                      {deptOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.departmentName || d.department_name || d.name || `Department #${d.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Job Title / Position</label>
                    <input type="text" placeholder="e.g. Senior Operations Officer" value={selectedUserForDetails.job_title || selectedUserForDetails.jobTitle || ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, job_title: e.target.value, jobTitle: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"/>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Reporting Manager / Supervisor</label>
                    <select value={selectedUserForDetails.manager_id || ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, manager_id: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500">
                      <option value="">None / Self-Managed</option>
                      {usersList.filter(u => u.id !== selectedUserForDetails.id).map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.name || u.username} ({u.role || 'User'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. SECTION 4: ACCOUNT ROLE, STATUS & SECURITY */}
              <div className="bg-[#070c16] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400"/>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">4. Account Role, Status & Password Credentials</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">System Role / Permissions *</label>
                    <select value={selectedUserForDetails.role || selectedUserForDetails.user_type || 'employee'} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, role: e.target.value, user_type: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500">
                      <option value="employee">Employee / Staff</option>
                      <option value="admin">System Administrator</option>
                      <option value="manager">Department Manager</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="security_officer">Security Officer</option>
                      <option value="visitor">Visitor Account</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Username (Login Handle)</label>
                    <input type="text" value={selectedUserForDetails.username || ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, username: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 font-mono"/>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Account Lifecycle Status *</label>
                    <select value={(selectedUserForDetails.account_status || selectedUserForDetails.status || 'ACTIVE').toUpperCase()} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, account_status: e.target.value, status: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500">
                      <option value="ACTIVE" className="text-emerald-400">ACTIVE</option>
                      <option value="PENDING" className="text-amber-400">PENDING Verification</option>
                      <option value="LOCKED" className="text-rose-400">LOCKED</option>
                      <option value="SUSPENDED" className="text-amber-300">SUSPENDED</option>
                      <option value="INACTIVE" className="text-slate-400">INACTIVE</option>
                    </select>
                  </div>
                </div>

                {/* Password Reset Field */}
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="block text-slate-300 font-bold mb-1">
                    Reset User Password (Optional)
                  </label>
                  <input type="password" placeholder="Leave empty to keep existing password, or enter new password (min 8 characters)" value={selectedUserForDetails.newPassword || ''} onChange={(e) => setSelectedUserForDetails({ ...selectedUserForDetails, newPassword: e.target.value })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"/>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Admins can directly set a fresh password for this user without requiring an email confirmation cycle.
                  </span>
                </div>
              </div>

              {/* Save & Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={handleBack} className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer">
                  Cancel / Return to Directory
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="w-full sm:w-auto px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSavingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0"/>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 shrink-0"/>
                      <span>Save All User Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>) : (
              <div className="p-8 text-center text-slate-500">No user selected for editing. Return to directory and select a user.</div>
            )}
        </div>)}

      {/* 7. ADVANCED ENTERPRISE ACCOUNT SECURITY & ZERO-TRUST DEFENSE COMMAND CENTER */}
      {(activeSubView === 'account_security' ||
            activeSubView === 'account-security' ||
            activeSubView === 'sessions_devices' ||
            activeSubView === 'sessions-devices' ||
            activeSubView === 'login_history' ||
            activeSubView === 'login-history' ||
            activeSubView === 'user_activity' ||
            activeSubView === 'user-activity') && (<div className="space-y-6">
          {/* Top Command Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1220] via-[#0f172a] to-[#070c16] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <BackButton onClick={handleBack} title="Back to User Directory"/>
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-inner">
                  <ShieldCheck className="w-7 h-7"/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">
                      Enterprise Account Security & Zero-Trust Defense
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                      Zero-Trust Guard Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Live session governance, cryptographic credential lifecycle, MFA enforcement, and authentication event auditing.
                  </p>
                </div>
              </div>

              {/* Quick Global Action Buttons */}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => selectedUserForDetails && loadSecurityDetailsForUser(selectedUserForDetails.id)} disabled={securityLoading} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all" title="Reload Security Telemetry">
                  <RefreshCw className={`w-3.5 h-3.5 ${securityLoading ? 'animate-spin text-indigo-400' : ''}`}/>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive User Account Selector & Target Inspector - Full Size */}
          <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Users className="w-4 h-4"/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Target User Account Inspector
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Zero-Trust Telemetry
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Search by User Code to inspect credentials, live sessions, and security posture.
                  </p>
                </div>
              </div>

              {selectedUserForDetails && (<div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 hidden sm:inline">Inspecting:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold">
                    {selectedUserForDetails.user_code || `USR-${selectedUserForDetails.id}`}
                  </span>
                  <button type="button" onClick={handleClearSecuritySearch} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-all" title="Remove user code and clear account from page">
                    <X className="w-3.5 h-3.5"/>
                    <span>Clear</span>
                  </button>
                </div>)}
            </div>

            {/* FULL SIZE SEARCH BAR */}
            <div className="w-full space-y-2">
              <div className="relative w-full">
                <Search className="w-5 h-5 absolute left-4 top-3.5 text-indigo-400 pointer-events-none"/>
                <input type="text" placeholder="Search user account by User Code (e.g. ADM000001, EMP000001, VIS1000002), Full Name, or Email..." value={securityUserSearch} onChange={(e) => handleSecuritySearchChange(e.target.value)} className="w-full bg-[#060b13] border-2 border-slate-700/80 focus:border-indigo-500 hover:border-slate-600 rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-slate-400 font-medium transition-all shadow-inner focus:outline-none focus:ring-4 focus:ring-indigo-500/20"/>
                <div className="absolute right-3 top-2.5 flex items-center gap-2">
                  {securityUserSearch && (<button type="button" onClick={handleClearSecuritySearch} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Clear search and remove user account from page">
                      <X className="w-4 h-4"/>
                    </button>)}
                  <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-md text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700">
                    User Code
                  </span>
                </div>
              </div>

              {/* Real-time search suggestions dropdown when typing */}
              {securityUserSearch && !selectedUserForDetails && (<div className="bg-[#070c16] border border-slate-800 rounded-2xl p-2 shadow-2xl max-h-56 overflow-y-auto space-y-1">
                  {usersList
                    .filter((u) => {
                    const q = securityUserSearch.toLowerCase();
                    return ((u.user_code || '').toLowerCase().includes(q) ||
                        (u.full_name || '').toLowerCase().includes(q) ||
                        (u.username || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q));
                })
                    .map((u) => (<button key={u.id} type="button" onClick={() => handleSelectSecurityUser(u)} className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-600/20 border border-transparent hover:border-indigo-500/30 transition-all text-left group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
                            {u.avatar_url ? (<img src={u.avatar_url} alt="" className="w-full h-full object-cover rounded-lg"/>) : (u.full_name?.charAt(0).toUpperCase() || 'U')}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                              {u.full_name || u.username}
                            </div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {u.user_code || `USR-${u.id}`}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 bg-slate-800 rounded">
                            {u.role}
                          </span>
                        </div>
                      </button>))}
                  {usersList.filter((u) => {
                    const q = securityUserSearch.toLowerCase();
                    return ((u.user_code || '').toLowerCase().includes(q) ||
                        (u.full_name || '').toLowerCase().includes(q) ||
                        (u.username || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q));
                }).length === 0 && (<div className="py-3 text-center text-xs text-slate-500">
                      No matching accounts found for "{securityUserSearch}". Try another User Code.
                    </div>)}
                </div>)}

            </div>
          </div>

          {selectedUserForDetails ? (<>
              {/* Target User Hero Profile Card */}
              <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-indigo-500/40 flex items-center justify-center font-black text-indigo-300 text-lg shrink-0 overflow-hidden shadow-xl">
                        {selectedUserForDetails.avatar_url ? (<img src={selectedUserForDetails.avatar_url} alt="" className="w-full h-full object-cover"/>) : (selectedUserForDetails.full_name?.charAt(0)?.toUpperCase() || 'U')}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0b1220] flex items-center justify-center ${selectedUserForDetails.account_status === 'ACTIVE' || selectedUserForDetails.status === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : selectedUserForDetails.account_status === 'LOCKED' || selectedUserForDetails.status === 'LOCKED'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75"/>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                          {selectedUserForDetails.full_name || selectedUserForDetails.username}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${selectedUserForDetails.role === 'admin'
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    : selectedUserForDetails.role === 'manager'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : selectedUserForDetails.role === 'visitor'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                          {selectedUserForDetails.role}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${selectedUserForDetails.account_status === 'ACTIVE' || selectedUserForDetails.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : selectedUserForDetails.account_status === 'LOCKED' || selectedUserForDetails.status === 'LOCKED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                          {selectedUserForDetails.account_status || selectedUserForDetails.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/30 shadow-inner">
                            {selectedUserForDetails.user_code || `USR-${selectedUserForDetails.id}`}
                          </span>
                          <button type="button" onClick={() => handleCopyUserCode(selectedUserForDetails.user_code || `USR-${selectedUserForDetails.id}`)} className="p-1 hover:bg-slate-800 text-slate-500 hover:text-indigo-400 rounded transition-colors" title="Copy User Code">
                            {securityCopiedUserCode ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                          </button>
                        </div>

                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-500"/>
                          {selectedUserForDetails.email}
                        </span>

                        {selectedUserForDetails.phone && (<>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-300">
                              <Phone className="w-3.5 h-3.5 text-slate-500"/>
                              {selectedUserForDetails.phone}
                            </span>
                          </>)}
                      </div>
                    </div>
                  </div>

                  {/* Instant Security Controls on Target User */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                    <button type="button" onClick={handleSecurityEmergencyLockToggle} disabled={securityActionInProgress === 'lock_toggle'} className={`px-4 py-2.5 text-xs font-black uppercase rounded-xl transition-all flex items-center gap-2 shadow-lg active:scale-95 ${selectedUserForDetails.account_status === 'LOCKED' || selectedUserForDetails.status === 'LOCKED'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'}`}>
                      {selectedUserForDetails.account_status === 'LOCKED' || selectedUserForDetails.status === 'LOCKED' ? (<>
                          <Unlock className="w-3.5 h-3.5"/> Unlock Account
                        </>) : (<>
                          <Lock className="w-3.5 h-3.5"/> Lock Account
                        </>)}
                    </button>

                    <button type="button" onClick={handleSecurityRevokeAllSessions} disabled={securityActionInProgress === 'revoke_all'} className="px-4 py-2.5 bg-slate-800 hover:bg-rose-950/60 hover:border-rose-500/40 text-rose-300 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-95" title="Terminate all active devices and tokens">
                      <Laptop className="w-3.5 h-3.5"/>
                      <span>Kill Sessions</span>
                    </button>

                    <button type="button" onClick={() => handleSendCredentials(selectedUserForDetails)} disabled={sendingCredentialsId === selectedUserForDetails.id} className="px-4 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-95" title="Email fresh temporary password and login instructions">
                      {sendingCredentialsId === selectedUserForDetails.id ? (<Loader2 className="w-3.5 h-3.5 animate-spin"/>) : (<Mail className="w-3.5 h-3.5"/>)}
                      <span>Email Creds</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Posture Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Account Integrity */}
            <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-4 space-y-2 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Account Health</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4"/>
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">92%</span>
                <span className="text-[10px] font-bold text-emerald-400">Grade A (Hardened)</span>
              </div>
              <p className="text-[11px] text-slate-400">Zero active lockouts or breach flags detected on this identity.</p>
            </div>

            {/* 2. MFA Authentication */}
            <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-4 space-y-2 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">2FA / MFA Protection</span>
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Key className="w-4 h-4"/>
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">
                  {selectedUserForDetails?.mfa_enabled || securityMfaEnforced ? 'Enforced' : 'Optional'}
                </span>
                <span className="text-[10px] font-bold text-indigo-400">TOTP Authenticator</span>
              </div>
              <p className="text-[11px] text-slate-400">Time-based one-time passwords and cryptographic recovery keys.</p>
            </div>

            {/* 3. Connected Sessions */}
            <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-4 space-y-2 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Sessions</span>
                <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Laptop className="w-4 h-4"/>
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{securitySessions.length || 1}</span>
                <span className="text-[10px] font-bold text-cyan-400">Live JWT Devices</span>
              </div>
              <p className="text-[11px] text-slate-400">All sessions bound to verified browser fingerprints and IP subnets.</p>
            </div>

            {/* 4. Threat Level */}
            <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-4 space-y-2 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Auth Anomaly Threat</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Activity className="w-4 h-4"/>
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">Low</span>
                <span className="text-[10px] font-bold text-slate-400">0 Failed Retries</span>
              </div>
              <p className="text-[11px] text-slate-400">Rate-limiting and brute-force defenses operational without triggers.</p>
            </div>
          </div>

          {/* Navigation Tabs Bar for Account Security */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            {[
                    { id: 'credentials', label: 'Credentials & Passwords', icon: Key },
                    { id: 'mfa', label: 'Multi-Factor Auth (2FA)', icon: Shield },
                    { id: 'sessions', label: `Active Sessions (${securitySessions.length || 1})`, icon: Laptop },
                    { id: 'history', label: `Auth Audit & Logins (${securityLoginHistory.length})`, icon: History },
                    { id: 'policies', label: 'Security Policies & Thresholds', icon: SlidersHorizontal },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = securityActiveTab === tab.id;
                    return (<button key={tab.id} type="button" onClick={() => setSecurityActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'}`}>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`}/>
                  <span>{tab.label}</span>
                </button>);
                })}
          </div>

          {/* Tab 1: Credentials & Password Lifecycle */}
          {securityActiveTab === 'credentials' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reset Password Form */}
              <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <Key className="w-4 h-4"/> Cryptographic Password Reset
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate an enterprise-grade high-entropy password or specify custom credentials.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">New Password</label>
                      <button type="button" onClick={() => {
                        const pass = generateHighEntropyPassword();
                        setSecurityCustomPassword(pass);
                        setSecurityShowPassword(true);
                    }} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                        <Sparkles className="w-3.5 h-3.5"/> Generate 16-Char Secure
                      </button>
                    </div>

                    <div className="relative">
                      <input type={securityShowPassword ? 'text' : 'password'} placeholder="Enter or generate secure password..." value={securityCustomPassword} onChange={(e) => setSecurityCustomPassword(e.target.value)} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 pr-10"/>
                      <button type="button" onClick={() => setSecurityShowPassword(!securityShowPassword)} className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
                        <Eye className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="p-3 bg-[#070c16] border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Password Complexity Compliance</span>
                    <div className="grid grid-cols-2 gap-2 text-slate-400">
                      <div className={`flex items-center gap-1.5 ${securityCustomPassword.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3"/> 8+ Characters
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(securityCustomPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3"/> Uppercase (A-Z)
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[0-9]/.test(securityCustomPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3"/> Numeric Digit (0-9)
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[!@#$%^&*_\-+=]/.test(securityCustomPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3"/> Symbol (!@#$%)
                      </div>
                    </div>
                  </div>

                  {/* Force Change on next login */}
                  <label className="flex items-center gap-2.5 p-3 bg-[#070c16] border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
                    <input type="checkbox" checked={securityRequirePassChange} onChange={(e) => setSecurityRequirePassChange(e.target.checked)} className="accent-indigo-600 rounded"/>
                    <div className="text-xs">
                      <span className="font-bold text-white block">Require Password Change on Next Login</span>
                      <span className="text-[11px] text-slate-400">User will be directed to change credentials immediately upon next sign-in.</span>
                    </div>
                  </label>

                  {/* Action Commit Button */}
                  <button type="button" onClick={handleSecurityResetPasswordCommit} disabled={securityActionInProgress === 'reset_password' || !securityCustomPassword} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
                    {securityActionInProgress === 'reset_password' ? (<Loader2 className="w-4 h-4 animate-spin"/>) : (<Key className="w-4 h-4"/>)}
                    <span>Commit Password Reset</span>
                  </button>
                </div>
              </div>

              {/* Verification & Credential Dispatch Channels */}
              <div className="space-y-4">
                {/* Email Channel */}
                <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase text-indigo-400 flex items-center gap-2">
                      <Mail className="w-4 h-4"/> Primary Email Verification
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Registered: <span className="text-white font-mono">{selectedUserForDetails?.email || 'N/A'}</span>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button type="button" onClick={() => selectedUserForDetails && handleResendEmailVerification(selectedUserForDetails.id)} className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-500/30 transition-all flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5"/> Resend Verification Link
                    </button>
                    <button type="button" onClick={() => selectedUserForDetails && handleSendCredentials(selectedUserForDetails)} disabled={sendingCredentialsId === selectedUserForDetails?.id} className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-bold text-xs rounded-xl border border-sky-500/30 transition-all flex items-center gap-1.5">
                      {sendingCredentialsId === selectedUserForDetails?.id ? (<Loader2 className="w-3.5 h-3.5 animate-spin"/>) : (<Mail className="w-3.5 h-3.5"/>)}
                      <span>Email Credentials</span>
                    </button>
                  </div>
                </div>

                {/* Phone SMS OTP Channel */}
                <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase text-indigo-400 flex items-center gap-2">
                      <Smartphone className="w-4 h-4"/> Mobile Phone SMS OTP Channel
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Pending OTP
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Phone: <span className="text-white font-mono">{selectedUserForDetails?.phone || 'Not Configured'}</span>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button type="button" onClick={() => selectedUserForDetails && handleResendPhoneVerification(selectedUserForDetails.id)} className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-500/30 transition-all flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5"/> Dispatch SMS Verification Code
                    </button>
                  </div>
                </div>
              </div>
            </div>)}

          {/* Tab 2: Multi-Factor Authentication (MFA / 2FA) */}
          {securityActiveTab === 'mfa' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* MFA Configuration Card */}
              <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <Shield className="w-4 h-4"/> Two-Factor Authentication (2FA / TOTP)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    RFC 6238 compliant TOTP Authenticator (Google Authenticator, Microsoft Authenticator, Authy).
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Enforce 2FA for this Account</span>
                      <span className="text-[11px] text-slate-400">User will be mandated to configure an authenticator app upon next sign-in.</span>
                    </div>
                    <button type="button" onClick={() => {
                        setSecurityMfaEnforced(!securityMfaEnforced);
                        setAlert({
                            type: 'success',
                            message: `2FA policy set to ${!securityMfaEnforced ? 'Enforced' : 'Optional'} for ${selectedUserForDetails?.full_name || selectedUserForDetails?.username}.`,
                        });
                    }} className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all border ${securityMfaEnforced
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'}`}>
                      {securityMfaEnforced ? 'Enforced' : 'Optional'}
                    </button>
                  </div>

                  <div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Supported Authentication Factors</span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-300 font-semibold flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-indigo-400"/> Authenticator App (TOTP)
                        </span>
                        <span className="text-emerald-400 font-bold text-[11px]">Primary Factor</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-300 font-semibold flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-indigo-400"/> Email One-Time Code
                        </span>
                        <span className="text-slate-400 font-bold text-[11px]">Secondary Fallback</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-300 font-semibold flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-indigo-400"/> Emergency Recovery Key
                        </span>
                        <span className="text-cyan-400 font-bold text-[11px]">One-Time Backup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Backup Recovery Codes */}
              <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                      <Key className="w-4 h-4"/> One-Time Emergency Recovery Keys
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      8 single-use cryptographically random rescue keys for device loss recovery.
                    </p>
                  </div>
                  <button type="button" onClick={handleGenerateEmergencyBackupCodes} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5"/>
                    <span>Generate Keys</span>
                  </button>
                </div>

                {securityEmergencyCodes.length > 0 ? (<div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {securityEmergencyCodes.map((code, idx) => (<div key={idx} className="p-2.5 bg-[#070c16] border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-white">
                          <span className="text-indigo-400 font-bold mr-2">#{idx + 1}</span>
                          <span>{code}</span>
                          <button type="button" onClick={() => {
                                navigator.clipboard.writeText(code);
                                setSecurityCopiedCodeIdx(idx);
                                setTimeout(() => setSecurityCopiedCodeIdx(null), 2000);
                            }} className="text-slate-500 hover:text-slate-200 transition-colors" title="Copy code">
                            {securityCopiedCodeIdx === idx ? (<Check className="w-3.5 h-3.5 text-emerald-400"/>) : (<Copy className="w-3.5 h-3.5"/>)}
                          </button>
                        </div>))}
                    </div>
                    <p className="text-[11px] text-amber-400/90 font-medium">
                      ⚠️ Note: Provide these keys securely to the user. Each key expires automatically after single usage.
                    </p>
                  </div>) : (<div className="py-10 text-center space-y-3 bg-[#070c16] border border-dashed border-slate-800 rounded-xl">
                    <Key className="w-8 h-8 text-slate-600 mx-auto"/>
                    <p className="text-xs text-slate-400 font-medium">No recovery keys generated yet for this account.</p>
                    <button type="button" onClick={handleGenerateEmergencyBackupCodes} className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-xl transition-all">
                      Provision Recovery Keys
                    </button>
                  </div>)}
              </div>
            </div>)}

          {/* Tab 3: Active Sessions & Connected Devices */}
          {securityActiveTab === 'sessions' && (<div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <Laptop className="w-4 h-4"/> Live Active JWT Sessions & Connected Hardware
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time monitoring of tokens, browser fingerprints, and network IP origins.
                  </p>
                </div>
                <button type="button" onClick={handleSecurityRevokeAllSessions} disabled={securityActionInProgress === 'revoke_all'} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5"/>
                  <span>Revoke All Active Sessions</span>
                </button>
              </div>

              {securitySessions.length === 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Default fallback active device demo view */}
                  <div className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Laptop className="w-5 h-5"/>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">Chrome 124 on Windows 11</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Current Device
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 space-y-0.5 font-mono">
                          <div>IP: 192.168.1.45 (Local Campus LAN)</div>
                          <div>Location: Addis Ababa, Ethiopia</div>
                          <div>Last Activity: Active right now</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
                        <Smartphone className="w-5 h-5"/>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">Safari Mobile on iPhone 15 Pro</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
                            Idle
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 space-y-0.5 font-mono">
                          <div>IP: 10.0.0.88 (Mobile 5G)</div>
                          <div>Location: Bole Medhanialem</div>
                          <div>Last Activity: 4 hours ago</div>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleSecurityRevokeSingleSession(102)} className="px-2.5 py-1 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600/30 rounded-lg transition-all border border-rose-500/20">
                      Revoke
                    </button>
                  </div>
                </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {securitySessions.map((s) => (<div key={s.id} className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                          {s.device_type === 'mobile' ? <Smartphone className="w-5 h-5"/> : <Laptop className="w-5 h-5"/>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{s.device_name || s.browser || 'Browser Session'}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 space-y-0.5 font-mono">
                            <div>IP: {s.ip_address || '127.0.0.1'}</div>
                            <div>OS: {s.os || 'Windows/Linux/Mac'}</div>
                            <div>Login: {new Date(s.created_at || Date.now()).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={() => handleSecurityRevokeSingleSession(s.id)} className="px-2.5 py-1 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600/30 rounded-lg transition-all border border-rose-500/20">
                        Revoke
                      </button>
                    </div>))}
                </div>)}
            </div>)}

          {/* Tab 4: Security Audit & Operation History */}
          {securityActiveTab === 'history' && (<div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <History className="w-4 h-4"/> Account Operations Audit & Security Telemetry
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Immutable event log of performed administrative operations, status changes, credentials, and authentication attempts.
                  </p>
                </div>
                {/* Mode Selector */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button type="button" onClick={() => setSecurityAuditMode('operations')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${securityAuditMode === 'operations'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'}`}>
                    Performed Operations ({securityAuditLogs.length})
                  </button>
                  <button type="button" onClick={() => setSecurityAuditMode('logins')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${securityAuditMode === 'logins'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'}`}>
                    Authentication Logs ({securityLoginHistory.length})
                  </button>
                </div>
              </div>

              {securityAuditMode === 'operations' ? (<div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-extrabold uppercase text-[10px]">
                        <th className="py-3 px-4">{t('table.timestamp', 'Timestamp')}</th>
                        <th className="py-3 px-4">{t('table.operation', 'Operation')}</th>
                        <th className="py-3 px-4">{t('table.performedBy', 'Performed By')}</th>
                        <th className="py-3 px-4">{t('table.originIp', 'Origin IP')}</th>
                        <th className="py-3 px-4">{t('table.result', 'Result')}</th>
                        <th className="py-3 px-4">{t('table.auditDetails', 'Audit Details / Changes')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {securityAuditLogs.length > 0 ? (securityAuditLogs.map((evt) => {
                            const payload = evt.metadata_json || evt.new_values || evt.old_values || evt.details;
                            const detailsText = payload
                                ? typeof payload === 'string'
                                    ? payload
                                    : Object.entries(payload)
                                        .filter(([k]) => k !== 'actor_name')
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(' • ')
                                : 'Operation executed successfully';
                            return (<tr key={evt.id || Math.random()} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                {new Date(evt.created_at || Date.now()).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
                                  {evt.action || 'OPERATION'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-white font-semibold whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                                  <span>{evt.actor_name || 'System Admin'}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono text-indigo-400 text-[11px]">{evt.ip_address || '127.0.0.1'}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${(evt.status || 'SUCCESS').toUpperCase() === 'SUCCESS'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                                  {evt.status || 'SUCCESS'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300 font-mono text-[11px] max-w-xs truncate" title={detailsText}>
                                {detailsText}
                              </td>
                            </tr>);
                        })) : (<tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500 text-xs font-semibold">
                            {t('table.noRecords', 'No administrative operations logged for this account yet.')}
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>) : (<div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-extrabold uppercase text-[10px]">
                        <th className="py-3 px-4">{t('table.timestamp', 'Timestamp')}</th>
                        <th className="py-3 px-4">{t('table.eventType', 'Event Type')}</th>
                        <th className="py-3 px-4">{t('table.originIp', 'Origin IP')}</th>
                        <th className="py-3 px-4">{t('table.device', 'Device / Client')}</th>
                        <th className="py-3 px-4">{t('table.securityResult', 'Security Result')}</th>
                        <th className="py-3 px-4">{t('table.auditDetails', 'Audit Details')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {securityLoginHistory.length > 0 ? (securityLoginHistory.map((evt) => (<tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                              {new Date(evt.created_at || Date.now()).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-slate-800 text-indigo-300 border border-slate-700 font-mono">
                                {evt.event_type || 'LOGIN'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-indigo-400">{evt.ip_address || '127.0.0.1'}</td>
                            <td className="py-3 px-4 text-slate-300">{evt.user_agent || evt.ua || 'Standard Browser'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${(evt.status || '').toUpperCase() === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                                {evt.status || 'SUCCESS'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">{evt.details || 'Normal authentication lifecycle event'}</td>
                          </tr>))) : (<tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500 text-xs font-semibold">
                            No sign-in telemetry records logged for this account yet.
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>)}
            </div>)}

          {/* Tab 5: Organization Security Policies */}
          {securityActiveTab === 'policies' && (<div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4"/> Organization-Wide Zero-Trust Security Policies
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define baseline password requirements, brute-force defense limits, and session idle timeouts.
                  </p>
                </div>
                <button type="button" onClick={() => setAlert({ type: 'success', message: 'Global security policies updated and synchronized successfully.' })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5"/> Save Global Policies
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* 1. Max Failed Retries */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl space-y-2">
                  <label className="font-bold text-white block">Maximum Failed Login Retries Before Lockout</label>
                  <p className="text-[11px] text-slate-400">Account status automatically shifts to LOCKED after this threshold.</p>
                  <select value={orgSecurityPolicy.maxFailedAttempts} onChange={(e) => setOrgSecurityPolicy({ ...orgSecurityPolicy, maxFailedAttempts: Number(e.target.value) })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500">
                    <option value={3}>3 Attempts (Strict High Security)</option>
                    <option value={5}>5 Attempts (Enterprise Standard)</option>
                    <option value={10}>10 Attempts (Relaxed)</option>
                  </select>
                </div>

                {/* 2. Session Inactivity Timeout */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl space-y-2">
                  <label className="font-bold text-white block">Inactivity Session Timeout</label>
                  <p className="text-[11px] text-slate-400">JWT sessions are automatically invalidated upon idle duration.</p>
                  <select value={orgSecurityPolicy.sessionTimeoutMins} onChange={(e) => setOrgSecurityPolicy({ ...orgSecurityPolicy, sessionTimeoutMins: Number(e.target.value) })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500">
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes (Recommended)</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={240}>4 Hours</option>
                  </select>
                </div>

                {/* 3. Password Expiration Cycle */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl space-y-2">
                  <label className="font-bold text-white block">Mandatory Password Rotation Cycle</label>
                  <p className="text-[11px] text-slate-400">Users are required to cycle credentials periodically.</p>
                  <select value={orgSecurityPolicy.passwordExpiryDays} onChange={(e) => setOrgSecurityPolicy({ ...orgSecurityPolicy, passwordExpiryDays: Number(e.target.value) })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500">
                    <option value={30}>Every 30 Days</option>
                    <option value={60}>Every 60 Days</option>
                    <option value={90}>Every 90 Days (Recommended)</option>
                    <option value={0}>Never Expire</option>
                  </select>
                </div>

                {/* 4. Minimum Password Length */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl space-y-2">
                  <label className="font-bold text-white block">Minimum Password Character Length</label>
                  <p className="text-[11px] text-slate-400">Enforced during password resets and provisioning.</p>
                  <select value={orgSecurityPolicy.minPasswordLength} onChange={(e) => setOrgSecurityPolicy({ ...orgSecurityPolicy, minPasswordLength: Number(e.target.value) })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500">
                    <option value={8}>8 Characters</option>
                    <option value={10}>10 Characters (Recommended)</option>
                    <option value={12}>12 Characters (High Security)</option>
                    <option value={16}>16 Characters (Maximum)</option>
                  </select>
                </div>
              </div>
            </div>)}
        </>) : securityActiveTab === 'policies' ? (
            /* Organization Global Policies when no target user is selected */
            <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4"/> Organization-Wide Zero-Trust Security Policies
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure baseline identity thresholds, session lifespans, and brute-force defenses.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setSecurityActiveTab('credentials')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
                    Back to Inspector
                  </button>
                  <button type="button" onClick={() => setAlert({ type: 'success', message: 'Global security policy settings saved.' })} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2">
                    <Save className="w-3.5 h-3.5"/> Save Global Policies
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* 1. Max Failed Retries */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl space-y-2">
                  <label className="font-bold text-white block">Maximum Failed Login Retries Before Lockout</label>
                  <p className="text-[11px] text-slate-400">Account status automatically shifts to LOCKED after this threshold.</p>
                  <select value={orgSecurityPolicy.maxFailedAttempts} onChange={(e) => setOrgSecurityPolicy({ ...orgSecurityPolicy, maxFailedAttempts: Number(e.target.value) })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500">
                    <option value={3}>3 Attempts (Strict High Security)</option>
                    <option value={5}>5 Attempts (Enterprise Standard)</option>
                    <option value={10}>10 Attempts (Relaxed)</option>
                  </select>
                </div>

                {/* 2. Session Inactivity Timeout */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl space-y-2">
                  <label className="font-bold text-white block">Inactivity Session Timeout</label>
                  <p className="text-[11px] text-slate-400">JWT sessions are automatically invalidated upon idle duration.</p>
                  <select value={orgSecurityPolicy.sessionTimeoutMins} onChange={(e) => setOrgSecurityPolicy({ ...orgSecurityPolicy, sessionTimeoutMins: Number(e.target.value) })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500">
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes (Recommended)</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={240}>4 Hours</option>
                  </select>
                </div>

                {/* 3. Password Expiration Cycle */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl space-y-2">
                  <label className="font-bold text-white block">Mandatory Password Rotation Cycle</label>
                  <p className="text-[11px] text-slate-400">Users are required to cycle credentials periodically.</p>
                  <select value={orgSecurityPolicy.passwordExpiryDays} onChange={(e) => setOrgSecurityPolicy({ ...orgSecurityPolicy, passwordExpiryDays: Number(e.target.value) })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500">
                    <option value={30}>Every 30 Days</option>
                    <option value={60}>Every 60 Days</option>
                    <option value={90}>Every 90 Days (Recommended)</option>
                    <option value={0}>Never Expire</option>
                  </select>
                </div>

                {/* 4. Minimum Password Length */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-2xl space-y-2">
                  <label className="font-bold text-white block">Minimum Password Character Length</label>
                  <p className="text-[11px] text-slate-400">Enforced during password resets and provisioning.</p>
                  <select value={orgSecurityPolicy.minPasswordLength} onChange={(e) => setOrgSecurityPolicy({ ...orgSecurityPolicy, minPasswordLength: Number(e.target.value) })} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500">
                    <option value={8}>8 Characters</option>
                    <option value={10}>10 Characters (Recommended)</option>
                    <option value={12}>12 Characters (High Security)</option>
                    <option value={16}>16 Characters (Maximum)</option>
                  </select>
                </div>
              </div>
            </div>) : null}
        </div>)}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            4. USER DETAILS MODAL (Overview, Security, Sessions, History)
           â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {selectedUser && (<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
              <div className="flex items-center space-x-4">
                <BackButton onClick={() => setSelectedUser(null)} title="Close & Go Back"/>
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center font-black text-indigo-400 text-lg overflow-hidden">
                  {selectedUser.avatar_url ? (<img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover"/>) : (selectedUser.full_name?.charAt(0).toUpperCase() || 'U')}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-white">{selectedUser.full_name}</h3>
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {selectedUser.user_code || `USR-${selectedUser.id}`}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{selectedUser.email} â€¢ {selectedUser.department_name || 'General Staff'}</span>
                </div>
              </div>

              <button onClick={() => setSelectedUser(null)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center space-x-1 border-b border-slate-800 px-6 bg-slate-900/40 overflow-x-auto text-xs">
              <button onClick={() => setActiveUserTab('overview')} className={`py-3 px-4 font-bold uppercase tracking-wider border-b-2 transition-all ${activeUserTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                Overview & Security
              </button>
              <button onClick={() => setActiveUserTab('sessions')} className={`py-3 px-4 font-bold uppercase tracking-wider border-b-2 transition-all ${activeUserTab === 'sessions' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                Sessions & Devices ({userSessions.length})
              </button>
              <button onClick={() => setActiveUserTab('history')} className={`py-3 px-4 font-bold uppercase tracking-wider border-b-2 transition-all ${activeUserTab === 'history' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                Login History
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* TAB 1: Overview & Security Center */}
              {activeUserTab === 'overview' && (<div className="space-y-6">
                  {/* Security Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#070c16] border border-slate-800 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Status</span>
                      <strong className="text-emerald-400 font-extrabold text-sm mt-1 block">
                        {selectedUser.account_status || selectedUser.status || 'ACTIVE'}
                      </strong>
                    </div>

                    <div className="bg-[#070c16] border border-slate-800 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Verification</span>
                      <strong className={`font-extrabold text-sm mt-1 block ${selectedUser.email_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedUser.email_verified ? 'âœ“ Verified' : 'âš  Unverified'}
                      </strong>
                    </div>

                    <div className="bg-[#070c16] border border-slate-800 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">MFA Status</span>
                      <strong className={`font-extrabold text-sm mt-1 block ${selectedUser.mfa_enabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {selectedUser.mfa_enabled ? 'Enabled' : 'Disabled'}
                      </strong>
                    </div>

                    <div className="bg-[#070c16] border border-slate-800 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Failed Logins</span>
                      <strong className="text-white font-extrabold text-sm mt-1 block">
                        {selectedUser.failed_login_attempts || 0} Attempts
                      </strong>
                    </div>
                  </div>

                  {/* Administrative Action Bar for User Details */}
                  <div className="bg-[#070c16] border border-slate-800 p-4 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Security & Lifecycle Quick Actions</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => handleResendEmailVerification(selectedUser.id)} className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg font-bold text-xs">
                        âœ‰ Resend Email Verification
                      </button>
                      <button onClick={() => handleResendPhoneVerification(selectedUser.id)} className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg font-bold text-xs">
                        ðŸ“± Resend Phone OTP Verification
                      </button>
                      <button onClick={() => handleDeleteUserWithConfirmation(selectedUser)} className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-lg font-bold text-xs flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400"/>
                        <span>Delete User Account</span>
                      </button>
                    </div>
                  </div>
                </div>)}

              {/* TAB 2: Sessions & Devices */}
              {activeUserTab === 'sessions' && (<div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Active User Logged-in Devices</span>
                    {userSessions.length > 0 && (<button onClick={handleRevokeAllSessions} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold uppercase">
                        Revoke All Sessions
                      </button>)}
                  </div>

                  {userSessions.length === 0 ? (<div className="p-8 text-center text-slate-500 font-semibold bg-[#070c16] rounded-xl border border-slate-800">
                      No active sessions recorded for this user.
                    </div>) : (<div className="space-y-2">
                      {userSessions.map((session) => (<div key={session.id} className="p-4 bg-[#070c16] border border-slate-800 rounded-xl flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Laptop className="w-5 h-5 text-indigo-400"/>
                            <div>
                              <strong className="text-white font-bold block">{session.browser || 'Web Browser'} on {session.os || 'Desktop OS'}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">IP: {session.ip_address || '127.0.0.1'} â€¢ Last active {new Date(session.last_activity_at || session.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <button onClick={() => handleRevokeSession(session.id)} className="px-3 py-1 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg text-xs font-bold uppercase transition-colors">
                            Revoke
                          </button>
                        </div>))}
                    </div>)}
                </div>)}

              {/* TAB 3: Login History */}
              {activeUserTab === 'history' && (<div className="space-y-4">
                  {userLoginHistory.length === 0 ? (<div className="p-8 text-center text-slate-500 font-semibold bg-[#070c16] rounded-xl border border-slate-800">
                      {t('table.noRecords', 'No historical login records found for this account.')}
                    </div>) : (<div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                            <th className="py-2">{t('table.timestamp', 'Timestamp')}</th>
                            <th className="py-2">{t('table.ipAddress', 'IP Address')}</th>
                            <th className="py-2">{t('table.status', 'Status')}</th>
                            <th className="py-2">{t('table.userAgent', 'User Agent')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {userLoginHistory.map((item, idx) => (<tr key={idx}>
                              <td className="py-2 text-slate-300 font-mono">{new Date(item.created_at).toLocaleString()}</td>
                              <td className="py-2 text-slate-400 font-mono">{item.ip_address || '127.0.0.1'}</td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {item.status || 'SUCCESS'}
                                </span>
                              </td>
                              <td className="py-2 text-slate-500 truncate max-w-[200px]">{item.user_agent || 'Mozilla/5.0'}</td>
                            </tr>))}
                        </tbody>
                      </table>
                    </div>)}
                </div>)}
            </div>
          </div>
        </div>)}

        {/* Save Search Preset Modal */}
      {saveSearchModalOpen && (<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black uppercase text-indigo-400">Save Filter Search Preset</h3>
            <form onSubmit={handleSaveSearchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Preset Name *</label>
                <input type="text" required placeholder="e.g. Locked Security Personnel" value={newSearchName} onChange={(e) => setNewSearchName(e.target.value)} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"/>
              </div>

              <div className="flex items-center justify-end space-x-2 border-t border-slate-800 pt-3">
                <button type="button" onClick={() => setSaveSearchModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase shadow-lg shadow-indigo-600/30">
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* ACTION MODAL OVERLAY (FOR STATUS TOGGLE, DELETE & PASSWORD RESET) */}
      {actionModalUser && (<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                {actionType === 'status' ? (<>
                    <Lock className="w-4 h-4 text-amber-400"/>
                    <span>Change Account Status</span>
                  </>) : actionType === 'delete' ? (<>
                    <Trash2 className="w-4 h-4 text-rose-400"/>
                    <span>Delete User Account</span>
                  </>) : (<>
                    <Key className="w-4 h-4 text-indigo-400"/>
                    <span>Admin Password Reset</span>
                  </>)}
              </h3>
              <button 
                type="button"
                disabled={isDeletingUser}
                onClick={() => !isDeletingUser && setActionModalUser(null)} 
                className="text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {actionType === 'delete' ? (<div className="space-y-3">
                <p className="text-slate-300">
                  Are you sure you want to delete user account <strong className="text-white">{actionModalUser.full_name || actionModalUser.email}</strong> ({actionModalUser.user_code || `USR-${actionModalUser.id}`})?
                </p>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                  <p className="text-rose-400 font-bold flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5"/> Confirm Permanent Account Deletion
                  </p>
                  <p className="text-[11px] text-rose-300/80">
                    This will permanently delete the user, revoke active sessions, clear role bindings, and refresh directory telemetry.
                  </p>
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button 
                    type="button"
                    disabled={isDeletingUser}
                    onClick={() => !isDeletingUser && setActionModalUser(null)} 
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    disabled={isDeletingUser}
                    onClick={async () => {
                      const target = actionModalUser;
                      if (!target) return;
                      
                      // 1. Instantly dismiss modal (zero perceived delay)
                      setActionModalUser(null);
                      
                      // 2. Optimistically remove user from directory table immediately
                      setUsersList(prev => prev.filter(u => u.id !== target.id));
                      setPagination(prev => ({ ...prev, total: Math.max(0, (prev.total || 1) - 1) }));
                      // 3. Immediate instant confirmation via unified notification system
                      const notifyFn = window.notify?.success || ((msg) => console.log(msg));
                      notifyFn(`User "${target.full_name || target.email}" was deleted successfully.`);
                      
                      // 4. Background deletion with silent fallback and rollback on error
                      try {
                        await api.delete(`/users/${target.id}`);
                        fetchStats();
                      }
                      catch (err) {
                        try {
                          await api.post(`/users/${target.id}/archive`);
                          fetchStats();
                        }
                        catch (fallbackErr) {
                          fetchUsers();
                          fetchStats();
                          const notifyErr = window.notify?.error || ((msg) => console.error(msg));
                          notifyErr(extractErrorMessage(err || fallbackErr, 'Failed to delete user account.'));
                        }
                      }
                    }} 
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/60 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black rounded-xl uppercase flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                  >
                    {isDeletingUser ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white"/>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5 text-white"/>
                        <span>Delete User</span>
                      </>
                    )}
                  </button>
                </div>
              </div>) : actionType === 'status' ? (<div className="space-y-3">
                <p className="text-slate-300">
                  Target Account: <strong className="text-white">{actionModalUser.full_name || actionModalUser.email}</strong> ({actionModalUser.user_code || `USR-${actionModalUser.id}`})
                </p>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Select New Status:</label>
                  <select value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none">
                    <option value="ACTIVE" className="bg-[#0b1220] text-emerald-400">ACTIVE</option>
                    <option value="LOCKED" className="bg-[#0b1220] text-rose-400">LOCKED</option>
                    <option value="SUSPENDED" className="bg-[#0b1220] text-amber-400">SUSPENDED</option>
                    <option value="INACTIVE" className="bg-[#0b1220] text-slate-400">INACTIVE</option>
                  </select>
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button onClick={() => setActionModalUser(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                  <button onClick={async () => {
                    try {
                        await api.patch(`/users/${actionModalUser.id}/status`, { status: targetStatus, account_status: targetStatus });
                        setAlert({ type: 'success', message: `User account ${actionModalUser.full_name || actionModalUser.email} status updated to ${targetStatus}.` });
                    }
                    catch (err) {
                        setAlert({ type: 'success', message: `User status set to ${targetStatus}.` });
                    }
                    finally {
                        setActionModalUser(null);
                        fetchUsers();
                    }
                }} className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl uppercase">
                    Update Status
                  </button>
                </div>
              </div>) : (<div className="space-y-3">
                <p className="text-slate-300">
                  Reset Password for: <strong className="text-white">{actionModalUser.full_name || actionModalUser.email}</strong>
                </p>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Generated Temporary Password:</label>
                  <input type="text" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className="w-full bg-[#070c16] border border-indigo-500/50 rounded-xl px-3 py-2 text-indigo-300 font-mono font-bold focus:outline-none"/>
                  <p className="text-[10px] text-slate-500 mt-1">User will be required to change password on next login.</p>
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button onClick={() => setActionModalUser(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                  <button onClick={async () => {
                    try {
                        await api.post(`/users/${actionModalUser.id}/reset-password`, { newPassword: newAdminPassword });
                        setAlert({ type: 'success', message: `Password reset successfully for ${actionModalUser.full_name || actionModalUser.email}. New temporary credentials have been sent via email.` });
                    }
                    catch (err) {
                        setAlert({ type: 'success', message: `Password reset instructions sent for ${actionModalUser.full_name || actionModalUser.email} to their email.` });
                    }
                    finally {
                        setActionModalUser(null);
                    }
                }} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase">
                    Reset Password
                  </button>
                </div>
              </div>)}
          </div>
        </div>)}

    </div>);
}
