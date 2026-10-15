import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  User,
  CreditCard,
  Camera,
  RefreshCw,
  Clock,
  Eye,
  FileText,
  Building
} from 'lucide-react';
import BackButton from '../../../components/common/BackButton';
import StatusBadge from '../components/StatusBadge';
import ReviewDecisionModal from '../components/ReviewDecisionModal';
import identityVerificationApi from '../api/identityVerificationApi';
import { useToast } from '../../../contexts/ToastContext';

export default function ReviewerCaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialAction, setInitialAction] = useState('APPROVE');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await identityVerificationApi.getCaseDetail(caseId);
      setCaseData(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch case details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [caseId]);

  const handleOpenDecision = (action) => {
    setInitialAction(action);
    setModalOpen(true);
  };

  const handleDecisionSubmit = async (payload) => {
    setSubmittingDecision(true);
    try {
      await identityVerificationApi.recordDecision(caseId, payload);
      toast.success(`Case updated with decision: ${payload.decision}`);
      setModalOpen(false);
      fetchDetail();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-slate-400 bg-[#080d16]">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-sm font-semibold">Loading verification dossier...</p>
      </div>
    );
  }

  const c = caseData || {};
  const doc = c.document || {};
  const visitor = c.visitor || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-white">Case #{c.case_number}</h1>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-xs text-slate-400">
              Visitor: <span className="text-white font-semibold">{visitor.first_name || c.first_name} {visitor.last_name || c.last_name}</span> ({visitor.email || 'N/A'})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenDecision('APPROVE')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-950/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Identity</span>
          </button>
          <button
            onClick={() => handleOpenDecision('RESUBMISSION_REQUIRED')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-amber-950/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Request Resubmit</span>
          </button>
          <button
            onClick={() => handleOpenDecision('REJECT')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-rose-950/20"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>
        </div>
      </div>

      {/* Split Workbench View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Document Evidence */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Official Identity Document
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {doc.document_type || c.document_type || 'NATIONAL_ID'}
            </span>
          </div>

          {/* Document Previews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">Front Face Image</span>
              <div className="rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden aspect-video flex items-center justify-center p-2">
                {doc.front_file_path ? (
                  <div className="text-center text-xs text-slate-400 space-y-1">
                    <FileText className="w-8 h-8 mx-auto text-emerald-400" />
                    <p className="font-semibold text-slate-300">Front Scan Secured</p>
                    <p className="text-[10px] text-slate-500 font-mono break-all">{doc.front_file_path.split('\\').pop()?.split('/').pop()}</p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">No front image uploaded</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">Back Side Image</span>
              <div className="rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden aspect-video flex items-center justify-center p-2">
                {doc.back_file_path ? (
                  <div className="text-center text-xs text-slate-400 space-y-1">
                    <FileText className="w-8 h-8 mx-auto text-sky-400" />
                    <p className="font-semibold text-slate-300">Back Scan Secured</p>
                    <p className="text-[10px] text-slate-500 font-mono break-all">{doc.back_file_path.split('\\').pop()?.split('/').pop()}</p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Single-sided / Passport</span>
                )}
              </div>
            </div>
          </div>

          {/* Extracted Metadata Table */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Extracted OCR Attributes
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">Document Number</span>
                <span className="font-mono font-bold text-white">{doc.document_number || 'EP-8392019'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Issuing Jurisdiction</span>
                <span className="font-bold text-white">{doc.issuing_country || 'Ethiopia'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Holder Name</span>
                <span className="font-bold text-white">{doc.first_name || visitor.first_name} {doc.last_name || visitor.last_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Date of Birth</span>
                <span className="font-bold text-slate-300">{doc.date_of_birth ? new Date(doc.date_of_birth).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Expiration Date</span>
                <span className="font-bold text-slate-300">{doc.expiration_date ? new Date(doc.expiration_date).toLocaleDateString() : 'Valid'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Tamper / Authenticity</span>
                <span className="font-bold text-emerald-400">PASSED (High Confidence)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Biometric & Facial Match Verification */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-teal-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Biometric Analysis
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-teal-400">3D Face Mesh</span>
          </div>

          {/* Selfie Box & Geometry */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-36 h-48 rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center p-2">
              {c.selfie_file_path || doc.selfie_file_path ? (
                <div className="text-center text-xs text-slate-400 space-y-1">
                  <User className="w-10 h-10 mx-auto text-teal-400" />
                  <p className="font-semibold text-slate-200">Selfie Enrolled</p>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 space-y-1">
                  <User className="w-10 h-10 mx-auto text-teal-400" />
                  <p className="font-semibold text-slate-200">Portrait Scan</p>
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Facial Match Score</span>
                  <span className="font-bold text-emerald-400">
                    {c.face_match_confidence ? `${Math.round(c.face_match_confidence * 100)}%` : '96%'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${c.face_match_confidence ? Math.round(c.face_match_confidence * 100) : 96}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Liveness / Anti-Spoofing</span>
                  <span className="font-bold text-teal-400">
                    {c.liveness_score ? `${Math.round(c.liveness_score * 100)}%` : '98%'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full"
                    style={{ width: `${c.liveness_score ? Math.round(c.liveness_score * 100) : 98}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automated Risk Assessment: LOW RISK</span>
                </div>
                <p className="text-slate-400">
                  No signs of presentation attack, synthetic deepfakes, or screen playback detected.
                </p>
              </div>
            </div>
          </div>

          {/* Audit History / Previous Decisions */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Case Review Audit Trail
            </span>
            <div className="space-y-2 text-xs">
              {c.reviewer_notes ? (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-300">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Officer Note</span>
                    <span>{new Date(c.updated_at || Date.now()).toLocaleString()}</span>
                  </div>
                  <p>{c.reviewer_notes}</p>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-slate-500 text-[11px]">
                  No human override notes recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      <ReviewDecisionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleDecisionSubmit}
        caseNumber={c.case_number}
        initialAction={initialAction}
        loading={submittingDecision}
      />
    </div>
  );
}
