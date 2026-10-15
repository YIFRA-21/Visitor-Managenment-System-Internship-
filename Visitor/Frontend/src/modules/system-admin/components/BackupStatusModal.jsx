import React from 'react';
import { X, Database, Download } from 'lucide-react';

export default function BackupStatusModal({ isOpen, onClose, onTriggerBackup }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <Database className="w-10 h-10 text-blue-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Database Backup Status</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">Last backup completed at 03:00 AM UTC (Size: 24.8 MB)</p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={onTriggerBackup}
            className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Trigger Backup
          </button>
        </div>
      </div>
    </div>
  );
}
