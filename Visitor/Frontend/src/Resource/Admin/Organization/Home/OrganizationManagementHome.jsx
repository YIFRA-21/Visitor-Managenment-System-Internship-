import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { useOrgHome } from './hooks/useOrgHome';
import DashboardHeader from './components/DashboardHeader';
import DashboardCard from './components/DashboardCard';
import QuickActionCard from './components/QuickActionCard';
import StatisticsSection from './components/StatisticsSection';
import ActivityTimeline from './components/ActivityTimeline';
import SearchPanel from './components/SearchPanel';
import OrgHomeSidebar from './components/OrgHomeSidebar';
import OrgHomeFooter from './components/OrgHomeFooter';
import RightNotificationPanel from './components/RightNotificationPanel';
import EmptyState from './components/EmptyState';
import LoadingSkeleton from './components/LoadingSkeleton';
import ErrorState from './components/ErrorState';
export default function OrganizationManagementHome() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { cards, activities, quickActions, statistics, systemHealth, loading, error, hasPermission, isSystemAdmin, refresh, searchResults, searchLoading, handleSearch, handleSearchReset, } = useOrgHome();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [notificationPanelOpen, setNotificationPanelOpen] = useState(true);
    const handleCardClick = useCallback((card) => {
        // Navigate to related sub-module view based on card
        if (card.id === 1 || card.id === 2) {
            navigate('/admin/dashboard?view=organizations');
        }
        else if (card.id === 3) {
            navigate('/admin/dashboard?view=branches');
        }
        else if (card.id === 4) {
            navigate('/admin/dashboard?view=departments_mgmt');
        }
        else if (card.id === 5) {
            navigate('/admin/dashboard?view=buildings');
        }
        else if (card.id === 6 || card.id === 7) {
            navigate('/admin/dashboard?view=users');
        }
        else if (card.id === 8) {
            navigate('/admin/dashboard?view=checkin');
        }
        else if (card.id === 9) {
            navigate('/admin/dashboard?view=requests');
        }
    }, [navigate]);
    const handleQuickActionClick = useCallback((action) => {
        navigate(`/admin/dashboard?view=${action.route}`);
    }, [navigate]);
    const handleNavigate = useCallback((route, _label) => {
        navigate(`/admin/dashboard?view=${route}`);
    }, [navigate]);
    const handleSearchResultClick = useCallback((result) => {
        if (result.route) {
            navigate(`/admin/dashboard?view=${result.route}`);
        }
    }, [navigate]);
    if (!isSystemAdmin) {
        return (<div className="p-4">
        <ErrorState title="Access Denied" message="Only System Administrators can access the Organization Management module. If you believe this is an error, please contact your system administrator." icon="bi-shield-lock"/>
      </div>);
    }
    if (loading) {
        return (<div className="p-4 vms-org-home">
        <div className="vms-skeleton-header mb-4">
          <div className="bg-secondary rounded-2 placeholder-glow mb-2" style={{ width: '280px', height: '28px', opacity: 0.3 }}>
            <span className="placeholder col-12"></span>
          </div>
          <div className="bg-secondary rounded-2 placeholder-glow" style={{ width: '200px', height: '16px', opacity: 0.2 }}>
            <span className="placeholder col-12"></span>
          </div>
        </div>
        <LoadingSkeleton type="cards" count={6}/>
        <div className="mt-4">
          <LoadingSkeleton type="chart"/>
        </div>
      </div>);
    }
    if (error) {
        return (<div className="p-4 vms-org-home">
        <ErrorState title="Failed to Load" message={error} onRetry={refresh}/>
      </div>);
    }
    const allowedQuickActions = quickActions.filter(a => hasPermission(a.requiredPermission));
    return (<div className="vms-org-home p-1">
      {/*Sticky Top Header Bar */}
      <DashboardHeader userName={user?.fullName || 'User'} userRole={user?.role === 'admin' ? 'System Administrator' : user?.role || 'User'} onNotificationClick={() => setNotificationPanelOpen(!notificationPanelOpen)} onSearch={(q) => handleSearch(q, 'all')}/>

      <div className="row g-4">
        {/* Left Side Sidebar Panel */}
        <div className="col-auto d-none d-lg-block" style={{ width: sidebarCollapsed ? '75px' : '230px', transition: 'width 0.2s ease-in-out' }}>
          <OrgHomeSidebar currentView="home" onNavigate={handleNavigate} collapsed={sidebarCollapsed}/>
          <button className="btn btn-sm btn-outline-secondary w-100 mt-2" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}>
            <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>
        </div>

        {/* Main Body Dashboard Columns */}
        <div className="col min-w-0">
          <div className="vms-org-main-content d-flex flex-column gap-4">
            
            {/* Command greeting banner */}
            <div className="vms-welcome-banner vms-section-animated">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <h5 className="vms-welcome-title">System Control Panel &mdash; Organization Hub</h5>
                  <p className="vms-welcome-subtitle">
                    Welcome back, <strong>{user?.fullName || 'Administrator'}</strong>. Configure system roles, organization schemas, departments, and branding rules.
                  </p>
                </div>
                <div className="vms-health-indicators">
                  <div className="vms-health-item">
                    <span className={`health-dot ${systemHealth.apiStatus === 'healthy' ? 'healthy' : 'warning'}`}></span>
                    <span>API Gateway: Online</span>
                  </div>
                  <div className="vms-health-item">
                    <span className={`health-dot ${systemHealth.dbStatus === 'healthy' ? 'healthy' : 'warning'}`}></span>
                    <span>Database: Synced</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard summary count cards */}
            <section className="vms-section-animated">
              <div className="vms-section-header">
                <h5 className="section-title">
                  <div className="section-icon icon-blue">
                    <i className="bi bi-speedometer2"></i>
                  </div>
                  Command Summary Cards
                </h5>
                <span className="section-meta">Live Metrics Console</span>
              </div>
              <div className="row g-3">
                {cards.map((card) => (<div key={card.id} className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
                    <DashboardCard card={card} onClick={handleCardClick}/>
                  </div>))}
              </div>
            </section>

            {/* Action launcher grid */}
            <section className="vms-section-animated">
              <div className="vms-section-header">
                <h5 className="section-title">
                  <div className="section-icon icon-amber">
                    <i className="bi bi-lightning"></i>
                  </div>
                  Quick Actions Launcher
                </h5>
              </div>
              {allowedQuickActions.length === 0 ? (<EmptyState title="No Actions Available" description="You do not possess the system credentials required to launch quick configuration menus." icon="bi-shield-slash"/>) : (<div className="row g-3">
                  {allowedQuickActions.map((action) => (<div key={action.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
                      <QuickActionCard action={action} onClick={handleQuickActionClick}/>
                    </div>))}
                </div>)}
            </section>

            {/* Analytics and growth stats */}
            <section className="vms-section-animated">
              <div className="vms-section-header">
                <h5 className="section-title">
                  <div className="section-icon icon-teal">
                    <i className="bi bi-bar-chart-line"></i>
                  </div>
                  Enterprise Analytics & Distribution
                </h5>
              </div>
              <StatisticsSection statistics={statistics} loading={loading}/>
            </section>

            {/* Search engine panel */}
            <section className="vms-section-animated">
              <div className="vms-section-header">
                <h5 className="section-title">
                  <div className="section-icon icon-green">
                    <i className="bi bi-search"></i>
                  </div>
                  Directory Search Engine
                </h5>
              </div>
              <SearchPanel onSearch={handleSearch} onReset={handleSearchReset} loading={searchLoading} searchResults={searchResults} onResultClick={handleSearchResultClick}/>
            </section>

            {/* Audit log operation tracker */}
            <section className="vms-section-animated">
              <div className="vms-section-header">
                <h5 className="section-title">
                  <div className="section-icon icon-rose">
                    <i className="bi bi-activity"></i>
                  </div>
                  Recent Operations Audit Trail
                </h5>
              </div>
              <div className="bg-dark border border-secondary border-opacity-10 rounded-3 p-3">
                <ActivityTimeline activities={activities} loading={loading}/>
              </div>
            </section>

          </div>
        </div>

        {/* Right notification feeds column */}
        {notificationPanelOpen && (<div className="col-auto d-none d-xl-block flex-shrink-0" style={{ width: '280px' }}>
            <div className="sticky-top" style={{ top: '80px', zIndex: 10 }}>
              <RightNotificationPanel />
            </div>
          </div>)}
      </div>

      {/* Database sync status footer */}
      <OrgHomeFooter />
    </div>);
}
