import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, Network, Building2, Activity, Users, ShieldCheck, ShieldAlert } from 'lucide-react';
import api from '../../../../services/api';
import StatisticsCards from '../Branch/components/StatisticsCards';
import ChartCard from '../Branch/components/ChartCard';
export default function DepartmentStatistics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get('/departments/statistics/overview')
            .then(res => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    const handleNav = (view) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', view);
        window.location.search = `?${params.toString()}`;
    };
    if (loading) {
        return <div className="p-20 text-center"><div className="spinner-border text-primary" role="status"/><p className="text-slate-400 text-xs fw-semibold mt-3">Loading statistics...</p></div>;
    }
    if (!stats) {
        return <div className="alert alert-warning text-xs fw-semibold">Could not load department statistics.</div>;
    }
    const summaryCards = [
        { label: 'Total Departments', value: stats.totalDepartments, icon: <Network className="h-5 w-5"/>, color: 'blue', trend: 5, trendLabel: 'vs last month' },
        { label: 'Active', value: stats.activeDepartments, icon: <ShieldCheck className="h-5 w-5"/>, color: 'green', trend: 3, trendLabel: 'vs last month' },
        { label: 'Inactive', value: stats.inactiveDepartments, icon: <ShieldAlert className="h-5 w-5"/>, color: 'yellow', trend: 0, trendLabel: 'No change' },
        { label: 'Employees (Placeholder)', value: stats.totalEmployees, icon: <Users className="h-5 w-5"/>, color: 'purple', trend: 15, trendLabel: 'Future Integration' },
        { label: 'Visitors (Placeholder)', value: stats.visitorsToday, icon: <Activity className="h-5 w-5"/>, color: 'red', trendLabel: 'Today' },
    ];
    const typeEntries = Object.entries(stats.departmentsByType || {});
    const branchEntries = Object.entries(stats.departmentsByBranch || {}).sort((a, b) => b[1] - a[1]);
    const orgEntries = Object.entries(stats.departmentsByOrganization || {}).sort((a, b) => b[1] - a[1]);
    const typeColors = {
        ADMINISTRATIVE: '#3b82f6', TECHNICAL: '#22c55e', OPERATIONS: '#eab308',
        SUPPORT: '#f97316', FINANCE: '#8b5cf6', HR: '#ec4899', LEGAL: '#ef4444', EXECUTIVE: '#06b6d4',
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
            <BarChart3 className="text-indigo-600 h-7 w-7"/> Department Statistics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 fw-semibold">
            Operational dashboard highlighting metrics and departmental allocations.
          </p>
        </div>
        <button onClick={() => handleNav('departments_mgmt')} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs fw-bold px-3 py-2">
          <ArrowLeft className="h-4 w-4"/> Back to Directory
        </button>
      </div>

      {/* Summary Cards */}
      <StatisticsCards cards={summaryCards}/>

      {/* Charts Row */}
      <div className="row g-4">
        {/* Distribution by Type */}
        <div className="col-12 col-lg-6">
          <ChartCard title="Distribution by Type" subtitle="Department count per functional category">
            <div className="space-y-2">
              {typeEntries.map(([type, count]) => {
            const pct = stats.totalDepartments > 0 ? Math.round((count / stats.totalDepartments) * 100) : 0;
            return (<div key={type} className="d-flex align-items-center gap-3">
                    <span className="text-xs fw-bold text-slate-600 dark:text-slate-300" style={{ width: 120 }}>{type}</span>
                    <div className="flex-grow-1">
                      <div className="progress" style={{ height: 8, borderRadius: 4, background: 'var(--bs-gray-200)' }}>
                        <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: typeColors[type] || '#64748b', borderRadius: 4, transition: 'width 0.6s ease' }}/>
                      </div>
                    </div>
                    <span className="text-xs fw-bold text-slate-500" style={{ width: 60, textAlign: 'right' }}>{count} ({pct}%)</span>
                  </div>);
        })}
            </div>
          </ChartCard>
        </div>

        {/* Distribution by Branch */}
        <div className="col-12 col-lg-6">
          <ChartCard title="Top Branches" subtitle="Departments distribution across campuses">
            <div className="space-y-2">
              {branchEntries.map(([branchName, count], index) => {
            const maxCount = branchEntries[0]?.[1] || 1;
            const pct = Math.round((count / maxCount) * 100);
            const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
            return (<div key={branchName} className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-1.5" style={{ width: 120 }}>
                      <Building2 className="h-3 w-3 text-slate-400"/>
                      <span className="text-xs fw-bold text-slate-600 dark:text-slate-300 text-truncate">{branchName}</span>
                    </div>
                    <div className="flex-grow-1">
                      <div className="progress" style={{ height: 8, borderRadius: 4, background: 'var(--bs-gray-200)' }}>
                        <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: colors[index % colors.length], borderRadius: 4, transition: 'width 0.6s ease' }}/>
                      </div>
                    </div>
                    <span className="text-xs fw-bold text-slate-500" style={{ width: 40, textAlign: 'right' }}>{count}</span>
                  </div>);
        })}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Organization Distribution */}
      <ChartCard title="Distribution by Organization" subtitle="Structural allocation by business organization entity">
        <div className="row g-3">
          {orgEntries.map(([orgName, count]) => (<div className="col-6 col-md-4 col-lg-3" key={orgName}>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-800 hover:shadow-sm transition">
                <div className="text-2xl font-extrabold text-primary mb-1">{count}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{orgName}</div>
              </div>
            </div>))}
        </div>
      </ChartCard>
    </div>);
}
