/**
 * Common UI Components
 * ─────────────────────
 * Reusable micro-components: SearchBar, EmptyState, LoadingSpinner,
 * FormField, DateRangePicker, ExportMenu, ErrorBoundary.
 */
import { useState, Component } from 'react';
import { Search, X, Download, FileText, FileSpreadsheet, Printer, Calendar, AlertCircle, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
    return (<div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"/>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"/>
      {value && (<button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
          <X className="w-4 h-4"/>
        </button>)}
    </div>);
}
export function EmptyState({ icon, title, description, action }) {
    return (<div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-white/20 mb-4">{icon || <Inbox className="w-16 h-16"/>}</div>
      <h3 className="text-lg font-medium text-white/60 mb-1">{title}</h3>
      {description && <p className="text-sm text-white/40 mb-4 max-w-sm text-center">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>);
}
export function LoadingSpinner({ size = 'md', text, className = '' }) {
    const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return (<div className={`flex flex-col items-center justify-center gap-3 py-8 ${className}`}>
      <svg className={`animate-spin ${sizeMap[size]} text-blue-400`} viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
      </svg>
      {text && <p className="text-sm text-white/50">{text}</p>}
    </div>);
}
export function FormField({ label, name, type = 'text', value, onChange, error, required, placeholder, disabled, options, textarea, rows = 3, className = '', }) {
    const inputClass = `w-full px-3 py-2.5 bg-white/5 border rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 transition-all ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    return (<div className={`space-y-1.5 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-white/70">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {options ? (<select id={name} name={name} value={value} onChange={onChange} disabled={disabled} className={inputClass}>
          <option value="" className="bg-gray-800">Select {label.toLowerCase()}...</option>
          {options.map((opt) => (<option key={opt.value} value={opt.value} className="bg-gray-800">{opt.label}</option>))}
        </select>) : textarea ? (<textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} rows={rows} className={`${inputClass} resize-none`}/>) : (<input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className={inputClass}/>)}

      {error && (<p className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="w-3 h-3"/>
          {error}
        </p>)}
    </div>);
}
export function DateRangePicker({ startDate, endDate, onStartChange, onEndChange, className = '' }) {
    return (<div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"/>
        <input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)} className="pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"/>
      </div>
      <span className="text-white/40 text-sm">to</span>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"/>
        <input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)} min={startDate} className="pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"/>
      </div>
    </div>);
}
export function ExportMenu({ onExportCSV, onExportPDF, onExportExcel, onPrint }) {
    const [open, setOpen] = useState(false);
    return (<div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">
        <Download className="w-4 h-4"/>
        Export
      </button>

      <AnimatePresence>
        {open && (<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 top-full mt-1 w-44 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-30">
            {onExportCSV && (<button onClick={() => { onExportCSV(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                <FileText className="w-4 h-4"/> Export CSV
              </button>)}
            {onExportExcel && (<button onClick={() => { onExportExcel(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                <FileSpreadsheet className="w-4 h-4"/> Export Excel
              </button>)}
            {onExportPDF && (<button onClick={() => { onExportPDF(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                <FileText className="w-4 h-4"/> Export PDF
              </button>)}
            {onPrint && (<button onClick={() => { onPrint(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                <Printer className="w-4 h-4"/> Print
              </button>)}
          </motion.div>)}
      </AnimatePresence>
    </div>);
}
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return this.props.fallback || (<div className="flex flex-col items-center justify-center py-16 px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4"/>
          <h3 className="text-lg font-medium text-white/80 mb-2">Something went wrong</h3>
          <p className="text-sm text-white/50 mb-4 max-w-sm text-center">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            Try Again
          </button>
        </div>);
        }
        return this.props.children;
    }
}
