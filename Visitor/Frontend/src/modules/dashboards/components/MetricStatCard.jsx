import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MetricStatCard({ title, value, change, isPositive, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {change !== undefined && (
          <span className={`inline-flex items-center text-xs font-semibold ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
