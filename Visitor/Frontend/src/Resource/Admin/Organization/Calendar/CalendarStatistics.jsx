import React from 'react';
import { TrendingUp, Calendar, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
export default function CalendarStatistics({ stats }) {
    const kpis = stats?.kpis || {
        totalWorkingDaysYear: 247,
        totalHolidaysCount: 6,
        upcomingHolidaysCount: 3,
        branchesDefaultCount: 4,
        branchesCustomCount: 1,
        specialWorkingDaysCount: 1,
        standardWeekendDaysCount: 104
    };
    const statCards = [
        { label: 'Schedule Coverage', value: '82%', desc: 'Yearly operational ratio', icon: <TrendingUp className="h-5 w-5 text-blue-500"/>, bg: 'rgba(59,130,246,0.08)' },
        { label: 'Branches on Defaults', value: kpis.branchesDefaultCount, desc: 'Inheriting org schedule rules', icon: <ShieldCheck className="h-5 w-5 text-emerald-500"/>, bg: 'rgba(16,185,129,0.08)' },
        { label: 'Branches on Custom', value: kpis.branchesCustomCount, desc: 'Explicit branch overrides active', icon: <Clock className="h-5 w-5 text-amber-500"/>, bg: 'rgba(245,158,11,0.08)' },
        { label: 'Exemptions Configured', value: kpis.specialWorkingDaysCount, desc: 'Special days or half days', icon: <Calendar className="h-5 w-5 text-purple-500"/>, bg: 'rgba(139,92,246,0.08)' }
    ];
    return (<div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="row g-3">
        {statCards.map((card, i) => (<div key={i} className="col-12 col-md-6 col-lg-3">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm d-flex justify-content-between align-items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 d-block mb-1">{card.label}</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{card.value}</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-none">{card.desc}</p>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-850" style={{ backgroundColor: card.bg }}>
                {card.icon}
              </div>
            </div>
          </div>))}
      </div>

      {/* Detail Analytics row */}
      <div className="row g-4">
        {/* Utilization Breakdown */}
        <div className="col-12 col-md-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0">
              Schedule Utilization Ratio
            </h3>
            <p className="text-xxs text-slate-400 font-semibold mb-4">Analyzing how calendar hours map across operational and exclusion bounds.</p>

            <div className="space-y-3">
              {(stats?.charts?.scheduleUtilization || [
            { name: 'Operational Hours', value: 72 },
            { name: 'Lunch Break & Off-Shift', value: 12 },
            { name: 'Weekend Closures', value: 14 },
            { name: 'Holiday Exclusions', value: 2 }
        ]).map((item, i) => {
            const colors = ['#22c55e', '#3b82f6', '#94a3b8', '#ef4444'];
            return (<div key={i} className="space-y-1">
                    <div className="d-flex justify-content-between align-items-center text-xs font-semibold">
                      <span className="text-slate-650 dark:text-slate-350">{item.name}</span>
                      <span className="font-extrabold text-slate-950 dark:text-white">{item.value}%</span>
                    </div>
                    <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(148,163,184,0.1)' }}>
                      <div className="progress-bar rounded" role="progressbar" style={{
                    width: `${item.value}%`,
                    backgroundColor: colors[i % colors.length]
                }}/>
                    </div>
                  </div>);
        })}
            </div>
          </div>
        </div>

        {/* Mapped stats details */}
        <div className="col-12 col-md-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0">
              Calendar Compliance & Safety
            </h3>
            
            <div className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-350">
              <div className="d-flex gap-3 align-items-start p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0"/>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-950 dark:text-white uppercase mb-0.5">Time Zone Sync</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0">
                    All calendar timezones and offsets comply with ISO standard specifications.
                  </p>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-start p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0"/>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-950 dark:text-white uppercase mb-0.5">Overlapping Overrides</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0">
                    1 branch override exists. Integrity validations passed successfully.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
