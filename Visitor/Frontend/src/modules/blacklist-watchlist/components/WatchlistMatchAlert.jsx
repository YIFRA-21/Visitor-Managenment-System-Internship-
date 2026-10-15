import React from 'react';
import { AlertOctagon, X } from 'lucide-react';

export default function WatchlistMatchAlert({ match, onDismiss, onAction }) {
  if (!match) return null;

  return (
    <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-900 flex items-start gap-3 shadow-md animate-in fade-in">
      <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-bold text-sm text-red-900">SECURITY ALERT: Watchlist Match Detected</h4>
        <p className="text-xs text-red-700 mt-1">
          Visitor <span className="font-semibold">{match.fullName || match.name}</span> matches flagged profile (ID: {match.idNumber || 'N/A'}).
        </p>
        <p className="text-xs text-red-800 mt-0.5 font-medium">Reason: {match.reason || 'Restricted entry policy'}</p>
        {onAction && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onAction(match)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm"
            >
              Notify Security Control
            </button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
