const colorIconMap = {
    primary: 'icon-primary',
    success: 'icon-success',
    warning: 'icon-warning',
    danger: 'icon-danger',
    info: 'icon-info',
    secondary: 'icon-secondary',
};
export default function QuickActionCard({ action, onClick }) {
    return (<div className="vms-quick-action-card h-100" onClick={() => onClick?.(action)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ')
        onClick?.(action); }} aria-label={`Quick action: ${action.title}`}>
      <div className="d-flex align-items-center gap-3">
        <span className={`action-icon-circle ${colorIconMap[action.color] || colorIconMap.primary}`}>
          <i className={`bi ${action.icon}`}></i>
        </span>
        <div className="flex-grow-1 min-w-0">
          <div className="action-title text-truncate">{action.title}</div>
          <div className="action-description text-truncate">{action.description}</div>
        </div>
        <i className="bi bi-chevron-right action-arrow"></i>
      </div>
    </div>);
}
