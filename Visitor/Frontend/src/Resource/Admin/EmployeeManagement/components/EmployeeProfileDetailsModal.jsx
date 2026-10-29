import React, { useState } from 'react';
export default function EmployeeProfileDetailsModal({ employee, onClose }) {
    const [activeTab, setActiveTab] = useState('info');
    if (!employee)
        return null;
    return (<div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.85)', zIndex: 1050 }} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">

          {/* Modal Header */}
          <div className="modal-header border-bottom border-slate-200 dark:border-slate-800 px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 d-flex align-items-center justify-content-center font-bold text-sm">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </div>
              <div>
                <h5 className="modal-title text-base font-extrabold text-slate-900 dark:text-white mb-0">
                  {employee.full_name || `${employee.first_name} ${employee.last_name}`}
                </h5>
                <span className="text-xs text-slate-400 font-mono">{employee.employee_number} • {employee.job_title}</span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}/>
          </div>

          {/* Tab Bar */}
          <div className="bg-slate-900 border-bottom border-slate-800 px-4 py-2 d-flex gap-2">
            {[
            { key: 'info', label: 'Employee Information' },
            { key: 'host', label: 'Host & Visitor Settings' },
            { key: 'history', label: 'Hosting History' }
        ].map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`btn btn-sm text-xs font-bold px-3 py-1.5 ${activeTab === tab.key ? 'btn-primary' : 'btn-outline-secondary'}`}>
                {tab.label}
              </button>))}
          </div>

          <div className="modal-body p-4 max-h-[500px] overflow-y-auto">

            {/* TAB 1: INFORMATION */}
            {activeTab === 'info' && (<div className="space-y-4">
                <div className="row g-3">
                  <div className="col-12 col-md-6 bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <h6 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Employment Profile</h6>
                    <div className="text-xs text-slate-300"><strong>Employment Status:</strong> <span className="badge bg-success">{employee.employment_status}</span></div>
                    <div className="text-xs text-slate-300"><strong>Type:</strong> {employee.employment_type || 'Full-Time'}</div>
                    <div className="text-xs text-slate-300"><strong>Department:</strong> {employee.department_name || 'Operations'}</div>
                    <div className="text-xs text-slate-300"><strong>Branch:</strong> {employee.branch_name || 'Main HQ'}</div>
                    <div className="text-xs text-slate-300"><strong>Hire Date:</strong> {employee.hire_date || '2021-01-15'}</div>
                  </div>

                  <div className="col-12 col-md-6 bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <h6 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Contact & Location</h6>
                    <div className="text-xs text-slate-300"><strong>Email:</strong> {employee.email}</div>
                    <div className="text-xs text-slate-300"><strong>Mobile:</strong> {employee.mobile_number || '-'}</div>
                    <div className="text-xs text-slate-300"><strong>Office Phone:</strong> {employee.office_phone || '-'} (Ext: {employee.extension || '-'})</div>
                    <div className="text-xs text-slate-300"><strong>Office:</strong> Floor {employee.floor_number || '3'}, Office {employee.office_number || '301'}</div>
                    <div className="text-xs text-slate-300"><strong>Availability:</strong> <span className="badge bg-info">{employee.availability_status || 'Available'}</span></div>
                  </div>

                  <div className="col-12 bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <h6 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Emergency Contact Details</h6>
                    <div className="text-xs text-slate-300"><strong>Contact Name:</strong> {employee.emergency_contact_name || 'Helen Admin'}</div>
                    <div className="text-xs text-slate-300"><strong>Relationship:</strong> {employee.emergency_contact_relation || 'Spouse'}</div>
                    <div className="text-xs text-slate-300"><strong>Phone:</strong> {employee.emergency_contact_phone || '+251911000222'}</div>
                  </div>
                </div>
              </div>)}

            {/* TAB 2: HOST SETTINGS */}
            {activeTab === 'host' && (<div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <h6 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Host Status & Capacity Quotas</h6>
                <div className="d-flex align-items-center justify-content-between text-xs text-slate-300 border-bottom border-slate-800 pb-2">
                  <span>Host Privilege Status:</span>
                  <span className={`badge ${employee.is_host_enabled ? 'bg-success' : 'bg-secondary'}`}>
                    {employee.is_host_enabled ? 'HOST ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between text-xs text-slate-300 border-bottom border-slate-800 pb-2">
                  <span>Maximum Visitors Per Day:</span>
                  <span className="font-bold text-white">{employee.max_visitors_per_day || 10} visitors/day</span>
                </div>
                <div className="d-flex align-items-center justify-content-between text-xs text-slate-300 border-bottom border-slate-800 pb-2">
                  <span>Maximum Concurrent Visitors:</span>
                  <span className="font-bold text-white">{employee.max_concurrent_visitors || 3} concurrent</span>
                </div>
                <div className="d-flex align-items-center justify-content-between text-xs text-slate-300">
                  <span>Default Meeting Room:</span>
                  <span className="font-bold text-indigo-400">{employee.default_room_name || 'Conference Room B'}</span>
                </div>
              </div>)}

            {/* TAB 3: HOSTING HISTORY */}
            {activeTab === 'history' && (<div className="space-y-2">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 d-flex justify-content-between align-items-center text-xs">
                  <div>
                    <div className="font-bold text-white">John Smith (IT park)</div>
                    <div className="text-[10px] text-slate-400">Quarterly Strategic Audit • 2026-07-31 09:00 AM</div>
                  </div>
                  <span className="badge bg-success">COMPLETED</span>
                </div>
              </div>)}

          </div>

          <div className="modal-footer border-top border-slate-200 dark:border-slate-800 px-4 py-3">
            <button type="button" className="btn btn-sm btn-outline-secondary text-xs font-bold px-4" onClick={onClose}>
              Close Profile
            </button>
          </div>

        </div>
      </div>
    </div>);
}
