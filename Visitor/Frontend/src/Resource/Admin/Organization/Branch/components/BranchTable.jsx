import { ArrowUpDown, Eye, Edit, ShieldAlert, Trash2, GitBranch, Mail, Phone, MapPin } from 'lucide-react';
import BranchStatusBadge from './BranchStatusBadge';
export default function BranchTable({ branches, sortBy, sortOrder, onSort, onView, onEdit, onStatus, onDelete, }) {
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
            });
        }
        catch {
            return dateStr;
        }
    };
    const renderSortIcon = (column) => (<ArrowUpDown className={`h-3 w-3 ms-1 ${sortBy === column ? 'text-blue-500' : 'text-slate-400'}`}/>);
    return (<div className="table-responsive vms-table-container">
      <table className="table vms-table align-middle text-xs mb-0">
        <thead>
          <tr className="vms-table-header uppercase tracking-wider text-[11px] font-bold">
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('branchName')}>
              Branch {renderSortIcon('branchName')}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('organizationName')}>
              Organization {renderSortIcon('organizationName')}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('branchType')}>
              Type {renderSortIcon('branchType')}
            </th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('city')}>
              Location {renderSortIcon('city')}
            </th>
            <th className="px-4 py-3 cursor-pointer text-center" onClick={() => onSort('status')}>
              Status {renderSortIcon('status')}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('created_at')}>
              Created {renderSortIcon('created_at')}
            </th>
            <th className="px-4 py-3 text-end">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {branches.map((b) => (<tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
              <td className="px-4 py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="h-8 w-8 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 d-flex align-items-center justify-content-center shrink-0 border border-blue-100 dark:border-blue-900/30">
                    <GitBranch className="h-4 w-4"/>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white d-block">{b.branchName}</span>
                    <span className="badge bg-primary-subtle text-primary font-monospace text-[9px] px-1.5 py-0.5 rounded">{b.branchCode}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                {b.organizationName || 'N/A'}
              </td>
              <td className="px-4 py-3">
                <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                  {b.branchType || 'OFFICE'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1 text-slate-600 dark:text-slate-300 font-semibold">
                  {b.email && (<div className="d-flex align-items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-400"/>
                      <span className="text-truncate" style={{ maxWidth: 140 }}>{b.email}</span>
                    </div>)}
                  {b.phone && (<div className="d-flex align-items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-400"/>
                      <span>{b.phone}</span>
                    </div>)}
                </div>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">
                <div className="d-flex align-items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-slate-400"/>
                  <span>{[b.city, b.country].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <BranchStatusBadge status={b.status} size="sm"/>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">
                {formatDate(b.created_at)}
              </td>
              <td className="px-4 py-3 text-end">
                <div className="d-flex justify-content-end gap-1.5">
                  <button onClick={() => onView(b.id)} className="w-8 h-8 p-0 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 flex items-center justify-center transition-all shadow-sm" title="View Details">
                    <Eye className="h-4 w-4"/>
                  </button>
                  <button onClick={() => onEdit(b.id)} className="w-8 h-8 p-0 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/30 flex items-center justify-center transition-all shadow-sm" title="Edit Branch">
                    <Edit className="h-4 w-4"/>
                  </button>
                  <button onClick={() => onStatus(b.id)} className="w-8 h-8 p-0 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 flex items-center justify-center transition-all shadow-sm" title="Manage Status">
                    <ShieldAlert className="h-4 w-4"/>
                  </button>
                  <button onClick={() => onDelete(b)} className="w-8 h-8 p-0 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-600 hover:text-white border border-rose-500/30 flex items-center justify-center transition-all shadow-sm" title="Delete Branch" aria-label="Delete Branch">
                    <Trash2 className="h-4 w-4"/>
                  </button>
                </div>
              </td>
            </tr>))}
        </tbody>
      </table>
    </div>);
}
