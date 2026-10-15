/**
 * VMS Global Enterprise Design System — Standard Page Layout
 * ────────────────────────────────────────────────────────────
 * MANDATORY Page Structure for every page across the Enterprise VMS:
 * Header → Breadcrumb → Page Title → Action Toolbar → Filter Card → Main Content → Pagination → Footer
 */
import Navbar from '../design-system/Navbar/Navbar';
import PublicFooter from '../components/PublicFooter';
import Breadcrumb from '../design-system/Breadcrumb/Breadcrumb';
export function PageLayout({ breadcrumbs = [], title, subtitle, actionToolbar, filterCard, pagination, children, showFooter = true, }) {
    return (<div className="vms-page-container">
      {/* 1. Header */}
      <header className="vms-page-header">
        <Navbar />
      </header>

      {/* Main Body Flow */}
      <main className="vms-page-main">
        {/* 2. Breadcrumb */}
        {breadcrumbs.length > 0 && (<div className="vms-breadcrumb-wrapper">
            <Breadcrumb items={breadcrumbs}/>
          </div>)}

        {/* 3. Page Title & 4. Action Toolbar */}
        {(title || actionToolbar) && (<div className="vms-page-title-section">
            <div>
              {title && <h1 className="vms-page-title">{title}</h1>}
              {subtitle && <p className="vms-page-subtitle">{subtitle}</p>}
            </div>

            {actionToolbar && (<div className="vms-action-toolbar">{actionToolbar}</div>)}
          </div>)}

        {/* 5. Filter Card */}
        {filterCard && <div className="vms-filter-card">{filterCard}</div>}

        {/* 6. Main Content */}
        <div className="vms-main-content">{children}</div>

        {/* 7. Pagination */}
        {pagination && <div className="vms-pagination-wrapper">{pagination}</div>}
      </main>

      {/* 8. Footer */}
      {showFooter && (<footer className="vms-page-footer">
          <PublicFooter />
        </footer>)}
    </div>);
}
export default PageLayout;
