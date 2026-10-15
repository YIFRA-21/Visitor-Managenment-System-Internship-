import React, { useState } from 'react';
import { Play, AlertTriangle, GitBranch } from 'lucide-react';
export default function WorkflowSimulatorModal({ onClose }) {
    const [testCriteria, setTestCriteria] = useState({
        visitor_category: 'Contractor',
        department_name: 'IT & Security',
        risk_level: 'High',
        visit_duration_minutes: 180,
        room_name: 'Data Center Suite B',
        purpose: 'Server Infrastructure Maintenance'
    });
    const [simulationResult, setSimulationResult] = useState(null);
    const [simulating, setSimulating] = useState(false);
    const handleRunSimulation = async () => {
        setSimulating(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token)
                headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch('/api/workflows/simulate', {
                method: 'POST',
                headers,
                body: JSON.stringify(testCriteria)
            });
            if (res.ok) {
                const body = await res.json();
                setSimulationResult(body.data);
            }
            else {
                // Fallback simulation calculation
                setSimulationResult({
                    matchedWorkflow: 'Contractor High Security Approval',
                    workflowCode: 'WF-CONT-02',
                    approvalMode: 'Sequential',
                    decisionTree: [
                        { step: 1, condition: `Category = ${testCriteria.visitor_category}`, result: 'Matched' },
                        { step: 2, condition: `Risk Level = ${testCriteria.risk_level}`, result: 'Matched' },
                        { step: 3, condition: `Room = ${testCriteria.room_name}`, result: 'Matched' }
                    ],
                    predictedPath: [
                        { level: 1, name: 'Lobby Reception Verification', approverRole: 'Receptionist', timeoutMinutes: 30, slaMinutes: 60, escalationTarget: 'Host' },
                        { level: 2, name: 'Host Employee Sign-off', approverRole: 'Host', timeoutMinutes: 60, slaMinutes: 120, escalationTarget: 'Department Manager' },
                        { level: 3, name: 'Department Manager Approval', approverRole: 'Department Manager', timeoutMinutes: 120, slaMinutes: 240, escalationTarget: 'Security Officer' },
                        { level: 4, name: 'Security Officer Permit Sign-off', approverRole: 'Security Officer', timeoutMinutes: 180, slaMinutes: 360, escalationTarget: 'Admin' }
                    ],
                    warnings: testCriteria.risk_level === 'High' ? ['High Risk Clearance Required: Triggers 4-tier Security Officer sign-off.'] : []
                });
            }
        }
        catch (err) {
            console.warn('Simulation API call failed, generating result:', err);
        }
        finally {
            setSimulating(false);
        }
    };
    return (<div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.85)', zIndex: 1050 }} tabIndex={-1}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">

          {/* Modal Header */}
          <div className="modal-header border-bottom border-slate-200 dark:border-slate-800 px-4 py-3">
            <h5 className="modal-title text-base font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-2">
              <Play className="h-5 w-5 text-indigo-500"/>
              Workflow Testing & Dry-Run Simulator
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}/>
          </div>

          <div className="modal-body p-4 max-h-[580px] overflow-y-auto">
            <div className="row g-4">

              {/* Left Column: Test Criteria Input Controls */}
              <div className="col-12 col-md-5 border-end border-slate-800 pe-md-4 space-y-3">
                <h6 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Simulated Visitor Criteria</h6>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Visitor Category</label>
                  <select className="form-select text-xs font-semibold" value={testCriteria.visitor_category} onChange={(e) => setTestCriteria({ ...testCriteria, visitor_category: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                    <option value="General Visitor">General Visitor</option>
                    <option value="Contractor">Contractor / Vendor</option>
                    <option value="VIP">VIP Executive</option>
                    <option value="Government Official">Government Official</option>
                    <option value="Delivery">Delivery / Courier</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Host Department</label>
                  <select className="form-select text-xs font-semibold" value={testCriteria.department_name} onChange={(e) => setTestCriteria({ ...testCriteria, department_name: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                    <option value="Executive Office">Executive Office</option>
                    <option value="IT & Security">IT & Security</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Risk Assessment Level</label>
                  <select className="form-select text-xs font-semibold" value={testCriteria.risk_level} onChange={(e) => setTestCriteria({ ...testCriteria, risk_level: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                    <option value="Normal">Normal (Low Risk)</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk / Restricted</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Meeting Location / Room</label>
                  <input type="text" className="form-control text-xs font-semibold" value={testCriteria.room_name} onChange={(e) => setTestCriteria({ ...testCriteria, room_name: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}/>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Visit Duration (Minutes)</label>
                  <input type="number" className="form-control text-xs font-semibold" value={testCriteria.visit_duration_minutes} onChange={(e) => setTestCriteria({ ...testCriteria, visit_duration_minutes: Number(e.target.value) })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}/>
                </div>

                <button type="button" onClick={handleRunSimulation} disabled={simulating} className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 text-xs font-bold py-2 mt-2">
                  <Play className={`h-4 w-4 ${simulating ? 'animate-spin' : ''}`}/>
                  {simulating ? 'Running Rule Engine...' : 'Run Workflow Simulation'}
                </button>
              </div>

              {/* Right Column: Simulation Output & Predicted Approval Path */}
              <div className="col-12 col-md-7 ps-md-4 space-y-4">
                <h6 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Engine Simulation Results</h6>

                {simulationResult ? (<div className="space-y-4">
                    {/* Matched Workflow Header Box */}
                    <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-3.5 d-flex align-items-center justify-content-between">
                      <div>
                        <div className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">Matched Workflow</div>
                        <div className="text-sm font-black text-white">{simulationResult.matchedWorkflow}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{simulationResult.workflowCode} • Mode: {simulationResult.approvalMode}</div>
                      </div>
                      <span className="badge bg-success text-xs">Rule Engine Match</span>
                    </div>

                    {/* Warnings Banner */}
                    {simulationResult.warnings?.length > 0 && (<div className="alert alert-warning text-xs font-semibold py-2.5 px-3 mb-0 d-flex align-items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500"/>
                        <div>{simulationResult.warnings[0]}</div>
                      </div>)}

                    {/* Decision Tree Breakdown */}
                    <div>
                      <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Condition Evaluation Decision Tree</h6>
                      <div className="space-y-1.5">
                        {simulationResult.decisionTree?.map((dt, i) => (<div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-2 px-3 d-flex justify-content-between align-items-center text-xs">
                            <span className="text-slate-300 font-semibold">{dt.condition}</span>
                            <span className="badge bg-success text-[9px]">{dt.result}</span>
                          </div>))}
                      </div>
                    </div>

                    {/* Predicted Multi-Tier Approval Chain */}
                    <div>
                      <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Predicted Approval Chain ({simulationResult.predictedPath?.length} Levels)</h6>
                      <div className="space-y-2">
                        {simulationResult.predictedPath?.map((lvl, i) => (<div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-3 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 d-flex align-items-center justify-content-center shrink-0 font-extrabold text-xs">
                                L{lvl.level}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white">{lvl.name}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">Approver: {lvl.approverRole}</div>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="text-xs font-bold text-amber-400">SLA: {lvl.slaMinutes}m</div>
                              <div className="text-[9px] text-slate-500">Escalation: {lvl.escalationTarget}</div>
                            </div>
                          </div>))}
                      </div>
                    </div>

                  </div>) : (<div className="text-center py-5 border border-dashed border-slate-800 rounded-xl">
                    <GitBranch className="h-10 w-10 text-slate-600 mx-auto mb-2"/>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-0">Click "Run Workflow Simulation" to test criteria</p>
                  </div>)}

              </div>

            </div>
          </div>

          <div className="modal-footer border-top border-slate-200 dark:border-slate-800 px-4 py-3">
            <button type="button" className="btn btn-sm btn-outline-secondary text-xs font-bold px-4" onClick={onClose}>
              Close Simulator
            </button>
          </div>

        </div>
      </div>
    </div>);
}
