/**
 * Universal Document Utilities
 * ─────────────────────────────
 * Robust file-type detection and URL resolution for the document viewer.
 */

import { getBackendBaseUrl } from './apiUrl';

/* ── File extension helpers ──────────────────────────────────────── */

const ext = (name) => {
  if (!name) return '';
  const match = String(name).match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
};

const extFromUrl = (url) => {
  if (!url) return '';
  try {
    // strip query string and hash, then extract extension
    const cleaned = url.split('?')[0].split('#')[0];
    return ext(cleaned);
  } catch {
    return '';
  }
};

/* ── MIME / extension classification ─────────────────────────────── */

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'tiff', 'tif', 'heic', 'heif', 'avif', 'ico']);
const PDF_EXTS = new Set(['pdf']);
const DOCX_EXTS = new Set(['docx']);
const DOC_EXTS = new Set(['doc']); // binary Word — mammoth can't parse these
const SPREADSHEET_EXTS = new Set(['xlsx', 'xls', 'csv', 'tsv']);
const PRESENTATION_EXTS = new Set(['pptx', 'ppt', 'odp']);
const TEXT_EXTS = new Set(['txt', 'rtf', 'log', 'md', 'json', 'xml', 'html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'yml', 'yaml', 'ini', 'cfg', 'conf', 'sh', 'bat', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'sql']);
const VIDEO_EXTS = new Set(['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac', 'wma', 'm4a']);

/**
 * Detect the document category from mime_type, file_url, and file_name.
 * Returns one of: 'image' | 'pdf' | 'docx' | 'doc' | 'spreadsheet' | 'presentation' | 'text' | 'video' | 'audio' | 'unknown'
 */
export function detectDocType(doc) {
  if (!doc) return 'unknown';
  const mime = (doc.mime_type || '').toLowerCase();
  const urlExt = extFromUrl(doc.file_url);
  const nameExt = ext(doc.file_name);
  const fileExt = urlExt || nameExt;

  // MIME-based detection first (most reliable)
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.includes('wordprocessingml') || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (mime.includes('msword') || mime === 'application/msword') return 'doc';
  if (mime.includes('spreadsheetml') || mime.includes('ms-excel') || mime === 'text/csv') return 'spreadsheet';
  if (mime.includes('presentationml') || mime.includes('ms-powerpoint')) return 'presentation';
  if (mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml') return 'text';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';

  // Extension-based fallback
  if (IMAGE_EXTS.has(fileExt)) return 'image';
  if (PDF_EXTS.has(fileExt)) return 'pdf';
  if (DOCX_EXTS.has(fileExt)) return 'docx';
  if (DOC_EXTS.has(fileExt)) return 'doc';
  if (SPREADSHEET_EXTS.has(fileExt)) return 'spreadsheet';
  if (PRESENTATION_EXTS.has(fileExt)) return 'presentation';
  if (TEXT_EXTS.has(fileExt)) return 'text';
  if (VIDEO_EXTS.has(fileExt)) return 'video';
  if (AUDIO_EXTS.has(fileExt)) return 'audio';

  return 'unknown';
}

/**
 * Get a human-readable label for a doc type category.
 */
export function docTypeLabel(category) {
  const labels = {
    image: 'Image',
    pdf: 'PDF Document',
    docx: 'Word Document (.docx)',
    doc: 'Word Document (.doc)',
    spreadsheet: 'Spreadsheet',
    presentation: 'Presentation',
    text: 'Text File',
    video: 'Video',
    audio: 'Audio',
    unknown: 'Document'
  };
  return labels[category] || 'Document';
}

/**
 * Resolve a document's file_url into a full, fetchable URL.
 * Returns null if the URL is empty/missing.
 */
export function resolveDocUrl(docUrl) {
  if (!docUrl || docUrl === 'null' || docUrl === 'undefined') return null;
  const clean = String(docUrl).trim().replace(/\\/g, '/');
  if (!clean) return null;
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }
  const base = getBackendBaseUrl();
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

/**
 * Get a file-type icon color class for badges.
 */
export function docColorClass(category) {
  const colors = {
    image: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    pdf: 'bg-red-500/20 text-red-300 border-red-500/30',
    docx: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    doc: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    spreadsheet: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    presentation: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    text: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    video: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    audio: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    unknown: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  };
  return colors[category] || colors.unknown;
}
