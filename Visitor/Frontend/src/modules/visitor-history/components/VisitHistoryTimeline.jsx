import React from 'react';
import { Clock, CheckCircle2, User, Building } from 'lucide-react';

export default function VisitHistoryTimeline({ visits = [] }) {
  if (visits.length === 0) {
    return <div className="p-6 text-center text-xs text-gray-400">No visit history recorded</div>;
  }

  return (
    <div className="space-y-4">
      {visits.map((v, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-900">{v.visitor_name || 'Visitor'}</h4>
              <span className="text-[11px] text-gray-400">{v.date || 'Recent'}</span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">Host: {v.host_name || 'Staff'} • {v.purpose || 'Meeting'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
