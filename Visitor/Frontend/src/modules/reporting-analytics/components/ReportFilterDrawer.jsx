import React from 'react';
import { X, Calendar } from 'lucide-react';

export default function ReportFilterDrawer({ isOpen, onClose, filters, onFilterChange }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl border-l border-gray-200 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">Report Filters</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters?.range || '30d'}
              onChange={(e) => onFilterChange?.('range', e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg p-2"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last Quarter</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
      >
        Apply Filters
      </button>
    </div>
  );
}
