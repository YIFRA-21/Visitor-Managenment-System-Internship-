import React from 'react';
import { Building, Users, Tv, Wifi, CheckCircle, Clock } from 'lucide-react';
import RoomAvailabilityBadge from './RoomAvailabilityBadge';

export default function RoomCard({ room, onSelect, onEdit }) {
  if (!room) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-mono font-medium text-gray-500">{room.code || 'ROOM-01'}</span>
          <h3 className="text-base font-semibold text-gray-900 mt-0.5">{room.name || 'Conference Room'}</h3>
          <p className="text-xs text-gray-500">{room.building || 'Main Building'} • Floor {room.floor || 1}</p>
        </div>
        <RoomAvailabilityBadge status={room.status} />
      </div>

      <div className="flex items-center gap-4 py-3 border-y border-gray-100 text-xs text-gray-600 mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-400" />
          Capacity: {room.capacity || 10}
        </span>
        <span className="flex items-center gap-1">
          <Tv className="w-4 h-4 text-gray-400" />
          Display: {room.has_display !== false ? 'Yes' : 'No'}
        </span>
        <span className="flex items-center gap-1">
          <Wifi className="w-4 h-4 text-gray-400" />
          WiFi: Available
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(room)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Edit
          </button>
        )}
        {onSelect && (
          <button
            onClick={() => onSelect(room)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Book Room
          </button>
        )}
      </div>
    </div>
  );
}
