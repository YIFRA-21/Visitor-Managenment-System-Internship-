import React from 'react';
import { X, Printer } from 'lucide-react';

export default function PassPrintModal({ isOpen, onClose, onConfirmPrint }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <Printer className="w-10 h-10 text-gray-800 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Print Visitor Badge</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">Send badge layout directly to connected thermal badge printer</p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmPrint}
            className="flex-1 py-2 text-xs font-semibold text-white bg-gray-900 hover:bg-black rounded-lg"
          >
            Print Now
          </button>
        </div>
      </div>
    </div>
  );
}
