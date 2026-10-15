// Frontend/src/Resource/Manager/DepartmentAuditLogsView.tsx
import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DepartmentAuditLogsView() {
    const { t } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await managerApi.getAuditLogs({ limit: 100 });
            setLogs(data);
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch audit records');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchLogs();
    }, []);
    const filteredLogs = logs.filter((log) => (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
        (log.actor_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (log.entity || '').toLowerCase().includes(search.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(search.toLowerCase()));
    return (<div className="p-6 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Department Audit History
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400">
                Security Compliance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable ledger of host reassignments, approvals, and access events.
            </p>
          </div>
        </div>

        <button onClick={fetchLogs} disabled={loading} className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search action, actor, entity, details..." className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
        </div>

        <span className="text-xs text-slate-400">
          Showing <strong className="text-white">{filteredLogs.length}</strong> events
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (<div className="py-20 text-center text-slate-400 text-xs animate-pulse">
            Querying department compliance audit trail...
          </div>) : filteredLogs.length === 0 ? (<div className="py-16 text-center text-slate-500 text-xs italic">
            No audit records found matching your query.
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">{t('table.action', 'Action & Module')}</th>
                  <th className="py-3.5 px-4">{t('table.actor', 'Actor')}</th>
                  <th className="py-3.5 px-4">{t('table.details', 'Entity & Record')}</th>
                  <th className="py-3.5 px-4">{t('table.description', 'Event Details')}</th>
                  <th className="py-3.5 px-4 text-right">{t('table.timestamp', 'Timestamp')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (<tr key={log.id || log.created_at} className="hover:bg-slate-850/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          {log.action}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{log.module}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{log.actor_name || 'System / Manager'}</p>
                      <p className="text-[10px] text-slate-400">{log.actor_role || 'Staff'}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-300">{log.entity}</span>
                      {log.record_id && (<span className="text-[10px] text-slate-500 ml-1">#{log.record_id}</span>)}
                    </td>

                    <td className="py-3.5 px-4 max-w-sm text-slate-300">
                      {log.details || (log.new_values ? JSON.stringify(log.new_values) : 'Action executed')}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-400">
                      <p className="font-medium text-slate-300">
                        {new Date(log.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                })}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>);
}
