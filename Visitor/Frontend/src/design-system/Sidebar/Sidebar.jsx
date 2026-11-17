/**
 * VMS Design System — Sidebar Component
 * ──────────────────────────────────────
 * Clean, non-collapsing sidebar navigation with direct content access
 * and distinctive background color themes for all roles.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { resolvePhotoUrl } from '../../utils/photoUtils';

export function resolveSidebarRole(userRole, pathname = '') {
    const r = (userRole || '').toLowerCase().trim();
    if (r === 'admin' || r === 'super_admin' || r === 'system_admin' || r === 'developer' || r === 'org_admin') {
        return 'admin';
    }
    if (r === 'manager' || r === 'department_manager' || r.includes('manager')) {
        return 'manager';
    }
    if (r === 'receptionist' || r.includes('reception')) {
        return 'receptionist';
    }
    if (r === 'security' || r === 'security_officer' || r.includes('security')) {
        return 'security';
    }
    if (r === 'employee' || r === 'staff' || r === 'host') {
        return 'employee';
    }
    if (r === 'visitor') {
        return 'visitor';
    }

    // Pathname fallback only if userRole was not specified
    const p = pathname.toLowerCase().trim();
    if (p.startsWith('/admin')) return 'admin';
    if (p.startsWith('/manager')) return 'manager';
    if (p.startsWith('/reception')) return 'receptionist';
    if (p.startsWith('/security')) return 'security';
    if (p.startsWith('/employee')) return 'employee';
    return 'visitor';
}

const roleMetaMap = {
    admin: { labelKey: 'sidebar.administrator', badgeKey: 'sidebar.adminPortal' },
    manager: { labelKey: 'sidebar.deptManager', badgeKey: 'sidebar.managerPortal' },
    receptionist: { labelKey: 'sidebar.receptionDeskLabel', badgeKey: 'sidebar.receptionDesk' },
    security: { labelKey: 'sidebar.securityOfficer', badgeKey: 'sidebar.securityDesk' },
    employee: { labelKey: 'sidebar.staffHost', badgeKey: 'sidebar.staffPortal' },
    visitor: { labelKey: 'sidebar.visitor', badgeKey: 'sidebar.visitorPortal' },
};

export default function Sidebar({ collapsed, onCollapseToggle: _onCollapseToggle, mobileOpen, onMobileClose, user, config, currentView, onViewClick, }) {
    const location = useLocation();
    const { organization, logoUrl: orgLogoUrl, orgName } = useOrganization();
    const { t } = useLanguage();
    const displayLogo = orgLogoUrl || organization?.logoUrl || '/logo.jpg';
    const displayName = (orgName && !orgName.toLowerCase().includes('enterprise vms'))
        ? orgName
        : ((organization?.name && !organization.name.toLowerCase().includes('enterprise vms'))
            ? organization.name
            : 'IT park');
    const activeRole = resolveSidebarRole(user?.role, location.pathname);
    const currentRoleMeta = roleMetaMap[activeRole] || roleMetaMap.visitor;

    const isItemActive = (item) => {
        if (item.view && currentView === item.view) {
            return true;
        }
        return item.submenus?.some((sub) => currentView === sub.view);
    };

    return (<>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (<div className="vms-sidebar-overlay" onClick={onMobileClose} aria-hidden="true"/>)}

      {/* Sidebar Panel with Distinct Role Background Class */}
      <aside className={`vms-sidebar vms-sidebar--${activeRole} ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-visible' : 'mobile-hidden'}`} data-role={activeRole}>
        {/* Brand / Logo */}
        <div className="vms-sidebar__brand">
          <div className="vms-sidebar__logo-full">
            <img src={displayLogo} alt={`${displayName} Logo`} className="vms-sidebar__logo-img" onError={(e) => {
            e.target.src = '/logo.jpg';
        }}/>
            <div className="vms-sidebar__brand-text-wrapper">
              <span className="vms-sidebar__brand-name">
                {displayName}
              </span>
              <span className={`vms-sidebar__role-tag vms-sidebar__role-tag--${activeRole}`}>
                {t(currentRoleMeta.badgeKey)}
              </span>
            </div>
          </div>
          <div className="vms-sidebar__logo-icon">
            <img src={displayLogo} alt={`${displayName} Logo`} className="vms-sidebar__logo-img" onError={(e) => {
            e.target.src = '/logo.jpg';
        }}/>
          </div>
        </div>

        {/* Scrollable Navigation - Clean, Non-Relaxed / Direct Links */}
        <nav className="vms-sidebar__nav">
          <div className="vms-sidebar__section">
            {!collapsed && <div className="vms-sidebar__section-label">{t('sidebar.mainNavigation')}</div>}
            
            {config.map((item) => {
              const active = isItemActive(item);
              const targetView = item.view || (item.submenus && item.submenus.length > 0 ? item.submenus[0].view : null);

              return (
                <div key={item.key} className="w-100 mb-1">
                  <button 
                    type="button"
                    onClick={() => targetView && onViewClick(targetView)} 
                    className={`vms-sidebar__nav-item ${active ? 'active' : ''}`}
                    title={t('menu.' + item.key, item.label)}
                  >
                    <span className="vms-sidebar__nav-item__left">
                      <span className="vms-sidebar__icon">
                        <i className={`bi ${item.iconClass}`}></i>
                      </span>
                      <span className="vms-sidebar__text">{t('menu.' + item.key, item.label)}</span>
                    </span>
                    {item.badge !== undefined && item.badge !== null && item.badge !== '' && (
                      <span className="vms-sidebar__badge badge rounded-pill bg-amber-500 text-slate-950 font-extrabold ms-auto px-2 py-0.5 shadow-sm" style={{ fontSize: '10px' }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Sidebar User Footer */}
        <div className="vms-sidebar__footer">
          <div className="vms-sidebar__user">
            <div className="vms-sidebar__avatar">
              {(user?.avatarUrl || user?.avatar_url || user?.profile_photo || user?.photo_url || user?.photoUrl || user?.avatar) ? (
                <img src={resolvePhotoUrl(user?.avatarUrl || user?.avatar_url || user?.profile_photo || user?.photo_url || user?.photoUrl || user?.avatar)} alt="Profile"/>
              ) : (
                user?.fullName?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="vms-sidebar__user-info">
              <div className="vms-sidebar__user-name" title={user?.fullName || 'User'}>
                {user?.fullName || 'Staff User'}
              </div>
              <div className={`vms-sidebar__user-role-badge vms-sidebar__user-role-badge--${activeRole}`}>
                {t(currentRoleMeta.labelKey)}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>);
}
