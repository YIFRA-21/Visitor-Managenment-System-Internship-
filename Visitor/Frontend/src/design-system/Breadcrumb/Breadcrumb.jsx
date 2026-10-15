/**
 * VMS Design System — Breadcrumb Component
 * ──────────────────────────────────────────
 */
export default function Breadcrumb({ items, className = '' }) {
    return (<nav aria-label="Breadcrumb" className={className}>
      <ol className="d-flex align-items-center gap-1 list-unstyled mb-0" style={{ fontSize: 'var(--vms-small)' }}>
        {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (<li key={index} className="d-flex align-items-center gap-1">
              {index > 0 && (<i className="bi bi-chevron-right" style={{ fontSize: '0.625rem', color: 'var(--vms-text-tertiary)' }}></i>)}
              {isLast ? (<span style={{ color: 'var(--vms-text-primary)', fontWeight: 'var(--vms-fw-medium)' }} aria-current="page">
                  {item.label}
                </span>) : item.onClick ? (<button onClick={item.onClick} className="vms-btn--link" style={{ fontSize: 'inherit', color: 'var(--vms-text-secondary)', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {item.label}
                </button>) : (<a href={item.href || '#'} style={{ color: 'var(--vms-text-secondary)', textDecoration: 'none' }}>
                  {item.label}
                </a>)}
            </li>);
        })}
      </ol>
    </nav>);
}
