/**
 * VMS Design System — TextArea Component
 */
import { forwardRef } from 'react';
const TextArea = forwardRef(({ label, error, hint, required, id, className = '', rows = 4, ...props }, ref) => {
    const textareaId = id || `vms-textarea-${Math.random().toString(36).slice(2)}`;
    return (<div className="vms-form-group">
        {label && (<label htmlFor={textareaId} className="vms-form-label">
            {label}
            {required && <span className="required">*</span>}
          </label>)}

        <textarea ref={ref} id={textareaId} className={`vms-form-control ${error ? 'is-invalid' : ''} ${className}`} rows={rows} aria-invalid={!!error} required={required} {...props}/>

        {error && (<div className="vms-form-feedback vms-form-feedback--error" role="alert">
            <i className="bi bi-exclamation-circle"></i>
            {error}
          </div>)}
        {hint && !error && (<div className="vms-form-feedback vms-form-feedback--hint">{hint}</div>)}
      </div>);
});
TextArea.displayName = 'TextArea';
export default TextArea;
