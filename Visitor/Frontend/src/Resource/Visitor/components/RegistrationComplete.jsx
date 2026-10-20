import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, Download, LayoutDashboard } from 'lucide-react';
export default function RegistrationComplete({ visitorId = 'VIS-2026-000145', referenceNo = 'REF-7X9P-2026-8145', onGoToDashboard }) {
    const [copiedId, setCopiedId] = useState(false);
    const [copiedRef, setCopiedRef] = useState(false);
    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'id') {
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
        else {
            setCopiedRef(true);
            setTimeout(() => setCopiedRef(false), 2000);
        }
    };
    return (<div className="bg-[#0f172a] border border-slate-800 text-white rounded-2xl p-8 max-w-md mx-auto shadow-2xl space-y-6 text-center">
      {/* Animated Success Checkmark */}
      <div className="relative w-20 h-20 mx-auto d-flex align-items-center justify-content-center">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"/>
        <div className="w-20 h-20 bg-emerald-500 rounded-full d-flex align-items-center justify-content-center shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="h-10 w-10 text-white"/>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-white mb-1">Registration Successful!</h2>
        <p className="text-xs text-slate-400 font-semibold mb-0">
          Your visitor account has been created.<br />Your details are generated below.
        </p>
      </div>

      {/* Generated Credentials Cards */}
      <div className="space-y-3 text-start">
        {/* Visitor ID Box */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Visitor ID</span>
          <div className="d-flex justify-content-between align-items-center">
            <span className="font-mono text-sm font-extrabold text-white tracking-wide">{visitorId}</span>
            <button onClick={() => copyToClipboard(visitorId, 'id')} className="btn btn-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-1 rounded d-flex align-items-center gap-1 transition-all">
              {copiedId ? <Check className="h-3 w-3 text-emerald-400"/> : <Copy className="h-3 w-3"/>}
              {copiedId ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Reference Number Box */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Reference Number</span>
          <div className="d-flex justify-content-between align-items-center">
            <span className="font-mono text-sm font-extrabold text-white tracking-wide">{referenceNo}</span>
            <button onClick={() => copyToClipboard(referenceNo, 'ref')} className="btn btn-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-1 rounded d-flex align-items-center gap-1 transition-all">
              {copiedRef ? <Check className="h-3 w-3 text-emerald-400"/> : <Copy className="h-3 w-3"/>}
              {copiedRef ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
        Please keep your Visitor ID or Reference Number for future use during reception gate check-ins.
      </p>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button onClick={() => {
          const receiptContent = `==============================\nVISITOR MANAGEMENT SYSTEM - RECEIPT\n==============================\nVisitor ID: ${visitorId}\nReference No: ${referenceNo}\nIssued: ${new Date().toLocaleString()}\nStatus: Registered & Verified\n==============================\nPlease present this receipt or your Reference Number upon arrival at the security/reception desk.\n==============================`;
          const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `VMS_Receipt_${visitorId}.txt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }} className="w-100 btn bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs py-2.5 rounded-xl d-flex align-items-center justify-content-center gap-2 transition-all">
          <Download className="h-4 w-4 text-blue-400"/> Download Receipt
        </button>

        <button onClick={onGoToDashboard} className="w-100 btn bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl d-flex align-items-center justify-content-center gap-2 shadow-lg shadow-emerald-600/20 transition-all">
          <LayoutDashboard className="h-4 w-4"/> Go to Dashboard
        </button>
      </div>
    </div>);
}
