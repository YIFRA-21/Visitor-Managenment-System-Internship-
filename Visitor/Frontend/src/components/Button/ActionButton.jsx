/**
 * VMS Global Enterprise Design System — ActionButton Component
 * ─────────────────────────────────────────────────────────────
 * Enforces unchangeable action button colors and icons across all pages.
 */
import { forwardRef } from 'react';
import Button from './Button';
import { Eye, Edit, PlusCircle, UserPlus, Save, Trash2, RefreshCw, RotateCcw, Search, Download, Upload, FileSpreadsheet, Printer, History, ShieldCheck, CheckCircle, XCircle, } from 'lucide-react';
const actionIconMap = {
    view: <Eye size={16}/>,
    edit: <Edit size={16}/>,
    add: <PlusCircle size={16}/>,
    register: <UserPlus size={16}/>,
    save: <Save size={16}/>,
    delete: <Trash2 size={16}/>,
    refresh: <RefreshCw size={16}/>,
    reset: <RotateCcw size={16}/>,
    search: <Search size={16}/>,
    export: <Download size={16}/>,
    import: <Upload size={16}/>,
    download: <FileSpreadsheet size={16}/>,
    upload: <Upload size={16}/>,
    print: <Printer size={16}/>,
    history: <History size={16}/>,
    security: <ShieldCheck size={16}/>,
    approve: <CheckCircle size={16}/>,
    reject: <XCircle size={16}/>,
};
const actionLabelMap = {
    view: 'View',
    edit: 'Edit',
    add: 'Add New',
    register: 'Register',
    save: 'Save Changes',
    delete: 'Delete',
    refresh: 'Refresh',
    reset: 'Reset',
    search: 'Search',
    export: 'Export Data',
    import: 'Import',
    download: 'Download',
    upload: 'Upload',
    print: 'Print',
    history: 'History',
    security: 'Security Check',
    approve: 'Approve',
    reject: 'Reject',
};
export const ActionButton = forwardRef(({ action, children, icon, className = '', ...props }, ref) => {
    const actionClass = `vms-action-btn--${action}`;
    const defaultIcon = icon || actionIconMap[action];
    const buttonText = children || actionLabelMap[action];
    return (<Button ref={ref} icon={defaultIcon} className={`${actionClass} ${className}`} {...props}>
        {buttonText}
      </Button>);
});
ActionButton.displayName = 'ActionButton';
export default ActionButton;
