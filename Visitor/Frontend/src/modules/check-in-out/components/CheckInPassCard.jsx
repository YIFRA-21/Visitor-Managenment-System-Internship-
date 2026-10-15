import React from 'react';
import { User, QrCode, Clock, ShieldCheck, CheckCircle } from 'lucide-react';

export default function CheckInPassCard({ checkInRecord, onCheckOut }) {
  if (!checkInRecord) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            PASS #{checkInRecord.badge_number || checkInRecord.pass_id || 'PASS-001'}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            <CheckCircle className="w-3 h-3" /> Checked In
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-base border">
            {checkInRecord.visitor_name ? checkInRecord.visitor_name.charAt(0) : 'V'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{checkInRecord.visitor_name || 'Visitor Name'}</h4>
            <p className="text-xs text-gray-500">{checkInRecord.company || 'Visiting Guest'}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-gray-600 py-3 border-y border-gray-100">
          <div className="flex justify-between">
            <span className="text-gray-400">Host:</span>
            <span className="font-medium text-gray-800">{checkInRecord.host_name || 'Host Employee'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Check-in Time:</span>
            <span className="font-medium text-gray-800">{checkInRecord.check_in_time || '10:00 AM'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Destination:</span>
            <span className="font-medium text-gray-800">{checkInRecord.destination || 'Building 1'}</span>
          </div>
        </div>
      </div>

      {onCheckOut && (
        <div className="mt-4 pt-2">
          <button
            onClick={() => onCheckOut(checkInRecord)}
            className="w-full py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Process Check-Out
          </button>
        </div>
      )}
    </div>
  );
}
