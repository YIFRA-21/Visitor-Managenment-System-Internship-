import React from 'react';
import { User, Mail, Phone, Building, ShieldCheck } from 'lucide-react';

export default function EmployeeCard({ employee, onSelect, onEdit }) {
  if (!employee) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center border border-blue-100">
            {employee.name ? employee.name.charAt(0) : 'E'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{employee.name || 'Employee Name'}</h3>
            <p className="text-xs text-gray-500">{employee.job_title || employee.role || 'Staff Member'}</p>
          </div>
        </div>
        {employee.is_host !== false && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3 h-3" /> Host
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-gray-600 py-3 border-y border-gray-100">
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-gray-400" />
          <span>{employee.department_name || employee.department || 'General'}</span>
        </div>
        <div className="flex items-center gap-2 truncate">
          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{employee.email || 'employee@org.com'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span>{employee.phone || '+1 555-0100'}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-3">
        {onEdit && (
          <button
            onClick={() => onEdit(employee)}
            className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Edit
          </button>
        )}
        {onSelect && (
          <button
            onClick={() => onSelect(employee)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            View Profile
          </button>
        )}
      </div>
    </div>
  );
}
