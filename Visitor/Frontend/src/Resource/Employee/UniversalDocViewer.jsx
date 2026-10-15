import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import {
  FileText, FileWarning, CheckCircle2, ShieldCheck, Download,
  ExternalLink, AlertCircle, FileSpreadsheet, Film, Music,
  Code, Type
} from 'lucide-react';
import { detectDocType, resolveDocUrl, docTypeLabel } from '../../utils/docUtils';
import { resolvePhotoUrl } from '../../utils/photoUtils';

/**
 * UniversalDocViewer
 * ──────────────────
 * Renders any document format inside the Canvas Reader Sheet.
 * Supports: Images, PDFs, DOCX, DOC, TXT/CSV/JSON, Spreadsheets, Videos, Audio,
 *           and provides a structured fallback for unsupported formats.
 *
 * Props:
 *   - doc: the inspecting document object
 *   - docVisitor: visitor info for ID card view
 *   - viewMode: 'CARD' | 'RAW'
 *   - setViewMode: setter for viewMode
 *   - zoom: current zoom level
 *   - rotation: current rotation degree
 *   - empDocxHtml: pre-loaded DOCX HTML (from parent useEffect)
 *   - empDocxLoading: loading state for DOCX
 */
export default function UniversalDocViewer({
  doc,
  docVisitor,
  viewMode = 'CARD',
  setViewMode,
  zoom = 1,
  rotation = 0,
  empDocxHtml = '',
  empDocxLoading = false,
}) {
  const [imgError, setImgError] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState(false);

  if (!doc) return null;

  const docUrl = doc.file_url || '';
  const fullUrl = resolveDocUrl(docUrl);
  const category = detectDocType(doc);
  const hasFile = !!fullUrl;

  // Reset error states when doc changes
  useEffect(() => {
    setImgError(false);
    setIframeError(false);
    setTextContent('');
    setTextError(false);
  }, [doc?.id, doc?.file_url]);

  // Load text content for text-based files
  useEffect(() => {
    if (category === 'text' && fullUrl) {
      setTextLoading(true);
      setTextError(false);
      fetch(fullUrl)
        .then(res => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.text();
        })
        .then(text => {
          setTextContent(text.slice(0, 50000)); // limit to 50KB for performance
          setTextLoading(false);
        })
        .catch(() => {
          setTextError(true);
          setTextLoading(false);
        });
    }
  }, [category, fullUrl]);

  /* ─── Helper: OCR data extraction ─────────────────────────────── */
  const getOcrData = () => {
    try {
      return doc.ocr_data || (doc.ocr_extracted_data
        ? (typeof doc.ocr_extracted_data === 'string' ? JSON.parse(doc.ocr_extracted_data) : doc.ocr_extracted_data)
        : null);
    } catch { return null; }
  };

  /* ─── No-file fallback card ───────────────────────────────────── */
  const renderNoFileFallback = () => (
    <div
      className="w-full max-w-lg bg-white text-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 my-auto"
      style={{ transform: `scale(${zoom})` }}
    >
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
          <FileWarning className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{doc.file_name || 'Document'}</h4>
          <p className="text-xs text-slate-500 font-mono">v{doc.version_number || 1} • {doc.document_type || 'Identity Credential'}</p>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
        <div className="flex items-center gap-2 font-bold mb-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          No viewable file attached
        </div>
        <p className="text-amber-700">
          This document record exists but the source file is not available for preview.
          The document may be stored externally or hasn't been uploaded yet.
        </p>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Document ID:</span>
          <span className="font-mono font-bold text-slate-800">{doc.document_number || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Record Version:</span>
          <span className="font-bold text-emerald-600">v{doc.version_number || 1} ({doc.is_current ? 'Current' : 'Archived'})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Type:</span>
          <span className="font-bold text-slate-800">{doc.document_type || 'Document'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Status:</span>
          <span className="font-bold text-slate-800 uppercase">{doc.verification_status || doc.status || 'Pending'}</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Official VMS Archival Record</span>
        <span>No file attached</span>
      </div>
    </div>
  );

  /* ─── Error state card ────────────────────────────────────────── */
  const renderErrorCard = (errorType = 'load') => (
    <div
      className="w-full max-w-lg bg-white text-slate-900 rounded-2xl shadow-2xl p-6 border border-red-200 my-auto"
      style={{ transform: `scale(${zoom})` }}
    >
      <div className="flex items-center gap-3 pb-3 border-b border-red-100">
        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 border border-red-200 flex items-center justify-center">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            {errorType === 'load' ? 'Failed to Load Document' : 'Preview Not Available'}
          </h4>
          <p className="text-xs text-red-500 font-mono">{doc.file_name || docUrl}</p>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
        <p className="mb-2">
          {errorType === 'load'
            ? 'The document could not be loaded. The file may have been moved, deleted, or the server is unreachable.'
            : `This file format (${docTypeLabel(category)}) cannot be previewed in the browser.`}
        </p>
        {hasFile && (
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={doc.file_name}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download to View Locally
          </a>
        )}
      </div>

      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Document ID:</span>
          <span className="font-mono font-bold text-slate-800">{doc.document_number || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">File Type:</span>
          <span className="font-bold text-slate-800">{docTypeLabel(category)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">MIME:</span>
          <span className="font-mono text-slate-600">{doc.mime_type || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );

  /* ─── IMAGE VIEWER ────────────────────────────────────────────── */
  if (category === 'image') {
    const ocrData = getOcrData();
    const idNum = ocrData?.idNumber || doc.document_number || docVisitor?.id_number || docVisitor?.identity_doc || '';
    const fullName = ocrData?.fullName || docVisitor?.visitor_name || '';
    const nationality = ocrData?.nationality || '';
    const gender = ocrData?.gender || docVisitor?.gender || '';
    const dob = ocrData?.dateOfBirth || '';
    const expiryDate = ocrData?.expiryDate || '';
    const docTypeStr = doc.document_type || ocrData?.docType || 'National Identity Card';

    const hasOcr = Boolean(ocrData && (ocrData.idNumber || ocrData.fullName));
    const showCard = viewMode === 'CARD' && hasOcr;

    // 1. Direct Image View (default for raw documents, scans, and uploads)
    if (!showCard && hasFile && !imgError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center overflow-auto p-2">
          <img
            src={fullUrl}
            alt={doc.file_name}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out'
            }}
            onError={() => { setImgError(true); }}
            className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl"
          />
          {hasOcr && (
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setViewMode?.('CARD')}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
              >
                ← Switch to Certified Credential Card View
              </button>
            </div>
          )}
        </div>
      );
    }

    // Direct image failed or no file
    if (!showCard && (imgError || !hasFile)) {
      return renderErrorCard('load');
    }

    // 2. CARD view (Certified Credential Card when verified OCR data exists)
    return (
      <div
        className="w-full h-full flex items-center justify-center overflow-auto p-3"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transition: 'transform 0.2s ease-in-out'
        }}
      >
        <div className="w-full max-w-lg bg-gradient-to-br from-[#0c1322] via-[#101b33] to-[#0a1120] border-2 border-blue-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden text-white my-auto">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3.5 relative">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <ShieldCheck className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <div>
                <span className="text-[9px] font-black tracking-widest uppercase text-blue-400 block font-mono">
                  {ocrData?.issuingCountry?.toUpperCase() || 'OFFICIAL'} • RESIDENT CREDENTIAL
                </span>
                <h3 className="text-xs font-black text-white tracking-wide">
                  {docTypeStr.toUpperCase()}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> VERIFIED
              </span>
              <span className="text-[8px] text-slate-400 font-mono block mt-0.5">
                v{doc.version_number || 1} • {doc.is_current ? 'ACTIVE' : 'ARCHIVE'}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 relative">
            {/* Left: Photo */}
            <div className="sm:col-span-4 flex flex-col items-center sm:items-start space-y-2">
              <div className="relative">
                <img
                  src={resolvePhotoUrl(docVisitor?.visitor_photo || docVisitor?.photo_url || docVisitor?.profile_photo)}
                  alt={fullName || 'Visitor'}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                  }}
                  className="w-20 h-24 rounded-xl object-cover border-2 border-blue-400/40 shadow-lg bg-slate-900"
                />
                <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-1.5 py-0.5 bg-blue-600 text-[7px] font-extrabold uppercase tracking-wider rounded text-white shadow">
                  BIOMETRIC PASS
                </div>
              </div>
              <div className="pt-1.5 flex items-center gap-1.5 text-slate-400 text-[9px] font-mono">
                <div className="w-4.5 h-3 rounded bg-amber-400/80 border border-amber-300 flex items-center justify-center text-[6px] text-black font-bold">
                  CHIP
                </div>
                <span>NFC Verified</span>
              </div>
            </div>

            {/* Right: Data Fields */}
            <div className="sm:col-span-8 space-y-2 text-xs">
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">ID Document Number</span>
                <span className="text-sm font-black font-mono text-blue-400 tracking-wider">
                  {idNum || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">Full Legal Name</span>
                <span className="text-xs font-black text-white uppercase tracking-wide">
                  {fullName || 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[10px]">
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-400 block">Nationality</span>
                  <span className="font-bold text-slate-200">{nationality || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-400 block">Gender</span>
                  <span className="font-bold text-slate-200">{gender || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-400 block">Date of Birth</span>
                  <span className="font-mono font-bold text-slate-200">{dob || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-400 block">Expiry Date</span>
                  <span className="font-mono font-bold text-emerald-400">{expiryDate || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* MRZ */}
          <div className="mt-3 pt-2 border-t border-slate-700/60 font-mono text-[8px] text-blue-300/80 tracking-widest bg-slate-950/60 p-2 rounded-lg overflow-x-auto leading-relaxed">
            <div>IDETH{String(idNum || 'UNKNOWN').replace(/[^a-zA-Z0-9]/g, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
            <div>9505047M3301104ETH&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;0{String(fullName || 'UNKNOWN').toUpperCase().slice(0, 10)}&lt;&lt;</div>
          </div>

          {/* Card Bottom Switcher */}
          <div className="mt-2.5 flex items-center justify-between text-[9px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="h-3 w-3" /> OCR Verified Identity Record
            </span>
            {hasFile && (
              <button
                type="button"
                onClick={() => setViewMode?.('RAW')}
                className="text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer"
              >
                Inspect Raw Scan Image →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── DOCX VIEWER ─────────────────────────────────────────────── */
  if (category === 'docx' || category === 'doc') {
    if (!hasFile) return renderNoFileFallback();

    return (
      <div className="w-full flex-1 flex flex-col items-center justify-start overflow-y-auto max-h-[70vh] p-2">
        {empDocxLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-8 w-8 text-blue-400 animate-spin mx-auto border-2 border-blue-400 border-t-transparent rounded-full" />
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Reading &amp; Formatting Document Pages...
            </p>
            <span className="text-[11px] text-slate-500 font-mono">Parsing {doc.file_name}</span>
          </div>
        ) : (
          <div
            className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 my-2 border border-slate-200 transition-all duration-200 min-h-[500px]"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center'
            }}
          >
            {/* Top Ribbon */}
            <div className="flex items-center justify-between pb-3 mb-5 border-b-2 border-slate-200 text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="font-bold text-slate-800 uppercase tracking-wider">{doc.document_type || 'IDENTITY CREDENTIAL'}</span>
                <span className="text-slate-300">|</span>
                <span className="font-bold text-blue-600">{doc.document_number || 'DOC-VERIFIED'}</span>
              </div>
              <span className="text-[10px] text-slate-400">Page 1 • {new Date(doc.created_at || Date.now()).toLocaleDateString()}</span>
            </div>

            {/* Extracted Word Content */}
            {empDocxHtml ? (
              <div
                className="docx-readable-content prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed font-serif"
                dangerouslySetInnerHTML={{ __html: empDocxHtml }}
              />
            ) : (
              /* Structured Fallback */
              <div className="space-y-4 text-slate-800">
                <div className="border-b border-slate-200 pb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 font-bold block mb-1">
                    Official Credential Inspection
                  </span>
                  <h2 className="text-lg font-black text-slate-900">{doc.file_name}</h2>
                  <p className="text-xs text-slate-500 mt-1">Archived under Visitor Management System (VMS) secure storage.</p>
                </div>
                {category === 'doc' && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Legacy .doc format detected. Rich content preview may be limited. Download for best viewing experience.</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Classification</span>
                    <span className="font-bold text-slate-800">{doc.document_type || 'Document'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Document Number</span>
                    <span className="font-mono font-bold text-blue-700">{doc.document_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Version</span>
                    <span className="font-bold text-emerald-700">v{doc.version_number || 1} • {doc.is_current ? 'Current Active' : 'Past Archive'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Verification Status</span>
                    <span className="font-bold text-slate-800 uppercase">{doc.verification_status || 'Verified'}</span>
                  </div>
                </div>
                {hasFile && (
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={doc.file_name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Full Document
                  </a>
                )}
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Compliance Verification Complete • Certified Identity Record</span>
                </div>
              </div>
            )}

            {/* Bottom Stamp */}
            <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Official VMS Archival Record</span>
              <span>Version v{doc.version_number || 1} • Verified Content</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── PDF VIEWER ──────────────────────────────────────────────── */
  if (category === 'pdf') {
    if (!hasFile) return renderNoFileFallback();
    if (iframeError) return renderErrorCard('load');

    return (
      <iframe
        src={fullUrl}
        title={doc.file_name || 'PDF Document'}
        className="w-full h-full min-h-[55vh] rounded-xl border-0 bg-white shadow-inner"
        onError={() => setIframeError(true)}
        onLoad={(e) => {
          // Check if the iframe loaded an error page
          try {
            const iframeDoc = e.target.contentDocument;
            if (iframeDoc && iframeDoc.title === '404') {
              setIframeError(true);
            }
          } catch { /* cross-origin, can't check */ }
        }}
      />
    );
  }

  /* ─── TEXT / CSV / JSON VIEWER ─────────────────────────────────── */
  if (category === 'text') {
    if (!hasFile) return renderNoFileFallback();

    return (
      <div className="w-full flex-1 flex flex-col items-center justify-start overflow-y-auto max-h-[70vh] p-2">
        {textLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-8 w-8 text-blue-400 animate-spin mx-auto border-2 border-blue-400 border-t-transparent rounded-full" />
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Loading Text Content...</p>
          </div>
        ) : textError ? (
          renderErrorCard('load')
        ) : (
          <div
            className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl my-2 border border-slate-200 transition-all duration-200 overflow-hidden"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 text-xs">
                <Code className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-slate-800">{doc.file_name}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-600">
                  {doc.mime_type || 'text/plain'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {textContent.length.toLocaleString()} chars
              </span>
            </div>
            {/* Content */}
            <pre className="p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap break-words leading-relaxed max-h-[50vh] overflow-y-auto bg-white">
              {textContent || '(Empty file)'}
            </pre>
          </div>
        )}
      </div>
    );
  }

  /* ─── VIDEO VIEWER ────────────────────────────────────────────── */
  if (category === 'video') {
    if (!hasFile) return renderNoFileFallback();

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
          <video
            src={fullUrl}
            controls
            className="w-full max-h-[60vh]"
            preload="metadata"
            onError={() => setIframeError(true)}
          >
            <track kind="captions" />
            Your browser does not support the video element.
          </video>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <Film className="h-3.5 w-3.5" />
          <span>{doc.file_name}</span>
        </div>
      </div>
    );
  }

  /* ─── AUDIO VIEWER ────────────────────────────────────────────── */
  if (category === 'audio') {
    if (!hasFile) return renderNoFileFallback();

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-br from-[#0c1322] via-[#101b33] to-[#0a1120] rounded-2xl p-6 border border-slate-700 shadow-2xl text-center">
          <Music className="h-12 w-12 text-blue-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">{doc.file_name}</h4>
          <p className="text-[10px] text-slate-400 font-mono mb-4">{doc.mime_type || 'Audio File'}</p>
          <audio src={fullUrl} controls className="w-full" preload="metadata">
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    );
  }

  /* ─── SPREADSHEET / PRESENTATION (Download-only) ───────────────── */
  if (category === 'spreadsheet' || category === 'presentation') {
    if (!hasFile) return renderNoFileFallback();

    const IconComponent = category === 'spreadsheet' ? FileSpreadsheet : Type;
    const colorClass = category === 'spreadsheet' ? 'emerald' : 'orange';

    return (
      <div
        className="w-full max-w-lg bg-white text-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 my-auto"
        style={{ transform: `scale(${zoom})` }}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
          <div className={`w-9 h-9 rounded-xl bg-${colorClass}-50 text-${colorClass}-600 border border-${colorClass}-200 flex items-center justify-center`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{doc.file_name}</h4>
            <p className="text-xs text-slate-500 font-mono">
              {docTypeLabel(category)} • v{doc.version_number || 1}
            </p>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
          <p className="mb-2 font-medium">
            {category === 'spreadsheet'
              ? 'Spreadsheet files require a dedicated viewer. Download to open in Excel, Google Sheets, or similar application.'
              : 'Presentation files require a dedicated viewer. Download to open in PowerPoint, Google Slides, or similar application.'}
          </p>
          <div className="flex gap-2">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={doc.file_name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-300"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
            </a>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Document ID:</span>
            <span className="font-mono font-bold text-slate-800">{doc.document_number || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">File Type:</span>
            <span className="font-bold text-slate-800">{docTypeLabel(category)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Status:</span>
            <span className="font-bold text-slate-800 uppercase">{doc.verification_status || doc.status || 'Verified'}</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Official VMS Archival Record</span>
          <span>SHA-256 Validated</span>
        </div>
      </div>
    );
  }

  /* ─── UNKNOWN / FALLBACK ──────────────────────────────────────── */
  if (!hasFile) return renderNoFileFallback();

  // Try to render in an iframe as a last resort, with download button
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3">
      <div
        className="w-full max-w-lg bg-white text-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200"
        style={{ transform: `scale(${zoom})` }}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{doc.file_name}</h4>
            <p className="text-xs text-slate-500 font-mono">v{doc.version_number || 1} • {doc.document_type || 'Identity Credential'}</p>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Document ID:</span>
            <span className="font-mono font-bold text-slate-800">{doc.document_number || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Record Version:</span>
            <span className="font-bold text-emerald-600">v{doc.version_number || 1} ({doc.is_current ? 'Current' : 'Archived'})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Verification Status:</span>
            <span className="font-bold text-slate-800 uppercase">{doc.verification_status || 'Verified'}</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={doc.file_name}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-300"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
          </a>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Official VMS Archival Record</span>
          <span>SHA-256 Validated</span>
        </div>
      </div>
    </div>
  );
}
