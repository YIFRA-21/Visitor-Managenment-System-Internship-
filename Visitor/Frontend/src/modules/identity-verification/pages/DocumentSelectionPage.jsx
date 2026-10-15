import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CreditCard,
  Globe,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import BackButton from '../../../components/common/BackButton';
import identityVerificationApi from '../api/identityVerificationApi';
import { useToast } from '../../../contexts/ToastContext';

export default function DocumentSelectionPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState('Ethiopia');
  const [selectedDocType, setSelectedDocType] = useState('NATIONAL_ID');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const docOptions = [
    {
      id: 'NATIONAL_ID',
      title: 'Ethiopian Fayda / National ID',
      badge: 'Recommended',
      desc: 'Smart National ID card with biometric credentials & unique Fayda FIN.',
      requiresBack: true,
      icon: CreditCard,
    },
    {
      id: 'PASSPORT',
      title: 'International Passport',
      badge: 'All Nations',
      desc: 'Machine-readable travel passport photo page with MRZ code.',
      requiresBack: false,
      icon: Globe,
    },
    {
      id: 'DRIVERS_LICENSE',
      title: "Driver's License",
      badge: 'Official',
      desc: 'Government-issued motor vehicle operator permit.',
      requiresBack: true,
      icon: FileText,
    },
    {
      id: 'RESIDENCE_PERMIT',
      title: 'Resident / Foreigner ID',
      badge: 'Immigration',
      desc: 'Valid diplomatic or resident alien identification card.',
      requiresBack: true,
      icon: CreditCard,
    },
  ];

  const handleProceed = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await identityVerificationApi.createCase({
        docType: selectedDocType,
        country: selectedCountry,
      });

      if (res?.alreadyVerified) {
        toast.info('You are already verified under an active case.');
        navigate('/identity-verification/status');
        return;
      }

      toast.success(`Verification case #${res.caseNumber} initiated.`);
      navigate(`/identity-verification/capture/${res.caseId}`, {
        state: {
          caseId: res.caseId,
          caseNumber: res.caseNumber,
          docType: selectedDocType,
          country: selectedCountry,
        },
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to initialize verification case.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-800">
        <BackButton />
        <div>
          <h1 className="text-2xl font-black text-white">Select Supported Document</h1>
          <p className="text-xs text-slate-400">Step 1 of 3: Choose issuing jurisdiction and ID category.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Country Selection */}
      <div className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Issuing Country / Region
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full sm:w-80 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="Ethiopia">Ethiopia (Federal Democratic Republic)</option>
          <option value="United States">United States</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Kenya">Kenya</option>
          <option value="United Arab Emirates">United Arab Emirates</option>
          <option value="Germany">Germany</option>
          <option value="China">China</option>
          <option value="Other">Other International Jurisdiction</option>
        </select>
      </div>

      {/* Document Selection Cards */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Choose Identification Document
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedDocType === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedDocType(opt.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition flex items-start space-x-4 ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">{opt.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{opt.desc}</p>
                  <p className="text-[10px] text-slate-500">
                    {opt.requiresBack ? 'Requires Front & Back Capture' : 'Requires Single Page Scan'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
        <button
          onClick={() => navigate('/identity-verification')}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleProceed}
          disabled={loading}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition flex items-center space-x-1.5"
        >
          <span>{loading ? 'Initializing Case...' : 'Continue to Capture'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
