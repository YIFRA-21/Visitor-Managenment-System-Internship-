import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Printer, User, Calendar, Clock, ShieldCheck, FileText, CheckCircle2, FileCheck } from 'lucide-react';
import visitorHistoryApi from '../../../../modules/visitor-history/api/visitorHistoryApi';
import { resolvePhotoUrl } from '../../../../utils/photoUtils';
export default function VisitorHistoryDetails() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    // Extract ID from URL params
    const getHistoryId = () => {
        const params = new URLSearchParams(window.location.search);
        const idParam = params.get('id') || params.get('historyId');
        if (idParam)
            return idParam;
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        return isNaN(Number(lastPart)) ? '1' : lastPart;
    };
    const getContextualHistoryItem = () => {
        let activeHistory = null;
        let registeredData = null;
        try {
            const rawHist = sessionStorage.getItem('active_history_record');
            if (rawHist)
                activeHistory = JSON.parse(rawHist);
            const rawReg = sessionStorage.getItem('registered_visitor_data') ||
                localStorage.getItem('registered_visitor_data') ||
                sessionStorage.getItem('active_visitor_profile') ||
                localStorage.getItem('active_visitor_profile');
            if (rawReg)
                registeredData = JSON.parse(rawReg);
        }
        catch (e) { }
        const authPhoto = sessionStorage.getItem('visitor_uploaded_photo') || localStorage.getItem('visitor_uploaded_photo') || '';
        if (activeHistory) {
            return {
                id: Number(activeHistory.id) || 1,
                history_code: activeHistory.history_code || activeHistory.historyCode || registeredData?.historyCode || 'VIS-2026-000001',
                organization_id: 1,
                visitor_id: 1,
                appointment_id: 1,
                reference_number: activeHistory.reference_number || activeHistory.referenceNumber || registeredData?.referenceNumber || 'N/A',
                visitor_photo: activeHistory.visitor_photo || activeHistory.photoUrl || registeredData?.photoUrl || registeredData?.photo_url || authPhoto,
                visitor_name: activeHistory.visitor_name || activeHistory.visitorName || registeredData?.visitorName || registeredData?.full_name || 'N/A',
                visitor_email: activeHistory.visitor_email || activeHistory.email || registeredData?.email || 'N/A',
                visitor_phone: activeHistory.visitor_phone || activeHistory.phone || registeredData?.phone || 'N/A',
                visitor_company: activeHistory.visitor_company || activeHistory.company || registeredData?.company || 'N/A',
                visitor_category: activeHistory.visitor_category || activeHistory.category || registeredData?.category || 'General Visitor',
                host_employee_name: activeHistory.host_employee_name || activeHistory.hostName || registeredData?.hostName || 'N/A',
                department_name: activeHistory.department_name || activeHistory.department || registeredData?.department || 'N/A',
                appointment_number: activeHistory.appointment_number || activeHistory.appointmentNumber || 'N/A',
                visit_purpose: activeHistory.visit_purpose || activeHistory.purpose || registeredData?.purposeOfVisit || 'N/A',
                meeting_location: activeHistory.meeting_location || activeHistory.location || registeredData?.buildingLocation || 'N/A',
                appointment_date: activeHistory.appointment_date || activeHistory.scheduled_start || registeredData?.expectedDate || '',
                checkin_time: activeHistory.checkin_time || activeHistory.checkInTime || registeredData?.expectedArrival || '',
                checkout_time: activeHistory.checkout_time || activeHistory.checkOutTime || registeredData?.expectedDeparture || '',
                visit_duration_minutes: activeHistory.visit_duration_minutes || activeHistory.duration || 0,
                pass_number: activeHistory.pass_number || activeHistory.passNumber || 'N/A',
                visit_status: activeHistory.visit_status || activeHistory.status || 'PENDING',
                identity_type: activeHistory.identity_type || activeHistory.identityType || registeredData?.idType || 'N/A',
                identity_number: activeHistory.identity_number || activeHistory.identityNumber || registeredData?.idNumber || 'N/A',
                verification_status: activeHistory.verification_status || activeHistory.verificationStatus || registeredData?.verificationStatus || 'Pending Verification',
                completed_date: activeHistory.completed_date || registeredData?.expectedDate || '',
                documents: (activeHistory.documents && activeHistory.documents.length > 0)
                    ? activeHistory.documents
                    : (registeredData?.documents || [])
            };
        }
        if (registeredData) {
            return {
                id: Number(registeredData.id) || 1,
                history_code: registeredData.historyCode || 'VIS-2026-000001',
                organization_id: 1,
                visitor_id: 1,
                appointment_id: 1,
                reference_number: registeredData.referenceNumber || 'N/A',
                visitor_photo: registeredData.photoUrl || registeredData.photo_url || authPhoto,
                visitor_name: registeredData.visitorName || registeredData.fullName || registeredData.full_name || 'N/A',
                visitor_email: registeredData.email || 'N/A',
                visitor_phone: registeredData.phone || 'N/A',
                visitor_company: registeredData.company || 'N/A',
                visitor_category: registeredData.category || 'General Visitor',
                host_employee_name: registeredData.hostName || registeredData.host_employee_name || 'N/A',
                department_name: registeredData.department || registeredData.departmentName || 'N/A',
                appointment_number: registeredData.appointmentNumber || 'N/A',
                visit_purpose: registeredData.purposeOfVisit || registeredData.purpose || 'N/A',
                meeting_location: registeredData.buildingLocation || registeredData.location || 'N/A',
                appointment_date: registeredData.expectedDate || registeredData.appointmentDate || '',
                checkin_time: registeredData.expectedArrival || '',
                checkout_time: registeredData.expectedDeparture || '',
                visit_duration_minutes: 0,
                pass_number: registeredData.passNumber || 'N/A',
                visit_status: registeredData.status || 'PENDING',
                identity_type: registeredData.idType || registeredData.identityType || 'N/A',
                identity_number: registeredData.idNumber || registeredData.identityNumber || 'N/A',
                verification_status: registeredData.verificationStatus || registeredData.id_verification_status || 'Pending Verification',
                completed_date: registeredData.expectedDate || '',
                documents: registeredData.documents || []
            };
        }
        return null;
    };
    const fetchDetails = async () => {
        setLoading(true);
        const fallback = getContextualHistoryItem();
        try {
            const id = getHistoryId();
            const res = await visitorHistoryApi.getById(id);
            setHistory(res.data || fallback);
        }
        catch (err) {
            setHistory(fallback);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDetails();
    }, []);
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
        catch {
            return dateStr;
        }
    };
    const formatTime = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        catch {
            return dateStr;
        }
    };
    const handleBack = () => {
        const fromView = searchParams.get('from');
        if (fromView) {
            setSearchParams({ view: fromView });
            return;
        }
        setSearchParams({ view: 'visit_history' });
    };
    const handlePrint = () => {
        window.print();
    };
    if (loading) {
        return (<div className="p-20 text-center text-slate-400">
        <div className="spinner-border text-primary" role="status"/>
        <p className="mt-3 font-semibold text-xs">Loading Visitor History Details...</p>
      </div>);
    }
    if (!history) {
        return (<div className="p-20 text-center text-slate-400">
        <h4 className="text-white font-bold mb-2">Record Not Found</h4>
        <p className="text-xs mb-4">The requested visitor history record could not be found.</p>
        <button onClick={handleBack} className="btn btn-primary btn-sm font-bold">
          <ArrowLeft className="h-4 w-4 me-1.5 inline"/> Back to History List
        </button>
      </div>);
    }
    return (<div className="space-y-6 p-2 md:p-4 text-slate-100">
      {/* Toast */}
      {toast && (<div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible d-flex align-items-center gap-2 text-xs fw-semibold py-2 fade show`} role="alert">
          {toast.message}
          <button type="button" className="btn-close btn-close-sm" onClick={() => setToast(null)}/>
        </div>)}

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 no-print">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Dashboard &gt; Visitor Management &gt; Visitor History &gt; <span className="text-slate-200">{history.history_code}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight d-flex align-items-center gap-3">
            <button onClick={handleBack} className="btn btn-sm btn-outline-secondary p-1.5 rounded-lg me-1">
              <ArrowLeft className="h-4 w-4"/>
            </button>
            Visitor Visit Summary: {history.visitor_name}
          </h1>
        </div>
        <div className="d-flex gap-2">
          <button onClick={fetchDetails} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2">
            <RefreshCw className="h-3.5 w-3.5"/> Refresh
          </button>
          <button onClick={handlePrint} className="btn btn-primary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2">
            <Printer className="h-3.5 w-3.5"/> Print Summary
          </button>
        </div>
      </div>

      {/* 5 Enterprise Bootstrap Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 1: VISITOR INFORMATION */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-3 border-b border-slate-800 pb-3">
            <User className="h-5 w-5 text-indigo-400"/>
            <h3 className="text-sm font-bold text-white m-0">Section 1: Visitor Information</h3>
          </div>
          <div className="d-flex align-items-center gap-4">
            {(history.visitor_photo || history.photo_url || history.profile_photo) ? (<img src={resolvePhotoUrl(history.visitor_photo || history.photo_url || history.profile_photo)} alt={history.visitor_name} className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-500/30"/>) : (<div className="w-16 h-16 rounded-xl bg-slate-800 text-slate-200 font-bold text-xl flex items-center justify-center border border-slate-700">
                {history.visitor_name ? history.visitor_name.charAt(0).toUpperCase() : 'V'}
              </div>)}
            <div>
              <h4 className="text-base font-bold text-white m-0">{history.visitor_name}</h4>
              <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] mt-1">
                {history.visitor_category || 'General Visitor'}
              </span>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">History Ref</span>
              <span className="font-mono text-indigo-400 font-bold">{history.history_code}</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Reference No.</span>
              <span className="font-mono text-slate-200 font-bold">{history.reference_number}</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Company</span>
              <span className="text-slate-200 font-bold">{history.visitor_company || 'N/A'}</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Phone</span>
              <span className="text-slate-200 font-bold">{history.visitor_phone || 'N/A'}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-slate-400 font-semibold">Email</span>
              <span className="text-slate-200 font-bold">{history.visitor_email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: APPOINTMENT INFORMATION */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-3 border-b border-slate-800 pb-3">
            <Calendar className="h-5 w-5 text-indigo-400"/>
            <h3 className="text-sm font-bold text-white m-0">Section 2: Appointment Information</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Appointment No.</span>
              <span className="font-mono text-indigo-400 font-bold">{history.appointment_number || `APT-${history.appointment_id}`}</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Appointment Date</span>
              <span className="text-slate-200 font-bold">{formatDate(history.appointment_date)}</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Host Employee</span>
              <span className="text-slate-200 font-bold">{history.host_employee_name || 'N/A'}</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Department</span>
              <span className="text-slate-200 font-bold">{history.department_name || 'Main Office'}</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Meeting Location</span>
              <span className="text-slate-200 font-bold">{history.meeting_location || 'Main Reception'}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-slate-400 font-semibold">Visit Purpose</span>
              <span className="text-slate-200 font-bold">{history.visit_purpose || 'General Visit'}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: VISIT TIMING & STATUS */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-3 border-b border-slate-800 pb-3">
            <Clock className="h-5 w-5 text-indigo-400"/>
            <h3 className="text-sm font-bold text-white m-0">Section 3: Visit Information</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Visitor Pass No.</span>
              <span className="font-mono text-amber-400 font-bold">{history.pass_number || `PASS-${history.visitor_id}`}</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Check-In Time</span>
              <span className="text-emerald-400 font-mono font-bold">{formatTime(history.checkin_time)} ({formatDate(history.checkin_time)})</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Check-Out Time</span>
              <span className="text-slate-300 font-mono font-bold">{formatTime(history.checkout_time)} ({formatDate(history.checkout_time)})</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">Visit Duration</span>
              <span className="text-indigo-400 font-bold">{history.visit_duration_minutes || 30} minutes</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-slate-400 font-semibold">Visit Status</span>
              <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 text-[10px]">
                {history.visit_status || 'Completed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER ROW: SECTION 4 & 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 4: IDENTITY INFORMATION */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-3 border-b border-slate-800 pb-3">
            <ShieldCheck className="h-5 w-5 text-indigo-400"/>
            <h3 className="text-sm font-bold text-white m-0">Section 4: Identity Information</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400 font-semibold">Identity Document Type</span>
              <span className="text-slate-200 font-bold">{history.identity_type || 'National ID Card'}</span>
            </div>
            <div className="d-flex justify-content-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400 font-semibold">Identity Number</span>
              <span className="font-mono text-slate-200 font-bold">{history.identity_number || 'ID-99201'}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-slate-400 font-semibold">Verification Status</span>
              <span className="text-emerald-400 font-bold d-flex align-items-center gap-1">
                <CheckCircle2 className="h-4 w-4"/> {history.verification_status || 'Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 5: DOCUMENTS */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-3 border-b border-slate-800 pb-3">
            <FileCheck className="h-5 w-5 text-indigo-400"/>
            <h3 className="text-sm font-bold text-white m-0">Section 5: Attached Documents</h3>
          </div>
          {!history.documents || history.documents.length === 0 ? (<div className="p-6 text-center text-slate-400 font-semibold text-xs border border-slate-800 rounded-xl bg-slate-900/40">
              No attached documents found for this visit record.
            </div>) : (<div className="space-y-2">
              {history.documents.map((doc) => (<div key={doc.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl d-flex align-items-center justify-between">
                  <div className="d-flex align-items-center gap-3">
                    <FileText className="h-5 w-5 text-indigo-400"/>
                    <div>
                      <div className="font-bold text-white text-xs">{doc.document_name}</div>
                      <div className="text-[10px] text-slate-400">{doc.document_type}</div>
                    </div>
                  </div>
                  <a href={doc.document_url || '#'} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-info font-bold">
                    Download / View
                  </a>
                </div>))}
            </div>)}
        </div>
      </div>
    </div>);
}
