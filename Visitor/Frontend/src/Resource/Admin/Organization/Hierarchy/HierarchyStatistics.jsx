import { useState, useEffect } from 'react';
import { BarChart3, Building2, GitBranch, RefreshCw, TrendingUp, Layers } from 'lucide-react';
import api from '../../../../services/api';
import StatisticsCards from './components/StatisticsCards';
export default function HierarchyStatistics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/hierarchy/statistics');
            setStats(res.data);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchStats(); }, []);
    return (<div className="space-y-6">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
            <BarChart3 className="text-purple-500 h-6 w-6"/> Hierarchy Statistics & Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Quantitative overview of organizational hierarchy depth, unit density, and structural metrics.
          </p>
        </div>
        <button onClick={fetchStats} disabled={loading} className="btn btn-primary text-xs font-bold d-flex align-items-center gap-1.5 px-3 py-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh Statistics
        </button>
      </div>

      {loading ? (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center shadow-sm">
          <div className="spinner-border text-primary" role="status"/>
          <p className="text-slate-400 text-xs fw-semibold mt-3">Computing hierarchy statistics...</p>
        </div>) : stats ? (<>
          {/* Summary KPI Cards */}
          <StatisticsCards stats={stats.summary || {
                totalOrganizations: 0, totalBranches: 0, totalDepartments: 0, maxHierarchyLevels: 3, totalActiveUnits: 0
            }}/>

          {/* Distribution Tables */}
          <div className="row g-4">
            {/* Organization → Branch Distribution */}
            <div className="col-12 col-lg-6">
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-bottom dark:border-slate-800 d-flex justify-content-between align-items-center">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-2 m-0">
                    <Building2 className="h-4 w-4 text-blue-500"/> Organization → Branch Distribution
                  </h3>
                  <span className="badge bg-blue-50 text-blue-600 dark:bg-blue-900/30 text-[10px] font-bold">L1 → L2</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60">
                      <tr>
                        <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-2.5">Organization</th>
                        <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-2.5 text-end">Branch Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats.distributions?.organizationBranchDistribution || []).map((item, idx) => (<tr key={idx} className="border-bottom dark:border-slate-800">
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white d-flex align-items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-blue-400 shrink-0"/> {item.organizationName}
                          </td>
                          <td className="px-4 py-2.5 text-end">
                            <span className="badge bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 text-xs font-extrabold px-2 py-0.5 rounded-full">
                              {item.branchCount}
                            </span>
                          </td>
                        </tr>))}
                      {(!stats.distributions?.organizationBranchDistribution || stats.distributions.organizationBranchDistribution.length === 0) && (<tr><td colSpan={2} className="text-center py-6 text-slate-400 font-semibold">No data available.</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Branch → Department Distribution */}
            <div className="col-12 col-lg-6">
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-bottom dark:border-slate-800 d-flex justify-content-between align-items-center">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-2 m-0">
                    <GitBranch className="h-4 w-4 text-amber-500"/> Branch → Department Distribution
                  </h3>
                  <span className="badge bg-amber-50 text-amber-600 dark:bg-amber-900/30 text-[10px] font-bold">L2 → L3</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60">
                      <tr>
                        <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-2.5">Branch</th>
                        <th className="font-extrabold text-xxs uppercase text-slate-400 tracking-wider border-0 px-4 py-2.5 text-end">Department Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats.distributions?.branchDepartmentDistribution || []).map((item, idx) => (<tr key={idx} className="border-bottom dark:border-slate-800">
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white d-flex align-items-center gap-2">
                            <GitBranch className="h-3.5 w-3.5 text-amber-400 shrink-0"/> {item.branchName}
                          </td>
                          <td className="px-4 py-2.5 text-end">
                            <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 text-xs font-extrabold px-2 py-0.5 rounded-full">
                              {item.departmentCount}
                            </span>
                          </td>
                        </tr>))}
                      {(!stats.distributions?.branchDepartmentDistribution || stats.distributions.branchDepartmentDistribution.length === 0) && (<tr><td colSpan={2} className="text-center py-6 text-slate-400 font-semibold">No data available.</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Structural Metrics Card */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-emerald-500"/> Structural Summary
            </h3>
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Active Organizations</p>
                  <p className="text-xl font-extrabold text-blue-600">{stats.summary?.activeOrganizations ?? 0}</p>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Active Branches</p>
                  <p className="text-xl font-extrabold text-amber-600">{stats.summary?.activeBranches ?? 0}</p>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Active Departments</p>
                  <p className="text-xl font-extrabold text-indigo-600">{stats.summary?.activeDepartments ?? 0}</p>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Max Depth Levels</p>
                  <p className="text-xl font-extrabold text-purple-600">{stats.summary?.maxHierarchyLevels ?? 3}</p>
                </div>
              </div>
            </div>
          </div>
        </>) : (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
          <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2"/>
          <p className="text-slate-400 text-xs font-semibold">Failed to load hierarchy statistics.</p>
        </div>)}
    </div>);
}
