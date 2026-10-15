import React from 'react';

export default function ConfigSettingItem({ label, description, checked, onChange }) {
  return (
    <div className="py-3 flex items-center justify-between gap-4 border-b border-gray-100">
      <div>
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}
