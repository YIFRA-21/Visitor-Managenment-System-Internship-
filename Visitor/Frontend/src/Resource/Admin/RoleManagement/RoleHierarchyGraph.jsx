import React, { useState, useEffect } from 'react';
import { Shield, PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import { roleManagementApi } from '../../../modules/role-management/api/roleManagementApi';
import BackButton from '../../../components/common/BackButton';
export default function RoleHierarchyGraph({ onBack }) {
    const [hierarchyData, setHierarchyData] = useState({ links: [], roles: [] });
    const [loading, setLoading] = useState(true);
    const [selectedParentId, setSelectedParentId] = useState('');
    const [selectedChildId, setSelectedChildId] = useState('');
    const [submittingLink, setSubmittingLink] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadHierarchy();
    }, []);
    const loadHierarchy = async () => {
        setLoading(true);
        try {
            const res = await roleManagementApi.getHierarchy();
            if (res.data?.success) {
                setHierarchyData(res.data.data);
            }
        }
        catch (err) {
            console.error('Failed to load hierarchy:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddLink = async () => {
        if (!selectedParentId || !selectedChildId)
            return;
        if (selectedParentId === selectedChildId) {
            setError('Parent role and child role cannot be the same role');
            return;
        }
        setSubmittingLink(true);
        setError(null);
        try {
            await roleManagementApi.addHierarchyLink({
                parentRoleId: Number(selectedParentId),
                childRoleId: Number(selectedChildId),
                level: 1,
            });
            setSelectedParentId('');
            setSelectedChildId('');
            loadHierarchy();
        }
        catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to add hierarchy link');
        }
        finally {
            setSubmittingLink(false);
        }
    };
    const handleRemoveLink = async (id) => {
        try {
            await roleManagementApi.removeHierarchyLink(id);
            loadHierarchy();
        }
        catch (err) {
            console.error('Failed to remove link:', err);
        }
    };
    // Build tree structure from links and roles
    const { links, roles } = hierarchyData;
    // Root roles are roles that are not child in any link
    const childSet = new Set(links.map((l) => l.child_role_id));
    const rootRoles = roles.filter((r) => !childSet.has(r.id));
    const renderRoleTreeNode = (role, level = 0) => {
        const childLinks = links.filter((l) => l.parent_role_id === role.id);
        return (<div key={role.id} className="space-y-3 pl-4 border-l border-indigo-500/30 my-2">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between hover:border-indigo-500/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${role.status === 'ACTIVE' ? 'bg-indigo-950 text-indigo-400 border border-indigo-700/40' : 'bg-slate-800 text-slate-500'}`}>
              <Shield className="h-4 w-4"/>
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{role.role_name}</span>
                <span className="px-2 py-0.2 rounded text-[9px] font-mono bg-slate-950 text-cyan-400 border border-slate-800">
                  {role.scope_type || 'SYSTEM'}
                </span>
              </div>
              <div className="font-mono text-[10px] text-slate-500">{role.role_code}</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500">{childLinks.length} Direct Children</span>
        </div>

        {childLinks.length > 0 && (<div className="pl-4 space-y-2">
            {childLinks.map((link) => {
                    const childRole = roles.find((r) => r.id === link.child_role_id);
                    return childRole ? renderRoleTreeNode(childRole, level + 1) : null;
                })}
          </div>)}
      </div>);
    };
    return (<div className="space-y-6 text-xs text-slate-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} title="Back to Roles List"/>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Role Hierarchy Tree Graph</h1>
            <p className="text-slate-400 text-[11px] mt-0.5">Parent-to-child inheritance rules and materialized hierarchy links.</p>
          </div>
        </div>
      </div>

      {error && (<div className="p-3 bg-rose-950/80 border border-rose-700/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400"/>
          <span>{error}</span>
        </div>)}

      {/* Add New Hierarchy Link Bar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Establish Hierarchy Link</h3>
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono">
            <option value="">Select Parent Role...</option>
            {roles.map((r) => (<option key={r.id} value={r.id}>{r.role_name} ({r.role_code})</option>))}
          </select>

          <span className="text-slate-500 font-bold">INHERITS TO →</span>

          <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono">
            <option value="">Select Child Role...</option>
            {roles.map((r) => (<option key={r.id} value={r.id}>{r.role_name} ({r.role_code})</option>))}
          </select>

          <button disabled={!selectedParentId || !selectedChildId || submittingLink} onClick={handleAddLink} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5">
            <PlusCircle className="h-4 w-4"/> Add Hierarchy Link
          </button>
        </div>
      </div>

      {/* Visual Hierarchy Graph Tree */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Materialized Role Tree</h3>

        {loading ? (<div className="py-12 text-center text-slate-500">Loading role hierarchy tree...</div>) : rootRoles.length === 0 ? (<div className="py-12 text-center text-slate-500">No roles configured in database.</div>) : (<div className="space-y-4">
            {rootRoles.map((r) => renderRoleTreeNode(r, 0))}
          </div>)}
      </div>

      {/* Active Hierarchy Links Table */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Direct Hierarchy Link Mappings</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="p-3">Parent Role</th>
                <th className="p-3">Child Role</th>
                <th className="p-3">Level Scale</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {links.length === 0 ? (<tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">No explicit parent-child links established. All roles operate at root level.</td>
                </tr>) : (links.map((link) => (<tr key={link.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-white">{link.parent_role_name}</td>
                    <td className="p-3 font-bold text-indigo-400">{link.child_role_name}</td>
                    <td className="p-3 text-slate-500">Level {link.level || 1}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleRemoveLink(link.id)} className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
