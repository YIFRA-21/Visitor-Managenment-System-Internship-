import React from 'react';
import { X, Copy, Code } from 'lucide-react';

export default function AuditDetailsModal({ isOpen, onClose, log }) {
  if (!isOpen || !log) return null;

  const copyJson = () => {
    navigator.clipboard?.writeText(JSON.stringify(log, null, 2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Audit Log Details</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyJson}
              className="p-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 rounded-lg flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copy JSON
            </button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-500">Timestamp</span>
              <p className="font-medium">{log.created_at || log.timestamp || 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Actor</span>
              <p className="font-medium">{log.user_name || log.actor || 'System'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Action</span>
              <p className="font-medium font-mono">{log.action || 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">IP Address</span>
              <p className="font-medium font-mono">{log.ip_address || 'N/A'}</p>
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500 block mb-1">Payload / Details</span>
            <pre className="p-3 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono overflow-x-auto max-h-64">
              {JSON.stringify(log.details || log.payload || log, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
