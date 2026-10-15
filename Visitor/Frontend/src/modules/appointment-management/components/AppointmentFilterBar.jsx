import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

export default function AppointmentFilterBar({
  search = '',
  onSearchChange,
  status = '',
  onStatusChange,
  date = '',
  onDateChange,
  onReset
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search visitor, host, code..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <select
        value={status}
        onChange={(e) => onStatusChange?.(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="approved">Approved</option>
        <option value="checked_in">Checked In</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange?.(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      {onReset && (
        <button
          onClick={onReset}
          className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title="Reset filters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
