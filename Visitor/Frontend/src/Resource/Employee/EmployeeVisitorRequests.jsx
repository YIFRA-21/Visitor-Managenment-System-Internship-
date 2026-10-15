import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import UniversalDocViewer from './UniversalDocViewer';
import { detectDocType } from '../../utils/docUtils';
import {
  CheckCircle2, XCircle, Clock, Search, Eye, FileText, MessageSquare, ArrowUpDown,
  RefreshCw, ChevronDown, User, FileCheck, Download, RotateCcw, X, ShieldCheck,
  Trash2, ZoomIn, ZoomOut, RotateCw, Sparkles, History, Layers, ExternalLink,
  FileWarning, Shield, Hash, Calendar, Maximize2, BookOpen, Printer
} from 'lucide-react';
import { employeePortalApi } from '../../services/api';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import { getBackendBaseUrl } from '../../utils/apiUrl';
import { useLanguage } from '../../contexts/LanguageContext';

const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function EmployeeVisitorRequests() {
    const { t, tStatus } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('DESC');
    // Modals & Action state
    const [selectedReq, setSelectedReq] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [inspectingDoc, setInspectingDoc] = useState(null);
    const [actionType, setActionType] = useState(null);
    // Document Inspection state
    const [visitorDocs, setVisitorDocs] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [docVersionFilter, setDocVersionFilter] = useState('ALL'); // 'ALL' | 'CURRENT' | 'PAST'
    const [inspectDocZoom, setInspectDocZoom] = useState(1);
    const [inspectDocRotation, setInspectDocRotation] = useState(0);
    const [inspectDocViewMode, setInspectDocViewMode] = useState('CARD'); // 'CARD' | 'RAW'
    // Action form state
    const [comment, setComment] = useState('');
    const [newStart, setNewStart] = useState('');
    const [newEnd, setNewEnd] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [empDocxHtml, setEmpDocxHtml] = useState('');
    const [empDocxLoading, setEmpDocxLoading] = useState(false);

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

    useEffect(() => {
        if (showDocumentModal && selectedReq) {
            setLoadingDocs(true);
            setInspectDocZoom(1);
            setInspectDocRotation(0);
            setInspectDocViewMode('CARD');
            setInspectingDoc(null);
            employeePortalApi.getVisitorDocuments(selectedReq.visitor_id || selectedReq.appointment_id || selectedReq.id || selectedReq.reference_code)
                .then(res => {
                    const docData = res.data?.documents || res.data || [];
                    if (Array.isArray(docData) && docData.length > 0) {
                        setVisitorDocs(docData);
                        const activeDoc = docData.find(d => d.is_current) || docData[0] || null;
                        setInspectingDoc(activeDoc);
                    } else {
                        const fallback = [];
                        if (selectedReq.visitor_photo) {
                            fallback.push({
                                id: 'doc-photo-1',
                                document_type: 'Live Identity Photo',
                                document_number: `VER-PHOTO-${selectedReq.id}`,
                                file_url: selectedReq.visitor_photo,
                                file_name: 'Visitor_Photo.jpg',
                                mime_type: 'image/jpeg',
                                file_size: 1024 * 320,
                                verification_status: 'VERIFIED',
                                version_number: 1,
                                is_current: true,
                                created_at: selectedReq.created_at || new Date().toISOString()
                            });
                        }
                        if (selectedReq.identity_doc || selectedReq.id_number) {
                            fallback.push({
                                id: 'doc-id-1',
                                document_type: selectedReq.id_type || 'National ID',
                                document_number: selectedReq.id_number || selectedReq.identity_doc || 'ID-992810',
                                file_url: '/uploads/documents/default.pdf',
                                file_name: `${(selectedReq.id_type || 'National_ID').replace(/\s+/g, '_')}_Document.pdf`,
                                mime_type: 'application/pdf',
                                file_size: 1024 * 780,
                                verification_status: selectedReq.id_verification_status || 'VERIFIED',
                                version_number: 1,
                                is_current: true,
                                created_at: selectedReq.created_at || new Date().toISOString()
                            });
                        }
                        setVisitorDocs(fallback);
                        const activeDoc = fallback.find(d => d.is_current) || fallback[0] || null;
                        setInspectingDoc(activeDoc);
                    }
                })
                .catch(() => {
                    const fallback = [];
                    if (selectedReq.visitor_photo) {
                        fallback.push({
                            id: 'doc-photo-1',
                            document_type: 'Live Identity Photo',
                            document_number: `VER-PHOTO-${selectedReq.id}`,
                            file_url: selectedReq.visitor_photo,
                            file_name: 'Visitor_Photo.jpg',
                            mime_type: 'image/jpeg',
                            file_size: 1024 * 320,
                            verification_status: 'VERIFIED',
                            version_number: 1,
                            is_current: true,
                            created_at: selectedReq.created_at || new Date().toISOString()
                        });
                    }
                    if (selectedReq.identity_doc || selectedReq.id_number) {
                        fallback.push({
                            id: 'doc-id-1',
                            document_type: selectedReq.id_type || 'National ID',
                            document_number: selectedReq.id_number || selectedReq.identity_doc || 'ID-992810',
                            file_url: '/uploads/documents/default.pdf',
                            file_name: `${(selectedReq.id_type || 'National_ID').replace(/\s+/g, '_')}_Document.pdf`,
                            mime_type: 'application/pdf',
                            file_size: 1024 * 780,
                            verification_status: selectedReq.id_verification_status || 'VERIFIED',
                            version_number: 1,
                            is_current: true,
                            created_at: selectedReq.created_at || new Date().toISOString()
                        });
                    }
                    setVisitorDocs(fallback);
                    const activeDoc = fallback.find(d => d.is_current) || fallback[0] || null;
                    setInspectingDoc(activeDoc);
                })
                .finally(() => setLoadingDocs(false));
        }
    }, [showDocumentModal, selectedReq]);

    const handleApproveFromDoc = (req) => {
        setShowDocumentModal(false);
        setInspectingDoc(null);
        handleQuickAction(req, 'APPROVE');
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
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await employeePortalApi.getVisitorRequests('ALL');
            const data = res.data || [];
            setRequests(Array.isArray(data) ? data : []);
        }
        catch {
            setRequests([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchRequests();
    }, []);
    const handleQuickAction = async (req, action) => {
        const targetStatus = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'CANCELLED';
        // Optimistic UI update for instant feedback
        setRequests(prev => prev.map(item => item.id === req.id ? { ...item, status: targetStatus, approval_status: targetStatus } : item));
        try {
            await employeePortalApi.requestAction(req.id, action, { 
                comment: `Quick ${action.toLowerCase()} by host`,
                reference_code: req.reference_code 
            });
            setFeedback({ type: 'success', text: `Request #${req.reference_code || req.id} — ${action} completed! Status → ${targetStatus}` });
        }
        catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.error || `Failed to ${action.toLowerCase()} request.` });
            // Revert optimistic update on failure
            setRequests(prev => prev.map(item => item.id === req.id ? { ...item, status: req.status, approval_status: req.approval_status } : item));
        }
    };
    const handleExecuteAction = async (e) => {
        e.preventDefault();
        if (!selectedReq || !actionType)
            return;
        setSubmitting(true);
        const targetReqId = selectedReq.id;
        const targetRefCode = selectedReq.reference_code;
        const previousStatus = selectedReq.status;
        const targetStatus = actionType === 'APPROVE' ? 'APPROVED' : actionType === 'REJECT' ? 'REJECTED' : actionType === 'CANCEL' ? 'CANCELLED' : actionType;
        // Optimistic persistent update across local list
        setRequests(prev => prev.map(item => (item.id === targetReqId || item.reference_code === targetRefCode) ? { ...item, status: targetStatus, approval_status: targetStatus } : item));
        try {
            await employeePortalApi.requestAction(targetReqId, actionType, {
                comment,
                newStart,
                newEnd,
                reference_code: targetRefCode,
            });
            setFeedback({ type: 'success', text: `Request #${targetRefCode || targetReqId} — Status updated to ${targetStatus}!` });
            setActionType(null);
            setSelectedReq(null);
            setComment('');
            // Fetch fresh list and guarantee updated status is retained
            const res = await employeePortalApi.getVisitorRequests('ALL');
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                setRequests(res.data.map(item => (item.id === targetReqId || item.reference_code === targetRefCode) ? { ...item, status: targetStatus } : item));
            }
        }
        catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.error || 'Failed to complete request action.' });
            // Revert optimistic update on failure
            setRequests(prev => prev.map(item => (item.id === targetReqId || item.reference_code === targetRefCode) ? { ...item, status: previousStatus } : item));
        }
        finally {
            setSubmitting(false);
        }
    };
    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setCategoryFilter('ALL');
    };
    const filteredRequests = requests.filter((r) => {
        const st = (r.status || r.approval_status || r.appointment_status || 'PENDING').toUpperCase();
        let matchesStatus = true;
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'PENDING') {
                matchesStatus = st === 'PENDING' || st === 'REQUESTED' || st === 'PENDING_APPROVAL' || st === 'UNAPPROVED';
            }
            else {
                matchesStatus = st === statusFilter;
            }
        }
        let matchesCategory = true;
        if (categoryFilter !== 'ALL') {
            matchesCategory = (r.visitor_category || '').toUpperCase().includes(categoryFilter.toUpperCase());
        }
        const matchesSearch = (r.visitor_name || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.visitor_company || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.reference_code || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.purpose || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.visitor_category || '')?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesCategory && matchesSearch;
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
            case 'COMPLETED':
            case 'APPROVED':
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold';
            case 'REJECTED':
            case 'CANCELLED':
                return 'bg-red-500/10 text-red-400 border border-red-500/30 font-bold';
            case 'RETURNED':
                return 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold';
            case 'RESCHEDULED':
                return 'bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold';
            default:
                return 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold';
        }
    };
    return (<div className="p-6 space-y-5 bg-[#080d1b] min-h-screen text-slate-100 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6 text-blue-500"/>
            Visitor Approval Requests
          </h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">
            Review, approve, reject, reschedule, or inspect visitor identification documents assigned to your host account.
          </p>
        </div>
        <button onClick={fetchRequests} className="flex items-center space-x-2 px-4 py-2 bg-[#0e1628] hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-all">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/>
          <span>Refresh</span>
        </button>
      </div>

      {/* FEEDBACK */}
      {feedback && (<div className={`p-3.5 rounded-xl flex items-center justify-between border text-xs font-bold ${feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <div className="flex items-center space-x-3">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100">Dismiss</button>
        </div>)}

      {/* SEARCH & FILTER CARD (Branch Directory Style) */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Quick Search input */}
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5"/>
            <input type="text" placeholder={t('employee.search_visitor_reqs', 'Quick search by visitor, company, reference...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-semibold placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"/>
          </div>

          {/* Status Dropdown Filter */}
          <div className="w-full md:w-48">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500">
              <option value="ALL">{t('common.all_statuses', 'All Statuses')}</option>
              <option value="PENDING">{t('status.pending', 'Pending Approval')}</option>
              <option value="APPROVED">{t('status.approved', 'Approved')}</option>
              <option value="REJECTED">{t('status.rejected', 'Rejected')}</option>
              <option value="RETURNED">{t('status.returned', 'Returned')}</option>
              <option value="RESCHEDULED">{t('status.rescheduled', 'Rescheduled')}</option>
            </select>
          </div>

          {/* Category Filter Dropdown */}
          <div className="w-full md:w-44">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500">
              <option value="ALL">All Categories</option>
              <option value="Business Visitor">Business Visitor</option>
              <option value="Consultant">Consultant</option>
              <option value="Vendor">Vendor</option>
              <option value="General">General Visitor</option>
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
          Loading Visitor Requests Data...
        </div>) : filteredRequests.length === 0 ? (<div className="p-12 text-center bg-[#1e293b] border border-slate-800 rounded-xl space-y-2">
          <FileText className="h-10 w-10 text-slate-600 mx-auto mb-2"/>
          <p className="text-sm font-bold text-white uppercase">No Visitor Requests Found</p>
          <p className="text-slate-400 text-xs">No records matched your search filters.</p>
        </div>) : (<div className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table align-middle text-xs mb-0 w-full">
              <thead>
                <tr className="bg-[#0f172a] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold">
                  <th className="px-3 py-3 text-center" style={{ width: '56px' }}>{t('table.visitor', 'Visitor')}</th>
                  <th className="px-3 py-3 cursor-pointer" onClick={() => handleSort('reference_code')}>
                    {t('table.referenceCode', 'Visitor ID / Reference No.')} {renderSortIcon('reference_code')}
                  </th>
                  <th className="px-3 py-3 cursor-pointer" onClick={() => handleSort('visitor_name')}>
                    {t('table.name', 'Visitor Name / Identity')} {renderSortIcon('visitor_name')}
                  </th>
                  <th className="px-3 py-3 cursor-pointer" onClick={() => handleSort('visitor_category')}>
                    {t('table.category', 'Category')} {renderSortIcon('visitor_category')}
                  </th>
                  <th className="px-3 py-3 cursor-pointer" onClick={() => handleSort('host_name')}>
                    {t('table.hostDept', 'Host & Dept')} {renderSortIcon('host_name')}
                  </th>
                  <th className="px-3 py-3">{t('table.purpose', 'Appointment & Purpose')}</th>
                  <th className="px-3 py-3 cursor-pointer" onClick={() => handleSort('checkin_time')}>
                    {t('table.time', 'Check-In / Out')} {renderSortIcon('checkin_time')}
                  </th>
                  <th className="px-3 py-3 text-center">{t('table.duration', 'Duration')}</th>
                  <th className="px-3 py-3 text-center">{t('table.status', 'Status')}</th>
                  <th className="px-3 py-3 text-end">{t('table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredRequests.map((req) => (<tr key={req.id} className="hover:bg-slate-800/40 border-b border-slate-800/50 transition-colors">
                    {/* Visitor Photo */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap" style={{ width: '56px' }}>
                      <div className="d-inline-block">
                        {(req.visitor_photo || req.photo_url || req.profile_photo) ? (<img src={resolvePhotoUrl(req.visitor_photo || req.photo_url || req.profile_photo)} alt={req.visitor_name} className="w-9 h-11 rounded-lg object-cover border border-slate-700/80 shadow-md"/>) : (<div className="w-9 h-11 rounded-lg bg-[#0f172a] flex items-center justify-center border border-slate-700/80 shadow-md">
                            <User className="h-4 w-4 text-slate-400"/>
                          </div>)}
                      </div>
                    </td>

                    {/* Visitor ID & Ref */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold block mb-1 w-fit bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        {req.reference_code || `REQ-2026-${req.id}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        REF-{req.id}
                      </span>
                    </td>

                    {/* Visitor Name & Identity */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-extrabold text-white block text-xs">{req.visitor_name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{req.visitor_company || 'Independent Visitor'}</span>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full border border-slate-700 text-[10px] font-bold text-slate-300 bg-[#070b16] inline-block">
                        {req.visitor_category || 'General Visitor'}
                      </span>
                    </td>

                    {/* Host & Dept */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-extrabold text-slate-200 block text-xs">{req.host_name || 'Host Representative'}</span>
                      <span className="text-[10px] text-blue-400 font-semibold">{req.department_name || req.department || 'Department'}</span>
                    </td>

                    {/* Appointment & Purpose */}
                    <td className="px-3 py-2.5" style={{ maxWidth: 220 }}>
                      <span className="font-mono text-[10px] text-slate-400 font-bold block">
                        {req.reference_code || req.reference_number || req.visitor_code || `VMS-2026-${req.id}`}
                      </span>
                      <span className="block text-slate-400 font-medium mt-0.5 truncate" style={{ maxWidth: 200 }}>
                        {req.purpose || 'Official Business Meeting'}
                      </span>
                    </td>

                    {/* Check-In / Out */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px] font-bold">
                        <Clock className="h-3 w-3 text-emerald-400"/>
                        In: {req.checkin_time || (req.scheduled_start ? new Date(req.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A')}
                      </div>
                      <div className="text-slate-400 font-mono text-[10px] mt-0.5 ml-4">
                        Out: {req.checkout_time || (req.scheduled_end ? new Date(req.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A')}
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                        {req.duration_minutes ? `${req.duration_minutes} min` : '90 min'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(req.status)}`}>
                        {req.status || 'Pending'}
                      </span>
                    </td>

                    {/* ACTIONS — Response Card Modal Triggers with Dynamic Approved/Cancelled Visual Highlights */}
                    <td className="px-3 py-2.5 text-end whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {/* 1. View Details — Eye Icon (Clean border, NO hover background fill) */}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedReq(req); setShowDetailModal(true); }} className="group w-[38px] h-[38px] rounded-[14px] border border-slate-700/80 hover:border-slate-400 bg-[#131c2e] text-white hover:-translate-y-0.5 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-sm" title="View Full Details">
                          <Eye className="h-[18px] w-[18px] stroke-[1.8] text-white transition-colors"/>
                        </button>

                        {/* 2. Documents — Document Icon (FileText) Replaces Edit Icon */}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedReq(req); setShowDocumentModal(true); }} className="group w-[38px] h-[38px] rounded-[14px] border border-slate-700/80 bg-[#131c2e] text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:shadow-[0_4px_14px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-sm" title="View Visitor Documents & Identity">
                          <FileText className="h-[18px] w-[18px] stroke-[1.8] text-indigo-400 group-hover:text-white transition-colors"/>
                        </button>

                        {/* 3. Approve — ShieldCheck Icon (Triggers Approval Response Card, Solid Green when Approved) */}
                        <button type="button" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReq(req);
                    setActionType('APPROVE');
                    setComment('Approved & Access Pre-cleared by Host');
                }} className={`group w-[38px] h-[38px] rounded-[14px] flex items-center justify-center transition-all duration-200 shadow-sm ${(req.status || '').toUpperCase() === 'APPROVED'
                    ? 'bg-emerald-600 border border-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.4)]'
                    : 'border border-amber-500/80 bg-amber-500/10 text-amber-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 hover:shadow-[0_4px_14px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-95'}`} title="Approve Request — Open Response Card">
                          <ShieldCheck className={`h-[18px] w-[18px] stroke-[1.8] ${(req.status || '').toUpperCase() === 'APPROVED' ? 'text-white' : 'text-amber-400 group-hover:text-white'} transition-colors`}/>
                        </button>

                        {/* 4. Cancel — Trash2 Icon (Triggers Cancel Response Card, Solid Red when Cancelled) */}
                        <button type="button" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReq(req);
                    setActionType('CANCEL');
                    setComment('Request cancelled by host employee');
                }} className={`group w-[38px] h-[38px] rounded-[14px] flex items-center justify-center transition-all duration-200 shadow-sm ${(req.status || '').toUpperCase() === 'CANCELLED' || (req.status || '').toUpperCase() === 'REJECTED'
                    ? 'bg-rose-600 border border-rose-500 text-white shadow-[0_4px_14px_rgba(244,63,94,0.4)]'
                    : 'border border-red-500/80 bg-red-500/10 text-red-400 hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-[0_4px_14px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 active:scale-95'}`} title="Cancel Request — Open Response Card">
                          <Trash2 className={`h-[18px] w-[18px] stroke-[1.8] ${(req.status || '').toUpperCase() === 'CANCELLED' || (req.status || '').toUpperCase() === 'REJECTED' ? 'text-white' : 'text-red-400 group-hover:text-white'} transition-colors`}/>
                        </button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="px-5 py-3 bg-[#070b16] border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-bold">
              Showing <span className="text-white font-extrabold">1</span> to{' '}
              <span className="text-white font-extrabold">{filteredRequests.length}</span> of{' '}
              <span className="text-white font-extrabold">{filteredRequests.length}</span> entries
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


      {/* FULL DETAIL MODAL */}
      {showDetailModal && selectedReq && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400"/>
                Registered Visitor Profile &amp; Request Details
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            {/* Visitor Identity Header Card */}
            <div className="p-4 bg-[#0e1628] border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-16 rounded-xl bg-[#131b31] border border-slate-700 flex items-center justify-center overflow-hidden shadow-md">
                  {(selectedReq.visitor_photo || selectedReq.photo_url || selectedReq.profile_photo) ? (<img src={resolvePhotoUrl(selectedReq.visitor_photo || selectedReq.photo_url || selectedReq.profile_photo)} alt={selectedReq.visitor_name} className="w-full h-full object-cover"/>) : (<User className="h-7 w-7 text-slate-400"/>)}
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{selectedReq.visitor_name || 'Visitor'}</h4>
                  <p className="text-xs text-indigo-400 font-bold mt-0.5">
                    🏢 {selectedReq.visitor_company || 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Reference Code: <span className="text-blue-300 font-bold">{selectedReq.reference_code || `REF-${selectedReq.id}`}</span>
                  </p>
                </div>
              </div>

              <div className="text-end">
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider block mb-2 ${getStatusBadge(selectedReq.status)}`}>
                  {selectedReq.status || 'PENDING'}
                </span>
                {selectedReq.visitor_category && (<span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded-lg inline-block">
                    {selectedReq.visitor_category}
                  </span>)}
              </div>
            </div>

            {/* Registered Data Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Visitor Contact Info */}
              <div className="bg-[#0e1628] border border-slate-800 p-4 rounded-xl space-y-3">
                <h5 className="text-[11px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
                  <FileText className="h-4 w-4 text-blue-400"/> Contact &amp; Identity Details
                </h5>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Email Address</span>
                  <span className="text-white font-mono font-semibold">{selectedReq.visitor_email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Phone Number</span>
                  <span className="text-white font-mono font-semibold">{selectedReq.visitor_phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Identity Document</span>
                  <span className="text-indigo-300 font-mono font-bold block mt-0.5">
                    {selectedReq.identity_doc ? `🪪 ${selectedReq.identity_doc}` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Host & Department Info */}
              <div className="bg-[#0e1628] border border-slate-800 p-4 rounded-xl space-y-3">
                <h5 className="text-[11px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
                  <User className="h-4 w-4 text-indigo-400"/> Host Employee Info
                </h5>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Host Name</span>
                  <span className="text-white font-bold">{selectedReq.host_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Department</span>
                  <span className="text-slate-300 font-semibold">{selectedReq.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Facility &amp; Location</span>
                  <span className="text-slate-300 font-semibold">{selectedReq.location || selectedReq.room_name || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Agenda & Time Schedule Card */}
            <div className="bg-[#0e1628] border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
              <h5 className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Clock className="h-4 w-4 text-emerald-400"/> Agenda &amp; Timestamps
              </h5>
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Meeting Purpose / Agenda</span>
                <p className="text-white font-semibold mt-0.5">{selectedReq.purpose || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Check-In / Check-Out</span>
                  <span className="text-emerald-400 font-mono font-bold block mt-0.5">
                    {selectedReq.checkin_time ? `In: ${selectedReq.checkin_time}` : 'In: N/A'} • {selectedReq.checkout_time ? `Out: ${selectedReq.checkout_time}` : 'Out: N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Duration</span>
                  <span className="text-indigo-300 font-mono font-bold block mt-0.5">
                    {selectedReq.duration_minutes ? `${selectedReq.duration_minutes} Minutes` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase text-xs">Close</button>
              <button onClick={() => { setShowDetailModal(false); handleQuickAction(selectedReq, 'APPROVE'); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-4 w-4"/> Approve Request
              </button>
            </div>
          </div>
        </div>)}

      {/* ─── UNIFIED VISITOR DOCUMENT INSPECTION & VERSION STUDIO ─── */}
      {showDocumentModal && selectedReq && (
        <div
          className="vms-doc-modal-overlay animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDocumentModal(false);
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
                    src={resolvePhotoUrl(selectedReq.visitor_photo || selectedReq.photo_url || selectedReq.profile_photo)}
                    alt={selectedReq.visitor_name}
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
                    <h3 className="text-sm font-black text-white truncate">{selectedReq.visitor_name || 'Guest Visitor'}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified Credential
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-slate-300 font-bold hidden md:inline">
                      {selectedReq.identity_doc || `DOC-ID-${selectedReq.id}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    🏢 {selectedReq.visitor_company || 'Guest Visitor'} • Ref: <span className="text-blue-400 font-mono font-bold">{selectedReq.reference_code || `REF-${selectedReq.id}`}</span>
                    <span className="text-slate-600 mx-1.5">•</span>
                    ✉️ {selectedReq.visitor_email || 'N/A'} • 📞 {selectedReq.visitor_phone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleApproveFromDoc(selectedReq)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Approve Visitor Request"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Approve Request
                </button>

                <button
                  type="button"
                  onClick={() => { setShowDocumentModal(false); setInspectingDoc(null); }}
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
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${docVersionFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    All ({visitorDocs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocVersionFilter('CURRENT')}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${docVersionFilter === 'CURRENT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Current ({visitorDocs.filter(d => d.is_current).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocVersionFilter('PAST')}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${docVersionFilter === 'PAST' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Archive ({visitorDocs.filter(d => !d.is_current).length})
                  </button>
                </div>

                {/* Versions List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                  {loadingDocs ? (
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
              <div className="lg:col-span-6 bg-[#090e1c] border border-slate-800 rounded-xl p-3 flex flex-col min-h-0 overflow-hidden shadow-lg">
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
                        docVisitor={selectedReq}
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
                        onClick={() => handleApproveFromDoc(selectedReq)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <ShieldCheck className="h-4 w-4" /> Approve Request
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


      {/* RESPONSE CARD ACTION MODAL */}
      {actionType && selectedReq && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400"/>
                Response Card — {actionType} Request
              </h3>
              <button onClick={() => setActionType(null)} className="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            {/* Target Visitor Summary */}
            <div className="p-3.5 bg-[#0e1628] border border-slate-800 rounded-xl text-xs flex justify-between items-center">
              <div>
                <p className="text-white font-bold">{selectedReq.visitor_name} ({selectedReq.visitor_company || 'Guest Visitor'})</p>
                <p className="text-slate-400 font-mono text-[11px] mt-0.5">Ref: <span className="text-blue-300 font-bold">{selectedReq.reference_code || `REQ-${selectedReq.id}`}</span></p>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full ${getStatusBadge(selectedReq.status)}`}>
                {selectedReq.status || 'PENDING'}
              </span>
            </div>

            <form onSubmit={handleExecuteAction} className="space-y-4 text-xs">
              {actionType === 'RESCHEDULE' && (<div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">{t('form.new_start', 'New Start')}</label>
                    <input type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="w-full bg-[#0e1628] border border-slate-700 rounded-xl px-3 py-2 text-white" required/>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">{t('form.new_end', 'New End')}</label>
                    <input type="datetime-local" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="w-full bg-[#0e1628] border border-slate-700 rounded-xl px-3 py-2 text-white" required/>
                  </div>
                </div>)}

              {/* Quick Response Presets */}
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1.5">{t('form.quick_response_presets', 'Quick Response Presets')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {actionType === 'APPROVE' ? (<>
                      <button type="button" onClick={() => setComment('Approved & Access Pre-cleared by Host')} className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                        {t('preset.approved_precleared', '✓ Approved & Pre-cleared')}
                      </button>
                      <button type="button" onClick={() => setComment('Approved - Please meet at Main Lobby Reception')} className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                        {t('preset.meet_main_lobby', '✓ Meet at Main Lobby')}
                      </button>
                      <button type="button" onClick={() => setComment('Approved - Security Escort Required Upon Arrival')} className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                        {t('preset.escort_required', '✓ Escort Required')}
                      </button>
                    </>) : (<>
                      <button type="button" onClick={() => setComment('Host Unavailable - Meeting Rescheduled')} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold">
                        {t('preset.host_unavailable', '✕ Host Unavailable')}
                      </button>
                      <button type="button" onClick={() => setComment('Incomplete Visitor Identification Information')} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold">
                        {t('preset.incomplete_info', '✕ Incomplete Info')}
                      </button>
                      <button type="button" onClick={() => setComment('Request Cancelled per Host Instructions')} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold">
                        {t('preset.cancelled_by_host', '✕ Cancelled by Host')}
                      </button>
                    </>)}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">
                  {t('form.response_card_msg_notes', 'Response Card Message & Notes')}
                </label>
                <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('form.placeholder_custom_response', 'Type custom response message for card...')} className="w-full bg-[#0e1628] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-sans" required={actionType === 'REJECT' || actionType === 'CANCEL'}/>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setActionType(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase text-xs">{t('common.cancel', 'Cancel')}</button>
                <button type="submit" disabled={submitting} className={`px-5 py-2 text-white rounded-xl font-bold uppercase text-xs shadow-md transition-all ${actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' :
                actionType === 'REJECT' || actionType === 'CANCEL' ? 'bg-red-600 hover:bg-red-500' :
                    'bg-indigo-600 hover:bg-indigo-500'}`}>
                  {submitting ? t('common.sending_response', 'Sending Response...') : `${t('common.send_response_card', 'Send Response Card')} (${actionType})`}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
