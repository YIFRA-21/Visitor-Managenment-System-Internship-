import { useState } from 'react';
import { Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
const ORG_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'CORPORATION', label: 'Corporation' },
    { value: 'NON_PROFIT', label: 'Non-Profit' },
    { value: 'GOVERNMENT', label: 'Government' },
    { value: 'EDUCATIONAL', label: 'Educational' },
    { value: 'HEALTHCARE', label: 'Healthcare' },
    { value: 'FINANCIAL', label: 'Financial' },
    { value: 'TECHNOLOGY', label: 'Technology' },
    { value: 'OTHER', label: 'Other' },
];
const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' },
];
export default function OrganizationFilterPanel({ filters, onFilterChange, onClear, }) {
    const [expanded, setExpanded] = useState(false);
    const activeFilterCount = Object.values(filters).filter(v => v && v.trim() !== '').length;
    const updateFilter = (key, value) => {
        onFilterChange({ ...filters, [key]: value });
    };
    return (<div className="org-filter-panel">
      {/* Toggle Header */}
      <button className="org-filter-panel__toggle" onClick={() => setExpanded(!expanded)} type="button">
        <div className="d-flex align-items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400"/>
          <span className="fw-bold text-xs">Advanced Filters</span>
          {activeFilterCount > 0 && (<span className="org-filter-panel__count">{activeFilterCount}</span>)}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
      </button>

      {/* Collapsible Filters */}
      {expanded && (<div className="org-filter-panel__body">
          <div className="row g-3">
            {/* Status */}
            <div className="col-12 col-md-3">
              <label className="form-label text-xs fw-bold text-slate-500 text-uppercase mb-1">Status</label>
              <select className="form-select form-select-sm text-xs fw-semibold" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
                {STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>

            {/* Organization Type */}
            <div className="col-12 col-md-3">
              <label className="form-label text-xs fw-bold text-slate-500 text-uppercase mb-1">Type</label>
              <select className="form-select form-select-sm text-xs fw-semibold" value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
                {ORG_TYPES.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>

            {/* Registration Number */}
            <div className="col-12 col-md-3">
              <label className="form-label text-xs fw-bold text-slate-500 text-uppercase mb-1">Registration #</label>
              <input type="text" className="form-control form-control-sm text-xs fw-semibold" placeholder="Search by reg. number..." value={filters.registrationNumber} onChange={(e) => updateFilter('registrationNumber', e.target.value)}/>
            </div>

            {/* Date Range */}
            <div className="col-12 col-md-3">
              <label className="form-label text-xs fw-bold text-slate-500 text-uppercase mb-1">Created From</label>
              <input type="date" className="form-control form-control-sm text-xs fw-semibold" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)}/>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label text-xs fw-bold text-slate-500 text-uppercase mb-1">Created To</label>
              <input type="date" className="form-control form-control-sm text-xs fw-semibold" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)}/>
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (<div className="mt-3 d-flex justify-content-end">
              <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 text-xs fw-bold" onClick={onClear} type="button">
                <RotateCcw className="h-3.5 w-3.5"/>
                Clear All Filters
              </button>
            </div>)}
        </div>)}
    </div>);
}
