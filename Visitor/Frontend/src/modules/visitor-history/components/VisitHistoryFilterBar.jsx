import React from 'react';
import { Search } from 'lucide-react';

export default function VisitHistoryFilterBar({ search, onSearchChange, onDateChange }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Filter visit history..."
          className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
        />
      </div>
    </div>
  );
}
