import React, { useState, useEffect } from 'react';
import { Users, Shield } from 'lucide-react';
import { workflowRulesApi } from '../../../../services/api';
export default function RoleAndUserGroupRules() {
    const [activeTab, setActiveTab] = useState('roles');
    const [roleRules, setRoleRules] = useState([]);
    const [userGroups, setUserGroups] = useState([]);
    useEffect(() => {
        workflowRulesApi.getRoleRules().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setRoleRules(res.data.data);
        }).catch(() => { });
        workflowRulesApi.getUserGroups().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setUserGroups(res.data.data);
        }).catch(() => { });
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 rounded-2xl shadow-xl text-white">
            <Users className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span>
              <span>/</span>
              <span className="text-purple-400 font-bold">Roles & Groups (§5.23, §5.24)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Role-Based & User Group Rule Engine</h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'roles', label: 'Role-Based Rules (§5.23)', badge: roleRules.length },
            { id: 'groups', label: 'User Group Rules (§5.24)', badge: userGroups.length }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-purple-700' : 'bg-slate-800 text-purple-400'}`}>
                  {t.badge}
                </span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Role-Based Rules (§5.23) */}
      {activeTab === 'roles' && (<div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Role Notification Profiles (9 Enterprise Roles)</h3>
          </div>

          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
              <tr>
                <th className="p-3">Role Profile</th>
                <th className="p-3">Default Priority</th>
                <th className="p-3">Allowed Channels</th>
                <th className="p-3">Escalation Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {roleRules.map((rr, i) => (<tr key={i} className="hover:bg-slate-850">
                  <td className="p-3 font-bold text-white flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-purple-400"/>
                    <span>{rr.role}</span>
                  </td>
                  <td className="p-3 uppercase font-bold text-[10px] text-indigo-400">{rr.priority}</td>
                  <td className="p-3">
                    <div className="flex items-center space-x-1">
                      {rr.channels.map((c) => (<span key={c} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-mono font-bold uppercase">
                          {c}
                        </span>))}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[10px] text-slate-400">{rr.escalation}</td>
                </tr>))}
            </tbody>
          </table>
        </div>)}

      {/* TAB 2: User Group Rules (§5.24) */}
      {activeTab === 'groups' && (<div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Notification User Groups</h3>
            <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md">
              + Create User Group
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userGroups.map(ug => (<div key={ug.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{ug.group_name}</span>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[9px] font-black uppercase">
                    {ug.group_type}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Members: <strong className="text-white">{ug.member_count} Users</strong> • Priority: {ug.priority}
                </div>
              </div>))}
          </div>
        </div>)}
    </div>);
}
