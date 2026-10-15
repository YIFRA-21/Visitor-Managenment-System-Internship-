import React, { useState } from 'react';
import { GitBranch, Play, CheckCircle2, User, Clock, ArrowRight, Plus, Trash2, Sliders, CornerDownRight, QrCode, LogIn } from 'lucide-react';
export default function VisualWorkflowDesigner({ workflow, onSaveLevels, onClose }) {
    const [levels, setLevels] = useState(workflow?.levels || [
        { id: 1, level_order: 1, level_name: 'Lobby Reception Verification', approver_role: 'Receptionist', timeout_minutes: 30, sla_minutes: 60, escalation_target: 'Host' },
        { id: 2, level_order: 2, level_name: 'Host Employee Sign-off', approver_role: 'Host', timeout_minutes: 60, sla_minutes: 120, escalation_target: 'Department Manager' },
        { id: 3, level_order: 3, level_name: 'Security Permit Sign-off', approver_role: 'Security Officer', timeout_minutes: 120, sla_minutes: 240, escalation_target: 'Admin' }
    ]);
    const [selectedLevel, setSelectedLevel] = useState(levels[0] || null);
    const handleAddLevel = () => {
        const nextOrder = levels.length + 1;
        const newLvl = {
            id: Date.now(),
            level_order: nextOrder,
            level_name: `Approval Level ${nextOrder}`,
            approver_role: 'Department Manager',
            timeout_minutes: 60,
            sla_minutes: 120,
            escalation_target: 'Admin'
        };
        const updated = [...levels, newLvl];
        setLevels(updated);
        setSelectedLevel(newLvl);
    };
    const handleRemoveLevel = (id) => {
        const updated = levels.filter(l => l.id !== id).map((l, i) => ({ ...l, level_order: i + 1 }));
        setLevels(updated);
        if (selectedLevel?.id === id) {
            setSelectedLevel(updated[0] || null);
        }
    };
    const handleMoveLevel = (index, direction) => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === levels.length - 1))
            return;
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        const updated = [...levels];
        const temp = updated[index];
        updated[index] = updated[targetIdx];
        updated[targetIdx] = temp;
        const reordered = updated.map((l, i) => ({ ...l, level_order: i + 1 }));
        setLevels(reordered);
    };
    return (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-5 space-y-6">

      {/* Designer Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 border-bottom border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <GitBranch className="h-5 w-5 text-indigo-500"/>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-0">
              Visual Workflow Designer: <span className="text-primary">{workflow?.workflow_name || 'Contractor High Security Approval'}</span>
            </h2>
            <span className="badge bg-primary text-uppercase" style={{ fontSize: '10px' }}>{workflow?.approval_mode || 'Sequential'} Mode</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 mb-0 font-semibold">
            Interactive flowchart builder. Drag, reorder, and configure multi-tiered approval nodes and conditional routing logic.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button onClick={handleAddLevel} className="btn btn-sm btn-primary d-flex align-items-center gap-1 text-xs font-bold px-3 py-2">
            <Plus className="h-4 w-4"/> Add Level Node
          </button>
          {onSaveLevels && (<button onClick={() => onSaveLevels(levels)} className="btn btn-sm btn-success d-flex align-items-center gap-1 text-xs font-bold px-3 py-2">
              <CheckCircle2 className="h-4 w-4"/> Save Designer Changes
            </button>)}
          {onClose && (<button onClick={onClose} className="btn btn-sm btn-outline-secondary text-xs font-bold px-3 py-2">
              Close Designer
            </button>)}
        </div>
      </div>

      {/* Main Flowchart Area */}
      <div className="row g-4">
        {/* Left Side: Visual Node Flowchart Stream */}
        <div className="col-12 col-lg-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner min-h-[480px] d-flex flex-column align-items-center space-y-4">

            {/* NODE 1: START TRIGGER */}
            <div className="d-flex align-items-center gap-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 px-4 text-emerald-300 w-100 max-w-md shadow-md">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-400 d-flex align-items-center justify-content-center shrink-0 border border-emerald-500/30">
                <Play className="h-5 w-5"/>
              </div>
              <div className="flex-grow-1">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Workflow Trigger</div>
                <div className="text-xs font-bold text-white">Visitor Appointment Submitted</div>
              </div>
              <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px]">Entry Node</span>
            </div>

            {/* Connecting Arrow */}
            <div className="d-flex flex-column align-items-center text-slate-500 my-1">
              <div className="h-4 w-0.5 bg-slate-700"></div>
              <ArrowRight className="h-4 w-4 transform rotate-90 text-slate-500"/>
            </div>

            {/* LEVEL NODES LOOP */}
            {levels.map((lvl, index) => {
            const isSelected = selectedLevel?.id === lvl.id;
            return (<React.Fragment key={lvl.id}>
                  <div onClick={() => setSelectedLevel(lvl)} className={`d-flex align-items-center justify-between gap-3 rounded-xl p-3.5 px-4 w-100 max-w-md cursor-pointer transition-all border shadow-md ${isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'}`}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 d-flex align-items-center justify-content-center shrink-0 font-extrabold text-xs">
                        L{lvl.level_order}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{lvl.level_name}</div>
                        <div className="text-[10px] text-slate-400 d-flex align-items-center gap-2 mt-0.5">
                          <span className="d-flex align-items-center gap-1"><User className="h-3 w-3 text-indigo-400"/> Role: {lvl.approver_role}</span>
                          <span className="d-flex align-items-center gap-1"><Clock className="h-3 w-3 text-amber-400"/> Timeout: {lvl.timeout_minutes}m</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleMoveLevel(index, 'up')} disabled={index === 0} className="btn btn-sm btn-outline-secondary p-1" title="Move Level Up">
                        ↑
                      </button>
                      <button onClick={() => handleMoveLevel(index, 'down')} disabled={index === levels.length - 1} className="btn btn-sm btn-outline-secondary p-1" title="Move Level Down">
                        ↓
                      </button>
                      <button onClick={() => handleRemoveLevel(lvl.id)} className="btn btn-sm btn-outline-danger p-1" title="Remove Level">
                        <Trash2 className="h-3.5 w-3.5"/>
                      </button>
                    </div>
                  </div>

                  {/* Connecting Arrow */}
                  <div className="d-flex flex-column align-items-center text-slate-500 my-1">
                    <div className="h-4 w-0.5 bg-slate-700"></div>
                    <ArrowRight className="h-4 w-4 transform rotate-90 text-slate-500"/>
                  </div>
                </React.Fragment>);
        })}

            {/* CONDITIONAL ROUTING BRANCH NODE */}
            <div className="d-flex align-items-center gap-3 bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 px-4 text-amber-300 w-100 max-w-md shadow-md">
              <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-400 d-flex align-items-center justify-content-center shrink-0 border border-amber-500/30">
                <CornerDownRight className="h-4 w-4"/>
              </div>
              <div className="flex-grow-1">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">Rule Condition Engine</div>
                <div className="text-xs font-bold text-white">IF Risk Level = 'High' OR Duration &gt; 7 Days</div>
              </div>
            </div>

            <div className="d-flex flex-column align-items-center text-slate-500 my-1">
              <div className="h-4 w-0.5 bg-slate-700"></div>
              <ArrowRight className="h-4 w-4 transform rotate-90 text-slate-500"/>
            </div>

            {/* FINAL NODES: APPROVED -> PASS -> CHECKIN */}
            <div className="d-flex align-items-center gap-2 w-100 max-w-md justify-content-center">
              <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-2.5 px-3 text-center flex-grow-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-1"/>
                <div className="text-[10px] font-bold text-white">Approved</div>
              </div>

              <ArrowRight className="h-4 w-4 text-slate-600"/>

              <div className="bg-blue-950/60 border border-blue-500/30 rounded-xl p-2.5 px-3 text-center flex-grow-1">
                <QrCode className="h-4 w-4 text-blue-400 mx-auto mb-1"/>
                <div className="text-[10px] font-bold text-white">Visitor Pass</div>
              </div>

              <ArrowRight className="h-4 w-4 text-slate-600"/>

              <div className="bg-purple-950/60 border border-purple-500/30 rounded-xl p-2.5 px-3 text-center flex-grow-1">
                <LogIn className="h-4 w-4 text-purple-400 mx-auto mb-1"/>
                <div className="text-[10px] font-bold text-white">Lobby Check-In</div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Selected Level Configuration Inspector */}
        <div className="col-12 col-lg-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
            <div className="border-bottom border-slate-700 pb-3 d-flex align-items-center justify-content-between">
              <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-0 d-flex align-items-center gap-2">
                <Sliders className="h-4 w-4 text-primary"/> Node Inspector
              </h6>
              {selectedLevel && (<span className="badge bg-primary text-xs">Level {selectedLevel.level_order}</span>)}
            </div>

            {selectedLevel ? (<div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Level Name</label>
                  <input type="text" className="form-control text-xs font-semibold" value={selectedLevel.level_name} onChange={(e) => {
                const val = e.target.value;
                setSelectedLevel(prev => prev ? { ...prev, level_name: val } : null);
                setLevels(prev => prev.map(l => l.id === selectedLevel.id ? { ...l, level_name: val } : l));
            }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Approver Role</label>
                  <select className="form-select text-xs font-semibold" value={selectedLevel.approver_role} onChange={(e) => {
                const val = e.target.value;
                setSelectedLevel(prev => prev ? { ...prev, approver_role: val } : null);
                setLevels(prev => prev.map(l => l.id === selectedLevel.id ? { ...l, approver_role: val } : l));
            }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
                    <option value="Host">Host Employee</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Department Manager">Department Manager</option>
                    <option value="Security Officer">Security Officer</option>
                    <option value="Executive Officer">Executive Officer (C-Suite)</option>
                    <option value="Admin">System Administrator</option>
                  </select>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Timeout (mins)</label>
                    <input type="number" className="form-control text-xs font-semibold" value={selectedLevel.timeout_minutes} onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedLevel(prev => prev ? { ...prev, timeout_minutes: val } : null);
                setLevels(prev => prev.map(l => l.id === selectedLevel.id ? { ...l, timeout_minutes: val } : l));
            }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>
                  <div className="col-6">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">SLA Target (mins)</label>
                    <input type="number" className="form-control text-xs font-semibold" value={selectedLevel.sla_minutes} onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedLevel(prev => prev ? { ...prev, sla_minutes: val } : null);
                setLevels(prev => prev.map(l => l.id === selectedLevel.id ? { ...l, sla_minutes: val } : l));
            }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Escalation Target</label>
                  <select className="form-select text-xs font-semibold" value={selectedLevel.escalation_target} onChange={(e) => {
                const val = e.target.value;
                setSelectedLevel(prev => prev ? { ...prev, escalation_target: val } : null);
                setLevels(prev => prev.map(l => l.id === selectedLevel.id ? { ...l, escalation_target: val } : l));
            }} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
                    <option value="Host">Host</option>
                    <option value="Department Manager">Department Manager</option>
                    <option value="Security Officer">Security Officer</option>
                    <option value="Admin">System Administrator</option>
                  </select>
                </div>
              </div>) : (<div className="text-center py-5 text-slate-500 font-bold text-xs uppercase">
                Select a level node in the flowchart to view/edit properties
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
