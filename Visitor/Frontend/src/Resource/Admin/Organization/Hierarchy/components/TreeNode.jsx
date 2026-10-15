import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, GitBranch, Network, Info, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
export default function TreeNode({ node, selectedNodeId, onSelectNode, onViewDetails, onDelete, searchQuery = '' }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeId === node.id;
    const isMatch = searchQuery.trim() !== '' && (node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const getIcon = () => {
        switch (node.type) {
            case 'ORGANIZATION': return <Building2 className="h-4 w-4 text-blue-500 shrink-0"/>;
            case 'BRANCH': return <GitBranch className="h-4 w-4 text-amber-500 shrink-0"/>;
            case 'DEPARTMENT': return <Network className="h-4 w-4 text-indigo-500 shrink-0"/>;
        }
    };
    const getBadgeClass = () => {
        switch (node.type) {
            case 'ORGANIZATION': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200';
            case 'BRANCH': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200';
            case 'DEPARTMENT': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200';
        }
    };
    return (<div className="org-tree-node-wrapper select-none my-1">
      <div onClick={() => onSelectNode(node)} className={`d-flex align-items-center justify-content-between p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected
            ? 'bg-primary-subtle border-primary shadow-sm'
            : isMatch
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400'
                : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
        <div className="d-flex align-items-center gap-2 overflow-hidden">
          {hasChildren ? (<button type="button" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              {expanded ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
            </button>) : (<span className="w-6"/>)}

          <div className="p-1.5 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            {getIcon()}
          </div>

          <div className="text-truncate">
            <div className="d-flex align-items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-xs tracking-tight text-truncate">
                {node.name}
              </span>
              <span className={`badge border font-monospace text-[9px] uppercase px-1.5 py-0.5 rounded ${getBadgeClass()}`}>
                {node.code}
              </span>
            </div>
            <div className="text-slate-400 text-[10px] font-semibold d-flex align-items-center gap-2 mt-0.5">
              <span>Level {node.level} • {node.type}</span>
              {node.city && <span>• {node.city}</span>}
              {node.location && <span>• {node.location}</span>}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 shrink-0 ms-3">
          <span className={`badge text-[9px] font-bold px-2 py-0.5 rounded-full ${node.status.toUpperCase() === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'}`}>
            {node.status.toUpperCase() === 'ACTIVE' ? <ShieldCheck className="h-3 w-3 inline me-0.5"/> : <ShieldAlert className="h-3 w-3 inline me-0.5"/>}
            {node.status}
          </span>

          {hasChildren && (<span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-pill px-2">
              {node.children.length} {node.level === 1 ? 'Branches' : 'Depts'}
            </span>)}

          {onViewDetails && (<button onClick={(e) => { e.stopPropagation(); onViewDetails(node); }} className="btn btn-sm btn-outline-secondary p-1 rounded" title="Inspect Node Details">
              <Info className="h-3.5 w-3.5"/>
            </button>)}

          {onDelete && (<button onClick={(e) => { e.stopPropagation(); onDelete(node); }} className="btn btn-sm btn-outline-danger p-1 rounded" title={`Delete ${node.type === 'ORGANIZATION' ? 'Organization' : node.type === 'BRANCH' ? 'Branch' : 'Department'}`} aria-label={`Delete ${node.type === 'ORGANIZATION' ? 'Organization' : node.type === 'BRANCH' ? 'Branch' : 'Department'}`}>
              <Trash2 className="h-3.5 w-3.5"/>
            </button>)}
        </div>
      </div>

      {hasChildren && expanded && (<div className="ms-4 ps-3 border-start border-slate-200 dark:border-slate-800 space-y-1 mt-1">
          {node.children.map((child) => (<TreeNode key={child.id} node={child} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} onViewDetails={onViewDetails} onDelete={onDelete} searchQuery={searchQuery}/>))}
        </div>)}
    </div>);
}
