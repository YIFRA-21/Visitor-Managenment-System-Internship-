import React from 'react';
import { Building, MapPin, Users, Phone } from 'lucide-react';

export default function OrganizationCard({ org, onSelect }) {
  if (!org) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{org.name || 'Organization Name'}</h3>
            <p className="text-xs text-gray-500">{org.branch_code || 'HQ-01'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-gray-600 py-3 border-y border-gray-100">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate">{org.address || 'Headquarters campus'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span>{org.departments_count || 5} Departments</span>
        </div>
      </div>

      {onSelect && (
        <div className="flex justify-end mt-3">
          <button
            onClick={() => onSelect(org)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            Manage Branch
          </button>
        </div>
      )}
    </div>
  );
}
