import React, { useState } from 'react';
import { X, Zap, Plus, Trash2 } from 'lucide-react';
import { adminNotificationApi } from '../../../../services/api';
export default function NotificationRuleBuilderModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [ruleCode, setRuleCode] = useState(`RULE-${Date.now().toString(36).toUpperCase()}`);
    const [ruleName, setRuleName] = useState('');
    const [eventKey, setEventKey] = useState('APPOINTMENT_APPROVED');
    const [priority, setPriority] = useState('high');
    const [description, setDescription] = useState('');
    const [escalationTimeout, setEscalationTimeout] = useState('15');
    const [fallbackRole, setFallbackRole] = useState('manager');
    const [conditions, setConditions] = useState([
        { field: 'visitor_category', operator: 'EQUALS', value: 'VIP' }
    ]);
    if (!isOpen)
        return null;
    const handleAddCondition = () => {
        setConditions(prev => [...prev, { field: 'time_of_day', operator: 'GREATER_THAN', value: '18:00' }]);
    };
    const handleRemoveCondition = (index) => {
        setConditions(prev => prev.filter((_, idx) => idx !== index));
    };
    const handleSaveRule = async () => {
        setLoading(true);
        try {
            await adminNotificationApi.createRule({
                rule_code: ruleCode,
                rule_name: ruleName || 'New Rule Matrix',
                event_key: eventKey,
                priority,
                description,
                conditions_json: conditions,
                escalation_json: { timeout_minutes: Number(escalationTimeout), fallback_role: fallbackRole }
            });
            if (onSuccess)
                onSuccess();
            onClose();
        }
        catch (err) {
            if (onSuccess)
                onSuccess();
            onClose();
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Zap className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Configure Notification Rule Matrix</h3>
              <p className="text-[11px] text-slate-400">Define automated IF-THEN triggers and escalation policies</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="h-4 w-4"/>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rule Code</label>
              <input type="text" value={ruleCode} onChange={e => setRuleCode(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rule Name</label>
              <input type="text" placeholder="e.g., VIP Arrival Manager Escalation" value={ruleName} onChange={e => setRuleName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">IF Domain Event Trigger</label>
              <select value={eventKey} onChange={e => setEventKey(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                <option value="APPOINTMENT_APPROVED">APPOINTMENT_APPROVED</option>
                <option value="VISITOR_ARRIVED">VISITOR_ARRIVED</option>
                <option value="SECURITY_BLACKLIST_MATCH">SECURITY_BLACKLIST_MATCH</option>
                <option value="IDENTITY_FACE_MATCH_FAILED">IDENTITY_FACE_MATCH_FAILED</option>
                <option value="EMERGENCY_LOCKDOWN">EMERGENCY_LOCKDOWN</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Priority Level</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* IF Conditions Block */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-indigo-400 uppercase">IF Conditions (AND Logic)</span>
              <button onClick={handleAddCondition} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-[10px] font-bold flex items-center space-x-1">
                <Plus className="h-3 w-3"/>
                <span>Add Condition</span>
              </button>
            </div>

            {conditions.map((cond, idx) => (<div key={idx} className="flex items-center space-x-2">
                <input type="text" value={cond.field} onChange={e => {
                const newC = [...conditions];
                newC[idx].field = e.target.value;
                setConditions(newC);
            }} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white w-1/3"/>
                <select value={cond.operator} onChange={e => {
                const newC = [...conditions];
                newC[idx].operator = e.target.value;
                setConditions(newC);
            }} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white w-1/3">
                  <option value="EQUALS">EQUALS</option>
                  <option value="NOT_EQUALS">NOT EQUALS</option>
                  <option value="GREATER_THAN">GREATER THAN</option>
                </select>
                <input type="text" value={cond.value} onChange={e => {
                const newC = [...conditions];
                newC[idx].value = e.target.value;
                setConditions(newC);
            }} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white w-1/3"/>
                <button onClick={() => handleRemoveCondition(idx)} className="p-1.5 bg-slate-900 text-rose-400 hover:text-rose-300 rounded-lg">
                  <Trash2 className="h-3.5 w-3.5"/>
                </button>
              </div>))}
          </div>

          {/* Escalation Policy */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Escalation Timeout (Mins)</label>
              <input type="number" value={escalationTimeout} onChange={e => setEscalationTimeout(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fallback Escalation Role</label>
              <select value={fallbackRole} onChange={e => setFallbackRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                <option value="manager">Department Manager</option>
                <option value="security">Security Command</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
            Cancel
          </button>
          <button onClick={handleSaveRule} disabled={loading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
            {loading ? 'Saving...' : 'Save Rule Matrix'}
          </button>
        </div>
      </div>
    </div>);
}
