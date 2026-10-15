import React from 'react';
import { ShieldCheck, Lock, Unlock, AlertTriangle } from 'lucide-react';

export default function SecurityGateCard({ gate, onToggleLock }) {
  if (!gate) return null;

  const isLocked = gate.is_locked !== false;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isLocked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{gate.name || 'Gate 1 Turnstile'}</h4>
          <p className="text-xs text-gray-500">{gate.location || 'Main Lobby'} • {gate.status || 'Online'}</p>
        </div>
      </div>

      {onToggleLock && (
        <button
          onClick={() => onToggleLock(gate)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
            isLocked
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
          }`}
        >
          {isLocked ? 'Unlock Gate' : 'Lock Gate'}
        </button>
      )}
    </div>
  );
}
