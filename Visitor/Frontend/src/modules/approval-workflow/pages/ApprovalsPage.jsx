import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, MessageSquare } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import StatusBadge from '../../../components/StatusBadge';
import { appointmentsApi } from '../../../services/api';
import { getBackendBaseUrl } from '../../../utils/apiUrl';
const API_BASE = getBackendBaseUrl();
export default function ApprovalsPage() {
    const [appointments, setAppointments] = useState([]);
    const [comment, setComment] = useState({});
    const [actionLoading, setActionLoading] = useState(null);
    const load = () => {
        appointmentsApi.list({ status: 'pending_approval' }).then((res) => setAppointments(res.data));
    };
    useEffect(() => { load(); }, []);
    const approve = async (id) => {
        setActionLoading(id);
        try {
            await appointmentsApi.approve(id, comment[id]);
            load();
        }
        finally {
            setActionLoading(null);
        }
    };
    const reject = async (id) => {
        setActionLoading(id);
        try {
            await appointmentsApi.reject(id, comment[id] || 'Rejected');
            load();
        }
        finally {
            setActionLoading(null);
        }
    };
    return (<DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Pending Approvals</h1>
        <p className="text-slate-500">Review and action appointment requests</p>
      </div>

      {appointments.length === 0 ? (<div className="card text-center py-12 text-slate-400">
          <Check className="mx-auto h-12 w-12 mb-3 opacity-30"/>
          <p>No pending approvals — you're all caught up!</p>
        </div>) : (<div className="grid gap-4">
          {appointments.map((a, i) => (<motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">{a.visitor_name}</h3>
                    <StatusBadge status={a.status}/>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{a.reference_code} · {a.company}</p>
                </div>
                <p className="text-sm text-slate-600">
                  {new Date(a.scheduled_start).toLocaleString()}
                </p>
              </div>

              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                <div><span className="text-slate-500">Host:</span> {a.host_name}</div>
                <div><span className="text-slate-500">Department:</span> {a.department_name}</div>
                <div><span className="text-slate-500">Room:</span> {a.room_name || 'None'}</div>
              </div>
              <p className="mt-3 text-sm bg-slate-50 rounded-lg p-3">{a.purpose}</p>
              {a.doc_url && (<div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-slate-500 font-medium">Attached ID:</span>
                  <a href={`${API_BASE}${a.doc_url}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-500 font-semibold underline">
                    {a.doc_name || 'View ID Document'}
                  </a>
                </div>)}

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                    <input className="input pl-10" placeholder="Add a comment (optional)" value={comment[parseInt(a.id)] || ''} onChange={(e) => setComment({ ...comment, [a.id]: e.target.value })}/>
                  </div>
                </div>
                <button onClick={() => approve(parseInt(a.id))} disabled={actionLoading === parseInt(a.id)} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700">
                  <Check className="h-4 w-4"/> Approve
                </button>
                <button onClick={() => reject(parseInt(a.id))} disabled={actionLoading === parseInt(a.id)} className="btn-danger">
                  <X className="h-4 w-4"/> Reject
                </button>
              </div>
            </motion.div>))}
        </div>)}
    </DashboardLayout>);
}
