import React from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';
export default function VisitorLogout({ onGoToLogin }) {
    return (<div className="bg-[#0f172a] border border-slate-800 text-white rounded-2xl p-8 max-w-md mx-auto shadow-2xl space-y-6 text-center">
      {/* Shield Graphic with animated glow */}
      <div className="relative w-24 h-24 mx-auto d-flex align-items-center justify-content-center">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse"/>
        <div className="w-24 h-24 bg-slate-900 border-2 border-blue-500/40 rounded-full d-flex align-items-center justify-content-center shadow-xl shadow-blue-500/20">
          <ShieldCheck className="h-12 w-12 text-blue-400"/>
        </div>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-extrabold text-white tracking-tight">You have been logged out successfully.</h2>
        <p className="text-xs text-slate-400 font-semibold mb-0">
          Thank you for using Visitor Management System.
        </p>
      </div>

      {/* Login Action Button */}
      <div className="pt-3">
        <button onClick={onGoToLogin} className="w-100 btn bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl d-flex align-items-center justify-content-center gap-2 shadow-lg shadow-emerald-600/30 transition-all">
          <LogIn className="h-4 w-4"/> Go to Login Page
        </button>
      </div>
    </div>);
}
