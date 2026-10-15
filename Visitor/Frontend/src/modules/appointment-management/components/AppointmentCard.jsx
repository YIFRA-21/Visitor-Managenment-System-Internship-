import React from 'react';
import { Calendar, Clock, User, Building, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import AppointmentStatusBadge from './AppointmentStatusBadge';

export default function AppointmentCard({ appointment, onSelect, onReschedule, onCancel }) {
  if (!appointment) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {appointment.appointment_code || 'APPT-#' + (appointment.id || '')}
          </span>
          <h3 className="text-base font-semibold text-gray-900 mt-0.5">
            {appointment.visitor_name || appointment.visitor?.name || 'Visitor Name'}
          </h3>
          <p className="text-sm text-gray-500">
            {appointment.company || appointment.visitor?.company || 'Organization'}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{appointment.scheduled_date || appointment.date || 'TBD'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{appointment.scheduled_time || appointment.start_time || 'TBD'}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="truncate">Host: {appointment.host_name || appointment.host?.name || 'Assigned Host'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-400" />
          <span className="truncate">{appointment.location || appointment.room || 'Main Office'}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onReschedule && (
          <button
            onClick={() => onReschedule(appointment)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Reschedule
          </button>
        )}
        {onCancel && (
          <button
            onClick={() => onCancel(appointment)}
            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        {onSelect && (
          <button
            onClick={() => onSelect(appointment)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
          >
            View Details <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
