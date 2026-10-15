import React from 'react';
import { QrCode, Shield, Calendar, Clock, Building } from 'lucide-react';
import PassExpiryCountdown from './PassExpiryCountdown';

export default function VisitorPassBadge({ pass, onPrint }) {
  if (!pass) return null;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-800 p-6 shadow-xl max-w-sm w-full mx-auto relative overflow-hidden">
      <div className="bg-gray-900 text-white px-4 py-2 -mx-6 -mt-6 mb-4 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider uppercase">VISITOR ACCESS PASS</span>
        <Shield className="w-4 h-4 text-emerald-400" />
      </div>

      <div className="text-center mb-4">
        <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 mx-auto flex items-center justify-center text-gray-400 text-xl font-bold mb-2">
          {pass.photo_url ? (
            <img src={pass.photo_url} alt="Visitor" className="w-full h-full object-cover rounded-xl" />
          ) : (
            pass.visitor_name ? pass.visitor_name.charAt(0) : 'V'
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900">{pass.visitor_name || 'Visitor Name'}</h3>
        <p className="text-xs font-medium text-gray-500">{pass.company || 'Guest'}</p>
      </div>

      <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 text-xs text-gray-700 mb-4 border border-gray-100">
        <div className="flex justify-between">
          <span className="text-gray-400">Pass ID:</span>
          <span className="font-mono font-bold text-gray-900">{pass.pass_code || pass.badge_number || 'VP-90214'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Host:</span>
          <span className="font-medium text-gray-900">{pass.host_name || 'Staff Host'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Valid Date:</span>
          <span className="font-medium text-gray-900">{pass.valid_date || 'Today'}</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-3 border border-dashed border-gray-300 rounded-xl mb-4">
        <QrCode className="w-24 h-24 text-gray-800" />
        <span className="text-[10px] font-mono text-gray-400 mt-1">SCAN AT SECURITY GATES</span>
      </div>

      <PassExpiryCountdown expiresAt={pass.expires_at} />

      {onPrint && (
        <button
          onClick={() => onPrint(pass)}
          className="w-full mt-4 py-2 text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-lg transition-colors"
        >
          Print Physical Pass
        </button>
      )}
    </div>
  );
}
