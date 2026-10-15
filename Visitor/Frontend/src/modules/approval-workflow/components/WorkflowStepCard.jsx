import React from 'react';
import { GitCommit, Clock, UserCheck, Shield } from 'lucide-react';

export default function WorkflowStepCard({ step, stepNumber = 1 }) {
  if (!step) return null;

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm shrink-0">
        {stepNumber}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">
          {step.name || step.title || `Step ${stepNumber}`}
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          {step.description || 'Approval requirement step'}
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
            Approver: {step.approver_role || step.approver || 'Manager'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            SLA: {step.timeout_hours ? `${step.timeout_hours}h` : '24h'}
          </span>
        </div>
      </div>
    </div>
  );
}
