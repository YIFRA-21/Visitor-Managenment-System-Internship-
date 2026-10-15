import React, { useState } from 'react';
import { Shield, Key, Terminal, Check } from 'lucide-react';
const PERMISSIONS = [
    'notification.view', 'notification.create', 'notification.update', 'notification.delete',
    'notification.send', 'notification.schedule', 'notification.broadcast', 'notification.approve',
    'notification.cancel', 'notification.retry', 'notification.export', 'notification.analytics', 'notification.audit'
];
export default function ManualNotificationSecurityAndAudit() {
    const [activeTab, setActiveTab] = useState('audit');
    const [selectedRole, setSelectedRole] = useState('Notification Administrator');
    const [rolePermissions, setRolePermissions] = useState({
        'Notification Administrator': [...PERMISSIONS],
        'Notification Manager': ['notification.view', 'notification.create', 'notification.update', 'notification.send', 'notification.schedule', 'notification.broadcast', 'notification.approve', 'notification.export', 'notification.analytics'],
        'Notification Operator': ['notification.view', 'notification.create', 'notification.send', 'notification.schedule'],
        'Notification Viewer': ['notification.view', 'notification.analytics']
    });
    const [auditLogs, setAuditLogs] = useState([
        { id: 101, action: 'NOTIFICATION_SENT', performed_by_name: 'Admin User', role: 'admin', ip_address: '192.168.1.10', browser: 'Chrome 122 / Windows 11', details: 'Dispatched MNT-0001 Annual Security Clearance Audit to 450 recipients', created_at: new Date().toISOString() },
        { id: 102, action: 'BROADCAST_APPROVED', performed_by_name: 'Security Officer', role: 'security', ip_address: '192.168.1.15', browser: 'Firefox 120 / macOS', details: 'Approved BRD-001 Emergency Fire Drill Announcement', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 103, action: 'DRAFT_RESTORED', performed_by_name: 'Reception Desk', role: 'receptionist', ip_address: '192.168.1.22', browser: 'Edge 121 / Windows 11', details: 'Restored draft v2 for Q3 Security Policy Notice', created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 104, action: 'PERMISSION_DENIED', performed_by_name: 'Guest User', role: 'visitor', ip_address: '192.168.1.99', browser: 'Safari / iOS', details: 'Unauthorized attempt to access /api/manual-notifications/broadcast', created_at: new Date(Date.now() - 86400000).toISOString() }
    ]);
    const togglePermission = (role, perm) => {
        setRolePermissions(prev => {
            const current = prev[role] || [];
            const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
            return { ...prev, [role]: updated };
        });
    };
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl shadow-xl text-white">
            <Shield className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Notification Center</span>
              <span>/</span>
              <span className="text-rose-400 font-bold">Security & SIEM Audit (Part 4.9)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Security, RBAC & SIEM Audit Log Center</h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'audit', label: 'SIEM Audit Trail' },
            { id: 'rbac', label: 'RBAC Permission Matrix' },
            { id: 'security', label: 'Security Telemetry' }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              {t.label}
            </button>))}
        </div>
      </div>

      {/* TAB 1: SIEM Audit Logs */}
      {activeTab === 'audit' && (<div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-rose-400"/>
                <span>SIEM Audit Log Viewer (21 Security Event Types)</span>
              </h3>
            </div>

            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <tr>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Performed By</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Browser / Device</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {auditLogs.map(log => (<tr key={log.id} className="hover:bg-slate-850">
                    <td className="p-3 font-mono font-bold text-rose-400">{log.action}</td>
                    <td className="p-3 font-bold text-white">{log.performed_by_name}</td>
                    <td className="p-3 uppercase text-[10px] text-slate-400">{log.role}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{log.ip_address}</td>
                    <td className="p-3 text-[11px] text-slate-400">{log.browser}</td>
                    <td className="p-3 text-slate-300">{log.details}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* TAB 2: RBAC Matrix */}
      {activeTab === 'rbac' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
              <Key className="h-4 w-4 text-indigo-400"/>
              <span>RBAC Permission Matrix (4 Role Presets & 13 Permissions)</span>
            </h3>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {Object.keys(rolePermissions).map(role => (<button key={role} onClick={() => setSelectedRole(role)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${selectedRole === role ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                  {role}
                </button>))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {PERMISSIONS.map(perm => {
                const isEnabled = (rolePermissions[selectedRole] || []).includes(perm);
                return (<div key={perm} onClick={() => togglePermission(selectedRole, perm)} className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isEnabled
                        ? 'bg-indigo-600/20 border-indigo-500/50 shadow-md'
                        : 'bg-slate-950 border-slate-800 opacity-60'}`}>
                  <span className="text-xs font-mono font-bold text-slate-200">{perm}</span>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center ${isEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    <Check className="h-3 w-3"/>
                  </div>
                </div>);
            })}
          </div>
        </div>)}

      {/* TAB 3: Security Telemetry */}
      {activeTab === 'security' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Unauthorized Access Attempts</span>
            <div className="text-2xl font-black text-rose-400">1</div>
            <p className="text-[10px] text-slate-500">Blocked by JWT & Permission Guard</p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">XSS Input Sanitization</span>
            <div className="text-2xl font-black text-emerald-400">100% Clean</div>
            <p className="text-[10px] text-slate-500">HTML payloads sanitized automatically</p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Rate Limiter Status</span>
            <div className="text-2xl font-black text-cyan-400">Enforced</div>
            <p className="text-[10px] text-slate-500">Max 20 dispatches / min / IP</p>
          </div>
        </div>)}
    </div>);
}
