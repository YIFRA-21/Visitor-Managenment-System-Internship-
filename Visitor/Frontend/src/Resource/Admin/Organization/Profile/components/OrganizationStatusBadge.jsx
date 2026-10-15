import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Archive } from 'lucide-react';
const STATUS_CONFIG = {
    ACTIVE: {
        label: 'Active',
        className: 'org-status-badge--active',
        icon: <CheckCircle className="h-3.5 w-3.5"/>,
    },
    INACTIVE: {
        label: 'Inactive',
        className: 'org-status-badge--inactive',
        icon: <XCircle className="h-3.5 w-3.5"/>,
    },
    SUSPENDED: {
        label: 'Suspended',
        className: 'org-status-badge--suspended',
        icon: <AlertTriangle className="h-3.5 w-3.5"/>,
    },
    ARCHIVED: {
        label: 'Archived',
        className: 'org-status-badge--archived',
        icon: <Archive className="h-3.5 w-3.5"/>,
    },
};
export default function OrganizationStatusBadge({ status, size = 'md', showIcon = true, }) {
    const config = STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG.ACTIVE;
    return (<span className={`org-status-badge org-status-badge--${size} ${config.className}`}>
      {showIcon && config.icon}
      {config.label}
    </span>);
}
