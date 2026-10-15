import { useState, useRef, useEffect } from 'react';
const searchTypes = [
    { value: 'all', label: 'All Categories', icon: 'bi-grid' },
    { value: 'organization', label: 'Organization Name', icon: 'bi-building' },
    { value: 'code', label: 'Org Code', icon: 'bi-hash' },
    { value: 'branch', label: 'Branch Name', icon: 'bi-diagram-3' },
    { value: 'department', label: 'Department Name', icon: 'bi-columns-gap' },
];
export default function SearchPanel({ onSearch, onReset, loading, searchResults, onResultClick, }) {
    const [query, setQuery] = useState('');
    const [activeType, setActiveType] = useState('all');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const resultsContainerRef = useRef(null);
    // Trigger search when query or activeType changes
    useEffect(() => {
        if (query.trim().length >= 2) {
            onSearch(query.trim(), activeType);
        }
    }, [query, activeType, onSearch]);
    const handleReset = () => {
        setQuery('');
        setActiveType('all');
        setFocusedIndex(-1);
        onReset();
    };
    // Keyboard navigation through results
    const handleKeyDown = (e) => {
        if (!searchResults || searchResults.length === 0)
            return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        }
        else if (e.key === 'Enter' && focusedIndex >= 0) {
            e.preventDefault();
            onResultClick?.(searchResults[focusedIndex]);
        }
        else if (e.key === 'Escape') {
            handleReset();
        }
    };
    // Text highlighting utility
    const highlightMatch = (text, search) => {
        if (!search || !text)
            return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${search})`, 'gi'));
        return (<span>
        {parts.map((part, i) => part.toLowerCase() === search.toLowerCase() ? (<mark key={i} className="rounded-1">{part}</mark>) : (part))}
      </span>);
    };
    const getResultIcon = (type) => {
        switch (type) {
            case 'organization': return 'bi-building text-primary';
            case 'branch': return 'bi-diagram-3 text-success';
            case 'department': return 'bi-columns-gap text-warning';
            default: return 'bi-file-text text-secondary';
        }
    };
    return (<div className="vms-search-panel bg-dark border border-secondary rounded-3 p-3" onKeyDown={handleKeyDown}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <i className="bi bi-search text-success"></i>
        <h6 className="text-white mb-0 fw-semibold small">Registry Search Engine</h6>
      </div>

      {/* Input query and reset button */}
      <div className="row g-2 mb-3">
        <div className="col-12">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-dark border-secondary text-muted">
              {loading ? (<span className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '12px', height: '12px' }}></span>) : (<i className="bi bi-search"></i>)}
            </span>
            <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Search directory by typing names, codes, regions..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Directory search box"/>
            {query && (<button type="button" className="btn btn-outline-secondary border-secondary" onClick={handleReset}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>)}
          </div>
        </div>
      </div>

      {/* Category toggle buttons */}
      <div className="d-flex flex-wrap gap-1.5 mb-3">
        {searchTypes.map((t) => (<button key={t.value} type="button" className={`btn btn-sm search-type-btn border ${activeType === t.value ? 'active' : 'border-secondary text-muted'}`} onClick={() => setActiveType(t.value)}>
            <i className={`bi ${t.icon} me-1`}></i>
            {t.label}
          </button>))}
      </div>

      {/* Results panel list */}
      {searchResults && (<div className="vms-search-results-list border-top border-secondary pt-3 mt-2" ref={resultsContainerRef}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
              Showing {searchResults.length} match{searchResults.length === 1 ? '' : 'es'} found
            </span>
            <button className="btn btn-sm btn-link text-primary text-decoration-none small p-0" style={{ fontSize: '0.7rem' }} onClick={handleReset}>
              Clear
            </button>
          </div>

          {searchResults.length === 0 ? (<div className="text-center py-4 bg-dark-subtle rounded-3 border border-secondary border-opacity-10">
              <i className="bi bi-search-heart fs-4 text-muted d-block mb-1"></i>
              <span className="text-muted small">No matches found. Refine your query parameters.</span>
            </div>) : (<div className="d-flex flex-column gap-1.5" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {searchResults.map((result, idx) => (<div key={result.id} className={`search-result-item d-flex align-items-center gap-2.5 ${focusedIndex === idx ? 'active' : ''}`} onClick={() => onResultClick?.(result)} role="button" tabIndex={0} onMouseEnter={() => setFocusedIndex(idx)}>
                  <i className={`bi ${getResultIcon(result.type)} fs-5`}></i>
                  <div className="flex-grow-1 min-w-0">
                    <div className="text-white small fw-semibold text-truncate">
                      {highlightMatch(result.title, query)}
                    </div>
                    <div className="text-muted text-truncate" style={{ fontSize: '0.65rem' }}>
                      {result.description}
                    </div>
                  </div>
                  <span className="badge rounded-pill bg-dark border border-secondary text-capitalize text-muted" style={{ fontSize: '0.55rem' }}>
                    {result.type}
                  </span>
                </div>))}
            </div>)}
        </div>)}
    </div>);
}
