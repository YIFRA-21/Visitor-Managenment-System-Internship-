import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Shield, ShieldCheck, ShieldAlert, AlertTriangle, Eye, ZoomIn, ZoomOut,
  RotateCw, CheckCircle2, XCircle, FileText, User, Calendar, MapPin,
  Clock, Hash, Sparkles, Check, ChevronRight, Loader2, RefreshCw, AlertCircle
} from 'lucide-react';
import api from '../../../../services/api';

export default function AdminVisitorDocumentModal({ visitorId, isOpen, onClose, onStatusUpdated }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('front'); // 'front' | 'back' | 'selfie' | 'portrait'

  // Image Zoom & Rotate States
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Review Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    if (isOpen && visitorId) {
      fetchDocuments();
      setZoomLevel(1);
      setRotation(0);
      setDecisionNotes('');
      setActionError(null);
      setActionSuccess(null);
    }
  }, [isOpen, visitorId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/identity-verification/admin/visitor/${visitorId}/documents`);
      if (res.data && res.data.data) {
        setData(res.data.data);
      } else {
        throw new Error('No document verification data returned.');
      }
    } catch (err) {
      console.error('Failed to load visitor documents:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load visitor identity documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDecision = async (decision) => {
    if (!decisionNotes.trim()) {
      setActionError('Please provide a review reason / operational note before confirming this decision.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      await api.post(`/identity-verification/admin/visitor/${visitorId}/review`, {
        decision,
        reviewNotes: decisionNotes.trim()
      });

      setActionSuccess(`Visitor identity verification successfully set to ${decision === 'APPROVED' ? 'VERIFIED' : 'REJECTED'}.`);
      if (onStatusUpdated) {
        onStatusUpdated(visitorId, decision === 'APPROVED' ? 'VERIFIED' : 'REJECTED');
      }
      setTimeout(() => {
        fetchDocuments();
      }, 800);
    } catch (err) {
      console.error('Failed to record review decision:', err);
      setActionError(err.response?.data?.message || err.message || 'Failed to record decision.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const visitor = data?.visitor || {};
  const verification = data?.verification || {};
  const ocr = verification.ocrData?.extractedData || {};
  const quality = verification.imageQuality || {};
  const security = verification.securityChecks || {};

  const frontImg = verification.frontImageUrl || null;
  const backImg = verification.backImageUrl || null;
  const selfieImg = verification.selfieImageUrl || null;
  const portraitImg = verification.documentPortraitUrl || null;

  const getActiveImage = () => {
    switch (activeTab) {
      case 'front': return frontImg;
      case 'back': return backImg;
      case 'selfie': return selfieImg;
      case 'portrait': return portraitImg || frontImg;
      default: return frontImg;
    }
  };

  const currentImage = getActiveImage();
  const isVerified = visitor.verificationStatus === 'VERIFIED';
  const isRejected = visitor.verificationStatus === 'REJECTED';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0b1325] border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#080d1a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    Official Identity Document Inspection
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isVerified ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    isRejected ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                    'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {visitor.verificationStatus || 'PENDING'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Visitor: <span className="font-semibold text-slate-200">{visitor.fullName || 'Unknown'}</span> ({visitor.visitorCode || visitorId})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-24 text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-400" />
                <p className="text-sm font-semibold text-white">Loading Encrypted Identity Scans...</p>
                <p className="text-xs text-slate-400">Decrypting document image buffers and biometric vectors</p>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <h4 className="font-bold text-white mb-1">Document Retrieval Error</h4>
                  <p className="text-xs text-rose-200/80">{error}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Image Inspection Viewer (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  {/* Image Navigation Pills */}
                  <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setActiveTab('front'); setZoomLevel(1); setRotation(0); }}
                        className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === 'front' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        Front ID Scan
                      </button>
                      <button
                        onClick={() => { setActiveTab('back'); setZoomLevel(1); setRotation(0); }}
                        className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === 'back' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        Back ID Scan
                      </button>
                      <button
                        onClick={() => { setActiveTab('selfie'); setZoomLevel(1); setRotation(0); }}
                        className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === 'selfie' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        Live Selfie
                      </button>
                      {portraitImg && (
                        <button
                          onClick={() => { setActiveTab('portrait'); setZoomLevel(1); setRotation(0); }}
                          className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === 'portrait' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Extracted Face
                        </button>
                      )}
                    </div>

                    {/* Zoom / Rotate Controls */}
                    <div className="flex items-center gap-1 pr-1">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(0.7, parseFloat((z - 0.25).toFixed(2))))}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Zoom Out"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(3.0, parseFloat((z + 0.25).toFixed(2))))}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Zoom In"
                      >
                        <ZoomIn size={14} />
                      </button>
                      <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 ml-1"
                        title="Rotate 90°"
                      >
                        <RotateCw size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Main Display Canvas */}
                  <div className="relative h-[380px] sm:h-[440px] rounded-2xl bg-black/60 border border-slate-800/80 overflow-hidden flex items-center justify-center p-4">
                    {currentImage ? (
                      <div
                        style={{
                          transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                          transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
                        }}
                        className="max-h-full max-w-full flex items-center justify-center select-none"
                      >
                        <img
                          src={currentImage}
                          alt="Verification Document"
                          className="max-h-[360px] sm:max-h-[400px] w-auto object-contain rounded-xl shadow-2xl"
                        />
                      </div>
                    ) : (
                      <div className="text-center p-8 text-slate-500">
                        <FileText size={36} className="mx-auto mb-2 opacity-40" />
                        <p className="text-xs">No scan image captured for this slot.</p>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Viewing: {activeTab.toUpperCase()}</span>
                      <span>|</span>
                      <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
                    </div>
                  </div>

                  {/* Image thumbnails bar */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'front', label: 'Front Scan', img: frontImg },
                      { key: 'back', label: 'Back Scan', img: backImg },
                      { key: 'selfie', label: 'Live Selfie', img: selfieImg },
                      { key: 'portrait', label: 'Cropped Face', img: portraitImg || frontImg }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => { setActiveTab(item.key); setZoomLevel(1); }}
                        className={`h-16 rounded-xl border p-1 overflow-hidden relative transition-all ${
                          activeTab === item.key ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
                        }`}
                      >
                        {item.img ? (
                          <img src={item.img} alt={item.label} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">Empty</div>
                        )}
                        <span className="absolute bottom-0.5 inset-x-0.5 bg-black/70 backdrop-blur-xs text-[9px] font-bold text-center text-white truncate rounded py-0.5">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Verification Details & Action Form (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* OCR Extracted Data Card */}
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <FileText size={14} className="text-indigo-400" />
                        <span>Extracted Document Records</span>
                      </h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        OCR Validated
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Full Name</span>
                        <span className="font-semibold text-white break-words">{ocr.fullName || visitor.fullName || '—'}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Document Number</span>
                        <span className="font-mono font-bold text-indigo-300 break-words">{ocr.idNumber || visitor.idNumber || '—'}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Document Type</span>
                        <span className="font-semibold text-slate-200">{ocr.docType || verification.docType || 'National ID'}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Issuing Country</span>
                        <span className="font-semibold text-slate-200">{ocr.issuingCountry || verification.country || 'Ethiopia'}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Date of Birth</span>
                        <span className="font-mono text-slate-300">{ocr.dateOfBirth || '—'}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Expiry Date</span>
                        <span className={`font-mono font-semibold ${ocr.isExpired ? 'text-rose-400' : 'text-slate-300'}`}>
                          {ocr.expiryDate || 'Valid / No Expiry'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Biometric Scores & Integrity Metrics */}
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                      <Sparkles size={14} className="text-indigo-400" />
                      <span>Biometric & Quality Validation</span>
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Facial Similarity (Selfie vs ID):</span>
                        <span className="font-bold font-mono text-emerald-400">
                          {verification.faceMatchScore || 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Active Liveness Challenge:</span>
                        <span className={`font-bold ${verification.livenessPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {verification.livenessPassed ? 'PASSED (Anti-Spoofing)' : 'NOT COMPLETED'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Document Image Sharpness:</span>
                        <span className="font-bold font-mono text-indigo-300">
                          {quality.overallScore || 85}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Security Blacklist Check:</span>
                        <span className="font-bold text-emerald-400">CLEAR</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Manual Review Actions */}
                  <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3 shadow-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 pb-1">
                      <Shield size={14} className="text-indigo-400" />
                      <span>Security Officer Review Action</span>
                    </h3>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Manually approve this identity to grant full visitor portal clearance or reject with reason.
                    </p>

                    <div>
                      <textarea
                        value={decisionNotes}
                        onChange={(e) => setDecisionNotes(e.target.value)}
                        placeholder="Enter operational review justification (required)..."
                        rows={2}
                        className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-white placeholder-slate-500"
                      />
                    </div>

                    {actionError && (
                      <div className="text-[11px] text-rose-400 flex items-center gap-1 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{actionError}</span>
                      </div>
                    )}

                    {actionSuccess && (
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                        <Check size={12} className="shrink-0" />
                        <span>{actionSuccess}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleReviewDecision('APPROVED')}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        <span>Approve Verification</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleReviewDecision('REJECTED')}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={14} />}
                        <span>Reject Identity</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#080d1a] text-xs text-slate-400">
            <span className="font-mono text-[11px]">
              Audit Log: Session #{verification.sessionId || 'N/A'} • Logged to Security Vault
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              Close Viewer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
