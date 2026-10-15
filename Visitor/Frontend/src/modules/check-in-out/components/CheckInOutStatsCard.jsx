import React from 'react';
import { Users, LogIn, LogOut, Clock } from 'lucide-react';

export default function CheckInOutStatsCard({ title, count = 0, type = 'active' }) {
  const config = {
    expected: { icon: Clock, bg: 'bg-blue-50 text-blue-600' },
    active: { icon: LogIn, bg: 'bg-green-50 text-green-600' },
    completed: { icon: LogOut, bg: 'bg-indigo-50 text-indigo-600' },
    overstay: { icon: Users, bg: 'bg-amber-50 text-amber-600' },
  };

  const current = config[type] || config.active;
  const Icon = current.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{count}</h3>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${current.bg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
