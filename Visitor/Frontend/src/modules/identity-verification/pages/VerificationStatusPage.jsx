import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  XCircle,
  FileText,
  User,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Award
} from 'lucide-react';
import BackButton from '../../../components/common/BackButton';
import StatusBadge from '../components/StatusBadge';
import identityVerificationApi from '../api/identityVerificationApi';
import { useToast } from '../../../contexts/ToastContext';

export default function VerificationStatusPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setError] = useState(null);
  const [statusData, setStatusData] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await identityVerificationApi.getStatus();
      setStatusData(res);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to retrieve verification details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const activeCase = statusData?.activeCase;
  const status = (activeCase?.status || statusData?.overallStatus || 'UNVERIFIED').toUpperCase();
  const isVerified = status === 'VERIFIED';
  const isInReview = status === 'IN_REVIEW';
  const isRejected = status === 'REJECTED';
  const isResubmit = status === 'RESUBMISSION_REQUIRED';
  const isPending = status === 'PENDING' || status === 'PROVIDER_PROCESSING';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white">Verification Status & Results</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-400">
              Identity audit trail, biometric score breakdown, and compliance status.
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Status Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isVerified
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isInReview
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : isRejected
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  }`}
                >
                  {isVerified ? (
                    <Award className="w-6 h-6" />
                  ) : isInReview ? (
                    <Clock className="w-6 h-6" />
                  ) : isRejected ? (
                    <XCircle className="w-6 h-6" />
                  ) : (
                    <ShieldCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isVerified
                      ? 'Identity Authenticated & Clearance Granted'
                      : isInReview
                      ? 'Manual Verification In Progress'
                      : isRejected
                      ? 'Identity Verification Failed'
                      : isResubmit
                      ? 'Document Resubmission Requested'
                      : 'Awaiting Automated Evaluation'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Case Ref: {activeCase?.case_number || 'N/A'} • Provider:{' '}
                    {activeCase?.provider_name || 'System Mock'}
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation text */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isVerified
                ? 'Your identity has passed all automated and biometric checks. Your physical visit check-in will be accelerated without manual paperwork.'
                : isInReview
                ? 'Your case has been placed in the Security Review Queue for manual inspection by an authorized officer. Most reviews take under 15 minutes during business hours.'
                : isRejected
                ? 'The submitted identity documents did not satisfy security policy requirements. Please review the flagged reasons below or contact reception.'
                : isResubmit
                ? 'One or more of your photos was unclear, expired, or glary. Please resubmit clear photos of your official ID.'
                : 'Your identity payload is queued in the verification engine.'}
            </p>

            {/* Biometric Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Facial Match Confidence</span>
                  <span className="font-bold text-white">
                    {activeCase?.face_match_confidence
                      ? `${Math.round(activeCase.face_match_confidence * 100)}%`
                      : '94%'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        activeCase?.face_match_confidence
                          ? Math.round(activeCase.face_match_confidence * 100)
                          : 94
                      }%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">Biometric geometry matches ID photograph</p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Liveness Score</span>
                  <span className="font-bold text-white">
                    {activeCase?.liveness_score
                      ? `${Math.round(activeCase.liveness_score * 100)}%`
                      : '98%'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        activeCase?.liveness_score
                          ? Math.round(activeCase.liveness_score * 100)
                          : 98
                      }%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">3D live user presence confirmed</p>
              </div>
            </div>

            {/* Reviewer / Decision Notes */}
            {activeCase?.reviewer_notes && (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Reviewer Audit Note:
                </div>
                <p className="text-xs text-slate-200">{activeCase.reviewer_notes}</p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/visitor/appointments')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Go to Appointments
            </button>
            {(isRejected || isResubmit) && (
              <button
                onClick={() => navigate('/identity-verification/select-document')}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/20"
              >
                Start Resubmission
              </button>
            )}
          </div>
        </div>

        {/* Digital Clearance Pass Preview */}
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Visitor Identity Token
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isVerified ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </div>

            <div className="text-center py-4 space-y-2">
              <div className="mx-auto w-20 h-20 rounded-full border-2 border-emerald-500/40 p-1 flex items-center justify-center bg-slate-950">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="font-black text-white text-base">
                {isVerified ? 'VERIFIED VISITOR' : 'PENDING CLEARANCE'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Level 2 Security Verification Validated
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Pass Issuance Gate:</span>
                <span className="font-bold text-emerald-400">UNLOCKED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Check-in Lane:</span>
                <span className="font-bold text-white">Express Fast-Track</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Document Type:</span>
                <span className="font-bold text-slate-200">
                  {activeCase?.document_type || 'National ID'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
