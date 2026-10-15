export default function ErrorState({ title = 'Database Connection Timeout', message = 'We encountered an error synchronizing directory data. Please retry.', onRetry, icon = 'bi-exclamation-octagon', }) {
    return (<div className="vms-error-state border border-danger border-opacity-10 bg-dark bg-opacity-20 rounded-3 p-4 text-center" role="alert">
      <div className="state-icon mb-3">
        <i className={`bi ${icon} text-danger animate-pulse`}></i>
      </div>
      <h6 className="state-title mb-1 text-white">{title}</h6>
      <p className="state-message mb-3 text-muted">{message}</p>
      {onRetry && (<button className="btn btn-outline-danger btn-sm px-4 py-1" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-1"></i>Try Re-synchronizing
        </button>)}
    </div>);
}
