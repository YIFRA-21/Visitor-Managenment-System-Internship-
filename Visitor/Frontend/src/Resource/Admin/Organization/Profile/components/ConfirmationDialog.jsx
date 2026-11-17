import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export default function ConfirmationDialog({ show, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, loading = false, onConfirm, onCancel, icon, }) {
    if (!show)
        return null;
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div 
          className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center transform transition-all animate-in fade-in zoom-in-95 duration-200" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            type="button"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer" 
            onClick={onCancel} 
            aria-label="Close dialog"
          >
            <X className="h-4 w-4"/>
          </button>

          {/* Icon */}
          <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${danger ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'}`}>
            {icon || (danger ? (<AlertTriangle className="h-6 w-6"/>) : (<Info className="h-6 w-6"/>))}
          </div>

          {/* Title */}
          <h3 id="confirm-dialog-title" className="text-base sm:text-lg font-bold text-white mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed break-words">
            {message}
          </p>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
            <button 
              type="button"
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors cursor-pointer" 
              onClick={onCancel} 
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button 
              type="button"
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg disabled:opacity-50 ${danger ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'}`} 
              onClick={onConfirm} 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Processing...
                </span>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
}
