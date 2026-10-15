/**
 * VMS Design System — RadioGroup Component
 */
export default function RadioGroup({ name, label, options, value, onChange, className = '', direction = 'vertical', }) {
    return (<div className={`vms-form-group ${className}`} role="radiogroup" aria-label={label}>
      {label && <span className="vms-form-label">{label}</span>}
      <div style={{ display: 'flex', flexDirection: direction === 'horizontal' ? 'row' : 'column', gap: direction === 'horizontal' ? '1rem' : '0.5rem' }}>
        {options.map((opt) => {
            const radioId = `${name}-${opt.value}`;
            return (<label key={opt.value} htmlFor={radioId} className="vms-form-check">
              <input type="radio" id={radioId} name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} disabled={opt.disabled} className="vms-form-check__input"/>
              <span className="vms-form-check__label">{opt.label}</span>
            </label>);
        })}
      </div>
    </div>);
}
