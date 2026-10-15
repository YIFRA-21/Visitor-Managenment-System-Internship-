import { CheckCircle, XCircle } from 'lucide-react';
const STATUS_CONFIG = {
    ACTIVE: { label: 'Active', className: 'bg-success-subtle text-success', icon: CheckCircle },
    INACTIVE: { label: 'Inactive', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: XCircle },
};
export default function DepartmentStatusBadge({ status, size = 'sm' }) {
    const normalized = (status || 'ACTIVE').toUpperCase();
    const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.ACTIVE;
    const Icon = config.icon;
    const sizeClasses = {
        sm: 'text-[9px] px-2 py-0.5',
        md: 'text-[10px] px-2.5 py-1',
        lg: 'text-xs px-3 py-1.5',
    };
    return (<span className={`badge d-inline-flex align-items-center gap-1 rounded-pill font-bold uppercase ${config.className} ${sizeClasses[size]}`}>
      <Icon className={size === 'lg' ? 'h-3.5 w-3.5' : 'h-3 w-3'}/>
      {config.label}
    </span>);
}
