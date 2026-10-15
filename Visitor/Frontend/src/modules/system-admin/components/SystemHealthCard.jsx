import React from 'react';
import { Activity, Server, Database, CheckCircle2 } from 'lucide-react';

export default function SystemHealthCard({ status = 'Operational', uptime = '99.98%' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm">System Health & Services</h3>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
        <div className="p-3 bg-gray-50 rounded-xl">
          <span className="text-gray-400 block mb-0.5">API Server</span>
          <span className="font-semibold text-gray-900">200 OK (14ms)</span>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <span className="text-gray-400 block mb-0.5">Database</span>
          <span className="font-semibold text-gray-900">Connected (PostgreSQL)</span>
        </div>
      </div>
    </div>
  );
}
