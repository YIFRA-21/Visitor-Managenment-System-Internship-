/**
 * VMS Design System — SearchBox Component
 */
export default function SearchBox({ value, onChange, placeholder = 'Search...', className = '' }) {
    return (<div className={`vms-search-box ${className}`}>
      <i className="bi bi-search vms-search-icon"></i>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="vms-search-input" aria-label={placeholder}/>
      {value && (<button onClick={() => onChange('')} className="vms-search-clear" aria-label="Clear search">
          <i className="bi bi-x-lg"></i>
        </button>)}
    </div>);
}
