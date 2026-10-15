import React from 'react';
import { Building2, Users, MapPin, ChevronRight } from 'lucide-react';
import DepartmentStatusBadge from './DepartmentStatusBadge';

export default function DepartmentCard({ department, onSelect, onEdit }) {
  if (!department) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-mono font-medium text-gray-500">{department.code || 'DEPT-01'}</span>
          <h3 className="text-base font-semibold text-gray-900 mt-0.5">{department.name || 'Department Name'}</h3>
        </div>
        <DepartmentStatusBadge status={department.status} />
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 mb-4">
        {department.description || 'Department organizational unit'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-600 py-3 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          {department.members_count || department.employee_count || 0} Members
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          {department.location || 'Floor 2'}
        </span>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        {onEdit && (
          <button
            onClick={() => onEdit(department)}
            className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Edit
          </button>
        )}
        {onSelect && (
          <button
            onClick={() => onSelect(department)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1"
          >
            Details <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
