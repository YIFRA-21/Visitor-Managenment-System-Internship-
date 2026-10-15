import React from 'react';
import { Layers } from 'lucide-react';

export default function OrgHierarchyNode({ node, onSelect }) {
  if (!node) return null;

  return (
    <div
      onClick={() => onSelect?.(node)}
      className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 cursor-pointer transition-colors flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <Layers className="w-4 h-4" />
      </div>
      <div>
        <h5 className="text-xs font-semibold text-gray-900">{node.title || node.name}</h5>
        <p className="text-[11px] text-gray-500">{node.subtitle || node.role || 'Division'}</p>
      </div>
    </div>
  );
}
