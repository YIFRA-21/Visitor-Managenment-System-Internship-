import React from 'react';
import { AlertOctagon, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function WatchlistBadge({ riskLevel = 'normal' }) {
  const norm = String(riskLevel || '').toLowerCase();
  
  const config = {
    critical: { label: 'Blacklisted', bg: 'bg-red-100 text-red-800 border-red-300', icon: AlertOctagon },
    high: { label: 'High Risk', bg: 'bg-orange-100 text-orange-800 border-orange-300', icon: ShieldAlert },
    medium: { label: 'Medium Risk', bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: ShieldAlert },
    low: { label: 'Monitored', bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: ShieldCheck },
    normal: { label: 'Clean', bg: 'bg-green-100 text-green-800 border-green-300', icon: ShieldCheck },
  };

  const current = config[norm] || config.normal;
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {current.label}
    </span>
  );
}
