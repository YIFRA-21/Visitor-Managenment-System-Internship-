import React, { useState } from 'react';
import { X, ShieldCheck, FileText, ExternalLink, Printer } from 'lucide-react';
export default function VisitorHistoryDrawer({ history, onClose, onViewStandalone, onPrint }) {
    const [activeTab, setActiveTab] = useState('overview');
    if (!history)
        return null;
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
        catch {
            return dateStr;
        }
    };
    const formatTime = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        catch {
            return dateStr;
        }
    };
    return (<div className="bg-slate-900 border-l border-slate-800 w-full h-full flex flex-col overflow-hidden text-xs text-slate-300 shadow-2xl">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div>
          <h3 className="text-base font-bold text-white m-0">Record Details</h3>
          <p className="text-[11px] text-slate-400 m-0">History Reference #{history.history_code}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors" title="Close Panel">
          <X className="h-5 w-5"/>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950 px-4">
        {[
            { key: 'overview', label: 'Overview' },
            { key: 'timeline', label: 'Timeline' },
            { key: 'documents', label: `Documents (${history.documents?.length || 0})` },
            { key: 'notes', label: 'Notes' }
        ].map((t) => (<button key={t.key} onClick={() => setActiveTab(t.key)} className={`py-3 px-3 font-bold border-b-2 transition-colors ${activeTab === t.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'overview' && (<>
            {/* Visitor Header Profile Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              {history.visitor_photo ? (<img src={history.visitor_photo} alt={history.visitor_name} className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-500/30 shadow-md"/>) : (<div className="w-16 h-16 rounded-xl bg-slate-800 text-slate-200 font-black text-xl flex items-center justify-center border border-slate-700">
                  {history.visitor_name ? history.visitor_name.charAt(0).toUpperCase() : 'V'}
                </div>)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                    Completed
                  </span>
                  <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                    {history.visitor_category || 'General Visitor'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-1 mb-0 truncate">{history.visitor_name}</h4>
                <p className="text-xs text-slate-400 m-0 truncate">{history.visitor_company || 'Independent Visitor'}</p>
                <div className="text-[11px] font-mono text-indigo-400 mt-1">Ref: {history.reference_number}</div>
              </div>
            </div>

            {/* Section 1: Identity Information */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Identity Information</h5>
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Identity Type</span>
                  <span className="text-slate-200 font-bold">{history.identity_type || 'National ID'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Identity Number</span>
                  <span className="text-slate-200 font-mono font-bold">{history.identity_number || 'ID-8839201'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Verification Status</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5"/> {history.verification_status || 'Verified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Appointment & Host */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Appointment Details</h5>
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Appointment No.</span>
                  <span className="text-indigo-400 font-mono font-bold">{history.appointment_number || `APT-${history.appointment_id}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Host Employee</span>
                  <span className="text-slate-200 font-bold">{history.host_employee_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Department</span>
                  <span className="text-slate-200 font-bold">{history.department_name || 'Main Office'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Meeting Location</span>
                  <span className="text-slate-200 font-bold">{history.meeting_location || 'Main Reception'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Visit Purpose</span>
                  <span className="text-slate-200 font-bold">{history.visit_purpose || 'General Business'}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Visit Timing */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Check-In / Out Timings</h5>
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Visitor Pass No.</span>
                  <span className="text-amber-400 font-mono font-bold">{history.pass_number || `PASS-${history.visitor_id}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Check-In Time</span>
                  <span className="text-emerald-400 font-mono font-bold">{formatTime(history.checkin_time)} ({formatDate(history.checkin_time)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Check-Out Time</span>
                  <span className="text-slate-300 font-mono font-bold">{formatTime(history.checkout_time)} ({formatDate(history.checkout_time)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Total Duration</span>
                  <span className="text-indigo-400 font-bold">{history.visit_duration_minutes || 30} minutes</span>
                </div>
              </div>
            </div>
          </>)}

        {activeTab === 'timeline' && (<div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visit Lifecycle Timeline</h5>
            <div className="relative border-l-2 border-slate-800 ms-3 space-y-4 ps-4">
              <div className="relative">
                <span className="absolute -left-[23px] top-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"/>
                <h6 className="text-xs font-bold text-white m-0">Check-Out Completed</h6>
                <p className="text-[11px] text-slate-400 m-0">{formatTime(history.checkout_time)} • Visitor handed over pass and exited facility.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[23px] top-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-900"/>
                <h6 className="text-xs font-bold text-white m-0">Meeting Completed</h6>
                <p className="text-[11px] text-slate-400 m-0">Meeting concluded with {history.host_employee_name}.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[23px] top-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-slate-900"/>
                <h6 className="text-xs font-bold text-white m-0">Checked-In</h6>
                <p className="text-[11px] text-slate-400 m-0">{formatTime(history.checkin_time)} • Security badge issued.</p>
              </div>
            </div>
          </div>)}

        {activeTab === 'documents' && (<div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attached Visit Documents</h5>
            {!history.documents || history.documents.length === 0 ? (<div className="text-center p-6 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 font-semibold">
                No documents uploaded for this visit.
              </div>) : (history.documents.map((doc) => (<div key={doc.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-indigo-400"/>
                    <div>
                      <div className="font-bold text-white text-xs">{doc.document_name}</div>
                      <div className="text-[10px] text-slate-400">{doc.document_type}</div>
                    </div>
                  </div>
                  <a href={doc.document_url || '#'} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-info">
                    View
                  </a>
                </div>)))}
          </div>)}

        {activeTab === 'notes' && (<div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit &amp; System Notes</h5>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs">
              System generated permanent historical record on check-out completion. Verification status verified by security operator.
            </div>
          </div>)}
      </div>

      {/* Footer Action Buttons */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
        <button onClick={() => onViewStandalone(history)} className="flex-1 btn btn-primary d-flex align-items-center justify-content-center gap-2 text-xs font-bold py-2">
          <ExternalLink className="h-4 w-4"/> Full Details Page
        </button>
        <button onClick={() => onPrint(history)} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2">
          <Printer className="h-4 w-4"/> Print
        </button>
      </div>
    </div>);
}
