import { useState, useEffect } from 'react';
import { logAuditEvent } from '../services/orgHomeService';
import BackButton from '../../../../../components/common/BackButton';
export default function DashboardHeader({ title = 'Organization Management', userName = 'User', userRole = 'System Administrator', onNotificationClick, onHelpClick, onProfileClick, onSearch, }) {
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
            setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(searchQuery);
        }
    };
    const handleClearSearch = () => {
        setSearchQuery('');
        if (onSearch) {
            onSearch('');
        }
    };
    return (<div className="vms-dashboard-header mb-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        {/* Title & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin/dashboard"/>
          <div>
            <h4 className="text-white fw-bold mb-0">{title}</h4>
            <nav aria-label="breadcrumb" className="vms-breadcrumb-nav mt-1">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Dashboard</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Organization Management
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Action Controls & User Identity */}
        <div className="d-flex align-items-center gap-3 ms-auto">
          {/* Live Enterprise Clock */}
          <div className="vms-live-clock d-none d-md-flex align-items-center">
            <div className="clock-pulse"></div>
            <div className="d-flex flex-column text-end">
              <span className="clock-time">{currentTime}</span>
              <span className="clock-date">{currentDate}</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Notifications Notification Count Indicator */}
            <button className="btn btn-sm btn-outline-secondary border-0 vms-notification-bell" onClick={onNotificationClick} aria-label="Notifications Panel">
              <i className="bi bi-bell text-muted fs-5"></i>
              <span className="notification-count">2</span>
            </button>
            <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => {
            logAuditEvent('Opened Help Guide');
            onHelpClick?.();
        }} aria-label="System Help Center">
              <i className="bi bi-question-circle text-muted fs-5"></i>
            </button>
          </div>

          {/* User drop down profiles */}
          <div className="dropdown">
            <button className="btn btn-sm btn-outline-secondary border-0 d-flex align-items-center gap-2 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" onClick={onProfileClick}>
              <div className="vms-user-avatar">
                <span>{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-start d-none d-lg-block">
                <div className="text-white small lh-1 fw-semibold">{userName}</div>
                <div className="text-muted" style={{ fontSize: '0.65rem' }}>{userRole}</div>
              </div>
            </button>
            <ul className="dropdown-menu dropdown-menu-end bg-dark border-secondary shadow-lg">
              <li>
                <a className="dropdown-item text-white small" href={userRole?.toLowerCase() === 'visitor' ? '?view=visitor_profile' : '?view=profile'}>
                  <i className="bi bi-person me-2"></i>Profile Details
                </a>
              </li>
              <li>
                <a className="dropdown-item text-white small" href="/dashboard?view=change_password">
                  <i className="bi bi-key me-2"></i>Security Settings
                </a>
              </li>
              <li><hr className="dropdown-divider border-secondary"/></li>
              <li>
                <a className="dropdown-item text-white small" href="/dashboard?view=settings">
                  <i className="bi bi-gear-wide-connected me-2"></i>Global Config
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Global Module Search Input */}
      <form onSubmit={handleSearchSubmit} className="vms-header-search">
        <div className="input-group input-group-sm" style={{ maxWidth: '400px' }}>
          <span className="input-group-text bg-dark border-secondary text-muted">
            <i className="bi bi-search"></i>
          </span>
          <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" placeholder="Search organizations, branches, departments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Module query search"/>
          {searchQuery && (<button type="button" className="btn btn-sm btn-outline-secondary border-secondary bg-dark text-muted" onClick={handleClearSearch}>
              <i className="bi bi-x"></i>
            </button>)}
        </div>
      </form>
    </div>);
}
