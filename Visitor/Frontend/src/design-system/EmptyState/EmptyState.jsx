/**
 * VMS Design System — EmptyState Component
 * ──────────────────────────────────────────
 */
export default function EmptyState({ icon, iconClass = 'bi-inbox', title, description, action, className = '', }) {
    return (<div className={`d-flex flex-column align-items-center justify-content-center py-5 px-3 ${className}`}>
      <div style={{ color: 'var(--vms-text-tertiary)', opacity: 0.4, marginBottom: 'var(--vms-space-4)' }}>
        {icon || <i className={`bi ${iconClass}`} style={{ fontSize: '3rem' }}></i>}
      </div>
      <h3 style={{ fontSize: 'var(--vms-body)', fontWeight: 'var(--vms-fw-medium)', color: 'var(--vms-text-secondary)', marginBottom: '0.25rem' }}>
        {title}
      </h3>
      {description && (<p style={{ fontSize: 'var(--vms-body-sm)', color: 'var(--vms-text-tertiary)', maxWidth: '20rem', textAlign: 'center', marginBottom: 'var(--vms-space-4)' }}>
          {description}
        </p>)}
      {action && <div className="mt-2">{action}</div>}
    </div>);
}
