import { Building2, GitBranch, Network, ChevronRight } from 'lucide-react';
export default function HierarchyBreadcrumb({ organizationName, branchName, departmentName }) {
    return (<nav className="d-flex align-items-center gap-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
      <div className="d-flex align-items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
        <Building2 className="h-4 w-4 shrink-0"/>
        <span>{organizationName || 'All Organizations'}</span>
      </div>

      {branchName && (<>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0"/>
          <div className="d-flex align-items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
            <GitBranch className="h-4 w-4 shrink-0"/>
            <span>{branchName}</span>
          </div>
        </>)}

      {departmentName && (<>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0"/>
          <div className="d-flex align-items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
            <Network className="h-4 w-4 shrink-0"/>
            <span>{departmentName}</span>
          </div>
        </>)}
    </nav>);
}
