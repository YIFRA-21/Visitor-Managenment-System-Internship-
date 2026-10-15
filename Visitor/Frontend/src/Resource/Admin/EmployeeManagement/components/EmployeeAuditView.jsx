import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, Clock, UserCheck, Edit3, Trash2, Power, Plus, Archive, RotateCcw, Mail, Key, ShieldAlert, ShieldCheck, Eye, Download, X, Copy, Check, Info } from 'lucide-react';
import { employeeManagementApi } from '../../../../services/api';
export default function EmployeeAuditView() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionCategory, setActionCategory] = useState('ALL');
    const [actionFilter, setActionFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [copied, setCopied] = useState(false);
    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const res = await employeeManagementApi.getAuditLogs({ limit: 200 });
            if (res.data?.data && Array.isArray(res.data.data)) {
                setLogs(res.data.data);
            }
            else {
                setLogs([]);
            }
        }
        catch (_) {
            setLogs([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchAuditLogs();
    }, []);
    const getActionCategory = (action) => {
        const act = (action || '').toUpperCase();
        if (act.includes('CREATE') || act.includes('ONBOARD'))
            return 'ONBOARD';
        if (act.includes('EMAIL') || act.includes('CREDENTIAL') || act.includes('PASSWORD') || act.includes('ACCOUNT'))
            return 'CREDENTIALS';
        if (act.includes('UPDATE') || act.includes('AVAILABILITY'))
            return 'UPDATES';
        if (act.includes('HOST'))
            return 'HOST';
        if (act.includes('ARCHIVE') || act.includes('RESTORE') || act.includes('DELETE') || act.includes('STATUS'))
            return 'LIFECYCLE';
        return 'OTHER';
    };
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const actor = log.actor_name || log.performed_by_name || '';
            const empName = log.employee_name || '';
            const empNum = log.employee_number || '';
            const action = log.action || '';
            const detailsStr = JSON.stringify(log.metadata_json || log.details || log.new_values || log.old_values || '');
            const term = searchTerm.toLowerCase();
            const matchSearch = !searchTerm ||
                action.toLowerCase().includes(term) ||
                empName.toLowerCase().includes(term) ||
                empNum.toLowerCase().includes(term) ||
                actor.toLowerCase().includes(term) ||
                detailsStr.toLowerCase().includes(term);
            const matchCategory = actionCategory === 'ALL' || getActionCategory(action) === actionCategory;
            const matchAction = !actionFilter || actionFilter === 'ALL' || action === actionFilter;
            return matchSearch && matchCategory && matchAction;
        });
    }, [logs, searchTerm, actionCategory, actionFilter]);
    const getActionBadge = (action) => {
        const act = (action || '').toUpperCase();
        switch (act) {
            case 'EMPLOYEE_CREATED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Plus className="h-3 w-3"/> Employee Created
          </span>);
            case 'USER_ACCOUNT_CREATED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Key className="h-3 w-3"/> User Account Created
          </span>);
            case 'REGISTRATION_EMAIL_SENT':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Mail className="h-3 w-3"/> Credentials Emailed
          </span>);
            case 'REGISTRATION_EMAIL_FAILED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="h-3 w-3"/> Email Failed
          </span>);
            case 'REGISTRATION_CREDENTIALS_RESENT':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <RotateCcw className="h-3 w-3"/> Credentials Resent
          </span>);
            case 'EMPLOYEE_UPDATED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Edit3 className="h-3 w-3"/> Record Updated
          </span>);
            case 'AVAILABILITY_UPDATED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <Clock className="h-3 w-3"/> Availability Changed
          </span>);
            case 'HOST_ENABLED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <UserCheck className="h-3 w-3"/> Host Enabled
          </span>);
            case 'HOST_DISABLED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            <Power className="h-3 w-3"/> Host Disabled
          </span>);
            case 'EMPLOYEE_STATUS_CHANGED':
            case 'EMPLOYEE_ACTIVATED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <UserCheck className="h-3 w-3"/> Status Activated
          </span>);
            case 'EMPLOYEE_DEACTIVATED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Power className="h-3 w-3"/> Status Deactivated
          </span>);
            case 'EMPLOYEE_ARCHIVED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Archive className="h-3 w-3"/> Archived
          </span>);
            case 'EMPLOYEE_RESTORED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <RotateCcw className="h-3 w-3"/> Restored
          </span>);
            case 'EMPLOYEE_DELETED':
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Trash2 className="h-3 w-3"/> Deleted
          </span>);
            default:
                return (<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {action}
          </span>);
        }
    };
    const renderDetailsSummary = (log) => {
        const meta = log.metadata_json || log.new_values || log.details;
        if (!meta)
            return <span className="text-slate-500 italic">No parameter payload recorded</span>;
        const data = typeof meta === 'string' ? (() => { try {
            return JSON.parse(meta);
        }
        catch {
            return meta;
        } })() : meta;
        if (typeof data === 'string')
            return <span className="text-slate-300">{data}</span>;
        if (log.action === 'REGISTRATION_EMAIL_SENT') {
            return (<span className="text-slate-300 text-xs">
          Credentials sent to <span className="text-cyan-400 font-mono">{data.to || 'recipient'}</span>
          {data.user_code && <span className="text-slate-500 ml-1">({data.user_code})</span>}
        </span>);
        }
        if (log.action === 'USER_ACCOUNT_CREATED') {
            return (<span className="text-slate-300 text-xs">
          Account created with role <span className="text-indigo-400 font-semibold">{data.role}</span>
          {data.user_code && <span className="text-slate-400 ml-1">• Code: {data.user_code}</span>}
        </span>);
        }
        if (log.action === 'EMPLOYEE_CREATED') {
            return (<span className="text-slate-300 text-xs">
          Registered <span className="text-white font-semibold">{data.name}</span>
          {data.email && <span className="text-slate-400 ml-1">({data.email})</span>}
        </span>);
        }
        if (log.action === 'AVAILABILITY_UPDATED') {
            return (<span className="text-slate-300 text-xs">
          Availability set to <span className="text-teal-400 font-semibold">{data.availability_status}</span>
        </span>);
        }
        if (log.action === 'EMPLOYEE_UPDATED') {
            const fields = Array.isArray(data.updated_fields) ? data.updated_fields.join(', ') : 'Profile attributes';
            return <span className="text-slate-300 text-xs">Updated: <span className="text-sky-300">{fields}</span></span>;
        }
        // Default object display
        const keys = Object.keys(data).filter(k => k !== 'actor_name');
        if (keys.length === 0)
            return <span className="text-slate-400 text-xs">Executed successfully</span>;
        return (<div className="flex flex-wrap gap-1.5 items-center">
        {keys.slice(0, 3).map(k => (<span key={k} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
            {k}: {String(data[k])}
          </span>))}
        {keys.length > 3 && (<span className="text-[10px] text-indigo-400">+{keys.length - 3} more</span>)}
      </div>);
    };
    const handleCopyDetails = (obj) => {
        navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const exportAuditCSV = () => {
        if (!filteredLogs.length)
            return;
        const headers = ['Timestamp', 'Action', 'Target Employee', 'Employee Number', 'Performed By', 'Details'];
        const rows = filteredLogs.map(l => [
            `"${new Date(l.created_at).toISOString()}"`,
            `"${l.action || ''}"`,
            `"${(l.employee_name || '').replace(/"/g, '""')}"`,
            `"${l.employee_number || ''}"`,
            `"${(l.actor_name || l.performed_by_name || 'System Admin').replace(/"/g, '""')}"`,
            `"${JSON.stringify(l.metadata_json || l.details || l.new_values || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `employee_operations_audit_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (<div className="space-y-4">
      {/* Process Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
            { key: 'ALL', label: 'All Operations', count: logs.length },
            { key: 'ONBOARD', label: 'Onboarding & Creation', count: logs.filter(l => getActionCategory(l.action) === 'ONBOARD').length },
            { key: 'CREDENTIALS', label: 'Credentials & Email', count: logs.filter(l => getActionCategory(l.action) === 'CREDENTIALS').length },
            { key: 'UPDATES', label: 'Profile Updates', count: logs.filter(l => getActionCategory(l.action) === 'UPDATES').length },
            { key: 'HOST', label: 'Host Settings', count: logs.filter(l => getActionCategory(l.action) === 'HOST').length },
            { key: 'LIFECYCLE', label: 'Lifecycle (Archive/Delete)', count: logs.filter(l => getActionCategory(l.action) === 'LIFECYCLE').length },
        ].map(tab => (<button key={tab.key} type="button" onClick={() => setActionCategory(tab.key)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${actionCategory === tab.key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'}`}>
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${actionCategory === tab.key ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {tab.count}
            </span>
          </button>))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 outline-none" placeholder="Search performed operations by action, employee name, ID, or actor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
          </div>

          <div className="md:col-span-3">
            <select className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-200 outline-none" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">All Operation Types</option>
              <option value="EMPLOYEE_CREATED">Employee Created</option>
              <option value="USER_ACCOUNT_CREATED">User Account Created</option>
              <option value="REGISTRATION_EMAIL_SENT">Credentials Emailed</option>
              <option value="REGISTRATION_CREDENTIALS_RESENT">Credentials Resent</option>
              <option value="EMPLOYEE_UPDATED">Record Updated</option>
              <option value="AVAILABILITY_UPDATED">Availability Changed</option>
              <option value="HOST_ENABLED">Host Enabled</option>
              <option value="HOST_DISABLED">Host Disabled</option>
              <option value="EMPLOYEE_STATUS_CHANGED">Status Changed</option>
              <option value="EMPLOYEE_ARCHIVED">Employee Archived</option>
              <option value="EMPLOYEE_RESTORED">Employee Restored</option>
              <option value="EMPLOYEE_DELETED">Employee Deleted</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <button type="button" onClick={exportAuditCSV} disabled={filteredLogs.length === 0} className="px-3 py-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-50 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all" title="Export filtered audit logs as CSV">
              <Download className="h-3.5 w-3.5"/> Export
            </button>
            <button type="button" onClick={fetchAuditLogs} disabled={loading} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Target Employee</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Audit Details / Payload</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (<tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400"/>
                    <p className="text-xs font-semibold">Streaming real employee operation audit records...</p>
                  </td>
                </tr>) : filteredLogs.length > 0 ? (filteredLogs.map(log => (<tr key={log.id || log.created_at} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">
                        {log.employee_name || `Employee #${log.record_id || log.entity_id || 'N/A'}`}
                      </div>
                      {log.employee_number && (<div className="text-[10px] text-indigo-400 font-mono mt-0.5">{log.employee_number}</div>)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"/>
                        <span>{log.actor_name || log.performed_by_name || 'System Admin'}</span>
                      </div>
                      {log.actor_id && (<span className="text-[10px] text-slate-500 font-mono ml-3">ID #{log.actor_id}</span>)}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      {renderDetailsSummary(log)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button type="button" onClick={() => setSelectedLog(log)} className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors" title="Inspect full operation details">
                        <Eye className="w-3.5 h-3.5"/>
                      </button>
                    </td>
                  </tr>))) : (<tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <ShieldCheck className="h-8 w-8 text-slate-600 mx-auto mb-2"/>
                    <p className="text-xs font-bold text-slate-300">No audit records found matching criteria.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Operations performed on employees (onboarding, edits, host toggles, deletions) will appear here live.
                    </p>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operation Details Modal */}
      {selectedLog && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <Info className="w-5 h-5"/>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Operation Audit Telemetry
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Log Entry #{selectedLog.id} • {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedLog(null)} className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500">Operation</span>
                <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500">Target Employee</span>
                <p className="text-white font-bold mt-1">
                  {selectedLog.employee_name || `Employee #${selectedLog.record_id || selectedLog.entity_id}`}
                </p>
                {selectedLog.employee_number && (<p className="text-indigo-400 font-mono text-[10px]">{selectedLog.employee_number}</p>)}
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500">Executed By</span>
                <p className="text-white font-semibold mt-1">
                  {selectedLog.actor_name || selectedLog.performed_by_name || 'System Admin'}
                </p>
                {selectedLog.actor_id && (<p className="text-slate-500 font-mono text-[10px]">Actor User ID: #{selectedLog.actor_id}</p>)}
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500">Module & Table</span>
                <p className="text-indigo-300 font-mono text-xs mt-1">
                  {selectedLog.module || 'EMPLOYEE_MANAGEMENT'} • {selectedLog.table_name || selectedLog.entity || 'employees'}
                </p>
              </div>
            </div>

            {/* Payload Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Operation Mutation Payload / Parameters
                </span>
                <button type="button" onClick={() => handleCopyDetails(selectedLog.metadata_json || selectedLog.new_values || selectedLog.details)} className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] font-bold flex items-center gap-1 border border-slate-800 transition-colors">
                  {copied ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-400 max-h-56 overflow-auto">
                {JSON.stringify(selectedLog.metadata_json || selectedLog.new_values || selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="text-right pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all">
                Close Inspector
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
