import React from 'react';
import { Clock } from 'lucide-react';

export default function CalendarTimeSlotPicker({ slots = [], selectedSlot, onSelectSlot }) {
  const defaultSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'
  ];

  const availableSlots = slots.length > 0 ? slots : defaultSlots;

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
        <Clock className="w-3.5 h-3.5 text-gray-400" />
        Select Time Slot
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {availableSlots.map((slot) => {
          const isSelected = selectedSlot === slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onSelectSlot?.(slot)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
