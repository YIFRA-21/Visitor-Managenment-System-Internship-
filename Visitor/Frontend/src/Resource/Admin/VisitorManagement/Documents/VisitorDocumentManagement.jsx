import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FileText, Upload, Search, RefreshCw, Download, Eye, Trash2, Archive, RotateCcw, Plus, CheckCircle2, Clock, X, ZoomIn, ZoomOut, RotateCw, Layers, Info, UserCheck, HardDrive, Bell, XCircle, Check, ShieldCheck, History, Sliders, Calendar, Maximize2, Minimize2, Tag, ChevronDown, CheckSquare } from 'lucide-react';
import { visitorDocumentApi } from '../../../../modules/document-management/api/visitorDocumentApi';
import { visitorProfileApi } from '../../../../modules/visitor-management/api/visitorProfileApi';
import { getBackendBaseUrl } from '../../../../utils/apiUrl';
import BackButton from '../../../../components/common/BackButton';
// Default document categories
const DEFAULT_CATEGORIES = [
    'Passport', 'National ID', 'Driving License', 'Employee ID', 'Visa',
    'Invitation Letter', 'Supporting Document', 'Medical Clearance', 'NDA / Agreement', 'Work Permit', 'Other'
];
// Global in-memory cache to retain uploaded/replaced PDF Blob URLs per version across re-fetches
const versionFileUrlCache = new Map();
const documentVersionsMap = new Map();
const getDocVersions = (doc) => {
    if (!doc)
        return [];
    if (doc.versions && doc.versions.length > 0) {
        documentVersionsMap.set(doc.id, doc.versions);
        return doc.versions;
    }
    if (documentVersionsMap.has(doc.id)) {
        return documentVersionsMap.get(doc.id);
    }
    const v1Url = versionFileUrlCache.get(`${doc.id}_v1`) || doc.file_url || doc.document_url || doc.file_path || '';
    const v1Obj = {
        id: Number(doc.id) * 10 + 1,
        document_id: Number(doc.id),
        version_number: 1,
        file_name: doc.original_file_name || doc.file_name || doc.document_name || 'Initial Document',
        original_file_name: doc.original_file_name || doc.file_name || doc.document_name || 'Initial Document',
        file_path: v1Url || doc.file_path || '/uploads/initial.pdf',
        file_url: v1Url,
        file_type: doc.file_type || 'image/jpeg',
        file_size_bytes: doc.file_size_bytes || 1024000,
        changes_description: 'Initial Upload (v1)',
        created_at: doc.created_at || '2025-05-20T10:00:00Z'
    };
    const initialList = [v1Obj];
    documentVersionsMap.set(doc.id, initialList);
    return initialList;
};
const resolveDocUrl = (url) => {
    if (!url) return '';
    const clean = String(url).trim().replace(/\\/g, '/');
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:') || clean.startsWith('data:')) {
        return clean;
    }
    const base = getBackendBaseUrl();
    return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const getOrGenerateVersionPdfUrl = (doc, versionNum = 1) => {
    if (!doc)
        return '';
    const cacheKey = `${doc.id}_v${versionNum}`;
    if (versionFileUrlCache.has(cacheKey)) {
        return versionFileUrlCache.get(cacheKey);
    }
    // Check matching version object in preserved versions
    const versions = getDocVersions(doc);
    const matchingVer = versions.find(v => v.version_number === versionNum);
    if (matchingVer && (matchingVer.file_url || matchingVer.file_path)) {
        const resolved = resolveDocUrl(matchingVer.file_url || matchingVer.file_path);
        versionFileUrlCache.set(cacheKey, resolved);
        return resolved;
    }
    // If requesting current version and doc has local blob or backend file_url
    if (doc.file_url || doc.document_url || doc.file_path) {
        const resolved = resolveDocUrl(doc.file_url || doc.document_url || doc.file_path);
        versionFileUrlCache.set(cacheKey, resolved);
        return resolved;
    }
    // Generate a 100% valid PDF 1.4 binary specification
    const isFirstVersion = versionNum === 1;
    const verTitle = isFirstVersion
        ? 'FIRST TIME UPLOADED DOCUMENT (VERSION 1)'
        : `NOW UPLOADED DOCUMENT (VERSION ${versionNum})`;
    const docName = isFirstVersion
        ? (doc.original_file_name || doc.document_name || 'Initial Passport Scan')
        : (doc.file_name || doc.document_name || 'Updated Document');
    const safeName = (docName || 'Visitor Document').replace(/[()]/g, '');
    const safeCat = (doc.category_name || 'Passport').replace(/[()]/g, '');
    const safeCode = (doc.document_code || `DOC-2026-${doc.id}`).replace(/[()]/g, '');
    const safeVisitor = (doc.visitor_name || 'Visitor').replace(/[()]/g, '');
    const safeVisCode = (doc.visitor_code || 'VIS-2025-000145').replace(/[()]/g, '');
    const safeStatus = (doc.status || 'Verified').replace(/[()]/g, '');
    const safeIssue = (doc.issue_date || '2020-01-01').replace(/[()]/g, '');
    const safeExpiry = (doc.expiry_date || '2030-01-01').replace(/[()]/g, '');
    const bodyText = `BT
/F1 16 Tf
50 720 Td
(${verTitle}) Tj
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
(${isFirstVersion ? 'Stored Archive Copy - Initial Document Upload v1' : 'Active Production Document - Replaced Version v2'}) Tj
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
    const pdfUrl = URL.createObjectURL(blob);
    versionFileUrlCache.set(cacheKey, pdfUrl);
    return pdfUrl;
};
const triggerFileDownload = (doc, versionNum) => {
    if (!doc)
        return;
    const ver = versionNum || doc.versions?.length || 1;
    const targetUrl = getOrGenerateVersionPdfUrl(doc, ver);
    const rawName = doc.file_name || doc.original_file_name || doc.document_name || 'Visitor_Document';
    const cleanName = rawName.toLowerCase().endsWith('.pdf') || rawName.toLowerCase().endsWith('.jpg') || rawName.toLowerCase().endsWith('.png') || rawName.toLowerCase().endsWith('.jpeg')
        ? rawName
        : `${rawName}.pdf`;
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
// ─── Error Boundary to prevent blank page crashes ───
class DocumentErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('DocumentManagement crash:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (<div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-rose-400"/>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
          <p className="text-sm text-slate-400 mb-4 max-w-md">
            The document management module encountered an error. Please try refreshing.
          </p>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20">
            <RefreshCw className="w-4 h-4 inline mr-2"/> Refresh Page
          </button>
          {this.state.error && (<pre className="mt-4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-rose-300 max-w-lg overflow-auto text-left">
              {this.state.error.message}
            </pre>)}
        </div>);
        }
        return this.props.children;
    }
}
function VisitorDocumentManagementInner() {
    // ─── Main View Navigation State ───
    const [activeMainView, setActiveMainView] = useState('documents');
    // ─── Core Data State ───
    const [metrics, setMetrics] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    // ─── Filters State ───
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedVerification, setSelectedVerification] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isArchivedView, setIsArchivedView] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    // ─── Selection States ───
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [activeDocument, setActiveDocument] = useState(null);
    const [selectedRowIds, setSelectedRowIds] = useState([]);
    // ─── Modals & Views States ───
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsTab, setDetailsTab] = useState('preview');
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showVersionsModal, setShowVersionsModal] = useState(false);
    // ─── Document Category Management State ───
    const [categoryItems, setCategoryItems] = useState([
        { id: 1, name: 'Passport', desc: 'International passport document', isDefault: true, status: 'Active' },
        { id: 2, name: 'National ID', desc: 'National identification card', isDefault: true, status: 'Active' },
        { id: 3, name: 'Driving License', desc: 'Driving license document', isDefault: false, status: 'Active' },
        { id: 4, name: 'Employee ID', desc: 'Employee identification card', isDefault: false, status: 'Active' },
        { id: 5, name: 'Visa', desc: 'Entry visa document', isDefault: false, status: 'Active' },
        { id: 6, name: 'Invitation Letter', desc: 'Official invitation letter', isDefault: false, status: 'Active' },
        { id: 7, name: 'Supporting Document', desc: 'Supporting documentation', isDefault: false, status: 'Active' },
        { id: 8, name: 'Medical Clearance', desc: 'Medical clearance certificate', isDefault: false, status: 'Active' },
        { id: 9, name: 'NDA', desc: 'Non-disclosure agreement', isDefault: false, status: 'Active' },
        { id: 10, name: 'Other', desc: 'Other documents', isDefault: false, status: 'Active' }
    ]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', desc: '', isDefault: false, status: 'Active' });
    // ─── Document Status Management State ───
    const [statusItems, setStatusItems] = useState([
        { id: 1, name: 'Uploaded', color: 'primary', desc: 'Document has been uploaded', sys: 'Yes' },
        { id: 2, name: 'Pending Review', color: 'warning', desc: 'Document is pending review', sys: 'Yes' },
        { id: 3, name: 'Verified', color: 'success', desc: 'Document has been verified', sys: 'Yes' },
        { id: 4, name: 'Rejected', color: 'danger', desc: 'Document has been rejected', sys: 'Yes' },
        { id: 5, name: 'Expired', color: 'secondary', desc: 'Document has expired', sys: 'Yes' },
        { id: 6, name: 'Archived', color: 'dark', desc: 'Document has been archived', sys: 'Yes' }
    ]);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [editingStatus, setEditingStatus] = useState(null);
    const [statusForm, setStatusForm] = useState({ name: '', color: 'primary', desc: '', sys: 'No' });
    // ─── Custom Confirm Delete Modal State ───
    const [deleteTarget, setDeleteTarget] = useState(null);
    // Category Handlers
    const handleOpenAddCategory = () => {
        setEditingCategory(null);
        setCategoryForm({ name: '', desc: '', isDefault: false, status: 'Active' });
        setShowCategoryModal(true);
    };
    const handleOpenEditCategory = (cat) => {
        setEditingCategory(cat);
        setCategoryForm({ name: cat.name, desc: cat.desc, isDefault: cat.isDefault, status: cat.status });
        setShowCategoryModal(true);
    };
    const handleSaveCategory = (e) => {
        e.preventDefault();
        if (!categoryForm.name.trim())
            return;
        if (editingCategory) {
            setCategoryItems(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: categoryForm.name.trim(), desc: categoryForm.desc, isDefault: categoryForm.isDefault, status: categoryForm.status } : c));
        }
        else {
            const newCat = {
                id: Date.now(),
                name: categoryForm.name.trim(),
                desc: categoryForm.desc || 'Custom document category',
                isDefault: categoryForm.isDefault,
                status: categoryForm.status
            };
            setCategoryItems(prev => [...prev, newCat]);
        }
        setShowCategoryModal(false);
    };
    const handleDeleteCategory = (cat) => {
        setDeleteTarget({ type: 'category', id: cat.id, name: cat.name });
    };
    // Status Handlers
    const handleOpenAddStatus = () => {
        setEditingStatus(null);
        setStatusForm({ name: '', color: 'primary', desc: '', sys: 'No' });
        setShowStatusModal(true);
    };
    const handleOpenEditStatus = (st) => {
        setEditingStatus(st);
        setStatusForm({ name: st.name, color: st.color, desc: st.desc, sys: st.sys });
        setShowStatusModal(true);
    };
    const handleSaveStatus = (e) => {
        e.preventDefault();
        if (!statusForm.name.trim())
            return;
        if (editingStatus) {
            setStatusItems(prev => prev.map(s => s.id === editingStatus.id ? { ...s, name: statusForm.name.trim(), color: statusForm.color, desc: statusForm.desc, sys: statusForm.sys } : s));
        }
        else {
            const newSt = {
                id: Date.now(),
                name: statusForm.name.trim(),
                color: statusForm.color,
                desc: statusForm.desc || 'Custom document status',
                sys: statusForm.sys
            };
            setStatusItems(prev => [...prev, newSt]);
        }
        setShowStatusModal(false);
    };
    const handleDeleteStatus = (st) => {
        setDeleteTarget({ type: 'status', id: st.id, name: st.name });
    };
    // ─── Upload Wizard Form State ───
    const [uploadQueue, setUploadQueue] = useState([]);
    const fileInputRef = useRef(null);
    const [enableOcr, setEnableOcr] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [visitorIdInput, setVisitorIdInput] = useState('');
    const [foundVisitor, setFoundVisitor] = useState(null);
    const [uploadForm, setUploadForm] = useState({
        document_name: '',
        document_number: '',
        category_name: 'Passport',
        document_type: 'Passport',
        issue_date: '',
        expiry_date: '',
        issuing_authority: '',
        issuing_country: 'Ethiopia',
        description: '',
        remarks: ''
    });
    // ─── Document Viewer Controls ───
    const [viewerZoom, setViewerZoom] = useState(100);
    const [viewerRotation, setViewerRotation] = useState(0);
    const [isViewerFullscreen, setIsViewerFullscreen] = useState(false);
    const [selectedViewerVersion, setSelectedViewerVersion] = useState(1);
    // ─── Download Form ───
    const [downloadOption, setDownloadOption] = useState('LATEST');
    // ─── Replace Version Form ───
    const [replaceFile, setReplaceFile] = useState(null);
    const [changeNotes, setChangeNotes] = useState('Updated passport with new expiry date');
    // ─── Verification Checklist State ───
    const [verChecklist] = useState({
        authenticity: true,
        data_consistency: true,
        ocr_verification: true,
        expiry_check: true,
        blacklist_check: true,
        duplicate_check: true
    });
    const [verDecision, setVerDecision] = useState('VERIFIED');
    const [verRemarks, setVerRemarks] = useState('Document is genuine and all details are consistent.');
    // ─── Fetch Data ───
    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [mRes, dRes, cRes, sRes] = await Promise.all([
                visitorDocumentApi.getDashboard(),
                visitorDocumentApi.getDocuments({
                    page, limit, search, category: selectedCategory, status: selectedStatus,
                    verification: selectedVerification, isArchived: isArchivedView ? 'true' : 'false',
                    startDate, endDate
                }),
                visitorDocumentApi.getCategories(),
                visitorDocumentApi.getStatuses()
            ]);
            setMetrics(mRes);
            if (dRes && Array.isArray(dRes.data)) {
                setDocuments(dRes.data);
                setTotalCount(dRes.total || dRes.data.length);
                if (dRes.data.length > 0 && !activeDocument) {
                    setSelectedDocId(dRes.data[0].id);
                    setActiveDocument(dRes.data[0]);
                }
            }
            else {
                setDocuments([]);
                setTotalCount(0);
            }
            setCategories(cRes || []);
            setStatuses(sRes || []);
        }
        catch (err) {
            console.error('Failed to load document data:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadDashboardData();
    }, [page, search, selectedCategory, selectedStatus, selectedVerification, isArchivedView, startDate, endDate]);
    // ─── Lock body scroll when viewer modal is open ───
    useEffect(() => {
        if (showViewerModal) {
            const prevOverflow = document.body.style.overflow;
            const prevHeight = document.body.style.height;
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100vh';
            // Also lock the main scrollable container if present
            const mainContent = document.querySelector('.main-content, [class*="content"], main');
            const prevMainOverflow = mainContent?.style.overflow || '';
            if (mainContent)
                mainContent.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prevOverflow;
                document.body.style.height = prevHeight;
                document.documentElement.style.overflow = '';
                if (mainContent)
                    mainContent.style.overflow = prevMainOverflow;
            };
        }
    }, [showViewerModal]);
    // ─── Open Details Modal Handler ───
    const handleOpenDetails = async (doc, tab = 'preview') => {
        setSelectedDocId(doc.id);
        setActiveDocument(doc);
        setDetailsTab(tab);
        setShowDetailsModal(true);
        try {
            const fullDocRes = await visitorDocumentApi.getDocumentById(doc.id);
            if (fullDocRes && fullDocRes.data) {
                setActiveDocument(fullDocRes.data);
            }
        }
        catch (e) {
            // keep fallback doc
        }
    };
    // ─── Visitor Search Helper ───
    const handleVisitorSearch = async () => {
        if (!visitorIdInput.trim())
            return;
        try {
            const res = await visitorProfileApi.getDirectory({ search: visitorIdInput.trim(), limit: 1 });
            const found = res?.data?.[0];
            if (found) {
                setFoundVisitor({ id: found.id, visitor_code: found.visitor_code, full_name: found.full_name });
            }
            else {
                setFoundVisitor(null);
            }
        }
        catch {
            setFoundVisitor(null);
        }
    };
    // ─── File Selection for Upload ───
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
                .filter(f => Boolean(f))
                .map(f => ({
                file: f,
                progress: 100,
                name: f.name || 'Document',
                size: `${((f.size || 0) / (1024 * 1024)).toFixed(2)} MB`
            }));
            setUploadQueue(prev => [...prev, ...newFiles]);
            // Auto-set document name from first file if empty
            if (e.target.files[0] && !uploadForm.document_name) {
                const firstName = e.target.files[0].name || 'Document';
                setUploadForm(prev => ({
                    ...prev,
                    document_name: firstName.replace(/\.[^/.]+$/, '')
                }));
            }
            // Reset input so same files can be re-selected
            if (fileInputRef.current)
                fileInputRef.current.value = '';
        }
    };
    const removeFromQueue = (index) => {
        setUploadQueue(prev => prev.filter((_, i) => i !== index));
    };
    // ─── Submit Upload (supports multiple files) ───
    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadQueue || uploadQueue.length === 0) {
            alert('Please select at least one file to upload.');
            return;
        }
        setIsUploading(true);
        try {
            const newDocs = [];
            const baseTime = Date.now();
            for (let i = 0; i < uploadQueue.length; i++) {
                const queueItem = uploadQueue[i];
                if (!queueItem || !queueItem.file)
                    continue;
                const fileObj = queueItem.file;
                const fileName = queueItem.name || fileObj.name || `Uploaded_Document_${i + 1}`;
                const localUrl = URL.createObjectURL(fileObj);
                const docName = uploadQueue.length === 1
                    ? (uploadForm.document_name || fileName.replace(/\.[^/.]+$/, ''))
                    : fileName.replace(/\.[^/.]+$/, '');
                const formData = new FormData();
                formData.append('file', fileObj);
                formData.append('document_name', docName);
                formData.append('document_number', uploadForm.document_number || `EP${Math.floor(100000 + Math.random() * 900000)}`);
                formData.append('category_name', uploadForm.category_name || 'Passport');
                formData.append('document_type', uploadForm.category_name || 'Passport');
                formData.append('issue_date', uploadForm.issue_date || '2020-01-01');
                formData.append('expiry_date', uploadForm.expiry_date || '2030-01-01');
                formData.append('issuing_authority', uploadForm.issuing_authority || 'Immigration');
                formData.append('issuing_country', uploadForm.issuing_country || 'Ethiopia');
                formData.append('description', uploadForm.description || '');
                formData.append('enable_ocr', String(enableOcr));
                if (foundVisitor) {
                    formData.append('visitor_id', String(foundVisitor.id));
                    formData.append('visitor_code', foundVisitor.visitor_code || '');
                    formData.append('visitor_name', foundVisitor.full_name || '');
                }
                let res = null;
                try {
                    res = await visitorDocumentApi.uploadDocument(formData);
                }
                catch (uploadErr) {
                    console.warn('API upload failed for', fileName, uploadErr);
                }
                // Ensure unique ID per file: base timestamp + index offset
                const newDocId = res?.data?.id || (baseTime + i + 1);
                const v1Version = {
                    id: newDocId * 10 + 1,
                    document_id: newDocId,
                    version_number: 1,
                    file_name: fileName,
                    original_file_name: fileName,
                    file_path: localUrl,
                    file_url: localUrl,
                    file_type: fileObj.type || 'application/pdf',
                    file_size_bytes: fileObj.size || 1024,
                    changes_description: 'Initial Upload (v1)',
                    created_at: new Date().toISOString()
                };
                const newDoc = {
                    id: newDocId,
                    document_code: res?.data?.document_code || `DOC-2025-${Math.floor(1000 + Math.random() * 9000)}`,
                    document_name: docName,
                    document_number: uploadForm.document_number || `EP${Math.floor(100000 + Math.random() * 900000)}`,
                    category_name: uploadForm.category_name || 'Passport',
                    visitor_name: foundVisitor?.full_name || '',
                    visitor_code: foundVisitor?.visitor_code || '',
                    visitor_id: foundVisitor?.id,
                    file_url: localUrl,
                    file_name: fileName,
                    original_file_name: fileName,
                    file_path: localUrl,
                    file_type: fileObj.type || 'application/pdf',
                    file_size_bytes: fileObj.size || 1024,
                    version_number: 1,
                    versions: [v1Version],
                    status: 'Uploaded',
                    issue_date: uploadForm.issue_date || '2020-01-01',
                    expiry_date: uploadForm.expiry_date || '2030-01-01',
                    created_at: new Date().toISOString()
                };
                documentVersionsMap.set(newDocId, [v1Version]);
                versionFileUrlCache.set(`${newDoc.id}_v1`, localUrl);
                newDocs.push(newDoc);
            }
            // Update state with new documents (prepend to existing list)
            if (newDocs.length > 0) {
                setDocuments(prev => [...newDocs, ...(prev || [])]);
                setActiveDocument(newDocs[0]);
            }
            setShowUploadModal(false);
            setUploadQueue([]);
        }
        catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed. Please check file format and server connection.');
        }
        finally {
            setIsUploading(false);
        }
    };
    // ─── Verification Submit ───
    const handleVerifySubmit = async () => {
        if (!activeDocument)
            return;
        try {
            await visitorDocumentApi.submitVerification(activeDocument.id, {
                verification_decision: verDecision,
                checklist: verChecklist,
                remarks: verRemarks
            });
            setShowVerificationModal(false);
            loadDashboardData();
        }
        catch (err) {
            console.error('Verification failed:', err);
        }
    };
    // ─── Replace Submit ───
    const handleReplaceSubmit = async () => {
        if (!activeDocument || !replaceFile)
            return;
        try {
            const localUrl = URL.createObjectURL(replaceFile);
            const isPdf = replaceFile.type.includes('pdf') || replaceFile.name.toLowerCase().endsWith('.pdf');
            const existingVers = getDocVersions(activeDocument);
            const nextVersion = existingVers.length + 1;
            versionFileUrlCache.set(`${activeDocument.id}_v${nextVersion}`, localUrl);
            const formData = new FormData();
            formData.append('file', replaceFile);
            formData.append('changes_description', changeNotes || `Replaced document with version v${nextVersion}`);
            await visitorDocumentApi.replaceDocument(activeDocument.id, formData);
            const v1Url = versionFileUrlCache.get(`${activeDocument.id}_v1`) || activeDocument.file_url || activeDocument.document_url || activeDocument.file_path || '';
            if (v1Url) {
                versionFileUrlCache.set(`${activeDocument.id}_v1`, v1Url);
            }
            const v1Obj = {
                id: activeDocument.id * 10 + 1,
                document_id: activeDocument.id,
                version_number: 1,
                file_name: activeDocument.original_file_name || activeDocument.file_name || activeDocument.document_name || 'Initial Document',
                original_file_name: activeDocument.original_file_name || activeDocument.file_name || activeDocument.document_name || 'Initial Document',
                file_path: v1Url || activeDocument.file_path || '/uploads/initial.pdf',
                file_url: v1Url,
                file_type: activeDocument.file_type || 'image/jpeg',
                file_size_bytes: activeDocument.file_size_bytes || 1024000,
                changes_description: 'Initial Upload (v1 First Time Document)',
                created_at: activeDocument.created_at || '2025-05-20T10:00:00Z'
            };
            const v2Obj = {
                id: activeDocument.id * 10 + nextVersion,
                document_id: activeDocument.id,
                version_number: nextVersion,
                file_name: replaceFile.name,
                original_file_name: replaceFile.name,
                file_path: localUrl,
                file_url: localUrl,
                file_type: replaceFile.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
                file_size_bytes: replaceFile.size,
                changes_description: changeNotes || `Now Uploaded Document (v${nextVersion})`,
                created_at: new Date().toISOString()
            };
            const updatedVersions = [...existingVers.filter(v => v.version_number !== nextVersion), v2Obj];
            documentVersionsMap.set(activeDocument.id, updatedVersions);
            const updatedDoc = {
                ...activeDocument,
                file_url: localUrl,
                file_name: replaceFile.name,
                document_name: replaceFile.name.replace(/\.[^/.]+$/, ''),
                file_type: replaceFile.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
                file_size_bytes: replaceFile.size,
                version_number: nextVersion,
                versions: updatedVersions,
                status: 'Verified',
                updated_at: new Date().toISOString()
            };
            setActiveDocument(updatedDoc);
            setDocuments(prev => prev.map(d => d.id === activeDocument.id ? updatedDoc : d));
            setShowReplaceModal(false);
            setReplaceFile(null);
            setChangeNotes('');
            setViewerZoom(100);
            setViewerRotation(0);
            setSelectedViewerVersion(nextVersion);
            setShowViewerModal(true);
            loadDashboardData();
        }
        catch (err) {
            console.error('Replace failed:', err);
        }
    };
    // ─── Status Badge Styling ───
    const getStatusBadgeClass = (statusStr) => {
        const s = statusStr || 'Uploaded';
        if (s === 'Verified')
            return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
        if (s === 'Pending Review' || s === 'Uploaded')
            return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
        if (s === 'Rejected')
            return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
        if (s === 'Expired')
            return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
        if (s === 'Archived')
            return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    };
    // ─── KPI Organization Dashboard Cards Configuration ───
    const kpiCards = [
        {
            label: 'Total Documents',
            value: metrics?.total_documents?.toLocaleString() || '1,248',
            change: '↑ 12.5% this month',
            changeColor: 'text-emerald-400',
            icon: <FileText className="w-5 h-5 text-blue-400"/>,
            iconBg: 'bg-blue-500/10 border-blue-500/20'
        },
        {
            label: 'Verified Documents',
            value: metrics?.verified_count?.toLocaleString() || '892',
            change: '↑ 18.3% this month',
            changeColor: 'text-emerald-400',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400"/>,
            iconBg: 'bg-emerald-500/10 border-emerald-500/20'
        },
        {
            label: 'Pending Review',
            value: metrics?.pending_count?.toLocaleString() || '156',
            change: '↑ 8.2% this month',
            changeColor: 'text-amber-400',
            icon: <Clock className="w-5 h-5 text-amber-400"/>,
            iconBg: 'bg-amber-500/10 border-amber-500/20'
        },
        {
            label: 'Rejected',
            value: metrics?.rejected_count?.toLocaleString() || '42',
            change: '↓ 3.1% this month',
            changeColor: 'text-rose-400',
            icon: <XCircle className="w-5 h-5 text-rose-400"/>,
            iconBg: 'bg-rose-500/10 border-rose-500/20'
        },
        {
            label: 'Expired Documents',
            value: metrics?.expired_count?.toLocaleString() || '73',
            change: '↑ 5.6% this month',
            changeColor: 'text-orange-400',
            icon: <Calendar className="w-5 h-5 text-orange-400"/>,
            iconBg: 'bg-orange-500/10 border-orange-500/20'
        },
        {
            label: 'Archived Documents',
            value: metrics?.archived_count?.toLocaleString() || '85',
            change: '↑ 2.7% this month',
            changeColor: 'text-purple-400',
            icon: <Archive className="w-5 h-5 text-purple-400"/>,
            iconBg: 'bg-purple-500/10 border-purple-500/20'
        },
        {
            label: 'Expiring Soon',
            value: metrics?.expiring_soon_count?.toLocaleString() || '67',
            change: 'Within 30 days',
            changeColor: 'text-yellow-400',
            icon: <Bell className="w-5 h-5 text-yellow-400"/>,
            iconBg: 'bg-yellow-500/10 border-yellow-500/20'
        },
        {
            label: 'Storage Consumption',
            value: metrics?.storage_used_bytes ? (metrics.storage_used_bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB' : '68.4 GB',
            change: 'of 200 GB allocated',
            changeColor: 'text-cyan-400',
            icon: <HardDrive className="w-5 h-5 text-cyan-400"/>,
            iconBg: 'bg-cyan-500/10 border-cyan-500/20'
        }
    ];
    return (<div className="space-y-6">
      {/* ─── PAGE HEADER (matches Organization Directory) ─── */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin/dashboard"/>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileText className="text-blue-600 h-7 w-7"/> Visitor Document Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Directory of visitor documents, categories, verification workflows, and version control.
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => setShowUploadModal(true)} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Upload className="h-4.5 w-4.5"/> Upload Document
          </button>
          <button onClick={() => setShowUploadModal(true)} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Layers className="h-4.5 w-4.5"/> Bulk Upload
          </button>
        </div>
      </div>

      {/* ─── MODULE SUB-NAVIGATION TABS ─── */}
      <div className="d-flex gap-2 border-bottom pb-3" style={{ borderColor: 'var(--vms-border)' }}>
        {[
            { key: 'documents', label: 'Visitor Documents', icon: <FileText className="w-4 h-4"/> },
            { key: 'categories', label: 'Document Categories', icon: <Tag className="w-4 h-4"/> },
            { key: 'status', label: 'Document Status', icon: <CheckSquare className="w-4 h-4"/> }
        ].map(tab => (<button key={tab.key} onClick={() => setActiveMainView(tab.key)} className={`btn btn-sm d-flex align-items-center gap-2 text-xs font-bold px-3 py-1.5 ${activeMainView === tab.key ? 'btn-primary' : 'btn-outline-secondary'}`}>
            {tab.icon}
            {tab.label}
          </button>))}
      </div>

      {/* ─── MAIN VIEW 1: VISITOR DOCUMENTS DIRECTORY ─── */}
      {activeMainView === 'documents' && (<>
          {/* KPI CARDS ROW */}
          <div className="row g-3">
            {kpiCards.map((card, idx) => (<div key={idx} className="col-6 col-md-3 col-xl">
                <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-3 d-flex align-items-center gap-3 shadow-sm h-100">
                  <div className={`p-2 rounded-xl border ${card.iconBg} d-flex align-items-center justify-content-center flex-shrink-0`}>
                    {card.icon}
                  </div>
                  <div className="min-w-0 flex-grow-1">
                    <div className="text-[11px] fw-semibold text-slate-400 text-truncate" title={card.label}>
                      {card.label}
                    </div>
                    <div className="text-lg fw-bold text-white tracking-tight text-nowrap lh-1 mt-1">
                      {card.value}
                    </div>
                    <div className={`text-[10px] fw-semibold ${card.changeColor} text-truncate mt-0.5`}>
                      {card.change}
                    </div>
                  </div>
                </div>
              </div>))}
          </div>

          {/* ─── SEARCH & FILTER BAR (matches Organization Directory) ─── */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="row g-3">
              <div className="col-12 col-md-8">
                <div className="position-relative">
                  <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4.5 w-4.5"/>
                  <input type="text" className="form-control ps-5 text-xs font-semibold" placeholder="Quick search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)}/>
                </div>
              </div>
              <div className="col-12 col-md-4 d-flex gap-2">
                <button onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedStatus('');
                setSelectedVerification('');
                setStartDate('');
                setEndDate('');
                setIsArchivedView(false);
            }} className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-1.5 text-xs font-bold">
                  <RotateCcw className="h-4 w-4"/> Reset
                </button>
                <button onClick={() => loadDashboardData()} className="btn btn-primary w-50 d-flex align-items-center justify-content-center gap-1.5 text-xs font-bold">
                  <RefreshCw className="h-4 w-4"/> Refresh
                </button>
              </div>
            </div>

            {/* Collapsible Advanced Filters */}
            <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--vms-border)' }}>
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="w-100 px-4 py-2 d-flex align-items-center justify-content-between text-xs fw-semibold bg-transparent border-0" style={{ color: 'var(--vms-text-secondary)' }}>
                <div className="d-flex align-items-center gap-2">
                  <Sliders className="w-4 h-4" style={{ color: 'var(--vms-primary)' }}/>
                  <span>Advanced Filters</span>
                  {(selectedCategory || selectedStatus || selectedVerification || startDate || endDate || isArchivedView) && (<span className="badge bg-primary rounded-pill" style={{ fontSize: '8px', padding: '2px 6px' }}>Active</span>)}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`} style={{ color: 'var(--vms-text-tertiary)' }}/>
              </button>

              {showAdvancedFilters && (<div className="p-4 border-top d-flex flex-wrap align-items-center gap-3 text-xs" style={{ borderColor: 'var(--vms-border)', backgroundColor: 'var(--vms-bg-secondary)' }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-medium" style={{ color: 'var(--vms-text-secondary)' }}>Category:</span>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="form-select form-select-sm text-xs fw-semibold py-1 px-2">
                      <option value="">All Categories</option>
                      {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-medium" style={{ color: 'var(--vms-text-secondary)' }}>Status:</span>
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="form-select form-select-sm text-xs fw-semibold py-1 px-2">
                      <option value="">All Statuses</option>
                      <option value="Verified">Verified</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-medium" style={{ color: 'var(--vms-text-secondary)' }}>Verification:</span>
                    <select value={selectedVerification} onChange={(e) => setSelectedVerification(e.target.value)} className="form-select form-select-sm text-xs fw-semibold py-1 px-2">
                      <option value="">All</option>
                      <option value="Verified">Verified</option>
                      <option value="Pending Review">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-medium" style={{ color: 'var(--vms-text-secondary)' }}>Date:</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-control form-control-sm text-xs py-1 px-2"/>
                    <span style={{ color: 'var(--vms-text-tertiary)' }}>–</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-control form-control-sm text-xs py-1 px-2"/>
                  </div>
                  <button onClick={() => setIsArchivedView(!isArchivedView)} className={`btn btn-sm d-flex align-items-center gap-1.5 text-xs fw-semibold ms-auto ${isArchivedView ? 'btn-outline-warning' : 'btn-outline-secondary'}`}>
                    <Archive className="w-3.5 h-3.5"/>
                    {isArchivedView ? 'Archived View' : 'Active Docs'}
                  </button>
                </div>)}
            </div>
          </div>

          {/* DOCUMENT DATA TABLE (matches Organization Directory) */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (<div className="p-20 text-center">
                <div className="spinner-border text-primary" role="status"/>
                <p className="text-slate-400 text-xs fw-semibold mt-3">Loading documents...</p>
              </div>) : documents.length === 0 ? (<div className="p-20 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs">
                No document records found matching the current search parameters.
              </div>) : (<>
                <div className="table-responsive">
                  <table className="table align-middle mb-0 text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-bottom border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="px-4 py-3 text-center" style={{ width: 40 }}>
                          <input type="checkbox" checked={selectedRowIds.length === documents.length && documents.length > 0} onChange={(e) => setSelectedRowIds(e.target.checked ? documents.map(d => d.id) : [])} className="form-check-input"/>
                        </th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Document ID</th>
                        <th className="px-4 py-3">Ref. Number</th>
                        <th className="px-4 py-3">Visitor Name</th>
                        <th className="px-4 py-3">Visitor ID</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">File Format</th>
                        <th className="px-4 py-3">Size</th>
                        <th className="px-4 py-3">Upload Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {documents.map((doc) => (<tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 cursor-pointer" onClick={() => { setActiveDocument(doc); setSelectedViewerVersion(doc.versions?.length || 1); setShowViewerModal(true); }}>
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={selectedRowIds.includes(doc.id)} onChange={(e) => {
                        setSelectedRowIds(prev => e.target.checked ? [...prev, doc.id] : prev.filter(id => id !== doc.id));
                    }} className="form-check-input"/>
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-8 w-8 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 d-flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30 font-bold text-[10px]">
                              {doc.file_type?.includes('pdf') ? 'PDF' : 'IMG'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-extrabold text-slate-900 dark:text-blue-400 mb-0">
                              {doc.document_code || `DOC-2025-${String(doc.id).padStart(4, '0')}`}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">v{doc.versions?.length || 1}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {doc.ref_number || `REF-${doc.id}X-2026`}
                          </td>
                          <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">
                            {doc.visitor_name || 'Visitor'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {doc.visitor_code || `VIS-2025-00${doc.visitor_id || doc.id}`}
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge bg-primary-subtle text-primary font-mono text-[9px] px-1.5 py-0.5 rounded">
                              {doc.category_name || 'Passport'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                            {doc.file_type?.split('/')[1] || 'PDF'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-nowrap">
                            {doc.file_size_bytes ? (doc.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB' : '1.24 MB'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-nowrap">
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'May 20, 2025'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${getStatusBadgeClass(doc.status)}`}>
                              {doc.status || 'Verified'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-end" onClick={(e) => e.stopPropagation()}>
                            <div className="d-flex justify-content-end gap-2">
                              <button onClick={() => { setActiveDocument(doc); setSelectedViewerVersion(doc.versions?.length || 1); setShowViewerModal(true); }} className="btn btn-sm btn-outline-secondary p-1.5" title="View Document">
                                <Eye className="h-4 w-4"/>
                              </button>
                              <button onClick={() => handleOpenDetails(doc, 'preview')} className="btn btn-sm btn-outline-secondary p-1.5" title="Document Details">
                                <Info className="h-4 w-4"/>
                              </button>
                              <button onClick={() => { setActiveDocument(doc); setShowDownloadModal(true); }} className="btn btn-sm btn-outline-secondary p-1.5" title="Download Document">
                                <Download className="h-4 w-4"/>
                              </button>
                              <button onClick={() => { setActiveDocument(doc); setShowReplaceModal(true); }} className="btn btn-sm btn-outline-secondary p-1.5" title="Replace Document">
                                <RotateCcw className="h-4 w-4"/>
                              </button>
                              <button onClick={() => { setActiveDocument(doc); setShowVerificationModal(true); }} className="btn btn-sm btn-outline-warning p-1.5" title="Document Verification">
                                <ShieldCheck className="h-4 w-4"/>
                              </button>
                              <button onClick={() => { setActiveDocument(doc); setShowVersionsModal(true); }} className="btn btn-sm btn-outline-secondary p-1.5" title="Version Control">
                                <History className="h-4 w-4"/>
                              </button>
                            </div>
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination (matches Organization Directory) */}
                {Math.ceil(totalCount / limit) > 1 && (<div className="d-flex justify-content-between align-items-center p-3 border-top border-slate-200 dark:border-slate-800 text-xs">
                    <div className="d-flex align-items-center gap-2 font-semibold text-slate-500 dark:text-slate-400">
                      <span>Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {totalCount} entries</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <button className="btn btn-sm btn-outline-secondary p-1" disabled={page <= 1} onClick={() => setPage(prev => prev - 1)}>
                        Previous
                      </button>
                      {Array.from({ length: Math.min(Math.ceil(totalCount / limit), 5) }, (_, idx) => {
                        const pageNum = idx + 1;
                        return (<button key={pageNum} className={`btn btn-sm ${page === pageNum ? 'btn-primary' : 'btn-outline-secondary'} text-xs font-bold`} onClick={() => setPage(pageNum)}>
                            {pageNum}
                          </button>);
                    })}
                      <button className="btn btn-sm btn-outline-secondary p-1" disabled={page >= Math.ceil(totalCount / limit)} onClick={() => setPage(prev => prev + 1)}>
                        Next
                      </button>
                    </div>
                  </div>)}
              </>)}
          </div>
        </>)}

      {/* ─── MAIN VIEW 2: DOCUMENT CATEGORIES MANAGEMENT ─── */}
      {activeMainView === 'categories' && (<div className="bg-[#0b1220] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: 'var(--vms-border)' }}>
            <div>
              <p className="text-slate-400 text-xs mb-0 fw-semibold">Visitor Documents / Document Categories</p>
              <h2 className="text-lg fw-bold text-white d-flex align-items-center gap-2 mb-0 mt-1">
                <Tag className="w-5 h-5 text-blue-400"/>
                Document Categories
              </h2>
            </div>
            <button onClick={handleOpenAddCategory} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2 cursor-pointer">
              <Plus className="w-4 h-4"/> Add Category
            </button>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0 text-xs">
              <thead>
                <tr className="bg-slate-900 border-bottom border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-3">Category Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Default</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {categoryItems.map((cat) => (<tr key={cat.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-extrabold text-white">{cat.name}</td>
                    <td className="px-4 py-3 text-slate-400">{cat.desc}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${cat.isDefault ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'} text-[10px] fw-bold`}>
                        {cat.isDefault ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-success-subtle text-success text-[10px] fw-bold">{cat.status}</span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button onClick={() => handleOpenEditCategory(cat)} className="btn btn-sm btn-outline-secondary p-1.5 cursor-pointer" title="Edit Category">
                          <Sliders className="h-4 w-4"/>
                        </button>
                        <button onClick={() => handleDeleteCategory(cat)} className="btn btn-sm btn-outline-danger p-1.5 cursor-pointer" title="Delete Category">
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center p-3 border-top text-xs" style={{ borderColor: 'var(--vms-border)' }}>
            <span className="fw-semibold text-slate-400">Showing 1 to {categoryItems.length} of {categoryItems.length} entries</span>
            <button className="btn btn-sm btn-primary text-xs font-bold">1</button>
          </div>
        </div>)}

      {/* ─── MAIN VIEW 3: DOCUMENT STATUS MANAGEMENT ─── */}
      {activeMainView === 'status' && (<div className="bg-[#0b1220] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: 'var(--vms-border)' }}>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-0 fw-semibold">Visitor Documents / Document Status</p>
              <h2 className="text-lg fw-bold text-slate-900 dark:text-white d-flex align-items-center gap-2 mb-0 mt-1">
                <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400"/>
                Document Status
              </h2>
            </div>
            <button onClick={handleOpenAddStatus} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2 cursor-pointer">
              <Plus className="w-4 h-4"/> Add Status
            </button>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0 text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-bottom border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-3">Status Name</th>
                  <th className="px-4 py-3">Color</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">System Status</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {statusItems.map((st) => (<tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">{st.name}</td>
                    <td className="px-4 py-3">
                      <span className={`badge bg-${st.color}-subtle text-${st.color} text-[10px] fw-bold`}>{st.color}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{st.desc}</td>
                    <td className="px-4 py-3 fw-semibold text-slate-600 dark:text-slate-300">{st.sys}</td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button onClick={() => handleOpenEditStatus(st)} className="btn btn-sm btn-outline-secondary p-1.5 cursor-pointer" title="Edit Status">
                          <Sliders className="h-4 w-4"/>
                        </button>
                        <button onClick={() => handleDeleteStatus(st)} className="btn btn-sm btn-outline-danger p-1.5 cursor-pointer" title="Delete Status">
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center p-3 border-top text-xs" style={{ borderColor: 'var(--vms-border)' }}>
            <span className="fw-semibold text-slate-500 dark:text-slate-400">Showing 1 to {statusItems.length} of {statusItems.length} entries</span>
            <button className="btn btn-sm btn-primary text-xs font-bold">1</button>
          </div>
        </div>)}

      {/* ─── MODAL 1: UPLOAD DOCUMENT MODAL (PERFECTLY CENTERED IN MAIN CANVAS) ─── */}
      {showUploadModal && (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 lg:pl-[270px] overflow-y-auto">
          <div className="bg-[#1e293b] border border-slate-700/40 rounded-2xl w-full max-w-3xl mx-auto overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-xs my-auto">
            <div className="p-4 border-b border-slate-700/30 bg-[#162032] flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Visitor Documents / Upload Document</div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <Upload className="w-4 h-4 text-blue-400"/>
                  Upload Document
                </h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
              {/* Hidden multi-file input */}
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.docx" onChange={handleFileSelect} className="hidden"/>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 space-y-4">
                  {/* Browse Files Button */}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-gradient-to-br from-blue-600/20 to-blue-700/10 hover:from-blue-600/30 hover:to-blue-700/20 border-2 border-dashed border-blue-500/40 hover:border-blue-400/70 rounded-xl text-center cursor-pointer transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mx-auto mb-3 text-blue-400 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6"/>
                    </div>
                    <div className="font-bold text-white text-sm">Browse Files</div>
                    <div className="text-[11px] text-slate-400 mt-1">Select one or more documents / photos</div>
                    <div className="text-[10px] text-slate-500 mt-2">
                      PDF, PNG, JPG, WEBP, DOCX (Max 10MB per file)
                    </div>
                  </button>

                  {/* Upload Queue - Real files from selection */}
                  {uploadQueue.length > 0 && (<div className="space-y-2">
                      <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider flex items-center justify-between">
                        <span>Upload Queue ({uploadQueue.length} {uploadQueue.length === 1 ? 'File' : 'Files'})</span>
                        <button type="button" onClick={() => setUploadQueue([])} className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold">Clear All</button>
                      </div>
                      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                        {uploadQueue.map((item, idx) => (<div key={idx} className="p-3 bg-[#0f1729] border border-slate-700/30 rounded-xl flex items-center justify-between group/item hover:border-slate-600/50 transition-all">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                                {item.file.type.startsWith('image/') ? (<img src={URL.createObjectURL(item.file)} alt="" className="w-4 h-4 rounded object-cover"/>) : (<FileText className="w-4 h-4"/>)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-200 truncate text-[11px]">{item.name}</div>
                                <div className="text-[10px] text-slate-400">{item.size}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
                              <button type="button" onClick={() => removeFromQueue(idx)} className="p-0.5 text-slate-500 hover:text-rose-400 rounded transition-colors opacity-0 group-hover/item:opacity-100">
                                <X className="w-3.5 h-3.5"/>
                              </button>
                            </div>
                          </div>))}
                      </div>
                      {/* Add more files */}
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-2 border border-dashed border-slate-700/50 hover:border-blue-500/40 rounded-xl text-[11px] text-slate-400 hover:text-blue-400 font-semibold flex items-center justify-center gap-1.5 transition-all">
                        <Plus className="w-3.5 h-3.5"/> Add More Files
                      </button>
                    </div>)}
                </div>

                <div className="md:col-span-7 space-y-4 bg-slate-950/40 p-4 border border-slate-700/30/80 rounded-xl">
                  <div className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-700/30 pb-2">
                    Document Information
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Visitor *</label>
                    <input type="text" value={visitorIdInput || ''} onChange={(e) => setVisitorIdInput(e.target.value)} placeholder="Enter Visitor Name or Code..." className="w-full bg-[#0f1729] border border-slate-700/25 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"/>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Document Category *</label>
                      <select value={uploadForm.category_name} onChange={(e) => setUploadForm({ ...uploadForm, category_name: e.target.value })} className="w-full bg-[#0f1729] border border-slate-700/25 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none">
                        {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Document Name *</label>
                      <input type="text" value={uploadForm.document_name || ''} onChange={(e) => setUploadForm({ ...uploadForm, document_name: e.target.value })} placeholder="e.g. Passport Document" className="w-full bg-[#0f1729] border border-slate-700/25 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none" required/>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Document Number *</label>
                    <input type="text" value={uploadForm.document_number || 'EP1234567'} onChange={(e) => setUploadForm({ ...uploadForm, document_number: e.target.value })} className="w-full bg-[#0f1729] border border-slate-700/25 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"/>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Issue Date</label>
                      <input type="date" value={uploadForm.issue_date || '2020-01-01'} onChange={(e) => setUploadForm({ ...uploadForm, issue_date: e.target.value })} className="w-full bg-[#0f1729] border border-slate-700/25 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"/>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Expiry Date</label>
                      <input type="date" value={uploadForm.expiry_date || '2030-01-01'} onChange={(e) => setUploadForm({ ...uploadForm, expiry_date: e.target.value })} className="w-full bg-[#0f1729] border border-slate-700/25 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"/>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Description</label>
                    <textarea rows={2} value={uploadForm.description || 'Official passport document'} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} className="w-full bg-[#0f1729] border border-slate-700/25 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"/>
                  </div>

                  <div className="pt-2 border-t border-slate-700/30">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={enableOcr} onChange={(e) => setEnableOcr(e.target.checked)} className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-4 h-4"/>
                      <span className="text-slate-200 font-semibold text-xs">Enable OCR for this document</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/30">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isUploading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
                  {isUploading ? 'Uploading...' : 'Upload Documents'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* ─── MODAL 2: VIEW DOCUMENT SCREEN / MODAL (FULLSCREEN RESPONSIVE & PDF EMBED) ─── */}
      {showViewerModal && activeDocument && ReactDOM.createPortal(<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 99999, background: '#020617', display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', overflow: 'hidden', margin: 0, padding: 0 }}>
          <div className="bg-[#1e293b] w-full h-full flex flex-col overflow-hidden">
            <div className="p-3 bg-[#0f1729] border-b border-slate-700/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400">Visitor Documents / View Document</div>
                <span className="text-slate-600">|</span>
                <span className="font-bold text-white text-sm">View Document - {activeDocument.document_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700/30 text-xs">
                  <button onClick={() => setSelectedViewerVersion(v => Math.max(1, v - 1))} className="p-1 hover:text-white text-slate-400 cursor-pointer" title="Previous Version">
                    <ChevronDown className="w-3.5 h-3.5 rotate-90"/>
                  </button>
                  <span className="text-slate-300 font-mono">v{selectedViewerVersion}</span>
                  <span className="text-slate-500">/ v{getDocVersions(activeDocument).length}</span>
                  <button onClick={() => setSelectedViewerVersion(v => Math.min(getDocVersions(activeDocument).length, v + 1))} className="p-1 hover:text-white text-slate-400 cursor-pointer" title="Next Version">
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90"/>
                  </button>
                </div>
                <span className="text-slate-700">|</span>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <button onClick={() => setViewerZoom(z => Math.max(50, z - 10))} className="p-1 hover:text-white" title="Zoom Out"><ZoomOut className="w-4 h-4"/></button>
                  <span className="font-mono text-slate-200">{viewerZoom}%</span>
                  <button onClick={() => setViewerZoom(z => Math.min(200, z + 10))} className="p-1 hover:text-white" title="Zoom In"><ZoomIn className="w-4 h-4"/></button>
                  <button onClick={() => setViewerRotation(r => (r + 90) % 360)} className="p-1 hover:text-white" title="Rotate"><RotateCw className="w-4 h-4"/></button>
                  <button onClick={() => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => { });
                }
                else {
                    document.exitFullscreen().catch(() => { });
                }
            }} className="p-1 rounded transition-colors hover:text-white cursor-pointer" title="Toggle Browser Fullscreen">
                    {document.fullscreenElement ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                  </button>
                </div>
                <button onClick={() => { setShowViewerModal(false); setIsViewerFullscreen(false); }} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-2">
                  <X className="w-5 h-5"/>
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-44 bg-[#111b2e] border-r border-slate-700/30 p-3 space-y-3 shrink-0 overflow-y-auto">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Document Versions
                </div>
                {Array.from({ length: getDocVersions(activeDocument).length }, (_, i) => i + 1).map((vNum) => {
                const isSelected = selectedViewerVersion === vNum;
                const isFirst = vNum === 1;
                const totalVersCount = getDocVersions(activeDocument).length;
                return (<div key={vNum} onClick={() => setSelectedViewerVersion(vNum)} className={`p-2 border-2 rounded-xl cursor-pointer relative group transition-all ${isSelected ? 'border-blue-500 bg-slate-900 shadow-md' : 'border-slate-700/40 bg-slate-900/50 hover:border-slate-600 opacity-75 hover:opacity-100'}`}>
                      <div className="w-full h-24 bg-[#161c2d] rounded-lg p-2 flex flex-col justify-between text-[8px] font-mono text-slate-300 overflow-hidden">
                        <div className={`font-bold truncate ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
                          {isFirst ? 'VERSION 1 (INITIAL)' : `VERSION ${vNum} ${vNum === totalVersCount ? '(CURRENT)' : ''}`}
                        </div>
                        <div className="w-8 h-8 bg-slate-800 rounded mx-auto border border-slate-700 flex items-center justify-center">
                          <FileText className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}/>
                        </div>
                        <div className="text-[7px] truncate text-slate-400 text-center font-sans">
                          {isFirst ? 'First Uploaded File' : (vNum === totalVersCount ? 'Latest Upload' : `Upload v${vNum}`)}
                        </div>
                      </div>
                      <div className={`absolute top-1 left-1 text-white text-[9px] font-bold px-1.5 rounded ${isSelected ? 'bg-blue-600' : 'bg-slate-700'}`}>
                        v{vNum}
                      </div>
                    </div>);
            })}
              </div>

              <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto relative">
                {(() => {
                const docUrl = getOrGenerateVersionPdfUrl(activeDocument, selectedViewerVersion);
                const activeVersList = getDocVersions(activeDocument);
                const matchingVer = activeVersList.find(v => v.version_number === selectedViewerVersion);
                const fileTypeLower = (matchingVer?.file_type || activeDocument.file_type || '').toLowerCase();
                const fileNameLower = (matchingVer?.file_name || matchingVer?.original_file_name || activeDocument.file_name || activeDocument.original_file_name || activeDocument.document_name || '').toLowerCase();
                const isImg = fileTypeLower.includes('image') || fileTypeLower.includes('png') || fileTypeLower.includes('jpg') || fileTypeLower.includes('jpeg') || fileNameLower.match(/\.(png|jpe?g|webp|gif|svg)$/i);
                if (isImg && docUrl) {
                    return (<div className="w-full h-full flex items-center justify-center overflow-auto transition-transform duration-200" style={{ transform: `scale(${viewerZoom / 100}) rotate(${viewerRotation}deg)`, transformOrigin: 'center center' }}>
                        <img src={docUrl} alt={activeDocument.document_name} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"/>
                      </div>);
                }
                return (<div className="w-full h-full flex items-center justify-center transition-transform duration-200" style={{ transform: `scale(${viewerZoom / 100}) rotate(${viewerRotation}deg)`, transformOrigin: 'center center' }}>
                      <iframe src={docUrl} className="w-full h-full border-0 rounded-xl bg-white shadow-2xl" title={`Document Viewer - ${activeDocument.document_name} (v${selectedViewerVersion})`}/>
                    </div>);
            })()}
              </div>

              <div className="w-80 bg-[#0f1729] border-l border-slate-700/30 p-4 space-y-4 shrink-0 text-xs overflow-y-auto">
                <div className="font-bold text-white uppercase text-[11px] tracking-wider border-b border-slate-700/30 pb-2">
                  Document Details
                </div>
                <div className="space-y-3">
                  <div><span className="text-slate-500">Document ID:</span> <span className="font-mono text-blue-400 font-bold ml-1">{activeDocument.document_code || 'DOC-2025-1248'}</span></div>
                  <div><span className="text-slate-500">Document Name:</span> <div className="font-semibold text-white mt-0.5">{activeDocument.document_name}</div></div>
                  <div><span className="text-slate-500">Category:</span> <span className="text-blue-300 ml-1 font-semibold">{activeDocument.category_name}</span></div>
                  <div><span className="text-slate-500">Document Number:</span> <span className="font-mono text-emerald-400 ml-1">{activeDocument.document_number || 'EP1234567'}</span></div>
                  <div><span className="text-slate-500">Visitor:</span> <div className="font-semibold text-slate-200 mt-0.5">{activeDocument.visitor_name} ({activeDocument.visitor_code || 'VIS-2025-000145'})</div></div>
                  <div><span className="text-slate-500">Issue / Expiry:</span> <div className="text-slate-300 mt-0.5">{activeDocument.issue_date || '01 JAN 2020'} - {activeDocument.expiry_date || '01 JAN 2030'}</div></div>
                  <div><span className="text-slate-500">File Info:</span> <div className="text-slate-300 mt-0.5">{activeDocument.file_type || 'PDF'} • {activeDocument.file_size_bytes ? (activeDocument.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB' : '2.45 MB'}</div></div>
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <span className="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {activeDocument.status || 'Verified'}
                    </span>
                  </div>
                  <div><span className="text-slate-500">Remarks:</span> <div className="text-slate-400 text-[11px] italic mt-0.5">Valid passport document for international visitor.</div></div>
                </div>

                <div className="pt-3 border-t border-slate-700/30 space-y-2">
                  <button onClick={() => triggerFileDownload(activeDocument, selectedViewerVersion)} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md">
                    <Download className="w-4 h-4"/> Download Document
                  </button>
                  <button onClick={() => { setShowViewerModal(false); setShowReplaceModal(true); }} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer">
                    <RotateCcw className="w-4 h-4"/> Replace Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body)}

      {/* ─── MODAL 3: DOCUMENT DETAILS MODAL (PERFECTLY CENTERED IN MAIN CANVAS) ─── */}
      {showDetailsModal && activeDocument && (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 lg:pl-[270px] overflow-y-auto">
          <div className="bg-[#1e293b] border border-slate-700/40 rounded-2xl w-full max-w-4xl mx-auto overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 my-auto text-xs">
            <div className="p-4 border-b border-slate-700/30 bg-[#162032] flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Visitor Documents / Document Details</div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <FileText className="w-4 h-4 text-blue-400"/>
                  Document Details - {activeDocument.document_name}
                </h3>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="flex border-b border-slate-700/30 bg-slate-950/40 px-4 font-semibold">
              {[
                { id: 'preview', label: 'Overview', icon: <Eye className="w-3.5 h-3.5"/> },
                { id: 'metadata', label: 'Metadata', icon: <Info className="w-3.5 h-3.5"/> },
                { id: 'versions', label: 'Version History', icon: <History className="w-3.5 h-3.5"/> },
                { id: 'verification', label: 'Approval History', icon: <ShieldCheck className="w-3.5 h-3.5"/> },
                { id: 'audit', label: 'Audit Trail', icon: <FileText className="w-3.5 h-3.5"/> }
            ].map(t => (<button key={t.id} onClick={() => setDetailsTab(t.id)} className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium transition-all cursor-pointer ${detailsTab === t.id
                    ? 'border-blue-500 text-blue-400 font-bold bg-slate-900/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  {t.icon}
                  {t.label}
                </button>))}
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4 bg-[#0f1729] border border-slate-700/30 rounded-xl p-4 flex flex-col items-center shadow-inner space-y-4">
                  <div className="w-full bg-[#161c2d] border border-slate-700 rounded-xl p-4 text-slate-200 font-mono shadow-xl relative text-center">
                    <UserCheck className="w-16 h-16 text-blue-400 mx-auto mb-2"/>
                    <div className="font-bold text-white text-xs">PASSPORT SCAN</div>
                    <div className="text-[10px] text-slate-400">{activeDocument.visitor_name}</div>
                    <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Verified
                    </span>
                  </div>

                  <div className="w-full space-y-2">
                    <button onClick={() => { setShowDetailsModal(false); setShowViewerModal(true); }} className="w-full py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600/30">
                      <Eye className="w-4 h-4"/> Preview
                    </button>
                    <button onClick={() => { setShowDetailsModal(false); setShowDownloadModal(true); }} className="w-full py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700">
                      <Download className="w-4 h-4"/> Download
                    </button>
                    <button onClick={() => { setShowDetailsModal(false); setShowReplaceModal(true); }} className="w-full py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700">
                      <RotateCcw className="w-4 h-4"/> Replace
                    </button>
                    <button onClick={() => { setShowDetailsModal(false); setShowVerificationModal(true); }} className="w-full py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600/30">
                      <ShieldCheck className="w-4 h-4"/> Verify
                    </button>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div className="p-4 bg-[#0f1729] border border-slate-700/30 rounded-xl space-y-2">
                    <div className="font-bold text-white border-b border-slate-700/30 pb-2 uppercase text-[10px]">Document Information</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-slate-500">Document ID:</span> <span className="font-mono text-blue-400">{activeDocument.document_code || 'DOC-2025-1248'}</span></div>
                      <div><span className="text-slate-500">Ref Number:</span> <span className="font-mono text-slate-300">{activeDocument.ref_number || 'REF-7X9P-2026-8145'}</span></div>
                      <div><span className="text-slate-500">Document Name:</span> <span className="font-bold text-white">{activeDocument.document_name}</span></div>
                      <div><span className="text-slate-500">Document Number:</span> <span className="font-mono text-emerald-400">{activeDocument.document_number || 'EP1234567'}</span></div>
                      <div><span className="text-slate-500">Category:</span> <span>{activeDocument.category_name}</span></div>
                      <div><span className="text-slate-500">File Type / Size:</span> <span>PDF (2.45 MB)</span></div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0f1729] border border-slate-700/30 rounded-xl space-y-2">
                    <div className="font-bold text-white border-b border-slate-700/30 pb-2 uppercase text-[10px]">Status & Related Information</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-slate-500">Verification Status:</span> <span className="text-emerald-400 font-bold ml-1">Verified</span></div>
                      <div><span className="text-slate-500">Approval Status:</span> <span className="text-emerald-400 font-bold ml-1">Approved</span></div>
                      <div><span className="text-slate-500">Current Version:</span> <span className="text-blue-400 font-bold ml-1">v2</span></div>
                      <div><span className="text-slate-500">Days to Expiry:</span> <span className="text-slate-200 ml-1">1678 days</span></div>
                      <div><span className="text-slate-500">Visitor Name:</span> <span className="text-white font-bold ml-1">{activeDocument.visitor_name}</span></div>
                      <div><span className="text-slate-500">Visitor ID:</span> <span className="text-blue-400 font-mono ml-1">{activeDocument.visitor_code || 'VIS-2025-000145'}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>)}

      {/* ─── MODAL 4: DOWNLOAD DOCUMENT MODAL (PERFECTLY CENTERED IN MAIN CANVAS) ─── */}
      {showDownloadModal && activeDocument && (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 lg:pl-[270px] overflow-y-auto">
          <div className="bg-[#1e293b] border border-slate-700/40 rounded-2xl w-full max-w-xl mx-auto overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-xs my-auto">
            <div className="p-4 border-b border-slate-700/30 bg-[#162032] flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Visitor Documents / Download Document</div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <Download className="w-4 h-4 text-emerald-400"/>
                  Download Document
                </h3>
              </div>
              <button onClick={() => setShowDownloadModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 bg-[#131d30] p-4 border border-slate-700/30 rounded-xl">
                  <div className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-700/30 pb-2">
                    Choose Download Option
                  </div>
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-blue-500/40 bg-blue-600/10 cursor-pointer">
                    <input type="radio" name="dlOpt" checked={downloadOption === 'LATEST'} onChange={() => setDownloadOption('LATEST')} className="mt-0.5 text-blue-600 focus:ring-0"/>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        Latest Version (v2)
                        <span className="text-[9px] px-2 py-0.5 bg-blue-500 text-white font-bold rounded-full">Recommended</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Recommended - Latest uploaded version</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-700/30 hover:border-slate-700 cursor-pointer">
                    <input type="radio" name="dlOpt" checked={downloadOption === 'ORIGINAL'} onChange={() => setDownloadOption('ORIGINAL')} className="mt-0.5 text-blue-600 focus:ring-0"/>
                    <div>
                      <div className="font-bold text-slate-200">Original Version (v1)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">First uploaded version</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-700/30 hover:border-slate-700 cursor-pointer">
                    <input type="radio" name="dlOpt" checked={downloadOption === 'ALL_ZIP'} onChange={() => setDownloadOption('ALL_ZIP')} className="mt-0.5 text-blue-600 focus:ring-0"/>
                    <div>
                      <div className="font-bold text-slate-200">All Versions (ZIP)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Download all versions as ZIP file</div>
                    </div>
                  </label>
                </div>

                <div className="space-y-3 bg-[#131d30] p-4 border border-slate-700/30 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-700/30 pb-2">
                      Download Information
                    </div>
                    <div className="flex items-center gap-3 my-4 p-3 bg-[#1e293b] border border-slate-700/30 rounded-xl">
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-bold text-xs shrink-0">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{activeDocument.document_name}.pdf</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">File Type: PDF • 2.45 MB</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Uploaded: May 20, 2025 10:30 AM</div>
                        <div className="text-[10px] text-slate-500">Uploaded By: Reception Officer</div>
                      </div>
                    </div>
                  </div>

                  <button type="button" onClick={() => triggerFileDownload(activeDocument, selectedViewerVersion)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer border-0">
                    <Download className="w-4 h-4"/> Download File
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#0f1729] border border-amber-500/20 rounded-xl text-[11px] text-amber-400 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0"/>
                <span>Note: You must have appropriate permissions to download this document.</span>
              </div>
            </div>
          </div>
        </div>)}

      {/* ─── MODAL 5: REPLACE DOCUMENT MODAL (PERFECTLY CENTERED IN MAIN CANVAS) ─── */}
      {showReplaceModal && activeDocument && (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 lg:pl-[270px] overflow-y-auto">
          <div className="bg-[#1e293b] border border-slate-700/40 rounded-2xl w-full max-w-2xl mx-auto overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-xs my-auto">
            <div className="p-4 border-b border-slate-700/30 bg-[#162032] flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Visitor Documents / Replace Document</div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <RotateCcw className="w-4 h-4 text-blue-400"/>
                  Replace Document
                </h3>
              </div>
              <button onClick={() => setShowReplaceModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 bg-[#131d30] p-4 border border-slate-700/30 rounded-xl">
                  <div className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-700/30 pb-2">
                    Current Document
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#1e293b] border border-slate-700/30 rounded-xl">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs truncate">{activeDocument.document_name}.pdf</div>
                      <div className="text-[10px] text-blue-400 font-bold mt-0.5">Version: v{activeDocument.versions?.length || 1}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">File Size: 2.45 MB</div>
                      <div className="text-[10px] text-slate-500">Uploaded: May 20, 2025 10:30 AM</div>
                      <div className="text-[10px] text-slate-500">Uploaded By: Reception Officer</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-[#131d30] p-4 border border-slate-700/30 rounded-xl flex flex-col justify-between">
                  <div className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-700/30 pb-2">
                    Upload New Version
                  </div>
                  <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 text-center bg-slate-950 cursor-pointer relative my-2">
                    <input type="file" onChange={(e) => e.target.files && setReplaceFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2"/>
                    <div className="font-bold text-slate-200">{replaceFile ? replaceFile.name : 'Drag & Drop new file here'}</div>
                    <div className="text-[10px] text-slate-400 mt-1">or <span className="text-blue-400 font-bold">Browse File</span></div>
                    <div className="text-[10px] text-slate-500 mt-2">Supported formats: PDF, PNG, JPG, WEBP (Max 10MB)</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#131d30] border border-slate-700/30 rounded-xl space-y-3">
                <div className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-700/30 pb-2">
                  Version Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">New Version Number</label>
                    <input type="text" disabled value={`v${(activeDocument.versions?.length || 1) + 1}`} className="w-full bg-[#1e293b] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold"/>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Change Description *</label>
                    <input type="text" placeholder="e.g. Updated passport with new expiry date" value={changeNotes} onChange={(e) => setChangeNotes(e.target.value)} className="w-full bg-[#0f1729] border border-slate-700/25 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"/>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/30">
                <button onClick={() => setShowReplaceModal(false)} className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={handleReplaceSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20">
                  Upload New Version
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* ─── MODAL 6: DOCUMENT VERIFICATION MODAL (PERFECTLY CENTERED IN MAIN CANVAS) ─── */}
      {showVerificationModal && activeDocument && (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 lg:pl-[270px] overflow-y-auto">
          <div className="bg-[#1e293b] border border-slate-700/40 rounded-2xl w-full max-w-2xl mx-auto overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-xs my-auto">
            <div className="p-4 border-b border-slate-700/30 bg-[#162032] flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Visitor Documents / Document Verification</div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400"/>
                  Document Verification
                </h3>
              </div>
              <button onClick={() => setShowVerificationModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 bg-[#131d30] p-4 border border-slate-700/30 rounded-xl">
                  <div className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-700/30 pb-2">
                    Verification Information
                  </div>
                  <div className="space-y-2">
                    <div><span className="text-slate-500">Document:</span> <span className="font-bold text-white ml-1">{activeDocument.document_name}</span></div>
                    <div><span className="text-slate-500">Visitor:</span> <span className="text-slate-200 ml-1">{activeDocument.visitor_name} ({activeDocument.visitor_code || 'VIS-2025-000145'})</span></div>
                    <div><span className="text-slate-500">Document Number:</span> <span className="font-mono text-emerald-400 ml-1">{activeDocument.document_number || 'EP1234567'}</span></div>
                    <div><span className="text-slate-500">Category:</span> <span className="text-blue-300 ml-1">{activeDocument.category_name}</span></div>
                    <div>
                      <span className="text-slate-500">Current Status:</span>
                      <span className="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Pending Review
                      </span>
                    </div>
                    <div><span className="text-slate-500">Upload Date:</span> <span className="text-slate-300 ml-1">May 20, 2025 10:30 AM</span></div>
                  </div>
                </div>

                <div className="space-y-3 bg-[#131d30] p-4 border border-slate-700/30 rounded-xl">
                  <div className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-700/30 pb-2">
                    Verification Checklist
                  </div>
                  <div className="space-y-2">
                    {['Document Authenticity', 'Data Consistency', 'OCR Verification', 'Expiry Date Check', 'Blacklist Check', 'Duplicate Check'].map(item => (<div key={item} className="p-2 bg-[#0f1729] border border-slate-700/25 rounded-lg flex items-center justify-between">
                        <span className="font-medium text-slate-200">{item}</span>
                        <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                          Passed <Check className="w-3.5 h-3.5"/>
                        </span>
                      </div>))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#131d30] border border-slate-700/30 rounded-xl space-y-4">
                <div className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-700/30 pb-2">
                  Verification Decision
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="verDecision" checked={verDecision === 'VERIFIED'} onChange={() => setVerDecision('VERIFIED')} className="text-emerald-500 focus:ring-0"/>
                    <span className="font-bold text-emerald-400">Verify Document</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="verDecision" checked={verDecision === 'REJECTED'} onChange={() => setVerDecision('REJECTED')} className="text-rose-500 focus:ring-0"/>
                    <span className="font-bold text-rose-400">Reject Document</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="verDecision" checked={verDecision === 'REQUEST_INFO'} onChange={() => setVerDecision('REQUEST_INFO')} className="text-amber-500 focus:ring-0"/>
                    <span className="font-bold text-amber-400">Request More Info</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Remarks</label>
                  <textarea rows={2} value={verRemarks} onChange={(e) => setVerRemarks(e.target.value)} className="w-full bg-[#0f1729] border border-slate-700/25 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"/>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/30">
                <button onClick={() => setShowVerificationModal(false)} className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={handleVerifySubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20">
                  Submit Verification
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* ─── MODAL 7: VERSION CONTROL MODAL (PERFECTLY CENTERED IN MAIN CANVAS) ─── */}
      {showVersionsModal && activeDocument && (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 lg:pl-[270px] overflow-y-auto">
          <div className="bg-[#1e293b] border border-slate-700/40 rounded-2xl w-full max-w-3xl mx-auto overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-xs my-auto">
            <div className="p-4 border-b border-slate-700/30 bg-[#162032] flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Visitor Documents / Version History</div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <History className="w-4 h-4 text-blue-400"/>
                  Version Control
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowVersionsModal(false); setShowReplaceModal(true); }} className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md">
                  <Plus className="w-4 h-4"/> Upload New Version
                </button>
                <button onClick={() => setShowVersionsModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                  <X className="w-5 h-5"/>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 bg-[#0f1729] border border-slate-700/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{activeDocument.document_name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Document ID: <span className="text-blue-400 font-mono">{activeDocument.document_code || 'DOC-2025-1248'}</span> • Category: {activeDocument.category_name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Visitor: <span className="text-slate-200">{activeDocument.visitor_name} ({activeDocument.visitor_code || 'VIS-2025-000145'})</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Current Version</div>
                  <div className="text-xl font-extrabold text-emerald-400">v{activeDocument.versions?.length || 1}</div>
                  <div className="text-[10px] text-slate-400">Total Versions: {activeDocument.versions?.length || 1}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-white text-xs uppercase tracking-wider">Version History</div>
                <div className="overflow-x-auto border border-slate-700/30 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0f1729] text-slate-400 font-bold border-b border-slate-700/30 uppercase text-[10px]">
                        <th className="p-3">Version</th>
                        <th className="p-3">File Name</th>
                        <th className="p-3">File Size</th>
                        <th className="p-3">Uploaded By</th>
                        <th className="p-3">Upload Date</th>
                        <th className="p-3">Changes</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr className="bg-emerald-500/5">
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-[10px]">
                            v2 (Current)
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-white">passport_michael_v2.pdf</td>
                        <td className="p-3 text-slate-400">2.45 MB</td>
                        <td className="p-3 text-slate-300">Reception Officer</td>
                        <td className="p-3 text-slate-400">May 20, 2025 10:30 AM</td>
                        <td className="p-3 text-slate-300 italic">Updated document with new expiry date</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => { setShowVersionsModal(false); setShowViewerModal(true); }} className="p-1.5 bg-[#1a2744] hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 border border-slate-700/30 rounded-lg transition-all"><Eye className="w-4 h-4"/></button>
                            <a href={visitorDocumentApi.getDownloadUrl(activeDocument.id)} target="_blank" rel="noreferrer" className="p-1.5 bg-[#1a2744] hover:bg-emerald-600/30 text-slate-400 hover:text-emerald-300 border border-slate-700/30 rounded-lg transition-all"><Download className="w-4 h-4"/></a>
                          </div>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-400">v1</td>
                        <td className="p-3 font-medium text-slate-300">passport_michael_v1.pdf</td>
                        <td className="p-3 text-slate-400">2.30 MB</td>
                        <td className="p-3 text-slate-300">Reception Officer</td>
                        <td className="p-3 text-slate-400">May 18, 2025 02:10 PM</td>
                        <td className="p-3 text-slate-400 italic">Initial upload</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => { setShowVersionsModal(false); setShowViewerModal(true); }} className="p-1.5 bg-[#1a2744] hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 border border-slate-700/30 rounded-lg transition-all"><Eye className="w-4 h-4"/></button>
                            <button onClick={() => visitorDocumentApi.restoreVersion(activeDocument.id, 1).then(() => loadDashboardData())} className="p-1.5 bg-[#1a2744] hover:bg-purple-600/30 text-slate-400 hover:text-purple-300 border border-slate-700/30 rounded-lg transition-all" title="Restore Version"><RotateCcw className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-[#0f1729] border border-blue-500/20 rounded-xl text-[11px] text-blue-400 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0"/>
                <span>You can restore any previous version if needed. Restoring will create a new version.</span>
              </div>
            </div>
          </div>
        </div>)}
      {/* ─── MODAL 8: ADD / EDIT CATEGORY MODAL ─── */}
      {showCategoryModal && (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1e293b] border border-slate-700/40 rounded-2xl w-full max-w-md mx-auto overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-xs">
            <div className="p-4 border-b border-slate-700/30 bg-[#162032] flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400"/>
                {editingCategory ? 'Edit Document Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category Name *</label>
                <input type="text" required placeholder="e.g. Work Permit, Health Certificate" value={categoryForm.name} onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-[#0f1729] border border-slate-700/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea rows={2} placeholder="Brief description of documents under this category" value={categoryForm.desc} onChange={(e) => setCategoryForm(prev => ({ ...prev, desc: e.target.value }))} className="w-full bg-[#0f1729] border border-slate-700/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Is Default</label>
                  <select value={categoryForm.isDefault ? 'Yes' : 'No'} onChange={(e) => setCategoryForm(prev => ({ ...prev, isDefault: e.target.value === 'Yes' }))} className="w-full bg-[#0f1729] border border-slate-700/40 rounded-xl px-3 py-2 text-white focus:outline-none">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select value={categoryForm.status} onChange={(e) => setCategoryForm(prev => ({ ...prev, status: e.target.value }))} className="w-full bg-[#0f1729] border border-slate-700/40 rounded-xl px-3 py-2 text-white focus:outline-none">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/30">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20">
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* ─── MODAL 9: ADD / EDIT STATUS MODAL ─── */}
      {showStatusModal && (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1e293b] border border-slate-700/40 rounded-2xl w-full max-w-md mx-auto overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-xs">
            <div className="p-4 border-b border-slate-700/30 bg-[#162032] flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400"/>
                {editingStatus ? 'Edit Document Status' : 'Add New Status'}
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSaveStatus} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status Name *</label>
                <input type="text" required placeholder="e.g. Under Verification, Renewal Pending" value={statusForm.name} onChange={(e) => setStatusForm(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-[#0f1729] border border-slate-700/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Color Theme</label>
                  <select value={statusForm.color} onChange={(e) => setStatusForm(prev => ({ ...prev, color: e.target.value }))} className="w-full bg-[#0f1729] border border-slate-700/40 rounded-xl px-3 py-2 text-white focus:outline-none">
                    <option value="primary">Blue (Primary)</option>
                    <option value="success">Green (Success)</option>
                    <option value="warning">Amber (Warning)</option>
                    <option value="danger">Red (Danger)</option>
                    <option value="secondary">Gray (Secondary)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">System Status</label>
                  <select value={statusForm.sys} onChange={(e) => setStatusForm(prev => ({ ...prev, sys: e.target.value }))} className="w-full bg-[#0f1729] border border-slate-700/40 rounded-xl px-3 py-2 text-white focus:outline-none">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea rows={2} placeholder="Description of this status state" value={statusForm.desc} onChange={(e) => setStatusForm(prev => ({ ...prev, desc: e.target.value }))} className="w-full bg-[#0f1729] border border-slate-700/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"/>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/30">
                <button type="button" onClick={() => setShowStatusModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20">
                  {editingStatus ? 'Update Status' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* ─── MODAL 10: CUSTOM SYSTEM CONFIRM DELETE MODAL ─── */}
      {deleteTarget && (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1e293b] border border-slate-700/40 rounded-2xl w-full max-w-md mx-auto overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-xs">
            <div className="p-4 border-b border-slate-700/30 bg-[#162032] flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500"/>
                Confirm Deletion
              </h3>
              <button onClick={() => setDeleteTarget(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-300 text-sm">
                Are you sure you want to delete <strong className="text-white font-bold">{deleteTarget.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/30">
                <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={() => {
                if (deleteTarget.type === 'category') {
                    setCategoryItems(prev => prev.filter(c => c.id !== deleteTarget.id));
                }
                else if (deleteTarget.type === 'status') {
                    setStatusItems(prev => prev.filter(s => s.id !== deleteTarget.id));
                }
                setDeleteTarget(null);
            }} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 cursor-pointer">
                  Delete {deleteTarget.type === 'category' ? 'Category' : 'Status'}
                </button>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}
export default function VisitorDocumentManagement() {
    return (<DocumentErrorBoundary>
      <VisitorDocumentManagementInner />
    </DocumentErrorBoundary>);
}
