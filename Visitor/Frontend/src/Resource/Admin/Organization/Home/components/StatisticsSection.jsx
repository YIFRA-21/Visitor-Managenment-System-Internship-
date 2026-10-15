import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Line, AreaChart, Area, } from 'recharts';
import LoadingSkeleton from './LoadingSkeleton';
import ChartCard from './ChartCard';
// ── Tooltip Custom Renderer ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (<div className="vms-chart-tooltip">
        <p className="tooltip-label mb-1">{label || payload[0].name}</p>
        {payload.map((pld, index) => (<div key={index} className="d-flex align-items-center gap-2 text-white-50 small">
            <span className="h-2 w-2 rounded-circle" style={{ backgroundColor: pld.color || pld.fill }}></span>
            <span>{pld.name}: <strong className="text-white">{pld.value}</strong></span>
          </div>))}
      </div>);
    }
    return null;
};
export default function StatisticsSection({ statistics, loading }) {
    if (loading) {
        return (<div className="row g-3">
        <div className="col-md-6 col-xl-3">
          <LoadingSkeleton type="chart"/>
        </div>
        <div className="col-md-6 col-xl-3">
          <LoadingSkeleton type="chart"/>
        </div>
        <div className="col-md-6 col-xl-3">
          <LoadingSkeleton type="chart"/>
        </div>
        <div className="col-md-6 col-xl-3">
          <LoadingSkeleton type="chart"/>
        </div>
        <div className="col-12">
          <LoadingSkeleton type="chart"/>
        </div>
      </div>);
    }
    if (!statistics) {
        return (<div className="text-center py-4 bg-dark border border-secondary rounded-3">
        <i className="bi bi-bar-chart fs-3 text-muted d-block mb-2"></i>
        <small className="text-muted">No statistics available</small>
      </div>);
    }
    // Premium colors
    const orgTypeColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];
    const deptColors = ['#6366F1', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#22C55E', '#EAB308'];
    // Data mapping
    const pieData = statistics.organizationTypes.map((t, i) => ({
        name: t.type,
        value: t.count,
        color: orgTypeColors[i % orgTypeColors.length],
    }));
    const branchData = statistics.branchDistribution.map(d => ({
        name: d.region,
        value: d.count,
    }));
    const deptData = statistics.departmentDistribution.map((d, i) => ({
        name: d.category,
        value: d.count,
        color: deptColors[i % deptColors.length],
    }));
    const employeeData = statistics.employeesByDepartment.map(d => ({
        name: d.department,
        employees: d.employees,
    }));
    return (<div className="vms-statistics-section">
      <div className="row g-3">
        {/* Organization Types Pie Chart */}
        <div className="col-xl-3 col-lg-6 col-md-6">
          <ChartCard title="Organization Types" subtitle="Distribution by business type" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={0} outerRadius={65} paddingAngle={0} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ outline: 'none' }}>
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
                <Tooltip content={<CustomTooltip />}/>
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '0.65rem', color: '#94a3b8' }}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Branch Distribution Bar Chart */}
        <div className="col-xl-3 col-lg-6 col-md-6">
          <ChartCard title="Branch Distribution" subtitle="Active branches by region" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false}/>
                <YAxis stroke="#64748b" fontSize={9} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="value" name="Branches" radius={[4, 4, 0, 0]}>
                  {branchData.map((entry, index) => (<Cell key={`cell-${index}`} fill={`url(#branchGrad-${index})`}/>))}
                </Bar>
                <defs>
                  {branchData.map((entry, index) => (<linearGradient key={`grad-${index}`} id={`branchGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.3}/>
                    </linearGradient>))}
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Department Distribution Doughnut Chart */}
        <div className="col-xl-3 col-lg-6 col-md-6">
          <ChartCard title="Department Distribution" subtitle="Departments by categories" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptData} cx="50%" cy="45%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" style={{ outline: 'none' }}>
                  {deptData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
                <Tooltip content={<CustomTooltip />}/>
                <Legend layout="horizontal" verticalAlign="bottom" iconSize={6} iconType="circle" wrapperStyle={{ fontSize: '0.6rem', color: '#94a3b8', maxHeight: '50px', overflowY: 'auto' }}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Employees by Department Horizontal Bar Chart */}
        <div className="col-xl-3 col-lg-6 col-md-6">
          <ChartCard title="Employees by Department" subtitle="Staff distribution" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeeData} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false}/>
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} width={80}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="employees" name="Employees" fill="#8B5CF6" radius={[0, 4, 4, 0]}>
                  {employeeData.map((entry, index) => (<Cell key={`cell-${index}`} fill="url(#empGrad)"/>))}
                </Bar>
                <defs>
                  <linearGradient id="empGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Monthly Growth Line/Area Chart */}
        <div className="col-12">
          <ChartCard title="Monthly Growth" subtitle="System expansion timeline metrics" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statistics.monthlyGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthOrg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="growthBranch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false}/>
                <YAxis stroke="#64748b" fontSize={10} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.7rem', color: '#94a3b8' }}/>
                <Area type="monotone" dataKey="organizations" name="Organizations" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#growthOrg)"/>
                <Area type="monotone" dataKey="branches" name="Branches" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#growthBranch)"/>
                <Line type="monotone" dataKey="departments" name="Departments" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>);
}
