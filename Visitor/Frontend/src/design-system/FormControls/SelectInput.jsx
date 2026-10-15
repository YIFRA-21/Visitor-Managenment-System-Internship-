/**
 * VMS Design System — SelectInput Component
 * ───────────────────────────────────────────
 */
import { forwardRef } from 'react';
const SelectInput = forwardRef(({ label, error, hint, options, placeholder, inputSize = 'md', required, id, className = '', ...props }, ref) => {
    const selectId = id || `vms-select-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).slice(2)}`;
    const selectClasses = [
        'vms-form-control',
        inputSize !== 'md' ? `vms-form-control--${inputSize}` : '',
        error ? 'is-invalid' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (<div className="vms-form-group">
        {label && (<label htmlFor={selectId} className="vms-form-label">
            {label}
            {required && <span className="required">*</span>}
          </label>)}

        <select ref={ref} id={selectId} className={selectClasses} aria-invalid={!!error} required={required} {...props}>
          {placeholder && (<option value="" disabled>
              {placeholder}
            </option>)}
          {options.map((opt) => (<option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>))}
        </select>

        {error && (<div className="vms-form-feedback vms-form-feedback--error" role="alert">
            <i className="bi bi-exclamation-circle"></i>
            {error}
          </div>)}
        {hint && !error && (<div className="vms-form-feedback vms-form-feedback--hint">{hint}</div>)}
      </div>);
});
SelectInput.displayName = 'SelectInput';
export default SelectInput;
