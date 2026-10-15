import { useState } from 'react';
import { mockNotifications } from '../data/mockData';
export default function RightNotificationPanel({ collapsed }) {
    const [notifications, setNotifications] = useState(mockNotifications);
    const [activeTab, setActiveTab] = useState('all');
    if (collapsed)
        return null;
    const handleMarkAsRead = (id) => {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    };
    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };
    const handleClearAll = () => {
        setNotifications([]);
    };
    // Filter logic based on tabs
    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'unread')
            return !n.read;
        if (activeTab === 'system')
            return n.category === 'system';
        if (activeTab === 'alerts')
            return n.category === 'alert' || n.color === 'danger';
        return true;
    });
    const unreadCount = notifications.filter(n => !n.read).length;
    const getIconClass = (icon, color) => {
        const colorMap = {
            primary: 'text-primary',
            success: 'text-success',
            warning: 'text-warning',
            danger: 'text-danger',
            info: 'text-info',
        };
        return `bi ${icon} ${colorMap[color] || 'text-secondary'}`;
    };
    return (<div className="vms-notification-panel bg-dark border border-secondary rounded-3 overflow-hidden h-100 d-flex flex-column" style={{ width: '280px', minHeight: '400px' }}>
      
      {/* Title Header */}
      <div className="p-3 border-bottom border-secondary d-flex align-items-center justify-content-between flex-shrink-0">
        <h6 className="text-white fw-bold mb-0 small">Registry Alerts</h6>
        {unreadCount > 0 && (<span className="badge bg-danger rounded-pill" style={{ fontSize: '0.6rem' }}>
            {unreadCount} new
          </span>)}
      </div>

      {/* Categories Tabs Filter */}
      <div className="notification-tabs flex-shrink-0">
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          All
        </button>
        <button className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`} onClick={() => setActiveTab('unread')}>
          Unread
        </button>
        <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
          System
        </button>
        <button className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
          Alerts
        </button>
      </div>

      {/* Notifications List area */}
      <div className="vms-notification-list flex-grow-1 overflow-auto" style={{ maxHeight: '350px' }}>
        {filteredNotifications.length === 0 ? (<div className="text-center py-5 px-3">
            <i className="bi bi-bell-slash fs-3 text-muted d-block mb-2"></i>
            <span className="text-muted small">No notifications match this filter.</span>
          </div>) : (filteredNotifications.map((n) => (<div key={n.id} className={`notification-item ${n.read ? '' : 'unread'}`}>
              <div className="d-flex align-items-start gap-2">
                <i className={`${getIconClass(n.icon, n.color)} mt-0.5 fs-6`}></i>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex align-items-start justify-content-between gap-1">
                    <span className={`small text-truncate ${n.read ? 'text-white-50' : 'text-white fw-semibold'}`}>
                      {n.title}
                    </span>
                    {!n.read && (<button className="btn btn-sm p-0 border-0 text-primary hover-text-white flex-shrink-0" title="Mark as read" onClick={() => handleMarkAsRead(n.id)} aria-label="Mark check notification">
                        <i className="bi bi-check2"></i>
                      </button>)}
                  </div>
                  <p className="text-muted mb-1 text-wrap" style={{ fontSize: '0.65rem', lineHeight: '1.3' }}>
                    {n.description}
                  </p>
                  <small className="text-secondary extra-small" style={{ fontSize: '0.55rem' }}>
                    <i className="bi bi-clock me-1"></i>{n.time}
                  </small>
                </div>
              </div>
            </div>)))}
      </div>

      {/* Actions footer controls */}
      <div className="p-2 border-top border-secondary d-flex align-items-center justify-content-between flex-shrink-0 bg-dark-subtle">
        <button className="btn btn-sm btn-link text-muted text-decoration-none extra-small" disabled={unreadCount === 0} onClick={handleMarkAllRead}>
          Mark all read
        </button>
        <button className="btn btn-sm btn-link text-danger text-decoration-none extra-small" disabled={notifications.length === 0} onClick={handleClearAll}>
          Clear all
        </button>
      </div>
    </div>);
}
