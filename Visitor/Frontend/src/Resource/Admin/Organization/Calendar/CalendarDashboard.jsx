import { LayoutDashboard, Calendar, Users, ShieldAlert, Award, FileSpreadsheet, PlusCircle, Search, Settings } from 'lucide-react';
export default function CalendarDashboard({ onNavigate, stats }) {
    const kpis = stats?.kpis || {
        totalWorkingDaysYear: 247,
        totalHolidaysCount: 6,
        upcomingHolidaysCount: 3,
        branchesDefaultCount: 4,
        branchesCustomCount: 1,
        specialWorkingDaysCount: 1,
        standardWeekendDaysCount: 104
    };
    const dashboardCards = [
        { label: 'Total Working Days', value: kpis.totalWorkingDaysYear, desc: 'Active business days in year', icon: <Calendar className="h-5 w-5 text-emerald-500"/>, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
        { label: 'Registered Holidays', value: kpis.totalHolidaysCount, desc: 'Public & corporate closures', icon: <Award className="h-5 w-5 text-red-500"/>, bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' },
        { label: 'Upcoming Holidays', value: kpis.upcomingHolidaysCount, desc: 'Holidays in current scope', icon: <ShieldAlert className="h-5 w-5 text-amber-500"/>, bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
        { label: 'Special Working Days', value: kpis.specialWorkingDaysCount, desc: 'Weekend makeup / half days', icon: <PlusCircle className="h-5 w-5 text-blue-500"/>, bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)' },
        { label: 'Weekend Exclusions', value: kpis.standardWeekendDaysCount, desc: 'Closed Saturdays & Sundays', icon: <Users className="h-5 w-5 text-slate-500"/>, bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' },
        { label: 'Active Schedule', value: 'Inherited', desc: 'Standard operating hours', icon: <FileSpreadsheet className="h-5 w-5 text-purple-500"/>, bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)' }
    ];
    return (<div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="row g-3">
        {dashboardCards.map((card, i) => (<div key={i} className="col-12 col-md-4 col-xl-2">
            <div className="bg-white dark:bg-[#1e293b] border rounded-xl p-3 shadow-sm h-100 d-flex flex-column justify-content-between" style={{ borderColor: card.border }}>
              <div className="d-flex justify-content-between align-items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400">{card.label}</span>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: card.bg }}>
                  {card.icon}
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{card.value}</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold leading-tight">{card.desc}</p>
              </div>
            </div>
          </div>))}
      </div>

      {/* Visual Analytics Row */}
      <div className="row g-4">
        {/* Monthly Working Days Bar Chart (Visual representation) */}
        <div className="col-12 col-lg-8">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-3">
              Monthly Operational Working Days (2026)
            </h3>
            <p className="text-xxs text-slate-400 font-semibold mb-4">Shows total operating days available for scheduling each month, minus public holidays.</p>
            <div className="d-flex align-items-end justify-content-between pt-6 px-2" style={{ height: '140px' }}>
              {(stats?.charts?.monthlyWorkingDays || [
            { month: 'Jan', days: 22 }, { month: 'Feb', days: 20 }, { month: 'Mar', days: 22 },
            { month: 'Apr', days: 21 }, { month: 'May', days: 22 }, { month: 'Jun', days: 20 },
            { month: 'Jul', days: 21 }, { month: 'Aug', days: 21 }, { month: 'Sep', days: 19 },
            { month: 'Oct', days: 22 }, { month: 'Nov', days: 21 }, { month: 'Dec', days: 21 }
        ]).map((m, i) => {
            const percent = (m.days / 24) * 100;
            return (<div key={i} className="d-flex flex-column align-items-center flex-grow-1">
                    <span className="text-[9px] font-bold text-slate-500 mb-1">{m.days}</span>
                    <div className="w-50 rounded-t bg-gradient-to-t from-blue-600 to-indigo-500 transition-all duration-300" style={{
                    height: `${percent}px`,
                    background: 'linear-gradient(180deg, #3b82f6 0%, #6366f1 100%)',
                    minHeight: '20px'
                }} title={`${m.month}: ${m.days} working days`}/>
                    <span className="text-[9px] font-bold text-slate-400 mt-2">{m.month}</span>
                  </div>);
        })}
            </div>
          </div>
        </div>

        {/* Schedule Distribution Side Chart */}
        <div className="col-12 col-lg-4">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm h-100 d-flex flex-column justify-content-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-2">
                Holidays by Category
              </h3>
              <p className="text-xxs text-slate-400 font-semibold mb-4">Breakdown of operational closure types.</p>
              
              <div className="space-y-3">
                {(stats?.charts?.holidayDistribution || [
            { name: 'Public Holiday', count: 3 },
            { name: 'Organization Holiday', count: 1 },
            { name: 'Branch Override Closure', count: 1 },
            { name: 'Emergency Closure', count: 1 }
        ]).map((item, i) => {
            const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
            return (<div key={i} className="space-y-1">
                      <div className="d-flex justify-content-between align-items-center text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-350">{item.name}</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{item.count}</span>
                      </div>
                      <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(148,163,184,0.1)' }}>
                        <div className="progress-bar rounded" role="progressbar" style={{
                    width: `${(item.count / 6) * 100}%`,
                    backgroundColor: colors[i % colors.length]
                }}/>
                      </div>
                    </div>);
        })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-4">
          Quick Calendar Actions
        </h3>
        <div className="row g-3">
          {[
            { label: 'Weekly Operational Hours', view: 'org-schedule', desc: 'Define default organization-wide working days & lunch break rules.', icon: <Settings className="h-5 w-5 text-blue-500"/> },
            { label: 'Manage Branch Overrides', view: 'branch-schedule', desc: 'Configure customized operational calendars for local branch offices.', icon: <Users className="h-5 w-5 text-purple-500"/> },
            { label: 'Add/Update Holidays', view: 'holidays', desc: 'Schedule public holidays, corporate closures, or temporary emergencies.', icon: <PlusCircle className="h-5 w-5 text-emerald-500"/> },
            { label: 'Browse Calendar Grid', view: 'preview', desc: 'Open interactive multi-month calendar to preview calculated active slots.', icon: <LayoutDashboard className="h-5 w-5 text-amber-500"/> },
            { label: 'Advanced Filter Search', view: 'search', desc: 'Query specific operational dates, closure categories, and audit items.', icon: <Search className="h-5 w-5 text-cyan-500"/> }
        ].map((act, i) => (<div key={i} className="col-12 col-md-6 col-lg-4">
              <button onClick={() => onNavigate(act.view)} className="w-100 text-start bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl p-4 transition-all duration-200 d-flex gap-3 align-items-start">
                <div className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xxs">
                  {act.icon}
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{act.label}</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-normal">{act.desc}</p>
                </div>
              </button>
            </div>))}
        </div>
      </div>
    </div>);
}
