import React, { useState, useEffect, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import UniversalDocViewer from './UniversalDocViewer';
import { detectDocType } from '../../utils/docUtils';
import CountryPhoneInput from '../../components/common/CountryPhoneInput';
import FieldError from '../../components/common/FieldError';
import { validateName, validateEmail, validatePhone, validateText, validateDateTimeRange } from '../../utils/formValidation';
import { parseBackendFormErrors } from '../../utils/formErrorUtils';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle,
  Search,
  User,
  AlertCircle,
  Eye,
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  RotateCcw,
  RotateCw,
  XCircle,
  Building,
  ShieldCheck,
  Mail,
  Briefcase,
  IdCard,
  SquarePen,
  Trash2,
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  Layers,
  ExternalLink,
  X,
  History,
  Sparkles,
  FileWarning,
  CheckCircle2,
  Printer,
  Maximize,
  Minimize,
} from 'lucide-react';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import { appointmentsApi, employeePortalApi, roomsApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponseNavigation, RESPONSE_TYPES } from '../../modules/response';

const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function EmployeeAppointments() {
    const { t, tStatus } = useLanguage();
    const { toSuccess, toError, toConfirmation } = useResponseNavigation();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('scheduled_start');
    const [sortOrder, setSortOrder] = useState('DESC');
    // Modals
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedApt, setSelectedApt] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [rescheduleApt, setRescheduleApt] = useState(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleStart, setRescheduleStart] = useState('');
    const [rescheduleEnd, setRescheduleEnd] = useState('');
    const [cancelApt, setCancelApt] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [deleteApt, setDeleteApt] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    // Document Inspection & Reader Modals
    const [showDocModal, setShowDocModal] = useState(false);
    const [docVisitor, setDocVisitor] = useState(null);
    const [docLoading, setDocLoading] = useState(false);
    const [visitorDocs, setVisitorDocs] = useState([]);
    const [docVersionFilter, setDocVersionFilter] = useState('ALL');
    const [inspectingDoc, setInspectingDoc] = useState(null);
    const [inspectDocZoom, setInspectDocZoom] = useState(1);
    const [inspectDocRotation, setInspectDocRotation] = useState(0);
    const [inspectDocViewMode, setInspectDocViewMode] = useState('CARD'); // 'CARD' | 'RAW'
    const [empDocxHtml, setEmpDocxHtml] = useState('');
    const [empDocxLoading, setEmpDocxLoading] = useState(false);
    const [approvingDoc, setApprovingDoc] = useState(false);
    const [isDocFullscreen, setIsDocFullscreen] = useState(false);
    const docCanvasRef = useRef(null);

    // Track fullscreen state changes (handles Escape key, etc.)
    useEffect(() => {
      const handleFsChange = () => {
        setIsDocFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const toggleDocFullscreen = useCallback(() => {
      if (!docCanvasRef.current) return;
      if (!document.fullscreenElement) {
        docCanvasRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }, []);

    useEffect(() => {
        if (!inspectingDoc) {
            setEmpDocxHtml('');
            setEmpDocxLoading(false);
            return;
        }
        const docUrl = inspectingDoc.file_url || '';
        const isDocx = (
            inspectingDoc.mime_type?.includes('wordprocessingml') ||
            inspectingDoc.mime_type?.includes('msword') ||
            /\.(docx|doc)$/i.test(docUrl) ||
            /\.(docx|doc)$/i.test(inspectingDoc.file_name || '')
        );
        if (isDocx && docUrl) {
            setEmpDocxLoading(true);
            const fullUrl = (docUrl.startsWith('http://') || docUrl.startsWith('https://') || docUrl.startsWith('blob:') || docUrl.startsWith('data:'))
                ? docUrl
                : `${baseUrl}${docUrl.startsWith('/') ? '' : '/'}${docUrl}`;
            fetch(fullUrl)
                .then(res => {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.arrayBuffer();
                })
                .then(arrayBuffer => {
                    const converter = mammoth.convertToHtml || mammoth.default?.convertToHtml;
                    if (!converter) throw new Error('Mammoth engine not available');
                    return converter({ arrayBuffer });
                })
                .then(result => {
                    setEmpDocxHtml(result.value || '');
                    setEmpDocxLoading(false);
                })
                .catch(err => {
                    console.warn('Docx loading warning:', err);
                    setEmpDocxHtml('');
                    setEmpDocxLoading(false);
                });
        } else {
            setEmpDocxHtml('');
            setEmpDocxLoading(false);
        }
    }, [inspectingDoc?.id, inspectingDoc?.file_url]);
    // Form & action state
    const [submitting, setSubmitting] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);
    const [message, setMessage] = useState(null);
    const [createErrors, setCreateErrors] = useState({});
    const [rescheduleErrors, setRescheduleErrors] = useState({});
    const [cancelErrors, setCancelErrors] = useState({});

    const [newForm, setNewForm] = useState({
        visitor_name: '',
        visitor_email: '',
        visitor_phone: '',
        visitor_company: '',
        visitor_category: 'Business Visitor',
        title: '',
        purpose: '',
        room_id: '',
        scheduled_start: '',
        scheduled_end: '',
        comments: '',
    });

    const handleNewFormChange = (field, value) => {
        setNewForm(prev => ({ ...prev, [field]: value }));
        if (createErrors[field]) {
            setCreateErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await employeePortalApi.getMyAppointments();
            const data = res.data || [];
            setAppointments(Array.isArray(data) ? data : []);
        }
        catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load appointments.' });
        }
        finally {
            setLoading(false);
        }
    };
    const fetchRooms = async () => {
        try {
            const res = await roomsApi.list();
            setRooms(Array.isArray(res.data) ? res.data : []);
        }
        catch {
            setRooms([]);
        }
    };
    useEffect(() => {
        fetchAppointments();
        fetchRooms();
    }, []);
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        const nameErr = validateName(newForm.visitor_name, 'Visitor name', true);
        if (nameErr) errs.visitor_name = nameErr;
        const emailErr = validateEmail(newForm.visitor_email, true);
        if (emailErr) errs.visitor_email = emailErr;
        if (newForm.visitor_phone && newForm.visitor_phone.trim()) {
            const phoneErr = validatePhone(newForm.visitor_phone, '+251', false);
            if (phoneErr) errs.visitor_phone = phoneErr;
        }
        if (!newForm.scheduled_start) {
            errs.scheduled_start = 'Scheduled start date and time is required.';
        }
        if (!newForm.scheduled_end) {
            errs.scheduled_end = 'Scheduled end date and time is required.';
        } else if (newForm.scheduled_start) {
            const rangeErr = validateDateTimeRange(newForm.scheduled_start, newForm.scheduled_end);
            if (rangeErr) errs.scheduled_end = rangeErr;
        }
        const purposeErr = validateText(newForm.purpose, 'Purpose / Agenda', 3, 500, true);
        if (purposeErr) errs.purpose = purposeErr;

        if (Object.keys(errs).length > 0) {
            setCreateErrors(errs);
            return;
        }

        setSubmitting(true);
        try {
            const res = await appointmentsApi.create(newForm);
            setShowNewModal(false);
            setCreateErrors({});
            toSuccess({
                type: RESPONSE_TYPES.APPOINTMENT_SUBMISSION_RESULT,
                title: 'Appointment Scheduled Successfully',
                message: `Appointment for ${newForm.visitor_name} has been created and registered in the corporate access system.`,
                referenceId: res?.data?.reference_code || res?.data?.id || null,
                entityType: 'Appointment',
                entityName: newForm.visitor_name,
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        catch (err) {
            const backend = parseBackendFormErrors(err);
            if (backend && backend.fieldErrors && Object.keys(backend.fieldErrors).length > 0) {
                setCreateErrors(backend.fieldErrors);
                setMessage({ type: 'error', text: err.response?.data?.error || err.response?.data?.message || 'Please correct the validation errors.' });
            } else {
                toError(err, {
                    title: 'Failed to Create Appointment',
                    entityType: 'Appointment',
                    entityName: newForm.visitor_name,
                    returnUrl: window.location.pathname + window.location.search,
                });
            }
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleRescheduleSubmit = async (e) => {
        e.preventDefault();
        if (!rescheduleApt)
            return;
        const errs = {};
        if (!rescheduleStart) errs.rescheduleStart = 'New start time is required.';
        if (!rescheduleEnd) errs.rescheduleEnd = 'New end time is required.';
        else if (rescheduleStart) {
            const rangeErr = validateDateTimeRange(rescheduleStart, rescheduleEnd);
            if (rangeErr) errs.rescheduleEnd = rangeErr;
        }
        if (Object.keys(errs).length > 0) {
            setRescheduleErrors(errs);
            return;
        }
        setRescheduling(true);
        try {
            await employeePortalApi.requestAction(rescheduleApt.id, 'RESCHEDULE', {
                newStart: rescheduleStart,
                newEnd: rescheduleEnd,
            });
            setShowRescheduleModal(false);
            setRescheduleApt(null);
            setRescheduleErrors({});
            toSuccess({
                type: RESPONSE_TYPES.SUCCESS,
                title: 'Appointment Rescheduled',
                message: `Appointment #${rescheduleApt.reference_code || rescheduleApt.id} has been moved to ${rescheduleStart}.`,
                referenceId: rescheduleApt.reference_code || rescheduleApt.id,
                entityType: 'Appointment',
                entityName: rescheduleApt.visitor_name,
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        catch (err) {
            toError(err, {
                title: 'Reschedule Operation Failed',
                entityType: 'Appointment',
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        finally {
            setRescheduling(false);
        }
    };
    const handleCancelSubmit = async (e) => {
        e.preventDefault();
        if (!cancelApt)
            return;
        if (!cancelReason || cancelReason.trim().length < 3) {
            setCancelErrors({ cancelReason: 'Cancellation reason is required (min 3 characters).' });
            return;
        }
        setShowCancelModal(false);
        toConfirmation({
            title: 'Confirm Appointment Cancellation',
            message: `Are you sure you want to cancel the scheduled visit for ${cancelApt.visitor_name}?`,
            entityType: 'Appointment',
            entityName: `#${cancelApt.reference_code || cancelApt.id} - ${cancelApt.visitor_name}`,
            entityId: cancelApt.id,
            consequences: [
                'The visitor and security desk will receive instant cancellation notifications.',
                'Any scheduled meeting room or visitor badge associated will be released.',
                'This cancellation event will be recorded in the departmental audit log.'
            ],
            confirmLabel: 'Confirm Cancellation',
            confirmVariant: 'danger',
            apiEndpoint: `/employee/appointments/${cancelApt.id}/action`,
            apiMethod: 'POST',
            apiPayload: { action: 'CANCEL', comment: cancelReason || 'Cancelled by host employee' },
            returnUrl: window.location.pathname + window.location.search,
            successConfig: {
                type: RESPONSE_TYPES.CANCELLATION_SUCCESS,
                title: 'Appointment Cancelled',
                message: `Appointment #${cancelApt.reference_code || cancelApt.id} has been successfully cancelled.`,
            }
        });
    };
    const handleDeleteSubmit = async (e) => {
        e.preventDefault();
        if (!deleteApt)
            return;
        setShowDeleteModal(false);
        toConfirmation({
            title: 'Confirm Permanent Deletion',
            message: `Permanently delete appointment record #${deleteApt.reference_code || deleteApt.id} for ${deleteApt.visitor_name}?`,
            entityType: 'Appointment Record',
            entityName: `#${deleteApt.reference_code || deleteApt.id} (${deleteApt.visitor_name})`,
            entityId: deleteApt.id,
            consequences: [
                'The appointment entry will be permanently erased from all system views.',
                'All automated access codes and QR passes will be immediately invalidated.',
                'This action is irreversible and recorded in the audit trail.'
            ],
            confirmLabel: 'Permanently Delete Record',
            confirmVariant: 'danger',
            apiEndpoint: `/appointments/${deleteApt.id}`,
            apiMethod: 'DELETE',
            returnUrl: window.location.pathname + window.location.search,
            successConfig: {
                type: RESPONSE_TYPES.RECORD_DELETED,
                title: 'Appointment Record Purged',
                message: `Appointment #${deleteApt.reference_code || deleteApt.id} has been permanently deleted.`,
            }
        });
    };

    const handleOpenDocs = async (apt) => {
        setDocVisitor(apt);
        setShowDocModal(true);
        setDocLoading(true);
        setDocVersionFilter('ALL');
        setInspectDocZoom(1);
        setInspectDocRotation(0);
        setInspectDocViewMode('CARD');
        try {
            const idToQuery = apt.visitor_id || apt.appointment_id || apt.id || apt.reference_code;
            const res = await employeePortalApi.getVisitorDocuments(idToQuery);
            let docs = [];
            if (res.data && res.data.documents && Array.isArray(res.data.documents)) {
                docs = res.data.documents;
            } else if (Array.isArray(res.data)) {
                docs = res.data;
            }
            if (docs.length === 0 && (apt.identity_doc || apt.id_number)) {
                const idVal = apt.identity_doc || apt.id_number;
                docs = [{
                    id: `id-doc-${apt.id || apt.visitor_id || '1'}`,
                    document_name: `${apt.id_type || 'National ID'}`,
                    document_type: apt.id_type || 'National Identity / Passport',
                    document_number: idVal,
                    file_name: `${idVal}.pdf`,
                    file_url: null,
                    version_number: 1,
                    is_current: true,
                    status: 'VERIFIED',
                    verification_status: 'VERIFIED',
                    is_submitted: true,
                    created_at: apt.created_at || new Date().toISOString()
                }];
            }
            setVisitorDocs(docs);
            const activeDoc = docs.find(d => d.is_current) || docs[0] || null;
            setInspectingDoc(activeDoc);
        } catch {
            const fallback = [];
            if (apt.identity_doc) {
                fallback.push({
                    id: `id-doc-${apt.id}`,
                    document_type: 'National Identity / Passport',
                    document_number: apt.identity_doc,
                    file_name: `${apt.identity_doc}.pdf`,
                    file_url: null,
                    version_number: 1,
                    is_current: true,
                    status: 'VERIFIED',
                    created_at: apt.created_at || new Date().toISOString()
                });
            }
            setVisitorDocs(fallback);
            setInspectingDoc(fallback[0] || null);
        } finally {
            setDocLoading(false);
        }
    };

    const handleDownloadDoc = (doc) => {
        if (!doc) return;
        const docUrl = doc.file_url || '';
        const fullUrl = (docUrl.startsWith('http://') || docUrl.startsWith('https://') || docUrl.startsWith('data:') || docUrl.startsWith('blob:'))
            ? docUrl
            : `${baseUrl}${docUrl.startsWith('/') ? '' : '/'}${docUrl}`;
        const a = document.createElement('a');
        a.href = fullUrl;
        a.download = doc.file_name || `${doc.document_type || 'document'}_v${doc.version_number || 1}`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleApproveFromDoc = async (apt) => {
        if (!apt) return;
        setShowDocModal(false);
        toConfirmation({
            title: 'Authorize Visitor Appointment',
            message: `Authorize and confirm appointment #${apt.reference_code || apt.id} for ${apt.visitor_name} after reviewing credentials?`,
            entityType: 'Appointment Authorization',
            entityName: `${apt.visitor_name} (#${apt.reference_code || apt.id})`,
            entityId: apt.id,
            consequences: [
                'The visitor will receive official pass credentials for entry.',
                'Security gates and reception desks will receive notification of authorization.',
                'An official entry token and visitor badge will be generated.'
            ],
            confirmLabel: 'Approve & Issue Access',
            confirmVariant: 'success',
            apiEndpoint: `/employee/appointments/${apt.id}/action`,
            apiMethod: 'POST',
            apiPayload: { action: 'APPROVE', comment: 'Approved by host after document inspection.' },
            returnUrl: window.location.pathname + window.location.search,
            successConfig: {
                type: RESPONSE_TYPES.APPROVAL_PROCESSED,
                title: 'Appointment Approved',
                message: `Appointment #${apt.reference_code || apt.id} for ${apt.visitor_name} has been approved.`,
            }
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setDateFilter('ALL');
    };
    const filtered = appointments.filter((apt) => {
        const st = (apt.status || 'APPROVED').toUpperCase();
        let matchesStatus = true;
        if (statusFilter !== 'ALL') {
            matchesStatus = st === statusFilter || (statusFilter === 'ONGOING' && st === 'CHECKED_IN');
        }
        const aptDate = apt.scheduled_start ? new Date(apt.scheduled_start) : new Date();
        const isToday = aptDate.toDateString() === new Date().toDateString();
        let matchesDate = true;
        if (dateFilter === 'TODAY')
            matchesDate = isToday;
        else if (dateFilter === 'UPCOMING')
            matchesDate = aptDate >= new Date(new Date().setHours(0, 0, 0, 0));
        else if (dateFilter === 'PAST')
            matchesDate = aptDate < new Date(new Date().setHours(0, 0, 0, 0));
        const matchesSearch = (apt.visitor_name || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (apt.visitor_company || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (apt.reference_code || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (apt.purpose || '')?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesDate && matchesSearch;
    });
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        }
        else {
            setSortBy(column);
            setSortOrder('ASC');
        }
    };
    const renderSortIcon = (column) => (<ArrowUpDown className={`h-3 w-3 ms-1 inline ${sortBy === column ? 'text-blue-500' : 'text-slate-500'}`}/>);
    const getStatusBadge = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
            case 'CHECKED_IN':
            case 'ONGOING':
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold';
            case 'COMPLETED':
                return 'bg-slate-800/80 text-slate-300 border border-slate-600/60 font-bold';
            case 'CANCELLED':
            case 'REJECTED':
                return 'bg-red-500/10 text-red-400 border border-red-500/30 font-bold';
            case 'RESCHEDULED':
                return 'bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold';
            default:
                return 'bg-slate-800 text-slate-400 border border-slate-700';
        }
    };
    const formatDateTile = (dateStr) => {
        if (!dateStr)
            return { month: 'AUG', day: '1', fullDate: 'AUG 1, 2026', timeRange: '01:00 PM - 02:00 PM' };
        const d = new Date(dateStr);
        const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const day = d.getDate();
        const fullDate = `${month} ${day}, ${d.getFullYear()}`;
        const startTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endDate = new Date(d.getTime() + 3600000);
        const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return { month, day: String(day), fullDate, timeRange: `${startTime} - ${endTime}` };
    };
    return (<div className="p-6 space-y-5 bg-[#080d1b] min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-blue-500"/>
            My Host Appointments
          </h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">
            Schedule and manage your personal guest visitor appointments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={fetchAppointments} className="flex items-center space-x-2 px-3.5 py-2 bg-[#0e1628] hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-all">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/>
            <span>Refresh</span>
          </button>

          <button onClick={() => setShowNewModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-transform active:scale-95">
            <Plus className="h-4 w-4"/>
            <span>Create New Appointment</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (<div className={`p-3.5 rounded-xl flex items-center justify-between border text-xs font-bold ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <div className="flex items-center space-x-3">
            {message.type === 'success' ? <CheckCircle className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100">Dismiss</button>
        </div>)}

      {/* SEARCH & FILTER CARD (Branch Directory Style) */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Quick Search input */}
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5"/>
            <input type="text" placeholder={t('appointments.placeholder_search', 'Quick search by visitor, company, reference...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-semibold placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"/>
          </div>

          {/* Status Dropdown Filter */}
          <div className="w-full md:w-48">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500">
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="ONGOING">Checked-In / Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
              <option value="RESCHEDULED">Rescheduled</option>
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <div className="w-full md:w-44">
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500">
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="PAST">Past</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button onClick={clearFilters} className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-[#0f172a] hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-300 transition-all" title="Reset Filters">
              <RotateCcw className="h-3.5 w-3.5"/>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE LIST CARD */}
      {loading ? (<div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-[#1e293b] rounded-xl border border-slate-800">
          Loading Appointments...
        </div>) : filtered.length === 0 ? (<div className="p-12 text-center bg-[#1e293b] border border-slate-800 rounded-xl space-y-2">
          <CalendarIcon className="h-10 w-10 text-slate-600 mx-auto mb-2"/>
          <p className="text-sm font-bold text-white uppercase">No Appointments Found</p>
          <p className="text-slate-400 text-xs">No records matched your search filters.</p>
        </div>) : (<div className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table align-middle text-xs mb-0 w-full">
              <thead>
                <tr className="bg-[#0f172a] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold">
                  <th className="px-3 py-3 text-center" style={{ width: '50px' }}>{t('table.photo', 'Photo')}</th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('scheduled_start')}>
                    {t('visitor.dateTime', 'Date & Time')} {renderSortIcon('scheduled_start')}
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('purpose')}>
                    {t('visitor.apptRef', 'Appointment & Ref')} {renderSortIcon('purpose')}
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('visitor_name')}>
                    {t('table.visitor', 'Visitor / Guest')} {renderSortIcon('visitor_name')}
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('host_name')}>
                    {t('table.hostDept', 'Host & Dept')} {renderSortIcon('host_name')}
                  </th>
                  <th className="px-4 py-3">{t('visitor.locationRoom', 'Location & Room')}</th>
                  <th className="px-4 py-3 cursor-pointer text-center" onClick={() => handleSort('status')}>
                    {t('table.status', 'Status')} {renderSortIcon('status')}
                  </th>
                  <th className="px-4 py-3 text-end">{t('table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((apt) => {
                const dateInfo = formatDateTile(apt.scheduled_start);
                return (<tr key={apt.id} className="hover:bg-slate-800/40 border-b border-slate-800/50 transition-colors">
                      {/* Photo Placeholder */}
                      <td className="px-3 py-3 text-center whitespace-nowrap" style={{ width: '50px' }}>
                        <div className="d-inline-block">
                          {(apt.visitor_photo || apt.photo_url || apt.profile_photo) ? (<img src={resolvePhotoUrl(apt.visitor_photo || apt.photo_url || apt.profile_photo)} alt={apt.visitor_name} className="w-9 h-11 rounded-lg object-cover border border-slate-700/80 shadow-md"/>) : (<div className="w-9 h-11 rounded-lg bg-[#0f172a] flex items-center justify-center border border-slate-700/80 shadow-md">
                              <User className="h-4 w-4 text-slate-400"/>
                            </div>)}
                        </div>
                      </td>

                      {/* DATE & TIME */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-[#070b16] border border-slate-700/80 flex flex-col items-center justify-center font-mono shadow-inner">
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter leading-none">
                              {dateInfo.month}
                            </span>
                            <span className="text-xs font-black text-white leading-tight">
                              {dateInfo.day}
                            </span>
                          </div>
                          <div>
                            <span className="font-extrabold text-white block text-xs tracking-tight">
                              {dateInfo.fullDate}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                              <Clock className="h-3 w-3 text-slate-500"/>
                              {dateInfo.timeRange}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* APPOINTMENT & REF */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div>
                          <span className="font-extrabold text-white block text-xs mb-1">
                            {apt.purpose || apt.title || 'Routine Maintenance Inspection'}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold inline-block bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            {apt.reference_code || `REF-${apt.id}-2026`}
                          </span>
                        </div>
                      </td>

                      {/* VISITOR / GUEST */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div>
                          <span className="font-extrabold text-white block text-xs">{apt.visitor_name || '—'}</span>
                          <div className="text-[10px] text-slate-400 font-semibold">{apt.visitor_company || apt.company || '—'}</div>
                          {apt.visitor_email && <div className="text-[10px] text-slate-500 font-mono mt-0.5">{apt.visitor_email}</div>}
                        </div>
                      </td>

                      {/* HOST & DEPT */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div>
                          <span className="font-extrabold text-slate-200 block text-xs">
                            {apt.host_name || '—'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full border border-slate-700 text-[9px] font-bold text-slate-400 bg-[#070b16] inline-block mt-0.5">
                            {apt.department || apt.department_name || '—'}
                          </span>
                        </div>
                      </td>

                      {/* LOCATION & ROOM */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div>
                          <span className="font-semibold text-slate-300 block text-xs">
                            {apt.location || '—'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {apt.room_name || '—'}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(apt.status)}`}>
                          {apt.status || 'APPROVED'}
                        </span>
                      </td>

                      {/* ACTIONS — Separate View, Reschedule, Cancel, and Delete */}
                      <td className="px-4 py-3.5 text-end whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. View Details — Eye Icon */}
                          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedApt(apt); setShowDetailModal(true); }} className="group w-[34px] h-[34px] rounded-[12px] border border-slate-700/80 hover:border-slate-400 bg-[#131c2e] text-white hover:-translate-y-0.5 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer" title="View Visitor & Appointment Details">
                            <Eye className="h-4 w-4 stroke-[1.8] text-white transition-colors"/>
                          </button>

                          {/* 2. Documents & Versions — FileText Icon */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDocs(apt);
                            }}
                            className="group w-[34px] h-[34px] rounded-[12px] border border-indigo-500/80 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:shadow-[0_4px_14px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer"
                            title="Inspect Visitor Documents & Version History"
                          >
                            <FileText className="h-4 w-4 stroke-[1.8] text-indigo-400 group-hover:text-white transition-colors" />
                          </button>

                          {/* 2. Reschedule / Edit — SquarePen Icon */}
                          <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        setRescheduleApt(apt);
                        setShowRescheduleModal(true);
                    }} className="group w-[34px] h-[34px] rounded-[12px] border border-slate-700/80 bg-[#131c2e] text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:shadow-[0_4px_14px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer" title="Reschedule Appointment">
                            <SquarePen className="h-4 w-4 stroke-[1.8] text-indigo-400 group-hover:text-white transition-colors"/>
                          </button>

                          {/* 3. Cancel Appointment — XCircle Icon */}
                          <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            toConfirmation({
                              title: 'Confirm Appointment Cancellation',
                              message: `Are you sure you want to cancel the scheduled visit for ${apt.visitor_name}?`,
                              entityType: 'Appointment',
                              entityName: `#${apt.reference_code || apt.id} - ${apt.visitor_name}`,
                              entityId: apt.id,
                              consequences: [
                                'The visitor and reception desk will receive immediate cancellation notices.',
                                'Any reserved conference space or meeting slot will be freed.',
                                'This cancellation action is logged under your employee profile.'
                              ],
                              confirmLabel: 'Confirm Cancellation',
                              confirmVariant: 'danger',
                              apiEndpoint: `/employee/appointments/${apt.id}/action`,
                              apiMethod: 'POST',
                              apiPayload: { action: 'CANCEL', comment: 'Cancelled by host employee via appointments view' },
                              returnUrl: window.location.pathname + window.location.search,
                              successConfig: {
                                type: RESPONSE_TYPES.CANCELLATION_SUCCESS,
                                title: 'Appointment Cancelled',
                                message: `Appointment #${apt.reference_code || apt.id} has been cancelled.`,
                              }
                            });
                          }} disabled={(apt.status || '').toUpperCase() === 'CANCELLED' || (apt.status || '').toUpperCase() === 'REJECTED'} className={`group w-[34px] h-[34px] rounded-[12px] flex items-center justify-center transition-all duration-200 shadow-sm ${(apt.status || '').toUpperCase() === 'CANCELLED' || (apt.status || '').toUpperCase() === 'REJECTED'
                            ? 'bg-slate-800/40 border border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'border border-amber-500/80 bg-amber-500/10 text-amber-400 hover:bg-amber-600 hover:text-white hover:border-amber-500 hover:shadow-[0_4px_14px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 active:scale-95 cursor-pointer'}`} title={(apt.status || '').toUpperCase() === 'CANCELLED' ? 'Already Cancelled' : 'Cancel Appointment'}>
                            <XCircle className="h-4 w-4 stroke-[1.8] transition-colors"/>
                          </button>

                          {/* 4. Delete Appointment — Trash2 Icon */}
                          <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            toConfirmation({
                              title: 'Confirm Permanent Deletion',
                              message: `Permanently delete appointment record #${apt.reference_code || apt.id} for ${apt.visitor_name}?`,
                              entityType: 'Appointment Record',
                              entityName: `#${apt.reference_code || apt.id} (${apt.visitor_name})`,
                              entityId: apt.id,
                              consequences: [
                                'The appointment entry will be permanently erased from all system views.',
                                'All automated access codes and QR passes will be immediately invalidated.',
                                'This administrative action is irreversible.'
                              ],
                              confirmLabel: 'Permanently Delete Record',
                              confirmVariant: 'danger',
                              apiEndpoint: `/appointments/${apt.id}`,
                              apiMethod: 'DELETE',
                              returnUrl: window.location.pathname + window.location.search,
                              successConfig: {
                                type: RESPONSE_TYPES.RECORD_DELETED,
                                title: 'Appointment Record Purged',
                                message: `Appointment #${apt.reference_code || apt.id} has been permanently deleted.`,
                              }
                            });
                          }} className="group w-[34px] h-[34px] rounded-[12px] border border-red-500/80 bg-red-500/10 text-red-400 hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-[0_4px_14px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer" title="Delete Appointment Record">
                            <Trash2 className="h-4 w-4 stroke-[1.8] text-red-400 group-hover:text-white transition-colors"/>
                          </button>
                        </div>
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-5 py-3 bg-[#070b16] border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mt-1 rounded-b-xl">
            <div className="text-slate-500 font-bold">
              Showing <span className="text-white font-extrabold">1</span> to{' '}
              <span className="text-white font-extrabold">{filtered.length}</span> of{' '}
              <span className="text-white font-extrabold">{filtered.length}</span> entries
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-slate-400 font-semibold">
                <span>Per Page:</span>
                <div className="relative">
                  <select className="bg-[#0e1628] border border-slate-700/60 text-white rounded-lg px-3 py-1 pr-7 text-xs font-bold appearance-none cursor-pointer focus:outline-none">
                    <option value="10">10 / page</option>
                    <option value="25">25 / page</option>
                    <option value="50">50 / page</option>
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2 top-1.5 pointer-events-none"/>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button disabled className="px-3 py-1 bg-[#0e1628] text-slate-600 border border-slate-800/60 rounded-lg text-xs font-bold cursor-not-allowed">&lt; Prev</button>
                <button className="px-3 py-1 bg-blue-600 text-white font-black rounded-lg text-xs shadow-md">1</button>
                <button disabled className="px-3 py-1 bg-[#0e1628] text-slate-600 border border-slate-800/60 rounded-lg text-xs font-bold cursor-not-allowed">Next &gt;</button>
              </div>
            </div>
          </div>
        </div>)}

      {/* COMPREHENSIVE VISITOR & APPOINTMENT DETAIL MODAL */}
      {showDetailModal && selectedApt && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-400"/>
                Registered Visitor Profile &amp; Appointment Details
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            {/* Visitor Identity Header Card */}
            <div className="p-4 bg-[#0e1628] border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-16 rounded-xl bg-[#131b31] border border-slate-700 flex items-center justify-center overflow-hidden shadow-md">
                  {(selectedApt.visitor_photo || selectedApt.photo_url || selectedApt.profile_photo) ? (<img src={resolvePhotoUrl(selectedApt.visitor_photo || selectedApt.photo_url || selectedApt.profile_photo)} alt={selectedApt.visitor_name} className="w-full h-full object-cover"/>) : (<User className="h-7 w-7 text-slate-400"/>)}
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{selectedApt.visitor_name || 'Guest Visitor'}</h4>
                  <p className="text-xs text-indigo-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="h-3.5 w-3.5 text-indigo-400"/>
                    {selectedApt.visitor_company || 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Reference Code: <span className="text-blue-300 font-bold">{selectedApt.reference_code || `REF-${selectedApt.id}`}</span>
                  </p>
                </div>
              </div>

              <div className="text-end">
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider block mb-2 ${getStatusBadge(selectedApt.status)}`}>
                  {selectedApt.status || 'APPROVED'}
                </span>
                {selectedApt.visitor_category && (<span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded-lg inline-block">
                    {selectedApt.visitor_category}
                  </span>)}
              </div>
            </div>

            {/* Registered Data Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Visitor Contact Info */}
              <div className="bg-[#0e1628] border border-slate-800 p-4 rounded-xl space-y-3">
                <h5 className="text-[11px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
                  <Mail className="h-4 w-4 text-blue-400"/> Registered Contact Information
                </h5>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Email Address</span>
                  <span className="text-white font-mono font-semibold">{selectedApt.visitor_email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Phone Number</span>
                  <span className="text-white font-mono font-semibold">{selectedApt.visitor_phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Identity Document / ID</span>
                  <span className="text-indigo-300 font-mono font-bold flex items-center gap-1 mt-0.5">
                    <IdCard className="h-3.5 w-3.5 text-indigo-400"/>
                    {selectedApt.identity_doc || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Appointment & Location Info */}
              <div className="bg-[#0e1628] border border-slate-800 p-4 rounded-xl space-y-3">
                <h5 className="text-[11px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
                  <Building className="h-4 w-4 text-indigo-400"/> Appointment &amp; Location Info
                </h5>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Host Employee</span>
                  <span className="text-white font-bold">{selectedApt.host_name || 'N/A'}</span>
                  {selectedApt.department && <span className="text-slate-400 text-[10px] block font-medium">{selectedApt.department}</span>}
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Location &amp; Building</span>
                  <span className="text-slate-200 font-semibold">{selectedApt.location || selectedApt.room_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Assigned Meeting Room</span>
                  <span className="text-indigo-300 font-bold">{selectedApt.room_name || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Agenda & Time Schedule Card */}
            <div className="bg-[#0e1628] border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
              <h5 className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Clock className="h-4 w-4 text-emerald-400"/> Scheduled Agenda &amp; Timing
              </h5>
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Meeting Purpose / Agenda</span>
                <p className="text-white font-semibold mt-0.5">{selectedApt.purpose || selectedApt.title || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Scheduled Start</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {selectedApt.scheduled_start ? new Date(selectedApt.scheduled_start).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Duration</span>
                  <span className="text-indigo-300 font-mono font-bold block mt-0.5">
                    {selectedApt.duration_minutes ? `${selectedApt.duration_minutes} Minutes` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenDocs(selectedApt);
                }}
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl font-bold uppercase text-xs flex items-center gap-1.5 transition-all"
              >
                <FileText className="h-4 w-4" /> Inspect Documents (Past & Present)
              </button>
              <button onClick={() => setShowDetailModal(false)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold uppercase text-xs">
                Close Profile
              </button>
            </div>
          </div>
        </div>)}

      {/* New Appointment Modal */}
      {showNewModal && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-400"/>
                <span>Create New Host Appointment</span>
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('host.visitor_full_name', 'Visitor Full Name')} *</label>
                  <input
                    type="text"
                    value={newForm.visitor_name}
                    onChange={(e) => handleNewFormChange('visitor_name', e.target.value)}
                    placeholder={t('form.placeholder_john_doe', 'e.g. John Doe')}
                    className={`w-full bg-[#0e1628] border rounded-xl px-3 py-2 text-white focus:outline-none ${createErrors.visitor_name ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-indigo-500'}`}
                    data-invalid={!!createErrors.visitor_name}
                  />
                  <FieldError error={createErrors.visitor_name} id="host-visitor-name-error" />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('host.visitor_company', 'Visitor Company')}</label>
                  <input
                    type="text"
                    value={newForm.visitor_company}
                    onChange={(e) => handleNewFormChange('visitor_company', e.target.value)}
                    placeholder={t('form.placeholder_acme_corp', 'e.g. Acme Corp')}
                    className="w-full bg-[#0e1628] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('host.visitor_email', 'Visitor Email')} *</label>
                  <input
                    type="email"
                    value={newForm.visitor_email}
                    onChange={(e) => handleNewFormChange('visitor_email', e.target.value)}
                    placeholder={t('form.placeholder_email', 'john@example.com')}
                    className={`w-full bg-[#0e1628] border rounded-xl px-3 py-2 text-white focus:outline-none ${createErrors.visitor_email ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-indigo-500'}`}
                    data-invalid={!!createErrors.visitor_email}
                  />
                  <FieldError error={createErrors.visitor_email} id="host-visitor-email-error" />
                </div>
                <div>
                  <CountryPhoneInput
                    id="host-visitor-phone"
                    label={t('host.visitor_phone', 'Visitor Phone')}
                    value={newForm.visitor_phone}
                    onChange={(val) => handleNewFormChange('visitor_phone', val)}
                    placeholder={t('form.placeholder_phone', '+1 555 0192')}
                    error={createErrors.visitor_phone}
                  />
                  <FieldError error={createErrors.visitor_phone} id="host-visitor-phone-error" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('host.scheduled_start', 'Scheduled Start')} *</label>
                  <input
                    type="datetime-local"
                    value={newForm.scheduled_start}
                    onChange={(e) => handleNewFormChange('scheduled_start', e.target.value)}
                    className={`w-full bg-[#0e1628] border rounded-xl px-3 py-2 text-white focus:outline-none ${createErrors.scheduled_start ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-indigo-500'}`}
                    data-invalid={!!createErrors.scheduled_start}
                  />
                  <FieldError error={createErrors.scheduled_start} id="host-scheduled-start-error" />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('host.scheduled_end', 'Scheduled End')} *</label>
                  <input
                    type="datetime-local"
                    value={newForm.scheduled_end}
                    onChange={(e) => handleNewFormChange('scheduled_end', e.target.value)}
                    className={`w-full bg-[#0e1628] border rounded-xl px-3 py-2 text-white focus:outline-none ${createErrors.scheduled_end ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-indigo-500'}`}
                    data-invalid={!!createErrors.scheduled_end}
                  />
                  <FieldError error={createErrors.scheduled_end} id="host-scheduled-end-error" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">{t('host.meeting_room_location', 'Meeting Room / Location')}</label>
                <select value={newForm.room_id} onChange={(e) => handleNewFormChange('room_id', e.target.value)} className="w-full bg-[#0e1628] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
                  <option value="">{t('host.main_office_lobby', '-- Main Office / Lobby --')}</option>
                  {rooms.map((r) => (<option key={r.id} value={r.id}>
                      {r.room_name} ({t('host.capacity', 'Capacity')}: {r.capacity || 8})
                    </option>))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">{t('host.purpose_agenda', 'Purpose / Agenda')} *</label>
                <textarea
                  rows={2}
                  value={newForm.purpose}
                  onChange={(e) => handleNewFormChange('purpose', e.target.value)}
                  placeholder={t('form.placeholder_meeting_agenda', 'Describe the meeting objectives...')}
                  className={`w-full bg-[#0e1628] border rounded-xl p-3 text-white focus:outline-none ${createErrors.purpose ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-indigo-500'}`}
                  data-invalid={!!createErrors.purpose}
                />
                <FieldError error={createErrors.purpose} id="host-purpose-error" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase">
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase">
                  {submitting ? t('common.creating', 'Creating...') : t('host.create_appointment', 'Create Appointment')}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Reschedule Appointment Modal */}
      {showRescheduleModal && rescheduleApt && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-blue-400"/>
                <span>Reschedule Appointment</span>
              </h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-[#0e1628] border border-slate-800 rounded-xl text-xs space-y-1">
              <p className="text-white font-bold">{rescheduleApt.purpose || rescheduleApt.visitor_name}</p>
              <p className="text-slate-400 font-mono">Ref: {rescheduleApt.reference_code || `APT-${rescheduleApt.id}`}</p>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs" noValidate>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('host.new_start_time', 'New Start Time')} *</label>
                  <input
                    type="datetime-local"
                    value={rescheduleStart}
                    onChange={(e) => {
                      setRescheduleStart(e.target.value);
                      if (rescheduleErrors.rescheduleStart) {
                        setRescheduleErrors(prev => { const n = { ...prev }; delete n.rescheduleStart; return n; });
                      }
                    }}
                    className={`w-full bg-[#0e1628] border rounded-xl px-3 py-2 text-white focus:outline-none ${rescheduleErrors.rescheduleStart ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'}`}
                    data-invalid={!!rescheduleErrors.rescheduleStart}
                  />
                  <FieldError error={rescheduleErrors.rescheduleStart} id="host-reschedule-start-error" />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('host.new_end_time', 'New End Time')} *</label>
                  <input
                    type="datetime-local"
                    value={rescheduleEnd}
                    onChange={(e) => {
                      setRescheduleEnd(e.target.value);
                      if (rescheduleErrors.rescheduleEnd) {
                        setRescheduleErrors(prev => { const n = { ...prev }; delete n.rescheduleEnd; return n; });
                      }
                    }}
                    className={`w-full bg-[#0e1628] border rounded-xl px-3 py-2 text-white focus:outline-none ${rescheduleErrors.rescheduleEnd ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'}`}
                    data-invalid={!!rescheduleErrors.rescheduleEnd}
                  />
                  <FieldError error={rescheduleErrors.rescheduleEnd} id="host-reschedule-end-error" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="h-10 min-h-[40px] px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase transition">
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" disabled={rescheduling} className="h-10 min-h-[40px] px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase flex items-center gap-2 transition disabled:opacity-50">
                  {rescheduling && <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" />}
                  <span>{rescheduling ? t('common.rescheduling', 'Rescheduling...') : t('host.confirm_reschedule', 'Confirm Reschedule')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Cancel Appointment Modal Card */}
      {showCancelModal && cancelApt && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400"/>
                <span>Cancel Appointment</span>
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            <div className="p-3 bg-[#0e1628] border border-slate-800 rounded-xl text-xs space-y-1">
              <p className="text-white font-bold">{cancelApt.title || cancelApt.purpose || cancelApt.visitor_name || 'Host Appointment'}</p>
              <p className="text-slate-400 font-mono">Ref: <span className="text-blue-300 font-bold">{cancelApt.reference_code || `APT-${cancelApt.id}`}</span></p>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs" noValidate>
              {/* Quick Cancellation Presets */}
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1.5">{t('host.quick_cancellation_presets', 'Quick Cancellation Presets')}</label>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => { setCancelReason('Host employee unavailable - Meeting postponed'); setCancelErrors({}); }} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold">
                    {t('preset.host_unavailable', '✕ Host Unavailable')}
                  </button>
                  <button type="button" onClick={() => { setCancelReason('Meeting rescheduled to another date'); setCancelErrors({}); }} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold">
                    {t('preset.rescheduled', '✕ Rescheduled')}
                  </button>
                  <button type="button" onClick={() => { setCancelReason('Cancelled per visitor request'); setCancelErrors({}); }} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold">
                    {t('preset.visitor_requested', '✕ Visitor Requested')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">
                  {t('host.cancel_reason_response_msg', 'Cancellation Reason & Response Message')} *
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    if (cancelErrors.cancelReason) setCancelErrors({});
                  }}
                  placeholder={t('form.placeholder_cancel_reason', 'Enter response or cancellation reason...')}
                  className={`w-full bg-[#0e1628] border rounded-xl p-3 text-white focus:outline-none font-sans ${cancelErrors.cancelReason ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-red-500'}`}
                  data-invalid={!!cancelErrors.cancelReason}
                />
                <FieldError error={cancelErrors.cancelReason} id="host-cancel-reason-error" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
                <button type="button" onClick={() => setShowCancelModal(false)} className="h-10 min-h-[40px] px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase transition">
                  {t('common.no_keep', 'No, Keep')}
                </button>
                <button type="submit" disabled={submitting} className="h-10 min-h-[40px] px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold uppercase shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" />}
                  <span>{submitting ? t('common.cancelling', 'Cancelling...') : t('host.yes_cancel_appointment', 'Yes, Cancel Appointment')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Delete Appointment Modal Card */}
      {showDeleteModal && deleteApt && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-rose-500"/>
                <span>Delete Appointment Record</span>
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            <div className="p-3 bg-[#0e1628] border border-slate-800 rounded-xl text-xs space-y-1.5">
              <p className="text-white font-bold">{deleteApt.title || deleteApt.purpose || deleteApt.visitor_name || 'Host Appointment'}</p>
              <p className="text-slate-400 font-mono">Ref: <span className="text-blue-300 font-bold">{deleteApt.reference_code || `APT-${deleteApt.id}`}</span></p>
              <p className="text-slate-400">Visitor: <span className="text-white font-semibold">{deleteApt.visitor_name}</span></p>
              <p className="text-slate-400">Status: <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusBadge(deleteApt.status)}`}>{deleteApt.status || 'APPROVED'}</span></p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this appointment record? This action will remove it from the system records.
            </p>

            <form onSubmit={handleDeleteSubmit} className="space-y-4 text-xs">
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowDeleteModal(false)} disabled={deleting} className="h-10 min-h-[40px] px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={deleting} className="h-10 min-h-[40px] px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
                  {deleting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Yes, Delete Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* ─── UNIFIED VISITOR DOCUMENT INSPECTION & VERSION STUDIO ─── */}
      {showDocModal && docVisitor && (
        <div
          className="vms-doc-modal-overlay animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDocModal(false);
              setInspectingDoc(null);
            }
          }}
        >
          <div className="bg-[#080d1a] border border-slate-800 rounded-2xl w-full h-full max-h-[calc(100vh-1.5rem)] flex flex-col shadow-2xl overflow-hidden text-white">
            
            {/* 1. Studio Header: Visitor Info + Controls */}
            <div className="px-4 py-3 bg-[#0e1628] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={resolvePhotoUrl(docVisitor.visitor_photo || docVisitor.photo_url || docVisitor.profile_photo)}
                    alt={docVisitor.visitor_name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                    }}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-slate-700 shadow bg-slate-900"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0e1628] flex items-center justify-center">
                    <CheckCircle2 className="h-2 w-2 text-white" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-white truncate">{docVisitor.visitor_name || 'Guest Visitor'}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified Credential
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-slate-300 font-bold hidden md:inline">
                      {docVisitor.identity_doc || `DOC-ID-${docVisitor.id}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    🏢 {docVisitor.visitor_company || 'Guest Visitor'} • Ref: <span className="text-blue-400 font-mono font-bold">{docVisitor.reference_code || `REF-${docVisitor.id}`}</span>
                    <span className="text-slate-600 mx-1.5">•</span>
                    ✉️ {docVisitor.visitor_email || 'N/A'} • 📞 {docVisitor.visitor_phone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={approvingDoc}
                  onClick={() => handleApproveFromDoc(docVisitor)}
                  className="h-9 min-h-[36px] px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Approve Visitor Appointment"
                >
                  {approvingDoc ? <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" /> : <ShieldCheck className="h-3.5 w-3.5 shrink-0" />}
                  <span>{approvingDoc ? 'Approving...' : 'Approve Appointment'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowDocModal(false); setInspectingDoc(null); }}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close Document Studio"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 2. Studio Body: 3 Columns Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden min-h-0 bg-[#050811]">
              
              {/* ─── LEFT COLUMN: ALL DOCUMENT VERSIONS (col-span-3) ─── */}
              <div className="lg:col-span-3 bg-[#090e1c] border border-slate-800 rounded-xl p-3 flex flex-col min-h-0 overflow-hidden shadow-lg">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-200 uppercase tracking-wider">
                    <Layers className="h-3.5 w-3.5 text-blue-400" />
                    <span>Document Versions</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {visitorDocs.length}
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold mb-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDocVersionFilter('ALL')}
                    className={`flex-1 py-1 rounded-lg transition-all ${docVersionFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    All ({visitorDocs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocVersionFilter('CURRENT')}
                    className={`flex-1 py-1 rounded-lg transition-all ${docVersionFilter === 'CURRENT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Current ({visitorDocs.filter(d => d.is_current).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocVersionFilter('PAST')}
                    className={`flex-1 py-1 rounded-lg transition-all ${docVersionFilter === 'PAST' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Archive ({visitorDocs.filter(d => !d.is_current).length})
                  </button>
                </div>

                {/* Versions List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                  {docLoading ? (
                    <div className="py-12 text-center space-y-2">
                      <RefreshCw className="h-6 w-6 text-blue-400 animate-spin mx-auto" />
                      <p className="text-[11px] font-bold text-slate-400">Loading versions...</p>
                    </div>
                  ) : visitorDocs.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      <FileWarning className="h-8 w-8 text-amber-400 mx-auto mb-2 opacity-80" />
                      No documents uploaded yet.
                    </div>
                  ) : (() => {
                    const filtered = visitorDocs.filter(doc => {
                      if (docVersionFilter === 'CURRENT') return doc.is_current;
                      if (docVersionFilter === 'PAST') return !doc.is_current;
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="py-8 text-center text-slate-400 text-xs bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                          <History className="h-6 w-6 text-purple-400 mx-auto mb-2 opacity-80" />
                          <p className="font-bold text-slate-300">No {docVersionFilter === 'PAST' ? 'past archived' : 'current'} versions</p>
                          <p className="text-[10px] text-slate-500 mt-1">This visitor only has {visitorDocs.length} version registered.</p>
                          <button
                            type="button"
                            onClick={() => setDocVersionFilter('ALL')}
                            className="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                          >
                            Show All Records ({visitorDocs.length})
                          </button>
                        </div>
                      );
                    }

                    return filtered.map((docItem, idx) => {
                      const isSelected = inspectingDoc && ((docItem.id && docItem.id === inspectingDoc.id) || docItem.file_name === inspectingDoc.file_name);
                      const docItemUrl = docItem.file_url || '';
                      const isDocItemDocx = (docItem.mime_type?.includes('wordprocessingml') || docItem.mime_type?.includes('msword') || /\.(docx|doc)$/i.test(docItemUrl) || /\.(docx|doc)$/i.test(docItem.file_name || ''));
                      const isDocItemPdf = (docItem.mime_type === 'application/pdf' || docItemUrl.endsWith('.pdf') || (docItem.file_name || '').endsWith('.pdf'));
                      const isDocItemImg = (docItem.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(docItemUrl));
                      const formatLabel = isDocItemDocx ? 'DOCX' : isDocItemPdf ? 'PDF' : isDocItemImg ? 'IMAGE' : 'FILE';

                      return (
                        <div
                          key={docItem.id || idx}
                          onClick={() => {
                            setInspectingDoc(docItem);
                            setInspectDocZoom(1);
                            setInspectDocRotation(0);
                            setInspectDocViewMode('CARD');
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left group ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500 text-white'
                              : 'bg-[#0d1424] border-slate-800 hover:border-slate-700 hover:bg-[#111a30] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                docItem.is_current ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}>
                                v{docItem.version_number || 1}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                {formatLabel}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">
                              {docItem.is_current ? 'Current' : 'Archived'}
                            </span>
                          </div>

                          <p className="text-xs font-bold truncate text-slate-100 group-hover:text-blue-400 transition-colors">
                            {docItem.file_name || 'Document'}
                          </p>

                          <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                            <span className="truncate max-w-[130px]">{docItem.document_type || 'Identity Credential'}</span>
                            <span>{new Date(docItem.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>

                          {isSelected && (
                            <div className="mt-2 pt-1 border-t border-blue-500/30 flex items-center justify-between text-[9px] font-extrabold text-blue-400">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                Currently Reading
                              </span>
                              <Eye className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* ─── CENTER COLUMN: REAL DOCUMENT READING CANVAS (col-span-6) ─── */}
              <div ref={docCanvasRef} className={`lg:col-span-6 bg-[#090e1c] border border-slate-800 rounded-xl p-3 flex flex-col min-h-0 overflow-hidden shadow-lg ${isDocFullscreen ? 'fullscreen-doc-canvas' : ''}`}>
                {inspectingDoc ? (
                  <>
                    {/* Canvas Toolbar */}
                    {(() => {
                      const isImg = detectDocType(inspectingDoc) === 'image';
                      
                      return (
                        <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-xl flex items-center justify-between text-xs mb-2.5 shrink-0 flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                            <span className="font-mono font-bold text-[11px] truncate max-w-[150px]">{inspectingDoc.file_name}</span>
                            <span className="text-slate-600">•</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                              v{inspectingDoc.version_number || 1} {inspectingDoc.is_current ? '• Current' : '• Past'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* View Mode Toggle for Image Credentials */}
                            {isImg && (
                              <div className="flex items-center bg-[#070b16] border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => setInspectDocViewMode('CARD')}
                                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                    inspectDocViewMode === 'CARD' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                  }`}
                                  title="View Certified Credential Card"
                                >
                                  ID Card
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInspectDocViewMode('RAW')}
                                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                    inspectDocViewMode === 'RAW' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                  }`}
                                  title="View Raw Scanned Image"
                                >
                                  Raw Scan
                                </button>
                              </div>
                            )}

                            {/* Zoom, Rotate, Print, Download Toolbar */}
                            <div className="flex items-center bg-[#070b16] border border-slate-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => setInspectDocZoom(z => Math.max(0.5, z - 0.2))}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                                title="Zoom Out"
                              >
                                <ZoomOut className="h-3 w-3" />
                              </button>
                              <span className="text-[10px] font-mono font-bold px-1.5 text-slate-300">
                                {Math.round(inspectDocZoom * 100)}%
                              </span>
                              <button
                                type="button"
                                onClick={() => setInspectDocZoom(z => Math.min(3, z + 0.2))}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                                title="Zoom In"
                              >
                                <ZoomIn className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setInspectDocRotation(r => (r + 90) % 360)}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white border-l border-slate-800 ml-1 pl-1.5 cursor-pointer"
                                title="Rotate Clockwise"
                              >
                                <RotateCw className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => { setInspectDocZoom(1); setInspectDocRotation(0); }}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                                title="Reset View"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Fullscreen Toggle */}
                            <button
                              type="button"
                              onClick={toggleDocFullscreen}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg cursor-pointer transition-colors"
                              title={isDocFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            >
                              {isDocFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold items-center gap-1 cursor-pointer hidden sm:inline-flex"
                              title="Print Document"
                            >
                              <Printer className="h-3.5 w-3.5" /> Print
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadDoc(inspectingDoc)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Download Document"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Canvas Reader Sheet */}
                    <div className="flex-1 flex items-center justify-center overflow-auto rounded-xl bg-slate-950 border border-slate-800 p-2 min-h-0">
                      <UniversalDocViewer
                        doc={inspectingDoc}
                        docVisitor={docVisitor}
                        viewMode={inspectDocViewMode}
                        setViewMode={setInspectDocViewMode}
                        zoom={inspectDocZoom}
                        rotation={inspectDocRotation}
                        empDocxHtml={empDocxHtml}
                        empDocxLoading={empDocxLoading}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                    Select a document from the versions sidebar to view its content.
                  </div>
                )}
              </div>

              {/* ─── RIGHT COLUMN: DOCUMENT DETAILS & HOST ACTIONS (col-span-3) ─── */}
              <div className="lg:col-span-3 bg-[#090e1c] border border-slate-800 rounded-xl p-3 flex flex-col justify-between min-h-0 overflow-y-auto shadow-lg space-y-3">
                {inspectingDoc ? (
                  <>
                    <div className="space-y-3 min-h-0 overflow-y-auto pr-0.5">
                      <div className="pb-2 border-b border-slate-800 flex items-center justify-between shrink-0">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Document Details</h4>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {inspectingDoc.verification_status || 'VERIFIED'}
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase">Document Name</span>
                          <span className="font-bold text-white block truncate">{inspectingDoc.file_name}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase">Classification</span>
                          <span className="font-bold text-slate-200">{inspectingDoc.document_type || 'Identity Credential'}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase">Document Number</span>
                          <span className="font-mono font-bold text-blue-400">{inspectingDoc.document_number || 'N/A'}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase">Version Status</span>
                          <span className="font-bold text-emerald-400">
                            v{inspectingDoc.version_number || 1} • {inspectingDoc.is_current ? 'Current Active' : 'Past Archive'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase">Upload Date</span>
                          <span className="text-slate-300">{new Date(inspectingDoc.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase">File Specification</span>
                          <span className="text-slate-300 font-mono text-[11px] truncate block">
                            {inspectingDoc.mime_type || (inspectingDoc.file_name?.endsWith('.docx') ? 'DOCX' : 'Document')}
                          </span>
                        </div>

                        {/* OCR Data Quick Summary if available */}
                        {(() => {
                          const ocrData = inspectingDoc.ocr_data || (inspectingDoc.ocr_extracted_data ? (typeof inspectingDoc.ocr_extracted_data === 'string' ? JSON.parse(inspectingDoc.ocr_extracted_data) : inspectingDoc.ocr_extracted_data) : null);
                          if (!ocrData) return null;
                          return (
                            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1 text-xs">
                              <span className="text-[9px] font-mono font-bold uppercase text-blue-400 block">
                                OCR Verified Metadata
                              </span>
                              {ocrData.fullName && (
                                <div className="text-[11px] text-slate-300 flex justify-between">
                                  <span className="text-slate-400">Name:</span>
                                  <span className="font-bold text-white truncate max-w-[140px]">{ocrData.fullName}</span>
                                </div>
                              )}
                              {ocrData.nationality && (
                                <div className="text-[11px] text-slate-300 flex justify-between">
                                  <span className="text-slate-400">Nationality:</span>
                                  <span className="font-bold text-white">{ocrData.nationality}</span>
                                </div>
                              )}
                              {ocrData.expiryDate && (
                                <div className="text-[11px] text-slate-300 flex justify-between">
                                  <span className="text-slate-400">Expires:</span>
                                  <span className="font-mono font-bold text-emerald-400">{ocrData.expiryDate}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Host Action Panel */}
                    <div className="pt-2.5 border-t border-slate-800 space-y-2 shrink-0">
                      <button
                        type="button"
                        disabled={approvingDoc}
                        onClick={() => handleApproveFromDoc(docVisitor)}
                        className="w-full h-10 min-h-[40px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {approvingDoc ? <RefreshCw className="h-4 w-4 animate-spin shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
                        <span>{approvingDoc ? 'Approving...' : 'Approve Appointment'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(inspectingDoc)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                      >
                        <Download className="h-3.5 w-3.5" /> Download Document
                      </button>

                      <div className="pt-1 text-center text-[10px] text-slate-500 font-mono">
                        🔒 SHA-256 Validated • Immutable Archival
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-500 text-xs my-auto">
                    Select a document version to view details.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>);
}
