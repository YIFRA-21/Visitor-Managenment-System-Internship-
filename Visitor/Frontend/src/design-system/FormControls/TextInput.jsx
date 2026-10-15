/**
 * VMS Design System — TextInput Component
 * ─────────────────────────────────────────
 * Input field with icon support, validation states, and all form states.
 */
import { forwardRef } from 'react';
const TextInput = forwardRef(({ label, error, hint, success, iconLeft, iconRight, onIconRightClick, inputSize = 'md', required, id, className = '', ...props }, ref) => {
    const inputId = id || `vms-input-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).slice(2)}`;
    const inputClasses = [
        'vms-form-control',
        inputSize !== 'md' ? `vms-form-control--${inputSize}` : '',
        iconLeft ? 'vms-form-control--icon-left' : '',
        iconRight ? 'vms-form-control--icon-right' : '',
        error ? 'is-invalid' : '',
        success ? 'is-valid' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (<div className="vms-form-group">
        {label && (<label htmlFor={inputId} className="vms-form-label">
            {label}
            {required && <span className="required">*</span>}
          </label>)}

        <div className="vms-input-group">
          {iconLeft && (<span className="vms-input-icon vms-input-icon--left">{iconLeft}</span>)}

          <input ref={ref} id={inputId} className={inputClasses} aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined} required={required} {...props}/>

          {iconRight && (<span className="vms-input-icon vms-input-icon--right" onClick={onIconRightClick} role={onIconRightClick ? 'button' : undefined} tabIndex={onIconRightClick ? 0 : undefined} onKeyDown={onIconRightClick
                ? (e) => { if (e.key === 'Enter' || e.key === ' ')
                    onIconRightClick(); }
                : undefined}>
              {iconRight}
            </span>)}
        </div>

        {error && (<div id={`${inputId}-error`} className="vms-form-feedback vms-form-feedback--error" role="alert">
            <i className="bi bi-exclamation-circle"></i>
            {error}
          </div>)}
        {success && !error && (<div className="vms-form-feedback vms-form-feedback--success">
            <i className="bi bi-check-circle"></i>
            {success}
          </div>)}
        {hint && !error && !success && (<div id={`${inputId}-hint`} className="vms-form-feedback vms-form-feedback--hint">
            {hint}
          </div>)}
      </div>);
});
TextInput.displayName = 'TextInput';
export default TextInput;
