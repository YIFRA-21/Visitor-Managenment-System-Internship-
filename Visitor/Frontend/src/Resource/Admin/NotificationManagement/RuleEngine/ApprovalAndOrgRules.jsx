import React, { useState, useEffect } from 'react';
import { Building2, GitBranch, Layers, ArrowRight } from 'lucide-react';
import { workflowRulesApi } from '../../../../services/api';
export default function ApprovalAndOrgRules() {
    const [activeTab, setActiveTab] = useState('approval');
    const [approvals, setApprovals] = useState([]);
    const [orgHierarchy, setOrgHierarchy] = useState({
        organization: { name: 'HQ Corporation', type: 'Parent', inheritance: 'Cascade to Subsidiaries' },
        branches: [
            { id: 1, name: 'Riyadh Main Campus', timezone: 'UTC+3', manager: 'Sarah Johnson' },
            { id: 2, name: 'Jeddah Regional Office', timezone: 'UTC+3', manager: 'Michael Chen' }
        ],
        departments: [
            { id: 1, name: 'Security & Safety', hours: '24/7 Shift', escalation: 'Immediate' },
            { id: 2, name: 'Human Resources', hours: '08:00 - 17:00', escalation: '24 Hours' }
        ]
    });
    useEffect(() => {
        workflowRulesApi.getApprovals().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setApprovals(res.data.data);
        }).catch(() => { });
        workflowRulesApi.getOrgHierarchy().then(res => {
            if (res.data?.data)
                setOrgHierarchy(res.data.data);
        }).catch(() => { });
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl text-white">
            <Building2 className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span>
              <span>/</span>
              <span className="text-indigo-400 font-bold">Approval & Hierarchy (§5.17, §5.20–§5.22)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Approval & Organization Rule Engine</h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'approval', label: 'Approval Workflows (§5.17)', badge: approvals.length },
            { id: 'org', label: 'Organization (§5.20)' },
            { id: 'branch', label: 'Branch (§5.21)', badge: orgHierarchy.branches?.length },
            { id: 'dept', label: 'Department (§5.22)', badge: orgHierarchy.departments?.length }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-indigo-700' : 'bg-slate-800 text-indigo-400'}`}>
                  {t.badge}
                </span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Approval Workflows (§5.17) */}
      {activeTab === 'approval' && (<div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Multi-Level Approval Rules</h3>
          </div>

          <div className="divide-y divide-slate-800">
            {approvals.map(app => (<div key={app.id} className="p-4 space-y-2 hover:bg-slate-850">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{app.name}</h4>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[9px] font-black uppercase">
                    {app.approval_type}
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center space-x-2">
                  <span>L1 Approver: <strong className="text-indigo-400">{app.l1_approver}</strong></span>
                  {app.l2_approver !== 'N/A' && (<>
                      <ArrowRight className="h-3 w-3 text-slate-600"/>
                      <span>L2 Approver: <strong className="text-purple-400">{app.l2_approver}</strong></span>
                    </>)}
                </div>
              </div>))}
          </div>
        </div>)}

      {/* TAB 2: Organization Rules (§5.20) */}
      {activeTab === 'org' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-2xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-indigo-400"/>
            <span>Organization Hierarchy & Rule Inheritance</span>
          </h3>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <div><span className="text-[10px] text-slate-500 uppercase font-bold">Organization Name:</span> <strong className="text-white ml-2">{orgHierarchy.organization.name}</strong></div>
            <div><span className="text-[10px] text-slate-500 uppercase font-bold">Type:</span> <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-black uppercase ml-2">{orgHierarchy.organization.type}</span></div>
            <div><span className="text-[10px] text-slate-500 uppercase font-bold">Inheritance Mode:</span> <span className="text-emerald-400 font-mono ml-2">{orgHierarchy.organization.inheritance}</span></div>
          </div>
        </div>)}

      {/* TAB 3: Branch Rules (§5.21) */}
      {activeTab === 'branch' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgHierarchy.branches?.map((b) => (<div key={b.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <GitBranch className="h-4 w-4"/>
                <span className="text-xs font-bold text-white">{b.name}</span>
              </div>
              <div className="text-[10px] text-slate-400">Timezone: {b.timezone} • Manager: {b.manager}</div>
            </div>))}
        </div>)}

      {/* TAB 4: Department Rules (§5.22) */}
      {activeTab === 'dept' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgHierarchy.departments?.map((d) => (<div key={d.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-purple-400">
                <Layers className="h-4 w-4"/>
                <span className="text-xs font-bold text-white">{d.name}</span>
              </div>
              <div className="text-[10px] text-slate-400">Shift: {d.hours} • Escalation: {d.escalation}</div>
            </div>))}
        </div>)}
    </div>);
}
