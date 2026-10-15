import React from 'react';

export default function VisitorCategoryBadge({ category = 'client' }) {
  const norm = String(category || '').toLowerCase();
  const config = {
    vip: 'bg-amber-50 text-amber-700 border-amber-200',
    contractor: 'bg-purple-50 text-purple-700 border-purple-200',
    client: 'bg-blue-50 text-blue-700 border-blue-200',
    vendor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${config[norm] || config.client}`}>
      {norm}
    </span>
  );
}
