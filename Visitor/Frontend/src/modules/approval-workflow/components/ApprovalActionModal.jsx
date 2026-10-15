import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function ApprovalActionModal({ isOpen, onClose, onConfirm, item, actionType = 'approve' }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const isApprove = actionType === 'approve';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm?.({ item, action: actionType, comment });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <h3 className="font-semibold text-gray-900 capitalize">
              {actionType} Request
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to {actionType} this request? This action will advance the workflow.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Comments / Reason {isApprove ? '(Optional)' : '(Required)'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required={!isApprove}
              rows={3}
              placeholder={isApprove ? "Add an optional approval note..." : "Please state reason for rejection..."}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? 'Processing...' : (isApprove ? 'Confirm Approval' : 'Confirm Rejection')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
