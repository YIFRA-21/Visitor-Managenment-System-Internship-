import React, { useState, useEffect } from 'react';
import { GitBranch, Upload, Download, RotateCcw, Copy, FileJson } from 'lucide-react';
import { workflowRulesApi } from '../../../../services/api';
export default function RuleVersionAndImportExport() {
    const [activeTab, setActiveTab] = useState('versions');
    const [versions, setVersions] = useState([]);
    const [auditHistory, setAuditHistory] = useState([]);
    useEffect(() => {
        workflowRulesApi.getVersions().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setVersions(res.data.data);
        }).catch(() => { });
        workflowRulesApi.getAuditHistory().then(res => {
            if (res.data?.data && Array.isArray(res.data.data))
                setAuditHistory(res.data.data);
        }).catch(() => { });
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-xl text-white">
            <GitBranch className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span><span>/</span>
              <span className="text-violet-400 font-bold">Version & Import/Export (§5.37–§5.39)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Version Management, Import/Export & Audit</h1>
          </div>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'versions', label: 'Version Timeline (§5.37)', badge: versions.length },
            { id: 'import', label: 'Import / Export (§5.38)' },
            { id: 'audit', label: 'Audit History (§5.39)', badge: auditHistory.length }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-violet-700' : 'bg-slate-800 text-violet-400'}`}>{t.badge}</span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Version Timeline (§5.37) */}
      {activeTab === 'versions' && (<div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Rule Engine Version Timeline</h3>
            <button className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold">+ Create Draft Version</button>
          </div>
          <div className="divide-y divide-slate-800">
            {versions.map((v, i) => (<div key={i} className="p-4 flex items-center justify-between hover:bg-slate-850">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-violet-600/20 border border-violet-500/30 rounded-full flex items-center justify-center">
                    <GitBranch className="h-4 w-4 text-violet-400"/>
                  </div>
                  <div>
                    <span className="text-sm font-black text-white font-mono">v{v.version}</span>
                    <span className="text-[10px] text-slate-500 block">By {v.author} • {new Date(v.created_at).toLocaleDateString()}</span>
                    <span className="text-[10px] text-slate-400">{v.changes}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${v.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>{v.status}</span>
                  <button className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg" title="Rollback"><RotateCcw className="h-3.5 w-3.5"/></button>
                  <button className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg" title="Clone"><Copy className="h-3.5 w-3.5"/></button>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* TAB 2: Import / Export (§5.38) */}
      {activeTab === 'import' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
              <Upload className="h-4 w-4 text-emerald-400"/><span>Import Rules</span>
            </h3>
            <div className="space-y-2">
              {['JSON', 'YAML', 'ZIP'].map(fmt => (<button key={fmt} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white hover:border-emerald-500/50 flex items-center space-x-2">
                  <FileJson className="h-4 w-4 text-emerald-400"/><span>Import from {fmt}</span>
                </button>))}
            </div>
            <p className="text-[10px] text-slate-500">Files are validated, previewed, and checked for duplicates before import.</p>
          </div>
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
              <Download className="h-4 w-4 text-cyan-400"/><span>Export Rules</span>
            </h3>
            <div className="space-y-2">
              {['JSON', 'YAML', 'ZIP'].map(fmt => (<button key={fmt} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white hover:border-cyan-500/50 flex items-center space-x-2">
                  <Download className="h-4 w-4 text-cyan-400"/><span>Export as {fmt}</span>
                </button>))}
            </div>
            <p className="text-[10px] text-slate-500">Export all 48 active rules for backup or migration.</p>
          </div>
        </div>)}

      {/* TAB 3: Audit History (§5.39) */}
      {activeTab === 'audit' && (<div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Full Audit Trail (User, Action, Date, IP, Device)</h3>
          </div>
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
              <tr>
                <th className="p-3">User</th><th className="p-3">Action</th><th className="p-3">Rule / Detail</th>
                <th className="p-3">Date</th><th className="p-3">Time</th><th className="p-3">IP Address</th>
                <th className="p-3">Browser</th><th className="p-3">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {auditHistory.map(a => (<tr key={a.id} className="hover:bg-slate-850">
                  <td className="p-3 font-bold text-white">{a.user}</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded text-[9px] font-black uppercase">{a.action}</span></td>
                  <td className="p-3 text-slate-400">{a.rule}</td>
                  <td className="p-3 font-mono text-[10px]">{a.date}</td>
                  <td className="p-3 font-mono text-[10px]">{a.time}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-500">{a.ip}</td>
                  <td className="p-3 text-[10px]">{a.browser}</td>
                  <td className="p-3 text-[10px]">{a.device}</td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
    </div>);
}
