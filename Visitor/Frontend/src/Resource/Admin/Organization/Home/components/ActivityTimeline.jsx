import { useState } from 'react';
const statusClassMap = {
    completed: 'dot-completed',
    pending: 'dot-pending',
    failed: 'dot-failed',
};
const statusBadgeClassMap = {
    completed: 'bg-success bg-opacity-10 text-success border border-success border-opacity-20',
    pending: 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20',
    failed: 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20',
};
const moduleBadgeClassMap = {
    'organization': 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20',
    'branch': 'bg-info bg-opacity-10 text-info border border-info border-opacity-20',
    'department': 'bg-success bg-opacity-10 text-success border border-success border-opacity-20',
    'calendar': 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20',
    'settings': 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-20',
};
export default function ActivityTimeline({ activities, loading }) {
    const [visibleCount, setVisibleCount] = useState(5);
    if (loading) {
        return (<div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>);
    }
    if (!activities || activities.length === 0) {
        return (<div className="text-center py-5">
        <i className="bi bi-clock-history fs-3 text-muted d-block mb-2"></i>
        <small className="text-muted">No recent operations logged in the audit trail.</small>
      </div>);
    }
    const handleShowMore = () => {
        setVisibleCount(prev => Math.min(prev + 5, activities.length));
    };
    const handleShowLess = () => {
        setVisibleCount(5);
    };
    return (<div className="vms-activity-timeline py-2">
      {activities.slice(0, visibleCount).map((activity) => {
            const userInitial = activity.user ? activity.user.charAt(0).toUpperCase() : 'U';
            const modKey = (activity.module || 'organization').toLowerCase();
            return (<div key={activity.id} className="vms-timeline-item">
            {/* Left dot icon */}
            <div className={`timeline-dot ${statusClassMap[activity.status] || 'dot-completed'}`}/>

            {/* Right card payload */}
            <div className="timeline-content">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="timeline-user-avatar">
                    {userInitial}
                  </div>
                  <div>
                    <span className="fw-semibold text-white small">{activity.user}</span>
                    <span className={`badge ms-2 rounded-pill text-uppercase extra-small ${statusBadgeClassMap[activity.status] || 'bg-success'}`} style={{ fontSize: '0.55rem', padding: '2px 6px' }}>
                      {activity.status}
                    </span>
                  </div>
                </div>
                <span className={`badge rounded-pill timeline-module-badge ${moduleBadgeClassMap[modKey] || ''}`}>
                  {activity.module}
                </span>
              </div>
              
              <p className="text-white-50 mb-2 small">{activity.action}</p>
              
              <div className="d-flex align-items-center gap-3 timeline-time">
                <span>
                  <i className="bi bi-calendar3 me-1"></i>
                  {activity.date}
                </span>
                <span>
                  <i className="bi bi-clock me-1"></i>
                  {activity.time}
                </span>
              </div>
            </div>
          </div>);
        })}

      {/* Show more/less pagination buttons */}
      <div className="d-flex justify-content-center gap-2 mt-2">
        {visibleCount < activities.length && (<button className="btn btn-sm btn-outline-secondary py-1 px-3" onClick={handleShowMore}>
            <i className="bi bi-chevron-down me-1"></i>Load Older Activities
          </button>)}
        {visibleCount > 5 && (<button className="btn btn-sm btn-outline-secondary py-1 px-3" onClick={handleShowLess}>
            <i className="bi bi-chevron-up me-1"></i>Show Recent Only
          </button>)}
      </div>
    </div>);
}
