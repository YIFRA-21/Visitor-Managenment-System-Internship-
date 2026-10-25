const navItems = [
    { key: 'home', label: 'Home', icon: 'bi-house', route: 'org_home' },
    { key: 'organizations', label: 'Organizations', icon: 'bi-building', route: 'organizations' },
    { key: 'branches', label: 'Branches', icon: 'bi-diagram-3', route: 'branches' },
    { key: 'departments', label: 'Departments', icon: 'bi-columns-gap', route: 'departments_mgmt' },
    { key: 'buildings', label: 'Buildings & Campuses', icon: 'bi-building-gear', route: 'buildings' },
    { key: 'floors', label: 'Floors & Levels', icon: 'bi-layers', route: 'floors' },
    { key: 'rooms', label: 'Meeting Rooms & Offices', icon: 'bi-door-open', route: 'rooms' },
    { key: 'workplace', label: 'Workplace Desks', icon: 'bi-person-workspace', route: 'workplace' },
    { key: 'org-tree', label: 'Organization Tree', icon: 'bi-diagram-2', route: 'org_tree' },
];
const settingsItems = [
    { key: 'contacts', label: 'Contact Details', icon: 'bi-telephone', route: 'org_settings' },
    { key: 'audit-logs', label: 'Audit Logs', icon: 'bi-journal-text', route: 'audit_logs' },
];
export default function OrgHomeSidebar({ currentView, onNavigate, collapsed }) {
    const renderItem = (item) => {
        const isActive = currentView === item.key || currentView === item.route;
        return (<button key={item.key} className={`vms-org-nav-item ${isActive ? 'vms-org-nav-item--active' : ''}`} onClick={() => onNavigate(item.route, item.label)} title={collapsed ? item.label : undefined} aria-current={isActive ? 'page' : undefined}>
        <i className={`bi ${item.icon}`}></i>
        {!collapsed && <span>{item.label}</span>}
      </button>);
    };
    return (<div className="vms-org-sidebar bg-dark border border-secondary rounded-3 overflow-hidden">
      <div className="vms-org-sidebar-header">
        <h6 className="text-white fw-bold mb-0 text-uppercase tracking-wider">
          {collapsed ? 'OM' : 'Organization Mgmt'}
        </h6>
      </div>

      <nav className="vms-org-nav" aria-label="Organization Management Sidebar">
        <div className="d-flex flex-column gap-1">
          {navItems.map(renderItem)}
        </div>

        <div className="vms-sidebar-divider"></div>

        <div className="d-flex flex-column gap-1">
          {settingsItems.map(renderItem)}
        </div>
      </nav>
    </div>);
}
