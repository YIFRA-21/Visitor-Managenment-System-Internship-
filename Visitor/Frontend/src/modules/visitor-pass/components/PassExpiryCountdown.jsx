import React from 'react';
import { Clock } from 'lucide-react';

export default function PassExpiryCountdown({ expiresAt }) {
  return (
    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200">
      <Clock className="w-3.5 h-3.5" />
      <span>Pass Valid until 06:00 PM Today</span>
    </div>
  );
}
