import React from 'react';
import { Eye, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AuditLogRow({ log, onViewDetails }) {
  if (!log) return null;

  const isSuccess = log.status === 'success' || !log.status || log.status === 200;

  return (
    <tr className="hover:bg-gray-50/75 border-b border-gray-100 text-sm">
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">
        {log.created_at || log.timestamp || 'Just now'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
        {log.user_name || log.actor || 'System'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-800">
          {log.action || 'ACTION'}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
        {log.entity || log.target || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">
        {log.ip_address || '127.0.0.1'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-xs ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
          {isSuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {isSuccess ? 'Success' : 'Failed'}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(log)}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
