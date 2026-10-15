import React from 'react';

export default function RoomAvailabilityBadge({ status = 'available' }) {
  const norm = String(status || '').toLowerCase();
  const config = {
    available: 'bg-green-50 text-green-700 border-green-200',
    occupied: 'bg-red-50 text-red-700 border-red-200',
    maintenance: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    reserved: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${config[norm] || config.available}`}>
      {norm}
    </span>
  );
}
