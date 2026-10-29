import { useEffect, useState } from 'react';
import { Building, GitBranch, Users, Plus, List, Network, Settings } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../../services/api';
import RefreshButton from '../../../../components/common/RefreshButton';
const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
export default function OrgDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchStats();
    }, []);
    const fetchStats = () => {
        setLoading(true);
        api.get('/organizations/1/statistics')
            .then((res) => {
            setStats(res.data.data);
        })
            .catch(console.error)
            .finally(() => setLoading(false));
    };
    const handleNav = (viewKey) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewKey);
        window.location.search = `?${params.toString()}`;
    };
    if (loading) {
        return (<div className="flex justify-center items-center py-20">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>);
    }
    const { cards = {}, charts = {} } = stats || {};
    return (<div className="space-y-6">
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building className="text-blue-600 h-7 w-7"/> Organization Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Real-time management console for enterprise hierarchies, branches, and department setups.
          </p>
        </div>
        <RefreshButton onRefresh={fetchStats}/>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orgs */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <Building className="h-5 w-5"/>
            </div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{cards.totalOrganizations || 0}</span>
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Organizations</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {cards.activeOrganizations || 0} Active Instances
          </p>
        </div>

        {/* Branches */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <GitBranch className="h-5 w-5"/>
            </div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{cards.totalBranches || 0}</span>
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Branches / campuses</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {cards.activeBuildings || 0} Operating Buildings
          </p>
        </div>

        {/* Departments */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
              <Network className="h-5 w-5"/>
            </div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{cards.totalDepartments || 0}</span>
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Departments</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {cards.totalEmployees || 0} Total Staff Assigned
          </p>
        </div>

        {/* Visitors & Appointments */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <Users className="h-5 w-5"/>
            </div>
            <div className="text-end">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{cards.activeVisitorsToday || 0}</span>
              <span className="text-xs text-slate-400 ml-1">today</span>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Today's visitors</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {cards.todayAppointments || 0} Approved Appointments
          </p>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-4 border-b pb-2 dark:border-slate-800">
          Admin Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => handleNav('create_organization')} className="btn btn-primary d-flex flex-column align-items-center justify-content-center p-3 rounded-lg gap-2 text-xs font-bold">
            <Plus className="h-5 w-5"/> Register Organization
          </button>
          <button onClick={() => handleNav('organizations')} className="btn btn-outline-secondary d-flex flex-column align-items-center justify-content-center p-3 rounded-lg gap-2 text-xs font-bold">
            <List className="h-5 w-5"/> View Organizations
          </button>
          <button onClick={() => handleNav('org_tree')} className="btn btn-outline-secondary d-flex flex-column align-items-center justify-content-center p-3 rounded-lg gap-2 text-xs font-bold">
            <Network className="h-5 w-5"/> View Organization Tree
          </button>
          <button onClick={() => handleNav('org_settings')} className="btn btn-outline-secondary d-flex flex-column align-items-center justify-content-center p-3 rounded-lg gap-2 text-xs font-bold">
            <Settings className="h-5 w-5"/> Configuration settings
          </button>
        </div>
      </div>

      {/* Charts Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Departments distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white">
              Branch and campus activity
            </h4>
            <span className="badge bg-primary-subtle text-primary text-xxs px-2 py-1 rounded">Daily load</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.branchActivity || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }}/>
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }}/>
              <Tooltip />
              <Line type="monotone" dataKey="checkins" stroke="#10B981" strokeWidth={2} name="On-Site Checkins"/>
              <Line type="monotone" dataKey="appointments" stroke="#2563EB" strokeWidth={2} name="Scheduled Meetings"/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Employees per Department */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-4">
            Staff by Department
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={charts.employeesByDept || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="count">
                {(charts.employeesByDept || []).map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-500 uppercase">
            {(charts.employeesByDept || []).slice(0, 4).map((entry, index) => (<div key={entry.name} className="d-flex align-items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}/>
                <span className="truncate">{entry.name}</span>
              </div>))}
          </div>
        </div>
      </div>

      {/* Dynamic Load Charts & Recent Timelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 3: Departments per organization */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-4">
            Departments per Organization
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.deptsPerOrg || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }}/>
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }}/>
              <Tooltip />
              <Bar dataKey="departments" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Departments count"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activities timeline */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-4">
            Organizational Audit Timeline
          </h4>
          <div className="space-y-4">
            <div className="d-flex gap-3 align-items-start border-bottom dark:border-slate-800 pb-3">
              <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 d-flex items-center justify-center shrink-0">
                <Building className="h-4.5 w-4.5"/>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-0.5">
                  IT park registered
                </p>
                <span className="text-[10px] text-slate-400 font-semibold block">July 19, 2026 by Admin</span>
              </div>
            </div>

            <div className="d-flex gap-3 align-items-start border-bottom dark:border-slate-800 pb-3">
              <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 d-flex items-center justify-center shrink-0">
                <GitBranch className="h-4.5 w-4.5"/>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-0.5">
                  Bole Main Office branch added
                </p>
                <span className="text-[10px] text-slate-400 font-semibold block">July 19, 2026 by Admin</span>
              </div>
            </div>

            <div className="d-flex gap-3 align-items-start">
              <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 d-flex items-center justify-center shrink-0">
                <Network className="h-4.5 w-4.5"/>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-0.5">
                  6 default departments configured
                </p>
                <span className="text-[10px] text-slate-400 font-semibold block">July 19, 2026 by System</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>);
}
