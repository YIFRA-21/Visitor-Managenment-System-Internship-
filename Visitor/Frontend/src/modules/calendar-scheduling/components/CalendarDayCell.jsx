import React from 'react';

export default function CalendarDayCell({ day, isCurrentMonth, isToday, events = [], onSelectDate }) {
  return (
    <div
      onClick={() => onSelectDate?.(day)}
      className={`min-h-[100px] p-2 border border-gray-100 transition-colors cursor-pointer ${
        isCurrentMonth ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/60 text-gray-400'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
          isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
        }`}>
          {day}
        </span>
        {events.length > 0 && (
          <span className="text-[10px] font-medium text-gray-400">{events.length}</span>
        )}
      </div>

      <div className="space-y-1 overflow-hidden">
        {events.slice(0, 3).map((ev, i) => (
          <div
            key={i}
            className="text-[10px] px-1.5 py-0.5 rounded truncate bg-blue-50 text-blue-700 border border-blue-100 font-medium"
          >
            {ev.title || ev.visitor_name || 'Event'}
          </div>
        ))}
        {events.length > 3 && (
          <div className="text-[9px] text-gray-400 font-medium pl-1">
            +{events.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}
