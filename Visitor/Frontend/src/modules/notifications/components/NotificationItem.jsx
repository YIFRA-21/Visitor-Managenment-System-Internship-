import React from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function NotificationItem({ notification, onRead, onDelete }) {
  if (!notification) return null;

  const isUnread = !notification.is_read;

  return (
    <div className={`p-4 rounded-xl border transition-colors flex items-start gap-3 ${
      isUnread ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-100'
    }`}>
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
        <Bell className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {notification.title || 'System Notification'}
          </h4>
          <span className="text-[11px] text-gray-400 shrink-0">
            {notification.created_at || 'Just now'}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
          {notification.message || notification.content || ''}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isUnread && onRead && (
          <button
            onClick={() => onRead(notification)}
            className="p-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            title="Mark as read"
          >
            Mark Read
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(notification)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Delete notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
