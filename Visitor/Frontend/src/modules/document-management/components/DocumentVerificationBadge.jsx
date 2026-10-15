import React from 'react';

export default function DocumentVerificationBadge({ status = 'verified' }) {
  const norm = String(status || '').toLowerCase();
  const config = {
    verified: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${config[norm] || config.pending}`}>
      {norm}
    </span>
  );
}
