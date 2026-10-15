import React from 'react';
import { Shield } from 'lucide-react';

export default function RoleBadge({ role = 'user' }) {
  const norm = String(role || '').toLowerCase();
  const config = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    superadmin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    host: 'bg-blue-50 text-blue-700 border-blue-200',
    receptionist: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    security: 'bg-amber-50 text-amber-700 border-amber-200',
    visitor: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${config[norm] || config.visitor}`}>
      <Shield className="w-3 h-3" />
      {norm}
    </span>
  );
}
