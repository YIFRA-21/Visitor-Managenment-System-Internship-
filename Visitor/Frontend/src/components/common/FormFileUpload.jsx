import React, { forwardRef } from 'react';
import FieldError from './FieldError';
import { Upload } from 'lucide-react';
/**
 * Enterprise FormFileUpload Component
 * Enforces red border and inline FieldError on validation error.
 * Preserves uploaded file preview state during validation errors.
 */
const FormFileUpload = forwardRef(({ label, name, id, error, previewUrl, helperText, required, accept = 'image/*', containerClassName = '', className = '', onChange, onFileSelect, ...rest }, ref) => {
    const inputId = id || `file-${name}`;
    const errorId = `${inputId}-error`;
    const isInvalid = Boolean(error);
    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        if (onFileSelect)
            onFileSelect(file);
        if (onChange)
            onChange(e);
    };
    return (<div className={`space-y-1.5 ${containerClassName}`}>
        {label && (<label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>)}

        <div data-invalid={isInvalid} aria-invalid={isInvalid} className={`relative rounded-xl border-2 transition-all p-4 text-center ${isInvalid
            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 animate-shake'
            : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-500'}`}>
          {previewUrl ? (<div className="flex items-center space-x-3">
              <img src={previewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-700"/>
              <div className="text-left text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">File Selected</p>
                <label htmlFor={inputId} className="text-indigo-500 hover:underline cursor-pointer font-bold">
                  Change File
                </label>
              </div>
            </div>) : (<label htmlFor={inputId} className="cursor-pointer flex flex-col items-center justify-center space-y-1">
              <Upload className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-1"/>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Click to upload file</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">JPG, PNG, PDF up to 5MB</span>
            </label>)}

          <input ref={ref} id={inputId} name={name} type="file" accept={accept} aria-invalid={isInvalid} aria-describedby={isInvalid ? errorId : undefined} data-invalid={isInvalid} data-field-name={name} onChange={handleFileChange} className="hidden" {...rest}/>
        </div>

        {helperText && !error && (<p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>)}

        <FieldError error={error} id={errorId}/>
      </div>);
});
FormFileUpload.displayName = 'FormFileUpload';
export default FormFileUpload;
