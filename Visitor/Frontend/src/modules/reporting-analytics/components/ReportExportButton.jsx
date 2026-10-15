import React, { useState } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';

export default function ReportExportButton({ onExport }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-1.5"
      >
        <Download className="w-3.5 h-3.5 text-gray-500" />
        Export
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 rounded-lg bg-white border border-gray-200 shadow-lg py-1 z-20 text-xs">
          <button
            onClick={() => { onExport?.('csv'); setOpen(false); }}
            className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" /> CSV Format
          </button>
          <button
            onClick={() => { onExport?.('pdf'); setOpen(false); }}
            className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-red-600" /> PDF Document
          </button>
        </div>
      )}
    </div>
  );
}
