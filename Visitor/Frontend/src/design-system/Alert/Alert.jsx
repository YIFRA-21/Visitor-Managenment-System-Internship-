/**
 * VMS Design System — Alert Component
 * ─────────────────────────────────────
 */
import { useState } from 'react';
const defaultIcons = {
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-triangle-fill',
    error: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill',
    neutral: 'bi-info-circle',
};
export default function Alert({ variant, title, children, dismissible = false, onDismiss, icon, className = '', }) {
    const [visible, setVisible] = useState(true);
    if (!visible)
        return null;
    const handleDismiss = () => {
        setVisible(false);
        onDismiss?.();
    };
    return (<div className={`vms-alert vms-alert--${variant} ${className}`} role="alert">
      <span className="vms-alert__icon">
        {icon || <i className={`bi ${defaultIcons[variant]}`}></i>}
      </span>
      <div className="vms-alert__content">
        {title && <div className="vms-alert__title">{title}</div>}
        <div className="vms-alert__message">{children}</div>
      </div>
      {dismissible && (<button className="vms-alert__close" onClick={handleDismiss} aria-label="Dismiss alert">
          <i className="bi bi-x-lg"></i>
        </button>)}
    </div>);
}
