import React from 'react';
import { ShieldAlert, Search, Plus, Eye, Trash2, AlertTriangle, UserX, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function VisitorWatchlist() {
    const { t, tStatus } = useLanguage();
    const [search, setSearch] = React.useState('');
    const [filterType, setFilterType] = React.useState('all');
    const watchlistEntries = [
        { id: 1, name: 'Robert Smith', idNumber: 'PP-987654', reason: 'Previous security incident', severity: 'high', addedBy: 'Admin Officer', addedOn: '2025-03-15', status: 'Active', photo: null },
        { id: 2, name: 'Jane Williams', idNumber: 'NID-456789', reason: 'Suspicious behavior reported', severity: 'medium', addedBy: 'Security Guard', addedOn: '2025-04-20', status: 'Active', photo: null },
        { id: 3, name: 'Mark Thompson', idNumber: 'DL-112233', reason: 'Blacklisted by management', severity: 'critical', addedBy: 'HR Manager', addedOn: '2025-01-10', status: 'Active', photo: null },
        { id: 4, name: 'Lisa Chen', idNumber: 'PP-334455', reason: 'Unauthorized access attempt', severity: 'high', addedBy: 'IT Security', addedOn: '2025-05-01', status: 'Resolved', photo: null },
    ];
    const getSeverityBadge = (severity) => {
        const map = {
            critical: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
            high: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
            medium: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
            low: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
        return map[severity] || map.low;
    };
    const filtered = watchlistEntries.filter(e => {
        if (filterType !== 'all' && e.severity !== filterType)
            return false;
        if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.idNumber.toLowerCase().includes(search.toLowerCase()))
            return false;
        return true;
    });
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400"/>
            Visitor Watchlist
          </h2>
          <p className="text-xs text-slate-400 mt-1">Monitor and manage flagged visitors</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all">
            <Plus className="w-4 h-4"/> Add to Watchlist
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
            { label: 'Total Entries', value: watchlistEntries.length, icon: ShieldAlert, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
            { label: 'Critical', value: watchlistEntries.filter(e => e.severity === 'critical').length, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
            { label: 'High Risk', value: watchlistEntries.filter(e => e.severity === 'high').length, icon: UserX, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Resolved', value: watchlistEntries.filter(e => e.status === 'Resolved').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((stat, i) => (<div key={i} className="p-3 bg-[#1e293b] border border-slate-700/40 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg border ${stat.bg}`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`}/>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-lg font-bold text-white">{stat.value}</div>
          </div>))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input type="text" placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#0f1729] border border-slate-700/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"/>
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-[#0f1729] border border-slate-700/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none">
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] border border-slate-700/40 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#162032] text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-semibold">{t('table.visitor', 'Visitor')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('table.identityNumber', 'ID Number')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('table.reason', 'Reason')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('table.riskLevel', 'Severity')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('table.actor', 'Added By')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('table.createdDate', 'Date Added')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('table.status', 'Status')}</th>
                <th className="px-4 py-3 text-center font-semibold">{t('table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map((entry) => (<tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-white">{entry.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{entry.idNumber}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">{entry.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSeverityBadge(entry.severity)}`}>
                      {entry.severity.charAt(0).toUpperCase() + entry.severity.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{entry.addedBy}</td>
                  <td className="px-4 py-3 text-slate-400">{entry.addedOn}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${entry.status === 'Active' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="p-1.5 bg-[#1a2744] hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 border border-slate-700/30 rounded-lg transition-all" title="View Details">
                        <Eye className="w-3.5 h-3.5"/>
                      </button>
                      <button className="p-1.5 bg-[#1a2744] hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 border border-slate-700/30 rounded-lg transition-all" title="Remove">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </td>
                </tr>))}
              {filtered.length === 0 && (<tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                    No watchlist entries found.
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
