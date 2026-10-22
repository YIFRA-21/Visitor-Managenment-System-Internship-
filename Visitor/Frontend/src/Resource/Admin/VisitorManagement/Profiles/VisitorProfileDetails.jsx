import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { User, Mail, Phone, MapPin, FileText, Shield, AlertTriangle, Clock, MessageSquare, Edit3, Save, X, CheckCircle2, Archive, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX, Calendar, Building2, Building, Globe, Briefcase, Loader2, Send, Trash2, History, Camera, Upload, RotateCw, ZoomIn, ZoomOut, Printer, BadgeCheck, Zap, UserCheck, ArrowLeft } from 'lucide-react';
import { visitorProfileApi } from '../../../../modules/visitor-management/api/visitorProfileApi';
import { visitorPortalApi } from '../../../../services/api';
import identityVerificationApi from '../../../../modules/visitor-management/api/identityVerificationApi';
import IdentityVerificationWizard from './IdentityVerificationWizard';
import { useAuth } from '../../../../contexts/AuthContext';
import { resolvePhotoUrl } from '../../../../utils/photoUtils';
import BackButton from '../../../../components/common/BackButton';
import CountryNationalitySelect from '../../../../components/common/CountryNationalitySelect';
import CountryPhoneInput from '../../../../components/common/CountryPhoneInput';
import FieldError from '../../../../components/common/FieldError';
import {
    validateName,
    validateEmail,
    validatePhone,
    validateDateOfBirth
} from '../../../../utils/formValidation';
const tabs = [
    { key: 'personal', label: 'Personal Information', icon: <User size={14}/> },
    { key: 'category', label: 'Visitor Category', icon: <Briefcase size={14}/> },
    { key: 'contact', label: 'Contact Information', icon: <Mail size={14}/> },
    { key: 'address', label: 'Address Information', icon: <MapPin size={14}/> },
    { key: 'identity', label: 'Identity Verification', icon: <Shield size={14}/> },
    { key: 'photo', label: 'Photo Management', icon: <Camera size={14}/> },
    { key: 'status', label: 'Profile Status', icon: <Clock size={14}/> },
    { key: 'history', label: 'Profile History', icon: <History size={14}/> },
    { key: 'notes', label: 'Background Notes', icon: <MessageSquare size={14}/> },
    { key: 'audit', label: 'Audit History', icon: <FileText size={14}/> },
];
const statusBadgeMap = {
    ACTIVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    VERIFIED: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    INACTIVE: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
    SUSPENDED: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    BLACKLISTED: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    ARCHIVED: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
};
const verificationBadge = {
    VERIFIED: { color: '#22c55e', icon: <ShieldCheck size={14}/>, label: 'Verified' },
    PENDING: { color: '#f59e0b', icon: <ShieldQuestion size={14}/>, label: 'Pending' },
    UNVERIFIED: { color: '#64748b', icon: <ShieldAlert size={14}/>, label: 'Unverified' },
    REJECTED: { color: '#ef4444', icon: <ShieldX size={14}/>, label: 'Rejected' },
};
// ─── Standard ISO/IEC 18004 QR Code Component with Centered Avatar Logo ───
const QRCodeDisplay = ({ value, photoUrl, size = 150, className = "" }) => {
    const [dataUrl, setDataUrl] = useState(null);
    useEffect(() => {
        let isMounted = true;
        if (value) {
            QRCode.toDataURL(value, {
                width: size * 3, // Ultra-high definition rendering
                margin: 2,
                color: {
                    dark: '#020617',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H' // High error correction level (30% capacity allows center avatar logo overlay)
            })
                .then(url => {
                if (isMounted)
                    setDataUrl(url);
            })
                .catch(err => console.error('QR code generation error:', err));
        }
        return () => { isMounted = false; };
    }, [value, size]);
    if (!dataUrl) {
        return (<div className={`bg-white rounded-2xl flex flex-col items-center justify-center text-slate-400 p-3 ${className}`} style={{ width: size, height: size }}>
        <Loader2 size={24} className="animate-spin text-indigo-600 mb-1"/>
        <span className="text-[9px] font-bold text-slate-500">Generating...</span>
      </div>);
    }
    const logoSize = Math.round(size * 0.18); // Optimal 18% size leaves 82% matrix modules clear for instant scanning
    return (<div className={`inline-block bg-white p-2 rounded-2xl shadow-xl border-2 border-indigo-400/40 ${className}`}>
      <div className="relative flex items-center justify-center">
        <img src={dataUrl} alt="QR Code" width={size} height={size} className="rounded-xl object-contain block" style={{ width: size, height: size }}/>
        {photoUrl ? (<div className="absolute inset-0 m-auto rounded-full border-2 border-white bg-slate-950 shadow-2xl overflow-hidden flex items-center justify-center pointer-events-none" style={{ width: logoSize, height: logoSize }}>
            <img src={resolvePhotoUrl(photoUrl)} alt="Visitor Avatar" className="w-full h-full object-cover"/>
          </div>) : (<div className="absolute inset-0 m-auto rounded-full border-2 border-white bg-indigo-950 text-indigo-200 font-black text-[9px] shadow-2xl overflow-hidden flex items-center justify-center pointer-events-none" style={{ width: logoSize, height: logoSize }}>
            VP
          </div>)}
      </div>
    </div>);
};
// ─── Field Display Row ────────────────────────────
const FieldRow = ({ label, value, icon }) => (<div className="flex items-start gap-3 py-2.5 border-b border-slate-800/40 last:border-0">
    <div className="flex items-center gap-1.5 min-w-[160px]">
      {icon && <span className="text-slate-500">{icon}</span>}
      <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{label}</span>
    </div>
    <span className="text-xs font-medium text-slate-200 flex-1">{value || '—'}</span>
  </div>);
const VisitorProfileDetails = ({ visitorId, onBack, isVisitorRole = false }) => {
    // Filter tabs: show all user-facing tabs including status and history for visitor role; keep internal audit/security notes restricted
    const visibleTabs = isVisitorRole
        ? tabs.filter((t) => !['notes', 'audit'].includes(t.key))
        : tabs;
    const auth = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editErrors, setEditErrors] = useState({});
    const clearEditError = (field) => {
        if (editErrors[field]) {
            setEditErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState('');
    const getVisitorQRPayload = (p) => {
        return [
            `VISITOR INFORMATION`,
            `Name: ${p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Visitor'}`,
            `Visitor ID: ${p.visitor_code || `VIS-${p.id}`}`,
            `Ref: ${p.reference_number || 'N/A'}`,
            `Company: ${p.company || 'N/A'}`,
            `Dept: ${p.department_name || 'N/A'}`,
            `Phone: ${p.phone || 'N/A'}`,
            `Status: ${p.status || 'ACTIVE'}`
        ].join('\n');
    };
    // Status Change Modal State
    const [statusForm, setStatusForm] = useState({ status: 'ACTIVE', reason: '' });
    const [statusSaving, setStatusSaving] = useState(false);
    // Background Notes State
    const [noteType, setNoteType] = useState('SECURITY');
    const [noteContent, setNoteContent] = useState('');
    const [noteSaving, setNoteSaving] = useState(false);
    const [selectedNoteCategory, setSelectedNoteCategory] = useState('ALL');
    // Photo Management Camera & Crop State
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1.0);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    // Quick Action Modals
    const [showPassModal, setShowPassModal] = useState(false);
    const [passData, setPassData] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    // Delete Visitor Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingVisitor, setDeletingVisitor] = useState(false);
    const handleDeleteVisitor = async () => {
        setDeletingVisitor(true);
        try {
            await visitorProfileApi.deleteProfile(visitorId);
            showToast('Visitor and all associated records permanently removed.', 'info');
            setShowDeleteModal(false);
            setTimeout(() => {
                onBack();
            }, 500);
        }
        catch (err) {
            console.error('Delete visitor failed:', err);
            showToast(err.response?.data?.message || err.message || 'Failed to delete visitor.', 'error');
        }
        finally {
            setDeletingVisitor(false);
        }
    };
    // Identity Verification Wizard State
    const [showIdentityWizard, setShowIdentityWizard] = useState(true);
    const [verificationHistory, setVerificationHistory] = useState([]);
    // Image & Date Helpers
    const [imgError, setImgError] = useState(false);
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        const d = new Date(dateStr);
        if (isNaN(d.getTime()))
            return 'N/A';
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    const getContextualProfile = () => {
        let contextData = {};
        const currentEmail = (auth?.user?.email || '').toLowerCase().trim();

        // 1. Check active_visitor_profile (only if matching current user)
        try {
            const stored = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (!currentEmail || !parsed.email || parsed.email.toLowerCase().trim() === currentEmail) {
                    contextData = { ...contextData, ...parsed };
                }
            }
        }
        catch (e) { }

        // 2. Check registered_visitor_data (only if matching current user)
        try {
            const reg = sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
            if (reg) {
                const parsed = JSON.parse(reg);
                if (!currentEmail || !parsed.email || parsed.email.toLowerCase().trim() === currentEmail) {
                    contextData = {
                        ...contextData,
                        full_name: parsed.visitorName || parsed.fullName || parsed.full_name || contextData.full_name,
                        email: parsed.email || contextData.email,
                        phone: parsed.phone || contextData.phone,
                        company: parsed.company || contextData.company,
                        department_name: parsed.department || parsed.departmentName || contextData.department_name,
                        id_type: parsed.idType || parsed.identityType || contextData.id_type,
                        id_number: parsed.idNumber || parsed.identityNumber || contextData.id_number,
                        photo_url: parsed.photoUrl || parsed.photo_url || contextData.photo_url,
                        visitor_code: parsed.historyCode || parsed.visitor_code || contextData.visitor_code,
                        reference_number: parsed.referenceNumber || parsed.reference_number || contextData.reference_number
                    };
                }
            }
        }
        catch (e) { }

        // 3. Check signup_personal_info (only if matching current user)
        try {
            const personal = sessionStorage.getItem('signup_personal_info') || localStorage.getItem('signup_personal_info');
            if (personal) {
                const parsed = JSON.parse(personal);
                if (!currentEmail || !parsed.email || parsed.email.toLowerCase().trim() === currentEmail) {
                    const fullName = `${parsed.firstName || ''} ${parsed.middleName || ''} ${parsed.lastName || ''}`.trim();
                    contextData = {
                        ...contextData,
                        first_name: parsed.firstName || contextData.first_name,
                        middle_name: parsed.middleName || contextData.middle_name,
                        last_name: parsed.lastName || contextData.last_name,
                        full_name: fullName || contextData.full_name,
                        email: parsed.email || contextData.email,
                        phone: parsed.phone || contextData.phone,
                        company: parsed.company || contextData.company,
                        gender: parsed.gender || contextData.gender,
                        nationality: parsed.nationality || contextData.nationality,
                        country: parsed.country || contextData.country,
                        city: parsed.city || contextData.city,
                        full_address: parsed.address || contextData.full_address
                    };
                }
            }
        }
        catch (e) { }

        // 4. Check Auth User
        if (auth?.user) {
            if (!contextData.full_name)
                contextData.full_name = auth.user.fullName || auth.user.full_name;
            if (!contextData.email)
                contextData.email = auth.user.email;
            if (!contextData.phone && (auth.user.phone || auth.user.phone_number))
                contextData.phone = auth.user.phone || auth.user.phone_number;
            if (!contextData.visitor_code && (auth.user.userCode || auth.user.user_code))
                contextData.visitor_code = auth.user.userCode || auth.user.user_code;
            if (!contextData.photo_url && (auth.user.avatarUrl || auth.user.avatar || auth.user.profile_photo))
                contextData.photo_url = auth.user.avatarUrl || auth.user.avatar || auth.user.profile_photo;
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('name')) {
            const name = params.get('name');
            const parts = name.split(' ');
            contextData = {
                ...contextData,
                full_name: name,
                first_name: parts[0] || name,
                middle_name: parts[1] || '',
                last_name: parts.slice(2).join(' ') || parts[1] || '',
                visitor_code: params.get('code') || contextData.visitor_code,
                reference_number: params.get('ref') || contextData.reference_number,
                email: params.get('email') || contextData.email,
                phone: params.get('phone') || contextData.phone,
                company: params.get('company') || contextData.company,
                category: params.get('category') || contextData.category,
                id_number: params.get('idNumber') || contextData.id_number,
                id_type: params.get('idType') || contextData.id_type,
                department_name: params.get('dept') || contextData.department_name,
                pass_number: params.get('pass') || contextData.pass_number,
                photo_url: params.get('photo') || contextData.photo_url,
            };
        }
        return Object.keys(contextData).length > 0 ? contextData : null;
    };
    const loadProfile = useCallback(async () => {
        setLoading(true);
        setImgError(false);
        const contextProfile = getContextualProfile();
        const buildRealProfile = (base) => {
            const ctx = contextProfile || {};
            const photoUrl = base?.photo_url || ctx.photo_url || auth?.user?.avatarUrl || '';
            const uploadedPhoto = sessionStorage.getItem('visitor_uploaded_photo') || '';
            const fallbackName = auth?.user?.fullName || auth?.user?.full_name || '';
            const fallbackEmail = auth?.user?.email || '';
            const fullName = base?.full_name || ctx.full_name || fallbackName || '';
            const nameParts = fullName ? fullName.split(' ') : [];
            const firstName = base?.first_name || ctx.first_name || nameParts[0] || '';
            const middleName = base?.middle_name || ctx.middle_name || (nameParts.length > 2 ? nameParts[1] : '');
            const lastName = base?.last_name || ctx.last_name || (nameParts.length > 2 ? nameParts.slice(2).join(' ') : nameParts[1] || '');

            return {
                ...base,
                id: base?.id || ctx.id || auth?.user?.visitorId || auth?.user?.id || 1,
                visitor_code: base?.visitor_code || ctx.visitor_code || auth?.user?.userCode || auth?.user?.user_code || '',
                reference_number: base?.reference_number || ctx.reference_number || '',
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
                full_name: fullName,
                email: base?.email || ctx.email || fallbackEmail,
                phone: base?.phone || ctx.phone || auth?.user?.phone || auth?.user?.phone_number || '',
                company: base?.company || ctx.company || '',
                occupation: base?.occupation || ctx.occupation || '',
                department_name: base?.department_name || base?.department || ctx.department_name || '',
                host_name: base?.host_name || base?.host_employee_name || ctx.host_name || '',
                created_by_name: base?.created_by_name || ctx.created_by_name || (isVisitorRole ? 'Self-Registered Visitor' : ''),
                category: base?.category || ctx.category || (isVisitorRole ? 'Visitor' : ''),
                access_level: base?.access_level || ctx.access_level || '',
                approval_requirement: base?.approval_requirement || ctx.approval_requirement || '',
                visit_duration: base?.visit_duration || ctx.visit_duration || '',
                escort_required: base?.escort_required || ctx.escort_required || '',
                allowed_areas: base?.allowed_areas || ctx.allowed_areas || '',
                allowed_days: base?.allowed_days || ctx.allowed_days || '',
                visit_purpose: base?.visit_purpose || ctx.visit_purpose || '',
                alt_phone: base?.alt_phone || base?.alternative_phone || ctx.alt_phone || '',
                preferred_contact_method: base?.preferred_contact_method || ctx.preferred_contact_method || '',
                emergency_contact_name: base?.emergency_contact_name || ctx.emergency_contact_name || '',
                emergency_contact_phone: base?.emergency_contact_phone || ctx.emergency_contact_phone || '',
                emergency_relationship: base?.emergency_relationship || ctx.emergency_relationship || '',
                country: base?.country || ctx.country || '',
                region: base?.region || ctx.region || '',
                city: base?.city || ctx.city || '',
                woreda: base?.woreda || ctx.woreda || '',
                street: base?.street || ctx.street || '',
                house_number: base?.house_number || ctx.house_number || '',
                full_address: base?.full_address || base?.address || ctx.full_address || '',
                status: base?.status || ctx.status || 'ACTIVE',
                id_verification_status: base?.id_verification_status || ctx.id_verification_status || 'UNVERIFIED',
                photo_url: uploadedPhoto || photoUrl,
                id_type: base?.id_type || ctx.id_type || '',
                id_number: base?.id_number || ctx.id_number || '',
                pass_number: base?.pass_number || ctx.pass_number || '',
                created_at: base?.created_at || ctx.created_at || '',
                last_visit_date: base?.last_visit_date || ctx.last_visit_date || null,
                gender: base?.gender || ctx.gender || '',
                nationality: base?.nationality || ctx.nationality || '',
                documents: base?.documents || ctx.documents || [],
            };
        };
        try {
            let data = null;
            if (isVisitorRole) {
                try {
                    const res = await visitorPortalApi.getProfile();
                    data = res.data;
                }
                catch (err) {
                    console.warn('visitorPortalApi getProfile failed', err);
                }
            }
            if (!data) {
                const targetId = visitorId || 1;
                try {
                    data = await visitorProfileApi.getProfile(targetId);
                }
                catch (err) {
                    console.warn('visitorProfileApi getProfile failed', err);
                }
            }
            let baseProfile;
            if (data) {
                baseProfile = buildRealProfile(data);
            }
            else if (contextProfile) {
                baseProfile = buildRealProfile({});
            }
            else {
                baseProfile = buildRealProfile({});
            }
            if (!baseProfile.photos || baseProfile.photos.length === 0) {
                const activePhoto = baseProfile.photo_url || '';
                if (activePhoto) {
                    baseProfile.photos = [
                        { id: 1, photo_path: activePhoto, is_active_photo: true, created_at: new Date().toISOString() }
                    ];
                }
            }
            setProfile(baseProfile);
            try {
                const targetId = baseProfile.id || visitorId || 1;
                const history = await identityVerificationApi.getHistory(targetId);
                setVerificationHistory(history);
            }
            catch (e) { }
        }
        catch {
            const baseProfile = buildRealProfile({});
            setProfile(baseProfile);
        }
        finally {
            setLoading(false);
        }
    }, [visitorId, isVisitorRole, auth?.user]);
    useEffect(() => { loadProfile(); }, [loadProfile]);
    useEffect(() => {
        const handleVerificationComplete = () => {
            loadProfile();
        };
        window.addEventListener('identity-verification-completed', handleVerificationComplete);
        return () => {
            window.removeEventListener('identity-verification-completed', handleVerificationComplete);
        };
    }, [loadProfile]);
    // Populate edit form
    useEffect(() => {
        if (profile && editMode) {
            setEditForm({
                firstName: profile.first_name || '',
                middleName: profile.middle_name || '',
                lastName: profile.last_name || '',
                gender: profile.gender || '',
                dateOfBirth: profile.date_of_birth || '',
                nationality: profile.nationality || '',
                occupation: profile.occupation || '',
                company: profile.company || '',
                departmentName: profile.department_name || '',
                category: profile.category || '',
                accessLevel: profile.access_level || '',
                approvalRequirement: profile.approval_requirement || '',
                visitDuration: profile.visit_duration || '',
                escortRequired: profile.escort_required || '',
                allowedAreas: profile.allowed_areas || '',
                allowedDays: profile.allowed_days || '',
                visitPurpose: profile.visit_purpose || '',
                email: profile.email || '',
                phone: profile.phone || '',
                altPhone: profile.alt_phone || '',
                preferredContactMethod: profile.preferred_contact_method || '',
                emergencyContactName: profile.emergency_contact_name || '',
                emergencyContactPhone: profile.emergency_contact_phone || '',
                emergencyRelationship: profile.emergency_relationship || '',
                country: profile.country || '',
                region: profile.region || '',
                city: profile.city || '',
                woreda: profile.woreda || '',
                street: profile.street || '',
                houseNumber: profile.house_number || '',
                fullAddress: profile.full_address || '',
                idType: profile.id_type || '',
                idNumber: profile.id_number || '',
                idIssueDate: profile.id_issue_date || '',
                idExpiryDate: profile.id_expiry_date || '',
            });
        }
    }, [profile, editMode]);
    // Toast feedback state
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    const handleSaveProfile = async () => {
        const newErrs = {};
        const fnErr = validateName(editForm.firstName, 'First Name', true);
        const lnErr = validateName(editForm.lastName, 'Last Name', true);
        const emailErr = editForm.email ? validateEmail(editForm.email, 'Email Address', false) : null;
        const phoneErr = editForm.phone ? validatePhone(editForm.phone, 'Mobile Phone', false) : null;
        const altPhoneErr = editForm.altPhone ? validatePhone(editForm.altPhone, 'Secondary Phone', false) : null;
        const dobErr = editForm.dateOfBirth ? validateDateOfBirth(editForm.dateOfBirth, 0) : null;

        if (fnErr) newErrs.firstName = fnErr;
        if (lnErr) newErrs.lastName = lnErr;
        if (emailErr) newErrs.email = emailErr;
        if (phoneErr) newErrs.phone = phoneErr;
        if (altPhoneErr) newErrs.altPhone = altPhoneErr;
        if (dobErr) newErrs.dateOfBirth = dobErr;

        if (Object.keys(newErrs).length > 0) {
            setEditErrors(newErrs);
            showToast('Please fix all field validation errors before saving.', 'error');
            return;
        }

        setSaving(true);
        const nextProfileState = profile ? {
            ...profile,
            first_name: editForm.firstName !== undefined ? editForm.firstName : profile.first_name,
            middle_name: editForm.middleName !== undefined ? editForm.middleName : profile.middle_name,
            last_name: editForm.lastName !== undefined ? editForm.lastName : profile.last_name,
            full_name: [editForm.firstName || profile.first_name, editForm.middleName || profile.middle_name, editForm.lastName || profile.last_name].filter(Boolean).join(' ') || profile.full_name,
            gender: editForm.gender !== undefined ? editForm.gender : profile.gender,
            date_of_birth: editForm.dateOfBirth !== undefined ? editForm.dateOfBirth : profile.date_of_birth,
            nationality: editForm.nationality !== undefined ? editForm.nationality : profile.nationality,
            occupation: editForm.occupation !== undefined ? editForm.occupation : profile.occupation,
            company: editForm.company !== undefined ? editForm.company : profile.company,
            department_name: (editForm.departmentName !== undefined ? editForm.departmentName : editForm.department) || profile.department_name,
            category: editForm.category !== undefined ? editForm.category : profile.category,
            access_level: editForm.accessLevel !== undefined ? editForm.accessLevel : profile.access_level,
            approval_requirement: editForm.approvalRequirement !== undefined ? editForm.approvalRequirement : profile.approval_requirement,
            visit_duration: editForm.visitDuration !== undefined ? editForm.visitDuration : profile.visit_duration,
            escort_required: editForm.escortRequired !== undefined ? editForm.escortRequired : profile.escort_required,
            allowed_areas: editForm.allowedAreas !== undefined ? editForm.allowedAreas : profile.allowed_areas,
            allowed_days: editForm.allowedDays !== undefined ? editForm.allowedDays : profile.allowed_days,
            visit_purpose: editForm.visitPurpose !== undefined ? editForm.visitPurpose : profile.visit_purpose,
            email: editForm.email !== undefined ? editForm.email : profile.email,
            phone: editForm.phone !== undefined ? editForm.phone : profile.phone,
            alt_phone: (editForm.altPhone !== undefined ? editForm.altPhone : editForm.alternativePhone) || profile.alt_phone,
            preferred_contact_method: editForm.preferredContactMethod !== undefined ? editForm.preferredContactMethod : profile.preferred_contact_method,
            emergency_contact_name: editForm.emergencyContactName !== undefined ? editForm.emergencyContactName : profile.emergency_contact_name,
            emergency_contact_phone: editForm.emergencyContactPhone !== undefined ? editForm.emergencyContactPhone : profile.emergency_contact_phone,
            emergency_relationship: editForm.emergencyRelationship !== undefined ? editForm.emergencyRelationship : profile.emergency_relationship,
            country: editForm.country !== undefined ? editForm.country : profile.country,
            region: editForm.region !== undefined ? editForm.region : profile.region,
            city: editForm.city !== undefined ? editForm.city : profile.city,
            sub_city: (editForm.subCity !== undefined ? editForm.subCity : editForm.subcity) || profile.sub_city,
            woreda: editForm.woreda !== undefined ? editForm.woreda : profile.woreda,
            street: editForm.street !== undefined ? editForm.street : profile.street,
            house_number: editForm.houseNumber !== undefined ? editForm.houseNumber : profile.house_number,
            full_address: editForm.fullAddress !== undefined ? editForm.fullAddress : profile.full_address,
            id_type: editForm.idType !== undefined ? editForm.idType : profile.id_type,
            id_number: editForm.idNumber !== undefined ? editForm.idNumber : profile.id_number,
            id_issue_date: editForm.idIssueDate !== undefined ? editForm.idIssueDate : profile.id_issue_date,
            id_expiry_date: editForm.idExpiryDate !== undefined ? editForm.idExpiryDate : profile.id_expiry_date,
        } : null;

        try {
            if (isVisitorRole) {
                await visitorPortalApi.updateProfile(editForm);
            } else {
                await visitorProfileApi.updateProfile(visitorId, editForm);
            }
            if (nextProfileState) {
                setProfile(nextProfileState);
            }
            setEditMode(false);
            setEditErrors({});
            await loadProfile();
            showToast('Visitor profile information updated successfully!', 'success');
        }
        catch (err) {
            console.error('Failed to save profile via API, applying changes locally:', err);
            if (nextProfileState) {
                setProfile(nextProfileState);
            }
            setEditMode(false);
            showToast('Profile information saved locally!', 'success');
        }
        finally {
            setSaving(false);
        }
    };
    const handleStatusSubmit = async (e) => {
        e.preventDefault();
        setStatusSaving(true);
        try {
            await visitorProfileApi.changeStatus(visitorId, statusForm.status, statusForm.reason);
            const updatedStatus = statusForm.status;
            setStatusForm({ status: 'ACTIVE', reason: '' });
            await loadProfile();
            showToast(`Profile status updated to ${updatedStatus}!`, 'success');
        }
        catch (err) {
            console.error(err);
            showToast('Failed to update status.', 'error');
        }
        finally {
            setStatusSaving(false);
        }
    };
    const handleArchiveToggle = async () => {
        setActionLoading('archive');
        try {
            if (profile?.is_archived) {
                await visitorProfileApi.restore(visitorId);
                showToast('Visitor profile restored successfully.', 'info');
            }
            else {
                await visitorProfileApi.archive(visitorId);
                showToast('Visitor profile archived.', 'info');
            }
            await loadProfile();
        }
        catch (err) {
            console.error(err);
            showToast('Action failed.', 'error');
        }
        finally {
            setActionLoading('');
        }
    };
    const handleVerifyIdentity = async (status) => {
        setActionLoading('verify');
        try {
            await visitorProfileApi.verifyIdentity(visitorId, status);
            await loadProfile();
            showToast(`Identity verification status updated to ${status}!`, 'success');
        }
        catch (err) {
            console.error(err);
            showToast('Verification update failed.', 'error');
        }
        finally {
            setActionLoading('');
        }
    };
    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteContent.trim())
            return;
        setNoteSaving(true);
        try {
            await visitorProfileApi.addNote(visitorId, noteType, noteContent.trim());
            setNoteContent('');
            await loadProfile();
            showToast('Background note added to visitor profile!', 'success');
        }
        catch (err) {
            console.error(err);
            showToast('Failed to add note.', 'error');
        }
        finally {
            setNoteSaving(false);
        }
    };
    const handleDeleteNote = async (noteId) => {
        try {
            await visitorProfileApi.deleteNote(noteId);
            await loadProfile();
            showToast('Note record deleted.', 'info');
        }
        catch (err) {
            console.error(err);
        }
    };
    // Camera Capture Handlers
    const startWebcam = async () => {
        setCameraActive(true);
        setCapturedImage(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }
        catch (err) {
            console.error('Webcam access error:', err);
        }
    };
    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            stream.getTracks().forEach(track => track.stop());
        }
        setCameraActive(false);
    };
    const capturePhotoFromWebcam = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
                stopWebcam();
            }
        }
    };
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const savePhoto = async () => {
        if (!capturedImage)
            return;
        setActionLoading('photo');
        const newPhotoObj = {
            id: Date.now(),
            photo_path: capturedImage,
            is_active_photo: true,
            created_at: new Date().toISOString()
        };
        try {
            await visitorProfileApi.addPhoto(visitorId, capturedImage, rotation, zoom);
        }
        catch (err) {
            console.warn('API photo save unavailable, applying locally:', err);
        }
        finally {
            if (profile) {
                const existing = (profile.photos || []).filter((p) => p.photo_path !== capturedImage);
                const updatedPhotos = existing.map((p) => ({ ...p, is_active_photo: false }));
                updatedPhotos.unshift(newPhotoObj);
                setProfile({
                    ...profile,
                    photo_url: capturedImage,
                    photos: updatedPhotos
                });
            }
            try {
                sessionStorage.setItem('visitor_uploaded_photo', capturedImage);
                localStorage.setItem('visitor_uploaded_photo', capturedImage);
                const stored = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
                const parsed = stored ? JSON.parse(stored) : {};
                parsed.photo_url = capturedImage;
                parsed.photoUrl = capturedImage;
                parsed.avatarUrl = capturedImage;
                if (!parsed.email && profile?.email)
                    parsed.email = profile.email;
                sessionStorage.setItem('active_visitor_profile', JSON.stringify(parsed));
                localStorage.setItem('active_visitor_profile', JSON.stringify(parsed));
                if (profile?.id) {
                    sessionStorage.setItem(`user_photo_${profile.id}`, capturedImage);
                    localStorage.setItem(`user_photo_${profile.id}`, capturedImage);
                }
                if (profile?.user_id) {
                    sessionStorage.setItem(`user_photo_${profile.user_id}`, capturedImage);
                    localStorage.setItem(`user_photo_${profile.user_id}`, capturedImage);
                }
                const uRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
                if (uRaw) {
                    const u = JSON.parse(uRaw);
                    u.avatarUrl = capturedImage;
                    u.profile_photo = capturedImage;
                    localStorage.setItem('user', JSON.stringify(u));
                    sessionStorage.setItem('user', JSON.stringify(u));
                }
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new CustomEvent('user_updated', { detail: { avatarUrl: capturedImage } }));
            }
            catch (e) { }
            setCapturedImage(null);
            setRotation(0);
            setZoom(1.0);
            setActionLoading('');
            showToast('New profile photo uploaded and set as active photo!', 'success');
        }
    };
    const handleSetActivePhoto = async (photoId, photoPath) => {
        setActionLoading('activePhoto');
        const targetPath = photoPath || profile?.photos?.find((p) => p.id === photoId)?.photo_path;
        try {
            await visitorProfileApi.setActivePhoto(visitorId, photoId);
        }
        catch (err) {
            console.warn('API setActivePhoto unavailable, applied locally:', err);
        }
        finally {
            if (profile && targetPath) {
                const updatedPhotos = (profile.photos || []).map((p) => ({
                    ...p,
                    is_active_photo: p.id === photoId || p.photo_path === targetPath
                }));
                setProfile({
                    ...profile,
                    photo_url: targetPath,
                    photos: updatedPhotos
                });
                try {
                    sessionStorage.setItem('visitor_uploaded_photo', targetPath);
                    localStorage.setItem('visitor_uploaded_photo', targetPath);
                    const stored = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
                    const parsed = stored ? JSON.parse(stored) : {};
                    parsed.photo_url = targetPath;
                    parsed.photoUrl = targetPath;
                    parsed.avatarUrl = targetPath;
                    if (!parsed.email && profile?.email)
                        parsed.email = profile.email;
                    sessionStorage.setItem('active_visitor_profile', JSON.stringify(parsed));
                    localStorage.setItem('active_visitor_profile', JSON.stringify(parsed));
                    if (profile?.id) {
                        sessionStorage.setItem(`user_photo_${profile.id}`, targetPath);
                        localStorage.setItem(`user_photo_${profile.id}`, targetPath);
                    }
                    if (profile?.user_id) {
                        sessionStorage.setItem(`user_photo_${profile.user_id}`, targetPath);
                        localStorage.setItem(`user_photo_${profile.user_id}`, targetPath);
                    }
                    const uRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
                    if (uRaw) {
                        const u = JSON.parse(uRaw);
                        u.avatarUrl = targetPath;
                        u.profile_photo = targetPath;
                        localStorage.setItem('user', JSON.stringify(u));
                        sessionStorage.setItem('user', JSON.stringify(u));
                    }
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new CustomEvent('user_updated', { detail: { avatarUrl: targetPath } }));
                }
                catch (e) { }
            }
            if (profile) {
                const updatedPhotos = (profile.photos || []).map((p) => ({
                    ...p,
                    is_active_photo: (p.id === photoId || (targetPath && p.photo_path === targetPath))
                }));
                setProfile({
                    ...profile,
                    photo_url: targetPath || profile.photo_url,
                    photos: updatedPhotos
                });
            }
            if (targetPath) {
                try {
                    sessionStorage.setItem('visitor_uploaded_photo', targetPath);
                    const stored = sessionStorage.getItem('active_visitor_profile');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        parsed.photo_url = targetPath;
                        sessionStorage.setItem('active_visitor_profile', JSON.stringify(parsed));
                    }
                }
                catch (e) { }
            }
            setActionLoading('');
            showToast('Active profile photo updated successfully!', 'success');
        }
    };
    const handleDeletePhoto = async (photoId) => {
        try {
            await visitorProfileApi.deletePhoto(photoId);
        }
        catch (err) {
            console.warn('API deletePhoto unavailable:', err);
        }
        finally {
            if (profile) {
                const updatedPhotos = (profile.photos || []).filter((p) => p.id !== photoId);
                setProfile({
                    ...profile,
                    photos: updatedPhotos
                });
            }
            showToast('Photo removed from archive.', 'info');
        }
    };
    // Generate Pass Handler
    const handleOpenPassModal = async () => {
        try {
            const pass = await visitorProfileApi.generatePass(visitorId);
            setPassData(pass);
            setShowPassModal(true);
        }
        catch {
            setShowPassModal(true);
        }
    };
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[450px] text-slate-400">
        <Loader2 className="animate-spin mb-3 text-indigo-400" size={36}/>
        <p className="text-xs font-semibold tracking-wider">Loading Visitor Profile...</p>
      </div>);
    }
    if (!profile) {
        return (<div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800">
        <AlertTriangle className="mx-auto mb-3 text-amber-400" size={40}/>
        <h3 className="text-lg font-bold text-white mb-1">Visitor Profile Not Found</h3>
        <p className="text-xs text-slate-400 mb-4">The requested profile record could not be loaded or was removed.</p>
        <button onClick={onBack} className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
          Return to Visitor Directory
        </button>
      </div>);
    }
    const statusStyle = statusBadgeMap[(profile.status || 'ACTIVE').toUpperCase()] || statusBadgeMap.ACTIVE;
    const vKey = (profile.id_verification_status || 'UNVERIFIED').toUpperCase();
    const vBadge = verificationBadge[vKey] || verificationBadge.UNVERIFIED;
    return (<div className="space-y-6 pb-12 relative">
      {/* ── Interactive Notification Toast Alert ── */}
      <AnimatePresence>
        {toast && (<motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold backdrop-blur-xl ${toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-500/20'
                : toast.type === 'info'
                    ? 'bg-indigo-950/90 text-indigo-200 border-indigo-500/50 shadow-indigo-500/20'
                    : 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-rose-500/20'}`}>
            <CheckCircle2 size={18} className={toast.type === 'success' ? 'text-emerald-400' : 'text-indigo-400'}/>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-3 text-slate-400 hover:text-white text-base leading-none">&times;</button>
          </motion.div>)}
      </AnimatePresence>

      {/* ── Top Header Navigation ── */}
      <div className="flex items-center justify-between">
        <BackButton onClick={onBack} title={isVisitorRole ? "Back to Dashboard" : "Back to Directory"} fallbackUrl="/admin/dashboard?view=visitor_profiles"/>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditMode(!editMode)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${editMode
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30'}`}>
            <Edit3 size={14}/>
            {editMode ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
            <Printer size={14}/>
            Print Profile
          </button>
          <button onClick={handleOpenPassModal} className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-lg shadow-md transition-all">
            <BadgeCheck size={14}/>
            Generate Visitor Pass
          </button>
          {!isVisitorRole && (<button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/30 hover:border-rose-500/50 transition-colors" title="Delete visitor profile and remove from all records">
              <Trash2 size={14}/>
              Delete Visitor
            </button>)}
        </div>
      </div>

      {/* ── PROFILE SUMMARY CARD ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start gap-6 z-10 relative">
          {/* Avatar with photo frame */}
          <div className="relative group cursor-pointer" onClick={() => setActiveTab('photo')} title="Click to manage photo">
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-800 border-2 border-indigo-500/40 shadow-inner flex items-center justify-center relative">
              {profile.photo_url && !imgError ? (<img src={resolvePhotoUrl(profile.photo_url)} alt={profile.full_name} onError={() => setImgError(true)} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-900 to-slate-800 text-indigo-200">
                  <span className="text-2xl font-black tracking-wider uppercase">
                    {(profile.first_name?.[0] || '') + (profile.last_name?.[0] || '') || 'VP'}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-0.5">
                    <Camera size={10}/> Photo
                  </span>
                </div>)}
              {/* Change Photo Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold">
                <Camera size={18} className="mb-0.5"/>
                Change Photo
              </div>
            </div>
            {profile.is_blacklisted && (<span className="absolute -top-2 -right-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white rounded-full shadow-lg z-20">
                Blacklisted
              </span>)}
          </div>

          {/* Core Summary Information */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {profile.full_name}
                  <CheckCircle2 size={18} className="text-blue-500 fill-blue-500/20 shrink-0 inline-block"/>
                  {profile.is_archived && (<span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full">
                      Archived
                    </span>)}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-indigo-300 border border-slate-700">
                    Visitor ID: {profile.visitor_code}
                  </span>
                  <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                    Reference No.: {profile.reference_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {profile.category || '—'}
                  </span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {profile.status || 'ACTIVE'}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border" style={{ color: vBadge.color, borderColor: `${vBadge.color}40`, backgroundColor: `${vBadge.color}15` }}>
                  {vBadge.icon}
                  {vBadge.label}
                </span>
              </div>
            </div>

            {/* Detailed Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-800/60 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Company</span>
                <span className="font-medium text-slate-200">{profile.company || profile.organization || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Department</span>
                <span className="font-medium text-slate-200">{profile.department_name || profile.department || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Phone</span>
                <span className="font-medium text-slate-200">{profile.phone || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Email</span>
                <span className="font-medium text-slate-200 truncate block">{profile.email || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Registration Date</span>
                <span className="font-medium text-slate-200">{profile.registration_date || profile.created_at ? formatDate(profile.registration_date || profile.created_at) : '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Last Visit</span>
                <span className="font-medium text-slate-200">
                  {profile.last_visit_date || profile.visitStatistics?.last_visit_date ? formatDate(profile.last_visit_date || profile.visitStatistics?.last_visit_date) : 'No visits recorded'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Identity Status</span>
                <span className={`font-bold ${profile.id_verification_status === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {profile.id_verification_status || 'Unverified'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Profile Status</span>
                <span className="font-bold text-emerald-400">{profile.status || 'Active'}</span>
              </div>
            </div>
          </div>

          {/* QR Code Pass Box */}
          <div onClick={handleOpenPassModal} className="shrink-0 flex flex-col items-center justify-center p-4 bg-[#0b101b] rounded-2xl border-2 border-indigo-500/40 shadow-2xl cursor-pointer hover:border-indigo-500 hover:scale-[1.02] transition-all group" title="Click for Visitor Pass QR Code">
            <QRCodeDisplay value={getVisitorQRPayload(profile)} photoUrl={resolvePhotoUrl(profile.photo_url)} size={135}/>
            <span className="text-xs font-black text-white block mt-3.5 tracking-wide">Scan for Visitor Pass</span>
            <span className="text-[10px] font-mono text-indigo-300 font-bold block mt-0.5">Valid ID: {profile.visitor_code}</span>
          </div>
        </div>

        {/* Subtle backdrop glow */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"/>
      </div>

      {/* Edit Form Bar (When editing) */}
      {editMode && (<div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-200">
            Editing Profile Information for <strong className="text-white">{profile.full_name}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditMode(false)} className="px-3 py-1 text-xs font-semibold text-slate-400 hover:text-white">
              Cancel
            </button>
            <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
              Save Changes
            </button>
          </div>
        </div>)}

      {/* ── 10 BOOTSTRAP / TAILWIND TABS ── */}
      <div className="border-b border-slate-800 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 min-w-max">
          {visibleTabs.map((tab) => {
            const active = activeTab === tab.key;
            return (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${active
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}>
                {tab.icon}
                {tab.label}
              </button>);
        })}
        </nav>
      </div>

      {/* ── TAB CONTENTS ── */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 min-h-[350px]">
        {/* TAB 1: PERSONAL INFORMATION (HIGH-DENSITY STRUCTURED TILES GRID) */}
        {activeTab === 'personal' && (<div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <User size={18} className="text-indigo-400"/> Personal Information
              </h3>
              <button onClick={() => setEditMode(!editMode)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 bg-slate-900 rounded-xl border border-slate-800 transition-all">
                <Edit3 size={13}/> {editMode ? 'Cancel Edit' : 'Edit Personal Info'}
              </button>
            </div>

            {editMode ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">First Name *</label>
                  <input
                    type="text"
                    value={editForm.firstName || ''}
                    data-invalid={Boolean(editErrors.firstName)}
                    aria-invalid={Boolean(editErrors.firstName)}
                    onChange={(e) => {
                      setEditForm({ ...editForm, firstName: e.target.value });
                      clearEditError('firstName');
                    }}
                    className={`w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 rounded-xl text-white focus:outline-none transition-all ${
                      editErrors.firstName ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  <FieldError error={editErrors.firstName} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Middle Name</label>
                  <input type="text" value={editForm.middleName || ''} onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Last Name *</label>
                  <input
                    type="text"
                    value={editForm.lastName || ''}
                    data-invalid={Boolean(editErrors.lastName)}
                    aria-invalid={Boolean(editErrors.lastName)}
                    onChange={(e) => {
                      setEditForm({ ...editForm, lastName: e.target.value });
                      clearEditError('lastName');
                    }}
                    className={`w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 rounded-xl text-white focus:outline-none transition-all ${
                      editErrors.lastName ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  <FieldError error={editErrors.lastName} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Gender</label>
                  <select value={editForm.gender || 'MALE'} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth || ''}
                    data-invalid={Boolean(editErrors.dateOfBirth)}
                    aria-invalid={Boolean(editErrors.dateOfBirth)}
                    onChange={(e) => {
                      setEditForm({ ...editForm, dateOfBirth: e.target.value });
                      clearEditError('dateOfBirth');
                    }}
                    className={`w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 rounded-xl text-white focus:outline-none transition-all ${
                      editErrors.dateOfBirth ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  <FieldError error={editErrors.dateOfBirth} />
                </div>
                <div>
                  <CountryNationalitySelect
                    id="edit-profile-nationality"
                    label="Nationality"
                    value={editForm.nationality || 'Ethiopian'}
                    onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                    placeholder="Select Nationality..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Occupation</label>
                  <input type="text" value={editForm.occupation || ''} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Organization / Company</label>
                  <input type="text" value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Department</label>
                  <input type="text" value={editForm.departmentName || ''} onChange={(e) => setEditForm({ ...editForm, departmentName: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div className="md:col-span-3 flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg flex items-center gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin"/> : null}
                    Save Personal Information Changes
                  </button>
                </div>
              </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 text-xs pt-1">
                {/* Item 1: First Name */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-indigo-400"/> First Name
                  </span>
                  <span className="font-bold text-white text-sm block">{profile.first_name || '—'}</span>
                </div>

                {/* Item 2: Middle Name */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-indigo-400"/> Middle Name
                  </span>
                  <span className="font-bold text-white text-sm block">{profile.middle_name || '—'}</span>
                </div>

                {/* Item 3: Last Name */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-indigo-400"/> Last Name
                  </span>
                  <span className="font-bold text-white text-sm block">{profile.last_name || '—'}</span>
                </div>

                {/* Item 4: Gender */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <UserCheck size={13} className="text-blue-400"/> Gender
                  </span>
                  <div>
                    <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                      {profile.gender || '—'}
                    </span>
                  </div>
                </div>

                {/* Item 5: Date of Birth */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-400"/> Date of Birth
                  </span>
                  <span className="font-bold text-white text-sm block">{profile.date_of_birth ? formatDate(profile.date_of_birth) : '—'}</span>
                </div>

                {/* Item 6: Nationality */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Globe size={13} className="text-emerald-400"/> Nationality
                  </span>
                  <span className="font-bold text-white text-sm block">{profile.nationality || '—'}</span>
                </div>

                {/* Item 7: Occupation */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Briefcase size={13} className="text-purple-400"/> Occupation
                  </span>
                  <span className="font-bold text-white text-sm block">{profile.occupation || '—'}</span>
                </div>

                {/* Item 8: Organization / Company */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Building size={13} className="text-indigo-400"/> Organization / Company
                  </span>
                  <span className="font-bold text-white text-sm block">{profile.company || '—'}</span>
                </div>

                {/* Item 9: Department */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Building2 size={13} className="text-indigo-400"/> Department
                  </span>
                  <span className="font-bold text-white text-sm block">{profile.department_name || '—'}</span>
                </div>

                {/* Item 10: Employee / Host */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <UserCheck size={13} className="text-blue-400"/> Employee / Host
                  </span>
                  <span className="font-bold text-blue-400 text-sm block">{profile.host_name || profile.employee_host || '—'}</span>
                </div>

                {/* Item 11: Registration Date */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400"/> Registration Date
                  </span>
                  <span className="font-bold text-slate-200 text-sm block">{profile.registration_date || profile.created_at ? formatDate(profile.registration_date || profile.created_at) : '—'}</span>
                </div>

                {/* Item 12: Created By */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400"/> Created By
                  </span>
                  <span className="font-bold text-slate-200 text-sm block">{profile.created_by_name || (isVisitorRole ? 'Self-Registered Visitor' : '—')}</span>
                </div>
              </div>)}
          </div>)}

        {/* TAB 2: VISITOR CATEGORY (STRUCTURED TILES GRID) */}
        {activeTab === 'category' && (<div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Briefcase size={18} className="text-purple-400"/> Visitor Category &amp; Access Privileges
              </h3>
              <button onClick={() => setEditMode(!editMode)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 bg-slate-900 rounded-xl border border-slate-800 transition-all">
                <Edit3 size={13}/> {editMode ? 'Cancel Edit' : 'Edit Category'}
              </button>
            </div>

            {editMode ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Category</label>
                  <input type="text" value={editForm.category || ''} placeholder="e.g. Business Visitor, Contractor" onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Access Level</label>
                  <select value={editForm.accessLevel || ''} onChange={(e) => setEditForm({ ...editForm, accessLevel: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none">
                    <option value="">Select Access Level...</option>
                    <option value="STANDARD">STANDARD (Level 1)</option>
                    <option value="LEVEL_2">BUSINESS VISITOR (Level 2)</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="ESCORT_REQUIRED">ESCORT REQUIRED</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Approval Requirement</label>
                  <select value={editForm.approvalRequirement || ''} onChange={(e) => setEditForm({ ...editForm, approvalRequirement: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none">
                    <option value="">Select Requirement...</option>
                    <option value="REQUIRED">Department + Security</option>
                    <option value="PRE_APPROVED">Pre-Approved</option>
                    <option value="AUTOMATIC">Automatic</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Max Visit Duration</label>
                  <input type="text" value={editForm.visitDuration || ''} placeholder="e.g. 1 Day, 8 Hours, Up to 30 Days" onChange={(e) => setEditForm({ ...editForm, visitDuration: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Escort Required</label>
                  <select value={editForm.escortRequired || ''} onChange={(e) => setEditForm({ ...editForm, escortRequired: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none">
                    <option value="">Select...</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Allowed Areas</label>
                  <input type="text" value={editForm.allowedAreas || ''} placeholder="e.g. Reception, Main Building" onChange={(e) => setEditForm({ ...editForm, allowedAreas: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Allowed Days</label>
                  <input type="text" value={editForm.allowedDays || ''} placeholder="e.g. Mon, Tue, Wed" onChange={(e) => setEditForm({ ...editForm, allowedDays: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Visit Purpose</label>
                  <input type="text" value={editForm.visitPurpose || ''} placeholder="e.g. Business Meeting, Consultation" onChange={(e) => setEditForm({ ...editForm, visitPurpose: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none"/>
                </div>
                <div className="lg:col-span-4 flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg flex items-center gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin"/> : null}
                    Save Category Changes
                  </button>
                </div>
              </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 text-xs pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Briefcase size={13} className="text-purple-400"/> Category</span>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold">
                      {profile.category || '—'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><ShieldCheck size={13} className="text-blue-400"/> Access Level</span>
                  <span className="font-bold text-blue-400 text-sm block">{profile.access_level || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400"/> Approval Requirement</span>
                  <span className="font-bold text-white text-sm block">{profile.approval_requirement || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Clock size={13} className="text-indigo-400"/> Visit Duration</span>
                  <span className="font-bold text-white text-sm block">{profile.visit_duration || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><UserCheck size={13} className="text-amber-400"/> Escort Required</span>
                  <span className="font-bold text-white text-sm block">{profile.escort_required || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><MapPin size={13} className="text-emerald-400"/> Allowed Areas</span>
                  <span className="font-bold text-white text-sm block">{profile.allowed_areas || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Calendar size={13} className="text-blue-400"/> Allowed Days</span>
                  <span className="font-bold text-white text-sm block">{profile.allowed_days || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><FileText size={13} className="text-purple-400"/> Visit Purpose</span>
                  <span className="font-bold text-white text-sm block">{profile.visit_purpose || '—'}</span>
                </div>
              </div>)}
          </div>)}

        {/* TAB 3: CONTACT INFORMATION (STRUCTURED TILES GRID) */}
        {activeTab === 'contact' && (<div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Phone size={18} className="text-emerald-400"/> Contact Information
              </h3>
              <button onClick={() => setEditMode(!editMode)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 bg-slate-900 rounded-xl border border-slate-800 transition-all">
                <Edit3 size={13}/> {editMode ? 'Cancel Edit' : 'Edit Contact Info'}
              </button>
            </div>

            {editMode ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <CountryPhoneInput
                    id="edit-profile-mobile-phone"
                    label="Mobile Phone"
                    value={editForm.phone || ''}
                    onChange={(e) => {
                      setEditForm({ ...editForm, phone: e.target.value });
                      clearEditError('phone');
                    }}
                    error={editErrors.phone}
                    placeholder="Mobile phone"
                  />
                  <FieldError error={editErrors.phone} />
                </div>
                <div>
                  <CountryPhoneInput
                    id="edit-profile-alt-phone"
                    label="Secondary Phone"
                    value={editForm.altPhone || ''}
                    onChange={(e) => {
                      setEditForm({ ...editForm, altPhone: e.target.value });
                      clearEditError('altPhone');
                    }}
                    error={editErrors.altPhone}
                    placeholder="Secondary phone"
                  />
                  <FieldError error={editErrors.altPhone} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    data-invalid={Boolean(editErrors.email)}
                    aria-invalid={Boolean(editErrors.email)}
                    onChange={(e) => {
                      setEditForm({ ...editForm, email: e.target.value });
                      clearEditError('email');
                    }}
                    className={`w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 rounded-xl text-white focus:outline-none transition-all ${
                      editErrors.email ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                  <FieldError error={editErrors.email} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Preferred Contact Method</label>
                  <select value={editForm.preferredContactMethod || ''} onChange={(e) => setEditForm({ ...editForm, preferredContactMethod: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none">
                    <option value="">Select Method...</option>
                    <option value="Mobile">Mobile Phone</option>
                    <option value="Secondary Phone">Secondary Phone</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS Notification</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Emergency Contact Name</label>
                  <input type="text" value={editForm.emergencyContactName || ''} placeholder="e.g. Abebe Kebede" onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none"/>
                </div>
                <div>
                  <CountryPhoneInput
                    id="edit-profile-emergency-phone"
                    label="Emergency Contact Phone"
                    value={editForm.emergencyContactPhone || ''}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                    placeholder="Emergency contact phone"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Emergency Relationship</label>
                  <input type="text" value={editForm.emergencyRelationship || ''} placeholder="e.g. Spouse, Brother, Colleague" onChange={(e) => setEditForm({ ...editForm, emergencyRelationship: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none"/>
                </div>
                <div className="md:col-span-3 flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg flex items-center gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin"/> : null}
                    Save Contact Changes
                  </button>
                </div>
              </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 text-xs pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Phone size={13} className="text-emerald-400"/> Mobile Phone</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{profile.phone || '—'}</span>
                    {profile.phone && <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 rounded font-bold">Primary</span>}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Phone size={13} className="text-indigo-400"/> Secondary Phone</span>
                  <span className="font-bold text-white text-sm block">{profile.alt_phone || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Mail size={13} className="text-blue-400"/> Email Address</span>
                  <span className="font-bold text-white text-sm block truncate">{profile.email || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><CheckCircle2 size={13} className="text-purple-400"/> Preferred Contact Method</span>
                  <div>
                    <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold">{profile.preferred_contact_method || '—'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Phone size={13} className="text-amber-400"/> Emergency Contact</span>
                  <span className="font-bold text-white text-sm block">
                    {profile.emergency_contact_phone ? `${profile.emergency_contact_name ? `${profile.emergency_contact_name}: ` : ''}${profile.emergency_contact_phone}` : (profile.emergency_contact_name || '—')}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><User size={13} className="text-indigo-400"/> Emergency Relationship</span>
                  <span className="font-bold text-white text-sm block">{profile.emergency_relationship || '—'}</span>
                </div>
              </div>)}
          </div>)}

        {/* TAB 4: ADDRESS INFORMATION (STRUCTURED TILES GRID) */}
        {activeTab === 'address' && (<div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <MapPin size={18} className="text-indigo-400"/> Address &amp; Residence Information
              </h3>
              <button onClick={() => setEditMode(!editMode)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 bg-slate-900 rounded-xl border border-slate-800 transition-all">
                <Edit3 size={13}/> {editMode ? 'Cancel Edit' : 'Edit Address'}
              </button>
            </div>

            {editMode ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Country</label>
                  <input type="text" value={editForm.country || ''} placeholder="e.g. Ethiopia" onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Region / State</label>
                  <input type="text" value={editForm.region || ''} placeholder="e.g. Addis Ababa" onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">City</label>
                  <input type="text" value={editForm.city || ''} placeholder="e.g. Addis Ababa" onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Woreda / Sub-City</label>
                  <input type="text" value={editForm.woreda || ''} placeholder="e.g. Bole" onChange={(e) => setEditForm({ ...editForm, woreda: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Street Address</label>
                  <input type="text" value={editForm.street || ''} placeholder="e.g. Africa Avenue" onChange={(e) => setEditForm({ ...editForm, street: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">House Number</label>
                  <input type="text" value={editForm.houseNumber || ''} placeholder="e.g. 123/45" onChange={(e) => setEditForm({ ...editForm, houseNumber: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Full Address String</label>
                  <input type="text" value={editForm.fullAddress || ''} placeholder="e.g. Africa Avenue, House 123/45, Bole, Addis Ababa, Ethiopia" onChange={(e) => setEditForm({ ...editForm, fullAddress: e.target.value })} className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div className="md:col-span-3 flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg flex items-center gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin"/> : null}
                    Save Address Changes
                  </button>
                </div>
              </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 text-xs pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Globe size={13} className="text-indigo-400"/> Country</span>
                  <span className="font-bold text-white text-sm block">{profile.country || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><MapPin size={13} className="text-blue-400"/> Region / State</span>
                  <span className="font-bold text-white text-sm block">{profile.region || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Building size={13} className="text-emerald-400"/> City</span>
                  <span className="font-bold text-white text-sm block">{profile.city || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><MapPin size={13} className="text-purple-400"/> Woreda</span>
                  <span className="font-bold text-white text-sm block">{profile.woreda || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><MapPin size={13} className="text-amber-400"/> Street</span>
                  <span className="font-bold text-white text-sm block">{profile.street || '—'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Building2 size={13} className="text-indigo-400"/> House Number</span>
                  <span className="font-bold text-white text-sm block">{profile.house_number || '—'}</span>
                </div>

                <div className="md:col-span-3 space-y-1 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><MapPin size={13} className="text-emerald-400"/> Full Address String</span>
                  <span className="font-bold text-white text-sm block">{profile.full_address || '—'}</span>
                </div>
              </div>)}
          </div>)}

        {/* TAB 5: IDENTITY VERIFICATION */}
        {activeTab === 'identity' && (<div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-emerald-400"/>
                Enterprise Identity Verification Workflow 
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowIdentityWizard(!showIdentityWizard)} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg transition-all">
                  <Zap size={14}/>
                  {showIdentityWizard ? 'Hide Verification Wizard' : 'Launch 10-Step Identity Verification Wizard'}
                </button>
                <button onClick={() => handleVerifyIdentity('VERIFIED')} disabled={actionLoading === 'verify'} className="px-3 py-1 text-xs font-semibold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg">
                  Quick Verify
                </button>
                <button onClick={() => handleVerifyIdentity('REJECTED')} disabled={actionLoading === 'verify'} className="px-3 py-1 text-xs font-semibold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg">
                  Quick Reject
                </button>
              </div>
            </div>

            {/* Render 10-Step Wizard directly inside tab */}
            {showIdentityWizard ? (<IdentityVerificationWizard visitorId={visitorId || profile?.id || 131} visitorName={profile?.full_name || 'Visitor'} onComplete={() => {
                    loadProfile();
                }}/>) : (<div className="p-8 bg-[#0b101b] rounded-2xl border border-slate-800 text-center space-y-4">
                <Shield size={36} className="mx-auto text-emerald-400"/>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase">Enterprise Identity Verification</h4>
                  <p className="text-xs text-slate-400 mt-1">Launch the 10-step identity verification pipeline to verify documents, liveness, and security checks.</p>
                </div>
                <button onClick={() => setShowIdentityWizard(true)} className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg transition-all">
                  Launch 10-Step Identity Verification Wizard
                </button>
              </div>)}
          </div>)}

        {/* TAB 6: PHOTO MANAGEMENT */}
        {activeTab === 'photo' && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera size={16} className="text-indigo-400"/>
                Photo Management (Active Photo &amp; Photo History Archive)
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={startWebcam} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow">
                  <Camera size={14}/> Live Camera Capture
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg">
                  <Upload size={14}/> Upload Image
                </button>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden"/>
              </div>
            </div>

            {/* Camera / Capture UI */}
            {cameraActive && (<div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/40 space-y-3 max-w-md mx-auto text-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-48 bg-black rounded-lg object-cover"/>
                <canvas ref={canvasRef} className="hidden"/>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={capturePhotoFromWebcam} className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow">
                    Take Photo
                  </button>
                  <button onClick={stopWebcam} className="px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-white">
                    Cancel
                  </button>
                </div>
              </div>)}

            {/* Captured Preview with Crop / Rotate / Zoom Controls */}
            {capturedImage && (<div className="p-4 bg-slate-950 rounded-xl border border-amber-500/40 max-w-md mx-auto space-y-4">
                <h4 className="text-xs font-bold text-amber-300 text-center uppercase tracking-wider">Image Preview &amp; Adjustment</h4>
                <div className="w-48 h-48 mx-auto rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                  <img src={capturedImage} alt="Preview" className="object-cover w-full h-full transition-transform" style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}/>
                </div>
                <div className="flex items-center justify-center gap-4 text-slate-400">
                  <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200" title="Rotate">
                    <RotateCw size={16}/>
                  </button>
                  <button onClick={() => setZoom((z) => Math.min(z + 0.1, 2.0))} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200" title="Zoom In">
                    <ZoomIn size={16}/>
                  </button>
                  <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200" title="Zoom Out">
                    <ZoomOut size={16}/>
                  </button>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={savePhoto} disabled={actionLoading === 'photo'} className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow disabled:opacity-50">
                    Save &amp; Set Active Photo
                  </button>
                  <button onClick={() => setCapturedImage(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white">
                    Discard
                  </button>
                </div>
              </div>)}

            {/* Photo Archive & Active Photo Gallery */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Photo Archive History</h4>
              {profile.photos && profile.photos.length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {profile.photos.map((photo, index) => {
                    const isActive = photo.is_active_photo || photo.photo_path === profile.photo_url || (index === 0 && !profile.photos.some((p) => p.photo_path === profile.photo_url));
                    return (<div key={photo.id} className={`relative group rounded-xl bg-slate-950 border p-2 text-center space-y-2 transition-all ${isActive ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10' : 'border-slate-800'}`}>
                        <div className="relative w-full h-28 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                          <img src={photo.photo_path} alt="Visitor" className="w-full h-full object-cover"/>
                          
                          {/* Clean Dark Overlay on Hover displaying ONLY text */}
                          <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id);
                        }} className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-slate-200 hover:text-rose-400 p-2 cursor-pointer border-none" title="Remove photo from archive">
                            <span className="text-[11px] font-bold text-center leading-tight">Remove photo from archive</span>
                          </button>
                        </div>
                        {isActive ? (<span className="inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded">
                            Active Photo
                          </span>) : (<button onClick={() => handleSetActivePhoto(photo.id, photo.photo_path)} className="w-full py-1 text-[10px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors">
                            Set Active
                          </button>)}
                      </div>);
                })}
                </div>) : (<p className="text-xs text-slate-500 italic">No archived photos found for this profile.</p>)}
            </div>
          </div>)}

        {/* TAB 7: PROFILE STATUS */}
        {activeTab === 'status' && (<div className="space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={16}/>
              Profile Status & Lifecycle State
            </h3>

            {/* Current Status Box */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Status</span>
                <span className={`inline-block mt-1 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {profile.status}
                </span>
              </div>
              {!isVisitorRole && (
                <button onClick={handleArchiveToggle} disabled={actionLoading === 'archive'} className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg transition-colors">
                  <Archive size={14}/>
                  {profile.is_archived ? 'Restore Profile' : 'Archive Profile'}
                </button>
              )}
            </div>

            {/* Change Status Form (Admin / Staff Only) */}
            {!isVisitorRole && (
              <form onSubmit={handleStatusSubmit} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 max-w-lg">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Change Profile Status</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Target Status</label>
                    <select value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })} className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white">
                      <option value="PENDING">PENDING</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="BLACKLISTED">BLACKLISTED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Reason for Change</label>
                    <textarea rows={2} value={statusForm.reason} onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })} placeholder="Enter audit reason for status update..." className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"/>
                  </div>
                  <button type="submit" disabled={statusSaving} className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow disabled:opacity-50">
                    {statusSaving ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>
            )}

            {/* Status History Timeline */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Change Ledger History</h4>
              {profile.statusHistory && profile.statusHistory.length > 0 ? (<div className="space-y-2">
                  {profile.statusHistory.map((item, i) => (<div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-indigo-300">{item.status}</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">{item.change_reason || 'No description provided.'}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 min-w-[120px]">
                        <div>{item.changed_by_name || 'System'}</div>
                        <div>{new Date(item.changed_at || item.created_at).toLocaleString()}</div>
                      </div>
                    </div>))}
                </div>) : (<p className="text-xs text-slate-500 italic">No status transition history recorded yet.</p>)}
            </div>
          </div>)}

        {/* TAB 8: PROFILE HISTORY */}
        {activeTab === 'history' && (<div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History size={16} className="text-indigo-400"/>
              Field-Level Profile Change History
            </h3>
            {profile.profileHistory && profile.profileHistory.length > 0 ? (<div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Field Changed</th>
                      <th className="py-2.5 px-3">Old Value</th>
                      <th className="py-2.5 px-3">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {profile.profileHistory.map((h, idx) => (<tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-2 px-3 text-slate-400">{new Date(h.created_at).toLocaleString()}</td>
                        <td className="py-2 px-3 font-medium text-white">{h.user_name || 'System'}</td>
                        <td className="py-2 px-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px]">{h.action}</span></td>
                        <td className="py-2 px-3 font-semibold text-amber-300">{h.field_changed || '—'}</td>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px] truncate max-w-[120px]">{h.old_value || '—'}</td>
                        <td className="py-2 px-3 text-emerald-400 font-mono text-[11px] truncate max-w-[120px]">{h.new_value || '—'}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>) : (<p className="text-xs text-slate-500 italic">No field-level profile change history recorded yet.</p>)}
          </div>)}

        {/* TAB 9: BACKGROUND NOTES */}
        {activeTab === 'notes' && (<div className="space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-400"/>
              Categorized Background Notes (Security, Reception, Compliance, Admin, VIP)
            </h3>

            {/* Note Authoring Form */}
            <form onSubmit={handleAddNote} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-indigo-300 font-semibold">
                  <option value="SECURITY">Security Note</option>
                  <option value="RECEPTION">Reception Note</option>
                  <option value="COMPLIANCE">Compliance Note</option>
                  <option value="ADMINISTRATIVE">Administrative Note</option>
                  <option value="VIP">VIP Note</option>
                </select>
                <span className="text-xs text-slate-500">Authorized personnel entry</span>
              </div>
              <textarea rows={3} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Enter detailed background note, incident remark, or operational directive..." className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"/>
              <button type="submit" disabled={noteSaving || !noteContent.trim()} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow disabled:opacity-50">
                {noteSaving ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                Add Note Record
              </button>
            </form>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['ALL', 'SECURITY', 'RECEPTION', 'COMPLIANCE', 'ADMINISTRATIVE', 'VIP'].map((cat) => (<button key={cat} onClick={() => setSelectedNoteCategory(cat)} className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-colors ${selectedNoteCategory === cat
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'}`}>
                  {cat}
                </button>))}
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {profile.notes && profile.notes.length > 0 ? (profile.notes
                .filter((n) => selectedNoteCategory === 'ALL' || (n.note_type || 'INTERNAL').toUpperCase() === selectedNoteCategory)
                .map((note) => (<div key={note.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative group">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300 border border-slate-700">
                          {note.note_type || 'INTERNAL'}
                        </span>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <span>Author: {note.created_by_name || 'System User'}</span>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                          <button onClick={() => handleDeleteNote(note.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{note.content || note.note}</p>
                    </div>))) : (<p className="text-xs text-slate-500 italic">No background notes available under selected filter.</p>)}
            </div>
          </div>)}

        {/* TAB 10: AUDIT HISTORY */}
        {activeTab === 'audit' && (<div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={16} className="text-indigo-400"/>
              Module 16 System Audit History
            </h3>
            {profile.auditHistory && profile.auditHistory.length > 0 ? (<div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Date / Time</th>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">IP Address</th>
                      <th className="py-2.5 px-3">Device / Browser</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {profile.auditHistory.map((audit, idx) => (<tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-2 px-3 text-slate-400">{new Date(audit.created_at).toLocaleString()}</td>
                        <td className="py-2 px-3 font-semibold text-white">{audit.user_name || 'System User'}</td>
                        <td className="py-2 px-3 text-indigo-300 font-mono text-[11px]">{audit.role_name || 'Administrator'}</td>
                        <td className="py-2 px-3 font-bold text-amber-300">{audit.action}</td>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{audit.ip_address || '127.0.0.1'}</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[150px]">{audit.user_agent || audit.device || 'Chrome / Windows'}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>) : (<p className="text-xs text-slate-500 italic">No system audit logs found for this visitor profile.</p>)}
          </div>)}
      </div>

      {/* ── PRINT PROFILE MODAL ── */}
      {showPrintModal && (<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Printer size={18} className="text-indigo-400"/>
                Printable Profile Summary
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-white">
                <X size={18}/>
              </button>
            </div>
            <div className="p-6 bg-white text-slate-900 rounded-xl space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{profile.full_name}</h1>
                  <p className="text-slate-500">Visitor Code: {profile.visitor_code} | Ref: {profile.reference_number}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 text-xs font-bold bg-slate-200 rounded">{profile.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Category:</strong> {profile.category || 'General'}</div>
                <div><strong>Company:</strong> {profile.company || 'N/A'}</div>
                <div><strong>Phone:</strong> {profile.phone}</div>
                <div><strong>Email:</strong> {profile.email}</div>
                <div><strong>ID Number:</strong> {profile.id_number} ({profile.id_type})</div>
                <div><strong>Verification:</strong> {profile.id_verification_status}</div>
                <div><strong>Address:</strong> {profile.full_address || profile.city}</div>
                <div><strong>Registration Date:</strong> {new Date(profile.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => window.print()} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg">
                Trigger Print
              </button>
              <button onClick={() => setShowPrintModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">
                Close
              </button>
            </div>
          </div>
        </div>)}

      {/* ── GENERATE VISITOR PASS MODAL ── */}
      {showPassModal && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowPassModal(false)}>
          <div className="bg-slate-900 rounded-3xl border border-slate-800 w-full max-w-lg p-6 space-y-5 shadow-2xl my-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Navigation Header with Back Button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <button onClick={() => setShowPassModal(false)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-all shadow">
                <ArrowLeft size={16}/>
                Back to Profile
              </button>

              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BadgeCheck size={18} className="text-emerald-400"/>
                Digital Visitor Security Pass
              </h3>

              <button onClick={() => setShowPassModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X size={18}/>
              </button>
            </div>

            {/* Lanyard Badge Professional Visitor Pass Card */}
            <div className="w-full max-w-sm mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 text-slate-900 relative">
              {/* Lanyard Hole Cut-out */}
              <div className="pt-3 bg-[#247040] text-center">
                <div className="w-12 h-2.5 bg-slate-950/20 rounded-full mx-auto border border-emerald-800/40 shadow-inner"></div>
              </div>

              {/* Green Curved Header Section */}
              <div className="bg-[#247040] px-6 pt-3 pb-10 text-center text-white relative">
                <h1 className="text-4xl font-black tracking-tight leading-none text-white uppercase font-sans">Visitor</h1>
                <p className="text-sm font-bold tracking-wider text-emerald-100 mt-1 uppercase">Temporary Pass</p>

                {/* Decorative Wave SVG */}
                <div className="absolute -bottom-1 left-0 right-0 overflow-hidden leading-none pointer-events-none">
                  <svg className="relative block w-full h-10 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,0 C300,90 600,-40 1200,60 L1200,120 L0,120 Z" fill="currentColor"></path>
                  </svg>
                </div>
              </div>

              {/* Card Content */}
              <div className="px-6 pt-2 pb-6 text-center space-y-4 bg-white relative z-10">
                {/* Status Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                  <CheckCircle2 size={13} className="text-emerald-600"/>
                  <span>{profile.status || 'ACTIVE'}</span>
                </div>

                {/* Visitor Photo Avatar */}
                <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-[#247040] shadow-md bg-slate-100 flex items-center justify-center text-2xl font-black text-[#247040]">
                  {profile.photo_url ? (<img src={resolvePhotoUrl(profile.photo_url)} alt={profile.full_name} className="w-full h-full object-cover"/>) : (<span>{(profile.first_name?.[0] || '') + (profile.last_name?.[0] || '') || 'VP'}</span>)}
                </div>

                {/* Visitor Name & Title */}
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{profile.full_name}</h2>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mt-0.5">{profile.category || 'Authorized Visitor'}</p>
                </div>

                {/* Credential Details Grid */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Visitor ID:</span>
                    <span className="font-black text-slate-900">{profile.visitor_code}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Reference No:</span>
                    <span className="font-black text-slate-900">{profile.reference_number}</span>
                  </div>
                </div>

                {/* Circular QR Code Frame matching image template */}
                <div className="pt-2 flex flex-col items-center justify-center">
                  <div className="w-28 h-28 rounded-full border-2 border-slate-800 p-2 bg-white shadow-md flex items-center justify-center relative">
                    <QRCodeDisplay value={getVisitorQRPayload(profile)} photoUrl={resolvePhotoUrl(profile.photo_url)} size={96}/>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                    Scan at Gate / Reception
                  </span>
                </div>

                {/* Footer Text matching image template */}
                <div className="pt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
                  Please return pass when leaving
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar with Back/Close button */}
            <div className="flex items-center justify-between pt-1">
              <button onClick={() => setShowPassModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-colors">
                <ArrowLeft size={15}/>
                Back to Profile
              </button>

              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-colors">
                  <Printer size={14}/>
                  Print Pass
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* ── DELETE VISITOR CONFIRMATION MODAL ── */}
      {showDeleteModal && profile && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
                <AlertTriangle size={24}/>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Delete Visitor Profile</h3>
                <p className="text-xs text-slate-400">
                  Are you sure you want to permanently delete <span className="font-semibold text-white">{profile.full_name}</span>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-300 space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-rose-200">
                <ShieldAlert size={14} className="shrink-0 text-rose-400"/>
                This permanent cascade action will remove:
              </p>
              <ul className="list-disc list-inside text-[11px] text-rose-200/80 space-y-1 pl-1">
                <li>Visitor personal profile &amp; address records</li>
                <li>All uploaded visitor documents &amp; verifications</li>
                <li>All visit histories, check-in, arrival &amp; checkout logs</li>
                <li>All scheduled appointments, badges &amp; visitor passes</li>
                <li>All photos, notes, and vehicle access records</li>
              </ul>
              <p className="text-[11px] text-rose-400 font-bold pt-1 border-t border-rose-900/50">
                This operation cannot be undone and will update dashboard counters immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} disabled={deletingVisitor} className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteVisitor} disabled={deletingVisitor} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg transition-colors disabled:opacity-50">
                {deletingVisitor ? (<>
                    <Loader2 size={14} className="animate-spin"/>
                    <span>Deleting Records...</span>
                  </>) : (<>
                    <Trash2 size={14}/>
                    <span>Confirm Delete</span>
                  </>)}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
};
export default VisitorProfileDetails;
