/**
 * VMS Global Enterprise Design System — DataTable Component
 * ───────────────────────────────────────────────────────────
 * Enterprise-grade DataTable enforcing Sticky Header, Sorting, Search,
 * Pagination, Responsive Scroll, Skeleton Loading, Bulk Selection & Row Hover.
 */
import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Inbox } from 'lucide-react';
export function DataTable({ columns, data, keyField = 'id', loading = false, emptyMessage = 'No data available', emptyIcon = <Inbox size={40}/>, searchable = false, searchPlaceholder = 'Search records...', pagination, onRowClick, stickyHeader = true, actions, selectable = false, selectedKeys = [], onSelectionChange, className = '', tableId, }) {
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const sortedData = useMemo(() => {
        if (!sortKey || pagination)
            return data;
        return [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (aVal == null)
                return 1;
            if (bVal == null)
                return -1;
            const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir, pagination]);
    const filteredData = useMemo(() => {
        if (!searchTerm || pagination)
            return sortedData;
        const term = searchTerm.toLowerCase();
        return sortedData.filter((row) => columns.some((col) => {
            const val = row[col.key];
            return val != null && String(val).toLowerCase().includes(term);
        }));
    }, [sortedData, searchTerm, columns, pagination]);
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        }
        else {
            setSortKey(key);
            setSortDir('asc');
        }
    };
    const isAllSelected = useMemo(() => {
        if (filteredData.length === 0)
            return false;
        return filteredData.every((row) => selectedKeys.includes(String(row[keyField])));
    }, [filteredData, selectedKeys, keyField]);
    const handleSelectAll = () => {
        if (!onSelectionChange)
            return;
        if (isAllSelected) {
            onSelectionChange([]);
        }
        else {
            onSelectionChange(filteredData.map((row) => String(row[keyField])));
        }
    };
    const handleSelectRow = (rowKey) => {
        if (!onSelectionChange)
            return;
        if (selectedKeys.includes(rowKey)) {
            onSelectionChange(selectedKeys.filter((k) => k !== rowKey));
        }
        else {
            onSelectionChange([...selectedKeys, rowKey]);
        }
    };
    return (<div className={`vms-table-container ${className}`}>
      {(searchable || actions) && (<div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid var(--vms-border)', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {searchable && (<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--vms-bg-input)', border: '1px solid var(--vms-border-input)', borderRadius: '0.5rem', padding: '0.375rem 0.75rem', minWidth: 'min(260px, 100%)', flex: '1 1 auto' }}>
              <Search size={18} style={{ color: 'var(--vms-text-muted)', flexShrink: 0 }}/>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={searchPlaceholder} style={{ background: 'transparent', border: 'none', color: 'var(--vms-text-primary)', outline: 'none', width: '100%', fontSize: '0.875rem' }}/>
            </div>)}
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{actions}</div>}
        </div>)}

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
        <table id={tableId} className="vms-table">

          <thead>
            <tr>
              {selectable && (<th className="vms-table__checkbox">
                  <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} aria-label="Select all rows"/>
                </th>)}
              {columns.map((col) => (<th key={col.key} className={col.sortable ? 'sortable' : ''} style={{ width: col.width, textAlign: col.align }} onClick={() => col.sortable && handleSort(col.key)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (<span>{sortDir === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>)}
                  </div>
                </th>))}
            </tr>
          </thead>
          <tbody>
            {loading ? (Array.from({ length: 5 }).map((_, i) => (<tr key={`skeleton-${i}`}>
                  {selectable && <td className="vms-table__checkbox"><div style={{ width: 16, height: 16, background: 'var(--vms-bg-hover)', borderRadius: 4 }}/></td>}
                  {columns.map((col) => (<td key={col.key}>
                      <div style={{ height: 18, background: 'var(--vms-bg-hover)', borderRadius: 4, width: '80%' }}/>
                    </td>))}
                </tr>))) : filteredData.length === 0 ? (<tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--vms-text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    {emptyIcon}
                    <p style={{ margin: 0, fontWeight: 500 }}>{emptyMessage}</p>
                  </div>
                </td>
              </tr>) : (filteredData.map((row, idx) => {
            const rowKey = String(row[keyField] ?? idx);
            const isSelected = selectedKeys.includes(rowKey);
            return (<tr key={rowKey} className={`${onRowClick ? 'clickable' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => onRowClick?.(row)}>
                    {selectable && (<td className="vms-table__checkbox" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(rowKey)} aria-label={`Select row ${idx + 1}`}/>
                      </td>)}
                    {columns.map((col) => (<td key={col.key} style={{ textAlign: col.align }}>
                        {col.render ? col.render(row, idx) : (row[col.key] ?? '—')}
                      </td>))}
                  </tr>);
        }))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid var(--vms-border)', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--vms-text-secondary)', flexWrap: 'wrap' }}>
            <span>Rows:</span>
            <select value={pagination.limit} onChange={(e) => pagination.onLimitChange(Number(e.target.value))} className="vms-select" style={{ width: 'auto', minHeight: '34px', padding: '0.25rem 0.5rem' }}>
              {[10, 20, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
            <span>
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
            <button className="vms-btn vms-btn--ghost vms-btn--sm" onClick={() => pagination.onPageChange(1)} disabled={pagination.page <= 1} aria-label="First page"><ChevronsLeft size={16}/></button>
            <button className="vms-btn vms-btn--ghost vms-btn--sm" onClick={() => pagination.onPageChange(pagination.page - 1)} disabled={pagination.page <= 1} aria-label="Previous page"><ChevronLeft size={16}/></button>
            <span style={{ padding: '0 0.5rem', fontWeight: 600, fontSize: '0.8125rem' }}>Page {pagination.page} of {pagination.totalPages}</span>
            <button className="vms-btn vms-btn--ghost vms-btn--sm" onClick={() => pagination.onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} aria-label="Next page"><ChevronRight size={16}/></button>
            <button className="vms-btn vms-btn--ghost vms-btn--sm" onClick={() => pagination.onPageChange(pagination.totalPages)} disabled={pagination.page >= pagination.totalPages} aria-label="Last page"><ChevronsRight size={16}/></button>
          </div>
        </div>)}

    </div>);
}
export default DataTable;
