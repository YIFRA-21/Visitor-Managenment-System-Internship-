import React from 'react';
import { FileCheck } from 'lucide-react';
const SecurityIdentityVerificationView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-teal-400"/> Identity Verification & Fraud Alerts
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Fake document suspicions, face match failures, expired IDs, and manual security verification requests.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Fake Document Fraud Alert', visitor: 'Arthur Pendelton', reason: 'OCR Checksum Mismatch', status: 'Hold Order Active', tagCol: 'bg-red-500/10 text-red-400 border-red-500/30' },
            { title: 'Face Match Biometric Threshold Failed', visitor: 'John Vance', reason: 'Biometric Similarity <65%', status: 'Manual Inspection Needed', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${item.tagCol}`}>{item.status}</span>
              </div>
              <p className="text-slate-300 mt-1">{item.visitor} — <span className="text-slate-400">{item.reason}</span></p>
            </div>
            <button className="bg-teal-600/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded font-semibold hover:bg-teal-600/30">
              Verify Document
            </button>
          </div>))}
      </div>
    </div>);
};
export default SecurityIdentityVerificationView;
