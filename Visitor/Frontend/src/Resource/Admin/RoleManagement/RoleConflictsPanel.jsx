import React, { useState, useEffect } from 'react';
import { ShieldAlert, PlusCircle, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { roleManagementApi } from '../../../modules/role-management/api/roleManagementApi';
import BackButton from '../../../components/common/BackButton';
export default function RoleConflictsPanel({ roles, onBack }) {
    const [activeTab, setActiveTab] = useState('conflicts');
    const [conflictsList, setConflictsList] = useState([]);
    const [sodList, setSodList] = useState([]);
    const [permissionsList, setPermissionsList] = useState([]);
    const [loading, setLoading] = useState(true);
    // New Conflict State
    const [roleId1, setRoleId1] = useState('');
    const [roleId2, setRoleId2] = useState('');
    const [conflictName, setConflictName] = useState('');
    // New SoD State
    const [permId1, setPermId1] = useState('');
    const [permId2, setPermId2] = useState('');
    const [sodName, setSodName] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setLoading(true);
        try {
            const [cRes, sRes, pRes] = await Promise.all([
                roleManagementApi.listConflicts(),
                roleManagementApi.listSodRules(),
                roleManagementApi.listAllPermissions(),
            ]);
            if (cRes.data?.success)
                setConflictsList(cRes.data.data);
            if (sRes.data?.success)
                setSodList(sRes.data.data);
            if (pRes.data?.success)
                setPermissionsList(pRes.data.data);
        }
        catch (err) {
            console.error('Failed to load conflicts/SoD:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateConflict = async () => {
        if (!roleId1 || !roleId2 || roleId1 === roleId2) {
            setErrorMsg('Please select two distinct roles.');
            return;
        }
        setErrorMsg(null);
        try {
            await roleManagementApi.createConflict({
                roleId1: Number(roleId1),
                roleId2: Number(roleId2),
                conflictName: conflictName.trim() || 'Role Conflict Policy',
            });
            setRoleId1('');
            setRoleId2('');
            setConflictName('');
            loadData();
        }
        catch (err) {
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to create conflict rule');
        }
    };
    const handleDeleteConflict = async (id) => {
        try {
            await roleManagementApi.deleteConflict(id);
            loadData();
        }
        catch (err) {
            console.error('Failed to delete conflict rule:', err);
        }
    };
    const handleCreateSod = async () => {
        if (!permId1 || !permId2 || permId1 === permId2) {
            setErrorMsg('Please select two distinct permissions.');
            return;
        }
        setErrorMsg(null);
        try {
            await roleManagementApi.createSodRule({
                permissionId1: Number(permId1),
                permissionId2: Number(permId2),
                ruleName: sodName.trim() || 'Segregation of Duties Policy',
            });
            setPermId1('');
            setPermId2('');
            setSodName('');
            loadData();
        }
        catch (err) {
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to create SoD rule');
        }
    };
    const handleDeleteSod = async (id) => {
        try {
            await roleManagementApi.deleteSodRule(id);
            loadData();
        }
        catch (err) {
            console.error('Failed to delete SoD rule:', err);
        }
    };
    return (<div className="space-y-6 text-xs text-slate-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} title="Back to Roles List"/>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Role Conflicts & Segregation of Duties (SoD)</h1>
            <p className="text-slate-400 text-[11px] mt-0.5">Enforces enterprise security policy by preventing conflicting role or permission assignments.</p>
          </div>
        </div>
      </div>

      {errorMsg && (<div className="p-3 bg-rose-950/80 border border-rose-700/50 rounded-xl text-rose-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400"/>
          <span>{errorMsg}</span>
        </div>)}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button onClick={() => setActiveTab('conflicts')} className={`px-4 py-2 rounded-xl font-bold uppercase transition-colors flex items-center gap-2 ${activeTab === 'conflicts' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}>
          <ShieldAlert className="h-4 w-4"/> Incompatible Role Conflicts ({conflictsList.length})
        </button>
        <button onClick={() => setActiveTab('sod')} className={`px-4 py-2 rounded-xl font-bold uppercase transition-colors flex items-center gap-2 ${activeTab === 'sod' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}>
          <ShieldCheck className="h-4 w-4"/> Segregation of Duties Policies ({sodList.length})
        </button>
      </div>

      {/* TAB 1: Role Conflicts */}
      {activeTab === 'conflicts' && (<div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">Define Incompatible Role Pair</h3>
            <div className="flex flex-wrap items-center gap-3">
              <select value={roleId1} onChange={(e) => setRoleId1(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                <option value="">Select Role 1...</option>
                {roles.map((r) => (<option key={r.id} value={r.id}>{r.role_name} ({r.role_code})</option>))}
              </select>

              <span className="text-slate-500 font-bold">CANNOT COEXIST WITH</span>

              <select value={roleId2} onChange={(e) => setRoleId2(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                <option value="">Select Role 2...</option>
                {roles.map((r) => (<option key={r.id} value={r.id}>{r.role_name} ({r.role_code})</option>))}
              </select>

              <input type="text" placeholder="Rule Title (e.g. Auditor vs Admin)" value={conflictName} onChange={(e) => setConflictName(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white flex-1 min-w-[200px]"/>

              <button disabled={!roleId1 || !roleId2} onClick={handleCreateConflict} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl font-bold uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4"/> Add Conflict Rule
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Active Role Conflict Policies</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-slate-400 font-mono">
                  <tr>
                    <th className="p-3">Rule Name & Code</th>
                    <th className="p-3">Role 1</th>
                    <th className="p-3">Role 2</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {conflictsList.length === 0 ? (<tr><td colSpan={5} className="p-6 text-center text-slate-500">No role conflict rules configured.</td></tr>) : (conflictsList.map((c) => (<tr key={c.id} className="hover:bg-slate-900/40">
                        <td className="p-3">
                          <div className="font-bold text-white">{c.conflict_name}</div>
                          <div className="text-[10px] text-cyan-400 font-mono">{c.conflict_code}</div>
                        </td>
                        <td className="p-3 font-bold text-indigo-400">{c.role1_name}</td>
                        <td className="p-3 font-bold text-purple-400">{c.role2_name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-700">{c.severity}</span>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteConflict(c.id)} className="p-1.5 text-rose-400 hover:text-rose-300">
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </td>
                      </tr>)))}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}

      {/* TAB 2: Segregation of Duties */}
      {activeTab === 'sod' && (<div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-400">Define Segregation of Duties (SoD) Rule</h3>
            <div className="flex flex-wrap items-center gap-3">
              <select value={permId1} onChange={(e) => setPermId1(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                <option value="">Select Permission 1...</option>
                {permissionsList.map((p) => (<option key={p.id} value={p.id}>{p.permission_name} ({p.permission_code})</option>))}
              </select>

              <span className="text-slate-500 font-bold">CONFLICTS WITH</span>

              <select value={permId2} onChange={(e) => setPermId2(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                <option value="">Select Permission 2...</option>
                {permissionsList.map((p) => (<option key={p.id} value={p.id}>{p.permission_name} ({p.permission_code})</option>))}
              </select>

              <input type="text" placeholder="Policy Name (e.g. Requestor vs Approver)" value={sodName} onChange={(e) => setSodName(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white flex-1 min-w-[200px]"/>

              <button disabled={!permId1 || !permId2} onClick={handleCreateSod} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4"/> Add SoD Policy
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Active Segregation of Duties Policies</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-3">Policy Title & Code</th>
                    <th className="p-3">Permission 1</th>
                    <th className="p-3">Permission 2</th>
                    <th className="p-3">Risk Level</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {sodList.length === 0 ? (<tr><td colSpan={5} className="p-6 text-center text-slate-500">No Segregation of Duties policies configured.</td></tr>) : (sodList.map((s) => (<tr key={s.id} className="hover:bg-slate-900/40">
                        <td className="p-3">
                          <div className="font-bold text-white">{s.rule_name}</div>
                          <div className="text-[10px] text-cyan-400">{s.rule_code}</div>
                        </td>
                        <td className="p-3 font-bold text-teal-400">{s.perm1_name}</td>
                        <td className="p-3 font-bold text-amber-400">{s.perm2_name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-700">{s.risk_level}</span>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteSod(s.id)} className="p-1.5 text-rose-400 hover:text-rose-300">
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </td>
                      </tr>)))}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}
    </div>);
}
