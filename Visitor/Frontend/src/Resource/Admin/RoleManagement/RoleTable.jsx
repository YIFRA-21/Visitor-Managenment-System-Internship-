import React, { useState } from 'react';
import { Search, Filter, Users, Key, Shield, Eye, Edit, Copy, CheckCircle, XCircle, Archive, RotateCcw, GitCompare, ChevronLeft, ChevronRight, ArrowUpDown, Lock, Building, Layers, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function RoleTable({ roles, loading, pagination, search, onSearchChange, statusFilter, onStatusFilterChange, roleTypeFilter, onRoleTypeFilterChange, scopeFilter, onScopeFilterChange, riskFilter, onRiskFilterChange, sortBy, sortOrder, onSortChange, onPageChange, onLimitChange, onViewDetails, onEditRole, onCloneRole, onActivateRole, onDeactivateRole, onArchiveRole, onRestoreRole, onCompareRoles, onBulkAction, onDeleteRole, }) {
    const { t, tStatus } = useLanguage();
    const [selectedIds, setSelectedIds] = useState([]);
    const toggleSelectAll = () => {
        if (selectedIds.length === roles.length) {
            setSelectedIds([]);
        }
        else {
            setSelectedIds(roles.map((r) => r.id));
        }
    };
    const toggleSelectRole = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((i) => i !== id));
        }
        else {
            setSelectedIds([...selectedIds, id]);
        }
    };
    const getScopeBadge = (scope) => {
        switch (scope) {
            case 'SYSTEM':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1"><Lock className="h-3 w-3"/> System</span>;
            case 'ORGANIZATION':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1"><Building className="h-3 w-3"/> Organization</span>;
            case 'BRANCH':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1"><Layers className="h-3 w-3"/> Branch</span>;
            case 'DEPARTMENT':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1"><Shield className="h-3 w-3"/> Department</span>;
            case 'BUILDING':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><Building className="h-3 w-3"/> Building</span>;
            default:
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">{scope}</span>;
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>;
            case 'INACTIVE':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">Inactive</span>;
            case 'ARCHIVED':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">Archived</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">{status}</span>;
        }
    };
    const getRiskBadge = (risk) => {
        switch (risk) {
            case 'CRITICAL':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-400 border border-rose-700/50">Critical Risk</span>;
            case 'HIGH':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-400 border border-amber-700/50">High Risk</span>;
            case 'MEDIUM':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950/80 text-blue-400 border border-blue-700/50">Medium Risk</span>;
            default:
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">Low Risk</span>;
        }
    };
    return (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Controls Header: Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"/>
          <input type="text" placeholder="Search role name, code, description..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"/>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400"/>
            <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
              <option value="ARCHIVED">Archived Only</option>
            </select>
          </div>

          {/* Type Filter */}
          <select value={roleTypeFilter} onChange={(e) => onRoleTypeFilterChange(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
            <option value="ALL">Type: All</option>
            <option value="SYSTEM">System Roles</option>
            <option value="CUSTOM">Custom Roles</option>
          </select>

          {/* Scope Filter */}
          <select value={scopeFilter} onChange={(e) => onScopeFilterChange(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
            <option value="ALL">Scope: All</option>
            <option value="SYSTEM">System Scope</option>
            <option value="ORGANIZATION">Organization</option>
            <option value="BRANCH">Branch</option>
            <option value="DEPARTMENT">Department</option>
            <option value="BUILDING">Building</option>
          </select>

          {/* Risk Level Filter */}
          <select value={riskFilter} onChange={(e) => onRiskFilterChange(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
            <option value="ALL">Risk: All</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {selectedIds.length > 0 && (<div className="p-3 bg-indigo-950/90 border border-indigo-500/40 rounded-xl flex items-center justify-between text-xs text-white">
          <span className="font-semibold text-indigo-300">
            {selectedIds.length} role(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => onBulkAction('activate', selectedIds)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5"/> Bulk Activate
            </button>
            <button onClick={() => onBulkAction('deactivate', selectedIds)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5"/> Bulk Deactivate
            </button>
            <button onClick={() => onBulkAction('archive', selectedIds)} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5"/> Bulk Archive
            </button>
          </div>
        </div>)}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 vms-table-container">
        <table className="w-full text-left text-xs border-collapse vms-table">
          <thead className="vms-table-header uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th className="p-4 w-10 text-center">
                <input type="checkbox" checked={selectedIds.length === roles.length && roles.length > 0} onChange={toggleSelectAll} className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"/>
              </th>
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => onSortChange('role_name')}>
                <div className="flex items-center gap-1.5">
                  <span>{t('table.roleName', 'Role Name & Code')}</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500"/>
                </div>
              </th>
              <th className="p-4">{t('table.scope', 'Scope')}</th>
              <th className="p-4">{t('table.assignedRole', 'Parent Role')}</th>
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => onSortChange('status')}>
                <div className="flex items-center gap-1.5">
                  <span>{t('table.status', 'Status')}</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500"/>
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => onSortChange('user_count')}>
                <div className="flex items-center gap-1.5">
                  <span>{t('table.users', 'Users')}</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500"/>
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => onSortChange('permission_count')}>
                <div className="flex items-center gap-1.5">
                  <span>{t('table.permission', 'Permissions')}</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500"/>
                </div>
              </th>
              <th className="p-4">{t('table.riskLevel', 'Risk')}</th>
              <th className="p-4">{t('table.version', 'Version')}</th>
              <th className="p-4 text-right">{t('table.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {loading ? (<tr>
                <td colSpan={10} className="p-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading enterprise roles...</span>
                  </div>
                </td>
              </tr>) : roles.length === 0 ? (<tr>
                <td colSpan={10} className="p-12 text-center text-slate-500">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-slate-600"/>
                  <p className="font-semibold text-slate-400">No security roles found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Try clearing filters or search queries</p>
                </td>
              </tr>) : (roles.map((role) => (<tr key={role.id} className="hover:bg-slate-900/60 transition-colors group relative">
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={selectedIds.includes(role.id)} onChange={() => toggleSelectRole(role.id)} className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"/>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${role.is_system_role ? 'bg-purple-950/60 text-purple-400 border border-purple-700/40' : 'bg-indigo-950/60 text-indigo-400 border border-indigo-700/40'}`}>
                        {role.is_system_role ? <Lock className="h-4 w-4"/> : <Shield className="h-4 w-4"/>}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                          <span>{role.role_name}</span>
                          {role.is_system_role && (<span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">SYSTEM</span>)}
                        </div>
                        <div className="font-mono text-[11px] text-cyan-400 mt-0.5">{role.role_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{getScopeBadge(role.scope_type)}</td>
                  <td className="p-4 font-mono text-slate-400">
                    {role.parent_role_name ? (<span className="text-slate-300 font-semibold">{role.parent_role_name}</span>) : (<span className="text-slate-600 font-italic">Root Role</span>)}
                  </td>
                  <td className="p-4">{getStatusBadge(role.status)}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px]">
                      <Users className="h-3 w-3 text-blue-400"/> {role.user_count || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px]">
                      <Key className="h-3 w-3 text-teal-400"/> {role.permission_count || 0}
                    </span>
                  </td>
                  <td className="p-4">{getRiskBadge(role.risk_level)}</td>
                  <td className="p-4 font-mono text-slate-400">v{role.version || 1}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => onViewDetails(role)} className="w-8 h-8 p-0 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center transition-all cursor-pointer" title="View Details">
                        <Eye className="h-4 w-4"/>
                      </button>
                      <button onClick={() => onEditRole(role)} className="w-8 h-8 p-0 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-600 hover:text-white hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/30 flex items-center justify-center transition-all cursor-pointer" title="Edit Role">
                        <Edit className="h-4 w-4"/>
                      </button>
                      <button onClick={() => onCloneRole(role)} className="w-8 h-8 p-0 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center transition-all cursor-pointer" title="Clone Role">
                        <Copy className="h-4 w-4"/>
                      </button>
                      <button onClick={() => onCompareRoles(role)} className="w-8 h-8 p-0 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 flex items-center justify-center transition-all cursor-pointer" title="Compare Roles">
                        <GitCompare className="h-4 w-4"/>
                      </button>

                      {role.status === 'INACTIVE' ? (<button onClick={() => onActivateRole(role)} className="w-8 h-8 p-0 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center transition-all cursor-pointer" title="Activate Role">
                          <CheckCircle className="h-4 w-4"/>
                        </button>) : role.status === 'ACTIVE' && !role.is_system_role ? (<button onClick={() => onDeactivateRole(role)} className="w-8 h-8 p-0 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-600 hover:text-white hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/30 flex items-center justify-center transition-all cursor-pointer" title="Deactivate Role">
                          <XCircle className="h-4 w-4"/>
                        </button>) : null}

                      {role.status === 'ARCHIVED' ? (<button onClick={() => onRestoreRole(role)} className="w-8 h-8 p-0 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-600 hover:text-white hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/30 flex items-center justify-center transition-all cursor-pointer" title="Restore Role">
                          <RotateCcw className="h-4 w-4"/>
                        </button>) : !role.is_system_role ? (<button onClick={() => onArchiveRole(role)} className="w-8 h-8 p-0 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-600 hover:text-white hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/30 flex items-center justify-center transition-all cursor-pointer" title="Archive Role">
                          <Archive className="h-4 w-4"/>
                        </button>) : null}

                      {!role.is_system_role && (<button onClick={() => onDeleteRole ? onDeleteRole(role) : onArchiveRole(role)} className="w-8 h-8 p-0 rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/40 flex items-center justify-center transition-all cursor-pointer" title="Delete Role">
                          <Trash2 className="h-4 w-4"/>
                        </button>)}
                    </div>
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-mono">
        <div>
          Showing page <span className="text-white font-bold">{pagination.page}</span> of{' '}
          <span className="text-white font-bold">{pagination.totalPages}</span> ({pagination.total} total roles)
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Per page:</span>
            <select value={pagination.limit} onChange={(e) => onLimitChange(Number(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 text-slate-300 transition-colors">
              <ChevronLeft className="h-4 w-4"/>
            </button>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)} className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 text-slate-300 transition-colors">
              <ChevronRight className="h-4 w-4"/>
            </button>
          </div>
        </div>
      </div>
    </div>);
}
