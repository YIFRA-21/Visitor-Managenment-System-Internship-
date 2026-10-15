import React from 'react';
export default function EmailNotificationPreview({ onGoToDashboard }) {
    return (<div className="bg-[#0f172a] border border-slate-800 text-white rounded-2xl p-6 max-w-lg mx-auto shadow-2xl space-y-4">
      {/* Email Metadata Bar */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-3 text-[11px] font-semibold text-slate-300 space-y-1">
        <div className="d-flex justify-content-between">
          <span className="text-slate-400">From:</span>
          <span className="font-mono text-slate-200">no-reply@vms.com</span>
        </div>
        <div className="d-flex justify-content-between border-top border-slate-800 pt-1">
          <span className="text-slate-400">To:</span>
          <span className="font-mono text-slate-200">john.doe@email.com</span>
        </div>
        <div className="d-flex justify-content-between border-top border-slate-800 pt-1">
          <span className="text-slate-400">Subject:</span>
          <span className="font-extrabold text-white">Your Visitor Registration is Successful</span>
        </div>
      </div>

      {/* Rendered HTML Email Body Simulator */}
      <div className="bg-white text-slate-900 rounded-xl p-6 shadow-md space-y-5 text-xs font-sans">
        {/* VMS Header Logo */}
        <div className="d-flex align-items-center gap-2 border-bottom pb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-base d-flex align-items-center justify-content-center">
            V
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-0">VMS</h3>
            <p className="text-[10px] text-slate-500 font-semibold mb-0">Visitor Management System</p>
          </div>
        </div>

        <div>
          <h2 className="text-base font-extrabold text-slate-900 mb-1">Registration Successful!</h2>
          <p className="text-slate-600 font-normal leading-relaxed mb-0">
            Dear John Doe,<br />
            Thank you for registering with us. Your visitor account has been created successfully.
          </p>
        </div>

        {/* Credentials Card inside Email */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-semibold">
          <div className="d-flex justify-content-between border-bottom pb-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Visitor ID</span>
            <span className="font-mono font-extrabold text-slate-900">VIS-2026-000145</span>
          </div>
          <div className="d-flex justify-content-between pt-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Reference Number</span>
            <span className="font-mono font-extrabold text-slate-900">REF-7X9P-2026-8145</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-normal mb-0">
          Please use your Visitor ID or Reference Number to check your appointments and visitor pass.
        </p>

        {/* CTA Button */}
        <div className="text-center pt-2">
          <button onClick={onGoToDashboard} className="btn btn-primary text-xs font-extrabold px-6 py-2.5 rounded-lg shadow-md">
            View My Dashboard
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 border-top pt-4 mb-0">
          This is an automated email. Please do not reply.
        </p>
      </div>
    </div>);
}
