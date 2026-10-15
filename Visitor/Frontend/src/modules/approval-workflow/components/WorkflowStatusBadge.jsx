import React from 'react';

export default function WorkflowStatusBadge({ status = 'draft' }) {
  const norm = String(status || '').toLowerCase();
  const config = {
    active: 'bg-green-50 text-green-700 border-green-200',
    draft: 'bg-gray-50 text-gray-700 border-gray-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${config[norm] || config.draft}`}>
      {norm}
    </span>
  );
}
