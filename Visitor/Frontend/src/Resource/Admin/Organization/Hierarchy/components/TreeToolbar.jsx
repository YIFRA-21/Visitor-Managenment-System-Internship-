import { Search, ZoomIn, ZoomOut, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
export default function TreeToolbar({ searchQuery, onSearchChange, onExpandAll, onCollapseAll, onRefresh, isFullscreen, onToggleFullscreen }) {
    return (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3">
      <div className="position-relative flex-grow-1" style={{ maxWidth: 360 }}>
        <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4 w-4"/>
        <input type="text" className="form-control ps-5 text-xs font-semibold" placeholder="Filter nodes by name or code..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}/>
      </div>

      <div className="d-flex align-items-center gap-2">
        {onExpandAll && (<button onClick={onExpandAll} className="btn btn-outline-secondary btn-sm text-xs font-bold d-flex align-items-center gap-1.5">
            <ZoomIn className="h-3.5 w-3.5"/> Expand All
          </button>)}
        {onCollapseAll && (<button onClick={onCollapseAll} className="btn btn-outline-secondary btn-sm text-xs font-bold d-flex align-items-center gap-1.5">
            <ZoomOut className="h-3.5 w-3.5"/> Collapse All
          </button>)}
        {onRefresh && (<button onClick={onRefresh} className="btn btn-outline-secondary btn-sm text-xs font-bold d-flex align-items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5"/> Refresh Tree
          </button>)}
        {onToggleFullscreen && (<button onClick={onToggleFullscreen} className="btn btn-primary btn-sm text-xs font-bold d-flex align-items-center gap-1.5">
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5"/> : <Maximize2 className="h-3.5 w-3.5"/>}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>)}
      </div>
    </div>);
}
