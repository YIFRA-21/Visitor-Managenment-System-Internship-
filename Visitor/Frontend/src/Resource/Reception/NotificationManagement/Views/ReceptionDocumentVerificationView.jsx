import React from 'react';
import { FileCheck } from 'lucide-react';
const ReceptionDocumentVerificationView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-400"/> Document Verification & OCR Alerts
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Passport/ID scan OCR extraction results, face match verification, and manual desk review alerts.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'National ID OCR Extraction Completed', visitor: 'Sarah Jenkins', result: '99.4% Match Score', status: 'Passed', tagCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
            { title: 'Passport Scan Manual Review Required', visitor: 'Dr. Aris Thorne', result: 'Low Resolution Scan', status: 'Review Needed', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${item.tagCol}`}>{item.status}</span>
              </div>
              <p className="text-slate-300 mt-1">{item.visitor} — <span className="text-slate-400">{item.result}</span></p>
            </div>
            <button className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded font-semibold hover:bg-blue-600/30">
              Inspect Document
            </button>
          </div>))}
      </div>
    </div>);
};
export default ReceptionDocumentVerificationView;
