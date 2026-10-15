import React, { useState } from 'react';
import { X, CheckCircle, Shield, QrCode } from 'lucide-react';

export default function CheckInActionModal({ isOpen, onClose, onConfirm, visitor }) {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [ndaAccepted, setNdaAccepted] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm?.({ visitor, badgeNumber, ndaAccepted });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Confirm Visitor Check-In</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl text-sm">
            <p className="font-medium text-gray-900">{visitor?.name || 'Visitor'}</p>
            <p className="text-xs text-gray-500">{visitor?.company || 'Company'} • Host: {visitor?.host || 'Host'}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Assign Physical Badge / Card #</label>
            <input
              type="text"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              placeholder="e.g. CARD-8472"
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={ndaAccepted}
              onChange={(e) => setNdaAccepted(e.target.checked)}
              className="rounded text-blue-600"
            />
            Visitor has reviewed safety regulations & signed NDA
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-700 bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg"
            >
              Complete Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
