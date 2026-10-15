import React, { useState } from 'react';
import { Key, Building2, AlertTriangle, Lock, Plus, Search, CheckCircle, XCircle, Eye, Users, } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend, } from 'recharts';
/* ============================================================================
   SUB-COMPONENT: Roles Management
============================================================================ */
export function RolesManagementView() {
    const [roles, setRoles] = useState([
        { id: 'admin', name: 'Administrator', description: 'Full system access and settings management', usersCount: 3, status: 'Active' },
        { id: 'staff', name: 'Staff Member', description: 'Manage own visitors and view appointments', usersCount: 42, status: 'Active' },
        { id: 'receptionist', name: 'Receptionist', description: 'Register, check-in, check-out visitors and print passes', usersCount: 4, status: 'Active' },
        { id: 'security', name: 'Security Officer', description: 'Access control verification and incident reporting', usersCount: 6, status: 'Active' },
        { id: 'visitor', name: 'Visitor', description: 'Limited access to request appointments and sign NDAs', usersCount: 156, status: 'Active' },
    ]);
    const [search, setSearch] = useState('');
    return (<div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Roles</h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Configure role permissions and member scopes</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4"/> Add Custom Role
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Search className="h-4 w-4 text-slate-500"/>
          <input type="text" placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} className="input max-w-xs py-2 text-xs"/>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/40">
              <tr className="text-left text-slate-500">
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Role Code</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Display Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Description</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Assigned Users</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {roles
            .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()))
            .map((role) => (<tr key={role.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-cyan-400">{role.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-200">{role.name}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{role.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                        <Users className="h-3 w-3"/> {role.usersCount} users
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        {role.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold uppercase tracking-widest mr-4">Edit</button>
                      <button className="text-slate-500 hover:text-white text-xs font-semibold uppercase tracking-widest">Clone</button>
                    </td>
                  </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
/* ============================================================================
   SUB-COMPONENT: Permissions Management
============================================================================ */
export function PermissionsManagementView() {
    const [activeTab, setActiveTab] = useState('admin');
    const [permissions, setPermissions] = useState({
        admin: { 'Dashboard': true, 'Users': true, 'Roles': true, 'Visitors': true, 'Appointments': true, 'Reception': true, 'Security': true, 'Reports': true, 'Settings': true },
        staff: { 'Dashboard': true, 'Users': false, 'Roles': false, 'Visitors': true, 'Appointments': true, 'Reception': false, 'Security': false, 'Reports': false, 'Settings': false },
        receptionist: { 'Dashboard': true, 'Users': false, 'Roles': false, 'Visitors': true, 'Appointments': true, 'Reception': true, 'Security': false, 'Reports': true, 'Settings': false },
        security: { 'Dashboard': true, 'Users': false, 'Roles': false, 'Visitors': true, 'Appointments': false, 'Reception': true, 'Security': true, 'Reports': false, 'Settings': false },
        visitor: { 'Dashboard': true, 'Users': false, 'Roles': false, 'Visitors': false, 'Appointments': true, 'Reception': false, 'Security': false, 'Reports': false, 'Settings': false },
    });
    const togglePerm = (roleKey, moduleName) => {
        setPermissions((prev) => ({
            ...prev,
            [roleKey]: {
                ...prev[roleKey],
                [moduleName]: !prev[roleKey][moduleName],
            },
        }));
    };
    const modulesList = ['Dashboard', 'Users', 'Roles', 'Visitors', 'Appointments', 'Reception', 'Security', 'Reports', 'Settings'];
    return (<div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">RBAC Matrix</h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Configure module access tokens for each user role</p>
        </div>
        <button className="btn-primary" onClick={() => alert('Permissions changes saved successfully.')}>
          Save Permissions Matrix
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 card h-fit space-y-2">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Roles Selector</h3>
          {Object.keys(permissions).map((role) => (<button key={role} onClick={() => setActiveTab(role)} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === role
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/25'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
              {role.toUpperCase()} Permission Set
            </button>))}
        </div>

        <div className="lg:col-span-3 card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Module Access Settings: <span className="text-cyan-400">{activeTab.toUpperCase()}</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Changes apply in real-time</span>
          </div>

          <div className="space-y-3">
            {modulesList.map((moduleName) => {
            const hasAccess = permissions[activeTab]?.[moduleName];
            return (<div key={moduleName} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-900/20 hover:border-slate-800 transition">
                  <div className="flex items-center gap-3">
                    <Key className={`h-4.5 w-4.5 ${hasAccess ? 'text-cyan-400' : 'text-slate-600'}`}/>
                    <div>
                      <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">{moduleName} System Module</p>
                      <p className="text-[10px] text-slate-500">Enable or disable primary view token for active route mapping</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={hasAccess} onChange={() => togglePerm(activeTab, moduleName)} className="sr-only peer"/>
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-white"></div>
                  </label>
                </div>);
        })}
          </div>
        </div>
      </div>
    </div>);
}
/* ============================================================================
   SUB-COMPONENT: Visitor Documents
============================================================================ */
export function VisitorDocumentsView() {
    const [documents, setDocuments] = useState([
        { id: 101, visitor: 'Sarah Connor', docName: 'NDA Non-Disclosure Agreement', status: 'Approved', date: '2026-07-03', size: '1.2 MB' },
        { id: 102, visitor: 'Kyle Reese', docName: 'Government Issued Photo ID', status: 'Pending Review', date: '2026-07-03', size: '2.4 MB' },
        { id: 103, visitor: 'Miles Dyson', docName: 'Cyberdyne Premises Liability Form', status: 'Approved', date: '2026-07-02', size: '940 KB' },
        { id: 104, visitor: 'John Connor', docName: 'Visitor Safety Induction PDF', status: 'Pending Review', date: '2026-07-03', size: '1.8 MB' },
        { id: 105, visitor: 'Marcus Wright', docName: 'Health Screening Declaration', status: 'Rejected', date: '2026-07-01', size: '850 KB' },
    ]);
    const updateStatus = (id, status) => {
        setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, status } : doc)));
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Visitor Registry Files</h1>
        <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Review legal releases, NDAs, and credentials uploads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (<div key={doc.id} className="card flex flex-col justify-between min-h-[190px]">
            <div>
              <div className="flex justify-between items-start gap-2 mb-3">
                <span className="text-[10px] text-slate-500 font-mono">REF: #{doc.id}</span>
                <span className={`badge ${doc.status === 'Approved'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : doc.status === 'Rejected'
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse'}`}>
                  {doc.status}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide mb-1 leading-snug">{doc.docName}</h3>
              <p className="text-xs text-slate-400 mb-1">Uploaded by: <span className="font-semibold text-slate-300">{doc.visitor}</span></p>
              <p className="text-[10px] text-slate-500 font-mono">{doc.date} · {doc.size}</p>
            </div>

            <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
              {doc.status === 'Pending Review' ? (<>
                  <button onClick={() => updateStatus(doc.id, 'Approved')} className="flex-1 btn-primary py-1.5 text-[10px] flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5"/> Approve
                  </button>
                  <button onClick={() => updateStatus(doc.id, 'Rejected')} className="flex-1 btn-danger py-1.5 text-[10px] flex items-center justify-center gap-1.5 border border-red-500/40 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white">
                    <XCircle className="h-3.5 w-3.5"/> Reject
                  </button>
                </>) : (<button onClick={() => updateStatus(doc.id, 'Pending Review')} className="w-full py-1.5 rounded-xl border border-white/5 bg-slate-900/40 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-slate-200 transition">
                  Re-evaluate File
                </button>)}
            </div>
          </div>))}
      </div>
    </div>);
}
/* ============================================================================
   SUB-COMPONENT: Meeting Rooms Scheduler
============================================================================ */
export function MeetingRoomsView() {
    const [rooms] = useState([
        { id: 1, name: 'Executive Boardroom A', capacity: 16, status: 'Occupied', host: 'CEO Office', amenities: ['VC Hub', 'Whiteboard', 'Dual Screen'] },
        { id: 2, name: 'Innovation Suite 204', capacity: 8, status: 'Available', host: null, amenities: ['Interactive Display', 'Glass Wall'] },
        { id: 3, name: 'Main Conference Hall', capacity: 45, status: 'Available', host: null, amenities: ['PA System', 'Stage Projection', 'VC Hub'] },
        { id: 4, name: 'Synergy Hub Room 3', capacity: 4, status: 'Occupied', host: 'HR Team', amenities: ['Whiteboard'] },
    ]);
    return (<div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Conference & Meeting Rooms</h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Monitor premises facilities and active hosting environments</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4"/> Register New Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.map((room) => (<div key={room.id} className="card flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyan-400"/>
                  {room.name}
                </h3>
                <span className={`badge ${room.status === 'Available'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                  {room.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs text-slate-400">
                  Maximum Seating Capacity: <span className="font-semibold text-slate-200">{room.capacity} Pax</span>
                </p>
                {room.host && (<p className="text-xs text-slate-400">
                    Currently Booked By: <span className="font-semibold text-cyan-400">{room.host}</span>
                  </p>)}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {room.amenities.map((a) => (<span key={a} className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                      {a}
                    </span>))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3.5 flex gap-3">
              <button className="flex-1 btn-primary py-2 text-[10px]">
                Book Calendar Slot
              </button>
              <button className="px-3 rounded-xl border border-white/5 bg-slate-900/40 text-slate-400 hover:text-white transition">
                <Eye className="h-4 w-4"/>
              </button>
            </div>
          </div>))}
      </div>
    </div>);
}
/* ============================================================================
   SUB-COMPONENT: Security Incidents
============================================================================ */
export function SecurityIncidentsView() {
    const [incidents, setIncidents] = useState([
        { id: 'INC-2026-039', details: 'Tailgating incident detected at East Turnstile A', severity: 'Critical', reportedBy: 'Officer K. Vance', status: 'Investigating', time: '10m ago' },
        { id: 'INC-2026-038', details: 'Visitor flagged on blacklist attempt check-in', severity: 'High', reportedBy: 'Reception desk B', status: 'Resolved', time: '2h ago' },
        { id: 'INC-2026-037', details: 'Lost visitor badge reported on Floor 3', severity: 'Low', reportedBy: 'Employee Jane Doe', status: 'Open', time: '4h ago' },
        { id: 'INC-2026-036', details: 'Escort required: Visitor exceeded visa allocation', severity: 'Moderate', reportedBy: 'Officer T. Miller', status: 'Resolved', time: '1d ago' },
    ]);
    const [newDetails, setNewDetails] = useState('');
    const [newSeverity, setNewSeverity] = useState('Moderate');
    const addIncident = (e) => {
        e.preventDefault();
        if (!newDetails)
            return;
        const newInc = {
            id: `INC-2026-0${incidents.length + 40}`,
            details: newDetails,
            severity: newSeverity,
            reportedBy: 'System Console',
            status: 'Open',
            time: 'Just now',
        };
        setIncidents([newInc, ...incidents]);
        setNewDetails('');
    };
    return (<div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Security Registry Logs</h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Audit security alerts, incident reports, and access violations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card h-fit">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500"/>
            File New Incident Report
          </h3>
          <form onSubmit={addIncident} className="space-y-4">
            <div>
              <label className="label">Incident Details</label>
              <textarea value={newDetails} onChange={(e) => setNewDetails(e.target.value)} placeholder="Describe access violation or security alert..." className="input h-24 text-xs resize-none"/>
            </div>
            <div>
              <label className="label">Severity Level</label>
              <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value)} className="input py-2 text-xs">
                <option value="Low">Low (General Alert)</option>
                <option value="Moderate">Moderate (Action Required)</option>
                <option value="High">High (Escort Trigger)</option>
                <option value="Critical">Critical (Immediate Lockdown)</option>
              </select>
            </div>
            <button type="submit" className="w-full btn-primary py-2.5">
              Submit Security Report
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 card">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Active Alert Feeds</h3>
          <div className="space-y-3">
            {incidents.map((inc) => (<div key={inc.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-red-400 font-mono font-bold tracking-wider">{inc.id}</span>
                    <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${inc.severity === 'Critical'
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : inc.severity === 'High'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : inc.severity === 'Moderate'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20'
                        : 'bg-slate-800 text-slate-400'}`}>
                      {inc.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-snug">{inc.details}</p>
                  <p className="text-[10px] text-slate-500">Reported by: {inc.reportedBy} · {inc.time}</p>
                </div>

                <div className="shrink-0">
                  <span className={`badge ${inc.status === 'Resolved'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse'}`}>
                    {inc.status}
                  </span>
                </div>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
/* ============================================================================
   SUB-COMPONENT: Notification Templates
============================================================================ */
export function NotificationTemplatesView() {
    const [templates, setTemplates] = useState([
        { id: 'T-001', name: 'Visitor Check-in Alert (SMS/Email)', subject: 'Your visitor has arrived', body: 'Hello {host_name}, your scheduled visitor {visitor_name} from {visitor_company} has checked in at reception.', channel: 'Email + SMS' },
        { id: 'T-002', name: 'Appointment Confirmation (Email)', subject: 'Appointment Approved - Visitor Registry', body: 'Dear {visitor_name}, your request to visit {company_name} on {start_time} has been approved. Reference: {ref_code}.', channel: 'Email' },
        { id: 'T-003', name: 'Emergency Broadcast Alarm', subject: 'Emergency Notice: Premises Lockdown', body: 'ALERT: An emergency protocol has been triggered. Please locate nearest exit or report to muster point.', channel: 'SMS + Push' },
    ]);
    return (<div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Alert Dispatch Templates</h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Configure automated dispatch alerts and variables mapping</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4"/> Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {templates.map((tpl) => (<div key={tpl.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-cyan-400 font-mono font-bold tracking-wider">{tpl.id}</span>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide mt-0.5">{tpl.name}</h3>
              </div>
              <span className="badge border-indigo-500/30 bg-indigo-500/10 text-indigo-400">{tpl.channel}</span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Subject Line</p>
                <p className="text-xs text-slate-300 font-medium bg-slate-950/40 p-2.5 rounded-lg border border-white/5 mt-1 font-sans">{tpl.subject}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Template Content Body</p>
                <p className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-white/5 mt-1 font-mono leading-relaxed whitespace-pre-wrap">{tpl.body}</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3.5 flex justify-end gap-3">
              <button className="btn-primary py-1.5 px-4 text-[10px]">
                Edit Body
              </button>
              <button className="py-1.5 px-4 rounded-xl border border-white/5 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition">
                Test Dispatch
              </button>
            </div>
          </div>))}
      </div>
    </div>);
}
/* ============================================================================
   SUB-COMPONENT: Visitor Reports
============================================================================ */
export function VisitorReportsView() {
    const visitorTrendsData = [
        { name: 'Mon', total: 42, approved: 38, blacklisted: 0 },
        { name: 'Tue', total: 64, approved: 60, blacklisted: 1 },
        { name: 'Wed', total: 85, approved: 80, blacklisted: 2 },
        { name: 'Thu', total: 72, approved: 70, blacklisted: 0 },
        { name: 'Fri', total: 95, approved: 92, blacklisted: 0 },
    ];
    const pieData = [
        { name: 'Business Meet', value: 400, color: '#00F5FF' },
        { name: 'Deliveries', value: 300, color: '#7F77DD' },
        { name: 'Maintenance', value: 180, color: '#FBBF24' },
        { name: 'Interviews', value: 120, color: '#EC4899' },
    ];
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Visitor Reports</h1>
        <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Review visitor registry analytics and weekly check-in statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-6">Weekly Visitor Check-In Distribution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitorTrendsData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#52525b" fontSize={11}/>
                <YAxis stroke="#52525b" fontSize={11}/>
                <Tooltip contentStyle={{ backgroundColor: '#0b101b', borderColor: '#2A2A3A', color: '#fff', fontSize: 11 }}/>
                <Area type="monotone" dataKey="total" stroke="#00F5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 card flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Registry Categories</h3>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0b101b', borderColor: '#2A2A3A', color: '#fff', fontSize: 11 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-semibold uppercase">
            {pieData.map((entry) => (<div key={entry.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}/>
                <span className="truncate">{entry.name}</span>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
/* ============================================================================
   SUB-COMPONENT: Appointment Reports
============================================================================ */
export function AppointmentReportsView() {
    const data = [
        { name: 'Mon', scheduled: 30, approved: 25 },
        { name: 'Tue', scheduled: 48, approved: 42 },
        { name: 'Wed', scheduled: 75, approved: 69 },
        { name: 'Thu', scheduled: 55, approved: 50 },
        { name: 'Fri', scheduled: 80, approved: 76 },
    ];
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Appointment Reports</h1>
        <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Review scheduled meetings timeline, request volumes, and completion metrics</p>
      </div>

      <div className="card">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-6">Scheduled vs. Approved Appointment Volume</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#52525b" fontSize={11}/>
              <YAxis stroke="#52525b" fontSize={11}/>
              <Tooltip contentStyle={{ backgroundColor: '#0b101b', borderColor: '#2A2A3A', color: '#fff', fontSize: 11 }}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
              <Bar dataKey="scheduled" fill="#7F77DD" radius={[4, 4, 0, 0]}/>
              <Bar dataKey="approved" fill="#00F5FF" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>);
}
/* ============================================================================
   SUB-COMPONENT: Audit Logs
============================================================================ */
export function AuditLogsView() {
    const [logs] = useState([
        { id: 1, user: 'system_cron', action: 'Archived Checked-Out Badges', date: '2026-07-03 04:00:00', ip: '127.0.0.1', details: 'Cleaned up expired QR badges' },
        { id: 2, user: 'admin@visitor.com', action: 'Update Permissions Matrix', date: '2026-07-03 03:14:02', ip: '192.168.10.45', details: 'Added security role availability toggle' },
        { id: 3, user: 'receptionist@visitor.com', action: 'Check-In Visitor #204', date: '2026-07-03 02:45:10', ip: '192.168.10.12', details: 'Printed Visitor Pass label for Kyle Reese' },
        { id: 4, user: 'security@visitor.com', action: 'Remove blacklist entity', date: '2026-07-03 01:20:00', ip: '192.168.10.19', details: 'Unblocked Sarah Connor record per admin instruction' },
    ]);
    return (<div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Audit Trail</h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Review chronological operations, database mutations, and system events</p>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/40">
              <tr className="text-left text-slate-500">
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Timestamp</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Actor ID</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Event Action</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Resource Details</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {logs.map((log) => (<tr key={log.id} className="hover:bg-white/5 transition text-slate-300">
                  <td className="px-6 py-4 text-slate-400">{log.date}</td>
                  <td className="px-6 py-4 font-sans font-semibold text-slate-200">{log.user}</td>
                  <td className="px-6 py-4"><span className="text-cyan-400 font-bold">{log.action}</span></td>
                  <td className="px-6 py-4 font-sans text-slate-400">{log.details}</td>
                  <td className="px-6 py-4 text-slate-500">{log.ip}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
/* ============================================================================
   SUB-COMPONENT: Change Password settings
============================================================================ */
export function ChangePasswordView() {
    const [current, setCurrent] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!current || !newPass || !confirm) {
            setMessage('Please fill in all security fields.');
            return;
        }
        if (newPass !== confirm) {
            setMessage('Confirm password does not match new password.');
            return;
        }
        setMessage('Security Credentials updated successfully!');
        setCurrent('');
        setNewPass('');
        setConfirm('');
    };
    return (<div className="max-w-md mx-auto card mt-10">
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Lock className="h-5 w-5 text-cyan-400"/>
        Modify Access Credentials
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Current Password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="input py-2 text-xs" placeholder="••••••••"/>
        </div>
        <div>
          <label className="label">New Secure Password</label>
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="input py-2 text-xs" placeholder="••••••••"/>
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input py-2 text-xs" placeholder="••••••••"/>
        </div>
        
        {message && (<p className={`text-xs font-semibold py-1 ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
            {message}
          </p>)}

        <button type="submit" className="w-full btn-primary py-2.5">
          Update Credentials Keys
        </button>
      </form>
    </div>);
}
