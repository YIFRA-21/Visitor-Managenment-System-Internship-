import { logAuditEvent } from '../services/orgHomeService';
import { useResponseNavigation, RESPONSE_TYPES } from '../../../../../modules/response';
export default function ChartCard({ title, subtitle, children, className = '', action, height, }) {
    const { toResponse } = useResponseNavigation();
    const handleExport = (format) => {
        logAuditEvent(`Exported Chart Data`, { chart: title, format });
        toResponse({
            type: RESPONSE_TYPES.FILE_RESULT,
            title: 'Chart Data Exported',
            message: `Export file for "${title}" has been generated in ${format} format.`,
            targetEntity: `${title} (${format})`,
            returnUrl: window.location.pathname + window.location.search
        });
    };
    return (<div className={`vms-chart-card ${className}`}>
      <div className="chart-header">
        <div>
          <h6 className="chart-title">{title}</h6>
          {subtitle && <small className="chart-subtitle">{subtitle}</small>}
        </div>
        {action ? (<div>{action}</div>) : (<div className="dropdown chart-actions">
            <button className="btn btn-sm btn-outline-secondary border-0 p-1 text-muted" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Export chart options">
              <i className="bi bi-three-dots-vertical"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end bg-dark border-secondary shadow-lg">
              <li>
                <button className="dropdown-item text-white small" onClick={() => handleExport('CSV')}>
                  <i className="bi bi-file-earmark-excel me-2"></i>Export CSV
                </button>
              </li>
              <li>
                <button className="dropdown-item text-white small" onClick={() => handleExport('PNG')}>
                  <i className="bi bi-file-earmark-image me-2"></i>Export PNG Image
                </button>
              </li>
              <li>
                <button className="dropdown-item text-white small" onClick={() => handleExport('PDF')}>
                  <i className="bi bi-file-pdf me-2"></i>Download PDF Report
                </button>
              </li>
            </ul>
          </div>)}
      </div>
      <div style={height ? { height: `${height}px` } : undefined}>
        {children}
      </div>
    </div>);
}
