import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileText,
  Lock,
  User,
  Shield,
  HelpCircle,
  QrCode
} from 'lucide-react';
import BackButton from '../../../components/common/BackButton';
import StatusBadge from '../components/StatusBadge';
import PrivacyConsentModal from '../components/PrivacyConsentModal';
import identityVerificationApi from '../api/identityVerificationApi';
import { useToast } from '../../../contexts/ToastContext';

export default function IdentityVerificationOverviewPage({ hideBackButton = false, isEmbedded = false }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showConsent, setShowConsent] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await identityVerificationApi.getStatus();
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch identity verification status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartFlow = () => {
    setShowConsent(true);
  };

  const handleConsentAccepted = () => {
    setShowConsent(false);
    navigate('/identity-verification/select-document');
  };

  const status = (data?.overallStatus || 'UNVERIFIED').toUpperCase();
  const isVerified = status === 'VERIFIED';
  const isPending = status === 'PENDING' || status === 'PROVIDER_PROCESSING';
  const isReview = status === 'IN_REVIEW';

  return (
    <div className={isEmbedded ? "space-y-6 text-slate-100 font-sans" : "p-4 sm:p-6 lg:p-8 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          {!hideBackButton && !isEmbedded && <BackButton />}
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Official Identity Verification
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Security Compliance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify your official identity to expedite security clearance and unlock instant digital visitor pass issuance.
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Main Status Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1527] to-[#070c18] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Verification Status
                </p>
                <div className="mt-0.5">
                  <StatusBadge status={status} />
                </div>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              {isVerified
                ? 'Your Identity is Authenticated & Verified'
                : isPending
                ? 'Verification Case Under Automated Review'
                : isReview
                ? 'Manual Review in Progress by Security Officer'
                : 'Complete Identity Verification for Seamless Access'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isVerified
                ? 'You meet all organizational compliance standards. Your digital visitor passes can now be generated automatically for confirmed appointments.'
                : isPending
                ? 'Your submitted identity document and biometric scan are being evaluated against security rules. You will be notified once complete.'
                : isReview
                ? 'An authorized security officer is manually inspecting your documents to confirm entry authorization. No further action is required from you.'
                : 'Upload an accepted passport or national ID and perform a quick biometric selfie to obtain verified visitor status.'}
            </p>

            {/* Case details if existing */}
            {data?.activeCase && (
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
                <span>Case: <strong className="text-slate-200">{data.activeCase.case_number}</strong></span>
                <span>Started: <strong className="text-slate-200">{new Date(data.activeCase.started_at).toLocaleDateString()}</strong></span>
                <span>Provider: <strong className="text-slate-200">{data.activeCase.provider_name}</strong></span>
              </div>
            )}
          </div>

          {/* Call to action */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
            {!isVerified && !isPending && (
              <button
                onClick={handleStartFlow}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold shadow-xl shadow-emerald-900/30 border border-emerald-500/30 transition transform active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>{status === 'RESUBMISSION_REQUIRED' ? 'Resubmit Verification' : 'Start Identity Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {isVerified && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Verified Visitor Pass Entitlement Active</span>
              </div>
            )}

            {data?.activeCase && (
              <button
                onClick={() => navigate('/identity-verification/status')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition text-center"
              >
                View Detailed Case Results
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Step Process Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
            01
          </div>
          <h3 className="font-bold text-white text-sm">Select Supported Document</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Choose your issuing country and document type (Passport, Ethiopian Fayda/National ID, Driver's License).
          </p>
        </div>

        <div className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
            02
          </div>
          <h3 className="font-bold text-white text-sm">Secure Capture & Upload</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Capture clear front and back photos of your ID. Private partitions and hash verification ensure security.
          </p>
        </div>

        <div className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            03
          </div>
          <h3 className="font-bold text-white text-sm">Biometric Liveness & Match</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Take a quick selfie to perform 3D liveness detection and automated facial match comparison.
          </p>
        </div>
      </div>

      {/* Consent Modal */}
      <PrivacyConsentModal
        isOpen={showConsent}
        onClose={() => setShowConsent(false)}
        onAccept={handleConsentAccepted}
      />
    </div>
  );
}
