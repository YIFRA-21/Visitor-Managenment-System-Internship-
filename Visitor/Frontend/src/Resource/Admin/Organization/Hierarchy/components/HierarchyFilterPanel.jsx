import { Filter, X } from 'lucide-react';
export default function HierarchyFilterPanel({ filters, onFilterChange, onReset }) {
    return (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-1.5">
          <Filter className="h-4 w-4 text-purple-500"/> Search Filters
        </h4>
        <button onClick={onReset} className="btn btn-outline-secondary btn-sm text-[10px] font-bold d-flex align-items-center gap-1">
          <X className="h-3 w-3"/> Clear
        </button>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-3">
          <label className="form-label font-bold text-[10px] uppercase text-slate-400">Name</label>
          <input type="text" className="form-control text-xs font-semibold" placeholder="Filter by name..." value={filters.name} onChange={e => onFilterChange('name', e.target.value)}/>
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label font-bold text-[10px] uppercase text-slate-400">Code</label>
          <input type="text" className="form-control text-xs font-semibold" placeholder="Filter by code..." value={filters.code} onChange={e => onFilterChange('code', e.target.value)}/>
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label font-bold text-[10px] uppercase text-slate-400">Node Type</label>
          <select className="form-select text-xs font-semibold" value={filters.nodeType} onChange={e => onFilterChange('nodeType', e.target.value)}>
            <option value="ALL">All Types</option>
            <option value="ORGANIZATION">Organization</option>
            <option value="BRANCH">Branch</option>
            <option value="DEPARTMENT">Department</option>
          </select>
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label font-bold text-[10px] uppercase text-slate-400">Status</label>
          <select className="form-select text-xs font-semibold" value={filters.status} onChange={e => onFilterChange('status', e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>
    </div>);
}
