import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from 'recharts';
import DashboardLayout from '../../../components/DashboardLayout';
import StatCard from '../../../components/StatCard';
import { reportsApi } from '../../../services/api';
import { TrendingUp, Users, Clock } from 'lucide-react';
export default function ReportsPage() {
    const [dashboard, setDashboard] = useState(null);
    const [visitors, setVisitors] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    useEffect(() => {
        reportsApi.dashboard().then((res) => setDashboard(res.data));
        reportsApi.visitors().then((res) => setVisitors(res.data));
        reportsApi.auditLogs().then((res) => setAuditLogs(res.data.slice(0, 20)));
    }, []);
    const approvalRate = dashboard?.approvalRate;
    const rate = approvalRate?.total
        ? Math.round(((approvalRate.approved || 0) / approvalRate.total) * 100)
        : 0;
    return (<DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics & Reports</h1>
        <p className="text-slate-500">Executive insights and compliance tracking</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard title="Approval Rate" value={`${rate}%`} icon={TrendingUp} color="bg-emerald-600" subtitle="Last 30 days"/>
        <StatCard title="Avg Visit Duration" value={`${dashboard?.avgVisitDurationMinutes || 0} min`} icon={Clock} color="bg-brand-600"/>
        <StatCard title="Total Visitors" value={visitors.length} icon={Users} color="bg-indigo-600" subtitle="Registered profiles"/>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold">Peak Visitation Hours</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dashboard?.peakHours || []}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`}/>
              <YAxis />
              <Tooltip labelFormatter={(h) => `${h}:00 - ${h}:59`}/>
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold">Department Analysis</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dashboard?.byDepartment || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis type="number"/>
              <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 11 }}/>
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 card">
        <h3 className="mb-4 font-semibold">Visitor Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Company</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Visits</th>
                <th className="pb-3">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => (<tr key={v.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-medium">{v.full_name}</td>
                  <td className="py-3 pr-4">{v.company || '—'}</td>
                  <td className="py-3 pr-4">{v.email}</td>
                  <td className="py-3 pr-4">{v.visit_count}</td>
                  <td className="py-3">{v.last_visit ? new Date(v.last_visit).toLocaleDateString() : '—'}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 card">
        <h3 className="mb-4 font-semibold">Audit Log</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (<div key={log.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
              <div>
                <span className="font-medium">{log.action}</span>
                <span className="text-slate-500"> on {log.entity} #{log.entity_id}</span>
                {log.actor_name && <span className="text-slate-400"> by {log.actor_name}</span>}
              </div>
              <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
            </div>))}
        </div>
      </div>
    </DashboardLayout>);
}
