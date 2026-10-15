import React, { forwardRef } from 'react';
import FieldError from './FieldError';
/**
 * Enterprise FormSelect Component
 * Consistent dropdown wrapper enforcing red border & background tint on error,
 * data attributes for cursor auto-focus, and direct inline error text.
 */
const FormSelect = forwardRef(({ label, name, id, error, options, placeholderOption = 'Select an option...', icon, required, className = '', containerClassName = '', ...rest }, ref) => {
    const selectId = id || `select-${name}`;
    const errorId = `${selectId}-error`;
    const isInvalid = Boolean(error);
    return (<div className={`space-y-1.5 ${containerClassName}`}>
        {label && (<label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>)}

        <div className="relative rounded-lg shadow-sm">
          {icon && (<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {icon}
            </div>)}

          <select ref={ref} id={selectId} name={name} required={required} aria-invalid={isInvalid} aria-describedby={isInvalid ? errorId : undefined} data-invalid={isInvalid} data-field-name={name} className={`block w-full text-xs font-medium rounded-lg transition-all duration-200 ${icon ? 'pl-9' : 'pl-3'} pr-8 py-2.5 ${isInvalid
            ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'} ${className}`} {...rest}>
            {placeholderOption && (<option value="" disabled>
                {placeholderOption}
              </option>)}
            {options.map((opt) => (<option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>))}
          </select>
        </div>

        <FieldError error={error} id={errorId}/>
      </div>);
});
FormSelect.displayName = 'FormSelect';
export default FormSelect;
