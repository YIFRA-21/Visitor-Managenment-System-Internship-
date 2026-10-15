export default function ChartCard({ title, subtitle, children, actions }) {
    return (<div className="vms-chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="chart-actions">{actions}</div>}
      </div>
      <div className="chart-body">{children}</div>
    </div>);
}
