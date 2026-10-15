import React from 'react';
import { User, Building, Phone, Mail, ChevronRight } from 'lucide-react';
import VisitorCategoryBadge from './VisitorCategoryBadge';

export default function VisitorCard({ visitor, onSelect }) {
  if (!visitor) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
            {visitor.name ? visitor.name.charAt(0) : 'V'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{visitor.name || 'Visitor Name'}</h4>
            <p className="text-xs text-gray-500">{visitor.company || 'Private'}</p>
          </div>
        </div>
        <VisitorCategoryBadge category={visitor.category} />
      </div>

      <div className="space-y-1.5 text-xs text-gray-600 py-3 border-y border-gray-100">
        <div className="flex items-center gap-2 truncate">
          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{visitor.email || 'visitor@example.com'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{visitor.phone || '+1 555-0199'}</span>
        </div>
      </div>

      {onSelect && (
        <div className="flex justify-end mt-3">
          <button
            onClick={() => onSelect(visitor)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1"
          >
            Profile <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
