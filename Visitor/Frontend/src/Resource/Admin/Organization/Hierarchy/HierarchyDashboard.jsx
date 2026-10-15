import { useEffect, useState } from 'react';
import { Network, GitBranch, Building2, CheckCircle2, Search, Layers, ArrowRight, Activity } from 'lucide-react';
import api from '../../../../services/api';
import StatisticsCards from './components/StatisticsCards';
import BackButton from '../../../../components/common/BackButton';
export default function HierarchyDashboard() {
    const [stats, setStats] = useState({
        totalOrganizations: 0,
        totalBranches: 0,
        totalDepartments: 0,
        maxHierarchyLevels: 3,
        totalActiveUnits: 0
    });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get('/hierarchy/statistics')
            .then(res => {
            if (res.data && res.data.summary) {
                setStats(res.data.summary);
            }
        })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    const handleNav = (viewKey) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewKey);
        window.location.search = `?${params.toString()}`;
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin/dashboard"/>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
              <Layers className="text-blue-600 h-7 w-7"/> Organization Hierarchy Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Master organizational tree visualization, relationship assignment, and integrity validation.
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => handleNav('hierarchy_tree')} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Network className="h-4 w-4"/> Interactive Tree View
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <StatisticsCards stats={stats}/>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div onClick={() => handleNav('hierarchy_tree')} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-blue-500 transition-all cursor-pointer group">
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 d-flex align-items-center justify-content-center mb-3">
            <Network className="h-5 w-5"/>
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white d-flex align-items-center justify-content-between">
            View Hierarchy Tree <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors"/>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Explore expand/collapse multi-level tree structure.</p>
        </div>

        <div onClick={() => handleNav('hierarchy_assignment')} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-amber-500 transition-all cursor-pointer group">
          <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 d-flex align-items-center justify-content-center mb-3">
            <GitBranch className="h-5 w-5"/>
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white d-flex align-items-center justify-content-between">
            Assign Hierarchy <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-500 transition-colors"/>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Configure parent branch and department relationships.</p>
        </div>

        <div onClick={() => handleNav('hierarchy_validation')} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-emerald-500 transition-all cursor-pointer group">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 d-flex align-items-center justify-content-center mb-3">
            <CheckCircle2 className="h-5 w-5"/>
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white d-flex align-items-center justify-content-between">
            Validate Hierarchy <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors"/>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Audit circular references, orphans, and missing nodes.</p>
        </div>

        <div onClick={() => handleNav('hierarchy_search')} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-purple-500 transition-all cursor-pointer group">
          <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 d-flex align-items-center justify-content-center mb-3">
            <Search className="h-5 w-5"/>
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white d-flex align-items-center justify-content-between">
            Search Hierarchy <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-500 transition-colors"/>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Advanced search across orgs, branches, and departments.</p>
        </div>
      </div>

      {/* Visualization Chart Placeholders */}
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500"/> Organization Distribution
              </h3>
              <span className="badge bg-blue-50 text-blue-600 dark:bg-blue-900/30 text-[10px] font-bold">Real-time</span>
            </div>
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-lg">
              <Activity className="h-10 w-10 text-blue-400 mx-auto mb-2 opacity-80"/>
              <p className="text-slate-600 dark:text-slate-300 font-bold text-xs">Hierarchy Unit Share</p>
              <p className="text-slate-400 text-[11px]">Organizations (15%) • Branches (35%) • Departments (50%)</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-2">
                <GitBranch className="h-4 w-4 text-amber-500"/> Branch & Department Density
              </h3>
              <span className="badge bg-amber-50 text-amber-600 dark:bg-amber-900/30 text-[10px] font-bold font-monospace">L1-L3 Depth</span>
            </div>
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-lg">
              <Layers className="h-10 w-10 text-amber-400 mx-auto mb-2 opacity-80"/>
              <p className="text-slate-600 dark:text-slate-300 font-bold text-xs">Structural Hierarchy Depth</p>
              <p className="text-slate-400 text-[11px]">3 Max Levels Verified • 0 Circular References</p>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
