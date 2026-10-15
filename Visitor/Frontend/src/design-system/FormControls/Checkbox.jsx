/**
 * VMS Design System — Checkbox Component
 */
import { forwardRef } from 'react';
const Checkbox = forwardRef(({ label, id, className = '', ...props }, ref) => {
    const checkId = id || `vms-check-${Math.random().toString(36).slice(2)}`;
    return (<label htmlFor={checkId} className={`vms-form-check ${className}`}>
        <input ref={ref} type="checkbox" id={checkId} className="vms-form-check__input" {...props}/>
        <span className="vms-form-check__label">{label}</span>
      </label>);
});
Checkbox.displayName = 'Checkbox';
export default Checkbox;
