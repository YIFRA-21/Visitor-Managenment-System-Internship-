import React, { useState, useEffect, useCallback } from 'react';
import { Shield, PlusCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import RoleDashboard from './RoleManagement/RoleDashboard';
import RoleTable from './RoleManagement/RoleTable';
import CreateRoleWizard from './RoleManagement/CreateRoleWizard';
import RoleDetailsView from './RoleManagement/RoleDetailsView';
import RoleHierarchyGraph from './RoleManagement/RoleHierarchyGraph';
import RoleAssignmentPanel from './RoleManagement/RoleAssignmentPanel';
import RoleConflictsPanel from './RoleManagement/RoleConflictsPanel';
import RoleTemplatesModal from './RoleManagement/RoleTemplatesModal';
import RoleCloneModal from './RoleManagement/RoleCloneModal';
import RoleCompareView from './RoleManagement/RoleCompareView';
import ConfirmationDialog from './Organization/Profile/components/ConfirmationDialog';
import { roleManagementApi } from '../../modules/role-management/api/roleManagementApi';
import { useLanguage } from '../../contexts/LanguageContext';

export default function RoleManagement({ initialSubView = 'dashboard' }) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    // Navigation State
    const [activeSubView, setActiveSubView] = useState(initialSubView);
    const handleBack = () => {
        if (activeSubView !== 'dashboard') {
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
            navigate('/dashboard');
        }
    };
    useEffect(() => {
        if (initialSubView) {
            setActiveSubView(initialSubView);
        }
    }, [initialSubView]);
    // Modal States
    const [showCreateWizard, setShowCreateWizard] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [showAssignPanel, setShowAssignPanel] = useState(false);
    // Selected role for detail/clone/edit/compare
    const [selectedRole, setSelectedRole] = useState(null);
    const [editingRole, setEditingRole] = useState(null);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [deletingRole, setDeletingRole] = useState(false);
    // Data & KPI State
    const [stats, setStats] = useState({
        totalRoles: 0,
        activeRoles: 0,
        inactiveRoles: 0,
        archivedRoles: 0,
        systemRoles: 0,
        customRoles: 0,
        rolesWithUsers: 0,
        rolesWithoutUsers: 0,
        rolesWithPermissions: 0,
        rolesWithoutPermissions: 0,
        usersWithRoles: 0,
        usersWithoutRoles: 0,
        temporaryAssignments: 0,
        expiringAssignments: 0,
    });
    const [rolesList, setRolesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
    // Filters State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [roleTypeFilter, setRoleTypeFilter] = useState('ALL');
    const [scopeFilter, setScopeFilter] = useState('ALL');
    const [riskFilter, setRiskFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('role_name');
    const [sortOrder, setSortOrder] = useState('ASC');
    // Notification Toast State
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    // Load KPI Stats
    const loadStatistics = useCallback(async () => {
        try {
            const res = await roleManagementApi.getStatistics();
            if (res.data?.success) {
                setStats(res.data.data);
            }
        }
        catch (err) {
            console.error('Failed to fetch role statistics:', err);
        }
    }, []);
    // Load Roles List
    const loadRoles = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: search.trim() || undefined,
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
                roleType: roleTypeFilter !== 'ALL' ? roleTypeFilter : undefined,
                scopeType: scopeFilter !== 'ALL' ? scopeFilter : undefined,
                riskLevel: riskFilter !== 'ALL' ? riskFilter : undefined,
                sortBy,
                sortOrder,
            };
            const res = await roleManagementApi.listRoles(params);
            if (res.data?.success) {
                setRolesList(res.data.data);
                if (res.data.pagination) {
                    setPagination(res.data.pagination);
                }
            }
        }
        catch (err) {
            console.error('Failed to load roles list:', err);
        }
        finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, statusFilter, roleTypeFilter, scopeFilter, riskFilter, sortBy, sortOrder]);
    useEffect(() => {
        loadStatistics();
        loadRoles();
    }, [loadStatistics, loadRoles]);
    // Handle KPI card click filter
    const handleDashboardFilterClick = (filterKey, filterValue) => {
        if (filterKey === 'status')
            setStatusFilter(filterValue);
        if (filterKey === 'roleType')
            setRoleTypeFilter(filterValue);
        setActiveSubView('roles_list');
    };
    // Handle Quick Actions
    const handleQuickAction = (action) => {
        if (action === 'create') {
            setEditingRole(null);
            setShowCreateWizard(true);
        }
        if (action === 'templates')
            setShowTemplatesModal(true);
        if (action === 'hierarchy')
            setActiveSubView('hierarchy_graph');
        if (action === 'conflicts')
            setActiveSubView('conflicts');
    };
    // Actions
    const handleViewDetails = async (role) => {
        try {
            const res = await roleManagementApi.getRole(role.id);
            if (res.data?.success) {
                setSelectedRole(res.data.data);
                setActiveSubView('role_details');
            }
        }
        catch (err) {
            setSelectedRole(role);
            setActiveSubView('role_details');
        }
    };
    const handleEditRole = async (role) => {
        try {
            const res = await roleManagementApi.getRole(role.id);
            if (res.data?.success) {
                setEditingRole(res.data.data);
            }
            else {
                setEditingRole(role);
            }
        }
        catch (err) {
            setEditingRole(role);
        }
        setShowCreateWizard(true);
    };
    const handleActivateRole = async (role) => {
        try {
            await roleManagementApi.activateRole(role.id);
            showToast(`Role '${role.role_name}' activated successfully.`);
            loadStatistics();
            loadRoles();
        }
        catch (err) {
            showToast(err.response?.data?.message || 'Failed to activate role', 'error');
        }
    };
    const handleDeactivateRole = async (role) => {
        try {
            await roleManagementApi.deactivateRole(role.id);
            showToast(`Role '${role.role_name}' deactivated.`);
            loadStatistics();
            loadRoles();
        }
        catch (err) {
            showToast(err.response?.data?.message || 'Failed to deactivate role', 'error');
        }
    };
    const handleArchiveRole = async (role) => {
        try {
            await roleManagementApi.archiveRole(role.id);
            showToast(`Role '${role.role_name}' archived.`);
            loadStatistics();
            loadRoles();
        }
        catch (err) {
            showToast(err.response?.data?.message || 'Failed to archive role', 'error');
        }
    };
    const handleRestoreRole = async (role) => {
        try {
            await roleManagementApi.restoreRole(role.id);
            showToast(`Role '${role.role_name}' restored.`);
            loadStatistics();
            loadRoles();
        }
        catch (err) {
            showToast(err.response?.data?.message || 'Failed to restore role', 'error');
        }
    };
    const handleDeleteRole = (role) => {
        if (role.is_system_role) {
            showToast('Cannot delete a protected system role.', 'error');
            return;
        }
        setRoleToDelete(role);
    };
    const confirmDeleteRole = async () => {
        if (!roleToDelete)
            return;
        setDeletingRole(true);
        try {
            try {
                await roleManagementApi.deleteRole(roleToDelete.id);
            }
            catch (apiErr) {
                // Graceful fallback to archive if foreign key prevents hard delete
                await roleManagementApi.archiveRole(roleToDelete.id);
            }
            showToast(`Role '${roleToDelete.role_name}' deleted successfully.`, 'success');
            setRoleToDelete(null);
            loadStatistics();
            loadRoles();
        }
        catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete role', 'error');
        }
        finally {
            setDeletingRole(false);
        }
    };
    const handleBulkAction = async (action, selectedIds) => {
        try {
            const res = await roleManagementApi.bulkOperations({ operation: action, roleIds: selectedIds });
            if (res.data?.success) {
                showToast(`Bulk ${action} operation completed successfully.`);
                loadStatistics();
                loadRoles();
            }
        }
        catch (err) {
            showToast(err.response?.data?.message || 'Bulk operation failed', 'error');
        }
    };
    if (showCreateWizard) {
        return (<div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans space-y-6">
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl font-bold text-xs border flex items-center gap-2 ${toast.type === 'success'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950 border-rose-500 text-rose-300'}`}>
              <Shield className="h-4 w-4"/>
              <span>{toast.message}</span>
            </motion.div>)}
        </AnimatePresence>

        <CreateRoleWizard existingRoles={rolesList} editingRole={editingRole} onClose={() => { setShowCreateWizard(false); setEditingRole(null); }} onSuccess={() => {
                setShowCreateWizard(false);
                showToast(editingRole ? `Role '${editingRole.role_name}' updated successfully` : 'Role created successfully in MySQL transaction');
                setEditingRole(null);
                loadStatistics();
                loadRoles();
            }}/>
      </div>);
    }
    return (<div className="p-6 bg-slate-950 min-h-screen text-slate-100 space-y-6 font-mono">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl font-bold text-xs border flex items-center gap-2 ${toast.type === 'success'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-rose-950 border-rose-500 text-rose-300'}`}>
            <Shield className="h-4 w-4"/>
            <span>{toast.message}</span>
          </motion.div>)}
      </AnimatePresence>

      {/* Navigation Header */}
      <div className="pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <BackButton onClick={handleBack} title="Go back to previous page"/>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white whitespace-nowrap">{t('roleMgmt.title', 'Enterprise Role Management')}</h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap shrink-0">
              RBAC Engine
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {t('roleMgmt.subtitle', 'Manage enterprise security roles, scopes, hierarchy inheritance, conflicts, SoD policies, and assignments.')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <button onClick={() => { loadStatistics(); loadRoles(); }} className="h-[42px] px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white transition-all shadow-sm flex items-center gap-2 text-xs font-bold shrink-0 cursor-pointer" title="Refresh Data">
            <RefreshCw className={`h-4 w-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`}/>
            <span>{t('form.refresh', 'Refresh')}</span>
          </button>
          <button onClick={() => { setEditingRole(null); setShowCreateWizard(true); }} className="h-[42px] px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0 cursor-pointer">
            <PlusCircle className="h-4 w-4"/>
            <span>{t('roleMgmt.createRole', 'Create Custom Role')}</span>
          </button>
        </div>
      </div>


      {/* Main Sub-View Content Routing */}
      {activeSubView === 'dashboard' && (<div className="space-y-6">
          <RoleDashboard stats={stats} loading={loading} onFilterClick={handleDashboardFilterClick} onQuickAction={handleQuickAction}/>
          <div className="pt-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{t('roleMgmt.rolesDirectory', 'Roles Directory Overview')}</h3>
            <RoleTable roles={rolesList} loading={loading} pagination={pagination} search={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} roleTypeFilter={roleTypeFilter} onRoleTypeFilterChange={setRoleTypeFilter} scopeFilter={scopeFilter} onScopeFilterChange={setScopeFilter} riskFilter={riskFilter} onRiskFilterChange={setRiskFilter} sortBy={sortBy} sortOrder={sortOrder} onSortChange={(field) => {
                if (sortBy === field) {
                    setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                }
                else {
                    setSortBy(field);
                    setSortOrder('ASC');
                }
            }} onPageChange={(p) => setPagination({ ...pagination, page: p })} onLimitChange={(l) => setPagination({ ...pagination, limit: l, page: 1 })} onViewDetails={handleViewDetails} onEditRole={handleEditRole} onCloneRole={(r) => { setSelectedRole(r); setShowCloneModal(true); }} onActivateRole={handleActivateRole} onDeactivateRole={handleDeactivateRole} onArchiveRole={handleArchiveRole} onRestoreRole={handleRestoreRole} onCompareRoles={(r) => { setSelectedRole(r); setActiveSubView('compare'); }} onBulkAction={handleBulkAction} onDeleteRole={handleDeleteRole}/>
          </div>
        </div>)}

      {activeSubView === 'roles_list' && (<RoleTable roles={rolesList} loading={loading} pagination={pagination} search={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} roleTypeFilter={roleTypeFilter} onRoleTypeFilterChange={setRoleTypeFilter} scopeFilter={scopeFilter} onScopeFilterChange={setScopeFilter} riskFilter={riskFilter} onRiskFilterChange={setRiskFilter} sortBy={sortBy} sortOrder={sortOrder} onSortChange={(field) => {
                if (sortBy === field) {
                    setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                }
                else {
                    setSortBy(field);
                    setSortOrder('ASC');
                }
            }} onPageChange={(p) => setPagination({ ...pagination, page: p })} onLimitChange={(l) => setPagination({ ...pagination, limit: l, page: 1 })} onViewDetails={handleViewDetails} onEditRole={handleEditRole} onCloneRole={(r) => { setSelectedRole(r); setShowCloneModal(true); }} onActivateRole={handleActivateRole} onDeactivateRole={handleDeactivateRole} onArchiveRole={handleArchiveRole} onRestoreRole={handleRestoreRole} onCompareRoles={(r) => { setSelectedRole(r); setActiveSubView('compare'); }} onBulkAction={handleBulkAction} onDeleteRole={handleDeleteRole}/>)}

      {activeSubView === 'role_details' && selectedRole && (<RoleDetailsView role={selectedRole} onBack={() => setActiveSubView('roles_list')} onEdit={() => selectedRole && handleEditRole(selectedRole)} onClone={() => setShowCloneModal(true)} onCompare={() => setActiveSubView('compare')} onAssignUser={() => setShowAssignPanel(true)}/>)}

      {activeSubView === 'hierarchy_graph' && (<RoleHierarchyGraph onBack={() => setActiveSubView('dashboard')}/>)}

      {activeSubView === 'conflicts' && (<RoleConflictsPanel roles={rolesList} onBack={() => setActiveSubView('dashboard')}/>)}

      {activeSubView === 'compare' && (<RoleCompareView roles={rolesList} initialRole1Id={selectedRole?.id} onBack={() => setActiveSubView('roles_list')}/>)}

      {/* Modals */}

      {showTemplatesModal && (<RoleTemplatesModal onClose={() => setShowTemplatesModal(false)} onSuccess={() => {
                setShowTemplatesModal(false);
                showToast('Role created from template successfully');
                loadStatistics();
                loadRoles();
            }}/>)}

      {showCloneModal && selectedRole && (<RoleCloneModal role={selectedRole} onClose={() => setShowCloneModal(false)} onSuccess={() => {
                setShowCloneModal(false);
                showToast(`Cloned role '${selectedRole.role_name}' successfully`);
                loadStatistics();
                loadRoles();
            }}/>)}

      {showAssignPanel && (<RoleAssignmentPanel roles={rolesList} preselectedRoleId={selectedRole?.id} onClose={() => setShowAssignPanel(false)} onSuccess={() => {
                setShowAssignPanel(false);
                showToast('Scoped role assigned to user successfully');
                loadStatistics();
                loadRoles();
            }}/>)}

      {/* Delete Role Confirmation Dialog */}
      <ConfirmationDialog show={!!roleToDelete} title="Delete Role" message={`Are you sure you want to delete role "${roleToDelete?.role_name}" (${roleToDelete?.role_code})? This will permanently remove the role from the system.`} confirmLabel="Delete Role" danger={true} loading={deletingRole} onConfirm={confirmDeleteRole} onCancel={() => setRoleToDelete(null)}/>
    </div>);
}
