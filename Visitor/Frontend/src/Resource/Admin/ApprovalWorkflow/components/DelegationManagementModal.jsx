import React, { useState } from 'react';
import { UserCheck, Plus, Calendar } from 'lucide-react';
export default function DelegationManagementModal({ onClose }) {
    const [delegations, setDelegations] = useState([
        {
            id: 1,
            delegator_name: 'Emily Davis (Finance Manager)',
            delegate_name: 'James Wilson (Operations Lead)',
            start_date: '2026-07-25',
            end_date: '2026-08-05',
            reason: 'Annual Leave / Out of Office',
            status: 'Active'
        }
    ]);
    const [showAdd, setShowAdd] = useState(false);
    const [newDelegation, setNewDelegation] = useState({
        delegator_id: 4,
        delegate_id: 5,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        reason: 'Temporary Out of Office Delegation'
    });
    const handleSave = () => {
        const item = {
            id: Date.now(),
            delegator_name: 'System Admin',
            delegate_name: 'Lisa Thompson (Receptionist)',
            start_date: newDelegation.start_date,
            end_date: newDelegation.end_date,
            reason: newDelegation.reason,
            status: 'Active'
        };
        setDelegations([item, ...delegations]);
        setShowAdd(false);
    };
    return (<div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.85)', zIndex: 1050 }} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">

          {/* Modal Header */}
          <div className="modal-header border-bottom border-slate-200 dark:border-slate-800 px-4 py-3">
            <h5 className="modal-title text-base font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-500"/>
              Approver Delegation & Out-of-Office Management
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}/>
          </div>

          <div className="modal-body p-4 max-h-[500px] overflow-y-auto space-y-4">
            <div className="d-flex justify-content-between align-items-center">
              <p className="text-xs text-slate-400 font-semibold mb-0">
                Configure temporary approver replacement and delegation rules for when managers or hosts are out of office.
              </p>
              <button type="button" onClick={() => setShowAdd(!showAdd)} className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-1.5">
                <Plus className="h-4 w-4"/> Add Delegation
              </button>
            </div>

            {/* Add Delegation Panel */}
            {showAdd && (<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h6 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">New Out-of-Office Delegation Assignment</h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Delegator (Out of Office)</label>
                    <select className="form-select text-xs font-semibold" style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
                      <option value="4">Emily Davis (Finance Manager)</option>
                      <option value="1">System Admin</option>
                      <option value="8">Amanda Foster (HR Director)</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Delegate (Temporary Approver)</label>
                    <select className="form-select text-xs font-semibold" style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}>
                      <option value="5">James Wilson (Operations Lead)</option>
                      <option value="2">Sarah Johnson (Sales Director)</option>
                      <option value="7">Robert Garcia (Security Officer)</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Date</label>
                    <input type="date" className="form-control text-xs font-semibold" value={newDelegation.start_date} onChange={(e) => setNewDelegation({ ...newDelegation, start_date: e.target.value })} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Date</label>
                    <input type="date" className="form-control text-xs font-semibold" value={newDelegation.end_date} onChange={(e) => setNewDelegation({ ...newDelegation, end_date: e.target.value })} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}/>
                  </div>
                  <div className="col-12 col-md-4 d-flex align-items-end">
                    <button type="button" onClick={handleSave} className="btn btn-sm btn-success w-100 font-bold text-xs py-2">
                      Confirm Delegation
                    </button>
                  </div>
                </div>
              </div>)}

            {/* Existing Delegations List */}
            <div className="space-y-2">
              {delegations.map(del => (<div key={del.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-xs font-bold text-white">{del.delegator_name}</span>
                      <span className="text-xs text-slate-500 font-bold">→ Delegate to →</span>
                      <span className="text-xs font-bold text-indigo-400">{del.delegate_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 d-flex align-items-center gap-3">
                      <span><Calendar className="h-3 w-3 d-inline me-1"/> {del.start_date} to {del.end_date}</span>
                      <span>Reason: {del.reason}</span>
                    </div>
                  </div>
                  <span className="badge bg-success text-xs font-bold">{del.status}</span>
                </div>))}
            </div>

          </div>

          <div className="modal-footer border-top border-slate-200 dark:border-slate-800 px-4 py-3">
            <button type="button" className="btn btn-sm btn-outline-secondary text-xs font-bold px-4" onClick={onClose}>
              Close
            </button>
          </div>

        </div>
      </div>
    </div>);
}
