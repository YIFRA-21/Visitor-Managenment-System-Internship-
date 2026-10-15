import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, GitBranch, Building2, MapPin, ShieldCheck, ShieldX, ShieldAlert, Archive } from 'lucide-react';
import api from '../../../../services/api';
import StatisticsCards from './components/StatisticsCards';
import ChartCard from './components/ChartCard';
export default function BranchStatistics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get('/branches/statistics/overview')
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
        return <div className="alert alert-warning text-xs fw-semibold">Could not load branch statistics.</div>;
    }
    const summaryCards = [
        { label: 'Total Branches', value: stats.totalBranches, icon: <GitBranch className="h-5 w-5"/>, color: 'blue', trend: 12, trendLabel: 'vs last month' },
        { label: 'Active', value: stats.activeBranches, icon: <ShieldCheck className="h-5 w-5"/>, color: 'green', trend: 8, trendLabel: 'vs last month' },
        { label: 'Inactive', value: stats.inactiveBranches, icon: <ShieldX className="h-5 w-5"/>, color: 'yellow', trend: -3, trendLabel: 'vs last month' },
        { label: 'Suspended', value: stats.suspendedBranches, icon: <ShieldAlert className="h-5 w-5"/>, color: 'red', trend: 0, trendLabel: 'No change' },
        { label: 'Avg per Org', value: stats.avgBranchesPerOrg, icon: <Building2 className="h-5 w-5"/>, color: 'purple', trendLabel: 'Across all orgs' },
    ];
    const typeEntries = Object.entries(stats.branchesByType || {});
    const cityEntries = Object.entries(stats.branchesByCity || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const countryEntries = Object.entries(stats.branchesByCountry || {}).sort((a, b) => b[1] - a[1]);
    const typeColors = {
        HEADQUARTERS: '#3b82f6', OFFICE: '#22c55e', CAMPUS: '#eab308', RETAIL: '#f97316', WAREHOUSE: '#8b5cf6',
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
            <BarChart3 className="text-blue-600 h-7 w-7"/> Branch Statistics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 fw-semibold">
            Dashboard overview of all branch metrics and distribution analytics.
          </p>
        </div>
        <button onClick={() => handleNav('branches')} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs fw-bold px-3 py-2">
          <ArrowLeft className="h-4 w-4"/> Back to Directory
        </button>
      </div>

      {/* Summary Cards */}
      <StatisticsCards cards={summaryCards}/>

      {/* Charts Row */}
      <div className="row g-4">
        {/* Branch by Type */}
        <div className="col-12 col-lg-6">
          <ChartCard title="Distribution by Type" subtitle="Branch count per type category">
            <div className="space-y-2">
              {typeEntries.map(([type, count]) => {
            const pct = stats.totalBranches > 0 ? Math.round((count / stats.totalBranches) * 100) : 0;
            return (<div key={type} className="d-flex align-items-center gap-3">
                    <span className="text-xs fw-bold text-slate-600 dark:text-slate-300" style={{ width: 100 }}>{type}</span>
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

        {/* Branch by City */}
        <div className="col-12 col-lg-6">
          <ChartCard title="Top Cities" subtitle="Branch distribution by city">
            <div className="space-y-2">
              {cityEntries.map(([city, count], index) => {
            const maxCount = cityEntries[0]?.[1] || 1;
            const pct = Math.round((count / maxCount) * 100);
            const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
            return (<div key={city} className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-1.5" style={{ width: 100 }}>
                      <MapPin className="h-3 w-3 text-slate-400"/>
                      <span className="text-xs fw-bold text-slate-600 dark:text-slate-300 text-truncate">{city}</span>
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

      {/* Country Distribution */}
      <ChartCard title="Distribution by Country" subtitle="Branch footprint across countries">
        <div className="row g-3">
          {countryEntries.map(([country, count]) => (<div className="col-6 col-md-4 col-lg-3" key={country}>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-800 hover:shadow-sm transition">
                <div className="text-2xl font-extrabold text-primary mb-1">{count}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{country}</div>
              </div>
            </div>))}
        </div>
      </ChartCard>

      {/* Status Breakdown */}
      <ChartCard title="Status Breakdown" subtitle="Current status distribution of all branches">
        <div className="d-flex justify-content-center gap-4 flex-wrap">
          {[
            { label: 'Active', value: stats.activeBranches, color: '#22c55e', icon: <ShieldCheck className="h-5 w-5"/> },
            { label: 'Inactive', value: stats.inactiveBranches, color: '#eab308', icon: <ShieldX className="h-5 w-5"/> },
            { label: 'Suspended', value: stats.suspendedBranches, color: '#ef4444', icon: <ShieldAlert className="h-5 w-5"/> },
            { label: 'Archived', value: stats.archivedBranches || 0, color: '#64748b', icon: <Archive className="h-5 w-5"/> },
        ].map(item => {
            const pct = stats.totalBranches > 0 ? Math.round((item.value / stats.totalBranches) * 100) : 0;
            return (<div key={item.label} className="text-center">
                <div className="h-16 w-16 rounded-circle mx-auto d-flex align-items-center justify-content-center mb-2 text-white fw-bold text-lg shadow" style={{ backgroundColor: item.color }}>
                  {pct}%
                </div>
                <div className="text-xs fw-bold text-slate-600 dark:text-slate-300">{item.label}</div>
                <div className="text-[10px] text-slate-400 fw-semibold">{item.value} branches</div>
              </div>);
        })}
        </div>
      </ChartCard>
    </div>);
}
