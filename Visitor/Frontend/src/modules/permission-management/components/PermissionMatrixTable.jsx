import React from 'react';
import PermissionCheckboxGroup from './PermissionCheckboxGroup';

export default function PermissionMatrixTable({ matrix = {}, onChange }) {
  const modules = Object.keys(matrix);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span>Module Name</span>
        <div className="flex items-center gap-10 pr-6">
          <span>Read</span>
          <span>Create</span>
          <span>Update</span>
          <span>Delete</span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {modules.map((m) => (
          <PermissionCheckboxGroup
            key={m}
            moduleName={m}
            permissions={matrix[m]}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}
