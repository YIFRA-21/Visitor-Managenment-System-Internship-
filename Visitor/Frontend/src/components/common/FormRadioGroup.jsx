import React from 'react';
import FieldError from './FieldError';
/**
 * Enterprise FormRadioGroup Component
 * Displays red border indicator around radio group when validation fails.
 * Does not clear previously selected option on error.
 */
export const FormRadioGroup = ({ label, name, value, options, onChange, error, required, containerClassName = '', }) => {
    const isInvalid = Boolean(error);
    const errorId = `radio-${name}-error`;
    return (<div className={`space-y-1.5 ${containerClassName}`}>
      {label && (<label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>)}

      <div data-invalid={isInvalid} aria-invalid={isInvalid} data-field-name={name} className={`flex flex-wrap gap-4 p-2.5 rounded-lg transition-all ${isInvalid
            ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 animate-shake'
            : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
        {options.map((opt) => (<label key={opt.value} className="flex items-center space-x-2 text-xs cursor-pointer text-slate-800 dark:text-slate-200 font-medium">
            <input type="radio" name={name} value={opt.value} checked={value === opt.value} disabled={opt.disabled} onChange={() => onChange(opt.value)} className="text-indigo-600 focus:ring-indigo-500"/>
            <span>{opt.label}</span>
          </label>))}
      </div>

      <FieldError error={error} id={errorId}/>
    </div>);
};
export default FormRadioGroup;
