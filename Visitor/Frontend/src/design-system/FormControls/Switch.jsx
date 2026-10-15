/**
 * VMS Design System — Switch (Toggle) Component
 */
export default function Switch({ label, checked, onChange, disabled, id, className = '' }) {
    const switchId = id || `vms-switch-${Math.random().toString(36).slice(2)}`;
    return (<label htmlFor={switchId} className={`vms-switch ${className}`}>
      <input type="checkbox" id={switchId} checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="vms-switch__input" role="switch" aria-checked={checked}/>
      <span className="vms-switch__track">
        <span className="vms-switch__thumb"/>
      </span>
      {label && <span className="vms-switch__label">{label}</span>}
    </label>);
}
