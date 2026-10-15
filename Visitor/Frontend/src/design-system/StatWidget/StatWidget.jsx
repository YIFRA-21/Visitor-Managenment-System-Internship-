/**
 * VMS Design System — StatWidget Component
 * ──────────────────────────────────────────
 * Dashboard statistic card with icon, value, label, and trend.
 */
export default function StatWidget({ label, value, icon, iconClass, color = 'primary', trend, className = '', }) {
    return (<div className={`vms-card vms-card--stat vms-card--${color} ${className}`}>
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <p className="vms-card__label">{label}</p>
          <p className="vms-card__value">{value}</p>
          {trend && <p className="vms-card__trend">{trend}</p>}
        </div>
        <div className="vms-card__icon">
          {icon || (iconClass && <i className={`bi ${iconClass}`}></i>)}
        </div>
      </div>
    </div>);
}
