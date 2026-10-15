import React, { useState } from 'react';
import { X, UploadCloud, FileText } from 'lucide-react';

export default function DocumentUploadModal({ isOpen, onClose, onUpload }) {
  const [docType, setDocType] = useState('National ID');
  const [file, setFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onUpload?.({ file, docType });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Upload Document</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Category</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="National ID">National ID Card</option>
              <option value="Passport">Passport</option>
              <option value="Driver License">Driver's License</option>
              <option value="NDA Agreement">Signed NDA Agreement</option>
              <option value="Contractor Certificate">Contractor Certificate</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
              required
            />
            <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">
              {file ? file.name : 'Click or drag file to upload'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">PDF, PNG, JPG up to 10MB</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-700 bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
            >
              Upload Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
