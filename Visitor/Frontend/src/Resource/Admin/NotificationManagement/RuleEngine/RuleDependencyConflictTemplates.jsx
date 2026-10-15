import React, { useState, useEffect } from 'react';
import { Layers, AlertTriangle, Sparkles } from 'lucide-react';
import { workflowRulesApi } from '../../../../services/api';
export default function RuleDependencyConflictTemplates() {
    const [activeTab, setActiveTab] = useState('dependencies');
    const [dependencies, setDependencies] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [templates, setTemplates] = useState([]);
    useEffect(() => {
        workflowRulesApi.getDependencies().then(res => { if (res.data?.data && Array.isArray(res.data.data))
            setDependencies(res.data.data); }).catch(() => { });
        workflowRulesApi.getConflicts().then(res => { if (res.data?.data && Array.isArray(res.data.data))
            setConflicts(res.data.data); }).catch(() => { });
        workflowRulesApi.getTemplates().then(res => { if (res.data?.data && Array.isArray(res.data.data))
            setTemplates(res.data.data); }).catch(() => { });
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 via-indigo-600 to-pink-500 rounded-2xl shadow-xl text-white">
            <Layers className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span><span>/</span>
              <span className="text-purple-400 font-bold">Dependencies, Conflicts & Templates (§5.42, §5.43, §5.45, §5.46)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Dependencies, Conflict Detection & Templates</h1>
          </div>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
          {[
            { id: 'dependencies', label: 'Dependencies (§5.42)', badge: dependencies.length },
            { id: 'conflicts', label: 'Conflicts (§5.43)', badge: conflicts.length },
            { id: 'templates', label: 'Templates (§5.45)', badge: templates.length },
            { id: 'ai', label: 'AI Readiness (§5.46)' }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-purple-700' : 'bg-slate-800 text-purple-400'}`}>{t.badge}</span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Dependencies (§5.42) */}
      {activeTab === 'dependencies' && (<div className="space-y-4 max-w-3xl">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Rule Dependency Graph (Circular Detection Enabled)</h3>
            {dependencies.map((dep, i) => (<div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-purple-400">Parent Rule: {dep.parentRule}</div>
                <div className="text-slate-300">Child Rules: <span className="text-indigo-300 font-mono">{dep.childRules.join(', ')}</span></div>
                <div className="text-slate-400">Linked Events: <span className="text-cyan-400 font-mono">{dep.linkedEvents.join(', ')}</span></div>
              </div>))}
          </div>
        </div>)}

      {/* TAB 2: Conflict Detection (§5.43) */}
      {activeTab === 'conflicts' && (<div className="space-y-4 max-w-3xl">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400"/><span>Conflict Detection Center</span>
            </h3>
            {conflicts.map(c => (<div key={c.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400">{c.id} • {c.type}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${c.severity === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>{c.severity}</span>
                </div>
                <div className="text-slate-300">Conflict between <strong className="text-white">{c.ruleA}</strong> and <strong className="text-white">{c.ruleB}</strong></div>
                <div className="text-emerald-400 text-[11px]">Recommendation: {c.recommendation}</div>
              </div>))}
          </div>
        </div>)}

      {/* TAB 3: Templates (§5.45) */}
      {activeTab === 'templates' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(tpl => (<div key={tpl.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{tpl.name}</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[9px] font-black uppercase">{tpl.category}</span>
              </div>
              <p className="text-[10px] text-slate-400">{tpl.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex space-x-1">
                  {tpl.channels.map((ch) => (<span key={ch} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-mono font-bold uppercase">{ch}</span>))}
                </div>
                <button className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold">Use Template</button>
              </div>
            </div>))}
        </div>)}

      {/* TAB 4: AI Readiness (§5.46) */}
      {activeTab === 'ai' && (<div className="bg-slate-900/90 border border-purple-500/30 p-6 rounded-2xl space-y-4 max-w-2xl">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-purple-400"/><span>AI Rule Recommendation Engine (Future-Ready Architecture)</span>
          </h3>
          <p className="text-xs text-slate-300">
            The architecture is prepared for AI-driven rule optimization, automatic duplicate detection, unused rule cleanup, and intelligent condition/recipient/channel suggestions.
          </p>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Future Capabilities</span>
            <div className="grid grid-cols-2 gap-2 text-indigo-300 font-mono text-[11px]">
              <div>• Rule Optimization</div>
              <div>• Duplicate Detection</div>
              <div>• Unused Rule Sweeper</div>
              <div>• Suggested Conditions</div>
              <div>• Channel Recommendation</div>
              <div>• Smart Priority Matrix</div>
            </div>
          </div>
        </div>)}
    </div>);
}
