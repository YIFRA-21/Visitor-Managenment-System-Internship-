import React from 'react';
import QueueVisitorCard from './QueueVisitorCard';

export default function WaitingQueueList({ queue = [], onCall, onNotifyHost }) {
  if (queue.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        No visitors currently in reception waiting area
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {queue.map((v, i) => (
        <QueueVisitorCard
          key={v.id || i}
          visitor={v}
          onCall={onCall}
          onNotifyHost={onNotifyHost}
        />
      ))}
    </div>
  );
}
