import React from 'react';

export default function PermissionCheckboxGroup({ moduleName, permissions = {}, onChange }) {
  const actions = ['read', 'create', 'update', 'delete'];

  return (
    <div className="py-2 flex items-center justify-between border-b border-gray-100 text-xs">
      <span className="font-medium text-gray-800 capitalize w-48">{moduleName}</span>
      <div className="flex items-center gap-6">
        {actions.map((act) => (
          <label key={act} className="flex items-center gap-1.5 cursor-pointer text-gray-600">
            <input
              type="checkbox"
              checked={Boolean(permissions[act])}
              onChange={(e) => onChange?.(moduleName, act, e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="capitalize">{act}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
