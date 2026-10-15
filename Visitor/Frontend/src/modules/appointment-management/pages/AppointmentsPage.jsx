import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import StatusBadge from '../../../components/StatusBadge';
import { appointmentsApi } from '../../../services/api';
export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const params = filter ? { status: filter } : undefined;
        appointmentsApi.list(params).then((res) => {
            setAppointments(res.data);
            setLoading(false);
        });
    }, [filter]);
    return (<DashboardLayout>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-slate-500">View and manage all appointments</p>
        </div>
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending_approval">Pending</option>
          <option value="approved">Approved</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (<div className="p-8 text-center text-slate-400">Loading...</div>) : appointments.length === 0 ? (<div className="p-8 text-center text-slate-400">No appointments found</div>) : (<div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Visitor</th>
                  <th className="px-6 py-3">Host</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Scheduled</th>
                  <th className="px-6 py-3">Room</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (<tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-brand-700">{a.reference_code}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{a.visitor_name}</p>
                      <p className="text-xs text-slate-400">{a.company}</p>
                    </td>
                    <td className="px-6 py-4">{a.host_name}</td>
                    <td className="px-6 py-4">{a.department_name}</td>
                    <td className="px-6 py-4">{new Date(a.scheduled_start).toLocaleString()}</td>
                    <td className="px-6 py-4">{a.room_name || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={a.status}/></td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>
    </DashboardLayout>);
}
