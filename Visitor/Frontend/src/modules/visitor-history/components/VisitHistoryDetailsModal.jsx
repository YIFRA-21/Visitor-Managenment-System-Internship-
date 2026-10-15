import React from 'react';
import { X, Calendar } from 'lucide-react';

export default function VisitHistoryDetailsModal({ isOpen, onClose, visit }) {
  if (!isOpen || !visit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Visit Record Details</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Visitor</span>
            <span className="font-semibold">{visit.visitor_name || 'Visitor'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Host</span>
            <span className="font-semibold">{visit.host_name || 'Host'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Check In</span>
            <span>{visit.check_in_time || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Check Out</span>
            <span>{visit.check_out_time || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
