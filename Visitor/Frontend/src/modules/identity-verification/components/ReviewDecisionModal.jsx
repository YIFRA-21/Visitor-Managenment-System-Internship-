import React, { useState } from 'react';
import { CheckCircle2, XCircle, FileText, X, AlertTriangle } from 'lucide-react';

export default function ReviewDecisionModal({ isOpen, onClose, caseItem, onSubmit, submitting }) {
  const [decision, setDecision] = useState('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedReasons, setSelectedReasons] = useState([]);

  if (!isOpen || !caseItem) return null;

  const reasonOptions = [
    'Document photo unreadable / blurred',
    'Document expired',
    'Face biometric mismatch',
    'ID sides or edges cut off',
    'Document type unsupported by organization policy',
    'Suspected fraudulent alteration',
  ];

  const handleToggleReason = (r) => {
    setSelectedReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      alert('Please provide review notes explaining this decision.');
      return;
    }
    onSubmit({
      decision,
      reviewNotes,
      reasons: selectedReasons,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 space-y-5 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400">#{caseItem.case_number}</span>
            <h3 className="text-base font-black text-white">Authorized Review Decision</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Decision Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDecision('APPROVED')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
                decision === 'APPROVED'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Approve</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('RESUBMISSION_REQUESTED')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
                decision === 'RESUBMISSION_REQUESTED'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5 text-sky-400" />
              <span>Resubmit</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('REJECTED')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
                decision === 'REJECTED'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>Reject</span>
            </button>
          </div>

          {/* Reason Checkboxes if rejected or resubmit */}
          {decision !== 'APPROVED' && (
            <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Flagged Deficiencies
              </label>
              <div className="space-y-1">
                {reasonOptions.map((r, i) => (
                  <label key={i} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(r)}
                      onChange={() => handleToggleReason(r)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Review Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Reviewer Assessment & Audit Justification *
            </label>
            <textarea
              required
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Detail reasons for decision in compliance with security guidelines..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition ${
                decision === 'APPROVED'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  : decision === 'RESUBMISSION_REQUESTED'
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-900/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
              }`}
            >
              {submitting ? 'Recording...' : `Confirm ${decision}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
