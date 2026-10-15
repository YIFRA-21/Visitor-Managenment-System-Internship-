import React from 'react';
import { User, Mail, Shield, Edit, Trash2 } from 'lucide-react';
import UserStatusBadge from './UserStatusBadge';

export default function UserCard({ user, onEdit, onDelete }) {
  if (!user) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center">
            {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{user.username || user.name || 'User'}</h4>
            <p className="text-xs text-gray-500">{user.role || 'Staff'}</p>
          </div>
        </div>
        <UserStatusBadge status={user.status} />
      </div>

      <div className="py-2 text-xs text-gray-600 flex items-center gap-2 truncate border-t border-gray-100">
        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="truncate">{user.email || 'user@company.com'}</span>
      </div>

      <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-50">
        {onEdit && (
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
            title="Edit user"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(user)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md"
            title="Delete user"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
