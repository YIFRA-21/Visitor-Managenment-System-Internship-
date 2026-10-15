import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
export default function ConfirmationDialog({ show, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, loading = false, onConfirm, onCancel, icon, }) {
    if (!show)
        return null;
    return (<div className="org-confirmation-overlay" onClick={onCancel}>
      <div className="org-confirmation-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        {/* Close button */}
        <button className="org-confirmation-close" onClick={onCancel} aria-label="Close dialog">
          <X className="h-4 w-4"/>
        </button>

        {/* Icon */}
        <div className={`org-confirmation-icon ${danger ? 'danger' : 'info'}`}>
          {icon || (danger ? (<AlertTriangle className="h-6 w-6"/>) : (<Info className="h-6 w-6"/>))}
        </div>

        {/* Title */}
        <h3 id="confirm-dialog-title" className="org-confirmation-title">
          {title}
        </h3>

        {/* Message */}
        <p className="org-confirmation-message">{message}</p>

        {/* Actions */}
        <div className="org-confirmation-actions">
          <button className="btn btn-sm btn-outline-secondary px-4 py-2 fw-bold" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'} px-4 py-2 fw-bold`} onClick={onConfirm} disabled={loading}>
            {loading ? (<span className="d-flex align-items-center gap-2">
                <span className="spinner-border spinner-border-sm"/>
                Processing...
              </span>) : confirmLabel}
          </button>
        </div>
      </div>
    </div>);
}
