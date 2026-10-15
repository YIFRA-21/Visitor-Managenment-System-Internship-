/**
 * VMS Design System — StatusBadge Component
 * ───────────────────────────────────────────
 * Renders a pill badge for appointment/visitor statuses.
 */
// Map raw status strings to badge variant
const statusMap = {
    pending: 'pending',
    submitted: 'pending',
    awaiting_approval: 'pending',
    approved: 'approved',
    confirmed: 'approved',
    active: 'active',
    rejected: 'rejected',
    denied: 'rejected',
    cancelled: 'cancelled',
    blocked: 'blocked',
    blacklisted: 'blacklisted',
    checked_in: 'checked-in',
    'checked-in': 'checked-in',
    checked_out: 'checked-out',
    'checked-out': 'checked-out',
    completed: 'completed',
    in_progress: 'in-progress',
    'in-progress': 'in-progress',
    scheduled: 'scheduled',
    inactive: 'inactive',
    expired: 'neutral',
};
function getVariant(status, variant) {
    if (variant)
        return variant;
    if (status) {
        const normalized = status.toLowerCase().replace(/[\s-]+/g, '_');
        return statusMap[normalized] || 'default';
    }
    return 'default';
}
function getLabel(status, children) {
    if (children)
        return children;
    if (status) {
        return status
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return '';
}
export default function StatusBadge({ status, variant, children, dot = true, icon, size = 'md', className = '', }) {
    const resolvedVariant = getVariant(status, variant);
    const classes = [
        'vms-badge',
        `vms-badge--${resolvedVariant}`,
        size !== 'md' ? `vms-badge--${size}` : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (<span className={classes}>
      {icon && icon}
      {dot && !icon && <span className="vms-badge__dot"/>}
      {getLabel(status, children)}
    </span>);
}
