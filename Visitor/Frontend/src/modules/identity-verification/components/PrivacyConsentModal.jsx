import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, X, Check } from 'lucide-react';

export default function PrivacyConsentModal({ isOpen, onClose, onAccept }) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 space-y-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Identity Verification Privacy Notice</h3>
              <p className="text-xs text-slate-400">Consent for document & biometric checks</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice text */}
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3 leading-relaxed max-h-60 overflow-y-auto">
          <p>
            To comply with facility security policies and verify authorized guest entry, the Enterprise Visitor Management System processes your government-issued identity document and facial biometric scan.
          </p>
          <div className="space-y-1.5 pl-2 border-l-2 border-emerald-500/40">
            <p className="font-semibold text-white">How your data is protected:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>End-to-end encrypted storage; documents are stored in private secure partitions.</li>
              <li>Document numbers are stored masked in accordance with data privacy regulations.</li>
              <li>Biometric matching is evaluated strictly for physical building safety and access authorization.</li>
              <li>Data is purged or anonymized in alignment with organizational retention policies.</li>
            </ul>
          </div>
        </div>

        {/* Consent check */}
        <label className="flex items-start space-x-3 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0"
          />
          <span>
            I acknowledge this privacy notice and explicitly consent to the automated verification of my identity document and facial comparison for facility access.
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (agreed) onAccept();
            }}
            disabled={!agreed}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30 flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Accept & Proceed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
