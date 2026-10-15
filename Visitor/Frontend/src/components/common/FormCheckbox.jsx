import React, { forwardRef } from 'react';
import FieldError from './FieldError';
/**
 * Enterprise FormCheckbox Component
 * Displays red border indicator around checkbox container when validation fails.
 * Does not clear state during validation.
 */
const FormCheckbox = forwardRef(({ label, name, id, error, checked, required, className = '', containerClassName = '', onChange, ...rest }, ref) => {
    const inputId = id || `check-${name}`;
    const errorId = `${inputId}-error`;
    const isInvalid = Boolean(error);
    return (<div className={`space-y-1 ${containerClassName}`}>
        <div data-invalid={isInvalid} aria-invalid={isInvalid} data-field-name={name} className={`flex items-start space-x-2.5 p-2 rounded-lg transition-all ${isInvalid ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 animate-shake' : ''}`}>
          <input ref={ref} id={inputId} name={name} type="checkbox" checked={checked} onChange={onChange} aria-invalid={isInvalid} aria-describedby={isInvalid ? errorId : undefined} className={`mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900 ${className}`} {...rest}/>
          <label htmlFor={inputId} className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        </div>

        <FieldError error={error} id={errorId}/>
      </div>);
});
FormCheckbox.displayName = 'FormCheckbox';
export default FormCheckbox;
