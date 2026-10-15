import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
export default function WorkflowFormModal({ workflow, onClose, onSave }) {
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        workflow_name: '',
        workflow_code: '',
        description: '',
        workflow_type: 'Standard',
        category_id: '',
        department_id: '',
        branch_id: 1,
        priority: 1,
        approval_mode: 'Sequential',
        status: 'Active',
        levels: [
            { level_order: 1, level_name: 'Reception Verification', approver_role: 'Receptionist', timeout_minutes: 30, sla_minutes: 60, escalation_target: 'Host', comments_required: false, attachment_required: false },
            { level_order: 2, level_name: 'Host Approval', approver_role: 'Host', timeout_minutes: 60, sla_minutes: 120, escalation_target: 'Department Manager', comments_required: false, attachment_required: false }
        ],
        rules: [
            { rule_name: 'Contractor Security Rule', field_name: 'visitor_category', operator: '=', field_value: 'Contractor', priority: 1 }
        ]
    });
    useEffect(() => {
        if (workflow) {
            setFormData({
                ...workflow,
                category_id: workflow.category_id || '',
                department_id: workflow.department_id || '',
                levels: workflow.levels?.length ? workflow.levels : [
                    { level_order: 1, level_name: 'Reception Verification', approver_role: 'Receptionist', timeout_minutes: 30, sla_minutes: 60, escalation_target: 'Host' }
                ],
                rules: workflow.rules?.length ? workflow.rules : []
            });
        }
        else {
            setFormData((prev) => ({
                ...prev,
                workflow_code: `WF-${Date.now().toString().slice(-6)}`
            }));
        }
    }, [workflow]);
    // Level Management
    const addLevelRow = () => {
        const nextOrder = (formData.levels || []).length + 1;
        setFormData((prev) => ({
            ...prev,
            levels: [
                ...(prev.levels || []),
                {
                    level_order: nextOrder,
                    level_name: `Approval Level ${nextOrder}`,
                    approver_role: 'Department Manager',
                    timeout_minutes: 60,
                    sla_minutes: 120,
                    escalation_target: 'Admin',
                    comments_required: false,
                    attachment_required: false
                }
            ]
        }));
    };
    const removeLevelRow = (index) => {
        setFormData((prev) => ({
            ...prev,
            levels: (prev.levels || []).filter((_, i) => i !== index).map((l, i) => ({ ...l, level_order: i + 1 }))
        }));
    };
    // Rule Management
    const addRuleRow = () => {
        setFormData((prev) => ({
            ...prev,
            rules: [
                ...(prev.rules || []),
                {
                    rule_name: 'Custom Routing Rule',
                    field_name: 'visitor_category',
                    operator: '=',
                    field_value: 'Contractor',
                    priority: (prev.rules || []).length + 1
                }
            ]
        }));
    };
    const removeRuleRow = (index) => {
        setFormData((prev) => ({
            ...prev,
            rules: (prev.rules || []).filter((_, i) => i !== index)
        }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.85)', zIndex: 1050 }} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">

          {/* Modal Header */}
          <div className="modal-header border-bottom border-slate-200 dark:border-slate-800 px-4 py-3">
            <h5 className="modal-title text-base font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary"/>
              {workflow ? 'Edit Workflow Configuration' : 'Create New Approval Workflow'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}/>
          </div>

          {/* Tab Navigation */}
          <div className="bg-slate-900 border-bottom border-slate-800 px-4 py-2 d-flex gap-2">
            {[
            { key: 'basic', label: '1. Basic Configuration' },
            { key: 'levels', label: `2. Approval Levels (${formData.levels?.length || 0})` },
            { key: 'rules', label: `3. Conditional Rules (${formData.rules?.length || 0})` },
            { key: 'sla', label: '4. SLA & Escalation' }
        ].map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`btn btn-sm text-xs font-bold px-3 py-1.5 ${activeTab === tab.key ? 'btn-primary' : 'btn-outline-secondary'}`}>
                {tab.label}
              </button>))}
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 max-h-[520px] overflow-y-auto">

              {/* TAB 1: BASIC CONFIGURATION */}
              {activeTab === 'basic' && (<div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Workflow Name <span className="text-danger">*</span>
                    </label>
                    <input type="text" required className="form-control text-xs font-semibold" placeholder="e.g. Contractor Security Approval" value={formData.workflow_name} onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Workflow Code <span className="text-danger">*</span>
                    </label>
                    <input type="text" required className="form-control text-xs font-semibold" placeholder="e.g. WF-CONT-01" value={formData.workflow_code} onChange={(e) => setFormData({ ...formData, workflow_code: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>

                  <div className="col-12">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Description</label>
                    <textarea rows={2} className="form-control text-xs font-semibold" placeholder="Describe the scope and purpose of this approval workflow..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>

                  <div className="col-12 col-sm-6 col-md-4">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Workflow Type</label>
                    <select className="form-select text-xs font-semibold" value={formData.workflow_type} onChange={(e) => setFormData({ ...formData, workflow_type: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                      <option value="Standard">Standard</option>
                      <option value="Security">Security</option>
                      <option value="Executive">Executive</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Express">Express</option>
                    </select>
                  </div>

                  <div className="col-12 col-sm-6 col-md-4">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Approval Mode</label>
                    <select className="form-select text-xs font-semibold" value={formData.approval_mode} onChange={(e) => setFormData({ ...formData, approval_mode: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                      <option value="Sequential">Sequential (Level by Level)</option>
                      <option value="Parallel">Parallel (Simultaneous)</option>
                      <option value="Conditional">Conditional Routing</option>
                      <option value="Automatic">Automatic Approval</option>
                    </select>
                  </div>

                  <div className="col-12 col-sm-6 col-md-4">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Priority Order</label>
                    <input type="number" min={1} className="form-control text-xs font-semibold" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>
                </div>)}

              {/* TAB 2: APPROVAL LEVELS */}
              {activeTab === 'levels' && (<div className="space-y-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-0">Configure Multi-Tier Approval Chain</h6>
                    <button type="button" onClick={addLevelRow} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 text-xs font-bold">
                      <Plus className="h-3.5 w-3.5"/> Add Level
                    </button>
                  </div>

                  {(formData.levels || []).map((lvl, idx) => (<div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                      <div className="d-flex justify-content-between align-items-center border-bottom border-slate-800 pb-2">
                        <span className="text-xs font-extrabold text-primary">Level {idx + 1}</span>
                        <button type="button" onClick={() => removeLevelRow(idx)} className="btn btn-sm btn-outline-danger p-1" disabled={formData.levels.length <= 1}>
                          <Trash2 className="h-3.5 w-3.5"/>
                        </button>
                      </div>

                      <div className="row g-3">
                        <div className="col-12 col-md-5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Level Name</label>
                          <input type="text" className="form-control text-xs font-semibold" value={lvl.level_name} onChange={(e) => {
                    const updated = [...formData.levels];
                    updated[idx].level_name = e.target.value;
                    setFormData({ ...formData, levels: updated });
                }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                        </div>

                        <div className="col-12 col-md-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Approver Role</label>
                          <select className="form-select text-xs font-semibold" value={lvl.approver_role} onChange={(e) => {
                    const updated = [...formData.levels];
                    updated[idx].approver_role = e.target.value;
                    setFormData({ ...formData, levels: updated });
                }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
                            <option value="Host">Host Employee</option>
                            <option value="Receptionist">Receptionist</option>
                            <option value="Department Manager">Department Manager</option>
                            <option value="Security Officer">Security Officer</option>
                            <option value="Executive Officer">Executive Officer</option>
                            <option value="Admin">System Administrator</option>
                          </select>
                        </div>

                        <div className="col-12 col-md-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Timeout (mins)</label>
                          <input type="number" className="form-control text-xs font-semibold" value={lvl.timeout_minutes} onChange={(e) => {
                    const updated = [...formData.levels];
                    updated[idx].timeout_minutes = Number(e.target.value);
                    setFormData({ ...formData, levels: updated });
                }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                        </div>
                      </div>
                    </div>))}
                </div>)}

              {/* TAB 3: CONDITIONAL RULES */}
              {activeTab === 'rules' && (<div className="space-y-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-0">Conditional Routing Engine Rules</h6>
                    <button type="button" onClick={addRuleRow} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 text-xs font-bold">
                      <Plus className="h-3.5 w-3.5"/> Add Rule
                    </button>
                  </div>

                  {(formData.rules || []).map((rule, idx) => (<div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                      <div className="d-flex justify-content-between align-items-center border-bottom border-slate-800 pb-2">
                        <span className="text-xs font-extrabold text-amber-400">IF Condition Rule #{idx + 1}</span>
                        <button type="button" onClick={() => removeRuleRow(idx)} className="btn btn-sm btn-outline-danger p-1">
                          <Trash2 className="h-3.5 w-3.5"/>
                        </button>
                      </div>

                      <div className="row g-3">
                        <div className="col-12 col-md-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Rule Title</label>
                          <input type="text" className="form-control text-xs font-semibold" value={rule.rule_name} onChange={(e) => {
                    const updated = [...formData.rules];
                    updated[idx].rule_name = e.target.value;
                    setFormData({ ...formData, rules: updated });
                }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                        </div>

                        <div className="col-12 col-md-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Evaluate Field</label>
                          <select className="form-select text-xs font-semibold" value={rule.field_name} onChange={(e) => {
                    const updated = [...formData.rules];
                    updated[idx].field_name = e.target.value;
                    setFormData({ ...formData, rules: updated });
                }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
                            <option value="visitor_category">Visitor Category</option>
                            <option value="risk_level">Risk Level</option>
                            <option value="meeting_room">Meeting Room</option>
                            <option value="visit_duration">Visit Duration (mins)</option>
                            <option value="department">Department</option>
                          </select>
                        </div>

                        <div className="col-12 col-md-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Condition Value</label>
                          <input type="text" className="form-control text-xs font-semibold" placeholder="e.g. Contractor or High" value={rule.field_value} onChange={(e) => {
                    const updated = [...formData.rules];
                    updated[idx].field_value = e.target.value;
                    setFormData({ ...formData, rules: updated });
                }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                        </div>
                      </div>
                    </div>))}
                </div>)}

              {/* TAB 4: SLA & ESCALATION */}
              {activeTab === 'sla' && (<div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Default SLA Target (Minutes)</label>
                    <input type="number" className="form-control text-xs font-semibold" value={120} readOnly style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Automatic Escalation Target</label>
                    <select className="form-select text-xs font-semibold" defaultValue="Department Manager" style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                      <option value="Department Manager">Department Manager</option>
                      <option value="Security Officer">Security Officer</option>
                      <option value="Admin">System Administrator</option>
                    </select>
                  </div>
                </div>)}

            </div>

            {/* Modal Footer */}
            <div className="modal-footer border-top border-slate-200 dark:border-slate-800 px-4 py-3 d-flex justify-content-between">
              <button type="button" className="btn btn-sm btn-outline-secondary text-xs font-bold px-3" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 text-xs font-bold px-4 py-2">
                <CheckCircle2 className="h-4 w-4"/> Save Workflow
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>);
}
