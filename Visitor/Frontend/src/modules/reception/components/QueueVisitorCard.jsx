import React from 'react';
import { Clock, User, Bell, Phone } from 'lucide-react';

export default function QueueVisitorCard({ visitor, onCall, onNotifyHost }) {
  if (!visitor) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-sm">
          #{visitor.queue_number || '1'}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{visitor.name || 'Visitor Name'}</h4>
          <p className="text-xs text-gray-500">Host: {visitor.host_name || 'Staff'} • Waiting: {visitor.wait_time || '5m'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onNotifyHost && (
          <button
            onClick={() => onNotifyHost(visitor)}
            className="p-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
            title="Notify Host"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
        )}
        {onCall && (
          <button
            onClick={() => onCall(visitor)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Call to Desk
          </button>
        )}
      </div>
    </div>
  );
}
