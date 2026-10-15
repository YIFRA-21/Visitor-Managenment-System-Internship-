import React from 'react';
import { CheckCircle2, Clock3, AlertTriangle, XCircle, ShieldAlert, FileText } from 'lucide-react';

export default function StatusBadge({ status, className = '' }) {
  const s = (status || 'UNVERIFIED').toUpperCase();

  if (s === 'VERIFIED') {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Verified</span>
      </span>
    );
  }

  if (s === 'IN_REVIEW') {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Manual Review Needed</span>
      </span>
    );
  }

  if (s === 'PROVIDER_PROCESSING' || s === 'PENDING') {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 ${className}`}>
        <Clock3 className="w-3.5 h-3.5 animate-spin" />
        <span>Processing</span>
      </span>
    );
  }

  if (s === 'RESUBMISSION_REQUIRED') {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400 ${className}`}>
        <FileText className="w-3.5 h-3.5" />
        <span>Resubmission Required</span>
      </span>
    );
  }

  if (s === 'REJECTED') {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 ${className}`}>
        <XCircle className="w-3.5 h-3.5" />
        <span>Rejected</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
      <ShieldAlert className="w-3.5 h-3.5" />
      <span>{s}</span>
    </span>
  );
}
