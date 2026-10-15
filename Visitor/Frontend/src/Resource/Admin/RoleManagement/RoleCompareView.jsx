import React, { useState, useEffect } from 'react';
import { ToggleRight, ToggleLeft } from 'lucide-react';
import { roleManagementApi } from '../../../modules/role-management/api/roleManagementApi';
import BackButton from '../../../components/common/BackButton';
export default function RoleCompareView({ roles, initialRole1Id, onBack }) {
    const [role1Id, setRole1Id] = useState(initialRole1Id || (roles[0]?.id || 0));
    const [role2Id, setRole2Id] = useState(roles[1]?.id || (roles[0]?.id || 0));
    const [comparisonData, setComparisonData] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (role1Id && role2Id) {
            loadComparison();
        }
    }, [role1Id, role2Id]);
    const loadComparison = async () => {
        setLoading(true);
        try {
            const res = await roleManagementApi.compareRoles(role1Id, role2Id);
            if (res.data?.success) {
                setComparisonData(res.data.data);
            }
        }
        catch (err) {
            console.error('Failed to compare roles:', err);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="space-y-6 text-xs text-slate-300 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} title="Back to Roles List"/>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Role Comparison Matrix</h1>
            <p className="text-slate-400 text-[11px] mt-0.5">Side-by-side comparative analysis of role scopes and permission grants.</p>
          </div>
        </div>

        {/* Role Selectors */}
        <div className="flex items-center gap-3">
          <select value={role1Id} onChange={(e) => setRole1Id(Number(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-400 font-bold">
            {roles.map((r) => (<option key={r.id} value={r.id}>{r.role_name}</option>))}
          </select>

          <span className="text-slate-500 font-bold">VS</span>

          <select value={role2Id} onChange={(e) => setRole2Id(Number(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-purple-400 font-bold">
            {roles.map((r) => (<option key={r.id} value={r.id}>{r.role_name}</option>))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
        {loading ? (<div className="py-12 text-center text-slate-500">Loading comparison matrix...</div>) : !comparisonData ? (<div className="py-12 text-center text-slate-500">Select two valid roles to compare permissions.</div>) : (<div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-slate-400 font-mono">
                <tr>
                  <th className="p-4">Permission Name & Code</th>
                  <th className="p-4">Module</th>
                  <th className="p-4 text-center font-bold text-indigo-400">{comparisonData.role1?.name}</th>
                  <th className="p-4 text-center font-bold text-purple-400">{comparisonData.role2?.name}</th>
                  <th className="p-4 text-center">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {comparisonData.comparison?.map((item) => (<tr key={item.id} className={item.isDifferent ? 'bg-indigo-950/20' : 'hover:bg-slate-900/40'}>
                    <td className="p-4">
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="font-mono text-[10px] text-cyan-400">{item.code}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">{item.module}</span>
                    </td>
                    <td className="p-4 text-center">
                      {item.role1Has ? (<ToggleRight className="h-6 w-6 mx-auto text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"/>) : (<ToggleLeft className="h-6 w-6 mx-auto text-slate-600"/>)}
                    </td>
                    <td className="p-4 text-center">
                      {item.role2Has ? (<ToggleRight className="h-6 w-6 mx-auto text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"/>) : (<ToggleLeft className="h-6 w-6 mx-auto text-slate-600"/>)}
                    </td>
                    <td className="p-4 text-center">
                      {item.isDifferent ? (<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          DIFFERENT
                        </span>) : (<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500">
                          MATCH
                        </span>)}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>);
}
