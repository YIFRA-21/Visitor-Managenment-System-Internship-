import React, { useState, useEffect } from 'react';
import { Settings, Plus, Search, Copy, Trash2, Eye, Power, Shield, Clock, Zap, Layers, RefreshCw } from 'lucide-react';
import { ruleEngineApi } from '../../../../services/api';
export default function RuleManagementCenter() {
    const [activeTab, setActiveTab] = useState('rules');
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRule, setSelectedRule] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Form State for Create/Edit
    const [formData, setFormData] = useState({
        name: '', description: '', category: 'General', module: 'VISITOR',
        businessEvent: 'VISITOR_REGISTERED', triggerType: 'immediate', priority: 'medium'
    });
    useEffect(() => {
        setLoading(true);
        ruleEngineApi.getRules()
            .then(res => {
            if (res.data?.data && Array.isArray(res.data.data)) {
                setRules(res.data.data);
            }
            else if (Array.isArray(res.data)) {
                setRules(res.data);
            }
            else {
                setRules([]);
            }
        })
            .catch(() => {
            setRules([]);
        })
            .finally(() => setLoading(false));
    }, []);
    const handleToggleStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
        setRules(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus } : r));
        try {
            await ruleEngineApi.toggleStatus(id, nextStatus);
        }
        catch { }
    };
    const handleDeleteRule = async (id) => {
        setRules(prev => prev.filter(r => r.id !== id));
        try {
            await ruleEngineApi.deleteRule(id);
        }
        catch { }
    };
    const handleDuplicateRule = (rule) => {
        const dup = {
            ...rule,
            id: Date.now(),
            name: `${rule.name} (Copy)`,
            status: 'draft',
            created_at: new Date().toISOString()
        };
        setRules(prev => [dup, ...prev]);
    };
    const handleSaveRule = async (e) => {
        e.preventDefault();
        if (!formData.name.trim())
            return;
        if (selectedRule) {
            setRules(prev => prev.map(r => r.id === selectedRule.id ? { ...r, ...formData, module_name: formData.module, business_event: formData.businessEvent, trigger_type: formData.triggerType } : r));
        }
        else {
            const newR = {
                id: Date.now(),
                name: formData.name,
                description: formData.description,
                category: formData.category,
                module_name: formData.module,
                business_event: formData.businessEvent,
                trigger_type: formData.triggerType,
                priority: formData.priority,
                status: 'draft',
                created_by: 'Admin',
                created_at: new Date().toISOString()
            };
            setRules(prev => [newR, ...prev]);
        }
        setIsModalOpen(false);
    };
    const filteredRules = rules.filter(r => !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.business_event.toLowerCase().includes(searchQuery.toLowerCase()));
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl shadow-xl text-white">
            <Settings className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Notification Center</span>
              <span>/</span>
              <span className="text-indigo-400 font-bold">Rule Management (§5.2, §5.5, §5.12)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Rule Management & Trigger Engine</h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'rules', label: 'Rule Management', badge: rules.length },
            { id: 'triggers', label: 'Trigger Configurator' },
            { id: 'priority', label: 'Priority Matrix' }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-indigo-700' : 'bg-slate-800 text-indigo-400'}`}>
                  {t.badge}
                </span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Rule Management (§5.2) */}
      {activeTab === 'rules' && (<div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400"/>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search rules by name, category, or event..." className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white"/>
            </div>

            <button onClick={() => {
                setSelectedRule(null);
                setFormData({ name: '', description: '', category: 'General', module: 'VISITOR', businessEvent: 'VISITOR_REGISTERED', triggerType: 'immediate', priority: 'medium' });
                setIsModalOpen(true);
            }} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
              <Plus className="h-4 w-4"/>
              <span>Create Notification Rule</span>
            </button>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Active Notification Rules ({filteredRules.length})</h3>
            </div>

            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <tr>
                  <th className="p-3">Rule ID</th>
                  <th className="p-3">Rule Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Business Event</th>
                  <th className="p-3">Trigger Type</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredRules.length === 0 ? (<tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      {loading ? 'Loading notification rules from database...' : 'No notification rules found in the database.'}
                    </td>
                  </tr>) : (filteredRules.map(rule => (<tr key={rule.id} className="hover:bg-slate-850">
                    <td className="p-3 font-mono font-bold text-indigo-400">RUL-{rule.id}</td>
                    <td className="p-3 font-bold text-white">
                      <div>{rule.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{rule.description}</div>
                    </td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">{rule.category}</span></td>
                    <td className="p-3 font-mono text-[10px] text-purple-400">{rule.business_event}</td>
                    <td className="p-3 font-mono text-[10px] text-cyan-400 capitalize">{rule.trigger_type}</td>
                    <td className="p-3 font-bold uppercase text-[10px]">{rule.priority}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${rule.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                    rule.status === 'scheduled' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'}`}>
                        {rule.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1.5">
                        <button onClick={() => handleToggleStatus(rule.id, rule.status)} className={`p-1.5 rounded-lg text-xs font-bold ${rule.status === 'active' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`} title={rule.status === 'active' ? 'Disable Rule' : 'Enable Rule'}>
                          <Power className="h-3.5 w-3.5"/>
                        </button>
                        <button onClick={() => handleDuplicateRule(rule)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg" title="Duplicate Rule">
                          <Copy className="h-3.5 w-3.5"/>
                        </button>
                        <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg" title="Delete Rule">
                          <Trash2 className="h-3.5 w-3.5"/>
                        </button>
                      </div>
                    </td>
                  </tr>)))}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* TAB 2: Trigger Configurator (§5.5) */}
      {activeTab === 'triggers' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-3xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Zap className="h-4 w-4 text-amber-400"/>
            <span>Event Trigger Architecture Configurator</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
                { id: 'immediate', label: 'Immediate Trigger', desc: 'Fires instantly upon business event pub-sub emission', icon: Zap, status: 'Active' },
                { id: 'manual', label: 'Manual Trigger', desc: 'Dispatched manually by administrator or operator', icon: Eye, status: 'Active' },
                { id: 'scheduled', label: 'Scheduled Trigger', desc: 'Fires at a specified future date and time', icon: Clock, status: 'Active' },
                { id: 'recurring', label: 'Recurring Cron Trigger', desc: 'Fires periodically based on cron schedule', icon: RefreshCw, status: 'Active' },
                { id: 'api', label: 'API Trigger', desc: 'Triggered via external REST API request', icon: Shield, status: 'Ready' },
                { id: 'webhook', label: 'Webhook Receiver Trigger', desc: 'Triggered via incoming HTTP webhook payload', icon: Layers, status: 'Ready' },
                { id: 'queue', label: 'Async Queue Worker Trigger', desc: 'Picked up from message queue worker', icon: RefreshCw, status: 'Active' },
                { id: 'background', label: 'Background Job Trigger', desc: 'Processed via background system job daemon', icon: Settings, status: 'Active' }
            ].map(tr => (<div key={tr.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <tr.icon className="h-4 w-4 text-indigo-400"/>
                    <span className="text-xs font-bold text-white">{tr.label}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase">
                    {tr.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{tr.desc}</p>
              </div>))}
          </div>
        </div>)}

      {/* TAB 3: Priority Matrix (§5.12) */}
      {activeTab === 'priority' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Shield className="h-4 w-4 text-indigo-400"/>
            <span>Notification Priority Rules & Escalation Matrix</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
                { level: 'Critical', speed: '< 1 second', position: 'Top Priority Queue #1', escalation: 'Immediate Escalate to Admin', retries: '5 Retries (Exponential)', styling: 'Rose / Flash Alert' },
                { level: 'High', speed: '< 5 seconds', position: 'High Priority Queue #2', escalation: 'Escalate after 15 mins', retries: '3 Retries', styling: 'Amber / Urgent Badge' },
                { level: 'Medium', speed: '< 30 seconds', position: 'Standard Queue #3', escalation: 'Escalate after 1 hour', retries: '2 Retries', styling: 'Indigo / Standard Card' },
                { level: 'Low', speed: '< 5 minutes', position: 'Batch Queue #4', escalation: 'No Escalation', retries: '1 Retry', styling: 'Slate / Quiet Notice' },
                { level: 'Informational', speed: 'Async Batch', position: 'Background Queue #5', escalation: 'No Escalation', retries: '0 Retries', styling: 'Cyan / Digest Item' }
            ].map((p, i) => (<div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-black uppercase text-indigo-400 block">{p.level}</span>
                <div className="space-y-1 text-[10px] text-slate-300">
                  <div><strong className="text-slate-400">Speed:</strong> {p.speed}</div>
                  <div><strong className="text-slate-400">Queue:</strong> {p.position}</div>
                  <div><strong className="text-slate-400">Escalation:</strong> {p.escalation}</div>
                  <div><strong className="text-slate-400">Retries:</strong> {p.retries}</div>
                  <div><strong className="text-slate-400">Styling:</strong> {p.styling}</div>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* Create / Edit Rule Modal */}
      {isModalOpen && (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {selectedRule ? 'Edit Notification Rule' : 'Create Notification Rule'}
            </h3>

            <form onSubmit={handleSaveRule} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rule Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Visitor Check-In Alert" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"/>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of this rule..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                    <option value="General">General</option>
                    <option value="Security">Security</option>
                    <option value="Check-In">Check-In</option>
                    <option value="Approval Workflow">Approval Workflow</option>
                    <option value="Reports">Reports</option>
                    <option value="Employee">Employee</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
