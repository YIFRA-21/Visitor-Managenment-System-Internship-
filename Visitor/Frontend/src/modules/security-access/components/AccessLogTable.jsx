import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function AccessLogTable({ logs = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
          <tr>
            <th className="px-4 py-2.5">Time</th>
            <th className="px-4 py-2.5">Visitor / Badge</th>
            <th className="px-4 py-2.5">Access Point</th>
            <th className="px-4 py-2.5">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((l, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 text-gray-500 font-mono">{l.time || '10:05 AM'}</td>
              <td className="px-4 py-2.5 font-medium text-gray-900">{l.visitor_name || 'Card #4091'}</td>
              <td className="px-4 py-2.5 text-gray-600">{l.gate_name || 'Main Turnstile'}</td>
              <td className="px-4 py-2.5">
                <span className={`inline-flex items-center gap-1 font-semibold ${
                  l.granted !== false ? 'text-green-600' : 'text-red-600'
                }`}>
                  {l.granted !== false ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {l.granted !== false ? 'Granted' : 'Denied'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
