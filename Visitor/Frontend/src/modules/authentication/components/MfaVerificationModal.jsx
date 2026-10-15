import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export default function MfaVerificationModal({ isOpen, onClose, onVerify }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onVerify?.(code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Two-Factor Authentication</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          Enter the 6-digit verification code from your authenticator app
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center tracking-widest text-2xl font-mono py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      </div>
    </div>
  );
}
