import React from 'react';

export default function UserStatusBadge({ status = 'active' }) {
  const norm = String(status || '').toLowerCase();
  const isActive = norm === 'active' || norm === '1' || norm === 'true';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
      isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
