import React from 'react';
import { Shield, Users, Key, Edit, Trash2 } from 'lucide-react';
import RoleBadge from './RoleBadge';

export default function RoleCard({ role, onEdit, onDelete }) {
  if (!role) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <RoleBadge role={role.name} />
          <h3 className="font-semibold text-gray-900 text-sm mt-2">{role.title || role.name || 'Role Title'}</h3>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button onClick={() => onEdit(role)} className="p-1 text-gray-400 hover:text-gray-600">
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && !role.is_system && (
            <button onClick={() => onDelete(role)} className="p-1 text-gray-400 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 mb-4">
        {role.description || 'System access role definition'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          {role.user_count || 0} Assigned Users
        </span>
        <span className="flex items-center gap-1">
          <Key className="w-3.5 h-3.5 text-gray-400" />
          {role.permission_count || 12} Permissions
        </span>
      </div>
    </div>
  );
}
