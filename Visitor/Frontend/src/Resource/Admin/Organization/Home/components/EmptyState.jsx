export default function EmptyState({ title = 'No records found', description = 'There are no active items matching your parameters.', icon = 'bi-folder-x', action, }) {
    return (<div className="vms-empty-state border border-secondary border-opacity-10 bg-dark bg-opacity-20 rounded-3 p-4 text-center">
      <div className="state-icon mb-3">
        <i className={`bi ${icon} text-muted`}></i>
      </div>
      <h6 className="state-title mb-1 text-white">{title}</h6>
      <p className="state-message mb-3 text-muted">{description}</p>
      {action && (<button className="btn btn-outline-primary btn-sm px-3 py-1" onClick={action.onClick}>
          <i className="bi bi-plus-lg me-1"></i>
          {action.label}
        </button>)}
    </div>);
}
