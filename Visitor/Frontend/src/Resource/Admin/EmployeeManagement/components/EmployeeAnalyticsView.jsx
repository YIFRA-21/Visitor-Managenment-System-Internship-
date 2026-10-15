import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, FileText, BarChart2, PieChart as PieChartIcon, RefreshCw } from 'lucide-react';
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
export default function EmployeeAnalyticsView({ stats, onRefresh }) {
    const deptData = stats?.charts?.byDepartment || [
        { label: 'Executive Office', value: 4 },
        { label: 'Sales & Marketing', value: 12 },
        { label: 'Finance', value: 8 },
        { label: 'Operations', value: 15 },
        { label: 'Human Resources', value: 6 },
        { label: 'IT & Security', value: 10 }
    ];
    const branchData = stats?.charts?.byBranch || [
        { label: 'Main HQ', value: 35 },
        { label: 'North Branch', value: 12 },
        { label: 'South Hub', value: 8 }
    ];
    const statusData = stats?.charts?.byStatus || [
        { label: 'Active', value: stats?.activeEmployees || 45 },
        { label: 'Inactive', value: stats?.inactiveEmployees || 5 },
        { label: 'On Leave', value: stats?.employeesOnLeave || 3 }
    ];
    const availData = stats?.charts?.byAvailability || [
        { label: 'Available', value: stats?.availableHosts || 28 },
        { label: 'In Meeting', value: 8 },
        { label: 'Busy', value: 6 },
        { label: 'WFH', value: 3 }
    ];
    const handleExportPDF = () => {
        window.print();
    };
    const handleExportCSV = () => {
        const rows = [
            ['Category', 'Metric', 'Value'],
            ...deptData.map((d) => ['Department', d.label, d.value]),
            ...branchData.map((b) => ['Branch', b.label, b.value]),
            ...statusData.map((s) => ['Employment Status', s.label, s.value]),
            ...availData.map((a) => ['Availability', a.label, a.value])
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Employee_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (<div className="space-y-6">
      {/* Header & Controls */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-0">
            Employee Analytics & Workforce Reports
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0 font-medium">
            Real-time workforce distribution, host availability metrics, and departmental stats.
          </p>
        </div>

        <div className="d-flex gap-2">
          {onRefresh && (<button onClick={onRefresh} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-1.5">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh Data
            </button>)}
          <button onClick={handleExportCSV} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-1.5">
            <Download className="h-3.5 w-3.5"/> Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-1.5">
            <FileText className="h-3.5 w-3.5"/> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Grid of 4 Charts */}
      <div className="row g-4">

        {/* Chart 1: Employees by Department */}
        <div className="col-12 col-lg-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <BarChart2 className="h-4 w-4 text-indigo-400"/>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0">
                Employees by Department
              </h4>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-20} textAnchor="end"/>
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }}/>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}/>
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 2: Employment Status Distribution */}
        <div className="col-12 col-lg-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <PieChartIcon className="h-4 w-4 text-emerald-400"/>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0">
                Employment Status Breakdown
              </h4>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" nameKey="label">
                    {statusData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}/>
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-semibold text-slate-300">{value}</span>}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 3: Host Availability Status */}
        <div className="col-12 col-lg-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <PieChartIcon className="h-4 w-4 text-amber-400"/>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0">
                Host Real-Time Availability
              </h4>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={availData} cx="50%" cy="50%" outerRadius={85} paddingAngle={2} dataKey="value" nameKey="label">
                    {availData.map((_, index) => (<Cell key={`cell-avail-${index}`} fill={COLORS[(index + 2) % COLORS.length]}/>))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}/>
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-semibold text-slate-300">{value}</span>}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 4: Employees by Branch */}
        <div className="col-12 col-lg-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <BarChart2 className="h-4 w-4 text-cyan-400"/>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0">
                Employees by Branch Location
              </h4>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={branchData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }}/>
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }}/>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}/>
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>);
}
