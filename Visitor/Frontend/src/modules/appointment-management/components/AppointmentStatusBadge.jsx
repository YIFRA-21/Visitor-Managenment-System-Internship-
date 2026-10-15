import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Ban } from 'lucide-react';

export default function AppointmentStatusBadge({ status = 'pending' }) {
  const norm = String(status || '').toLowerCase();
  
  const config = {
    pending: { label: 'Pending', bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
    approved: { label: 'Approved', bg: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
    checked_in: { label: 'Checked In', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: CheckCircle2 },
    completed: { label: 'Completed', bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
    rejected: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: Ban },
  };

  const current = config[norm] || { label: status, bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle };
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${current.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {current.label}
    </span>
  );
}
