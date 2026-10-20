import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, MessageSquare } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { appointmentsApi } from '../../services/api';
import { getBackendBaseUrl } from '../../utils/apiUrl';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponseNavigation } from '../../modules/response';
const API_BASE = getBackendBaseUrl();
export default function Approvals() {
    const { toConfirmation } = useResponseNavigation();
    const { t } = useLanguage();
    const [appointments, setAppointments] = useState([]);
    const [comment, setComment] = useState({});
    const [actionLoading, setActionLoading] = useState(null);
    const load = () => {
        appointmentsApi.list({ status: 'pending_approval' }).then((res) => setAppointments(res.data)).catch(console.error);
    };
    useEffect(() => {
        load();
    }, []);
    const approve = (a) => {
        const id = parseInt(a.id);
        toConfirmation({
            title: 'Confirm Appointment Approval',
            message: `Authorize appointment request for visitor "${a.visitor_name}" on ${new Date(a.scheduled_start).toLocaleString()}?`,
            actionType: 'APPROVE_APPOINTMENT',
            targetEntity: `${a.visitor_name} (${a.reference_code})`,
            consequences: [
                'The appointment status will be updated to APPROVED.',
                'A digital visitor pass and entrance QR code will be generated for the visitor.',
                'Security gate check-in will be authorized for this appointment window.'
            ],
            confirmLabel: 'Approve & Issue Access',
            cancelLabel: 'Cancel',
            danger: false,
            onConfirmApi: () => appointmentsApi.approve(id, comment[id]),
            successTitle: 'Appointment Approved',
            successMessage: `Appointment for ${a.visitor_name} has been approved and access credentials generated.`,
            returnUrl: '/manager?view=approvals'
        });
    };
    const reject = (a) => {
        const id = parseInt(a.id);
        toConfirmation({
            title: 'Confirm Appointment Rejection',
            message: `Are you sure you want to reject the appointment request for visitor "${a.visitor_name}"?`,
            actionType: 'REJECT_APPOINTMENT',
            targetEntity: `${a.visitor_name} (${a.reference_code})`,
            consequences: [
                'The appointment status will be changed to REJECTED.',
                'The visitor and host will receive a rejection notice with your remarks.',
                'The reserved room and time slot will be released.'
            ],
            confirmLabel: 'Yes, Reject Request',
            cancelLabel: 'Keep Pending',
            danger: true,
            onConfirmApi: () => appointmentsApi.reject(id, comment[id] || 'Rejected by Department Manager'),
            successTitle: 'Appointment Rejected',
            successMessage: `Appointment for ${a.visitor_name} has been rejected.`,
            returnUrl: '/manager?view=approvals'
        });
    };
    return (<div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 shadow-2xl transition-all duration-300 hover:border-indigo-500/50">
      <div className="mb-8 pb-6 border-b border-slate-800 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-white">Pending Approvals</h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Review and action appointment requests</p>
        </div>
        <div className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-semibold uppercase tracking-wider">
          Manager Domain
        </div>
      </div>

      {appointments.length === 0 ? (<div className="bg-[#0b101b] border border-slate-800 rounded-xl text-center py-12 text-slate-400">
          <Check className="mx-auto h-12 w-12 mb-3 opacity-30 text-cyan-400"/>
          <p className="text-xs uppercase tracking-wider font-bold">No pending approvals — you're all caught up!</p>
        </div>) : (<div className="grid gap-4">
          {appointments.map((a, i) => (<motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[#0b101b] border border-slate-800 rounded-xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-sm text-slate-200">{a.visitor_name}</h3>
                    <StatusBadge status={a.status}/>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">{a.reference_code} · {a.company}</p>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  {new Date(a.scheduled_start).toLocaleString()}
                </p>
              </div>

              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                <div><span className="text-slate-500 font-bold uppercase text-[9px] mr-1">Host:</span> {a.host_name}</div>
                <div><span className="text-slate-500 font-bold uppercase text-[9px] mr-1">Department:</span> {a.department_name}</div>
                <div><span className="text-slate-500 font-bold uppercase text-[9px] mr-1">Room:</span> {a.room_name || 'None'}</div>
              </div>
              <p className="mt-3 text-xs bg-slate-900 border border-slate-800/50 rounded-lg p-3 text-slate-300 font-mono">{a.purpose}</p>
              {a.doc_url && (<div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-bold uppercase text-[9px]">Attached ID:</span>
                  <a href={`${API_BASE}${a.doc_url}`} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 font-bold underline font-mono text-[10px]">
                    {a.doc_name || 'View ID Document'}
                  </a>
                </div>)}

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"/>
                    <input className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono" placeholder={t('placeholder.notes', 'Add a comment (optional)')} value={comment[parseInt(a.id)] || ''} onChange={(e) => setComment({ ...comment, [a.id]: e.target.value })}/>
                  </div>
                </div>
                <button onClick={() => approve(a)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer">
                  <Check className="h-4 w-4"/> {t('btn.approve', 'Approve')}
                </button>
                <button onClick={() => reject(a)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer">
                  <X className="h-4 w-4"/> {t('btn.decline', 'Reject')}
                </button>
              </div>
            </motion.div>))}
        </div>)}
    </div>);
}
