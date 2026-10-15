import React, { useState } from 'react';
import { X, UserCheck } from 'lucide-react';

export default function HostAssignmentModal({ isOpen, onClose, onAssign, currentHost }) {
  const [newHostId, setNewHostId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign?.({ newHostId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Reassign Host</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-gray-500">
            Select an alternate host to take responsibility for current visitor appointments.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Designated Host</label>
            <input
              type="text"
              placeholder="Search employee name or email..."
              value={newHostId}
              onChange={(e) => setNewHostId(e.target.value)}
              required
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg"
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
