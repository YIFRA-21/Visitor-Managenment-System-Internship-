import React, { useState } from 'react';
import { X, QrCode } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScan }) {
  const [manualCode, setManualCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (manualCode) {
      onScan?.(manualCode);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Scan QR Access Code</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">Position visitor badge camera viewport or enter manual passcode</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Enter pass code manually..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="w-full text-center text-sm font-mono border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!manualCode}
            className="w-full py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
          >
            Verify Pass
          </button>
        </form>
      </div>
    </div>
  );
}
