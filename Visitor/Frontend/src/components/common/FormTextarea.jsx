import React, { forwardRef } from 'react';
import FieldError from './FieldError';
const FormTextarea = forwardRef(({ label, name, id, error, required, placeholder, rows = 3, className = '', containerClassName = '', ...rest }, ref) => {
    const textareaId = id || `textarea-${name}`;
    const errorId = `${textareaId}-error`;
    const isInvalid = Boolean(error);
    return (<div className={`space-y-1.5 ${containerClassName}`}>
        {label && (<label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>)}

        <textarea ref={ref} id={textareaId} name={name} rows={rows} placeholder={placeholder} required={required} aria-invalid={isInvalid} aria-describedby={isInvalid ? errorId : undefined} data-invalid={isInvalid} data-field-name={name} className={`block w-full text-xs font-medium rounded-lg transition-all duration-200 p-3 ${isInvalid
            ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'} ${className}`} {...rest}/>

        <FieldError error={error} id={errorId}/>
      </div>);
});
FormTextarea.displayName = 'FormTextarea';
export default FormTextarea;
