import React from 'react';
import { FileText, Download, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import DocumentVerificationBadge from './DocumentVerificationBadge';

export default function DocumentCard({ doc, onDownload, onDelete }) {
  if (!doc) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {doc.name || doc.file_name || 'Document.pdf'}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {doc.type || 'ID Card'} • {doc.size || '1.2 MB'} • {doc.uploaded_at || 'Recently'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <DocumentVerificationBadge status={doc.status} />

        <div className="flex items-center gap-1">
          {onDownload && (
            <button
              onClick={() => onDownload(doc)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(doc)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
              title="Delete file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
