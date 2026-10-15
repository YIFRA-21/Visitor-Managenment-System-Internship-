/**
 * ConfirmDialog Component
 * ────────────────────────
 * Reusable confirmation modal with customizable actions and variants.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react';
const variantConfig = {
    danger: {
        icon: Trash2,
        iconColor: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        buttonColor: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        buttonColor: 'bg-amber-600 hover:bg-amber-700',
    },
    success: {
        icon: CheckCircle,
        iconColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    },
    info: {
        icon: Info,
        iconColor: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
};
export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', loading = false, }) {
    const config = variantConfig[variant];
    const Icon = config.icon;
    return (<AnimatePresence>
      {open && (<>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose}/>

          {/* Dialog */}
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-md rounded-xl border ${config.borderColor} bg-gray-900 shadow-2xl`}>
              {/* Header */}
              <div className="flex items-start justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`}/>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* Body */}
              <div className="px-5 pb-4 text-sm text-white/70 leading-relaxed">
                {message}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
                <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-white/70 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50">
                  {cancelLabel}
                </button>
                <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${config.buttonColor}`}>
                  {loading ? (<span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      Processing...
                    </span>) : (confirmLabel)}
                </button>
              </div>
            </div>
          </motion.div>
        </>)}
    </AnimatePresence>);
}
