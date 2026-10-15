import React from 'react';
import { createPortal } from 'react-dom';
export default function AppointmentDetailsModal({ appointment, onClose, onReschedule, onCancel, onEdit, isInline = false }) {
    const raw = appointment || {};
    const getVisitorFallback = () => {
        let p = {};
        try {
            const active = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
            if (active)
                p = { ...p, ...JSON.parse(active) };
        }
        catch (e) { }
        try {
            const reg = sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
            if (reg) {
                const parsed = JSON.parse(reg);
                p = {
                    ...p,
                    full_name: parsed.visitorName || parsed.fullName || parsed.full_name || p.full_name,
                    email: parsed.email || p.email, phone: parsed.phone || p.phone,
                    company: parsed.company || p.company,
                    visitor_code: parsed.historyCode || parsed.visitor_code || p.visitor_code
                };
            }
        }
        catch (e) { }
        try {
            const personal = sessionStorage.getItem('signup_personal_info') || localStorage.getItem('signup_personal_info');
            if (personal) {
                const parsed = JSON.parse(personal);
                const name = `${parsed.firstName || ''} ${parsed.middleName || ''} ${parsed.lastName || ''}`.trim();
                p = {
                    ...p, full_name: name || p.full_name,
                    email: parsed.email || p.email, phone: parsed.phone || p.phone,
                    company: parsed.company || p.company
                };
            }
        }
        catch (e) { }
        return {
            fullName: p.full_name || 'Minilik Ayele Yifra',
            email: p.email || 'belayyifra@gmail.com',
            phone: p.phone || '+251 92 110 9998',
            company: p.company || 'IT Park',
            visitorCode: p.visitor_code || 'VIS-2026-000001'
        };
    };
    const vFallback = getVisitorFallback();
    const data = {
        id: raw.appointmentNumber || raw.historyCode || raw.id || vFallback.visitorCode,
        title: raw.purpose ? `Visit: ${raw.purpose}` : (raw.title || 'Visitor Appointment'),
        status: raw.status || raw.visit_status || 'Approved',
        month: raw.month || (raw.scheduled_start ? new Date(raw.scheduled_start).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'AUG'),
        day: raw.day || (raw.scheduled_start ? new Date(raw.scheduled_start).getDate() : '03'),
        weekDay: raw.weekDay || (raw.scheduled_start ? new Date(raw.scheduled_start).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : 'MON'),
        time: raw.time || `${raw.checkInTime || raw.checkin_time || '10:00 AM'} - ${raw.checkOutTime || raw.checkout_time || '11:30 AM'}`,
        bookedOn: raw.bookedOn || (raw.scheduled_start ? new Date(raw.scheduled_start).toLocaleDateString() : '8/3/2026'),
        date: raw.date || raw.appointmentDate || (raw.scheduled_start ? new Date(raw.scheduled_start).toLocaleDateString() : '8/3/2026'),
        purpose: raw.purpose || raw.purposeOfVisit || raw.visit_purpose || 'Business Meeting',
        meetingType: raw.meetingType || 'In-person Visit',
        location: raw.location || raw.buildingLocation || raw.meeting_location || 'Main Office, Building A, 3rd Floor',
        meetingRoom: raw.meetingRoom || 'Meeting Room A-301',
        specialRequest: raw.specialRequest || raw.additionalNotes || 'None',
        visitorName: (raw.visitorName && raw.visitorName !== 'N/A' && raw.visitorName !== 'A') ? raw.visitorName : (raw.fullName || raw.full_name || vFallback.fullName),
        visitorEmail: (raw.email && raw.email !== 'N/A') ? raw.email : (raw.visitorEmail || raw.visitor_email || vFallback.email),
        visitorPhone: (raw.phone && raw.phone !== 'N/A' && raw.phone !== 'A') ? raw.phone : (raw.visitorPhone || raw.visitor_phone || vFallback.phone),
        visitorCompany: (() => {
            const c = (raw.company && raw.company !== 'N/A') ? raw.company : (raw.visitorCompany || raw.visitor_company || vFallback.company);
            if (!c || c === 'ABC Company Ltd' || c === '-' || ['information national', 'red cloud', 'africom', 'vms enterprise', 'biotech'].some(x => c.toLowerCase().includes(x))) {
                return 'IT Park';
            }
            return c;
        })(),
        visitorIdType: raw.identityType || raw.idType || raw.visitorIdType || 'National ID',
        visitorIdNumber: (raw.identityNumber && raw.identityNumber !== 'N/A') ? raw.identityNumber : (raw.idNumber || raw.visitorIdNumber || vFallback.visitorCode),
        hostName: (raw.hostName && raw.hostName !== 'N/A') ? raw.hostName : (raw.host || 'Michael Johnson'),
        hostTitle: raw.hostTitle || 'Host Employee',
        hostDepartment: raw.department || raw.hostDepartment || raw.departmentName || raw.department_name || 'IT Department',
        hostEmail: raw.hostEmail || 'michael.johnson@tech.com',
        hostPhone: raw.hostPhone || '+251 11 987 6543',
        timeline: raw.timeline || [
            { label: 'Appointment Registered', date: raw.bookedOn || '8/3/2026', completed: true },
            { label: 'Security Clearance', date: 'Approved', completed: true },
            { label: 'Check-In Time', date: raw.time ? raw.time.split('-')[0] : '10:00 AM', completed: true }
        ]
    };
    const content = (<div className="bg-[#0f172a] border border-slate-800 text-slate-100 rounded-2xl p-6 w-full shadow-2xl space-y-6 relative font-sans text-xs">
      {/* Header Breadcrumb & Back Icon */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button type="button" onClick={onClose} title="Back to List" className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 rounded-xl border border-slate-700/80 transition-all shadow-md active:scale-95 shrink-0">
          <i className="bi bi-arrow-left text-lg"></i>
        </button>

        <div className="text-[11px] font-mono text-slate-400">
          Dashboard &gt; My Appointments &gt; <span className="text-indigo-400 font-bold">Appointment Details</span>
        </div>
      </div>

      {/* Appointment Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-indigo-950 border border-indigo-700/50 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold uppercase text-indigo-400">{data.month || 'MAY'}</span>
            <span className="text-xl font-black text-slate-100 leading-none">{data.day || '20'}</span>
            <span className="text-[9px] text-slate-500">{data.weekDay || 'TUE'}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-100 mb-0">{data.title || 'Visit to Tech Solutions Inc.'}</h2>
              <span className="badge bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                {data.status || 'Approved'}
              </span>
            </div>
            <div className="text-slate-400 text-xs flex flex-wrap gap-x-4 gap-y-1">
              <span><i className="bi bi-briefcase text-indigo-400 me-1"></i> {data.purpose || 'Business Meeting'}</span>
              <span><i className="bi bi-[#3b82f6] text-blue-400 me-1"></i> {data.meetingType || 'In-person Meeting'}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
              <span><i className="bi bi-geo-alt me-1"></i> {data.location || 'Main Office, Building A, 3rd Floor'}</span>
            </div>
          </div>
        </div>

        <div className="text-right font-mono text-[11px] text-slate-400 space-y-1 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
          <div>Appointment ID: <span className="text-indigo-300 font-bold">{data.id || 'APT-2025-000125'}</span></div>
          <div>Booked on: <span className="text-slate-300">{data.bookedOn || 'May 15, 2025 09:30 AM'}</span></div>
        </div>
      </div>

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Visitor Information Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <i className="bi bi-person-vcard text-indigo-400"></i> Visitor Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500 block text-[10px]">Name:</span> <span className="text-slate-200 font-semibold">{data.visitorName || 'John Doe'}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Email:</span> <span className="text-slate-200 font-semibold">{data.visitorEmail || 'john.doe@email.com'}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Phone:</span> <span className="text-slate-200 font-semibold">{data.visitorPhone || '+251 11 123 4567'}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Company:</span> <span className="text-slate-200 font-semibold">{data.visitorCompany || 'IT Park'}</span></div>
              <div><span className="text-slate-500 block text-[10px]">ID Type:</span> <span className="text-slate-200 font-semibold">{data.visitorIdType || 'Passport'}</span></div>
              <div><span className="text-slate-500 block text-[10px]">ID Number:</span> <span className="text-slate-200 font-semibold">{data.visitorIdNumber || 'P1234567'}</span></div>
            </div>
          </div>

          {/* Host / Department Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <i className="bi bi-[#6366f1] text-indigo-400"></i> Host / Department
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 font-bold flex items-center justify-center text-sm">
                MJ
              </div>
              <div>
                <div className="font-bold text-slate-100">{data.hostName || 'Michael Johnson'}</div>
                <div className="text-[11px] text-slate-400">{data.hostTitle || 'IT Manager'}</div>
                <span className="badge bg-indigo-950 text-indigo-300 border border-indigo-800 text-[9px] mt-1">
                  {data.hostDepartment || 'IT Department'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60 space-y-1 text-slate-300 text-xs">
              <div><i className="bi bi-envelope text-slate-500 me-2"></i> {data.hostEmail || 'michael.johnson@tech.com'}</div>
              <div><i className="bi bi-telephone text-slate-500 me-2"></i> {data.hostPhone || '+251 11 987 6543'}</div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Timeline Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <i className="bi bi-check-circle-fill text-emerald-400"></i> Status Timeline
            </h4>
            <div className="space-y-3 relative pl-4 border-l-2 border-slate-800">
              {(data.timeline || [
            { label: 'Appointment Requested', date: 'May 15, 2025 09:30 AM', completed: true },
            { label: 'Host Approved', date: 'May 16, 2025 10:15 AM', completed: true },
            { label: 'Department Approved', date: 'May 18, 2025 02:45 PM', completed: true },
            { label: 'Appointment Confirmed', date: 'May 19, 2025 09:10 AM', completed: true }
        ]).map((stepItem, idx) => (<div key={idx} className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[8px] text-slate-950 font-bold">
                    ✓
                  </div>
                  <div className="font-semibold text-slate-200">{stepItem.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{stepItem.date}</div>
                </div>))}
            </div>
          </div>

          {/* Appointment Details Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <i className="bi bi-info-circle text-indigo-400"></i> Appointment Information
            </h4>
            <div className="space-y-2 text-xs">
              <div><span className="text-slate-500">Date:</span> <span className="text-slate-200 font-semibold">{data.date || 'May 20, 2025 (Tuesday)'}</span></div>
              <div><span className="text-slate-500">Time:</span> <span className="text-slate-200 font-semibold font-mono">{data.time || '10:00 AM - 11:00 AM'}</span></div>
              <div><span className="text-slate-500">Location:</span> <span className="text-slate-200 font-semibold">{data.location || 'Main Office, Building A, 3rd Floor'}</span></div>
              <div><span className="text-slate-500">Meeting Room:</span> <span className="text-slate-200 font-semibold">{data.meetingRoom || 'Meeting Room A-301'}</span></div>
              <div><span className="text-slate-500">Purpose:</span> <span className="text-slate-200 font-semibold">{data.purpose || 'Business Meeting'}</span></div>
              <div><span className="text-slate-500">Special Request:</span> <span className="text-slate-200 font-semibold">{data.specialRequest || 'None'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        {onReschedule && (<button type="button" onClick={() => {
                onReschedule(data);
            }} className="btn btn-outline-indigo btn-sm text-xs border-indigo-500/50 text-indigo-300 hover:bg-indigo-950 px-3 py-1.5 rounded-lg border">
            <i className="bi bi-arrow-repeat me-1"></i> Reschedule Appointment
          </button>)}

        {onCancel && (<button type="button" onClick={() => {
                onCancel(data);
            }} className="btn btn-outline-danger btn-sm text-xs border-rose-800 text-rose-300 hover:bg-rose-950 px-3 py-1.5 rounded-lg border">
            <i className="bi bi-x-circle me-1"></i> Cancel Appointment
          </button>)}
      </div>
    </div>);
    if (isInline) {
        return content;
    }
    return createPortal(<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto" style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {content}
      </div>
    </div>, document.body);
}
