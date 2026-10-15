import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function NotificationToast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-in slide-in-from-bottom-5 ${
      isSuccess ? 'bg-white text-gray-900 border-green-200' : 'bg-white text-gray-900 border-red-200'
    }`}>
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
      )}
      <span className="text-xs">{message}</span>
      {onClose && (
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
