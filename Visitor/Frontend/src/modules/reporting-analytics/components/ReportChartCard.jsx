import React from 'react';
import { Download } from 'lucide-react';

export default function ReportChartCard({ title, subtitle, children, onExport }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="p-1.5 text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        )}
      </div>

      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
