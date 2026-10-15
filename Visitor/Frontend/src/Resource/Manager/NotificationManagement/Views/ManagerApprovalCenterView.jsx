import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Share2, Calendar, FileText } from 'lucide-react';
const ManagerApprovalCenterView = () => {
    const [selectedApproval, setSelectedApproval] = useState(null);
    const approvals = [
        {
            id: 'appr_9021',
            requestType: 'After-Hours Facility Access',
            visitorName: 'IT Park Maintenance Team (5 Members)',
            company: 'IT Park',
            hostName: 'David Miller',
            requestedDate: '2026-08-06',
            requestedTime: '19:00 - 23:00',
            reason: 'Critical server rack migration and cabling in Data Room B.',
            riskLevel: 'High',
            status: 'Pending Approval',
            historyCount: 1
        },
        {
            id: 'appr_9022',
            requestType: 'VIP Escort & High-Security Pass',
            visitorName: 'Ambassador Elena Rostova',
            company: 'Diplomatic Mission',
            hostName: 'Elena Gilbert',
            requestedDate: '2026-08-07',
            requestedTime: '10:00 - 14:00',
            reason: 'Executive boardroom briefing with Managing Director.',
            riskLevel: 'Medium',
            status: 'Pending Approval',
            historyCount: 1
        }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-amber-400"/> Manager Approval Operations Center
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Review, approve, reject, or return visitor and appointment requests within your authority.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approvals Queue */}
        <div className="lg:col-span-6 space-y-3">
          {approvals.map((appr) => (<div key={appr.id} onClick={() => setSelectedApproval(appr)} className={`bg-slate-950/70 border rounded-xl p-4 cursor-pointer transition-all hover:border-blue-500/50 ${selectedApproval?.id === appr.id ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-white">{appr.requestType}</span>
                  <div className="text-xs text-slate-300 font-semibold mt-1">{appr.visitorName}</div>
                  <div className="text-[11px] text-slate-400">{appr.company} • Host: {appr.hostName}</div>
                </div>

                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold">
                  {appr.riskLevel} Risk
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-900 flex justify-between items-center text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-500"/> {appr.requestedDate} ({appr.requestedTime})</span>
                <span className="text-amber-400 font-semibold">{appr.status}</span>
              </div>
            </div>))}
        </div>

        {/* Selected Approval Details & Controls */}
        <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800 rounded-xl p-5">
          {selectedApproval ? (<div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-white">{selectedApproval.requestType}</h3>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">{selectedApproval.id}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedApproval.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Visitor / Group</span>
                  <span className="text-slate-200 font-semibold mt-0.5 block">{selectedApproval.visitorName}</span>
                  <span className="text-slate-400 text-[11px]">{selectedApproval.company}</span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Department Host</span>
                  <span className="text-slate-200 font-semibold mt-0.5 block">{selectedApproval.hostName}</span>
                  <span className="text-slate-400 text-[11px]">Operations & Security</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all">
                  <CheckCircle2 className="w-4 h-4"/> Approve Access Request
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all">
                    <XCircle className="w-3.5 h-3.5"/> Reject Request
                  </button>
                  <button className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all">
                    <RotateCcw className="w-3.5 h-3.5"/> Request Revision
                  </button>
                </div>

                <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-2 border border-slate-700 transition-all">
                  <Share2 className="w-3.5 h-3.5"/> Forward to Division Manager
                </button>
              </div>
            </div>) : (<div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <FileText className="w-10 h-10 mb-2 opacity-50"/>
              <p className="text-xs">Select an approval request from the queue to view details and execute manager action.</p>
            </div>)}
        </div>
      </div>
    </div>);
};
export default ManagerApprovalCenterView;
