import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, CheckCircle2, XCircle, AlertTriangle, X, UserCheck, LogOut } from 'lucide-react';
import RegistrationWizard from './components/RegistrationWizard';
import visitorProfileApi from '../../modules/visitor-management/api/visitorProfileApi';
import { BackButton } from '../../components/common/BackButton';
export const VisitorRegistrationPage = ({ departments = [], employees = [] }) => {
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [selectedDraftId, setSelectedDraftId] = useState(undefined);
    const [actionLoading, setActionLoading] = useState('');
    // Handle Full Registration Lifecycle Status Management
    const handleUpdateStatus = async (visitorId, newStatus) => {
        setActionLoading(`${visitorId}-${newStatus}`);
        try {
            await visitorProfileApi.changeStatus(visitorId, newStatus, `Registration lifecycle status changed to ${newStatus} by operator.`);
            if (selectedVisitor && (selectedVisitor.id === visitorId || selectedVisitor.visitor_code === visitorId)) {
                setSelectedVisitor((prev) => ({ ...prev, status: newStatus, registration_status: newStatus }));
            }
        }
        catch (err) {
            console.error('Status change error:', err);
        }
        finally {
            setActionLoading('');
        }
    };
    // Color & Badge Config for Lifecycle Statuses
    const getStatusBadge = (status) => {
        const s = (status || 'APPROVED').toUpperCase();
        switch (s) {
            case 'APPROVED':
            case 'ACTIVE':
                return { bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50', icon: CheckCircle2, label: 'APPROVED' };
            case 'PENDING':
                return { bg: 'bg-amber-950/80 text-amber-300 border-amber-700/50', icon: Clock, label: 'PENDING' };
            case 'CHECKED_IN':
            case 'IN_PROGRESS':
                return { bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50', icon: UserCheck, label: 'CHECKED IN' };
            case 'CHECKED_OUT':
            case 'COMPLETED':
                return { bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50', icon: LogOut, label: 'COMPLETED' };
            case 'REJECTED':
            case 'CANCELLED':
                return { bg: 'bg-rose-950/80 text-rose-300 border-rose-700/50', icon: XCircle, label: 'REJECTED' };
            case 'SUSPENDED':
            case 'EXPIRED':
                return { bg: 'bg-purple-950/80 text-purple-300 border-purple-700/50', icon: AlertTriangle, label: s };
            default:
                return { bg: 'bg-slate-900 text-slate-300 border-slate-700', icon: CheckCircle2, label: s };
        }
    };
    return (<div className="p-4 md:p-6 bg-[#090d16] text-slate-100 min-h-screen space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
                <Users size={24} className="text-indigo-400"/>
                Enterprise Visitor Registration
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Create permanent Visitor Master Records with 10-step wizard validation, drag &amp; drop uploads, and complete lifecycle status management.
            </p>
          </div>
        </div>
      </div>

      {/* Registration Wizard directly */}
      <RegistrationWizard initialDraftId={selectedDraftId} departments={departments} employees={employees} onSuccess={() => { }}/>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedVisitor && (<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 text-xs shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <UserCheck className="text-indigo-400" size={18}/> Visitor Master Record Details
                </h3>
                <button onClick={() => setSelectedVisitor(null)} className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-all">
                  <X size={16}/>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-slate-400">Visitor Code:</span>
                  <div className="font-mono font-bold text-indigo-300 text-sm">{selectedVisitor.visitor_code || `VIS-${selectedVisitor.id}`}</div>
                </div>
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-slate-400">Reference Number:</span>
                  <div className="font-mono font-bold text-emerald-400 text-sm">{selectedVisitor.reference_number || 'REF-N/A'}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2 text-slate-300">
                <div><span className="text-slate-400">Full Name:</span> <strong className="text-white">{selectedVisitor.full_name || `${selectedVisitor.first_name} ${selectedVisitor.last_name}`}</strong></div>
                <div><span className="text-slate-400">Email:</span> {selectedVisitor.email}</div>
                <div><span className="text-slate-400">Phone:</span> {selectedVisitor.phone} (Alt: {selectedVisitor.alt_phone || 'None'})</div>
                <div><span className="text-slate-400">Gender &amp; DOB:</span> {selectedVisitor.gender} • {selectedVisitor.date_of_birth || 'N/A'}</div>
                <div><span className="text-slate-400">Address:</span> {selectedVisitor.address?.city || selectedVisitor.city || 'N/A'}, {selectedVisitor.address?.country || selectedVisitor.country || 'Ethiopia'}</div>
                <div><span className="text-slate-400">Nationality:</span> {selectedVisitor.nationality || 'Ethiopian'}</div>
                <div><span className="text-slate-400">Emergency Contact:</span> {selectedVisitor.emergency_contact_name || selectedVisitor.emergencyContact?.contact_name} ({selectedVisitor.emergency_contact_phone || selectedVisitor.emergencyContact?.phone})</div>
                <div><span className="text-slate-400">Vehicle Plate:</span> {selectedVisitor.vehicle?.license_plate || selectedVisitor.vehicle_plate_number || 'Pedestrian / No Vehicle'}</div>
              </div>

              {/* Status Transition Control Panel */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Manage Visitor Registration Status</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['APPROVED', 'PENDING', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED', 'REJECTED'].map((st) => (<button key={st} onClick={() => handleUpdateStatus(selectedVisitor.id, st)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${(selectedVisitor.registration_status || selectedVisitor.status) === st
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-indigo-500/50'}`}>
                      {st}
                    </button>))}
                </div>
              </div>

              <div className="pt-2 text-right">
                <button onClick={() => setSelectedVisitor(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all">
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>)}
      </AnimatePresence>
    </div>);
};
export default VisitorRegistrationPage;
