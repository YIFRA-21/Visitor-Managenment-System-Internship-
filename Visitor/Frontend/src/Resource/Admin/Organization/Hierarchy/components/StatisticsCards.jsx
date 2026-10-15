import { Building2, GitBranch, Network, Layers, ShieldCheck } from 'lucide-react';
export default function StatisticsCards({ stats }) {
    const cards = [
        {
            label: 'Total Organizations',
            value: stats.totalOrganizations,
            icon: Building2,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30'
        },
        {
            label: 'Total Branches',
            value: stats.totalBranches,
            icon: GitBranch,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
        },
        {
            label: 'Total Departments',
            value: stats.totalDepartments,
            icon: Network,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30'
        },
        {
            label: 'Hierarchy Levels',
            value: stats.maxHierarchyLevels,
            icon: Layers,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30'
        },
        {
            label: 'Active Organizational Units',
            value: stats.totalActiveUnits,
            icon: ShieldCheck,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30'
        }
    ];
    return (<div className="row g-3">
      {cards.map((card, idx) => {
            const IconComponent = card.icon;
            return (<div key={idx} className="col-12 col-sm-6 col-lg">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm h-100 d-flex align-items-center justify-content-between">
              <div>
                <p className="text-slate-400 text-xxs font-bold uppercase tracking-wider mb-1">{card.label}</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-0">{card.value}</h3>
              </div>
              <div className={`h-11 w-11 rounded-xl ${card.bg} ${card.color} d-flex align-items-center justify-content-center shrink-0 border`}>
                <IconComponent className="h-5 w-5"/>
              </div>
            </div>
          </div>);
        })}
    </div>);
}
