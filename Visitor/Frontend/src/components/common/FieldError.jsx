import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
/**
 * FieldError Component
 * Renders validation error message directly below the input with red text,
 * alert icon, smooth entry animation, and proper ARIA accessibility.
 */
export default function FieldError({ error, id, className = '' }) {
    if (!error)
        return null;
    return (<AnimatePresence mode="wait">
      <motion.div id={id} role="alert" aria-live="polite" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className={`flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-rose-600 dark:text-rose-400"/>
        <span>{error}</span>
      </motion.div>
    </AnimatePresence>);
}
