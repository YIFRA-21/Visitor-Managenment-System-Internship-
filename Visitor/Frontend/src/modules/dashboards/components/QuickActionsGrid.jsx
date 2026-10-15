import React from 'react';
import { UserPlus, Calendar, QrCode, FileText, Shield } from 'lucide-react';

export default function QuickActionsGrid({ onActionClick }) {
  const actions = [
    { id: 'register_visitor', label: 'Register Visitor', icon: UserPlus, color: 'text-blue-600 bg-blue-50' },
    { id: 'new_appointment', label: 'Book Appointment', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
    { id: 'scan_qr', label: 'Scan QR Badge', icon: QrCode, color: 'text-green-600 bg-green-50' },
    { id: 'view_reports', label: 'Analytics & Reports', icon: FileText, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={() => onActionClick?.(act.id)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50/80 shadow-sm transition-all text-center group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${act.color} group-hover:scale-105 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-800">{act.label}</span>
          </button>
        );
      })}
    </div>
  );
}
