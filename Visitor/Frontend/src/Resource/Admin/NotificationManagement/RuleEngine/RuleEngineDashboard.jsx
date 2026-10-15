import React, { useState, useEffect } from 'react';
import { Layers, Zap, Plus, ChevronRight, BarChart3, Upload, Eye, Tag, Search } from 'lucide-react';
import { ruleEngineApi } from '../../../../services/api';
const MOCK_EVENTS = [
    { id: 'EVT-001', module: 'VISITOR', name: 'VISITOR_REGISTERED', description: 'A new visitor is registered in the system', status: 'active' },
    { id: 'EVT-002', module: 'VISITOR', name: 'VISITOR_UPDATED', description: 'Visitor profile information updated', status: 'active' },
    { id: 'EVT-003', module: 'APPOINTMENT', name: 'APPT_REQUESTED', description: 'New appointment request submitted', status: 'active' },
    { id: 'EVT-004', module: 'APPOINTMENT', name: 'APPT_APPROVED', description: 'Appointment approved by host/manager', status: 'active' },
    { id: 'EVT-005', module: 'APPOINTMENT', name: 'APPT_REJECTED', description: 'Appointment rejected by host/manager', status: 'active' },
    { id: 'EVT-006', module: 'CHECKIN', name: 'CHECKIN_COMPLETED', description: 'Visitor completed check-in at reception', status: 'active' },
    { id: 'EVT-007', module: 'CHECKOUT', name: 'CHECKOUT_COMPLETED', description: 'Visitor completed check-out', status: 'active' },
    { id: 'EVT-008', module: 'VISITOR_PASS', name: 'PASS_GENERATED', description: 'Digital visitor pass generated', status: 'active' },
    { id: 'EVT-009', module: 'AUTH', name: 'PASSWORD_CHANGED', description: 'User password changed', status: 'active' },
    { id: 'EVT-010', module: 'EMPLOYEE', name: 'EMPLOYEE_CREATED', description: 'New employee record created', status: 'active' },
    { id: 'EVT-011', module: 'EMPLOYEE', name: 'EMPLOYEE_UPDATED', description: 'Employee record updated', status: 'active' },
    { id: 'EVT-012', module: 'SECURITY', name: 'EMERGENCY_DECLARED', description: 'Emergency alert declared', status: 'active' },
    { id: 'EVT-013', module: 'RECEPTION', name: 'VISITOR_ARRIVED', description: 'Visitor arrived at reception desk', status: 'active' },
    { id: 'EVT-014', module: 'APPROVAL', name: 'APPROVAL_ESCALATED', description: 'Approval escalated to next level', status: 'active' },
    { id: 'EVT-015', module: 'SECURITY', name: 'ACCESS_DENIED', description: 'Visitor denied access at security checkpoint', status: 'active' },
    { id: 'EVT-016', module: 'AUTH', name: 'ACCOUNT_LOCKED', description: 'User account locked after failed attempts', status: 'active' },
    { id: 'EVT-017', module: 'AUTH', name: 'ACCOUNT_UNLOCKED', description: 'User account unlocked by administrator', status: 'active' },
    { id: 'EVT-018', module: 'ORGANIZATION', name: 'ORG_POLICY_UPDATED', description: 'Organization policy settings updated', status: 'active' },
    { id: 'EVT-019', module: 'APPOINTMENT', name: 'APPT_CANCELLED', description: 'Appointment cancelled by host or visitor', status: 'active' },
    { id: 'EVT-020', module: 'APPOINTMENT', name: 'APPT_RESCHEDULED', description: 'Appointment rescheduled to new date/time', status: 'active' },
    { id: 'EVT-021', module: 'REPORTS', name: 'REPORT_GENERATED', description: 'Scheduled report generated successfully', status: 'active' },
    { id: 'EVT-022', module: 'SYSTEM', name: 'SYSTEM_MAINTENANCE', description: 'System entering scheduled maintenance window', status: 'active' }
];
const CATEGORIES = [
    'Authentication', 'Authorization', 'Organization', 'Employee', 'Visitor',
    'Appointment', 'Approval Workflow', 'Reception', 'Security', 'Visitor Pass',
    'Check-In', 'Check-Out', 'Notification', 'Reports', 'Audit', 'System'
];
export default function RuleEngineDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [kpis, setKpis] = useState({
        totalRules: 48, activeRules: 32, draftRules: 8, disabledRules: 5,
        scheduledRules: 3, businessEvents: 22, activeTriggers: 28, executionsToday: 142
    });
    const [events] = useState(MOCK_EVENTS);
    const [categories] = useState(CATEGORIES);
    const [eventSearch, setEventSearch] = useState('');
    useEffect(() => {
        ruleEngineApi.getDashboard().then(res => {
            if (res.data?.data?.kpis)
                setKpis(res.data.data.kpis);
        }).catch(() => { });
    }, []);
    const filteredEvents = events.filter(e => !eventSearch || e.name.toLowerCase().includes(eventSearch.toLowerCase()) || e.module.toLowerCase().includes(eventSearch.toLowerCase()));
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl shadow-xl text-white">
            <Layers className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Module 13</span><ChevronRight className="h-3 w-3"/>
              <span>Notification Management</span><ChevronRight className="h-3 w-3"/>
              <span className="text-indigo-400 font-bold">Rule Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Notification Rule Engine</h1>
            <p className="text-xs text-slate-400 mt-0.5">Part 5 – Centralized Business Rule Foundation (§5.1–5.12)</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'events', label: 'Business Events', badge: events.length },
            { id: 'categories', label: 'Categories', badge: categories.length }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-indigo-700' : 'bg-slate-800 text-indigo-400'}`}>{t.badge}</span>)}
            </button>))}
        </div>
      </div>

      {/* ─── TAB: Dashboard (§5.1) ─── */}
      {activeTab === 'dashboard' && (<div className="space-y-6">
          {/* 8 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
                { label: 'Total Rules', value: kpis.totalRules, color: 'text-indigo-400 border-indigo-500/30' },
                { label: 'Active Rules', value: kpis.activeRules, color: 'text-emerald-400 border-emerald-500/30' },
                { label: 'Draft Rules', value: kpis.draftRules, color: 'text-slate-400 border-slate-500/30' },
                { label: 'Disabled Rules', value: kpis.disabledRules, color: 'text-rose-400 border-rose-500/30' },
                { label: 'Scheduled Rules', value: kpis.scheduledRules, color: 'text-amber-400 border-amber-500/30' },
                { label: 'Business Events', value: kpis.businessEvents, color: 'text-purple-400 border-purple-500/30' },
                { label: 'Active Triggers', value: kpis.activeTriggers, color: 'text-cyan-400 border-cyan-500/30' },
                { label: 'Executions Today', value: kpis.executionsToday, color: 'text-teal-400 border-teal-500/30' }
            ].map((m, i) => (<div key={i} className={`p-4 bg-slate-900 border ${m.color} rounded-2xl`}>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</span>
                <div className={`text-2xl font-black mt-1 ${m.color.split(' ')[0]}`}>{m.value}</div>
              </div>))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
                { title: 'Rules by Category', data: [{ l: 'Security', v: 12 }, { l: 'Appointment', v: 10 }, { l: 'Check-In', v: 8 }, { l: 'Employee', v: 6 }, { l: 'System', v: 5 }] },
                { title: 'Rules by Module', data: [{ l: 'CHECKIN', v: 8 }, { l: 'APPOINTMENT', v: 10 }, { l: 'SECURITY', v: 12 }, { l: 'EMPLOYEE', v: 6 }, { l: 'AUTH', v: 5 }] },
                { title: 'Rules by Status', data: [{ l: 'Active', v: 32 }, { l: 'Draft', v: 8 }, { l: 'Disabled', v: 5 }, { l: 'Scheduled', v: 3 }] },
                { title: 'Trigger Types', data: [{ l: 'Immediate', v: 28 }, { l: 'Scheduled', v: 8 }, { l: 'Recurring', v: 6 }, { l: 'Manual', v: 6 }] }
            ].map((chart, i) => (<div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white uppercase">{chart.title}</span>
                {chart.data.map((d, j) => (<div key={j} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{d.l}</span>
                    <span className="font-bold font-mono text-indigo-400">{d.v}</span>
                  </div>))}
              </div>))}
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2 mb-3">
              <Zap className="h-4 w-4 text-amber-400"/><span>Quick Actions</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
                <Plus className="h-3.5 w-3.5"/><span>Create Rule</span>
              </button>
              <button className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold">
                <Upload className="h-3.5 w-3.5"/><span>Import Rule</span>
              </button>
              <button className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold">
                <Eye className="h-3.5 w-3.5"/><span>View Events ({kpis.businessEvents})</span>
              </button>
              <button className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold">
                <BarChart3 className="h-3.5 w-3.5 text-indigo-400"/><span>Rule Analytics</span>
              </button>
            </div>
          </div>
        </div>)}

      {/* ─── TAB: Business Event Registry (§5.4) ─── */}
      {activeTab === 'events' && (<div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400"/>
              <input type="text" value={eventSearch} onChange={e => setEventSearch(e.target.value)} placeholder="Search events by name or module..." className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white"/>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Centralized Business Event Registry (22 Domain Events)</h3>
            </div>
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <tr>
                  <th className="p-3">Event ID</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Event Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredEvents.map(e => (<tr key={e.id} className="hover:bg-slate-850">
                    <td className="p-3 font-mono font-bold text-indigo-400">{e.id}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[9px] font-black uppercase">{e.module}</span></td>
                    <td className="p-3 font-mono font-bold text-white">{e.name}</td>
                    <td className="p-3 text-slate-400">{e.description}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase">{e.status}</span></td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* ─── TAB: Categories (§5.3) ─── */}
      {activeTab === 'categories' && (<div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
              <Tag className="h-4 w-4 text-indigo-400"/><span>Rule Categories (16 Built-in + Custom)</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((cat, i) => (<div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-900 transition-all">
                  <span className="text-xs font-bold text-slate-200">{cat}</span>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-black">BUILT-IN</span>
                </div>))}
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
              <Plus className="h-3.5 w-3.5"/><span>Add Custom Category</span>
            </button>
          </div>
        </div>)}
    </div>);
}
