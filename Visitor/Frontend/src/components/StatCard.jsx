import React from 'react';
export default function StatCard({ title, label, value, icon, color, subtitle, trend }) {
    const displayTitle = title || label || '';
    const displaySubtitle = subtitle || trend;
    // Extract color name from bootstrap bg class
    const colorMap = {
        'bg-cyan-500': 'info',
        'bg-emerald-500': 'success',
        'bg-amber-500': 'warning',
        'bg-indigo-500': 'primary',
        'bg-red-500': 'danger',
    };
    const cleanColor = colorMap[color] || 'primary';
    const renderIcon = () => {
        if (!icon)
            return null;
        if (React.isValidElement(icon)) {
            return icon;
        }
        const IconComp = icon;
        return <IconComp style={{ width: '1.25rem', height: '1.25rem', color: '#FFFFFF' }}/>;
    };
    return (<div className={`vms-card vms-card--stat vms-card--${cleanColor}`}>
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <p className="vms-card__label">{displayTitle}</p>
          <p className="vms-card__value">{value}</p>
          {displaySubtitle && <p className="vms-card__trend">{displaySubtitle}</p>}
        </div>
        <div className="vms-card__icon">
          {renderIcon()}
        </div>
      </div>
    </div>);
}
