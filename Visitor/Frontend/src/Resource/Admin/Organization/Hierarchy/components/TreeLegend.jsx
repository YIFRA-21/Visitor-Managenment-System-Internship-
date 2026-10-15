import { Building2, GitBranch, Network, ShieldCheck, ShieldAlert } from 'lucide-react';
export default function TreeLegend() {
    return (<div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs d-flex flex-wrap align-items-center justify-content-between gap-4">
      <div className="d-flex align-items-center gap-4">
        <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Node Types:</span>
        <span className="d-flex align-items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
          <Building2 className="h-4 w-4 text-blue-500"/> Level 1: Organization
        </span>
        <span className="d-flex align-items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
          <GitBranch className="h-4 w-4 text-amber-500"/> Level 2: Branch
        </span>
        <span className="d-flex align-items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
          <Network className="h-4 w-4 text-indigo-500"/> Level 3: Department
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        <span className="d-flex align-items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5"/> Active Unit
        </span>
        <span className="d-flex align-items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
          <ShieldAlert className="h-3.5 w-3.5"/> Inactive Unit
        </span>
      </div>
    </div>);
}
