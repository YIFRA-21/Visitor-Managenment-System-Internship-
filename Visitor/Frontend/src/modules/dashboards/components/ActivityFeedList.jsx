import React from 'react';
import { Clock } from 'lucide-react';

export default function ActivityFeedList({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-gray-400">
        No recent activity logged
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {activities.map((act, i) => (
        <div key={i} className="py-3 flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {act.message || act.title || 'System Event'}
            </p>
            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-gray-400" />
              {act.timestamp || 'Just now'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
