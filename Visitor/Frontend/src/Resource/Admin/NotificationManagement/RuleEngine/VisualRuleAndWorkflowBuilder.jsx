import React, { useState } from 'react';
import { Plus, Trash2, Play, GitCommit, ArrowRight, Bell, Mail, Smartphone, Clipboard, Check, X, Lock } from 'lucide-react';
const OPERATORS = [
    { id: 'eq', label: 'Equals (==)' },
    { id: 'neq', label: 'Not Equals (!=)' },
    { id: 'gt', label: 'Greater Than (>)' },
    { id: 'lt', label: 'Less Than (<)' },
    { id: 'contains', label: 'Contains' },
    { id: 'startsWith', label: 'Starts With' },
    { id: 'endsWith', label: 'Ends With' },
    { id: 'between', label: 'Between' },
    { id: 'isEmpty', label: 'Is Empty' },
    { id: 'isNotEmpty', label: 'Is Not Empty' }
];
const AVAILABLE_ACTIONS = [
    { id: 'send_in_app', label: 'Send In-App Notification', icon: Bell },
    { id: 'send_email', label: 'Send Email', icon: Mail },
    { id: 'send_sms', label: 'Send SMS', icon: Smartphone },
    { id: 'create_audit_log', label: 'Create Audit Log', icon: Clipboard },
    { id: 'escalate', label: 'Escalate Approval', icon: ArrowRight },
    { id: 'approve', label: 'Auto Approve', icon: Check },
    { id: 'reject', label: 'Auto Reject', icon: X },
    { id: 'lock_account', label: 'Lock Account', icon: Lock }
];
export default function VisualRuleAndWorkflowBuilder() {
    const [activeTab, setActiveTab] = useState('workflow');
    // Condition Builder State (§5.8)
    const [conditions, setConditions] = useState([
        { field: 'visitor.vip_status', operator: 'eq', value: 'true', logic: 'AND' },
        { field: 'appointment.status', operator: 'eq', value: 'APPROVED', logic: 'AND' }
    ]);
    // Action Builder State (§5.9)
    const [selectedActions, setSelectedActions] = useState(['send_in_app', 'send_email']);
    const addCondition = () => {
        setConditions(prev => [...prev, { field: 'visitor.department_id', operator: 'eq', value: '1', logic: 'AND' }]);
    };
    const removeCondition = (idx) => {
        setConditions(prev => prev.filter((_, i) => i !== idx));
    };
    const toggleAction = (actId) => {
        setSelectedActions(prev => prev.includes(actId) ? prev.filter(a => a !== actId) : [...prev, actId]);
    };
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 rounded-2xl shadow-xl text-white">
            <GitCommit className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span>
              <span>/</span>
              <span className="text-purple-400 font-bold">Visual Designer (§5.6–§5.9)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Workflow & Rule Builder Studio</h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'workflow', label: 'Workflow Canvas' },
            { id: 'builder', label: 'Rule Summary' },
            { id: 'conditions', label: 'Condition Builder', badge: conditions.length },
            { id: 'actions', label: 'Action Builder', badge: selectedActions.length }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-purple-700' : 'bg-slate-800 text-purple-400'}`}>
                  {t.badge}
                </span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Workflow Canvas (§5.6) */}
      {activeTab === 'workflow' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
              <Play className="h-4 w-4 text-emerald-400"/>
              <span>Workflow Automation Visual Canvas Foundation</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Visual Node Pipeline</span>
          </div>

          {/* Pipeline Visual Representation */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-6 bg-slate-950 border border-slate-800 rounded-3xl overflow-x-auto">
            {[
                { title: 'Start', desc: 'Trigger Initiated', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                { title: 'Business Event', desc: 'CHECKIN_COMPLETED', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
                { title: 'Decision', desc: 'Is VIP Visitor?', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                { title: 'Delay', desc: 'Wait 30s', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
                { title: 'Action', desc: 'Send In-App & Email', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
                { title: 'End', desc: 'Execution Done', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
            ].map((node, i, arr) => (<React.Fragment key={i}>
                <div className={`p-4 rounded-2xl border ${node.color} min-w-[140px] text-center space-y-1 shadow-lg`}>
                  <div className="text-xs font-black uppercase">{node.title}</div>
                  <div className="text-[10px] text-slate-300 font-mono">{node.desc}</div>
                </div>
                {i < arr.length - 1 && (<ArrowRight className="h-5 w-5 text-slate-600 shrink-0 hidden md:block"/>)}
              </React.Fragment>))}
          </div>
        </div>)}

      {/* TAB 2: Rule Summary Preview (§5.7) */}
      {activeTab === 'builder' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-2xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Visual Rule Summary Preview</h3>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Trigger Event</span>
              <p className="text-indigo-400 font-mono font-bold mt-0.5">CHECKIN_COMPLETED</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Evaluation Conditions ({conditions.length})</span>
              <div className="space-y-1 mt-1 font-mono text-[11px] text-amber-300">
                {conditions.map((c, i) => (<div key={i}>• {c.field} {c.operator} "{c.value}"</div>))}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Configured Actions ({selectedActions.length})</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedActions.map(a => (<span key={a} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                    {a}
                  </span>))}
              </div>
            </div>
          </div>
        </div>)}

      {/* TAB 3: Condition Builder (§5.8) */}
      {activeTab === 'conditions' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Nested Condition Builder (10+ Operators)</h3>
            <button onClick={addCondition} className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
              <Plus className="h-3.5 w-3.5"/>
              <span>Add Condition Group</span>
            </button>
          </div>

          <div className="space-y-2">
            {conditions.map((c, idx) => (<div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                <select value={c.logic} onChange={e => {
                    const next = [...conditions];
                    next[idx].logic = e.target.value;
                    setConditions(next);
                }} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-indigo-400 font-bold">
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>

                <input type="text" value={c.field} onChange={e => {
                    const next = [...conditions];
                    next[idx].field = e.target.value;
                    setConditions(next);
                }} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white flex-1 font-mono" placeholder="Entity Field..."/>

                <select value={c.operator} onChange={e => {
                    const next = [...conditions];
                    next[idx].operator = e.target.value;
                    setConditions(next);
                }} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white font-bold">
                  {OPERATORS.map(op => (<option key={op.id} value={op.id}>{op.label}</option>))}
                </select>

                <input type="text" value={c.value} onChange={e => {
                    const next = [...conditions];
                    next[idx].value = e.target.value;
                    setConditions(next);
                }} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white flex-1 font-mono" placeholder="Value..."/>

                <button onClick={() => removeCondition(idx)} className="p-1 text-rose-400 hover:text-rose-300">
                  <Trash2 className="h-4 w-4"/>
                </button>
              </div>))}
          </div>
        </div>)}

      {/* TAB 4: Action Builder (§5.9) */}
      {activeTab === 'actions' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-3xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Action Builder Configurator (14 Enterprise Actions)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AVAILABLE_ACTIONS.map(act => {
                const isSelected = selectedActions.includes(act.id);
                const Icon = act.icon;
                return (<div key={act.id} onClick={() => toggleAction(act.id)} className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isSelected
                        ? 'bg-purple-600/20 border-purple-500/50 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`}/>
                    <span className="text-xs font-bold text-white">{act.label}</span>
                  </div>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    <Check className="h-3 w-3"/>
                  </div>
                </div>);
            })}
          </div>
        </div>)}
    </div>);
}
