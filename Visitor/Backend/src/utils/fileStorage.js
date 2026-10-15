const path = require('path');
const fs = require('fs');
const mimeTypes = require('mime-types');

// Canonical storage root: <projectRoot>/Backend/uploads
const BACKEND_ROOT = path.resolve(__dirname, '../..');
const UPLOADS_ROOT = path.resolve(BACKEND_ROOT, 'uploads');
const DOCUMENTS_DIR = path.resolve(UPLOADS_ROOT, 'documents');
const VISITORS_DIR = path.resolve(UPLOADS_ROOT, 'visitors');
const MODULES_DOCS_DIR = path.resolve(BACKEND_ROOT, 'src/modules/uploads/documents');

// Ensure directories exist
[UPLOADS_ROOT, DOCUMENTS_DIR, VISITORS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Resolves a stored file path or relative URL to an existing physical file on disk.
 * Checks canonical documents folder, legacy uploads, modules uploads, and absolute paths.
 * 
 * @param {string} fileRef - e.g. "/uploads/documents/doc-123.pdf" or "doc-123.pdf" or "D:\\...\\doc-123.pdf"
 * @returns {{ fullPath: string|null, exists: boolean, mimeType: string, filename: string, size: number }}
 */
function resolveStorageFile(fileRef) {
  if (!fileRef || typeof fileRef !== 'string') {
    return { fullPath: null, exists: false, mimeType: 'application/octet-stream', filename: '', size: 0 };
  }

  const cleanRef = fileRef.trim().replace(/^\\+/, '');
  const basename = path.basename(cleanRef);

  // Candidate paths to search in priority order
  const candidates = [];

  // 1. Direct absolute path if provided
  if (path.isAbsolute(cleanRef)) {
    candidates.push(cleanRef);
  }

  // 2. Relative to backend root if it starts with /uploads
  if (cleanRef.startsWith('/uploads') || cleanRef.startsWith('uploads')) {
    candidates.push(path.resolve(BACKEND_ROOT, cleanRef.replace(/^\/+/, '')));
  }

  // 3. In canonical documents directory
  candidates.push(path.resolve(DOCUMENTS_DIR, basename));

  // 4. In general uploads directory
  candidates.push(path.resolve(UPLOADS_ROOT, basename));

  // 5. In legacy modules/uploads/documents directory
  candidates.push(path.resolve(MODULES_DOCS_DIR, basename));

  // 6. In visitors directory
  candidates.push(path.resolve(VISITORS_DIR, basename));

  // Find the first candidate that exists
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const stats = fs.statSync(candidate);
        if (stats.isFile()) {
          const detectedMime = mimeTypes.lookup(candidate) || 'application/octet-stream';
          return {
            fullPath: candidate,
            exists: true,
            mimeType: detectedMime,
            filename: basename,
            size: stats.size
          };
        }
      }
    } catch (_) {}
  }

  // Not found on disk
  const defaultMime = mimeTypes.lookup(basename) || 'application/octet-stream';
  return {
    fullPath: candidates[2], // best prospective path
    exists: false,
    mimeType: defaultMime,
    filename: basename,
    size: 0
  };
}

module.exports = {
  BACKEND_ROOT,
  UPLOADS_ROOT,
  DOCUMENTS_DIR,
  VISITORS_DIR,
  resolveStorageFile
};
