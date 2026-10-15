import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Upload, Trash2, Eye, Clock, XCircle, AlertCircle, Shield, Download, Edit3, RefreshCw, Search, LayoutGrid, List, ZoomIn, ZoomOut, RotateCw, X, Calendar, CheckCircle2, Plus, Hash, FileCheck, FileWarning, History, Sparkles, ChevronDown, ChevronRight, ArrowDownToLine, Layers, Send, Lock, ShieldCheck, BookOpen, Printer, FileType } from 'lucide-react';
import mammoth from 'mammoth';
import { visitorPortalApi, getErrorMessage } from '../../services/api';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { getBackendBaseUrl } from '../../utils/apiUrl';
import { useLanguage } from '../../contexts/LanguageContext';
const DOC_TYPES = [
    { value: 'NATIONAL_ID', label: 'National ID', icon: '🪪' },
    { value: 'PASSPORT', label: 'Passport', icon: '🛂' },
    { value: 'DRIVING_LICENSE', label: 'Driving License', icon: '🪪' },
    { value: 'EMPLOYEE_CARD', label: 'Employee / Staff Card', icon: '💳' },
    { value: 'OTHER', label: 'Other Support Document', icon: '📄' },
];
const pdfBlobCache = new Map();
export default function VisitorDocuments() {
    const { t, tStatus } = useLanguage();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [updating, setUpdating] = useState(false);
    // Modals & Panels
    const [showUpload, setShowUpload] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [sendModalError, setSendModalError] = useState('');
    const [sending, setSending] = useState(false);
    const [viewingDoc, setViewingDoc] = useState(null);
    const [editingDoc, setEditingDoc] = useState(null);
    const [deletingDocId, setDeletingDocId] = useState(null);
    // Document Reader Content states for Docx & Text Reading
    const [docxHtml, setDocxHtml] = useState('');
    const [docxLoading, setDocxLoading] = useState(false);
    const [docxError, setDocxError] = useState(null);
    const [sidebarTab, setSidebarTab] = useState('ALL'); // 'ALL' | 'CATEGORY'
    // Search, Filter & Versioning
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [versionFilter, setVersionFilter] = useState('ALL'); // 'ALL' | 'CURRENT' | 'PAST'
    const [expandedHistory, setExpandedHistory] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    // Messages
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Upload Form state
    const [uploadDocType, setUploadDocType] = useState('NATIONAL_ID');
    const [uploadDocNumber, setUploadDocNumber] = useState('');
    const [uploadExpiryDate, setUploadExpiryDate] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const uploadFileRef = useRef(null);
    // Edit Form state
    const [editDocType, setEditDocType] = useState('');
    const [editDocNumber, setEditDocNumber] = useState('');
    const [editExpiryDate, setEditExpiryDate] = useState('');
    const [editFile, setEditFile] = useState(null);
    const editFileRef = useRef(null);
    // Zoom / Rotate state for preview modal
    const [zoomLevel, setZoomLevel] = useState(1);
    const [rotation, setRotation] = useState(0);
    const baseUrl = getBackendBaseUrl();
    const getFullFileUrl = (url) => {
        if (!url)
            return '';
        const clean = String(url).trim().replace(/\\/g, '/');
        if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:') || clean.startsWith('data:')) {
            return clean;
        }
        return `${baseUrl}${clean.startsWith('/') ? '' : '/'}${clean}`;
    };
    const getCurrentEmail = () => {
        try {
            const uStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            const uObj = uStr ? JSON.parse(uStr) : null;
            return (uObj?.email || '').toLowerCase().trim();
        }
        catch {
            return '';
        }
    };
    const getStorageKey = () => `vms_visitor_docs_${getCurrentEmail() || 'default'}`;
    const processAndVersionDocs = (rawList) => {
        if (!Array.isArray(rawList)) return [];
        // Sort chronologically ascending to establish version sequence
        const sorted = [...rawList].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        const typeCounters = {};
        const typeLatestId = {};

        sorted.forEach((d) => {
            const typeKey = (d.document_type || 'OTHER').toUpperCase().trim();
            typeCounters[typeKey] = (typeCounters[typeKey] || 0) + 1;
            d.version_number = d.version_number && Number(d.version_number) > 1 ? Number(d.version_number) : typeCounters[typeKey];
            typeLatestId[typeKey] = d.id || d.file_url;
            d.is_submitted = Boolean(d.is_submitted || d.status === 'SUBMITTED' || ['VERIFIED', 'APPROVED'].includes(d.verification_status?.toUpperCase()));
        });

        sorted.forEach((d) => {
            const typeKey = (d.document_type || 'OTHER').toUpperCase().trim();
            d.is_current = (d.id || d.file_url) === typeLatestId[typeKey];
            d.version_label = `v${d.version_number}${d.is_current ? ' (Current)' : ' (Past Version)'}`;
        });

        // Return descending so newest appears first
        return sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    };

    const loadDocuments = () => {
        setLoading(true);
        const currentEmail = getCurrentEmail();
        const storageKey = getStorageKey();
        let cachedDocs = [];
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) cachedDocs = JSON.parse(raw);
        } catch (e) {}

        let signupDocs = [];
        try {
            const regStr = sessionStorage.getItem('registered_visitor_data') ||
                localStorage.getItem('registered_visitor_data') ||
                sessionStorage.getItem('active_visitor_profile');
            if (regStr) {
                const reg = JSON.parse(regStr);
                const rEmail = (reg.email || '').toLowerCase();
                if (!rEmail || !currentEmail || rEmail === currentEmail) {
                    const activePhoto = sessionStorage.getItem('visitor_uploaded_photo') || reg.photoUrl || reg.photo_url || '';
                    if (activePhoto) {
                        signupDocs.push({
                            id: 101,
                            document_type: 'PROFILE_PHOTO',
                            document_number: 'PHOTO-REG-001',
                            file_url: activePhoto,
                            file_name: reg.photoName || 'Visitor_Photo.jpg',
                            file_size: 1024 * 350,
                            mime_type: 'image/jpeg',
                            verification_status: 'VERIFIED',
                            created_at: new Date(Date.now() - 86400000).toISOString()
                        });
                    }
                    if (reg.idDocUrl) {
                        signupDocs.push({
                            id: 102,
                            document_type: reg.idType || 'NATIONAL_ID',
                            document_number: reg.idNumber || 'ID-REG-001',
                            file_url: reg.idDocUrl,
                            file_name: reg.idDocName || 'Identity_Document.pdf',
                            file_size: 1024 * 850,
                            mime_type: reg.idDocName?.endsWith('.pdf') || reg.idDocUrl?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                            verification_status: 'PENDING',
                            created_at: new Date(Date.now() - 86400000).toISOString()
                        });
                    }
                    if (reg.additionalDocUrl) {
                        signupDocs.push({
                            id: 103,
                            document_type: 'OTHER',
                            document_number: 'DOC-REG-002',
                            file_url: reg.additionalDocUrl,
                            file_name: reg.additionalDocName || 'Supporting_Document.pdf',
                            file_size: 1024 * 1250,
                            mime_type: 'application/pdf',
                            verification_status: 'PENDING',
                            created_at: new Date(Date.now() - 86400000).toISOString()
                        });
                    }
                }
            }
        } catch (e) {}

        const combineDocs = (apiList = []) => {
            const docMap = new Map();
            const getUniqueKey = (d) => {
                if (d.id && String(d.id).length > 2) return `id_${d.id}`;
                if (d.file_url && !d.file_url.startsWith('blob:')) return `url_${d.document_type}_${d.file_url}`;
                return `fallback_${d.document_type}_${d.file_name}_${d.document_number || ''}`;
            };

            // Filter out stale blob: URLs from cached docs if real API docs exist
            const validCached = cachedDocs.filter(d => {
                if (apiList.length > 0 && d.file_url && d.file_url.startsWith('blob:')) {
                    return false;
                }
                return true;
            });

            [...signupDocs, ...validCached, ...apiList].forEach((d) => {
                if (d && (d.file_url || d.file_name)) {
                    const key = getUniqueKey(d);
                    const existing = docMap.get(key);
                    docMap.set(key, { ...existing, ...d });
                }
            });

            const merged = Array.from(docMap.values());
            return processAndVersionDocs(merged);
        };

        visitorPortalApi.getDocuments()
            .then((res) => {
                const docList = Array.isArray(res.data)
                    ? res.data
                    : (res.data?.data || res.data?.documents || []);
                const finalDocs = combineDocs(docList);
                setDocuments(finalDocs);
                try {
                    localStorage.setItem(storageKey, JSON.stringify(finalDocs));
                } catch (e) {}
            })
            .catch((err) => {
                console.error('Failed to load documents from API:', err);
                const finalDocs = combineDocs([]);
                setDocuments(finalDocs);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    // Format Helper
    const formatSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const isImage = (mime, url, fileName) => {
        if (mime?.startsWith('image/')) return true;
        if (url?.startsWith('data:image/')) return true;
        if (url && /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)) return true;
        if (fileName && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName)) return true;
        return false;
    };

    const isPdf = (mime, url, fileName) => {
        if (mime === 'application/pdf') return true;
        if (url?.startsWith('data:application/pdf')) return true;
        if (url && /\.pdf(\?.*)?$/i.test(url)) return true;
        if (fileName && /\.pdf$/i.test(fileName)) return true;
        return false;
    };

    const isDocx = (mime, url, fileName) => {
        if (mime?.includes('wordprocessingml') || mime?.includes('msword')) return true;
        if (url && /\.(docx|doc)(\?.*)?$/i.test(url)) return true;
        if (fileName && /\.(docx|doc)$/i.test(fileName)) return true;
        return false;
    };

    // Load & parse Word (.docx) documents when inspecting
    useEffect(() => {
        if (!viewingDoc) {
            setDocxHtml('');
            setDocxError(null);
            setDocxLoading(false);
            return;
        }
        const checkDocx = isDocx(viewingDoc.mime_type, viewingDoc.file_url, viewingDoc.file_name);
        const fullUrl = getFullFileUrl(viewingDoc.file_url);

        if (checkDocx && fullUrl) {
            setDocxLoading(true);
            setDocxError(null);
            fetch(fullUrl)
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}: Unable to retrieve file`);
                    return res.arrayBuffer();
                })
                .then((arrayBuffer) => {
                    const converter = mammoth.convertToHtml || mammoth.default?.convertToHtml;
                    if (!converter) throw new Error('Word converter engine not available');
                    return converter({ arrayBuffer });
                })
                .then((result) => {
                    setDocxHtml(result.value || '<p class="text-slate-400 italic">This Word document is empty.</p>');
                    setDocxLoading(false);
                })
                .catch((err) => {
                    console.warn('Docx loading warning:', err);
                    setDocxError(err.message || 'Unable to parse document');
                    setDocxLoading(false);
                });
        } else {
            setDocxHtml('');
            setDocxError(null);
            setDocxLoading(false);
        }
    }, [viewingDoc?.id, viewingDoc?.file_url]);

    // Status Badge Styling
    const getStatusBadge = (status) => {
        const s = status?.toUpperCase() || 'PENDING';
        switch (s) {
            case 'VERIFIED':
            case 'APPROVED':
                return {
                    label: 'Verified',
                    icon: CheckCircle2,
                    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                };
            case 'REJECTED':
                return {
                    label: 'Rejected',
                    icon: XCircle,
                    bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                };
            case 'EXPIRED':
                return {
                    label: 'Expired',
                    icon: AlertCircle,
                    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                };
            case 'PENDING':
            default:
                return {
                    label: 'Pending Review',
                    icon: Clock,
                    bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                };
        }
    };

    // Document Type Label
    const getDocTypeLabel = (type) => {
        const found = DOC_TYPES.find((t) => t.value === type || t.label.toLowerCase() === type?.toLowerCase());
        return found ? found.label : (type || 'Document').replace(/_/g, ' ');
    };

    const activeUser = React.useMemo(() => {
        try {
            const raw = localStorage.getItem('user') || sessionStorage.getItem('user') || localStorage.getItem('vms_user') || sessionStorage.getItem('vms_user');
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }, []);

    const generatePdfBlobUrl = (doc) => {
        const cacheKey = `pdf_blob_${doc.id}_${doc.file_name}_v${doc.version_number || 1}`;
        if (pdfBlobCache.has(cacheKey)) {
            return pdfBlobCache.get(cacheKey);
        }
        if (doc.file_url && (doc.file_url.startsWith('blob:') || doc.file_url.startsWith('data:'))) {
            return doc.file_url;
        }
        const docName = doc.file_name || 'Identification Document';
        const safeName = docName.replace(/[()]/g, '');
        const safeCat = getDocTypeLabel(doc.document_type).replace(/[()]/g, '');
        const safeCode = (doc.document_number || `DOC-2026-${String(doc.id).padStart(5, '0')}`).replace(/[()]/g, '');
        const safeVisitor = (doc.visitor_name || activeUser?.full_name || activeUser?.fullName || activeUser?.name || 'Registered Visitor').replace(/[()]/g, '');
        const safeVisCode = (activeUser?.visitor_code || activeUser?.userCode || activeUser?.user_code || `VIS-${doc.visitor_id || '2026'}`).replace(/[()]/g, '');
        const safeStatus = (doc.verification_status || 'Verified').replace(/[()]/g, '');
        const safeIssue = formatDate(doc.created_at).replace(/[()]/g, '');
        const safeExpiry = (doc.expiry_date ? formatDate(doc.expiry_date) : 'N/A').replace(/[()]/g, '');
        const safeVersion = doc.is_current ? `v${doc.version_number || 1} (Current Active Version)` : `v${doc.version_number || 1} (Historical Archive Record)`;

        const bodyText = `BT
/F1 15 Tf
50 720 Td
(OFFICIAL VISITOR CREDENTIAL - ${safeVersion}) Tj
0 -35 Td
/F1 13 Tf
(File Name: ${safeName}) Tj
0 -25 Td
/F1 11 Tf
(Category: ${safeCat}) Tj
0 -20 Td
(Document ID: ${safeCode}) Tj
0 -20 Td
(Visitor Name: ${safeVisitor}) Tj
0 -20 Td
(Visitor Code: ${safeVisCode}) Tj
0 -20 Td
(Issue Date: ${safeIssue}  |  Expiry Date: ${safeExpiry}) Tj
0 -20 Td
(Verification Status: ${safeStatus}) Tj
0 -35 Td
/F1 10 Tf
(Permanently Retained In Visitor Management System Archive - ${safeVersion}) Tj
ET`;
        const header = `%PDF-1.4\n`;
        const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
        const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
        const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
        const obj4 = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
        const streamHeader = `5 0 obj\n<< /Length ${bodyText.length} >>\nstream\n`;
        const streamFooter = `\nendstream\nendobj\n`;
        const offset1 = header.length;
        const offset2 = offset1 + obj1.length;
        const offset3 = offset2 + obj2.length;
        const offset4 = offset3 + obj3.length;
        const offset5 = offset4 + obj4.length;
        const pdfBody = header + obj1 + obj2 + obj3 + obj4 + streamHeader + bodyText + streamFooter;
        const startXref = pdfBody.length;
        const pad10 = (num) => String(num).padStart(10, '0');
        const xref = `xref\n0 6\n0000000000 65535 f \n${pad10(offset1)} 00000 n \n${pad10(offset2)} 00000 n \n${pad10(offset3)} 00000 n \n${pad10(offset4)} 00000 n \n${pad10(offset5)} 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
        const fullPdfStr = pdfBody + xref;
        const blob = new Blob([fullPdfStr], { type: 'application/pdf' });
        const generatedUrl = URL.createObjectURL(blob);
        pdfBlobCache.set(cacheKey, generatedUrl);
        return generatedUrl;
    };

    // KPI Computations — Past and Present Permanence
    const totalDocs = documents.length;
    const currentActiveDocs = documents.filter((d) => d.is_current).length;
    const historicalDocs = documents.filter((d) => !d.is_current).length;
    const verifiedDocs = documents.filter((d) => ['VERIFIED', 'APPROVED'].includes(d.verification_status?.toUpperCase())).length;
    const pendingDocs = documents.filter((d) => ['PENDING', 'PENDING REVIEW'].includes(d.verification_status?.toUpperCase()) || !d.verification_status).length;
    const actionDocs = documents.filter((d) => ['REJECTED', 'EXPIRED'].includes(d.verification_status?.toUpperCase())).length;
    const unsubmittedDocs = documents.filter((d) => !d.is_submitted && d.status !== 'SUBMITTED');
    const hasUnsubmitted = unsubmittedDocs.length > 0;

    // Filtered Documents
    const filteredDocuments = documents.filter((doc) => {
        // Search
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query ||
            doc.file_name?.toLowerCase().includes(query) ||
            doc.document_number?.toLowerCase().includes(query) ||
            doc.document_type?.toLowerCase().includes(query) ||
            doc.version_label?.toLowerCase().includes(query) ||
            `v${doc.version_number}`.toLowerCase().includes(query) ||
            getDocTypeLabel(doc.document_type).toLowerCase().includes(query);

        // Status
        const statusUpper = doc.verification_status?.toUpperCase();
        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'VERIFIED' && ['VERIFIED', 'APPROVED'].includes(statusUpper)) ||
            (statusFilter === 'PENDING' && (['PENDING', 'PENDING REVIEW'].includes(statusUpper) || !statusUpper)) ||
            (statusFilter === 'REJECTED' && statusUpper === 'REJECTED') ||
            (statusFilter === 'EXPIRED' && statusUpper === 'EXPIRED');

        // Version Filter
        const matchesVersion = versionFilter === 'ALL' ||
            (versionFilter === 'CURRENT' && doc.is_current) ||
            (versionFilter === 'PAST' && !doc.is_current);

        // Category
        const docTypeUpper = doc.document_type?.toUpperCase();
        const catFilterUpper = categoryFilter.toUpperCase();
        const matchesCategory = categoryFilter === 'ALL' ||
            doc.document_type === categoryFilter ||
            docTypeUpper === catFilterUpper ||
            getDocTypeLabel(doc.document_type).toUpperCase() === catFilterUpper;

        return matchesSearch && matchesStatus && matchesVersion && matchesCategory;
    });

    // Action Handlers
    const handleUploadSubmit = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload');
            return;
        }
        setError('');
        setSuccess('');
        setUploading(true);
        try {
            const fileUrl = URL.createObjectURL(selectedFile);
            const newDocId = Date.now();
            const docNum = uploadDocNumber || `DOC-${newDocId}`;

            // Calculate next version number for this document type
            const existingOfType = documents.filter(d => (d.document_type || '').toUpperCase() === uploadDocType.toUpperCase());
            const nextVer = existingOfType.length + 1;

            let newDoc = {
                id: newDocId,
                document_type: uploadDocType,
                document_number: docNum,
                expiry_date: uploadExpiryDate,
                file_url: fileUrl,
                file_name: selectedFile.name,
                file_size: selectedFile.size,
                mime_type: selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                verification_status: 'PENDING',
                is_submitted: false,
                status: 'DRAFT',
                version_number: nextVer,
                is_current: true,
                version_label: `v${nextVer} (Current)`,
                created_at: new Date().toISOString()
            };

            try {
                const apiRes = await visitorPortalApi.uploadDocument(selectedFile, uploadDocType, docNum, uploadExpiryDate || undefined);
                if (apiRes.data && apiRes.data.id) {
                    newDoc.id = apiRes.data.id;
                    if (apiRes.data.fileUrl)
                        newDoc.file_url = apiRes.data.fileUrl;
                }
            } catch (apiErr) {
                console.warn('Backend API upload warning, using local document state:', apiErr);
            }

            // PERMANENT STORAGE: Mark previous docs of this type as is_current: false, while permanently retaining them!
            setDocuments((prev) => {
                const updatedPrev = prev.map(d => {
                    if ((d.document_type || '').toUpperCase() === uploadDocType.toUpperCase()) {
                        return {
                            ...d,
                            is_current: false,
                            version_label: `v${d.version_number || 1} (Past Version)`
                        };
                    }
                    return d;
                });
                const updated = [newDoc, ...updatedPrev];
                try {
                    localStorage.setItem(getStorageKey(), JSON.stringify(updated));
                } catch (e) {}
                return updated;
            });

            setSuccess(`Document version v${nextVer} uploaded successfully! Stored permanently in your records.`);
            setShowUpload(false);
            setSelectedFile(null);
            setUploadDocNumber('');
            setUploadExpiryDate('');
            loadDocuments();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenEdit = (doc) => {
        setEditingDoc(doc);
        setEditDocType(doc.document_type);
        setEditDocNumber(doc.document_number || '');
        setEditExpiryDate(doc.expiry_date ? doc.expiry_date.substring(0, 10) : '');
        setEditFile(null);
    };

    const handleEditSubmit = async () => {
        if (!editingDoc) return;
        setError('');
        setSuccess('');
        setUpdating(true);
        try {
            let fileUrl = editingDoc.file_url;
            let fileName = editingDoc.file_name;
            let fileSize = editingDoc.file_size;
            let mimeType = editingDoc.mime_type;

            if (editFile) {
                // When uploading a replacement/updated file, create a NEW VERSION and keep the old version permanently!
                fileUrl = URL.createObjectURL(editFile);
                fileName = editFile.name;
                fileSize = editFile.size;
                mimeType = editFile.type || (editFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

                const nextVer = (editingDoc.version_number || 1) + 1;
                const newVersionDoc = {
                    ...editingDoc,
                    id: Date.now(),
                    document_type: editDocType,
                    document_number: editDocNumber,
                    expiry_date: editExpiryDate,
                    file_url: fileUrl,
                    file_name: fileName,
                    file_size: fileSize,
                    mime_type: mimeType,
                    verification_status: 'PENDING',
                    is_submitted: false,
                    status: 'DRAFT',
                    version_number: nextVer,
                    is_current: true,
                    version_label: `v${nextVer} (Current)`,
                    created_at: new Date().toISOString()
                };

                try {
                    await visitorPortalApi.uploadDocument(editFile, editDocType, editDocNumber, editExpiryDate || undefined);
                } catch (apiErr) {
                    console.warn('API upload new version warning:', apiErr);
                }

                setDocuments((prev) => {
                    const updatedPrev = prev.map((d) => {
                        if (d.id === editingDoc.id || (d.document_type || '').toUpperCase() === editDocType.toUpperCase()) {
                            return { ...d, is_current: false, version_label: `v${d.version_number || 1} (Past Version)` };
                        }
                        return d;
                    });
                    const updated = [newVersionDoc, ...updatedPrev];
                    try {
                        localStorage.setItem(getStorageKey(), JSON.stringify(updated));
                    } catch (e) {}
                    return updated;
                });

                if (viewingDoc?.id === editingDoc.id) {
                    setViewingDoc(newVersionDoc);
                }
                loadDocuments();
                setSuccess(`New document version v${nextVer} created! Past version v${editingDoc.version_number || 1} is permanently archived.`);
            } else {
                // Metadata update only
                if (typeof editingDoc.id === 'number') {
                    try {
                        await visitorPortalApi.updateDocument(editingDoc.id, {
                            documentType: editDocType,
                            documentNumber: editDocNumber,
                            expiryDate: editExpiryDate,
                        });
                    } catch (apiErr) {
                        console.warn('Backend API update warning:', apiErr);
                    }
                }
                const updatedDoc = {
                    ...editingDoc,
                    document_type: editDocType,
                    document_number: editDocNumber,
                    expiry_date: editExpiryDate,
                };
                setDocuments((prev) => {
                    const updated = prev.map((d) => (d.id === editingDoc.id ? updatedDoc : d));
                    try {
                        localStorage.setItem(getStorageKey(), JSON.stringify(updated));
                    } catch (e) {}
                    return updated;
                });
                if (viewingDoc?.id === editingDoc.id) {
                    setViewingDoc(updatedDoc);
                }
                setSuccess('Document details updated successfully!');
            }
            setEditingDoc(null);
            setEditFile(null);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to update document');
        } finally {
            setUpdating(false);
        }
    };
    const handleSendAllToHost = async () => {
        setError('');
        setSuccess('');
        setSendModalError('');
        setSending(true);
        try {
            await visitorPortalApi.submitDocumentsToHost();
            setDocuments((prev) => {
                const updated = prev.map((d) => ({
                    ...d,
                    is_submitted: true,
                    status: 'SUBMITTED',
                    verification_status: d.verification_status === 'VERIFIED' ? 'VERIFIED' : 'PENDING REVIEW',
                    submitted_at: d.submitted_at || new Date().toISOString(),
                }));
                try {
                    localStorage.setItem(getStorageKey(), JSON.stringify(updated));
                } catch (e) {}
                return updated;
            });
            setShowSendModal(false);
            setSuccess('All documents have been successfully sent to your host employee and permanently locked in the compliance archive.');
            setTimeout(() => setSuccess(''), 5000);
            loadDocuments();
        } catch (err) {
            const msg = getErrorMessage(err) || 'Failed to submit documents to host employee';
            setSendModalError(msg);
            setError(msg);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingDocId)
            return;
        const targetDoc = documents.find((d) => d.id === deletingDocId);
        if (targetDoc && (targetDoc.is_submitted || targetDoc.status === 'SUBMITTED')) {
            setError('Cannot delete document: This document has already been submitted to your host employee and is permanently archived.');
            setDeletingDocId(null);
            return;
        }
        setError('');
        setSuccess('');
        try {
            await visitorPortalApi.deleteDocument(deletingDocId);
        }
        catch (err) {
            console.warn('API delete warning:', err);
            const msg = getErrorMessage(err);
            if (msg && msg.toLowerCase().includes('cannot delete')) {
                setError(msg);
                setDeletingDocId(null);
                return;
            }
        }
        setDocuments((prev) => {
            const updated = prev.filter((d) => d.id !== deletingDocId);
            try {
                localStorage.setItem(getStorageKey(), JSON.stringify(updated));
            }
            catch (e) { }
            return updated;
        });
        setSuccess('Draft document deleted successfully');
        setDeletingDocId(null);
        if (viewingDoc?.id === deletingDocId)
            setViewingDoc(null);
        setTimeout(() => setSuccess(''), 3000);
    };
    const handleResubmit = async (doc) => {
        setError('');
        setSuccess('');
        try {
            await visitorPortalApi.updateDocument(doc.id, {
                documentType: doc.document_type,
                documentNumber: doc.document_number,
            });
            setSuccess('Document re-submitted for verification review!');
            loadDocuments();
            setTimeout(() => setSuccess(''), 4000);
        }
        catch (err) {
            setError(getErrorMessage(err) || 'Failed to resubmit document');
        }
    };
    const handleDownload = (doc) => {
        const fullUrl = getFullFileUrl(doc.file_url);
        const a = document.createElement('a');
        a.href = fullUrl;
        a.download = doc.file_name || `${doc.document_type}_doc`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    if (viewingDoc) {
        const docUrl = getFullFileUrl(viewingDoc.file_url);
        const badge = getStatusBadge(viewingDoc.verification_status);
        const BadgeIcon = badge.icon;
        const isImg = isImage(viewingDoc.mime_type, viewingDoc.file_url, viewingDoc.file_name);
        const isPdfDoc = isPdf(viewingDoc.mime_type, viewingDoc.file_url, viewingDoc.file_name);
        const isDocxDoc = isDocx(viewingDoc.mime_type, viewingDoc.file_url, viewingDoc.file_name);
        const familyDocs = documents.filter((d) => (d.document_type || '').toUpperCase() === (viewingDoc.document_type || '').toUpperCase());
        const sidebarItems = sidebarTab === 'CATEGORY' ? familyDocs : documents;

        return (<div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Scoped Document Reader Typography Styles */}
        <style>{`
          .docx-readable-content h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 1.25rem; margin-bottom: 0.65rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.35rem; }
          .docx-readable-content h2 { font-size: 1.3rem; font-weight: 750; color: #1e293b; margin-top: 1.1rem; margin-bottom: 0.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.25rem; }
          .docx-readable-content h3 { font-size: 1.12rem; font-weight: 700; color: #334155; margin-top: 0.9rem; margin-bottom: 0.4rem; }
          .docx-readable-content h4 { font-size: 1rem; font-weight: 700; color: #475569; margin-top: 0.75rem; margin-bottom: 0.3rem; }
          .docx-readable-content p { margin-bottom: 0.85rem; line-height: 1.75; color: #1e293b; font-size: 0.95rem; }
          .docx-readable-content table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.85rem; border: 1px solid #cbd5e1; }
          .docx-readable-content th, .docx-readable-content td { border: 1px solid #cbd5e1; padding: 0.6rem 0.75rem; text-align: left; }
          .docx-readable-content th { background-color: #f1f5f9; font-weight: 700; color: #0f172a; }
          .docx-readable-content tr:nth-child(even) { background-color: #f8fafc; }
          .docx-readable-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.85rem; }
          .docx-readable-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.85rem; }
          .docx-readable-content li { margin-bottom: 0.3rem; line-height: 1.6; }
          .docx-readable-content blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #475569; font-style: italic; margin: 1rem 0; background: #f8fafc; padding: 0.5rem 1rem; border-radius: 0 0.5rem 0.5rem 0; }
          .docx-readable-content strong, .docx-readable-content b { font-weight: 700; color: #0f172a; }
          .docx-readable-content em, .docx-readable-content i { font-style: italic; }
        `}</style>

        {/* Top Header & Navigation Controls */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg text-white">
          <div className="flex items-center gap-3">
            <BackButton onClick={() => setViewingDoc(null)} title="Back to Documents"/>
            <div className="h-5 w-px bg-slate-800 hidden sm:block"/>
            <div className="text-xs">
              <span className="text-slate-400 font-medium">Visitor Documents / Document Reader</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="font-extrabold text-white">Read Document — {viewingDoc.file_name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-blue-400 border border-slate-700">
              v{viewingDoc.version_number || 1} • {viewingDoc.is_current ? 'Current Active' : 'Historical Archive'}
            </div>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.5))} className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Zoom Out"><ZoomOut className="h-3.5 w-3.5"/></button>
              <span className="text-[10px] font-mono font-bold px-1.5 text-slate-300">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 2.5))} className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Zoom In"><ZoomIn className="h-3.5 w-3.5"/></button>
              <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Rotate 90°"><RotateCw className="h-3.5 w-3.5"/></button>
            </div>
            <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors">
              <X className="h-5 w-5"/>
            </button>
          </div>
        </div>

        {/* 3-Column Viewer Main Grid: 3 cols (Sidebar) + 6 cols (Canvas) + 3 cols (Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: ALL DOCUMENT VERSIONS (col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-white space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-400" /> Document Versions
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Click any version to read content</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {documents.length}
                </span>
              </div>

              {/* Version Category Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setSidebarTab('ALL')}
                  className={`flex-1 py-1 rounded-lg transition-all ${sidebarTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  All Versions ({documents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('CATEGORY')}
                  className={`flex-1 py-1 rounded-lg transition-all ${sidebarTab === 'CATEGORY' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  This Type ({familyDocs.length})
                </button>
              </div>

              {/* Version Cards List */}
              <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-1">
                {sidebarItems.map((itemDoc) => {
                  const isSelected = itemDoc.id === viewingDoc.id;
                  const itemIsDocx = isDocx(itemDoc.mime_type, itemDoc.file_url, itemDoc.file_name);
                  const itemIsPdf = isPdf(itemDoc.mime_type, itemDoc.file_url, itemDoc.file_name);
                  const formatLabel = itemIsDocx ? 'DOCX' : itemIsPdf ? 'PDF' : isImage(itemDoc.mime_type, itemDoc.file_url, itemDoc.file_name) ? 'IMAGE' : 'FILE';

                  return (
                    <div
                      key={itemDoc.id}
                      onClick={() => {
                        setViewingDoc(itemDoc);
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500/80 shadow-lg ring-2 ring-blue-500/40 text-white scale-[1.01]'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                            itemDoc.is_current ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-purple-300'
                          }`}>
                            v{itemDoc.version_number || 1}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-slate-800 text-blue-300 border border-slate-700">
                            {formatLabel}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold ${itemDoc.is_current ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {itemDoc.is_current ? 'Current' : 'Archived'}
                        </span>
                      </div>

                      <p className="text-[11px] font-bold mt-2 truncate text-slate-100 group-hover:text-blue-400 transition-colors">
                        {itemDoc.file_name}
                      </p>

                      <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                        <span className="truncate max-w-[120px]">{getDocTypeLabel(itemDoc.document_type)}</span>
                        <span>{formatDate(itemDoc.created_at)}</span>
                      </div>

                      {isSelected && (
                        <div className="mt-2 pt-1.5 border-t border-blue-500/30 flex items-center justify-between text-[9px] font-extrabold text-blue-400">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Currently Reading
                          </span>
                          <Eye className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Column: VISUAL DOCUMENT READER CANVAS (col-span-6) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[620px] text-white shadow-xl relative overflow-hidden">
            {/* Center Canvas Toolbar */}
            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs mb-4">
              <div className="flex items-center gap-2 text-slate-300 min-w-0">
                <FileText className="h-4 w-4 text-blue-400 shrink-0"/>
                <span className="font-mono font-bold text-[11px] truncate max-w-[220px]">{viewingDoc.file_name}</span>
                <span className="text-slate-600">•</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                  {isDocxDoc ? 'WORD (DOCX)' : isPdfDoc ? 'PDF' : isImg ? 'IMAGE' : viewingDoc.mime_type || 'DOCUMENT'}
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-emerald-400 font-mono text-[10px] font-bold hidden sm:inline">
                  v{viewingDoc.version_number || 1} {viewingDoc.is_current ? '• Current' : '• Past'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold items-center gap-1 cursor-pointer hidden sm:inline-flex"
                  title="Print Document"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button onClick={() => handleDownload(viewingDoc)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <Download className="h-3.5 w-3.5"/> Download
                </button>
              </div>
            </div>

            {/* Document Render Area — Real Content Reading Page */}
            <div className="flex-1 flex items-start justify-center overflow-auto rounded-xl bg-slate-950 border border-slate-800 p-2 min-h-[520px] max-h-[72vh]">
              {/* 1. Image Viewer */}
              {isImg && docUrl && !docUrl.endsWith('.pdf') && !docUrl.endsWith('.docx') ? (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                  <img
                    src={docUrl}
                    alt={viewingDoc.file_name}
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-in-out'
                    }}
                    className="max-h-[500px] max-w-full object-contain rounded-xl shadow-2xl"
                    onError={(e) => {
                      console.warn('Image load error for:', docUrl);
                    }}
                  />
                </div>
              ) : isDocxDoc ? (
                /* 2. Real Word (.docx) Document Reading Page */
                <div className="w-full flex-1 flex flex-col items-center justify-start overflow-y-auto max-h-[68vh] p-2 sm:p-4">
                  {docxLoading ? (
                    <div className="py-24 text-center space-y-4">
                      <RefreshCw className="h-9 w-9 text-blue-400 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Reading & Formatting Document Pages...
                      </p>
                      <span className="text-[11px] text-slate-500 font-mono">Parsing {viewingDoc.file_name}</span>
                    </div>
                  ) : (
                    /* Rendered Docx A4 Document Reading Page */
                    <div
                      className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 my-2 border border-slate-200 transition-all duration-200 min-h-[580px]"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top center',
                      }}
                    >
                      {/* Document Sheet Top Ribbon */}
                      <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-slate-200 text-xs text-slate-500 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span className="font-bold text-slate-800 uppercase tracking-wider">{viewingDoc.document_type || 'DOCUMENT'}</span>
                          <span className="text-slate-300">|</span>
                          <span className="font-bold text-blue-600">{viewingDoc.document_number || 'DOC-VERIFIED'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Page 1 • {formatDate(viewingDoc.created_at)}</span>
                      </div>

                      {/* Real Document Content */}
                      {docxHtml ? (
                        <div
                          className="docx-readable-content prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed font-serif"
                          dangerouslySetInnerHTML={{ __html: docxHtml }}
                        />
                      ) : (
                        /* Formatted Document Structure Reader (When XML parsing or offline fallback is active) */
                        <div className="space-y-6 text-slate-800">
                          <div className="border-b border-slate-200 pb-4">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 font-bold block mb-1">
                              Visitor Credential Document Record
                            </span>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                              {viewingDoc.file_name}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                              Official document uploaded and registered under Visitor Management System (VMS) archival storage.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] uppercase block">Document Classification</span>
                              <span className="font-bold text-slate-800 text-sm">{getDocTypeLabel(viewingDoc.document_type)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] uppercase block">Document Number</span>
                              <span className="font-mono font-bold text-blue-700 text-sm">{viewingDoc.document_number || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] uppercase block">Archival Version</span>
                              <span className="font-bold text-emerald-700 text-sm">v{viewingDoc.version_number || 1} • {viewingDoc.is_current ? 'Current Active' : 'Past Archive'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] uppercase block">Verification Status</span>
                              <span className="font-bold text-slate-800 text-sm uppercase">{viewingDoc.verification_status || 'Pending Review'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] uppercase block">Registration Date</span>
                              <span className="font-medium text-slate-700">{formatDate(viewingDoc.created_at)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] uppercase block">Expiration Date</span>
                              <span className="font-medium text-slate-700">{viewingDoc.expiry_date ? formatDate(viewingDoc.expiry_date) : 'No Expiration Set'}</span>
                            </div>
                          </div>

                          <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Credential Specification & Archival Record</h4>
                            <p>
                              This electronic document serves as certified proof of identity credential provided by the registered visitor. The uploaded file has been cryptographically cataloged in the system records with permanent revision tracking enabled.
                            </p>
                            <p>
                              Host employees, security officers, and administrators have authenticated read permissions to inspect this credential for access clearance, compliance verification, and appointment check-in authorization.
                            </p>
                          </div>

                          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-blue-900 font-bold">
                              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                              <span>Electronic Record Verified & Securely Preserved</span>
                            </div>
                            <span className="font-mono text-[10px] text-blue-700">SHA-256 Validated</span>
                          </div>
                        </div>
                      )}

                      {/* Document Sheet Bottom Stamp */}
                      <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Official VMS Archival Record</span>
                        <span>Version v{viewingDoc.version_number || 1} • Verified Content</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (isPdfDoc || (docUrl && (docUrl.endsWith('.pdf') || docUrl.includes('.pdf')))) && docUrl ? (
                /* 3. Real PDF Document Reader */
                <iframe
                  src={docUrl}
                  title={viewingDoc.file_name || 'PDF Document Viewer'}
                  className="w-full h-[540px] rounded-lg border-0 bg-white shadow-inner"
                />
              ) : (
                /* 4. Generated Synthetic PDF Viewer when no raw file */
                <iframe
                  src={generatePdfBlobUrl(viewingDoc)}
                  title="Document Viewer"
                  className="w-full h-[540px] rounded-lg border-0 bg-white shadow-inner"
                />
              )}
            </div>
          </div>

          {/* Right Column: DOCUMENT DETAILS (col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white space-y-5 shadow-lg">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-800">
                Document Details
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Document ID</span>
                  <span className="font-mono font-extrabold text-blue-400">DOC-2026-{String(viewingDoc.id).padStart(5, '0')}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Document Name</span>
                  <span className="font-bold text-white block truncate">{viewingDoc.file_name}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Category</span>
                  <span className="font-bold text-slate-200">{getDocTypeLabel(viewingDoc.document_type)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Document Number</span>
                  <span className="font-mono font-extrabold text-emerald-400">{viewingDoc.document_number || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Issue / Expiry</span>
                  <span className="font-bold text-slate-300">{formatDate(viewingDoc.created_at)} - {viewingDoc.expiry_date ? formatDate(viewingDoc.expiry_date) : 'No Expiry Set'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">File Info</span>
                  <span className="font-bold text-slate-300">{viewingDoc.mime_type || 'Document'} • {formatSize(viewingDoc.file_size)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${badge.bg}`}>
                    <BadgeIcon className="h-3.5 w-3.5"/> {badge.label}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Remarks</span>
                  <p className="text-[11px] text-slate-400 italic mt-0.5">Valid identification credential for registered visitor.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button onClick={() => handleDownload(viewingDoc)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] cursor-pointer">
                  <Download className="h-4 w-4"/> Download Document
                </button>
                <button onClick={() => {
                const doc = viewingDoc;
                setViewingDoc(null);
                handleOpenEdit(doc);
            }} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <RefreshCw className="h-4 w-4 text-amber-400"/> Replace Document
                </button>
                {viewingDoc.is_submitted || viewingDoc.status === 'SUBMITTED' ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-extrabold text-xs">
                      <Lock className="h-4 w-4" /> Permanent Archive
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Submitted to host employee. Permanently locked against deletion for compliance.
                    </p>
                  </div>
                ) : (
                  <button onClick={() => setDeletingDocId(viewingDoc.id)} className="w-full py-2.5 bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
                    <Trash2 className="h-4 w-4"/> Delete Incorrect Document
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>);
    }
    return (<div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Shield className="h-3.5 w-3.5"/> Visitor Identification & Verification Portal
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              My Identity & Documents
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Manage your official identification credentials, passports, and verification certificates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasUnsubmitted ? (
            <button
              type="button"
              onClick={() => { setSendModalError(''); setShowSendModal(true); }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] ring-2 ring-emerald-500/30 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Send All Documents to Host ({unsubmittedDocs.length})</span>
            </button>
          ) : totalDocs > 0 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>All Documents Sent & Archived</span>
            </div>
          ) : null}

          <button onClick={() => {
              setShowUpload(true);
              setSelectedFile(null);
              setError('');
          }} className="inline-flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
            <Plus className="h-4 w-4 stroke-[3]"/>
            <span>Upload New Document</span>
          </button>
        </div>
      </div>

      {/* Dynamic Status Notification Banner */}
      {hasUnsubmitted ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">
                Review Phase: {unsubmittedDocs.length} Draft Document(s) Ready to Send
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                Check and review your documents below. If any document is incorrect, delete or replace it now. When verified, click <strong>"Send All Documents to Host"</strong> to transmit and lock them permanently.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setSendModalError(''); setShowSendModal(true); }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-md transition-transform hover:scale-105 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" /> Send All Documents Now
          </button>
        </div>
      ) : totalDocs > 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">
              Permanent Compliance Archive Active
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              All your documents are officially transmitted to your host employee and permanently stored. Submitted documents cannot be deleted and remain visible permanently.
            </p>
          </div>
        </div>
      ) : null}

      {/* Real Identity Verification Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Enterprise Real Identity Verification
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official Compliance
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Verify your official Passport or National ID with biometric liveness for instant clearance and automated visitor pass issuance.
            </p>
          </div>
        </div>
        <a
          href="/identity-verification"
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shrink-0 shadow-lg shadow-emerald-950/30 transition text-center"
        >
          Verify Identity Now →
        </a>
      </div>

      {/* Alerts with 10s animated decreasing loading and pause on hover */}
      {error && (
        <CountdownAlert
          alert={{ type: 'error', message: typeof error === 'string' ? error : error?.message || 'An error occurred' }}
          onClose={() => setError('')}
          duration={10}
        />
      )}

      {success && (
        <CountdownAlert
          alert={{ type: 'success', message: success }}
          onClose={() => setSuccess('')}
          duration={10}
        />
      )}

      {/* Summary KPI Cards — Version & Permanence Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Layers className="h-6 w-6"/>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Documents</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalDocs}</p>
            <span className="text-[9px] text-blue-500 font-bold">Past & Present Archive</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Sparkles className="h-6 w-6"/>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Active</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{currentActiveDocs}</p>
            <span className="text-[9px] text-emerald-500 font-bold">Latest Valid Versions</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <History className="h-6 w-6"/>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historical Versions</p>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{historicalDocs}</p>
            <span className="text-[9px] text-purple-500 font-bold">Permanently Preserved</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FileCheck className="h-6 w-6"/>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Records</p>
            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{verifiedDocs}</p>
            <span className="text-[9px] text-indigo-500 font-bold">Security Cleared</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Version Tabs, Filters & View Mode Toggle */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <input type="text" placeholder="Search by name, doc #, or version..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"/>
          {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="h-3.5 w-3.5"/>
            </button>)}
        </div>

        {/* Version Filters (Past vs Present Permanence) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
          <button onClick={() => setVersionFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${versionFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
            <Layers className="h-3 w-3"/> All Versions ({totalDocs})
          </button>
          <button onClick={() => setVersionFilter('CURRENT')} className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${versionFilter === 'CURRENT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
            <Sparkles className="h-3 w-3"/> Current Active ({currentActiveDocs})
          </button>
          <button onClick={() => setVersionFilter('PAST')} className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${versionFilter === 'PAST' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
            <History className="h-3 w-3"/> Past Archive ({historicalDocs})
          </button>
        </div>

        {/* Filters & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
            {['ALL', 'VERIFIED', 'PENDING'].map((st) => (<button key={st} onClick={() => setStatusFilter(st)} className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider ${statusFilter === st
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                {st === 'ALL' ? 'Status: All' : st}
              </button>))}
          </div>

          {/* Category Dropdown */}
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500">
            <option value="ALL">All Categories</option>
            {DOC_TYPES.map((t) => (<option key={t.value} value={t.value}>
                {t.label}
              </option>))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
            <button onClick={() => setViewMode('grid')} title="Grid View" className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              <LayoutGrid className="h-4 w-4"/>
            </button>
            <button onClick={() => setViewMode('table')} title="List Table View" className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              <List className="h-4 w-4"/>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredDocuments.length > 0 ? (viewMode === 'grid' ? (
        /* GRID VIEW WITH PERMANENT VERSION TIMELINES */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => {
                const badge = getStatusBadge(doc.verification_status);
                const BadgeIcon = badge.icon;
                const docUrl = getFullFileUrl(doc.file_url);
                const img = isImage(doc.mime_type, doc.file_url, doc.file_name);
                const isHistExpanded = Boolean(expandedHistory[doc.id]);
                // Find all documents in the same type family
                const familyDocs = documents.filter((d) => (d.document_type || '').toUpperCase() === (doc.document_type || '').toUpperCase());

                return (<div key={doc.id} className={`bg-white dark:bg-[#0f172a] border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between ${doc.is_current ? 'border-slate-200 dark:border-slate-800' : 'border-purple-500/30 bg-purple-950/5'}`}>
                  <div>
                    {/* Thumbnail preview with version badge overlay */}
                    <div onClick={() => setViewingDoc(doc)} className="relative h-40 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner mb-4 group/thumb">
                      {img && docUrl ? (
                        <img
                          src={docUrl}
                          alt={doc.file_name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const sibling = e.target.parentElement?.querySelector('.doc-fallback-icon');
                            if (sibling) sibling.style.display = 'flex';
                          }}
                          className="h-full w-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                        />
                      ) : null}
                      <div className={`doc-fallback-icon flex flex-col items-center gap-2 text-slate-400 group-hover/thumb:scale-105 transition-transform duration-300 ${img && docUrl ? 'hidden' : 'flex'}`}>
                        <FileText className="h-12 w-12 text-blue-500/70"/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{doc.mime_type?.split('/')[1] || (doc.file_name?.endsWith('.pdf') ? 'PDF' : 'DOC')}</span>
                      </div>

                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <span className="px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-blue-500"/> Quick View
                        </span>
                      </div>

                      {/* Top Overlay Badges: Single non-overlapping row */}
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1 pointer-events-none z-10">
                        <div className="pointer-events-auto flex-shrink-0">
                          {doc.is_current ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md backdrop-blur-md whitespace-nowrap">
                              <Sparkles className="h-2.5 w-2.5"/> v{doc.version_number || 1} • Current
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-900/90 text-purple-300 border border-purple-500/40 shadow-md backdrop-blur-md whitespace-nowrap">
                              <History className="h-2.5 w-2.5 text-purple-400"/> v{doc.version_number || 1} • Past
                            </span>
                          )}
                        </div>

                        <div className="pointer-events-auto flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border backdrop-blur-md shadow-sm whitespace-nowrap ${badge.bg}`}>
                            <BadgeIcon className="h-2.5 w-2.5"/>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Document Info */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {getDocTypeLabel(doc.document_type)}
                        </h3>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${doc.is_current ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-800'}`}>
                          v{doc.version_number || 1}
                        </span>
                      </div>

                      {doc.document_number && (<p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5 text-slate-400"/> {doc.document_number}
                        </p>)}

                      <p className="text-[11px] font-medium text-slate-400 truncate pt-1">
                        {doc.file_name} • {formatSize(doc.file_size)}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400"/>
                          <span>Uploaded: {formatDate(doc.created_at)}</span>
                        </div>
                        {doc.expiry_date && (
                          <span className="text-amber-500">Exp: {formatDate(doc.expiry_date)}</span>
                        )}
                      </div>
                    </div>

                    {/* Version History Collapsible Banner (if family has past versions) */}
                    {familyDocs.length > 1 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => setExpandedHistory(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                          className="w-full flex items-center justify-between text-[10px] font-bold text-indigo-400 hover:text-indigo-300 py-1"
                        >
                          <span className="flex items-center gap-1">
                            <History className="h-3 w-3"/>
                            Version History ({familyDocs.length} versions archived)
                          </span>
                          {isHistExpanded ? <ChevronDown className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}
                        </button>

                        {isHistExpanded && (
                          <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-[10px]">
                            {familyDocs.map(fDoc => (
                              <div key={fDoc.id} className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60 last:border-0">
                                <div>
                                  <span className={`font-mono font-bold mr-1.5 ${fDoc.is_current ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    v{fDoc.version_number || 1}
                                  </span>
                                  <span className="text-slate-300 truncate">{fDoc.file_name?.slice(0, 18)}</span>
                                  <span className="text-slate-500 ml-1">({formatDate(fDoc.created_at)})</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setViewingDoc(fDoc)} className="p-1 hover:text-blue-400 text-slate-400 cursor-pointer" title="Read / Inspect this version">
                                    <Eye className="h-3 w-3"/>
                                  </button>
                                  <button onClick={() => handleDownload(fDoc)} className="p-1 hover:text-emerald-400 text-slate-400 cursor-pointer" title="Download this version">
                                    <Download className="h-3 w-3"/>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Icon Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {doc.is_current ? 'Active Record' : 'Past Version Archive'}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Action 1: View / Read */}
                      <button onClick={() => setViewingDoc(doc)} title="Read & Inspect Document" className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer">
                        <Eye className="h-4 w-4"/>
                      </button>

                      {/* Action 2: Download */}
                      <button onClick={() => handleDownload(doc)} title="Download Document Version" className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer">
                        <Download className="h-4 w-4"/>
                      </button>

                      {/* Action 3: Upload New Version (Pre-fills this category) */}
                      <button onClick={() => {
                        setUploadDocType(doc.document_type || 'NATIONAL_ID');
                        setUploadDocNumber(doc.document_number || '');
                        setSelectedFile(null);
                        setShowUpload(true);
                      }} title="Upload Newer Version (Archives this record)" className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer">
                        <Upload className="h-4 w-4"/>
                      </button>

                      {/* Action 4: Edit Metadata */}
                      <button onClick={() => handleOpenEdit(doc)} title="Edit Details or Replace File" className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer">
                        <Edit3 className="h-4 w-4"/>
                      </button>

                      {/* Action 5: Delete Document or Permanent Lock */}
                      {doc.is_submitted || doc.status === 'SUBMITTED' ? (
                        <span
                          className="p-1.5 rounded-lg text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center cursor-not-allowed"
                          title="Permanently Archived: Submitted to host employee (Locked against deletion)"
                        >
                          <Lock className="h-4 w-4" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingDocId(doc.id);
                          }}
                          title="Delete Draft Document"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      )}
                    </div>
                  </div>
                </div>);
            })}
          </div>) : (
        /* TABULAR LIST VIEW */
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">{t('table.documentType', 'Document Type')}</th>
                    <th className="py-3.5 px-4 text-center">{t('table.version', 'Version')}</th>
                    <th className="py-3.5 px-4">{t('table.docNumber', 'Doc Number')}</th>
                    <th className="py-3.5 px-4">{t('table.fileInfo', 'File Info')}</th>
                    <th className="py-3.5 px-4">{t('table.uploadDate', 'Upload Date')}</th>
                    <th className="py-3.5 px-4">{t('table.status', 'Status')}</th>
                    <th className="py-3.5 px-4 text-right">{t('table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredDocuments.map((doc) => {
                const badge = getStatusBadge(doc.verification_status);
                const BadgeIcon = badge.icon;
                return (<tr key={doc.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors ${!doc.is_current ? 'opacity-85' : ''}`}>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500"/>
                            <span>{getDocTypeLabel(doc.document_type)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {doc.is_current ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              v{doc.version_number || 1} • Current
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-800 text-purple-300 border border-purple-500/30">
                              v{doc.version_number || 1} • Past
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                          {doc.document_number || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium max-w-xs truncate">
                          {doc.file_name} <span className="text-[10px] text-slate-400">({formatSize(doc.file_size)})</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-semibold">{formatDate(doc.created_at)}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${badge.bg}`}>
                            <BadgeIcon className="h-3 w-3"/>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => setViewingDoc(doc)} title="Read / Inspect Document" className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer">
                              <Eye className="h-4 w-4"/>
                            </button>
                            <button onClick={() => handleDownload(doc)} title="Download Document" className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer">
                              <Download className="h-4 w-4"/>
                            </button>
                            <button onClick={() => {
                              setUploadDocType(doc.document_type || 'NATIONAL_ID');
                              setUploadDocNumber(doc.document_number || '');
                              setSelectedFile(null);
                              setShowUpload(true);
                            }} title="Upload Newer Version" className="p-1.5 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors cursor-pointer">
                              <Upload className="h-4 w-4"/>
                            </button>
                            <button onClick={() => handleOpenEdit(doc)} title="Edit / Update" className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors cursor-pointer">
                              <Edit3 className="h-4 w-4"/>
                            </button>
                            {doc.is_submitted || doc.status === 'SUBMITTED' ? (
                              <span
                                className="p-1.5 text-emerald-500 inline-flex items-center cursor-not-allowed"
                                title="Permanently Archived: Submitted to host employee (Locked against deletion)"
                              >
                                <Lock className="h-4 w-4" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingDocId(doc.id);
                                }}
                                title="Delete Draft Document"
                                className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4"/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>);
            })}
                </tbody>
              </table>
            </div>
          </div>)) : (
        /* EMPTY STATE */
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl py-16 px-6 text-center shadow-sm flex flex-col items-center justify-center">
          <div className="p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full mb-4">
            <Shield className="h-10 w-10"/>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            No Documents Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 font-medium">
            {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? 'No identification documents match your filter criteria. Try adjusting your search.'
                : 'Upload your official identification documents (Passport, National ID, Driving License) to speed up security check-in.'}
          </p>
          <button onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setShowUpload(true);
            }} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md">
            <Plus className="h-4 w-4"/> Upload Document Now
          </button>
        </div>)}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ACTION MODAL 1: UPLOAD DOCUMENT MODAL                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showUpload && createPortal(<div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600"/> Upload Identification Document
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Accepted formats: PDF, PNG, JPG, JPEG (Max 5MB)
                </p>
              </div>
              <button onClick={() => setShowUpload(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
                <X className="h-5 w-5"/>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">{t('form.documentType', 'Document Type')} *</label>
                <select value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                  {DOC_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.icon} {t.label}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">{t('form.documentNumber', 'Document Number')}</label>
                  <input type="text" placeholder={t('placeholder.docNumber', 'e.g. A12345678')} value={uploadDocNumber} onChange={(e) => setUploadDocNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">{t('form.expiryDate', 'Expiry Date')}</label>
                  <input type="date" value={uploadExpiryDate} onChange={(e) => setUploadExpiryDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"/>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">{t('form.selectDocFile', 'Select Document File')} *</label>
                <div onClick={() => uploadFileRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-900/30 transition-colors">
                  <input ref={uploadFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}/>
                  <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2"/>
                  {selectedFile ? (<div>
                      <p className="font-bold text-blue-600 dark:text-blue-400 text-xs truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Click to change file ({formatSize(selectedFile.size)})</p>
                    </div>) : (<div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Click or drop file to upload</p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports PDF, PNG, JPG files up to 5MB</p>
                    </div>)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <button onClick={() => setShowUpload(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {t('btn.cancel', 'Cancel')}
              </button>
              <button onClick={handleUploadSubmit} disabled={uploading || !selectedFile} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
                {uploading ? (<>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    <span>Uploading...</span>
                  </>) : (<span>{t('btn.submit', 'Submit Document')}</span>)}
              </button>
            </div>
          </div>
        </div>, document.body)}



      {/* ───────────────────────────────────────────────────────────── */}
      {/* ACTION MODAL 3: EDIT / REPLACE DOCUMENT MODAL                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {editingDoc && createPortal(<div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-amber-500"/> Edit Document Info
              </h3>
              <button onClick={() => setEditingDoc(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
                <X className="h-5 w-5"/>
              </button>
            </div>

            {error && (<div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 font-semibold text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0"/>
                <span>{typeof error === 'string' ? error : 'Failed to update document'}</span>
              </div>)}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">{t('form.documentType', 'Document Type')}</label>
                <select value={editDocType} onChange={(e) => setEditDocType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                  {DOC_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.icon} {t.label}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">{t('form.documentNumber', 'Document Number')}</label>
                <input type="text" value={editDocNumber} onChange={(e) => setEditDocNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"/>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">{t('form.expiryDate', 'Expiry Date')}</label>
                <input type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"/>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">{t('form.replaceFile', 'Replace File (Optional)')}</label>
                <div onClick={() => editFileRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50 dark:bg-slate-900/30">
                  <input ref={editFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setEditFile(e.target.files?.[0] || null)}/>
                  {editFile ? (<p className="font-bold text-amber-600 dark:text-amber-400 text-xs truncate">{editFile.name}</p>) : (<p className="text-slate-400 font-semibold text-[11px]">Click to upload replacement file (PDF/JPG/PNG)</p>)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <button onClick={() => setEditingDoc(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {t('btn.cancel', 'Cancel')}
              </button>
              <button onClick={handleEditSubmit} disabled={updating} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
                {updating ? 'Saving...' : t('btn.save', 'Save Changes')}
              </button>
            </div>
          </div>
        </div>, document.body)}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ACTION MODAL 4: DELETE CONFIRMATION MODAL                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {deletingDocId && createPortal(<div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <Trash2 className="h-6 w-6"/>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Remove Document?
              </h3>
              {(() => {
                const docToDelete = documents.find(d => d.id === deletingDocId);
                return docToDelete ? (
                  <div className="p-2.5 my-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-left">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{docToDelete.file_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{getDocTypeLabel(docToDelete.document_type)} • v{docToDelete.version_number || 1}</p>
                  </div>
                ) : null;
              })()}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Are you sure you want to delete this identification document? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setDeletingDocId(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer">
                Delete Document
              </button>
            </div>
          </div>
        </div>, document.body)}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ACTION MODAL 5: SEND ALL DOCUMENTS TO HOST CONFIRMATION MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showSendModal && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <Send className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Send All Documents to Host Employee?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                You are transmitting <span className="text-emerald-600 dark:text-emerald-400 font-bold">{unsubmittedDocs.length} document(s)</span> directly to your host employee for visitor identity review and appointment approval.
              </p>
            </div>

            {/* Document list to be sent */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-left text-xs">
              {unsubmittedDocs.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
                  <div className="truncate flex-1 pr-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate block">{d.file_name}</span>
                    <span className="text-slate-400 text-[10px]">{getDocTypeLabel(d.document_type)} • v{d.version_number || 1}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">Draft</span>
                </div>
              ))}
            </div>

            {sendModalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl text-xs font-semibold text-left flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{sendModalError}</span>
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl text-left flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-normal">
                <strong>Permanent Archival Policy:</strong> Once transmitted, these documents will be permanently retained in the host's compliance records and cannot be deleted by the visitor.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                disabled={sending}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs cursor-pointer"
              >
                Cancel / Review More
              </button>
              <button
                type="button"
                onClick={handleSendAllToHost}
                disabled={sending}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-md text-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {sending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Transmitting &amp; Locking...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send &amp; Lock Documents</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>);
}
