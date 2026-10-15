import React, { forwardRef } from 'react';
import FieldError from './FieldError';
/**
 * Enterprise FormInput Component
 * Consistent input wrapper enforcing red border & background tint on error,
 * data attributes for cursor auto-focus, untouched placeholders, and direct inline error text.
 */
const FormInput = forwardRef(({ label, name, id, error, icon, endAdornment, helperText, required, placeholder, className = '', containerClassName = '', type = 'text', ...rest }, ref) => {
    const inputId = id || `field-${name}`;
    const errorId = `${inputId}-error`;
    const isInvalid = Boolean(error);
    return (<div className={`space-y-1.5 ${containerClassName}`}>
        {label && (<label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>)}

        <div className="relative rounded-lg shadow-sm">
          {icon && (<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {icon}
            </div>)}

          <input ref={ref} id={inputId} name={name} type={type} placeholder={placeholder} required={required} aria-invalid={isInvalid} aria-describedby={isInvalid ? errorId : undefined} data-invalid={isInvalid} data-field-name={name} className={`block w-full text-xs font-medium rounded-lg transition-all duration-200 ${icon ? 'pl-9' : 'pl-3'} ${endAdornment ? 'pr-9' : 'pr-3'} py-2.5 outline-none ${isInvalid
            ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 animate-shake'
            : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'} ${className}`} {...rest}/>

          {endAdornment && (<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {endAdornment}
            </div>)}
        </div>

        {helperText && !error && (<p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>)}

        <FieldError error={error} id={errorId}/>
      </div>);
});
FormInput.displayName = 'FormInput';
export default FormInput;
