import React from 'react';
export default function VisitorHomeSidebar({ currentView, onNavigate, collapsed = false, onToggleCollapse, pendingCount = 8, watchlistCount = 3, }) {
    const navItems = [
        { key: 'visitor_mgmt_overview', label: 'Overview', icon: 'bi-grid-1x2' },
        { key: 'visitor_list', label: 'Visitor Directory', icon: 'bi-people' },
        { key: 'visitor_approvals', label: 'Pending Approvals', badge: pendingCount > 0 ? String(pendingCount) : undefined, icon: 'bi-clock-history' },
        { key: 'visitor_watchlist', label: 'VIP & Watchlist', badge: watchlistCount > 0 ? String(watchlistCount) : undefined, icon: 'bi-shield-exclamation' },
        { key: 'visitor_activity_logs', label: 'Activity & Movement', icon: 'bi-journal-text' },
        { key: 'visitor_policy', label: 'Policy & Rules', icon: 'bi-shield-check' },
        { key: 'visitor_analytics', label: 'Visitor Analytics', icon: 'bi-bar-chart-line' },
        { key: 'visitor_settings', label: 'Visitor Settings', icon: 'bi-gear' },
    ];
    return (<div className={`vms-visitor-sidebar bg-dark border border-secondary rounded-3 overflow-hidden ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="vms-visitor-sidebar-header p-3 border-bottom border-secondary d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2 overflow-hidden">
          <div className="bg-primary bg-opacity-20 text-primary p-2 rounded-2 d-flex align-items-center justify-content-center">
            <i className="bi bi-person-badge fs-5"></i>
          </div>
          {!collapsed && (<div>
              <h6 className="fw-bold mb-0 text-white text-nowrap" style={{ fontSize: '0.875rem' }}>
                Visitor Admin
              </h6>
              <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                System Controls
              </span>
            </div>)}
        </div>
        {onToggleCollapse && (<button onClick={onToggleCollapse} className="btn btn-sm btn-outline-secondary border-0 text-secondary p-1" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>)}
      </div>

      <nav className="vms-visitor-nav p-2">
        {navItems.map((item) => {
            const isActive = currentView === item.key;
            return (<button key={item.key} onClick={() => onNavigate(item.key)} className={`w-100 d-flex align-items-center justify-content-between border-0 rounded-2 px-3 py-2.5 mb-1 transition-all text-start ${isActive
                    ? 'bg-primary text-white fw-bold shadow-sm'
                    : 'bg-transparent text-slate-300 hover-bg-slate-800'}`} style={{ fontSize: '0.8125rem', cursor: 'pointer' }} title={collapsed ? item.label : undefined}>
              <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                <i className={`bi ${item.icon} ${isActive ? 'text-white' : 'text-primary'}`} style={{ fontSize: '1rem' }}></i>
                {!collapsed && <span className="text-truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (<span className={`badge rounded-pill ${item.key === 'visitor_watchlist' ? 'bg-danger text-white' : 'bg-warning text-dark'}`} style={{ fontSize: '0.6875rem' }}>
                  {item.badge}
                </span>)}
            </button>);
        })}
      </nav>
    </div>);
}
