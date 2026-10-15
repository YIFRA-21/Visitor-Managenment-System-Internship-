import React, { useState } from 'react';
import { Cpu, Plus, CheckCircle2, Play, Pause, Trash2 } from 'lucide-react';
export default function BusinessRulesEngine() {
    const [toast, setToast] = useState('');
    const [rules, setRules] = useState([
        { id: 1, name: 'VIP Escort Mandatory Rule', category: 'Visitor', condition: 'visitor.category === "VIP"', action: 'Require Host Escort', active: true },
        { id: 2, name: 'Overstay Auto Alert Rule', category: 'Check-Out', condition: 'visit.duration_hours > 8', action: 'Send Security Alert', active: true },
        { id: 3, name: 'Contractor Safety Induction Check', category: 'Compliance', condition: 'visitor.type === "Contractor"', action: 'Verify Safety Induction Doc', active: true },
        { id: 4, name: 'High-Capacity Meeting Room Approval', category: 'Appointment', condition: 'room.capacity > 20', action: 'Require Manager Approval', active: false }
    ]);
    const [newRuleName, setNewRuleName] = useState('');
    const [newCategory, setNewCategory] = useState('Visitor');
    const [newCondition, setNewCondition] = useState('');
    const [newAction, setNewAction] = useState('');
    const toggleRule = (id) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
        setToast('Rule status updated.');
        setTimeout(() => setToast(''), 2500);
    };
    const deleteRule = (id) => {
        setRules(prev => prev.filter(r => r.id !== id));
    };
    const handleAddRule = (e) => {
        e.preventDefault();
        if (!newRuleName || !newCondition || !newAction)
            return;
        const rule = {
            id: Date.now(),
            name: newRuleName,
            category: newCategory,
            condition: newCondition,
            action: newAction,
            active: true
        };
        setRules(prev => [rule, ...prev]);
        setNewRuleName('');
        setNewCondition('');
        setNewAction('');
        setToast('New business rule created successfully.');
        setTimeout(() => setToast(''), 3000);
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Cpu className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Business Rules Engine</h1>
            <p className="text-xs text-slate-400">Define dynamic logic rules for registration, approvals, check-in, and escalations without code changes</p>
          </div>
        </div>
      </div>

      {toast && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400"/> {toast}
        </div>)}

      {/* New Rule Creator */}
      <form onSubmit={handleAddRule} className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Plus className="h-4 w-4 text-purple-400"/> Create Business Rule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Rule Name</label>
            <input type="text" placeholder="e.g. VIP Host Escort Policy" value={newRuleName} onChange={e => setNewRuleName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white">
              <option value="Visitor">Visitor</option>
              <option value="Appointment">Appointment</option>
              <option value="Check-In">Check-In</option>
              <option value="Check-Out">Check-Out</option>
              <option value="Compliance">Compliance</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Condition</label>
            <input type="text" placeholder="e.g. visitor.category === 'VIP'" value={newCondition} onChange={e => setNewCondition(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Action Result</label>
            <input type="text" placeholder="e.g. Require Host Escort" value={newAction} onChange={e => setNewAction(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/20">
            <Plus className="h-4 w-4"/> Add Rule
          </button>
        </div>
      </form>

      {/* Rules Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
            <tr>
              <th className="p-4">Status</th>
              <th className="p-4">Rule Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Condition</th>
              <th className="p-4">Action</th>
              <th className="p-4 text-right">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {rules.map(rule => (<tr key={rule.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${rule.active
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {rule.active ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </td>
                <td className="p-4 font-bold text-white">{rule.name}</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{rule.category}</span></td>
                <td className="p-4 font-mono text-purple-300">{rule.condition}</td>
                <td className="p-4 text-slate-200">{rule.action}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => toggleRule(rule.id)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition" title={rule.active ? 'Pause Rule' : 'Enable Rule'}>
                    {rule.active ? <Pause className="h-3.5 w-3.5"/> : <Play className="h-3.5 w-3.5 text-emerald-400"/>}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/40 rounded-lg transition" title="Delete Rule">
                    <Trash2 className="h-3.5 w-3.5"/>
                  </button>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
