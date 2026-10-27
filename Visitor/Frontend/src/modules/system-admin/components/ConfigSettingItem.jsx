import React from 'react';
import ToggleSwitch from '../../../components/common/ToggleSwitch';

export default function ConfigSettingItem({ label, description, checked, onChange }) {
  return (
    <div className="py-3 flex items-center justify-between gap-4 border-b border-gray-100">
      <div>
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <ToggleSwitch
        checked={checked}
        onChange={(val) => onChange?.(val)}
        color="blue"
        showLabelBadge={true}
      />
    </div>
  );
}
