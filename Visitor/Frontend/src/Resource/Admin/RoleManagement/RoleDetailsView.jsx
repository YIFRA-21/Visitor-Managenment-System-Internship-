import React, { useState } from 'react';
import { Shield, Users, Key, Edit, Copy, GitCompare, AlertTriangle } from 'lucide-react';
import BackButton from '../../../components/common/BackButton';
export default function RoleDetailsView({ role, onBack, onEdit, onClone, onCompare, onAssignUser, }) {
    const [activeTab, setActiveTab] = useState('overview');
    const permissions = role.permissions || [];
    const users = role.users || [];
    const versions = role.versions || [];
    return (<div className="space-y-6 text-xs text-slate-300 font-mono">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} title="Back to Roles List"/>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-wide">{role.role_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {role.status}
              </span>
              {role.is_system_role && (<span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  PROTECTED SYSTEM
                </span>)}
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
              <span className="font-mono text-cyan-400 font-bold">{role.role_code}</span>
              <span>• Scope: <strong className="text-indigo-400">{role.scope_type}</strong></span>
              <span>• Version: <strong className="text-slate-200">v{role.version || 1}</strong></span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2">
            <Edit className="h-4 w-4"/> Edit Role
          </button>
          <button onClick={onClone} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700 flex items-center gap-2">
            <Copy className="h-4 w-4 text-purple-400"/> Clone
          </button>
          <button onClick={onCompare} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700 flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-emerald-400"/> Compare
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[11px]">Assigned Users</div>
            <div className="text-2xl font-bold text-white font-mono mt-0.5">{role.user_count || 0}</div>
          </div>
          <Users className="h-6 w-6 text-blue-400"/>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[11px]">Granted Permissions</div>
            <div className="text-2xl font-bold text-white font-mono mt-0.5">{role.permission_count || 0}</div>
          </div>
          <Key className="h-6 w-6 text-teal-400"/>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[11px]">Parent Role</div>
            <div className="text-sm font-bold text-indigo-400 mt-1">{role.parent_role_name || 'Root Role'}</div>
          </div>
          <Shield className="h-6 w-6 text-indigo-400"/>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[11px]">Risk Assessment</div>
            <div className="text-sm font-bold text-amber-400 mt-1">{role.risk_level || 'LOW'} RISK</div>
          </div>
          <AlertTriangle className="h-6 w-6 text-amber-400"/>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: `Assigned Users (${users.length})` },
            { id: 'permissions', label: `Permissions (${permissions.length})` },
            { id: 'versions', label: `Version History (${versions.length})` },
        ].map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl font-bold uppercase transition-colors ${activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'}`}>
              {tab.label}
            </button>))}
        </div>

        {/* TAB 1: Overview */}
        {activeTab === 'overview' && (<div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1">Role Specifications</h4>
                <div className="space-y-1.5 text-[11px]">
                  <div><span className="text-slate-500">Role Name:</span> <span className="text-white font-bold">{role.role_name}</span></div>
                  <div><span className="text-slate-500">Role Code:</span> <span className="text-cyan-400">{role.role_code}</span></div>
                  <div><span className="text-slate-500">Type:</span> <span className="text-slate-200">{role.role_type}</span></div>
                  <div><span className="text-slate-500">Scope Type:</span> <span className="text-indigo-400 font-bold">{role.scope_type}</span></div>
                  <div><span className="text-slate-500">Parent Role:</span> <span className="text-slate-200">{role.parent_role_name || 'None (Root)'}</span></div>
                  <div><span className="text-slate-500">Description:</span> <p className="text-slate-300 mt-1">{role.description || 'No description provided.'}</p></div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-1">Configuration Policies</h4>
                <div className="space-y-1.5 text-[11px]">
                  <div><span className="text-slate-500">Priority Weight:</span> <span className="text-white font-bold">{role.priority}</span></div>
                  <div><span className="text-slate-500">Assignment Allowed:</span> <span className={role.is_assignment_allowed ? 'text-emerald-400' : 'text-rose-400'}>{role.is_assignment_allowed ? 'YES' : 'NO'}</span></div>
                  <div><span className="text-slate-500">Temporary Assignment Allowed:</span> <span className={role.is_temporary_allowed ? 'text-emerald-400' : 'text-rose-400'}>{role.is_temporary_allowed ? 'YES' : 'NO'}</span></div>
                  <div><span className="text-slate-500">Multiple Roles Allowed:</span> <span className={role.is_multiple_allowed ? 'text-emerald-400' : 'text-rose-400'}>{role.is_multiple_allowed ? 'YES' : 'NO'}</span></div>
                  <div><span className="text-slate-500">Requires Approval:</span> <span className={role.requires_approval ? 'text-amber-400' : 'text-slate-400'}>{role.requires_approval ? 'YES' : 'NO'}</span></div>
                </div>
              </div>
            </div>
          </div>)}

        {/* TAB 2: Users */}
        {activeTab === 'users' && (<div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Users explicitly assigned to this role:</span>
              <button onClick={onAssignUser} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5"/> Assign User To Role
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="p-3">User Name & Email</th>
                    <th className="p-3">Scope Scope</th>
                    <th className="p-3">Assigned Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {users.length === 0 ? (<tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500">No users currently assigned to this role.</td>
                    </tr>) : (users.map((u) => (<tr key={u.assignment_id} className="hover:bg-slate-900/40">
                        <td className="p-3">
                          <div className="font-bold text-white">{u.full_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                        </td>
                        <td className="p-3 font-mono text-cyan-400">
                          {u.organization_name || u.branch_name || u.department_name || 'System Scoped'}
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {new Date(u.assigned_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {u.assignment_status || 'ACTIVE'}
                          </span>
                        </td>
                      </tr>)))}
                </tbody>
              </table>
            </div>
          </div>)}

        {/* TAB 3: Permissions */}
        {activeTab === 'permissions' && (<div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {permissions.length === 0 ? (<div className="col-span-3 p-6 text-center text-slate-500">No permissions bound to this role.</div>) : (permissions.map((p) => (<div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{p.permission_name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-900 text-cyan-400 border border-slate-800">{p.module}</span>
                    </div>
                    <div className="font-mono text-[10px] text-indigo-400">{p.permission_code}</div>
                    {p.description && <p className="text-[10px] text-slate-500 line-clamp-2">{p.description}</p>}
                  </div>)))}
            </div>
          </div>)}

        {/* TAB 4: Versions */}
        {activeTab === 'versions' && (<div className="space-y-3">
            {versions.length === 0 ? (<div className="p-6 text-center text-slate-500">No version snapshot history found.</div>) : (versions.map((v) => (<div key={v.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Version v{v.version_number}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({new Date(v.created_at).toLocaleString()})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{v.change_reason || 'Snapshot created'}</div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-500">
                    Created by <strong className="text-slate-300">{v.created_by_name || 'Admin'}</strong>
                  </div>
                </div>)))}
          </div>)}
      </div>
    </div>);
}
