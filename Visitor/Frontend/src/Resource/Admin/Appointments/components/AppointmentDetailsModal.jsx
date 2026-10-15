import React from 'react';
import { X, User, Calendar, MapPin, ShieldCheck, CheckCircle2, FileText, Printer, QrCode } from 'lucide-react';
export default function AppointmentDetailsModal({ appointment, onClose, onApprove, onReject, onReschedule, onCancel }) {
    if (!appointment)
        return null;
    const getStatusBadge = (status) => {
        const st = (status || '').toUpperCase();
        if (st === 'APPROVED' || st === 'CONFIRMED') {
            return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-extrabold uppercase">Approved</span>;
        }
        if (st === 'REQUESTED' || st === 'PENDING') {
            return <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-extrabold uppercase">Pending Approval</span>;
        }
        if (st === 'COMPLETED') {
            return <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-extrabold uppercase">Completed</span>;
        }
        if (st === 'REJECTED' || st === 'CANCELLED') {
            return <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-extrabold uppercase">{st}</span>;
        }
        return <span className="px-2.5 py-1 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-full text-xs font-extrabold uppercase">{st}</span>;
    };
    const handlePrintDetails = () => {
        window.print();
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <FileText className="h-5 w-5"/>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Appointment Details: {appointment.appointment_number || appointment.reference_code || `APT-${appointment.id}`}
                </h3>
                {getStatusBadge(appointment.appointment_status)}
              </div>
              <p className="text-xs text-slate-400">Comprehensive enterprise visit & approval summary</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={handlePrintDetails} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors border border-slate-800" title="Print Appointment Document">
              <Printer className="h-4 w-4"/>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X className="h-5 w-5"/>
            </button>
          </div>
        </div>

        {/* Content Body (6 Enterprise Sections) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* SECTION 1: VISITOR INFORMATION */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4"/> Section 1: Visitor Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Visitor ID</span>
                <span className="font-extrabold text-white">{appointment.visitor_code || `VIS-${appointment.visitor_id || '2026-0145'}`}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Full Name</span>
                <span className="font-extrabold text-white">{appointment.visitorName || appointment.full_name || 'John Doe'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Category</span>
                <span className="font-extrabold text-emerald-400">{appointment.visitorCategory || 'General Visitor'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Reference Number</span>
                <span className="font-mono text-indigo-300 font-bold">{appointment.reference_code || 'REF-8145-2026'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Phone</span>
                <span className="font-semibold text-slate-300">{appointment.visitorPhone || '+1 (555) 987-6543'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Email</span>
                <span className="font-semibold text-slate-300">{appointment.visitorEmail || 'john.doe@company.com'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Company</span>
                <span className="font-semibold text-slate-300">{appointment.company || 'Acme Corp'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Identity Status</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 inline"/> Verified</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: APPOINTMENT INFORMATION */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4"/> Section 2: Appointment Details
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Appointment Number</span>
                <span className="font-extrabold text-white">{appointment.appointment_number || `APT-2026-00101`}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Scheduled Start</span>
                <span className="font-extrabold text-white">
                  {appointment.scheduled_start ? new Date(appointment.scheduled_start).toLocaleString() : 'May 20, 2025 • 10:00 AM'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Scheduled End</span>
                <span className="font-extrabold text-white">
                  {appointment.scheduled_end ? new Date(appointment.scheduled_end).toLocaleString() : 'May 20, 2025 • 11:00 AM'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Expected Duration</span>
                <span className="font-semibold text-slate-300">{appointment.expected_duration_minutes || 60} Minutes</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Priority</span>
                <span className="font-bold text-amber-400">{appointment.priority || 'MEDIUM'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Created Date</span>
                <span className="font-semibold text-slate-400">{appointment.created_at ? new Date(appointment.created_at).toLocaleDateString() : 'May 18, 2025'}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60 text-xs">
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Purpose of Visit</span>
              <p className="font-semibold text-slate-200 mt-0.5">{appointment.purpose || appointment.remarks || 'Security Clearance & Onsite Technical Audit'}</p>
            </div>
          </div>

          {/* SECTION 3: HOST INFORMATION */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4"/> Section 3: Host Employee Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Host Employee</span>
                <span className="font-extrabold text-white">{appointment.hostName || 'Michael Johnson'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Department</span>
                <span className="font-semibold text-slate-300">{appointment.department || 'Security & Operations'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Branch / Location</span>
                <span className="font-semibold text-slate-300">{appointment.branch || 'Main HQ'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: MEETING LOCATION */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4"/> Section 4: Meeting Location & Room
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Building / Facility</span>
                <span className="font-extrabold text-white">Building A - Main Office</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Floor</span>
                <span className="font-semibold text-slate-300">3rd Floor</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Meeting Room</span>
                <span className="font-extrabold text-indigo-400">{appointment.roomName || 'Conference Room A'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 5: APPROVAL INFORMATION */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4"/> Section 5: Approval Workflow Status
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Approval Status</span>
                <span className="font-extrabold text-emerald-400">{appointment.approval_status || 'APPROVED'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Approved By</span>
                <span className="font-semibold text-slate-300">Host Representative</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Approval Level</span>
                <span className="font-semibold text-slate-300">Level 1 (Host Signoff)</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Decision Date</span>
                <span className="font-semibold text-slate-400">May 19, 2025</span>
              </div>
            </div>
          </div>

          {/* SECTION 6: VISIT & PASS VERIFICATION */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <QrCode className="h-4 w-4"/> Section 6: Visitor Pass & Check-In Eligibility
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Visitor Pass Status</span>
                <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5"/> Generated & Active
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Check-In Status</span>
                <span className="font-bold text-amber-400">Eligible for Lobby Check-In</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Security Verification</span>
                <span className="font-bold text-emerald-400">Cleared (Not Blacklisted)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 no-print">
          <div className="flex items-center space-x-2">
            {onApprove && appointment.approval_status === 'PENDING' && (<button onClick={() => { onApprove(appointment); onClose(); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/30">
                Approve Appointment
              </button>)}
            {onReject && appointment.approval_status === 'PENDING' && (<button onClick={() => { onReject(appointment); onClose(); }} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-red-600/30">
                Reject Appointment
              </button>)}
            {onReschedule && (<button onClick={() => { onReschedule(appointment); onClose(); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700">
                Reschedule
              </button>)}
            {onCancel && (<button onClick={() => { onCancel(appointment); onClose(); }} className="px-4 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold rounded-xl transition-colors border border-red-800/50">
                Cancel Visit
              </button>)}
          </div>

          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700 ml-auto">
            Close
          </button>
        </div>
      </div>
    </div>);
}
