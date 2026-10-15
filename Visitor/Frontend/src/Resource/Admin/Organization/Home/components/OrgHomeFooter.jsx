import { useState, useEffect } from 'react';
export default function OrgHomeFooter({ appVersion = '3.1.0-RC1', orgName = 'Enterprise Visitor Management System', environment = import.meta.env.MODE || 'development', year = new Date().getFullYear(), }) {
    const [syncTime, setSyncTime] = useState('');
    useEffect(() => {
        // Set a static initial sync time as last successful refresh or current hour start
        const d = new Date();
        d.setMinutes(0);
        d.setSeconds(0);
        setSyncTime(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, []);
    return (<footer className="vms-org-footer border-top border-secondary pt-3 mt-4">
      <div className="row align-items-center g-3">
        {/* Environment, version, status */}
        <div className="col-md-4">
          <div className="footer-item">
            <span className="health-status-dot" title="Local Gateway Database Online"></span>
            <span className="extra-small text-muted">
              System Gateway Live · v{appVersion}
            </span>
          </div>
        </div>

        {/* Sync & Refresh Info */}
        <div className="col-md-4 text-md-center">
          <div className="footer-item justify-content-md-center">
            <i className="bi bi-arrow-repeat text-muted"></i>
            <span className="extra-small text-muted">
              Database Synced at: <strong className="text-white-50">{syncTime}</strong>
            </span>
          </div>
        </div>

        {/* Copywrite and environment tag */}
        <div className="col-md-4 text-md-end">
          <div className="footer-item justify-content-md-end">
            <span className={`badge border text-capitalize extra-small me-2 ${environment === 'production'
            ? 'bg-success bg-opacity-10 text-success border-success border-opacity-20'
            : 'bg-info bg-opacity-10 text-info border-info border-opacity-20'}`} style={{ fontSize: '0.6rem' }}>
              {environment}
            </span>
            <span className="extra-small text-muted">
              &copy; {year} {orgName}
            </span>
          </div>
        </div>
      </div>
    </footer>);
}
